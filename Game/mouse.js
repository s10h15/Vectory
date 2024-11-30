export class Mouse {
	constructor(canvasElement, scaleRate) {
		this.canvasElement = canvasElement;
		this.isCanvasFullscreen = false;
		this.canvasBorderLeft = 0;
		this.canvasBorderTop = 0;
		this.canvasBorderRight = 0;
		this.canvasBorderBottom = 0;
		this.posX = 0;
		this.posY = 0;
		this.prevPosX = 0;
		this.prevPosY = 0;
		this.pressStartPosX = 0;
		this.pressStartPosY = 0;
		this.actualPressStartPosX = 0;
		this.actualPressStartPosY = 0;
		this.pressEndPosX = 0;
		this.pressEndPosY = 0;
		this.isPressed = false;
		this.isLongPress = false;
		this.isStaticRecently = false;
		this.lastPressTimestamp = 0;
		this.longPressTimeMS = 250;
		this.movementThreshold = 15 * scaleRate;
		this.isLongPressDragging = false;

		this.handleTouchStart = this.handleTouchStart.bind(this);
		this.handleTouchMove = this.handleTouchMove.bind(this);
		this.handleTouchEnd = this.handleTouchEnd.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);

		this.canvasElement.addEventListener("touchstart", (event) => event.preventDefault(), { passive: false });
		this.canvasElement.addEventListener("mousedown", (event) => event.preventDefault());

		document.addEventListener("touchstart", this.handleTouchStart, { passive: false });
		document.addEventListener("touchmove", this.handleTouchMove, { passive: false });
		document.addEventListener("touchend", this.handleTouchEnd, { passive: false });
		document.addEventListener("mousedown", this.handleMouseDown);
		document.addEventListener("mousemove", this.handleMouseMove);
		document.addEventListener("mouseup", this.handleMouseUp);
	}

	updatePressLongevity() {
		if (this.lastPressTimestamp != 0 && performance.now() - this.lastPressTimestamp >= this.longPressTimeMS) {
			this.isLongPress = true;
		}
		if (this.isLongPress && this.isStaticRecently) {
			this.isLongPressDragging = true;
		}
	}

	getRelativePosition(event, isTouchEnd = false) {
		const rect = this.canvasElement.getBoundingClientRect();
		const scaleX = this.canvasElement.width / rect.width;
		const scaleY = this.canvasElement.height / rect.height;

		let clientX, clientY;
		if (isTouchEnd && event.changedTouches) {
			clientX = event.changedTouches[0].clientX;
			clientY = event.changedTouches[0].clientY;
		} else if (event.touches && event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else {
			clientX = event.clientX;
			clientY = event.clientY;
		}

		let x = 0;
		let y = 0;
		if (this.isCanvasFullscreen) {
			
		} else {
			x = (clientX - rect.left) * scaleX;
			y = (clientY - rect.top) * scaleY;
		}
		return {
			x: x,
			y: y
		};
	}

	isEventInsideCanvas(event) {
		const rect = this.canvasElement.getBoundingClientRect();
		let clientX, clientY;

		if (event.touches && event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else if (event.changedTouches && event.changedTouches.length > 0) {
			clientX = event.changedTouches[0].clientX;
			clientY = event.changedTouches[0].clientY;
		} else {
			clientX = event.clientX;
			clientY = event.clientY;
		}

		return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
	}

	handleTouchStart(event) {
		if (this.isEventInsideCanvas(event)) {
			event.preventDefault();
			const { x, y } = this.getRelativePosition(event);
			this.pressStartPosX = x;
			this.pressStartPosY = y;
			this.actualPressStartPosX = x;
			this.actualPressStartPosY = y;
			this.prevPosX = this.posX;
			this.prevPosY = this.posY;
			this.posX = x;
			this.posY = y;
			this.isPressed = true;
			this.lastPressTimestamp = performance.now();
			this.isStaticRecently = true;
		}
	}

	handleTouchMove(event) {
		if (this.isPressed) {
			event.preventDefault();
			const { x, y } = this.getRelativePosition(event);
			this.prevPosX = this.posX;
			this.prevPosY = this.posY;
			this.posX = x;
			this.posY = y;
			const movementDistance = Math.sqrt(Math.pow(x - this.actualPressStartPosX, 2) + Math.pow(y - this.actualPressStartPosY, 2));
			if (movementDistance > this.movementThreshold) {
				this.isStaticRecently = false;
			}
			this.updatePressLongevity();
		}
	}

	handleTouchEnd(event) {
		if (this.isPressed) {
			if (this.isEventInsideCanvas(event)) {
				event.preventDefault();
			}
			const { x, y } = this.getRelativePosition(event, true);
			this.pressEndPosX = x;
			this.pressEndPosY = y;
			this.isPressed = false;
			this.isLongPress = false;
			this.lastPressTimestamp = 0;
			this.isLongPressDragging = false;
		}
	}

	handleMouseDown(event) {
		if (this.isEventInsideCanvas(event)) {
			event.preventDefault();
			const { x, y } = this.getRelativePosition(event);
			this.pressStartPosX = x;
			this.pressStartPosY = y;
			this.actualPressStartPosX = x;
			this.actualPressStartPosY = y;
			this.prevPosX = this.posX;
			this.prevPosY = this.posY;
			this.posX = x;
			this.posY = y;
			this.isPressed = true;
			this.lastPressTimestamp = performance.now();
			this.isStaticRecently = true;
		}
	}

	handleMouseMove(event) {
		if (this.isPressed) {
			event.preventDefault();
			const { x, y } = this.getRelativePosition(event);
			this.prevPosX = this.posX;
			this.prevPosY = this.posY;
			this.posX = x;
			this.posY = y;
			const movementDistance = Math.sqrt(Math.pow(x - this.actualPressStartPosX, 2) + Math.pow(y - this.actualPressStartPosY, 2));
			if (movementDistance > this.movementThreshold) {
				this.isStaticRecently = false;
			}
			this.updatePressLongevity();
		}
	}

	handleMouseUp(event) {
		if (this.isPressed) {
			if (this.isEventInsideCanvas(event)) {
				event.preventDefault();
			}
			const { x, y } = this.getRelativePosition(event);
			this.pressEndPosX = x;
			this.pressEndPosY = y;
			this.isPressed = false;
			this.isLongPress = false;
			this.lastPressTimestamp = 0;
			this.isLongPressDragging = false;
		}
	}
}