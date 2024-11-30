export function requestFullScreen(canvasElement) {
	if (canvasElement.requestFullscreen) {
		canvasElement.requestFullscreen();
	} else if (canvasElement.mozRequestFullScreen) { // Firefox
		canvasElement.mozRequestFullScreen();
	} else if (canvasElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
		canvasElement.webkitRequestFullscreen();
	} else if (canvasElement.msRequestFullscreen) { // IE/Edge
		canvasElement.msRequestFullscreen();
	}
}

export function exitFullScreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.mozCancelFullScreen) { // Firefox
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
		document.webkitExitFullscreen();
	} else if (document.msExitFullscreen) { // IE/Edge
		document.msExitFullscreen();
	}
}

export function getBlackBordersSize(screenWidth, screenHeight, canvasWidth, canvasHeight) {
	const screenAspectRatio = screenWidth / screenHeight;
	const canvasAspectRatio = canvasWidth / canvasHeight;

	let newCanvasWidth, newCanvasHeight;
	let leftBorder, rightBorder, topBorder, bottomBorder;

	if (canvasAspectRatio > screenAspectRatio) {
		newCanvasWidth = screenWidth;
		newCanvasHeight = screenWidth / canvasAspectRatio;
		leftBorder = 0;
		rightBorder = 0;
		topBorder = (screenHeight - newCanvasHeight) * 0.5;
		bottomBorder = topBorder;
	} else {
		newCanvasHeight = screenHeight;
		newCanvasWidth = screenHeight * canvasAspectRatio;
		topBorder = 0;
		bottomBorder = 0;
		leftBorder = (screenWidth - newCanvasWidth) * 0.5;
		rightBorder = leftBorder;
	}

	return {
		left: Math.round(leftBorder),
		right: Math.round(rightBorder),
		top: Math.round(topBorder),
		bottom: Math.round(bottomBorder)
	};
}