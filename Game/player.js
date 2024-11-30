import { getDistance } from "/Math.js";

const twoPi = Math.PI * 2;
const markerWidth = 250;

export class Player {
	constructor() {
		this.posX = 0;
		this.posY = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.radius = 8;
		this.color = { r: 255, g: 0, b: 255 };
		this.isHitable = false;
		this.hitableRadius = this.radius * 1.1;
		this.isTouchedGround = false;
		this.bounceRate = 0.8;
		this.frictionRate = 0.75;
		this.hitStrength = 450;
		this.isKilled = false;
		this.isWon = false;
	}

	hit(dirX, dirY, strengthRate) {
		this.speedX += dirX * strengthRate;
		this.speedY += dirY * strengthRate;
		this.isTouchedGround = false;
	}

	move(deltaTime, rectangleObstacles, endingCallback) {
		if (this.isKilled || this.isWon) {
			return;
		}

		this.speedY += 1000 * deltaTime;

		const totalMovementX = this.speedX * deltaTime;
		const totalMovementY = this.speedY * deltaTime;

		let minCollisionTime = 1;
		let collisionNormalX = 0;
		let collisionNormalY = 0;
		let collidedRectangles = [];

		for (let i = 0, len = rectangleObstacles.length; i < len; ++i) {
			const rectangle = rectangleObstacles[i];
			const [collisionTime, normalX, normalY, isCollided, isGotKilled, isWon] = this.sweptCollision(rectangle, totalMovementX, totalMovementY);

			if (isWon) {
				this.isWon = true;
				endingCallback();
				this.isHitable = false;
				return;
			}
			if (isGotKilled) {
				this.isKilled = true;
				endingCallback();
				this.isHitable = false;
				return;
			}

			if (isCollided && collisionTime <= minCollisionTime) {
				if (collisionTime < minCollisionTime) {
					collidedRectangles = [];
				}
				minCollisionTime = collisionTime;
				collisionNormalX = normalX;
				collisionNormalY = normalY;
				collidedRectangles.push(rectangle);
			}
		}

		if (minCollisionTime < 1) {
			this.handleCollisions(collidedRectangles, minCollisionTime, collisionNormalX, collisionNormalY, totalMovementX, totalMovementY, deltaTime);
		} else {
			this.posX += totalMovementX;
			this.posY += totalMovementY;
		}

		const [minDistanceToRectangle, isCollided] = this.resolveOverlaps(rectangleObstacles);
		if (isCollided) {
			this.isTouchedGround = true;
		}

		this.isHitable = (
			this.isTouchedGround &&
			(Math.abs(this.speedX) + Math.abs(this.speedY)) < 50 &&
			minDistanceToRectangle <= this.hitableRadius
		);
	}
	handleCollisions(collidedRectangles, minCollisionTime, normalX, normalY, totalMovementX, totalMovementY, deltaTime) {
		this.posX += totalMovementX * minCollisionTime;
		this.posY += totalMovementY * minCollisionTime;

		const remainingTime = 1 - minCollisionTime;

		const dotProduct = this.speedX * normalX + this.speedY * normalY;
		this.speedX -= 2 * dotProduct * normalX * this.bounceRate;
		this.speedY -= 2 * dotProduct * normalY * this.bounceRate;

		if (normalY < 0) {
			this.speedX *= this.frictionRate;
		}

		this.posX += this.speedX * remainingTime * deltaTime;
		this.posY += this.speedY * remainingTime * deltaTime;

		this.speedX *= 0.95;
		this.speedY *= 0.95;

		collidedRectangles.forEach(rectangle => {
			rectangle.isCollided = true;
		});
	}
	resolveOverlaps(rectangleObstacles) {
		let minDistanceToRectangle = 9007199254740991;
		let isCollided = false;

		rectangleObstacles.forEach(rectangle => {
			const closestX = Math.max(rectangle.posX, Math.min(this.posX, rectangle.posX + rectangle.sizeX));
			const closestY = Math.max(rectangle.posY, Math.min(this.posY, rectangle.posY + rectangle.sizeY));
			const distanceX = this.posX - closestX;
			const distanceY = this.posY - closestY;
			const distanceSquared = distanceX * distanceX + distanceY * distanceY;

			const distanceLine = getDistance(closestX, closestY, this.posX, this.posY);
			if (distanceLine <= this.hitableRadius) {
				isCollided = true;
			}
			if (distanceLine < minDistanceToRectangle) {
				minDistanceToRectangle = distanceLine;
			}

			if (distanceSquared < this.radius * this.radius) {
				const distance = Math.sqrt(distanceSquared);
				const overlap = this.radius - distance;

				if (distance > 0) {
					const normalX = distanceX / distance;
					const normalY = distanceY / distance;
					this.posX += normalX * overlap;
					this.posY += normalY * overlap;

					this.speedX -= normalX * this.bounceRate * overlap;
					this.speedY -= normalY * this.bounceRate * overlap;
				} else {
					this.posY -= this.radius;
					this.speedY = 0;
				}
			}
		});

		return [minDistanceToRectangle, isCollided];
	}
	sweptCollision(rectangle, movementX, movementY) {
		let isGotKilled = false;
		let isWon = false;

		const closestX = Math.max(rectangle.posX, Math.min(this.posX, rectangle.posX + rectangle.sizeX));
		const closestY = Math.max(rectangle.posY, Math.min(this.posY, rectangle.posY + rectangle.sizeY));
		const distanceX = this.posX - closestX;
		const distanceY = this.posY - closestY;
		const distanceSquared = distanceX * distanceX + distanceY * distanceY;

		if (distanceSquared < this.radius * this.radius) {
			const distance = Math.sqrt(distanceSquared);
			const normalX = distance > 0 ? distanceX / distance : 0;
			const normalY = distance > 0 ? distanceY / distance : -1;
			if (rectangle.isKill == true) {
				isGotKilled = true;
			}
			if (rectangle.isWin == true) {
				isWon = true;
			}
			return [0, normalX, normalY, true, isGotKilled, isWon];
		}

		const invEntry = [0, 0];
		const invExit = [0, 0];

		const expandedRect = {
			posX: rectangle.posX - this.radius,
			posY: rectangle.posY - this.radius,
			sizeX: rectangle.sizeX + 2 * this.radius,
			sizeY: rectangle.sizeY + 2 * this.radius
		};

		if (movementX > 0) {
			invEntry[0] = expandedRect.posX - this.posX;
			invExit[0] = (expandedRect.posX + expandedRect.sizeX) - this.posX;
		} else {
			invEntry[0] = (expandedRect.posX + expandedRect.sizeX) - this.posX;
			invExit[0] = expandedRect.posX - this.posX;
		}

		if (movementY > 0) {
			invEntry[1] = expandedRect.posY - this.posY;
			invExit[1] = (expandedRect.posY + expandedRect.sizeY) - this.posY;
		} else {
			invEntry[1] = (expandedRect.posY + expandedRect.sizeY) - this.posY;
			invExit[1] = expandedRect.posY - this.posY;
		}

		const entry = [0, 0];
		const exit = [0, 0];

		entry[0] = (movementX != 0) ? invEntry[0] / movementX : -Infinity;
		entry[1] = (movementY != 0) ? invEntry[1] / movementY : -Infinity;

		exit[0] = (movementX != 0) ? invExit[0] / movementX : Infinity;
		exit[1] = (movementY != 0) ? invExit[1] / movementY : Infinity;

		const entryTime = Math.max(entry[0], entry[1]);
		const exitTime = Math.min(exit[0], exit[1]);

		if (entryTime > exitTime || (entry[0] < 0 && entry[1] < 0) || entry[0] > 1 || entry[1] > 1) {
			return [1, 0, 0, false, isGotKilled, isWon];
		} else {
			let normalX = 0;
			let normalY = 0;

			if (entry[0] > entry[1]) {
				normalX = invEntry[0] < 0 ? 1 : -1;
			} else {
				normalY = invEntry[1] < 0 ? 1 : -1;
			}

			const collisionX = this.posX + entryTime * movementX;
			const collisionY = this.posY + entryTime * movementY;

			const closestCollisionX = Math.max(rectangle.posX, Math.min(collisionX, rectangle.posX + rectangle.sizeX));
			const closestCollisionY = Math.max(rectangle.posY, Math.min(collisionY, rectangle.posY + rectangle.sizeY));

			const collisionDistanceX = collisionX - closestCollisionX;
			const collisionDistanceY = collisionY - closestCollisionY;
			const collisionDistanceSquared = collisionDistanceX * collisionDistanceX + collisionDistanceY * collisionDistanceY;

			if (collisionDistanceSquared <= this.radius * this.radius) {
				if (collisionDistanceSquared > 0) {
					const collisionDistance = Math.sqrt(collisionDistanceSquared);
					normalX = collisionDistanceX / collisionDistance;
					normalY = collisionDistanceY / collisionDistance;
				}
				if (rectangle.isKill == true) {
					isGotKilled = true;
				}
				if (rectangle.isWin == true) {
					isWon = true;
				}
				return [entryTime, normalX, normalY, true, isGotKilled, isWon];
			}

			return [1, 0, 0, false, isGotKilled, isWon];
		}
	}

