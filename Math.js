function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c2, k1, i;

	remainder = key.length & 3;
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
		k1 =
			((key.charCodeAt(i) & 0xff)) |
			((key.charCodeAt(++i) & 0xff) << 8) |
			((key.charCodeAt(++i) & 0xff) << 16) |
			((key.charCodeAt(++i) & 0xff) << 24);
		++i;

		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

		h1 ^= k1;
		h1 = (h1 << 13) | (h1 >>> 19);
		h1b = (((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}

	k1 = 0;

	switch (remainder) {
		case 3:
			k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2:
			k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1:
			k1 ^= (key.charCodeAt(i) & 0xff);

			k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
			h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}

export function getSeed(string) {
	return murmurhash3_32_gc(string, 0x9747b28c);
}

const floatA = 1664525;
const floatC = 1013904223;
const floatM = 4294967296;
let floatSeed = 1;

function floatLcg() {
	floatSeed = (floatA * floatSeed + floatC) % floatM;
	return floatSeed / floatM;
}

export function getRandomFloat(min, max) {
	const randomValue = floatLcg();
	return min + randomValue * (max - min);
}

const intA = 1103515245;
const intC = 12345;
const intM = 2147483648;
let intSeed = 1;

function intLcg() {
	intSeed = (intA * intSeed + intC) % intM;
	return intSeed / intM;
}

export function getRandomInt(min, max) {
	const randomValue = intLcg();
	return Math.floor(min + randomValue * (max - min + 1));
}

export function setRandomizerSeed(seed) {
	const hash = getSeed(seed);
	floatSeed = hash / floatM;
	intSeed = hash / intM;
}

export function isChance(rate) {
	return getRandomFloat(0, 1) <= rate;
}

export function getRandomElement(array) {
	return array[getRandomInt(0, array.length - 1)];
}

export function getMinDelay(fps) {
	return 1000 / fps;
}

export function getClamped(value, min, max) {
	if (value < min) {
		return min;
	} else if (value > max) {
		return max;
	}
	return value;
}

export function getDistance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function getMaxValueIndex(array, isMax = true) {
	if (array.length == 0) {
		return { value: null, index: null };
	}

	let value = array[0];
	let index = 0;

	for (let i = 1; i < array.length; ++i) {
		if (isMax ? array[i] > value : array[i] < value) {
			value = array[i];
			index = i;
		}
	}

	return { value, index };
}

export function getNormalizedDirection(speedX, speedY) {
	const magnitude = Math.sqrt(speedX * speedX + speedY * speedY);
	if (magnitude == 0) {
		return { x: 0, y: 0 };
	}
	return { x: speedX / magnitude, y: speedY / magnitude };
}

export function getRandomColor(min, max) {
	return "rgb(" + getRandomInt(min, max) + "," + getRandomInt(min, max) + "," + getRandomInt(min, max) + ")";
}

export function getOscillated(t, N, phaseShift = 0) {
	return (1 + Math.sin(2 * Math.PI * N * t + phaseShift)) * 0.5;
}

export function getManhattanDistance(x1, y1, x2, y2) {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function getPath(grid, startX, startY, goalX, goalY, isCellWalkableFn) {
	function create2DArray(rows, cols, defaultValue = Infinity) {
		let array = new Array(rows);
		for (let i = 0; i < rows; ++i) {
			array[i] = new Array(cols).fill(defaultValue);
		}
		return array;
	}

	function heuristic(a, b) {
		return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
	}

	let openSet = [[startX, startY]];
	let cameFrom = {};
	let gScore = create2DArray(grid.length, grid[0].length);
	let fScore = create2DArray(grid.length, grid[0].length);
	gScore[startY][startX] = 0;
	fScore[startY][startX] = heuristic([startX, startY], [goalX, goalY]);

	while (openSet.length > 0) {
		let current = openSet.reduce((a, b) => (fScore[a[1]][a[0]] < fScore[b[1]][b[0]] ? a : b));
		if (current[0] == goalX && current[1] == goalY) {
			let path = [];
			while (current) {
				path.push(current);
				current = cameFrom[`${current[0]},${current[1]}`];
			}
			return [path.reverse(), true];
		}
		openSet = openSet.filter(node => node[0] != current[0] || node[1] != current[1]);
		let [x, y] = current;
		let neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
			.filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length && isCellWalkableFn(grid[ny][nx]));
		for (let [nx, ny] of neighbors) {
			let tentative_gScore = gScore[y][x] + 1;
			if (tentative_gScore < gScore[ny][nx]) {
				cameFrom[`${nx},${ny}`] = current;
				gScore[ny][nx] = tentative_gScore;
				fScore[ny][nx] = gScore[ny][nx] + heuristic([nx, ny], [goalX, goalY]);
				if (!openSet.some(node => node[0] == nx && node[1] == ny)) {
					openSet.push([nx, ny]);
				}
			}
		}
	}

	let bestNode = null;
	let bestY = -1;
	for (let key in cameFrom) {
		let [x, y] = key.split(",").map(Number);
		if (y > bestY || (y == bestY && fScore[y][x] < fScore[bestNode[1]][bestNode[0]])) {
			bestNode = [x, y];
			bestY = y;
		}
	}
	if (bestNode === null) return [[], false];
	let path = [];
	while (bestNode) {
		path.push(bestNode);
		bestNode = cameFrom[`${bestNode[0]},${bestNode[1]}`];
	}
	return [path.reverse(), false];
}

export function getLocalPath(grid, startX, startY, goalX, goalY, isCellWalkableFn, visibilityRadius) {
	function create2DArray(rows, cols, defaultValue = Infinity) {
		let array = new Array(rows);
		for (let i = 0; i < rows; ++i) {
			array[i] = new Array(cols).fill(defaultValue);
		}
		return array;
	}

	function isWithinVisibilityRadius(x, y, visibilityRadius, startX, startY) {
		const dx = Math.abs(x - startX);
		const dy = Math.abs(y - startY);
		return Math.max(dx, dy) <= visibilityRadius;
	}

	function heuristic(a, b) {
		return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
	}

	let openSet = [[startX, startY]];
	let cameFrom = {};
	let gScore = create2DArray(grid.length, grid[0].length);
	let fScore = create2DArray(grid.length, grid[0].length);

	gScore[startY][startX] = 0;
	fScore[startY][startX] = heuristic([startX, startY], [goalX, goalY]);

	while (openSet.length > 0) {
		let current = openSet.reduce((a, b) => (fScore[a[1]][a[0]] < fScore[b[1]][b[0]] ? a : b));

		if (current[0] == goalX && current[1] == goalY) {
			let path = [];
			while (current) {
				path.push(current);
				current = cameFrom[`${current[0]},${current[1]}`];
			}
			return [path.reverse(), true];
		}

		openSet = openSet.filter(node => node[0] != current[0] || node[1] != current[1]);

		let [x, y] = current;

		let neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
			.filter(([nx, ny]) => isWithinVisibilityRadius(nx, ny, visibilityRadius, startX, startY))
			.filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length && isCellWalkableFn(grid[ny][nx]));

		for (let [nx, ny] of neighbors) {
			let tentative_gScore = gScore[y][x] + 1;
			if (tentative_gScore < gScore[ny][nx]) {
				cameFrom[`${nx},${ny}`] = current;
				gScore[ny][nx] = tentative_gScore;
				fScore[ny][nx] = gScore[ny][nx] + heuristic([nx, ny], [goalX, goalY]);
				if (!openSet.some(node => node[0] == nx && node[1] == ny)) {
					openSet.push([nx, ny]);
				}
			}
		}
	}

	let bestNode = null;
	let bestY = -1;
	for (let key in cameFrom) {
		let [x, y] = key.split(",").map(Number);
		if (y > bestY || (y == bestY && fScore[y][x] < fScore[bestNode[1]][bestNode[0]])) {
			bestNode = [x, y];
			bestY = y;
		}
	}

	if (bestNode === null) return [[], false];

	let path = [];
	while (bestNode) {
		path.push(bestNode);
		bestNode = cameFrom[`${bestNode[0]},${bestNode[1]}`];
	}

	return [path.reverse(), false];
}

export function getWidePath(grid, startX, startY, goalX, goalY, isCellWalkableFn, minPathWidth) {
	function create2DArray(rows, cols, defaultValue = Infinity) {
		let array = new Array(rows);
		for (let i = 0; i < rows; ++i) {
			array[i] = new Array(cols).fill(defaultValue);
		}
		return array;
	}

	function heuristic(a, b) {
		return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
	}

	// Function to check if a cell is blocked based on the additional logic
	function isBlockedCell(x, y, minPathWidth) {
		const directions = [
			{ dx: 0, dy: -1 }, // up
			{ dx: 0, dy: 1 }, // down
			{ dx: -1, dy: 0 }, // left
			{ dx: 1, dy: 0 }, // right
			{ dx: -1, dy: -1 }, // up-left
			{ dx: 1, dy: -1 }, // up-right
			{ dx: -1, dy: 1 }, // down-left
			{ dx: 1, dy: 1 } // down-right
		];

		const isBlocked = directions.map(({ dx, dy }) => {
			for (let i = 1; i <= minPathWidth; ++i) {
				let nx = x + dx * i;
				let ny = y + dy * i;
				if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length || !isCellWalkableFn(grid[ny][nx])) {
					return true;
				}
			}
			return false;
		});

		const straightBlocked = (isBlocked[0] && isBlocked[1]) || // up and down
			(isBlocked[2] && isBlocked[3]); // left and right
		const diagonalBlocked = (isBlocked[4] && isBlocked[7]) || // up-left and down-right
			(isBlocked[5] && isBlocked[6]); // up-right and down-left

		const straightRays = [isBlocked[0], isBlocked[1], isBlocked[2], isBlocked[3]];
		const diagonalRays = [isBlocked[4], isBlocked[5], isBlocked[6], isBlocked[7]];
		const straightFalseCount = straightRays.filter(blocked => blocked).length;
		const diagonalFalseCount = diagonalRays.filter(blocked => blocked).length;

		const oneStraightOneDiagonal = straightFalseCount == 1 && diagonalFalseCount == 1;

		const blockedStraightIndex = straightRays.findIndex(blocked => blocked);
		const blockedDiagonalIndex = diagonalRays.findIndex(blocked => blocked);

		const blockedStraightDirection = ["up", "down", "left", "right"][blockedStraightIndex];
		const blockedDiagonalDirection = ["up-left", "up-right", "down-left", "down-right"][blockedDiagonalIndex];

		const notSameGeneralDirection = !(
			(blockedStraightDirection == "up" && (blockedDiagonalDirection == "up-left" || blockedDiagonalDirection == "up-right")) ||
			(blockedStraightDirection == "down" && (blockedDiagonalDirection == "down-left" || blockedDiagonalDirection == "down-right")) ||
			(blockedStraightDirection == "left" && (blockedDiagonalDirection == "up-left" || blockedDiagonalDirection == "down-left")) ||
			(blockedStraightDirection == "right" && (blockedDiagonalDirection == "up-right" || blockedDiagonalDirection == "down-right"))
		);

		return straightBlocked || diagonalBlocked || (oneStraightOneDiagonal && notSameGeneralDirection);
	}

	let openSet = [[startX, startY]];
	let cameFrom = {};
	let gScore = create2DArray(grid.length, grid[0].length);
	let fScore = create2DArray(grid.length, grid[0].length);
	gScore[startY][startX] = 0;
	fScore[startY][startX] = heuristic([startX, startY], [goalX, goalY]);

	while (openSet.length > 0) {
		let current = openSet.reduce((a, b) => (fScore[a[1]][a[0]] < fScore[b[1]][b[0]] ? a : b));
		if (current[0] == goalX && current[1] == goalY) {
			let path = [];
			while (current) {
				path.push(current);
				current = cameFrom[`${current[0]},${current[1]}`];
			}
			return [path.reverse(), true];
		}
		openSet = openSet.filter(node => node[0] != current[0] || node[1] != current[1]);
		let [x, y] = current;
		let neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
			.filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length && isCellWalkableFn(grid[ny][nx]) && !isBlockedCell(nx, ny, minPathWidth));
		for (let [nx, ny] of neighbors) {
			let tentative_gScore = gScore[y][x] + 1;
			if (tentative_gScore < gScore[ny][nx]) {
				cameFrom[`${nx},${ny}`] = current;
				gScore[ny][nx] = tentative_gScore;
				fScore[ny][nx] = gScore[ny][nx] + heuristic([nx, ny], [goalX, goalY]);
				if (!openSet.some(node => node[0] == nx && node[1] == ny)) {
					openSet.push([nx, ny]);
				}
			}
		}
	}

	let bestNode = null;
	let bestY = -1;
	for (let key in cameFrom) {
		let [x, y] = key.split(",").map(Number);
		if (y > bestY || (y == bestY && fScore[y][x] < fScore[bestNode[1]][bestNode[0]])) {
			bestNode = [x, y];
			bestY = y;
		}
	}
	if (bestNode === null) return [[], false];
	let path = [];
	while (bestNode) {
		path.push(bestNode);
		bestNode = cameFrom[`${bestNode[0]},${bestNode[1]}`];
	}
	return [path.reverse(), false];
}

