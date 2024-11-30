import { getRandomFloat, getRandomInt, isChance, getRandomElement, getClamped, getDistance } from "/Math.js";

function getOscillatedColor(oscillationSeed) {
	const frequencyR = 0.3;
	const frequencyG = 0.5;
	const frequencyB = 0.7;

	const phaseR = oscillationSeed * frequencyR;
	const phaseG = oscillationSeed * frequencyG;
	const phaseB = oscillationSeed * frequencyB;

	const r = Math.floor((Math.sin(phaseR) + 1) * 127.5);
	const g = Math.floor((Math.sin(phaseG) + 1) * 127.5);
	const b = Math.floor((Math.sin(phaseB) + 1) * 127.5);

	return [r, g, b];
}
export function rainbows(grid, startY, endY) {
	const width = grid[0].length;
	const height = grid.length;
	const scaleRate = (300 + 1500) * 0.5 / (width + height) * 0.5;

	const directions = [
		[-1, 0],
		[0, -1],
		[1, 0],
		[0, 1]
	];
	const numWorms = 50 * scaleRate;
	for (let i = 0; i < numWorms; ++i) {
		let pixelX = getRandomInt(0, width - 1);
		let pixelY = getRandomInt(startY, endY);

		let direction;
		const numSegments = getRandomInt(6, 12);
		for (let segmentIndex = 0; segmentIndex < numSegments; ++segmentIndex) {
			direction = getRandomElement(directions);
			const length = getRandomInt(8, 32);
			for (let segmentPixelIndex = 0; segmentPixelIndex < length; ++segmentPixelIndex) {
				if (isChance(0.4)) {
					grid[pixelY][pixelX].setColor(...getOscillatedColor(numSegments + segmentPixelIndex + pixelX * pixelY));
					grid[pixelY][pixelX].lamp();
				}

				pixelX = getClamped(pixelX + direction[0], 0, width - 1);
				pixelY = getClamped(pixelY + direction[1], 0, height - 1);
			}
		}
	}
}

export function winBottom(grid) {
	const width = grid[0].length;
	const buttomY = grid.length - 1;

	for (let x = 0; x < width; ++x) {
		let cell = grid[buttomY][x];
		cell.setColor(0, 255, 0);
		cell.solid();
	}
}

export function bounds(grid) {
	const width = grid[0].length;
	const height = grid.length;
	const scaleRateX = width / 300;
	const scaleRateY = height / 3500;

	const maxWidth = 0.05;

	function generateWall(isLeftWall) {
		const randomPoints = [];

		for (let y = 0; y < height; ++y) {
			if (isChance(0.1) || y == 0 || y == height - 1) {
				randomPoints.push({ y, x: getRandomInt(1, Math.floor(width * maxWidth)) });
			}
		}

		if (randomPoints[0].y != 0) randomPoints.unshift({ y: 0, x: getRandomInt(1, Math.floor(width * maxWidth)) });
		if (randomPoints[randomPoints.length - 1].y != height - 1) randomPoints.push({ y: height - 1, x: getRandomInt(1, Math.floor(width * maxWidth)) });

		for (let i = 0; i < randomPoints.length - 1; ++i) {
			const currentPoint = randomPoints[i];
			const nextPoint = randomPoints[i + 1];

			for (let y = currentPoint.y; y <= nextPoint.y; ++y) {
				const progress = (y - currentPoint.y) / (nextPoint.y - currentPoint.y);
				const x = Math.round(currentPoint.x + progress * (nextPoint.x - currentPoint.x));

				if (isLeftWall) {
					for (let fillX = 0; fillX < x; ++fillX) {
						grid[y][fillX].lamp();
						grid[y][fillX].randomizeColor();
					}
				} else {
					for (let fillX = width - 1; fillX > width - 1 - x; fillX--) {
						grid[y][fillX].lamp();
						grid[y][fillX].randomizeColor();
					}
				}
			}
		}
	}

	generateWall(true);
	generateWall(false);
}

export function clouds(grid) {
	const width = grid[0].length - 1;
	const height = grid.length - 1;
	const scaleRateX = width / 300;
	const scaleRateY = height / 3500;
	const originY = height * 0.02;

	function fillCircle(grid, x0, y0, radius) {
		let x = radius;
		let y = 0;
		let decisionOver2 = 1 - x;

		while (y <= x) {
			drawLines(grid, x0, y0, x, y, radius);
			++y;

			if (decisionOver2 <= 0) {
				decisionOver2 += 2 * y + 1;
			} else {
				x--;
				decisionOver2 += 2 * (y - x) + 1;
			}
		}
	}

	function drawLines(grid, x0, y0, x, y, radius) {
		drawHorizontalLine(grid, x0 - x, x0 + x, y0 + y, x0, y0, radius);
		drawHorizontalLine(grid, x0 - x, x0 + x, y0 - y, x0, y0, radius);
		drawHorizontalLine(grid, x0 - y, x0 + y, y0 + x, x0, y0, radius);
		drawHorizontalLine(grid, x0 - y, x0 + y, y0 - x, x0, y0, radius);

		if (x != y) {
			drawHorizontalLine(grid, x0 - x + 1, x0 + x - 1, y0 + y - 1, x0, y0, radius);
			drawHorizontalLine(grid, x0 - x + 1, x0 + x - 1, y0 - y + 1, x0, y0, radius);
			if (x - 1 != y) {
				drawHorizontalLine(grid, x0 - y + 1, x0 + y - 1, y0 + x - 1, x0, y0, radius);
				drawHorizontalLine(grid, x0 - y + 1, x0 + y - 1, y0 - x + 1, x0, y0, radius);
			}
		}
	}

	function drawHorizontalLine(grid, x1, x2, y, centerX, centerY, radius) {
		for (let x = x1; x <= x2; ++x) {
			if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
				grid[y][x].solid();

				const dx = x - centerX;
				const dy = y - centerY;
				const distance = getDistance(centerX, centerY, x, y);
				if (x >= centerX && y <= centerY && distance > radius * 0.8) {
					const brightness = isChance(0.2) ? getRandomInt(150, 165) : getRandomInt(185, 255);
					grid[y][x].setColor(brightness, brightness, brightness);
				} else {
					grid[y][x].setColor(255, 255, 255);
				}
			}
		}
	}


	for (let cloudIndex = 0; cloudIndex < 16; ++cloudIndex) {
		let radius = getRandomInt(6 * scaleRateX, 12 * scaleRateX);
		let x = getRandomInt(0, width);
		let y = getRandomInt(originY - 50, originY + 50);

		for (let step = 0; step < 12; ++step) {
			const speedX = getRandomInt(-20 * scaleRateX, 20 * scaleRateX);
			const speedY = getRandomInt(-8 * scaleRateY, 8 * scaleRateY);
			x += speedX;
			y += speedY;
			fillCircle(grid, x, y, radius);
		}
	}
}

function generateSections(grid, functions, spacing) {
	const sectionsHeight = Math.floor(grid.length / (functions.length + spacing));
	functions.forEach((fn, index) => {
		const startY = Math.max(grid.length - (index + 1) * sectionsHeight, 0);
		const endY = grid.length - index * sectionsHeight;
		fn(grid, startY, endY);
	});
}
export function generate(grid) {
	const sections = [
        rainbows,
    ];
	generateSections(grid, sections, 16);

	bounds(grid);
}