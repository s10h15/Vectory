import { getMinDelay, getClamped, getDistance, getNormalizedDirection, getCanvasElementImage, downloadImageAsPNG, downloadStringAsTXT, getSplittedString, getRandomFloat, isNumber } from "/Math.js";
import { getBinaryFileBuffer, createBinaryFile, downloadBinaryFile, selectBinaryFile } from "/binary.js";

import { version } from "/version.js";

import { Camera } from "/Game/camera.js";
import { Player } from "/Game/player.js";
import { Mouse } from "/Game/mouse.js";
import { World } from "/Game/world.js";
import { Button, buttonType } from "/UI/button.js";
import { Console, Message } from "/UI/console.js";
import { Replay, Hit } from "/Game/replay.js";

import { requestFullScreen, exitFullScreen, getBlackBordersSize } from "/Canvas/fullscreen.js";
import { drawWinOnContext, drawDeathOnContext } from "/UI/popups.js";

import { predictGameInputs } from "/AI/predictInputs.js";

const isMainOrCustom = false;
const isCheatingAllowed = !isMainOrCustom;
let isLoadMainLevel = isMainOrCustom;
let currentLevelIndex = 0;

const twoPI = 2 * Math.PI;

let radiusCheck = 0;

const canvasElement = document.getElementById("canvasElement");
const ctx = canvasElement.getContext("2d");
let width = canvasElement.width;
let height = canvasElement.height;
let centerX = width * 0.5;
let centerY = height * 0.5;
let minDimension = Math.min(width, height);
let scaleRate = minDimension / 1024;

const pageConsole = document.getElementById("pageConsole");
const pageConsoleParameterSeparator = ",";

function getPageConsoleParameters() {
	return getSplittedString(pageConsole.value, [pageConsoleParameterSeparator], false);
}

function isPageConsoleParameterValid(text) {
	return text !== undefined && text != "";
}

let gameConsole = new Console(scaleRate);
gameConsole.posX = width - gameConsole.width;

function displayConsoleMessage(message) {
	gameConsole.addMessage(message);
}

let isPlayingAI = false;

let replay = new Replay();
let isWatchingReplay = false;
let replayHitIndex = 0;

let framesCount = 0;
let stepsCountPlay = 0;

function getStepsAsMS(steps) {
	return steps * FIXED_TIMESTEP * 1000;
}

displayConsoleMessage(new Message(() => (getStepsAsMS(stepsCountPlay) * 0.001).toFixed(4), false, "time"));

function recordHit(directionX, directionY, strengthRate, stepIndex) {
	replay.hits.push(new Hit(directionX, directionY, strengthRate, stepIndex));
}

let isDebug = false;
let isEditing = !isLoadMainLevel;

const placementType = {
	cell: 0,
	spawn: 1,
	rectangle: 2,
	length: 3
};
const cellType = {
	empty: 0,
	solid: 1,
	lamp: 2,
	bg: 3,
	length: 4
};
const cellInteractionType = {
	none: 0,
	kill: 1,
	win: 2,
	length: 3
};
let placingCellType = cellType.solid;
let placingType = placementType.cell;
let placingCellInteractionType = cellInteractionType.none;
let placingRadius = 0;

const storageWorldSaveKey = "vectory_world";
let world = new World();

function loadMainLevel() {
	getBinaryFileBuffer("Levels/" + currentLevelIndex + ".bin", mainLevelSave => {
		if (mainLevelSave === null) {
			displayConsoleMessage(new Message("the end :3", true, "end"));
			return;
		}

		const isDone = replay.loadFromSave(mainLevelSave);
		if (isDone) {
			world.loadFromRawSave(replay.worldSave);
			world.seed = replay.worldSeed;
			if (replay.version != version) {
				displayConsoleMessage(new Message("VERSION MISMATCH", true, "version"));
			}
			player.isWon = false;
			buttonReset.onClick();
			camera.startAnimation();
			displayConsoleMessage(new Message("LEVEL " + currentLevelIndex, true, "level"));
		}
	});
}
if (isLoadMainLevel) {
	loadMainLevel();
}
let isFullscreen = false;
let mouse = new Mouse(canvasElement, scaleRate);
let wasMousePressed = false;
let wasMousePressedForRectangle = false;

let player = new Player();
let camera = new Camera(scaleRate);

