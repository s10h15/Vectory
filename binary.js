const TYPE = {
	INT8: 0,
	INT16: 1,
	INT32: 2,
	INT64: 3,
	FLOAT64: 4,
	STRING: 5,
	BOOLEAN: 6,
	DATE: 7,
	NULL: 8,
	UNDEFINED: 9,
	ARRAY: 10,
	OBJECT: 11
};

function calculateEncodedSize(value) {
	if (value === null || value === undefined) return 1;

	switch (typeof value) {
		case "number":
			if (Number.isInteger(value)) {
				if (value >= -128 && value <= 127) return 2;
				if (value >= -32768 && value <= 32767) return 3;
				if (value >= -2147483648 && value <= 2147483647) return 5;
				return 9;
			}
			return 9;
		case "string":
			return 5 + new TextEncoder().encode(value).length;
		case "boolean":
			return 2;
		case "object":
			if (value instanceof Date) return 9;
			if (Array.isArray(value)) {
				return 5 + value.reduce((sum, item) => sum + calculateEncodedSize(item), 0);
			}
			return calculateEncodedSize(JSON.stringify(value)) + 1;
		default:
			throw new Error("Unsupported data type");
	}
}

function encodeValueDirect(value, view, offset) {
	if (value === null) {
		view.setUint8(offset, TYPE.NULL);
		return offset + 1;
	} else if (value === undefined) {
		view.setUint8(offset, TYPE.UNDEFINED);
		return offset + 1;
	}

	switch (typeof value) {
		case "number": {
			if (Number.isInteger(value)) {
				if (value >= -128 && value <= 127) {
					view.setUint8(offset, TYPE.INT8);
					view.setInt8(offset + 1, value);
					return offset + 2;
				} else if (value >= -32768 && value <= 32767) {
					view.setUint8(offset, TYPE.INT16);
					view.setInt16(offset + 1, value, true);
					return offset + 3;
				} else if (value >= -2147483648 && value <= 2147483647) {
					view.setUint8(offset, TYPE.INT32);
					view.setInt32(offset + 1, value, true);
					return offset + 5;
				} else {
					view.setUint8(offset, TYPE.INT64);
					view.setBigInt64(offset + 1, BigInt(value), true);
					return offset + 9;
				}
			} else {
				view.setUint8(offset, TYPE.FLOAT64);
				view.setFloat64(offset + 1, value, true);
				return offset + 9;
			}
		}
		case "string": {
			const encodedValue = new TextEncoder().encode(value);
			view.setUint8(offset, TYPE.STRING);
			view.setUint32(offset + 1, encodedValue.length, true);
			new Uint8Array(view.buffer, view.byteOffset + offset + 5).set(encodedValue);
			return offset + 5 + encodedValue.length;
		}
		case "boolean": {
			view.setUint8(offset, TYPE.BOOLEAN);
			view.setUint8(offset + 1, value ? 1 : 0);
			return offset + 2;
		}
		case "object": {
			if (value instanceof Date) {
				view.setUint8(offset, TYPE.DATE);
				view.setBigInt64(offset + 1, BigInt(value.getTime()), true);
				return offset + 9;
			} else if (Array.isArray(value)) {
				view.setUint8(offset, TYPE.ARRAY);
				view.setUint32(offset + 1, value.length, true);
				let newOffset = offset + 5;
				for (const item of value) {
					newOffset = encodeValueDirect(item, view, newOffset);
				}
				return newOffset;
			} else {
				view.setUint8(offset, TYPE.OBJECT);
				return encodeValueDirect(JSON.stringify(value), view, offset + 1);
			}
		}
		default: {
			throw new Error("Unsupported data type");
		}
	}
}

export function encodeValue(value) {
	const size = calculateEncodedSize(value);
	const buffer = new ArrayBuffer(size);
	const view = new DataView(buffer);
	encodeValueDirect(value, view, 0);
	return buffer;
}

