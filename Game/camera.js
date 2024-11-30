export class Camera {
	constructor(scaleRate) {
		this.posX = 0;
		this.posY = 0;
		this.zoomInRate = 3 * scaleRate;
		this.minZoomInRate = Math.EPSILON;
		this.zoomInSpeed = 1;
		this.zoomOutRate = 0.45;
		this.moveRate = 2.5 * scaleRate;
		this.mouseMoveStartX = 0;
		this.mouseMoveStartY = 0;
		this.isStaticRecently = false;
		this.recentMovements = [];
		this.movementThreshold = 0.01;
		this.movementWindow = 10;
		this.animationRate = 1;
	}

	updateAnimation() {
		this.animationRate += 0.0095;
		if (this.animationRate > 1) {
			this.animationRate = 1;
		}
	}
	startAnimation() {
		this.animationRate = 0;
	}

	moveWRTMouse(mouse, scaleRate) {
		if (mouse.isPressed) {
			const deltaX = mouse.pressStartPosX - mouse.posX;
			const deltaY = mouse.pressStartPosY - mouse.posY;

			this.posX += deltaX * this.moveRate / this.zoomInRate / scaleRate;
			this.posY += deltaY * this.moveRate / this.zoomInRate / scaleRate;

			const movement = Math.sqrt(deltaX ** 2 + deltaY ** 2);

			this.recentMovements.push(movement);

			if (this.recentMovements.length > this.movementWindow) {
				this.recentMovements.shift();
			}

			const averageMovement = this.recentMovements.reduce((sum, curr) => sum + curr, 0) / this.recentMovements.length;

			this.isStaticRecently = averageMovement < this.movementThreshold;

			mouse.pressStartPosX = mouse.posX;
			mouse.pressStartPosY = mouse.posY;
		}
	}
}