let buttonZoomIn = new Button(0, 0, 200, 200, scaleRate, "+", undefined, undefined, undefined, buttonType.button, false, false, () => {
	let cameraCenterX = camera.posX + width * 0.5 / camera.zoomInRate;
	let cameraCenterY = camera.posY + height * 0.5 / camera.zoomInRate;

	camera.zoomInRate += camera.zoomInSpeed * (camera.zoomInRate <= 0 ? camera.minZoomInRate : camera.zoomInRate);

	camera.posX = cameraCenterX - width * 0.5 / camera.zoomInRate;
	camera.posY = cameraCenterY - height * 0.5 / camera.zoomInRate;
});
let buttonZoomOut = new Button(undefined, undefined, undefined, undefined, scaleRate, "-", buttonZoomIn, 2, 10, buttonType.button, false, false, () => {
	let cameraCenterX = camera.posX + width * 0.5 / camera.zoomInRate;
	let cameraCenterY = camera.posY + height * 0.5 / camera.zoomInRate;

	camera.zoomInRate *= camera.zoomOutRate;
	if (camera.zoomInRate < camera.minZoomInRate) {
		camera.zoomInRate = camera.minZoomInRate;
	}

	camera.posX = cameraCenterX - width * 0.5 / camera.zoomInRate;
	camera.posY = cameraCenterY - height * 0.5 / camera.zoomInRate;
});
let buttonPlayStep = new Button(undefined, undefined, undefined, undefined, scaleRate, "step", buttonZoomOut, 2, 10, buttonType.button, true, true, () => {
	updateFixed(FIXED_TIMESTEP, true);
});
let buttonPlayAI = new Button(undefined, undefined, 85, 85, scaleRate, "AI", buttonPlayStep, 2, 10, buttonType.button, true, true, () => {
	isPlayingAI = !isPlayingAI;
	displayConsoleMessage(new Message(isPlayingAI ? "playing: AI" : "playing: user", true, "button ai"));
});
let buttonSwitchMode = new Button(null, null, 200, 200, scaleRate, "test/edit", buttonZoomIn, 3, 10, buttonType.button, false, false, () => {
	isEditing = !isEditing;
	if (!isEditing) {
		if (replay.initialPlayerPosX === null || replay.initialPlayerPosY === null || replay.initialPlayerSpeedX === null || replay.initialPlayerSpeedY === null) {
			replay.initialPlayerPosX = player.posX;
			replay.initialPlayerPosY = player.posY;
			replay.initialPlayerSpeedX = player.speedX;
			replay.initialPlayerSpeedY = player.speedY;
		}
	}
});
let buttonSwitchDebug = new Button(undefined, undefined, 95, 95, scaleRate, "debug", buttonSwitchMode, 3, 10, buttonType.button, false, false, () => {
	isDebug = !isDebug;
});
let buttonClearConsole = new Button(undefined, undefined, 95, 95, scaleRate, "clear console", buttonSwitchDebug, 2, 10, buttonType.button, false, true, () => {
	gameConsole.clear();
});
let buttonReset = new Button(undefined, undefined, 95, 95, scaleRate, "reset", buttonSwitchDebug, 3, 10, buttonType.button, false, false, () => {
	world.compress();
	camera.animationRate = 1;
	player.posX = world.spawnCellIndexX * world.cellsSize + world.cellsSize * 0.5;
	player.posY = world.spawnCellIndexY * world.cellsSize + world.cellsSize * 0.5;
	player.speedY = 0;
	player.speedX = 0;
	player.isHitable = false;
	player.isTouchedGround = false;
	player.isKilled = false;
	camera.posX = player.posX - centerX / camera.zoomInRate;
	camera.posY = player.posY - centerY / camera.zoomInRate;
	if (isWatchingReplay) {
		isWatchingReplay = false;
		displayConsoleMessage(new Message("quit replay", true, "quit replay"));
	}
	if (isLoadMainLevel && player.isWon) {
		++currentLevelIndex;
		loadMainLevel();
	}
	buttonDeleteReplay.onClick();
	isPlayingAI = false;
	gameConsole.deleteMessage("time");
	displayConsoleMessage(new Message(() => (getStepsAsMS(stepsCountPlay) * 0.001).toFixed(4), false, "time"));
});
let buttonFullscreen = new Button(undefined, undefined, undefined, undefined, scaleRate, "fullscreen", buttonReset, 3, 10, buttonType.button, false, true, () => {
	if (isFullscreen) {
		exitFullScreen(canvasElement);
	} else {
		requestFullScreen(canvasElement);
		const borders = getBlackBordersSize(window.screen.width, window.screen.height, canvasElement.width, canvasElement.height);
		mouse.canvasBorderLeft = borders.left;
		mouse.canvasBorderTop = borders.top;
	}

	width = canvasElement.width;
	height = canvasElement.height;
	centerX = width * 0.5;
	centerY = height * 0.5;
	scaleRate = Math.min(width, height) / 1024;
	mouse.isCanvasFullscreen = isFullscreen;
	displayConsoleMessage(new Message(isFullscreen ? "fullscreen" : "page mode" + " now", true, "fullscreen"));
});
let buttonSnapshot = new Button(undefined, undefined, undefined, undefined, scaleRate, "snapshot", buttonFullscreen, 3, 10, buttonType.button, false, true, () => {
	world.downloadSnapshot();
	displayConsoleMessage(new Message("saved world pic", true, "snapshot"));
});
let buttonReplay = new Button(undefined, undefined, undefined, undefined, scaleRate, "replay", buttonSnapshot, 3, 10, buttonType.button, false, true, () => {
	stepsCountPlay = 0;
	framesCount = 0;
	replayHitIndex = 0;
	player.isHitable = false;
	player.isTouchedGround = false;
	player.isKilled = false;
	player.isWon = false;
	isPlayingAI = false;
	isWatchingReplay = true;
	if (replay.initialPlayerPosX != null && replay.initialPlayerPosY != null && replay.initialPlayerSpeedX != null && replay.initialPlayerSpeedY != null) {
		player.posX = replay.initialPlayerPosX;
		player.posY = replay.initialPlayerPosY;
		player.speedX = replay.initialPlayerSpeedX;
		player.speedY = replay.initialPlayerSpeedY;
	}
	displayConsoleMessage(new Message("watching replay", true, "replay"));
	gameConsole.deleteMessage("time");
	displayConsoleMessage(new Message(() => (getStepsAsMS(stepsCountPlay) * 0.001).toFixed(4), false, "time"));
});
let buttonGenerate = new Button(undefined, undefined, 95 + 10 + 95, 80, scaleRate, "minigame", buttonReplay, 3, 10, buttonType.button, true, true, () => {
	displayConsoleMessage(new Message("GENERATING WORLD", true, "generating"));
	setTimeout(() => {
		world.generate();
		buttonReset.onClick();
		displayConsoleMessage(new Message("SEED=" + world.seed, true, "seed"));
	}, 18);
});
let buttonTemplate = new Button(undefined, undefined, 95 + 10 + 95, 80, scaleRate, "template", buttonGenerate, 2, 10, buttonType.button, true, true, () => {
	const inputs = getPageConsoleParameters();
	if (inputs.length == 2) {
		world.generateTemplate(parseInt(inputs[0]), parseInt(inputs[1]));
	} else {
		world.generateTemplate(0, 0);
	}
	world.seed = "0";
	buttonReset.onClick();
	displayConsoleMessage(new Message("emptied world", true, "template"));
});
let buttonDeleteReplay = new Button(undefined, undefined, undefined, undefined, scaleRate, "delete", buttonReplay, 2, 10, buttonType.button, false, true, () => {
	isWatchingReplay = false;
	replay.hits = [];
	if (isEditing) {
		replay.initialPlayerPosX = null;
		replay.initialPlayerPosY = null;
		replay.initialPlayerSpeedX = null;
		replay.initialPlayerSpeedY = null;
	} else {
		replay.initialPlayerPosX = player.posX;
		replay.initialPlayerPosY = player.posY;
		replay.initialPlayerSpeedX = player.speedX;
		replay.initialPlayerSpeedY = player.speedY;
	}
	stepsCountPlay = 0;
	framesCount = 0;
	isPlayingAI = false;
	player.posX = world.spawnCellIndexX * world.cellsSize + world.cellsSize * 0.5;
	player.posY = world.spawnCellIndexY * world.cellsSize + world.cellsSize * 0.5;
	player.speedY = 0;
	player.speedX = 0;
	player.isHitable = false;
	player.isTouchedGround = false;
	player.isKilled = false;
	camera.posX = player.posX - centerX / camera.zoomInRate;
	camera.posY = player.posY - centerY / camera.zoomInRate;
	player.isWon = false;
	isPlayingAI = false;
	stepsCountPlay = 0;
	framesCount = 0;

	displayConsoleMessage(new Message("deleted replay", true, "delete replay"));
});
buttonReset.onClick();
let buttonTeleport = new Button(undefined, undefined, 95, 95, scaleRate, "teleport", buttonReset, 2, 10, buttonType.button, false, true, () => {
	player.isWon = false;
	player.isKilled = false;
	isPlayingAI = false;
	hitAIIndex = -1;
	player.isHitable = false;
	player.isTouchedGround = false;
	isWatchingReplay = false;
	replay.hits = [];
	if (isEditing) {
		replay.initialPlayerPosX = null;
		replay.initialPlayerPosY = null;
		replay.initialPlayerSpeedX = null;
		replay.initialPlayerSpeedY = null;
	} else {
		replay.initialPlayerPosX = player.posX;
		replay.initialPlayerPosY = player.posY;
		replay.initialPlayerSpeedX = player.speedX;
		replay.initialPlayerSpeedY = player.speedY;
	}
	stepsCountPlay = 0;
	framesCount = 0;
	player.posX = camera.posX + centerX / camera.zoomInRate;
	player.posY = camera.posY + centerY / camera.zoomInRate;
	player.speedX = 0;
	player.speedY = 0;
});
let buttonHideUI = new Button(undefined, undefined, 85, 85, scaleRate, "kill UI", buttonSnapshot, 3, 50, buttonType.button, () => {
	buttons = [];
});
let buttonSaveReplay = new Button(undefined, undefined, undefined, undefined, scaleRate, "save", buttonDeleteReplay, 2, 10, buttonType.button, false, true, () => {
	replay.worldSave = world.getRawSave();
	replay.worldSeed = world.seed;
	replay.version = version;
	downloadBinaryFile(replay.getSave(), "vectory_save");
	displayConsoleMessage(new Message("saved replay", true, "save replay"));
});
let buttonLoadReplay = new Button(undefined, undefined, undefined, undefined, scaleRate, "load", buttonSaveReplay, 2, 10, buttonType.button, false, true, () => {
	selectBinaryFile(content => {
		const isDone = replay.loadFromSave(content);
		if (isDone) {
			world.loadFromRawSave(replay.worldSave);
			world.seed = replay.worldSeed;
			if (replay.version != version) {
				displayConsoleMessage(new Message("VERSION MISMATCH", true, "version"));
			}
			player.isWon = false;
			isPlayingAI = false;
			player.posX = world.spawnCellIndexX * world.cellsSize + world.cellsSize * 0.5;
			player.posY = world.spawnCellIndexY * world.cellsSize + world.cellsSize * 0.5;
			player.speedY = 0;
			player.speedX = 0;
			player.isHitable = false;
			player.isTouchedGround = false;
			player.isKilled = false;
			camera.posX = player.posX - centerX / camera.zoomInRate;
			camera.posY = player.posY - centerY / camera.zoomInRate;
			buttonReplay.onClick();
			isLoadMainLevel = false;
			currentLevelIndex = 0;
			camera.startAnimation();
			displayConsoleMessage(new Message("SEED=" + world.seed, true, "seed"));
		}
		displayConsoleMessage(new Message(isDone == true ? "loaded replay" : "couldnt load", true, "save replay"));
	});
});
let buttons = [
	buttonSwitchMode,
	buttonZoomIn,
	buttonZoomOut,
	buttonSwitchDebug,
	buttonReset,
	buttonSnapshot,
	buttonReplay,
	buttonDeleteReplay,
	buttonSaveReplay
];

