import { getClamped, getTextMetrics } from "/Math.js";

const twoPI = Math.PI * 2;

export const buttonType = {
	button: 0,
	palette: 1,
	slider: 2
};
export class Button {
	constructor(
		posX = 0,
		posY = 0,
		width = 0,
		height = 0,
		scaleRate = 0,
		text = "",
		buttonToAlignWith = null,
		alignmentDirectionIndex = null,
		spacing = 0,
		type = buttonType.button,
		isCheat = false,
		isEdit = false,
		onClickFn = () => {},
		getNewTextFn = () => this.text
	) {
		this.posX = posX;
		this.posY = posY;
		this.sizeX = width * scaleRate;
		this.sizeY = height * scaleRate;
		this.endX = this.posX + this.sizeX;
		this.endY = this.posY + this.sizeY;

		this.color = "rgb(255,255,255,0.2)";
		this.textColor = "white";
		this.fontName = "Monospace";
		this.text = text;
		this.getNewTextFn = getNewTextFn;

		this.onClick = onClickFn;
		this.isClickable = true;
		this.isClickedWhileHovering = false;
		this.nextFrameIsClick = false;

		this.type = type;
		this.paletteResolution = 18;
		this.blockSizeX = this.sizeX / this.paletteResolution;
		this.blockSizeY = this.sizeY / this.paletteResolution;
		this.selectedX = 0;
		this.selectedY = 0;
		this.selectedColor = [0, 0, 0];
		this.selectedHue = 0;
		this.selectedSaturation = 1;
		this.selectedLightness = 0.5;
		this.selectedLineWidth = 2.5 * scaleRate;
		this.selectedRadius = Math.min(width, height) * 0.01 + this.selectedLineWidth * 0.5;
		this.selectedColorWidth = Math.ceil(32 * scaleRate);

		this.sliderWidth = 45 * scaleRate;
		this.sliderRate = 0.5;
		this.sliderColor = "gray";

		if (buttonToAlignWith != null && alignmentDirectionIndex != null && spacing != null) {
			this.alignToButton(buttonToAlignWith, alignmentDirectionIndex, spacing, width, height, scaleRate);
		}

		this.isCheat = isCheat;
		this.isEdit = isEdit;

		switch (type) {
			case buttonType.button: {
				this.drawOnContext = this.drawOnContextAsButton;
				this.mouseInteract = this.mouseInteractAsButton;
				this.updateText = this.updateTextAsButton;
				break;
			}
			case buttonType.palette: {
				this.drawOnContext = this.drawOnContextAsPalette;
				this.mouseInteract = this.mouseInteractAsPalette;
				this.updateText = this.updateTextAsButton;
				break;
			}
			case buttonType.slider: {
				this.drawOnContext = this.drawOnContextAsSlider;
				this.mouseInteract = this.mouseInteractAsSlider;
				this.updateText = this.updateTextAsSlider;
				break;
			}
			default: {
				break;
			}
		}
		this.updateText();
	}

	updateText() {}
	updateTextAsButton() {
		this.text = this.getNewTextFn();
		if (this.text) {
			const { fontSize, textX, textY } = getTextMetrics(this.sizeX, this.sizeY, this.text, 0.95, this.fontName);
			this.fontSize = fontSize;
			this.textX = textX;
			this.textY = textY;
		}
	}
	updateTextAsSlider() {
		this.text = this.getNewTextFn();
		if (this.text) {
			const { fontSize, textX, textY } = getTextMetrics(this.sliderWidth, this.sizeY, this.text, 0.95, this.fontName);
			this.fontSize = fontSize;
			this.textX = textX;
			this.textY = textY;
		}
	}

	alignToButton(button, directionIndex, spacing, width, height, scaleRate) {
		this.sizeX = width == 0 ? button.sizeX : width * scaleRate;
		this.sizeY = height == 0 ? button.sizeY : height * scaleRate;

		switch (directionIndex) {
			case 0:
			case 1:
				break;
			case 2:
				this.posX = button.posX + button.sizeX + spacing * scaleRate;
				this.posY = button.posY;
				break;
			case 3:
				this.posY = button.posY + button.sizeY + spacing * scaleRate;
				this.posX = button.posX;
				break;
			default:
				break;
		}

		if (this.text) {
			const { fontSize, textX, textY } = getTextMetrics(this.sizeX, this.sizeY, this.text, 0.95, this.fontName);
			this.fontSize = fontSize;
			this.textX = textX;
			this.textY = textY;
		}

		this.endX = this.posX + this.sizeX;
		this.endY = this.posY + this.sizeY;
	}

