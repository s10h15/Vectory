import { getClamped, getDistance, getRandomFloat, getRandomInt, makePath, setRandomizerSeed, getRandomString, getSplittedString, downloadImageAsPNG, getCanvasElementImage, isChance } from "/Math.js";
import { Cell } from "/Game/cell.js";

import { encodeValue, decodeValue, createBinaryFile, readBinaryFile } from "/binary.js";

const twoPI = Math.PI * 2;
const textRangeCells = 10;

import { generate, winBottom } from "/Game/worldGenerators.js";

export class World {
	constructor() {
		this.grid = [];
		this.width = 0;
		this.height = 0;
		this.cellsSize = 10;
		this.spawnCellIndexX = 0;
		this.spawnCellIndexY = 0;
		this.aiGoalCellIndexX = 0;
		this.aiGoalCellIndexY = 0;
		this.seed = "D.O.C.";
		this.scaleRate = this.cellsSize / 10;
	}

	generate() {
		setRandomizerSeed(this.seed);

		this.setSize(300, 1500);
		generate(this.grid);

		/*function isCellWalkableFn(cell) {
			return !cell.isSolid;
		}

		function clearCellFn(cell) {
			if (cell.isSolid) {
				cell.setColor(25, 25, 25);
				cell.empty();
			}
		}*/
		this.spawnCellIndexX = this.width * 0.5;
		this.spawnCellIndexY = this.height - 2;
		this.goalCellIndexX = this.width * 0.5;
		this.goalCellIndexY = 0;
		/*makePath(
			this.grid,
			isCellWalkableFn,
			clearCellFn,
			1,
			this.spawnCellIndexX,
			this.spawnCellIndexY,
			this.goalCellIndexX,
			this.goalCellIndexY
		);*/

		winBottom(this.grid);
	}

	compress() {
		const isEmptyCell = (cell) => cell.r < 5 && cell.g < 5 && cell.b < 5 && !cell.isSolid && !cell.isLamp && !cell.isKill;

		const removeColumn = (index) => {
			for (let y = 0; y < this.height; ++y) {
				this.grid[y].splice(index, 1);
			}
			--this.width;
			if (this.spawnCellIndexX > index) --this.spawnCellIndexX;
			if (this.goalCellIndexX > index) --this.goalCellIndexX;
			if (this.aiGoalCellIndexX > index) --this.aiGoalCellIndexX;
		};

		const removeRow = (index) => {
			this.grid.splice(index, 1);
			--this.height;
			if (this.spawnCellIndexY > index) --this.spawnCellIndexY;
			if (this.goalCellIndexY > index) --this.goalCellIndexY;
			if (this.aiGoalCellIndexY > index) --this.aiGoalCellIndexY;
		};

		for (let x = 0; x < this.width; ++x) {
			if (this.grid.every(row => isEmptyCell(row[x]))) {
				removeColumn(x);
				--x;
			} else {
				break;
			}
		}

		for (let x = this.width - 1; x >= 0; --x) {
			if (this.grid.every(row => isEmptyCell(row[x]))) {
				removeColumn(x);
			} else {
				break;
			}
		}

		for (let y = 0; y < this.height; ++y) {
			if (this.grid[y].every(isEmptyCell)) {
				removeRow(y);
				--y;
			} else {
				break;
			}
		}

		for (let y = this.height - 1; y >= 0; --y) {
			if (this.grid[y].every(isEmptyCell)) {
				removeRow(y);
			} else {
				break;
			}
		}
	}

	downloadSnapshot() {
		if (this.width == 0 || this.height == 0) {
			return;
		}

		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = this.width;
		tempCanvas.height = this.height;
		const ctx = tempCanvas.getContext('2d');

		const imageData = ctx.createImageData(this.width, this.height);
		const data = imageData.data;
		for (let y = 0; y < this.height; ++y) {
			for (let x = 0; x < this.width; ++x) {
				const cell = this.grid[y][x];
				const index = (y * this.width + x) * 4;
				data[index] = cell.r;
				data[index + 1] = cell.g;
				data[index + 2] = cell.b;
				data[index + 3] = 255;
			}
		}
		ctx.putImageData(imageData, 0, 0);

		const img = getCanvasElementImage(tempCanvas);
		downloadImageAsPNG(img, "vectory_snapshot");
	}