let buttonPalette = new Button(undefined, undefined, 250, 250, scaleRate, undefined, buttonSwitchMode, 2, 10, buttonType.palette, true, true, (r, g, b) => {
	buttonR.sliderRate = r / 255;
	buttonG.sliderRate = g / 255;
	buttonB.sliderRate = b / 255;
});
let buttonCellType = new Button(undefined, undefined, 150, 125, scaleRate, "cell type", buttonPalette, 3, 250, buttonType.button, true, true, () => {
	++placingCellType;
	if (placingCellType >= cellType.length) {
		placingCellType = 0;
	}
}, () => {
	switch (placingCellType) {
		case cellType.empty: {
			return "empty";
		}
		case cellType.solid: {
			return "solid";
		}
		case cellType.lamp: {
			return "lamp";
		}
		case cellType.bg: {
			return "bg";
		}
		default: {
			return "";
		}
	}
});
let buttonCellInteractionType = new Button(undefined, undefined, undefined, undefined, scaleRate, "hitbox type", buttonCellType, 2, 10, buttonType.button, true, true, () => {
	++placingCellInteractionType;
	if (placingCellInteractionType >= cellInteractionType.length) {
		placingCellInteractionType = 0;
	}
}, () => {
	switch (placingCellInteractionType) {
		case cellInteractionType.none: {
			return "none";
		}
		case cellInteractionType.kill: {
			return "kill";
		}
		case cellInteractionType.win: {
			return "win";
		}
		default: {
			return "";
		}
	}
});
let buttonPlacingType = new Button(undefined, undefined, undefined, undefined, scaleRate, "spawn?", buttonCellInteractionType, 2, 10, buttonType.button, true, true, () => {
	++placingType;
	if (placingType >= placementType.length) {
		placingType = 0;
	}
}, () => {
	switch (placingType) {
		case placementType.cell: {
			return "cell";
		}
		case placementType.rectangle: {
			return "rectangle";
		}
		case placementType.spawn: {
			return "spawn";
		}
		case placementType.aiGoal: {
			return "AI goal";
		}
		default: {
			return "";
		}
	}
});
let buttonPipette = new Button(undefined, undefined, 100, 100, scaleRate, "pipette", buttonPalette, 2, 10, buttonType.button, true, true, () => {
	let cellOnMouse = world.getCellOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate);
	if (cellOnMouse != null) {
		buttonPalette.selectedColor[0] = cellOnMouse.r;
		buttonPalette.selectedColor[1] = cellOnMouse.g;
		buttonPalette.selectedColor[2] = cellOnMouse.b;
		buttonPalette.selectPositionFromRGB(cellOnMouse.r, cellOnMouse.g, cellOnMouse.b);
		buttonR.sliderRate = cellOnMouse.r / 255;
		buttonG.sliderRate = cellOnMouse.g / 255;
		buttonB.sliderRate = cellOnMouse.b / 255;
		pageConsole.value = cellOnMouse.text + "," + cellOnMouse.fontSize + ",t," + cellOnMouse.fontName;

		if (cellOnMouse.isSolid && !cellOnMouse.isLamp) {
			placingCellType = cellType.solid;
		} else if (cellOnMouse.isSolid && cellOnMouse.isLamp) {
			placingCellType = cellType.lamp;
		} else if (!cellOnMouse.isSolid && !cellOnMouse.isLamp) {
			placingCellType = cellType.empty;
		} else if (!cellOnMouse.isSolid && cellOnMouse.isLamp) {
			placingCellType = cellType.bg;
		}

		if (cellOnMouse.isKill) {
			placingCellInteractionType = cellInteractionType.kill;
		} else if (cellOnMouse.isWin) {
			placingCellInteractionType = cellInteractionType.win;
		} else {
			placingCellInteractionType = cellInteractionType.none;
		}

		buttonCellType.updateText();
		buttonCellInteractionType.updateText();
	}
});
let buttonText = new Button(undefined, undefined, 100, 100, scaleRate, "text", buttonPipette, 2, 10, buttonType.button, true, true, () => {
	let cellOnMouse = world.getCellOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate);
	if (cellOnMouse != null) {
		const inputs = getPageConsoleParameters();
		if (isPageConsoleParameterValid(inputs[0])) {
			switch (inputs[0]) {
				case "c": {
					buttonPalette.selectedColor[0] = cellOnMouse.fontColorR;
					buttonPalette.selectedColor[1] = cellOnMouse.fontColorG;
					buttonPalette.selectedColor[2] = cellOnMouse.fontColorB;
					buttonPalette.selectPositionFromRGB(cellOnMouse.fontColorR, cellOnMouse.fontColorG, cellOnMouse.fontColorB);
					pageConsole.value = cellOnMouse.text + "," + cellOnMouse.fontSize + ",t," + cellOnMouse.fontName;
					break;
				}
				case "s": {
					cellOnMouse.setFontColor(buttonPalette.selectedColor[0], buttonPalette.selectedColor[1], buttonPalette.selectedColor[2]);
					break;
				}
				default: {
					cellOnMouse.text = inputs[0] == " " ? null : inputs[0];
					break;
				}
			}
		}
		if (isPageConsoleParameterValid(inputs[1]) && isNumber(inputs[1])) {
			cellOnMouse.fontSize = inputs[1];
		}
		if (inputs[2] == "t") {
			cellOnMouse.setFontColor(buttonPalette.selectedColor[0], buttonPalette.selectedColor[1], buttonPalette.selectedColor[2]);
		}
		if (isPageConsoleParameterValid(inputs[3])) {
			cellOnMouse.fontName = inputs[3];
		}
	}
});
let buttonDeleteText = new Button(undefined, undefined, 100, 100, scaleRate, "delete", buttonText, 3, 10, buttonType.button, true, true, () => {
	let cellOnMouse = world.getCellOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate);
	if (cellOnMouse != null) {
		cellOnMouse.text = null;
		cellOnMouse.fontName = "Monospace";
		cellOnMouse.fontSize = 5;
		cellOnMouse.setFontColor(255, 255, 255);
	}
});
let buttonPipetteText = new Button(undefined, undefined, 100, 100, scaleRate, "copy", buttonDeleteText, 3, 10, buttonType.button, true, true, () => {
	let cellOnMouse = world.getCellOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate);
	if (cellOnMouse != null) {
		pageConsole.value = cellOnMouse.text + "," + cellOnMouse.fontSize + ",t," + cellOnMouse.fontName;
	}
});
let buttonFill = new Button(undefined, undefined, 100, 100, scaleRate, "fill", buttonPipette, 3, 10, buttonType.button, true, true, () => {
	let isSolid = false;
	let isKill = placingCellInteractionType == cellInteractionType.kill;
	let isLamp = false;
	let isWin = placingCellInteractionType == cellInteractionType.win;
	switch (placingCellType) {
		case cellType.solid: {
			isSolid = true;
			isLamp = false;
			break;
		}
		case cellType.empty: {
			isSolid = false;
			isLamp = false;
			break;
		}
		case cellType.lamp: {
			isSolid = true;
			isLamp = true;
			break;
		}
		case cellType.bg: {
			isSolid = false;
			isLamp = true;
			break;
		}
		default: {
			break;
		}
	}

	const inputs = getPageConsoleParameters();
	if (isPageConsoleParameterValid(inputs[0])) {
		if (inputs[0] == "stars") {
			if (isPageConsoleParameterValid(inputs[1]) && isNumber(inputs[1])) {
				world.fillCellsOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, buttonPalette.selectedColor, isSolid, isKill, isLamp, isWin, parseFloat(inputs[1]), false);
			} else {
				world.fillCellsOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, buttonPalette.selectedColor, isSolid, isKill, isLamp, isWin, 0.05, false);
			}
		} else if (inputs[0] == "rainbow") {
			if (isPageConsoleParameterValid(inputs[1]) && isPageConsoleParameterValid(inputs[2]) && isNumber(inputs[1]) && isNumber(inputs[2])) {
				world.fillCellsOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, buttonPalette.selectedColor, isSolid, isKill, isLamp, isWin, 1, true, parseInt(inputs[1]), parseInt(inputs[2]));
			} else {
				world.fillCellsOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, buttonPalette.selectedColor, isSolid, isKill, isLamp, isWin, 1, true, 0, 255);
			}
		} else {
			world.fillCellsOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, buttonPalette.selectedColor, isSolid, isKill, isLamp, isWin, 1);
		}
	} else {
		world.fillCellsOnMousePos(centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, buttonPalette.selectedColor, isSolid, isKill, isLamp, isWin, 1);
	}
});
let buttonSmallerBrush = new Button(undefined, undefined, 185, 185, scaleRate, "-brush", buttonPlayStep, 2, 10, buttonType.button, true, true, () => {
	placingRadius = Math.max(0, placingRadius - Math.max(1, Math.round(1 / camera.zoomInRate * 0.5)));
	buttonBiggerBrush.updateText();
});
let buttonBiggerBrush = new Button(undefined, undefined, 185, 185, scaleRate, "+brush", buttonSmallerBrush, 2, 10, buttonType.button, true, true, () => {
	const inputs = getPageConsoleParameters();
	if (inputs.length == 1 && isNumber(inputs[0])) {
		placingRadius = parseInt(inputs[0]);
		return;
	}
	placingRadius += Math.max(1, Math.round(1 / (camera.zoomInRate * 2)));
}, () => {
	return "+brush(" + placingRadius + ")";
});