	mouseInteract(mousePosX, mousePosY, mousePressStartX, mousePressStartY, isMousePressed) {}

	mouseInteractAsPalette(mousePosX, mousePosY, mousePressStartX, mousePressStartY, isMousePressed) {
		const isHovered = (
			mousePosX >= this.posX &&
			mousePosY >= this.posY &&
			mousePosX <= this.endX &&
			mousePosY <= this.endY
		);
		const isClicked = (
			mousePressStartX >= this.posX &&
			mousePressStartY >= this.posY &&
			mousePressStartX <= this.endX &&
			mousePressStartY <= this.endY
		);

		if (isClicked && isMousePressed) {
			this.selectedX = getClamped(mousePosX, this.posX, this.endX);
			this.selectedY = getClamped(mousePosY, this.posY, this.endY);

			const x = Math.floor((this.selectedX - this.posX) / this.blockSizeX);
			const y = Math.floor((this.selectedY - this.posY) / this.blockSizeY);

			if (x >= this.paletteResolution - 2) {
				this.selectedLightness = Math.pow(1 - (y / (this.paletteResolution - 1)), 2);
				this.selectedHue = 0;
				this.selectedSaturation = 0;
				this.selectedColor = [Math.round(this.selectedLightness * 255), Math.round(this.selectedLightness * 255), Math.round(this.selectedLightness * 255)];
			} else {
				this.selectedHue = x / (this.paletteResolution - 2);
				this.selectedSaturation = 1;
				this.selectedLightness = Math.pow(1 - (y / (this.paletteResolution - 1)), 2) * 0.8;

				this.selectedColor = this.hslToRgb(this.selectedHue, this.selectedSaturation, this.selectedLightness);
			}

			this.selectedColor = this.selectedColor.map(Math.round);
			this.onClick(this.selectedColor[0], this.selectedColor[1], this.selectedColor[2]);

			return true;
		}
		return isClicked;
	}
	mouseInteractAsButton(mousePosX, mousePosY, mousePressStartX, mousePressStartY, isMousePressed) {
		const isHover = (
			mousePosX >= this.posX &&
			mousePosY >= this.posY &&
			mousePosX <= this.endX &&
			mousePosY <= this.endY
		);
		const isClicked = (
			mousePressStartX >= this.posX &&
			mousePressStartY >= this.posY &&
			mousePressStartX <= this.endX &&
			mousePressStartY <= this.endY &&
			isMousePressed
		);

		if (isHover) {
			if (this.isClickedWhileHovering && !isMousePressed) {
				this.nextFrameIsClick = true;
			}
			if (isClicked) {
				if (this.isClickable || this.nextFrameIsClick) {
					this.color = "cyan";
					this.textColor = "black";

					this.onClick();
					this.isClickable = false;
					this.isClickedWhileHovering = true;
					this.nextFrameIsClick = false;
				}
				this.updateText();
			} else {
				this.color = "white";
				this.textColor = "black";
			}
		} else {
			this.color = "rgb(51, 51, 51)";
			this.textColor = "white";

			if (!isMousePressed) {
				this.isClickable = true;
			}

			this.isClickedWhileHovering = false;
		}

		return isClicked;
	}
	mouseInteractAsSlider(mousePosX, mousePosY, mousePressStartX, mousePressStartY, isMousePressed) {
		const isClicked = (
			mousePressStartX >= this.posX &&
			mousePressStartY >= this.posY &&
			mousePressStartX <= this.endX &&
			mousePressStartY <= this.endY &&
			isMousePressed
		);
		const isHovered = (
			mousePosX >= this.posX &&
			mousePosY >= this.posY &&
			mousePosX <= this.endX &&
			mousePosY <= this.endY
		);
		if (isHovered) {
			this.sliderColor = "white";
			this.textColor = "black";
		} else {
			this.sliderColor = "gray";
			this.textColor = "white";
		}
		if (isClicked) {
			this.sliderColor = "cyan";
			this.textColor = "black";
			this.sliderRate = getClamped((mousePosX - this.posX) / this.sizeX, 0, 1);
			this.onClick(this.sliderRate);
			this.updateText();

		}

		return isClicked;
	}