export function decodeValue(buffer, offset = 0) {
	const view = new DataView(buffer);
	const type = view.getUint8(offset);
	offset += 1;

	switch (type) {
		case TYPE.INT8:
			return { value: view.getInt8(offset), bytesRead: 2 };
		case TYPE.INT16:
			return { value: view.getInt16(offset, true), bytesRead: 3 };
		case TYPE.INT32:
			return { value: view.getInt32(offset, true), bytesRead: 5 };
		case TYPE.INT64:
			return { value: Number(view.getBigInt64(offset, true)), bytesRead: 9 };
		case TYPE.FLOAT64:
			return { value: view.getFloat64(offset, true), bytesRead: 9 };
		case TYPE.STRING: {
			const length = view.getUint32(offset, true);
			offset += 4;
			const decoder = new TextDecoder();
			return {
				value: decoder.decode(new Uint8Array(buffer, offset, length)),
				bytesRead: 5 + length
			};
		}
		case TYPE.BOOLEAN:
			return { value: Boolean(view.getUint8(offset)), bytesRead: 2 };
		case TYPE.DATE:
			return {
				value: new Date(Number(view.getBigInt64(offset, true))),
					bytesRead: 9
			};
		case TYPE.NULL:
			return { value: null, bytesRead: 1 };
		case TYPE.UNDEFINED:
			return { value: undefined, bytesRead: 1 };
		case TYPE.ARRAY: {
			const arrayLength = view.getUint32(offset, true);
			offset += 4;
			let array = [];
			let totalBytesRead = 5;
			for (let i = 0; i < arrayLength; ++i) {
				let { value, bytesRead } = decodeValue(buffer, offset);
				array.push(value);
				offset += bytesRead;
				totalBytesRead += bytesRead;
			}
			return { value: array, bytesRead: totalBytesRead };
		}
		case TYPE.OBJECT: {
			let { value: jsonString, bytesRead } = decodeValue(buffer, offset);
			return { value: JSON.parse(jsonString), bytesRead: bytesRead + 1 };
		}
		default:
			throw new Error("Unknown data type");
	}
}

export function readBinaryFile(buffer) {
	const values = [];
	let offset = 0;

	while (offset < buffer.byteLength) {
		const { value, bytesRead } = decodeValue(buffer, offset);
		values.push(value);
		offset += bytesRead;
	}

	return values;
}

export function createBinaryFile(...values) {
	const totalSize = values.reduce((sum, value) => sum + calculateEncodedSize(value), 0);

	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);

	let offset = 0;
	for (const value of values) {
		offset = encodeValueDirect(value, view, offset);
	}

	return buffer;
}

export function downloadBinaryFile(buffer, prefix = "") {
	prefix += "_";

	const blob = new Blob([buffer], { type: "application/octet-stream" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);

	const currentDate = new Date();
	const formattedDate = currentDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });

	const hours = String(currentDate.getHours()).padStart(2, '0');
	const minutes = String(currentDate.getMinutes()).padStart(2, '0');
	const seconds = String(currentDate.getSeconds()).padStart(2, '0');

	const formattedTime = `${hours}:${minutes}:${seconds}`;
	const formattedDateTime = `${formattedDate}_${formattedTime}`;

	link.download = `${prefix}${formattedDateTime}.bin`;

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}

export function readFileAsArrayBuffer(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = e => resolve(e.target.result);
		reader.onerror = e => reject(e.target.error);
		reader.readAsArrayBuffer(file);
	});
}

export function getBinaryFileBuffer(path, callback) {
	const xhr = new XMLHttpRequest();
	xhr.open('GET', path, true);
	xhr.responseType = 'arraybuffer';

	xhr.onload = function() {
		if (xhr.status === 200) {
			callback(xhr.response);
		} else {
			callback(null);
		}
	};

	xhr.onerror = function() {
		callback(null);
	};

	xhr.send();
}

export function selectBinaryFile(callback) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".bin";

	input.onchange = function(event) {
		const file = event.target.files[0];
		if (file) {
			if (file.name.endsWith('.bin')) {
				const reader = new FileReader();
				reader.onload = function(e) {
					callback(e.target.result);
				};
				reader.onerror = function() {
					callback(null);
				};
				reader.readAsArrayBuffer(file);
			} else {
				callback(null);
			}
		} else {
			callback(null);
		}
	};

	input.click();
}