let buttonR = new Button(undefined, undefined, 360, 75, scaleRate, "R", buttonPalette, 3, 10, buttonType.slider, true, true, (sliderRate) => {
	buttonPalette.selectedColor[0] = sliderRate * 255;
	buttonPalette.selectPositionFromRGB(buttonPalette.selectedColor[0], buttonPalette.selectedColor[1], buttonPalette.selectedColor[2]);
});
let buttonG = new Button(undefined, undefined, undefined, undefined, scaleRate, "G", buttonR, 3, 5, buttonType.slider, true, true, (sliderRate) => {
	buttonPalette.selectedColor[1] = sliderRate * 255;
	buttonPalette.selectPositionFromRGB(buttonPalette.selectedColor[0], buttonPalette.selectedColor[1], buttonPalette.selectedColor[2]);
});
let buttonB = new Button(undefined, undefined, undefined, undefined, scaleRate, "B", buttonG, 3, 5, buttonType.slider, true, true, (sliderRate) => {
	buttonPalette.selectedColor[2] = sliderRate * 255;
	buttonPalette.selectPositionFromRGB(buttonPalette.selectedColor[0], buttonPalette.selectedColor[1], buttonPalette.selectedColor[2]);
});

let editingbuttons = [
	buttonPalette,
	buttonCellType,
	buttonCellInteractionType,
	buttonPlacingType,
	buttonPipette,
	buttonR,
	buttonG,
	buttonB,
	buttonDeleteText,
	buttonPipetteText,
	buttonText,
	buttonFill,
	buttonGenerate,
	buttonTemplate,
	buttonLoadReplay,
	//buttonPlayAI,
	buttonPlayStep,
	buttonFullscreen,
	buttonTeleport,
	buttonClearConsole,
	buttonSmallerBrush,
	buttonBiggerBrush
];