export function clearAroundPos(grid, cellX, cellY, radius, clearCellFn) {
	const height = grid.length;
	const width = grid[0].length;
	const startX = getClamped(cellX - radius, 0, width - 1);
	const endX = getClamped(cellX + radius, 0, width - 1);
	const startY = getClamped(cellY - radius, 0, height - 1);
	const endY = getClamped(cellY + radius, 0, height - 1);
	for (let x = startX; x <= endX; ++x) {
		for (let y = startY; y <= endY; ++y) {
			clearCellFn(grid[y][x]);
		}
	}
}

export function makePath(grid, isWalkableCellFn, clearCellFn, minPathWidth, startX, startY, goalX, goalY) {
	const height = grid.length;
	const width = grid[0].length;
	const bottomY = height - 1;
	let pathPositions = [];
	let lowestCellHistory = [];

	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = getRandomInt(0, i + 1);
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	function isInHistory(cell, history) {
		for (let pos of history) {
			if (pos[0] == cell[0] && pos[1] == cell[1]) {
				return true;
			}
		}
		return false;
	}

	let lowestPathPos = [startX, startY];
	for (let i = 0; i < 1000; ++i) {
		var [path, isPathComplete] = getPath(grid, lowestPathPos[0], lowestPathPos[1], goalX, goalY, isWalkableCellFn);

		if (path.length > 0) {
			lowestPathPos = path[path.length - 1];

			if (!isInHistory(lowestPathPos, lowestCellHistory)) {
				lowestCellHistory.push(lowestPathPos);
				pathPositions.push(...path);
				clearAroundPos(grid, lowestPathPos[0], lowestPathPos[1], minPathWidth, clearCellFn);

				if (isPathComplete) {
					break;
				}
			} else {
				break;
			}
		} else {
			break;
		}
	}

	pathPositions.forEach(pos => {
		const x = pos[0];
		const y = pos[1];
		const directions = [
			{ dx: 0, dy: -1 }, // up
			{ dx: 0, dy: 1 }, // down
			{ dx: -1, dy: 0 }, // left
			{ dx: 1, dy: 0 }, // right
			{ dx: -1, dy: -1 }, // up-left
			{ dx: 1, dy: -1 }, // up-right
			{ dx: -1, dy: 1 }, // down-left
			{ dx: 1, dy: 1 } // down-right
		];

		const isBlocked = directions.map(({ dx, dy }) => {
			for (let i = 1; i <= minPathWidth; ++i) {
				let nx = x + dx * i;
				let ny = y + dy * i;
				if (nx < 0 || nx >= width || ny < 0 || ny >= height || !isWalkableCellFn(grid[ny][nx])) {
					return true;
				}
			}
			return false;
		});

		const straightBlocked = (isBlocked[0] && isBlocked[1]) || // up and down
			(isBlocked[2] && isBlocked[3]); // left and right
		const diagonalBlocked = (isBlocked[4] && isBlocked[7]) || // up-left and down-right
			(isBlocked[5] && isBlocked[6]); // up-right and down-left

		const straightRays = [isBlocked[0], isBlocked[1], isBlocked[2], isBlocked[3]];
		const diagonalRays = [isBlocked[4], isBlocked[5], isBlocked[6], isBlocked[7]];
		const straightFalseCount = straightRays.filter(blocked => blocked).length;
		const diagonalFalseCount = diagonalRays.filter(blocked => blocked).length;

		const oneStraightOneDiagonal = straightFalseCount == 1 && diagonalFalseCount == 1;

		const blockedStraightIndex = straightRays.findIndex(blocked => blocked);
		const blockedDiagonalIndex = diagonalRays.findIndex(blocked => blocked);

		const blockedStraightDirection = ["up", "down", "left", "right"][blockedStraightIndex];
		const blockedDiagonalDirection = ["up-left", "up-right", "down-left", "down-right"][blockedDiagonalIndex];

		const notSameGeneralDirection = !(
			(blockedStraightDirection == "up" && (blockedDiagonalDirection == "up-left" || blockedDiagonalDirection == "up-right")) ||
			(blockedStraightDirection == "down" && (blockedDiagonalDirection == "down-left" || blockedDiagonalDirection == "down-right")) ||
			(blockedStraightDirection == "left" && (blockedDiagonalDirection == "up-left" || blockedDiagonalDirection == "down-left")) ||
			(blockedStraightDirection == "right" && (blockedDiagonalDirection == "up-right" || blockedDiagonalDirection == "down-right"))
		);

		if (straightBlocked || diagonalBlocked || (oneStraightOneDiagonal && notSameGeneralDirection)) {
			clearAroundPos(grid, x, y, minPathWidth, clearCellFn);
		}
	});

	return pathPositions;
}

