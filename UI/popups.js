import { getRandomInt } from "/Math.js";

export function drawWinOnContext(ctx, width, height, scaleRate) {
	const rectangleSizeRate = 0.6;
	const rectangleSizeX = width * rectangleSizeRate;
	const rectangleSizeY = height * rectangleSizeRate;
	const rectangleSizeHalfX = rectangleSizeX * 0.5;
	const rectangleSizeHalfY = rectangleSizeY * 0.5;
	const posX = width * 0.5 - rectangleSizeHalfX;
	const posY = height * 0.5 - rectangleSizeHalfY;

	ctx.fillStyle = "white";
	ctx.fillRect(posX, posY, rectangleSizeX, rectangleSizeY);
	ctx.fillStyle = "rgb(53,7,87)";
	const scalingPos = 1.05;
	const scalingSize = scalingPos / scalingPos;
	ctx.fillRect(posX * scalingPos, posY * scalingPos, rectangleSizeX / scalingSize, rectangleSizeY / scalingSize);

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = "bold " + (rectangleSizeX * 0.05) + "px Monospace";

	const text = "Y O U  W O N  : 3 ! ! !";
	const textWidth = ctx.measureText(text).width;

	let textX = posX + rectangleSizeHalfX - textWidth * 0.5;
	const textY = posY + rectangleSizeHalfY;

	for (let i = 0; i < text.length; ++i) {
		const randomColor = "rgb(" + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + ")";
		ctx.fillStyle = randomColor;
		ctx.fillText(text[i], textX, textY);
		textX += ctx.measureText(text[i]).width;
	}
}

export function drawDeathOnContext(ctx, width, height, scaleRate) {
	const rectangleSizeRate = 0.5;
	const rectangleSizeX = width * rectangleSizeRate;
	const rectangleSizeY = height * rectangleSizeRate;
	const rectangleSizeHalfX = rectangleSizeX * 0.5;
	const rectangleSizeHalfY = rectangleSizeY * 0.5;
	const posX = width * 0.5 - rectangleSizeHalfX;
	const posY = height * 0.5 - rectangleSizeHalfY;

	ctx.fillStyle = "black";
	ctx.fillRect(posX, posY, rectangleSizeX, rectangleSizeY);

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = "bold " + (rectangleSizeX * 0.05) + "px Monospace";

	const text = "you died...";
	const textX = posX + rectangleSizeHalfX;
	const textY = posY + rectangleSizeHalfY;

	ctx.fillStyle = "red";
	ctx.fillText(text, textX, textY);
}