const keyFunctionMap = {
	"a": buttonZoomOut.onClick,
	"d": buttonZoomIn.onClick,
	"w": buttonSwitchMode.onClick,
	"g": buttonSwitchDebug.onClick,
	"r": buttonReset.onClick,
	"q": buttonSnapshot.onClick,
	"j": buttonFullscreen.onClick,
	"k": buttonHideUI.onClick,
	"p": buttonPalette.onClick,
	"c": buttonCellType.onClick,
	"t": buttonPlacingType.onClick,
	"i": buttonPipette.onClick,
	"f": buttonFill.onClick,
	"n": buttonGenerate.onClick,
	"m": buttonTemplate.onClick,
	"l": buttonLoadReplay.onClick,
	"y": buttonPlayAI.onClick,
	"s": buttonPlayStep.onClick,
	"e": buttonTeleport.onClick,
	"x": buttonClearConsole.onClick,
	"z": buttonSaveReplay.onClick,
	"v": buttonReplay.onClick,
	"b": buttonDeleteReplay.onClick
};
document.addEventListener("keydown", (event) => {
	const key = event.key.toLowerCase();
	const keyFunction = keyFunctionMap[key];
	if (keyFunction) {
		keyFunction();
	}
});

function drawCursor() {
	if (mouse.isPressed && isEditing) {
		ctx.strokeStyle = "gray";
		ctx.lineWidth = 6 * scaleRate;
		ctx.beginPath();
		ctx.arc(mouse.posX, mouse.posY, world.cellsSize * (placingRadius + 1) * camera.zoomInRate, 0, twoPI);
		ctx.stroke();
	}
}