export function getSplittedString(text, separators, isIncludeSeparators = false) {
	const result = [];
	if (!text) {
		return result;
	}
	if (separators.length == 0) {
		return result;
	}
	let start = 0;
	let end = 0;
	while (end < text.length) {
		let foundSeparator = false;

		for (const sep of separators) {
			if (text.substring(end, end + sep.length) == sep) {
				if (start != end) {
					result.push(text.substring(start, end));
				}

				if (isIncludeSeparators) {
					result.push(text.substring(end, end + sep.length));
				}

				end += sep.length;
				start = end;

				foundSeparator = true;

				break;
			}
		}
		if (!foundSeparator) {
			++end;
		}
	}
	if (start != end) {
		result.push(text.substring(start));
	}
	return result;
}

export function getTextMetrics(buttonWidth, buttonHeight, text, rate, fontName) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	let fontSize = 0;
	let textWidth;
	let textHeight;

	do {
		context.font = fontSize + "px " + fontName;
		textWidth = context.measureText(text).width;
		const metrics = context.measureText(text);
		textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
		fontSize++;
	} while (textWidth < (buttonWidth * rate));

	fontSize--;
	context.font = fontSize + "px " + fontName;
	const textMetrics = context.measureText(text);
	textWidth = textMetrics.width;
	textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
	const textX = (buttonWidth - textWidth) * 0.5;
	const textY = (buttonHeight + textHeight) * 0.5 - textMetrics.actualBoundingBoxDescent;

	return { fontSize, textX, textY };
}