	loadFromRawSave(save) {
		const [dimensions, grid, spawnPos, cellsSize] = save;

		this.setSize(dimensions[0], dimensions[1]);
		for (let y = 0; y < this.height; ++y) {
			for (let x = 0; x < this.width; ++x) {
				const cellData = grid[y][x];

				this.grid[y][x].setColor(cellData[0], cellData[1], cellData[2]);
				this.grid[y][x].isSolid = cellData[3];
				this.grid[y][x].isKill = cellData[4];
				this.grid[y][x].isLamp = cellData[5];
				this.grid[y][x].text = cellData[6] || null;
				this.grid[y][x].fontName = cellData[7] || "Monospace";
				this.grid[y][x].fontSize = cellData[8] || 5;
				this.grid[y][x].setFontColor(cellData[9] || 255, cellData[10] || 255, cellData[11] || 255);
				this.grid[y][x].isWin = cellData[12];
			}
		}

		this.spawnCellIndexX = spawnPos[0];
		this.spawnCellIndexY = spawnPos[1];

		if (save[3].length === 2) {
			this.cellsSize = 10;
		} else {
			this.cellsSize = cellsSize;
		}
	}
	getRawSave() {
		const gridData = this.grid.map(row =>
			row.map(cell => [
				cell.r,
				cell.g,
				cell.b,
				cell.isSolid,
				cell.isKill,
				cell.isLamp,
				cell.text,
				cell.fontName,
				cell.fontSize,
				cell.fontColorR,
				cell.fontColorG,
				cell.fontColorB,
				cell.isWin
            ])
		);

		const spawnData = [this.spawnCellIndexX, this.spawnCellIndexY];

		return [[this.width, this.height], gridData, spawnData, this.cellsSize];
	}
	debug() {
		const save = this.getSave();
		this.loadFromSave(save);
	}

	empty() {
		this.setSize(600, 6000);
	}

	randomizeSeed() {
		this.seed = getRandomString(6);
	}

	generateTemplate(width, height) {
		this.setSize(width, height);
		this.spawnCellIndexX = 0;
		this.spawnCellIndexY = 0;
		this.goalCellIndexX = 0;
		this.goalCellIndexY = 0;
		this.aiGoalCellIndexX = 0;
		this.aiGoalCellIndexY = 0;
	}

	generateDebug() {
		this.setSize(64, 64);
		this.spawnCellIndexX = this.width * 0.5;
		this.spawnCellIndexY = this.height * 0.5;
		this.goalCellIndexX = this.spawnCellIndexX + 1;
		this.goalCellIndexY = this.spawnCellIndexY;
		for (let y = 0; y < this.height; ++y) {
			for (let x = 0; x < this.width; ++x) {
				this.grid[y][x].randomizeColor();
				this.grid[y][x].randomizeType();
			}
		}
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.grid = new Array(height);
		for (let y = 0; y < height; ++y) {
			this.grid[y] = new Array(width);
			for (let x = 0; x < width; ++x) {
				this.grid[y][x] = new Cell();
			}
		}
	}

	getCellIndexOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate) {
		const gridIndexX = Math.floor(
			cameraPosX / this.cellsSize + mousePosX / (this.cellsSize * zoomInRate)
		);
		const gridIndexY = Math.floor(
			cameraPosY / this.cellsSize + mousePosY / (this.cellsSize * zoomInRate)
		);
		return [gridIndexX, gridIndexY];
	}
	getCellOnIndex(gridIndexX, gridIndexY) {
		let expandLeft = 0,
			expandRight = 0,
			expandTop = 0,
			expandBottom = 0;

		if (gridIndexX < 0) expandLeft = Math.abs(gridIndexX);
		if (gridIndexY < 0) expandTop = Math.abs(gridIndexY);
		if (gridIndexX >= this.width) expandRight = gridIndexX - this.width + 1;
		if (gridIndexY >= this.height) expandBottom = gridIndexY - this.height + 1;

		let expandedLeftOrTop = null;
		let expandedLength = 0;

		if (expandLeft > 0) {
			expandedLeftOrTop = true;
			expandedLength = expandLeft;
		} else if (expandTop > 0) {
			expandedLeftOrTop = false;
			expandedLength = expandTop;
		}

		if (expandLeft > 0 || expandRight > 0 || expandTop > 0 || expandBottom > 0) {
			this.expandGrid(expandLeft, expandRight, expandTop, expandBottom);
		}

		const adjustedX = gridIndexX + expandLeft;
		const adjustedY = gridIndexY + expandTop;

		return {
			cell: this.grid[adjustedY][adjustedX],
			isExpandedLeft: expandedLeftOrTop,
			length: expandedLength
		};
	}
	getCellOnMousePos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate) {
		const [gridIndexX, gridIndexY] = this.getCellIndexOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate);

		if (gridIndexX < 0 || gridIndexY < 0 || gridIndexX >= this.width || gridIndexY >= this.height) {
			return null;
		}
		return this.grid[gridIndexY][gridIndexX];
	}
	expandGrid(left, right, top, bottom) {
		const newWidth = this.width + left + right;
		const newHeight = this.height + top + bottom;
		const newGrid = new Array(newHeight);

		for (let y = 0; y < newHeight; ++y) {
			newGrid[y] = new Array(newWidth);
			for (let x = 0; x < newWidth; ++x) {
				if (y < top || y >= top + this.height || x < left || x >= left + this.width) {
					newGrid[y][x] = new Cell();
				} else {
					newGrid[y][x] = this.grid[y - top][x - left];
				}
			}
		}

		this.grid = newGrid;
		this.width = newWidth;
		this.height = newHeight;
		this.spawnCellIndexX += left;
		this.spawnCellIndexY += top;
		this.goalCellIndexX += left;
		this.goalCellIndexY += top;
		this.aiGoalCellIndexX += left;
		this.aiGoalCellIndexY += top;
	}
	setSpawnOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate) {
		const [gridIndexX, gridIndexY] = this.getCellIndexOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate);
		this.spawnCellIndexX = gridIndexX;
		this.spawnCellIndexY = gridIndexY;
	}
	setGoalOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate) {
		const [gridIndexX, gridIndexY] = this.getCellIndexOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate);
		this.goalCellIndexX = gridIndexX;
		this.goalCellIndexY = gridIndexY;
	}
	setAIGoalOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate) {
		const [gridIndexX, gridIndexY] = this.getCellIndexOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate);
		this.aiGoalCellIndexX = gridIndexX;
		this.aiGoalCellIndexY = gridIndexY;
	}

	fillCellsOnMousePos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate, color, isSolid, isKill, isLamp, isWin, skipRate, isRainbow, minRainbow, maxRainbow) {
		const [gridIndexX, gridIndexY] = this.getCellIndexOnPos(mousePosX, mousePosY, cameraPosX, cameraPosY, zoomInRate);
		if (gridIndexX < 0 || gridIndexY < 0 || gridIndexX >= this.width || gridIndexY >= this.height) {
			return;
		}

		const targetCell = this.grid[gridIndexY][gridIndexX];
		const targetColor = { r: targetCell.r, g: targetCell.g, b: targetCell.b };

		let filledCells = 0;
		const maxCells = 1000000;

		const queue = [[gridIndexX, gridIndexY]];
		const visited = new Set();

		while (queue.length > 0 && filledCells <= maxCells) {
			const [x, y] = queue.shift();
			const cellKey = x + "," + y;

			if (x < 0 || y < 0 || x >= this.width || y >= this.height || visited.has(cellKey)) {
				continue;
			}

			const cell = this.grid[y][x];

			if (cell.r !== targetColor.r || cell.g !== targetColor.g || cell.b !== targetColor.b) {
				continue;
			}

			visited.add(cellKey);

			if (isChance(skipRate)) {
				if (isRainbow) {
					cell.setColor(getRandomInt(minRainbow, maxRainbow), getRandomInt(minRainbow, maxRainbow), getRandomInt(minRainbow, maxRainbow));
				} else {
					cell.setColor(color[0], color[1], color[2]);
				}
				cell.isSolid = isSolid;
				cell.isKill = isKill;
				cell.isLamp = isLamp;
				cell.isWin = isWin;
			}

			++filledCells;

			queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
		}
	}

	getClosestTileHitboxesToPos(x, y, range) {
		let hitboxes = [];

		const gridStartIndexX = Math.floor(x / this.cellsSize - range);
		const gridStartIndexY = Math.floor(y / this.cellsSize - range);
		const gridEndIndexX = Math.ceil(gridStartIndexX + range * 2);
		const gridEndIndexY = Math.ceil(gridStartIndexY + range * 2);

		for (let y = gridStartIndexY; y < gridEndIndexY; ++y) {
			for (let x = gridStartIndexX; x < gridEndIndexX; ++x) {
				let isSolid = true;
				let isKill = false;
				let isWin = false;

				if (x > -1 && x < this.width && y > -1 && y < this.height) {
					const cell = this.grid[y][x];
					isSolid = cell.isSolid;
					isKill = cell.isKill;
					isWin = cell.isWin;
				}

				if (isSolid) {
					hitboxes.push({
						posX: x * this.cellsSize,
						posY: y * this.cellsSize,
						sizeX: this.cellsSize,
						sizeY: this.cellsSize,
						isKill,
						isWin
					});
				}
			}
		}

		return hitboxes;
	}

	drawOnContext(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, isDebug, deltaTime) {
		if (isDebug) {
			this.drawUsingFillRectWithMarkers(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime);
		} else {
			this.drawUsingImageData(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime);
		}
		/*const threshold = 0.3;

		if (zoomInRate < threshold) {
			this.drawUsingImageData(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime);
		} else {
			if (isDebug) {
				this.drawUsingFillRectWithMarkers(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime);
			} else {
				this.drawUsingFillRect(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime);
			}
		}*/
	}
	drawUsingFillRectWithMarkers(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime) {
		const cellSizeWithZoom = this.cellsSize * zoomInRate;
		const halfCell = cellSizeWithZoom * 0.5;
		const halfHalfCell = halfCell * 0.5;

		let gridIndexWithinCameraStartX = Math.floor(offsetX / this.cellsSize);
		let gridIndexWithinCameraStartY = Math.floor(offsetY / this.cellsSize);
		let gridIndexWithinCameraEndX = Math.ceil(gridIndexWithinCameraStartX + ctxWidth / cellSizeWithZoom) + 1;
		let gridIndexWithinCameraEndY = Math.ceil(gridIndexWithinCameraStartY + ctxHeight / cellSizeWithZoom) + 1;

		for (let y = gridIndexWithinCameraStartY; y < gridIndexWithinCameraEndY; ++y) {
			for (let x = gridIndexWithinCameraStartX; x < gridIndexWithinCameraEndX; ++x) {
				let isInBounds = x >= 0 && y >= 0 && x < this.width && y < this.height;
				let rectPosX = x * cellSizeWithZoom - offsetX * zoomInRate;
				let rectPosY = y * cellSizeWithZoom - offsetY * zoomInRate;

				if (isInBounds) {
					const cell = this.grid[y][x];
					if (cell.r != 0 || cell.g != 0 || cell.b != 0) {
						ctx.fillStyle = cell.color;
						ctx.fillRect(rectPosX, rectPosY, cellSizeWithZoom + 1, cellSizeWithZoom + 1);
					}

					if (cell.isSolid) {
						const squareSize = halfCell;
						const squareOffsetX = (cellSizeWithZoom - squareSize) * 0.5;
						const squareOffsetY = (cellSizeWithZoom - squareSize) * 0.5;
						const squarePosX = rectPosX + squareOffsetX;
						const squarePosY = rectPosY + squareOffsetY;

						ctx.fillStyle = "white";
						ctx.fillRect(squarePosX, squarePosY, squareSize, squareSize);
					}
					if (cell.isKill) {
						const lineWidth = 4 * zoomInRate * this.scaleRate;
						ctx.strokeStyle = "red";
						ctx.lineWidth = lineWidth;

						ctx.beginPath();
						ctx.moveTo(rectPosX, rectPosY);
						ctx.lineTo(rectPosX + cellSizeWithZoom, rectPosY + cellSizeWithZoom);
						ctx.moveTo(rectPosX + cellSizeWithZoom, rectPosY);
						ctx.lineTo(rectPosX, rectPosY + cellSizeWithZoom);
						ctx.stroke();
					}
					if (cell.isLamp) {
						const plusThickness = cellSizeWithZoom * 0.2;
						const plusThickness05 = plusThickness * 0.5;
						const plusCenterX = rectPosX + halfCell;
						const plusCenterY = rectPosY + halfCell;
						const plusSize = halfHalfCell;

						ctx.fillStyle = "yellow";
						ctx.fillRect(plusCenterX - plusThickness05, plusCenterY - plusSize, plusThickness, 2 * plusSize);
						ctx.fillRect(plusCenterX - plusSize, plusCenterY - plusThickness05, 2 * plusSize, plusThickness);
					}
					if (cell.text !== null) {
						const circleCenterX = rectPosX + halfCell;
						const circleCenterY = rectPosY + halfCell;
						const circleRadius = halfHalfCell;

						ctx.strokeStyle = "white";
						ctx.lineWidth = zoomInRate;
						ctx.beginPath();
						ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
						ctx.stroke();
					}
					if (cell.isWin) {
						ctx.fillStyle = "rgb(0,255,179)";
						ctx.beginPath();
						ctx.arc(rectPosX + halfCell, rectPosY + halfCell, halfHalfCell, 0, twoPI);
						ctx.fill();
					}
				} else {
					const closestX = getClamped(x, 0, this.width - 1);
					const closestY = getClamped(y, 0, this.height - 1);
					const distance = getDistance(x, y, closestX, closestY);
					let brightness;
					if (distance < 2) {
						brightness = Math.random() * 89;
					} else {
						brightness = getClamped((distance / 100) * 255, 0, 255) * Math.random();
					}
					ctx.fillStyle = ctx.fillStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")";
					ctx.fillRect(rectPosX, rectPosY, cellSizeWithZoom + 1, cellSizeWithZoom + 1);
				}
			}
		}

		const endX = gridIndexWithinCameraEndX + textRangeCells;
		const endY = gridIndexWithinCameraEndY + textRangeCells;
		for (let y = gridIndexWithinCameraStartY - textRangeCells; y < endY; ++y) {
			for (let x = gridIndexWithinCameraStartX - textRangeCells; x < endX; ++x) {
				let isInBounds = x >= 0 && y >= 0 && x < this.width && y < this.height;
				let rectPosX = x * cellSizeWithZoom - offsetX * zoomInRate;
				let rectPosY = y * cellSizeWithZoom - offsetY * zoomInRate;

				if (isInBounds) {
					const cell = this.grid[y][x];
					if (cell.text !== null) {
						ctx.font = cell.fontSize * zoomInRate + "px " + cell.fontName;
						ctx.fillStyle = cell.fontColor;
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";
						const textX = rectPosX + cellSizeWithZoom * 0.5;
						const textY = rectPosY + cellSizeWithZoom * 0.5;
						ctx.fillText(cell.text, textX, textY);
					}
				}
			}
		}

		ctx.fillStyle = "white";
		const spawnX = this.spawnCellIndexX * cellSizeWithZoom - offsetX * zoomInRate + halfCell;
		const spawnY = this.spawnCellIndexY * cellSizeWithZoom - offsetY * zoomInRate + halfCell;
		ctx.beginPath();
		ctx.arc(spawnX, spawnY, halfCell * 0.5, 0, twoPI);
		ctx.fill();
	}
	drawUsingFillRect(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime) {
		const cellSizeWithZoom = this.cellsSize * zoomInRate;

		let gridIndexWithinCameraStartX = Math.floor(offsetX / this.cellsSize);
		let gridIndexWithinCameraStartY = Math.floor(offsetY / this.cellsSize);
		let gridIndexWithinCameraEndX = Math.ceil(gridIndexWithinCameraStartX + ctxWidth / cellSizeWithZoom) + 1;
		let gridIndexWithinCameraEndY = Math.ceil(gridIndexWithinCameraStartY + ctxHeight / cellSizeWithZoom) + 1;

		for (let y = gridIndexWithinCameraStartY; y < gridIndexWithinCameraEndY; ++y) {
			for (let x = gridIndexWithinCameraStartX; x < gridIndexWithinCameraEndX; ++x) {
				let isInBounds = x >= 0 && y >= 0 && x < this.width && y < this.height;
				let rectPosX = x * cellSizeWithZoom - offsetX * zoomInRate;
				let rectPosY = y * cellSizeWithZoom - offsetY * zoomInRate;

				if (isInBounds) {
					const cell = this.grid[y][x];
					cell.updateLampColor(deltaTime);
					if (cell.lampR != 0 || cell.lampG != 0 || cell.lampB != 0) {
						ctx.fillStyle = cell.color;
						ctx.fillRect(rectPosX, rectPosY, cellSizeWithZoom + 1, cellSizeWithZoom + 1);
					}
				} else {
					const closestX = getClamped(x, 0, this.width - 1);
					const closestY = getClamped(y, 0, this.height - 1);
					const distance = getDistance(x, y, closestX, closestY);
					let brightness;
					if (distance < 2) {
						brightness = Math.random() * 89;
					} else {
						brightness = getClamped((distance / 100) * 255, 0, 255) * Math.random();
					}
					ctx.fillStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")";
					ctx.fillRect(rectPosX, rectPosY, cellSizeWithZoom + 1, cellSizeWithZoom + 1);
				}
			}
		}

		const endX = gridIndexWithinCameraEndX + textRangeCells;
		const endY = gridIndexWithinCameraEndY + textRangeCells;
		for (let y = gridIndexWithinCameraStartY - textRangeCells; y < endY; ++y) {
			for (let x = gridIndexWithinCameraStartX - textRangeCells; x < endX; ++x) {
				let isInBounds = x >= 0 && y >= 0 && x < this.width && y < this.height;
				let rectPosX = x * cellSizeWithZoom - offsetX * zoomInRate;
				let rectPosY = y * cellSizeWithZoom - offsetY * zoomInRate;

				if (isInBounds) {
					const cell = this.grid[y][x];
					if (cell.text !== null) {
						ctx.font = cell.fontSize * zoomInRate + "px " + cell.fontName;
						ctx.fillStyle = cell.fontColor;
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";
						const textX = rectPosX + cellSizeWithZoom * 0.5;
						const textY = rectPosY + cellSizeWithZoom * 0.5;
						ctx.fillText(cell.text, textX, textY);
					}
				}
			}
		}

		ctx.fillStyle = "white";
		const halfCell = cellSizeWithZoom * 0.5;
		const spawnX = this.spawnCellIndexX * cellSizeWithZoom - offsetX * zoomInRate + halfCell;
		const spawnY = this.spawnCellIndexY * cellSizeWithZoom - offsetY * zoomInRate + halfCell;
		ctx.beginPath();
		ctx.arc(spawnX, spawnY, halfCell * 0.5, 0, twoPI);
		ctx.fill();
	}
	drawUsingImageData(ctx, offsetX, offsetY, zoomInRate, ctxWidth, ctxHeight, deltaTime) {
		const cellSizeWithZoom = this.cellsSize * zoomInRate;

		let gridIndexWithinCameraStartX = Math.floor(offsetX / this.cellsSize);
		let gridIndexWithinCameraStartY = Math.floor(offsetY / this.cellsSize);
		let gridIndexWithinCameraEndX = Math.ceil(gridIndexWithinCameraStartX + ctxWidth / cellSizeWithZoom) + 1;
		let gridIndexWithinCameraEndY = Math.ceil(gridIndexWithinCameraStartY + ctxHeight / cellSizeWithZoom) + 1;

		const imageData = ctx.createImageData(ctxWidth, ctxHeight);
		const data = imageData.data;

		for (let y = gridIndexWithinCameraStartY; y < gridIndexWithinCameraEndY; ++y) {
			for (let x = gridIndexWithinCameraStartX; x < gridIndexWithinCameraEndX; ++x) {
				let isInBounds = x >= 0 && y >= 0 && x < this.width && y < this.height;
				let rectPosX = x * cellSizeWithZoom - offsetX * zoomInRate;
				let rectPosY = y * cellSizeWithZoom - offsetY * zoomInRate;

				if (isInBounds) {
					const cell = this.grid[y][x];
					cell.updateLampColor(deltaTime);

					const startX = Math.max(0, Math.floor(rectPosX));
					const startY = Math.max(0, Math.floor(rectPosY));
					const endX = Math.min(ctxWidth, Math.ceil(rectPosX + cellSizeWithZoom));
					const endY = Math.min(ctxHeight, Math.ceil(rectPosY + cellSizeWithZoom));

					for (let pixelY = startY; pixelY < endY; ++pixelY) {
						for (let pixelX = startX; pixelX < endX; ++pixelX) {
							const index = (pixelY * ctxWidth + pixelX) * 4;
							data[index] = cell.lampR;
							data[index + 1] = cell.lampG;
							data[index + 2] = cell.lampB;
							data[index + 3] = 255;
						}
					}
				} else {
					const closestX = getClamped(x, 0, this.width - 1);
					const closestY = getClamped(y, 0, this.height - 1);
					const distance = getDistance(x, y, closestX, closestY);
					let brightness;
					if (distance < 2) {
						brightness = Math.random() * 89;
					} else {
						brightness = getClamped((distance / 100) * 255, 0, 255) * Math.random();
					}

					const startX = Math.max(0, Math.floor(rectPosX));
					const startY = Math.max(0, Math.floor(rectPosY));
					const endX = Math.min(ctxWidth, Math.ceil(rectPosX + cellSizeWithZoom));
					const endY = Math.min(ctxHeight, Math.ceil(rectPosY + cellSizeWithZoom));

					for (let pixelY = startY; pixelY < endY; ++pixelY) {
						for (let pixelX = startX; pixelX < endX; ++pixelX) {
							const index = (pixelY * ctxWidth + pixelX) * 4;
							data[index] = brightness;
							data[index + 1] = brightness;
							data[index + 2] = brightness;
							data[index + 3] = 255;
						}
					}
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);

		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		const endX = gridIndexWithinCameraEndX + textRangeCells;
		const endY = gridIndexWithinCameraEndY + textRangeCells;
		for (let y = gridIndexWithinCameraStartY - textRangeCells; y < endY; ++y) {
			for (let x = gridIndexWithinCameraStartX - textRangeCells; x < endX; ++x) {
				let isInBounds = x >= 0 && y >= 0 && x < this.width && y < this.height;
				let rectPosX = x * cellSizeWithZoom - offsetX * zoomInRate;
				let rectPosY = y * cellSizeWithZoom - offsetY * zoomInRate;

				if (isInBounds) {
					const cell = this.grid[y][x];
					if (cell.text !== null) {
						ctx.font = cell.fontSize * zoomInRate + "px " + cell.fontName;
						ctx.fillStyle = cell.fontColor;
						const textX = rectPosX + cellSizeWithZoom * 0.5;
						const textY = rectPosY + cellSizeWithZoom * 0.5;
						ctx.fillText(cell.text, textX, textY);
					}
				}
			}
		}

		ctx.fillStyle = "white";
		const halfCell = cellSizeWithZoom * 0.5;
		const spawnX = this.spawnCellIndexX * cellSizeWithZoom - offsetX * zoomInRate + halfCell;
		const spawnY = this.spawnCellIndexY * cellSizeWithZoom - offsetY * zoomInRate + halfCell;
		ctx.beginPath();
		ctx.arc(spawnX, spawnY, halfCell * 0.5, 0, twoPI);
		ctx.fill();
	}
}