let TARGET_FPS = 144;
let FIXED_TIMESTEP = 1 / TARGET_FPS;
let accumulator = 0;

const fps = 120;
const minFrameDelay = 1000 / fps;

let lastFrameTime = performance.now();

const MAX_ACCUMULATOR = FIXED_TIMESTEP * 32;

function runFrame() {
	const frameStartTime = performance.now();
	const realDeltaTime = (frameStartTime - lastFrameTime) / 1000;
	lastFrameTime = frameStartTime;

	accumulator += realDeltaTime;

	if (accumulator > MAX_ACCUMULATOR) {
		accumulator = MAX_ACCUMULATOR;
	}

	let isUIElementPressed = handleUIInteractions();
	handleEditing(isUIElementPressed);

	while (accumulator >= FIXED_TIMESTEP) {
		updateFixed(FIXED_TIMESTEP, false);
		accumulator -= FIXED_TIMESTEP;
	}
	updateControls(isUIElementPressed);

	render(realDeltaTime, isUIElementPressed);

	++framesCount;

	const frameProcessingTime = performance.now() - frameStartTime;
	const timeBeforeNextFrame = minFrameDelay - frameProcessingTime;
	setTimeout(runFrame, Math.max(0, timeBeforeNextFrame));
}
runFrame();

function updateIsWon() {
	if (player.isWon) {
		displayConsoleMessage(new Message(isPlayingAI ? "AI won" : "you won :3", true, "won"));
		gameConsole.deleteMessage("time");
		displayConsoleMessage(new Message((getStepsAsMS(stepsCountPlay) * 0.001).toFixed(4) + "!", true, "time"));
	}
}

function updateFixed(dt, isOverrideEditing) {
	if (!isEditing || isOverrideEditing) {
		handleGameplay(dt);
		if (!player.isKilled) {
			++stepsCountPlay;
		}
	}
}

function updateControls(isUIElementPressed) {
	if (player.isHitable && !isEditing && !isUIElementPressed && !isWatchingReplay && !isPlayingAI && !player.isWon && !player.isKilled) {
		if (mouse.isPressed && !wasMousePressed) {
			wasMousePressed = true;
		} else if (!mouse.isPressed && wasMousePressed) {
			wasMousePressed = false;
			const hitRate = Math.min(getDistance(mouse.actualPressStartPosX, mouse.actualPressStartPosY, mouse.pressEndPosX, mouse.pressEndPosY) / (minDimension * 0.5), 1);
			const hitStrength = player.hitStrength * hitRate;
			const hitDirection = getNormalizedDirection(mouse.actualPressStartPosX - mouse.pressEndPosX, mouse.actualPressStartPosY - mouse.pressEndPosY);
			player.hit(hitDirection.x, hitDirection.y, hitStrength);
			recordHit(hitDirection.x, hitDirection.y, hitRate, stepsCountPlay);
			updateIsWon();
		}
	}
}

function render(deltaTime, isUIElementPressed) {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, width, height);

	world.drawOnContext(ctx, camera.posX, camera.posY, camera.zoomInRate, width, height, isDebug, deltaTime);
	player.drawOnContext(ctx, camera.posX, camera.posY, camera.zoomInRate);

	handleMousePress();

	if (!isEditing) {
		if (player.isWon) {
			drawWinOnContext(ctx, width, height, scaleRate);
		} else if (player.isKilled) {
			drawDeathOnContext(ctx, width, height, scaleRate);
		}
	}
	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
	drawUI();
	drawCursor();
}

function modifyCell(cell) {
	switch (placingCellType) {
		case cellType.empty: {
			cell.isSolid = false;
			cell.isKill = placingCellInteractionType == cellInteractionType.kill;
			cell.isWin = placingCellInteractionType == cellInteractionType.win;
			cell.isLamp = false;
			break;
		}
		case cellType.solid: {
			cell.isSolid = true;
			cell.isKill = placingCellInteractionType == cellInteractionType.kill;
			cell.isWin = placingCellInteractionType == cellInteractionType.win;
			cell.isLamp = false;
			break;
		}
		case cellType.lamp: {
			cell.isSolid = true;
			cell.isKill = placingCellInteractionType == cellInteractionType.kill;
			cell.isWin = placingCellInteractionType == cellInteractionType.win;
			cell.isLamp = true;
			break;
		}
		case cellType.bg: {
			cell.isSolid = false;
			cell.isKill = placingCellInteractionType == cellInteractionType.kill;
			cell.isWin = placingCellInteractionType == cellInteractionType.win;
			cell.isLamp = true;
			break;
		}
	}
	cell.setColor(buttonPalette.selectedColor[0], buttonPalette.selectedColor[1], buttonPalette.selectedColor[2]);
}