export function getCanvasElementImage(canvasElement) {
	let img = new Image();
	img.src = canvasElement.toDataURL();
	return img;
}

export function downloadImageAsPNG(img, prefix = "") {
	prefix += "_";

	let link = document.createElement("a");
	link.href = img.src;

	let currentDate = new Date();
	let formattedDate = currentDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });

	let hours = currentDate.getHours();
	let minutes = currentDate.getMinutes();
	let seconds = currentDate.getSeconds();

	let formattedTime = hours + ":" + minutes + ":" + seconds;
	let formattedDateTime = formattedDate + "_" + formattedTime;

	link.download = prefix + formattedDateTime + ".png";

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
export function downloadStringAsTXT(text, prefix = "") {
	prefix += "_";

	let link = document.createElement("a");
	let blob = new Blob([text], { type: "text/plain" });
	let url = URL.createObjectURL(blob);
	link.href = url;

	let currentDate = new Date();
	let formattedDate = currentDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });

	let hours = currentDate.getHours();
	let minutes = currentDate.getMinutes();
	let seconds = currentDate.getSeconds();

	let formattedTime = hours + ":" + minutes + ":" + seconds;
	let formattedDateTime = formattedDate + "_" + formattedTime;

	link.download = prefix + formattedDateTime + ".txt";

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function getRandomString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (var i = 0; i < length; ++i) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function isNumber(text) {
	if (text.length == 0) {
		return false;
	}

	text = text.trim();

	if (!/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(text)) {
		return false;
	}

	return !isNaN(parseFloat(text)) && isFinite(text);
}