import { getRandomInt, getClamped, getRandomFloat, isChance } from "/Math.js";

export class Cell {
	constructor() {
		this.isSolid = false;
		this.isKill = false;
		this.isLamp = false;
		this.isWin = false;
		this.color = "rgb(0,0,0)";
		this.text = null;
		this.fontName = "Monospace";
		this.fontSize = 5;
		this.fontColorR = 0;
		this.fontColorG = 0;
		this.fontColorB = 0;
		this.fontColor = "rgb(255,255,255)";
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.lampR = 0;
		this.lampG = 0;
		this.lampB = 0;
		this.direction = getRandomFloat(-1, 1);
		this.magnitude = 100;
		this.recentChangeSum = 0;
		this.maxDifferenceRate = 0.1;
		this.updateColorString();
	}

	updateLampColor(deltaTime) {
		if (this.isLamp) {
			const change = this.direction * this.magnitude * deltaTime;
			const maxDifference = 255 * this.maxDifferenceRate;

			this.lampR = getClamped(this.lampR + change, this.r - maxDifference, this.r + maxDifference);
			this.lampG = getClamped(this.lampG + change, this.g - maxDifference, this.g + maxDifference);
			this.lampB = getClamped(this.lampB + change, this.b - maxDifference, this.b + maxDifference);
			this.recentChangeSum += Math.abs(change);

			if (isChance(this.recentChangeSum * 0.01 / (255 * 0.2))) {
				this.direction = getRandomFloat(-1, 1);
				this.recentChangeSum = 0;
			}
		}
	}

	setColor(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.lampR = r;
		this.lampG = g;
		this.lampB = b;
		this.updateColorString();
	}
	setFontColor(r, g, b) {
		this.fontColorR = r;
		this.fontColorG = g;
		this.fontColorB = b;
		this.updateFontColorString();
	}

	randomizeColor() {
		this.setColor(getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255));
	}
	randomizeType() {
		this.isSolid = isChance(0.5);
		if (this.isSolid) {
			this.isKill = isChance(0.5);
		}
		this.isLamp = isChance(0.5);
		this.isWin = isChance(0.5) * !this.isKill;
	}

	updateColorString() {
		this.color = "rgb(" + Math.round(this.r) + "," + Math.round(this.g) + "," + Math.round(this.b) + ")";
	}
	updateFontColorString() {
		this.fontColor = "rgb(" + Math.round(this.fontColorR) + "," + Math.round(this.fontColorG) + "," + Math.round(this.fontColorB) + ")";
	}
}