function handleEditing(isUIElementPressed) {
	if (isEditing && isCheatingAllowed && !isUIElementPressed) {
		switch (placingType) {
			case placementType.spawn: {
				if (mouse.isLongPressDragging) {
					world.setSpawnOnPos(mouse.posX, mouse.posY, camera.posX, camera.posY, camera.zoomInRate);
				}
				break;
			}
			case placementType.goal: {
				if (mouse.isLongPressDragging) {
					world.setGoalOnPos(mouse.posX, mouse.posY, camera.posX, camera.posY, camera.zoomInRate);
				}
				break;
			}
			case placementType.aiGoal: {
				if (mouse.isLongPressDragging) {
					world.setAIGoalOnPos(mouse.posX, mouse.posY, camera.posX, camera.posY, camera.zoomInRate);
				}
				break;
			}
			case placementType.rectangle: {
				if (mouse.isLongPressDragging && !wasMousePressedForRectangle) {
					wasMousePressedForRectangle = true;
				} else if (!mouse.isPressed && wasMousePressedForRectangle) {
					let [startX, startY] = world.getCellIndexOnPos(mouse.actualPressStartPosX, mouse.actualPressStartPosY, camera.posX, camera.posY, camera.zoomInRate);
					let [endX, endY] = world.getCellIndexOnPos(mouse.pressEndPosX, mouse.pressEndPosY, camera.posX, camera.posY, camera.zoomInRate);
					startX = getClamped(startX, 0, world.width - 1);
					startY = getClamped(startY, 0, world.height - 1);
					endX = getClamped(endX, 0, world.width - 1);
					endY = getClamped(endY, 0, world.height - 1);
					let [minX, maxX] = [Math.min(startX, endX), Math.max(startX, endX) + 1];
					let [minY, maxY] = [Math.min(startY, endY), Math.max(startY, endY) + 1];
					for (let x = minX; x < maxX; ++x) {
						for (let y = minY; y < maxY; ++y) {
							let cellToModify = world.getCellOnIndex(x, y);
							modifyCell(cellToModify.cell);
						}
					}
					wasMousePressedForRectangle = false;
				}
				break;
			}
			case placementType.cell: {
				if (!mouse.isLongPressDragging) {
					break;
				}
				let [currentCellX, currentCellY] = world.getCellIndexOnPos(mouse.posX, mouse.posY, camera.posX, camera.posY, camera.zoomInRate);
				let [prevCellX, prevCellY] = world.getCellIndexOnPos(mouse.prevPosX, mouse.prevPosY, camera.posX, camera.posY, camera.zoomInRate);

				if (currentCellX != null && currentCellY != null && prevCellX != null && prevCellY != null) {
					let cumulativeShiftX = 0;
					let cumulativeShiftY = 0;

					function drawThickLine(x0, y0, x1, y1, thickness) {
						let dx = x1 - x0;
						let dy = y1 - y0;
						let length = Math.sqrt(dx * dx + dy * dy);

						if (length < 1) {
							drawFilledCircle(x0, y0, thickness / 2);
							return;
						}

						dx /= length;
						dy /= length;

						let rad = thickness / 2;
						let px = -dy * rad;
						let py = dx * rad;

						let p1x = x0 + px,
							p1y = y0 + py;
						let p2x = x0 - px,
							p2y = y0 - py;
						let p3x = x1 + px,
							p3y = y1 + py;
						let p4x = x1 - px,
							p4y = y1 - py;

						let minX = Math.min(p1x, p2x, p3x, p4x);
						let maxX = Math.max(p1x, p2x, p3x, p4x);
						let minY = Math.min(p1y, p2y, p3y, p4y);
						let maxY = Math.max(p1y, p2y, p3y, p4y);

						for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
							for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
								if (pointInThickLine(x, y, x0, y0, x1, y1, rad)) {
									modifyPointAndCheck(Math.round(x + cumulativeShiftX), Math.round(y + cumulativeShiftY));
								}
							}
						}
					}

					function pointInThickLine(x, y, x1, y1, x2, y2, r) {
						let dx = x2 - x1;
						let dy = y2 - y1;
						let length = Math.sqrt(dx * dx + dy * dy);

						if ((x - x1) * (x - x1) + (y - y1) * (y - y1) <= r * r) return true;

						if ((x - x2) * (x - x2) + (y - y2) * (y - y2) <= r * r) return true;

						if (length > 0) {
							let t = ((x - x1) * dx + (y - y1) * dy) / (length * length);
							if (t >= 0 && t <= 1) {
								let nearestX = x1 + t * dx;
								let nearestY = y1 + t * dy;
								return (x - nearestX) * (x - nearestX) + (y - nearestY) * (y - nearestY) <= r * r;
							}
						}

						return false;
					}

					function drawFilledCircle(centerX, centerY, radius) {
						for (let y = -radius; y <= radius; y++) {
							for (let x = -radius; x <= radius; x++) {
								if (x * x + y * y <= radius * radius) {
									modifyPointAndCheck(Math.round(centerX + x + cumulativeShiftX), Math.round(centerY + y + cumulativeShiftY));
								}
							}
						}
					}

					function modifyPointAndCheck(x, y) {
						let cellToModify = world.getCellOnIndex(x, y);
						if (cellToModify) {
							modifyCell(cellToModify.cell);
							if (cellToModify.isExpandedLeft !== null) {
								const movement = world.cellsSize * cellToModify.length;
								if (cellToModify.isExpandedLeft) {
									camera.posX += movement;
									player.posX += movement;
									cumulativeShiftX += placingRadius;
								} else {
									camera.posY += movement;
									player.posY += movement;
									cumulativeShiftY += placingRadius;
								}
							}
						}
					}

					drawThickLine(prevCellX, prevCellY, currentCellX, currentCellY, placingRadius * 2);
				}
				break;
			}

			default: {
				break;
			}
		}
	}

	if (isEditing && isUIElementPressed == false && !mouse.isLongPressDragging) {
		camera.moveWRTMouse(mouse, scaleRate);
	}
}