	drawOnContextAsButton(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.posX, this.posY, this.sizeX, this.sizeY);

		if (this.text) {
			ctx.font = this.fontSize + "px " + this.fontName;
			ctx.fillStyle = this.textColor;
			ctx.fillText(this.text, this.posX + this.textX, this.posY + this.textY);
		}
	}

	drawOnContextAsPalette(ctx) {
		for (let y = 0; y < this.paletteResolution; ++y) {
			for (let x = 0; x < this.paletteResolution - 1; ++x) {
				const hue = x / (this.paletteResolution - 2);
				const saturation = 1;
				const lightness = Math.pow(1 - (y / (this.paletteResolution - 1)), 2) * 0.8;

				const rgbColor = this.hslToRgb(hue, saturation, lightness);

				ctx.fillStyle = `rgb(${rgbColor[0]},${rgbColor[1]},${rgbColor[2]})`;
				ctx.fillRect(this.posX + x * this.blockSizeX, this.posY + y * this.blockSizeY, this.blockSizeX + 1, this.blockSizeY + 1);
			}

			const grayLightness = Math.pow(1 - (y / (this.paletteResolution - 1)), 2);
			const grayRgb = Math.round(grayLightness * 255);
			ctx.fillStyle = `rgb(${grayRgb},${grayRgb},${grayRgb})`;
			ctx.fillRect(this.endX - this.blockSizeX * 2, this.posY + y * this.blockSizeY, this.blockSizeX * 2, this.blockSizeY + 1);
		}

		ctx.fillStyle = `rgb(${this.selectedColor[0]},${this.selectedColor[1]},${this.selectedColor[2]})`;
		ctx.fillRect(this.endX - this.selectedColorWidth, this.endY - this.selectedColorWidth, this.selectedColorWidth, this.selectedColorWidth);

		if (this.selectedX != 0 && this.selectedY != 0) {
			ctx.beginPath();
			ctx.arc(this.selectedX, this.selectedY, this.selectedRadius, 0, twoPI);
			ctx.strokeStyle = "white";
			ctx.lineWidth = this.selectedLineWidth;
			ctx.stroke();
		}
	}

	drawOnContextAsSlider(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.posX, this.posY, this.sizeX, this.sizeY);

		ctx.fillStyle = this.sliderColor;
		ctx.fillRect(this.posX + this.sliderRate * this.sizeX - this.sliderWidth * 0.5, this.posY, this.sliderWidth, this.sizeY);

		if (this.text) {
			ctx.font = this.fontSize + "px " + this.fontName;
			ctx.fillStyle = this.textColor;
			ctx.fillText(this.text, this.posX + this.sliderRate * this.sizeX - this.sliderWidth * 0.5, this.posY + this.textY);
		}
	}

	hslToRgb(h, s, l) {
		let r, g, b;

		if (s == 0) {
			r = g = b = l;
		} else {
			const hue2rgb = (p, q, t) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 * 0.5) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};

			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}

		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	rgbToHsl(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b),
			min = Math.min(r, g, b);
		let h, s, l = (max + min) * 0.5;

		if (max == min) {
			h = s = 0;
		} else {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}

		return [h, s, l];
	}

	selectPositionFromRGB(r, g, b) {
		const [h, s, l] = this.rgbToHsl(r, g, b);

		if (s == 0) {
			this.selectedX = this.endX - this.blockSizeX * 0.5;
			this.selectedY = this.posY + (1 - Math.sqrt(l)) * (this.paletteResolution - 1) * this.blockSizeY;
		} else {
			this.selectedX = this.posX + h * (this.paletteResolution - 2) * this.blockSizeX;
			this.selectedY = this.posY + (1 - Math.sqrt(l / 0.8)) * (this.paletteResolution - 1) * this.blockSizeY;
		}

		this.selectedHue = h;
		this.selectedSaturation = s;
		this.selectedLightness = l;
	}

	drawOnContext(ctx) {}
}