	drawOnContext(ctx, offsetX, offsetY, zoomInRate) {
		const x = (this.posX - offsetX) * zoomInRate;
		const y = (this.posY - offsetY) * zoomInRate;
		const radius = this.radius * zoomInRate;
		const lineWidth = radius * 0.5;
		const adjustedRadius = radius - lineWidth * 0.5;

		ctx.beginPath();
		ctx.arc(x, y, adjustedRadius, 0, twoPi);
		if (this.isHitable) {
			ctx.fillStyle = "white";
		} else {
			ctx.fillStyle = "black";
		}
		ctx.fill();
		ctx.strokeStyle = "white";
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}

	drawTrajectoryOnContext(ctx, potentialHitDirection, potentialHitStrength, cameraPosX, cameraPosY, zoomInRate, scaleRate) {
		const { x: dirX, y: dirY } = potentialHitDirection;

		const maxLineLength = markerWidth * scaleRate / zoomInRate;
		const maxEndX = this.posX + dirX * maxLineLength;
		const maxEndY = this.posY + dirY * maxLineLength;

		const transformedMaxEndX = (maxEndX - cameraPosX) * zoomInRate;
		const transformedMaxEndY = (maxEndY - cameraPosY) * zoomInRate;

		const hitStrengthRatio = potentialHitStrength / this.hitStrength;
		const lineLength = hitStrengthRatio * maxLineLength;

		const endX = this.posX + dirX * lineLength;
		const endY = this.posY + dirY * lineLength;

		const startX = (this.posX - cameraPosX) * zoomInRate;
		const startY = (this.posY - cameraPosY) * zoomInRate;
		const transformedEndX = (endX - cameraPosX) * zoomInRate;
		const transformedEndY = (endY - cameraPosY) * zoomInRate;

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(transformedMaxEndX, transformedMaxEndY);
		ctx.strokeStyle = "rgb(51,51,51)";
		ctx.lineWidth = 5 * zoomInRate;
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(transformedEndX, transformedEndY);
		ctx.strokeStyle = "rgb(104,104,255)";
		ctx.lineWidth = 6 * zoomInRate;
		ctx.stroke();
	}

	drawMarkerTo(ctx, posX, posY, offsetX, offsetY, zoomInRate, scaleRate) {
		const x = (this.posX - offsetX) * zoomInRate;
		const y = (this.posY - offsetY) * zoomInRate;

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(posX, posY);
		ctx.strokeStyle = "white";
		ctx.lineWidth = 4 * scaleRate;
		ctx.stroke();
	}
}