let hitAIIndex = -1;
let predictedHits = {};
const numHitsToPredict = 2;

function handleGameplay(dt) {
	if (isWatchingReplay) {
		const hit = replay.hits[replayHitIndex];
		if (player.isHitable && replayHitIndex < replay.hits.length && hit.occurredAtStepIndex == stepsCountPlay) {
			player.hit(hit.directionX, hit.directionY, hit.strengthRate * player.hitStrength);
			++replayHitIndex;
			updateIsWon();
			displayConsoleMessage(new Message("replayed " + Math.round(((replayHitIndex / replay.hits.length) * 100)) + "%", true, "replay %"));
		}
	} else {
		if (isPlayingAI && !player.isWon) {
			if (player.isHitable) {
				if (hitAIIndex == -1 || hitAIIndex >= predictedHits.inputs.length) {
					predictedHits = predictGameInputs(player, world, FIXED_TIMESTEP, numHitsToPredict);
					displayConsoleMessage(new Message("predicted " + numHitsToPredict + " hits", true));
					hitAIIndex = 0;
				}
				if (hitAIIndex < predictedHits.inputs.length) {
					const inputs = predictedHits.inputs[hitAIIndex];
					player.hit(inputs[0], inputs[1], inputs[2] * player.hitStrength);
					recordHit(inputs[0], inputs[1], inputs[2], stepsCountPlay);
					displayConsoleMessage(new Message("executed hit [" + (hitAIIndex + 1) + " / " + predictedHits.inputs.length + "]", true));
					++hitAIIndex;
					updateIsWon();
					isPlayingAI = false;
				}
			}
		}
	}

	if (player.isWon) {
		if (isPlayingAI && hitAIIndex < predictedHits.inputs.length) {
			const inputs = predictedHits.inputs[hitAIIndex];
			recordHit(inputs[0], inputs[1], inputs[2], stepsCountPlay);
			displayConsoleMessage(new Message("recorded winning hit", true));
			++hitAIIndex;
		}
	} else {
		const deathCallback = () => {
			camera.startAnimation();
		};
		radiusCheck = Math.max(player.radius + 3, Math.sqrt(player.radius / world.cellsSize + Math.max(Math.abs(player.speedX), Math.abs(player.speedY)) / world.cellsSize));
		player.move(dt, world.getClosestTileHitboxesToPos(player.posX, player.posY, radiusCheck), deathCallback);
		updateIsWon();
	}

	if (!isEditing) {
		let maxShift = (1 - camera.animationRate) * 10;
		camera.posX = player.posX - centerX / camera.zoomInRate + getRandomFloat(-maxShift, maxShift);
		camera.posY = player.posY - centerY / camera.zoomInRate + getRandomFloat(-maxShift, maxShift);
	}

	camera.updateAnimation();
}

function handleMousePress() {
	if (mouse.isPressed) {
		if (isEditing) {
			player.drawMarkerTo(ctx, centerX, centerY, camera.posX, camera.posY, camera.zoomInRate, scaleRate);
		} else if (!player.isWon && !isWatchingReplay && !isPlayingAI) {
			const potentialHitDirection = getNormalizedDirection(mouse.actualPressStartPosX - mouse.posX, mouse.actualPressStartPosY - mouse.posY);
			const potentialHitStrength = player.hitStrength * Math.min(getDistance(mouse.actualPressStartPosX, mouse.actualPressStartPosY, mouse.posX, mouse.posY) / (minDimension * 0.5), 1);
			player.drawTrajectoryOnContext(ctx, potentialHitDirection, potentialHitStrength, camera.posX, camera.posY, camera.zoomInRate, scaleRate);
		}
	}
}

function handleUIInteractions() {
	let isUIElementPressed = false;

	buttons.forEach(button => {
		if ((!isCheatingAllowed && button.isCheat) || (!isEditing && button.isEdit)) {
			return;
		}

		if (button.mouseInteract(mouse.posX, mouse.posY, mouse.actualPressStartPosX, mouse.actualPressStartPosY, mouse.isPressed)) {
			isUIElementPressed = true;
		}
	});

	editingbuttons.forEach(button => {
		if ((!isCheatingAllowed && button.isCheat) || (!isEditing && button.isEdit)) {
			return;
		}

		if (button.mouseInteract(mouse.posX, mouse.posY, mouse.actualPressStartPosX, mouse.actualPressStartPosY, mouse.isPressed)) {
			isUIElementPressed = true;
		}
	});

	return isUIElementPressed && mouse.isPressed;
}

function drawUI() {
	buttons.forEach(button => {
		if ((!isCheatingAllowed && button.isCheat) || (!isEditing && button.isEdit)) {
			return;
		}

		button.drawOnContext(ctx);
	});

	editingbuttons.forEach(button => {
		if ((!isCheatingAllowed && button.isCheat) || (!isEditing && button.isEdit)) {
			return;
		}

		button.drawOnContext(ctx);
	});

	gameConsole.drawOnContext(ctx);
}