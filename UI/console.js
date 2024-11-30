import { getTextMetrics } from "/Math.js";

export class Message {
	constructor(text, isStatic, id = 0) {
		this.text = text;
		this.isStatic = isStatic;
		this.id = id;
	}
}

export class Console {
	constructor(scaleRate) {
		this.messages = [];
		this.posX = 0 * scaleRate;
		this.posY = 0 * scaleRate;
		this.width = 250 * scaleRate;
		this.height = 350 * scaleRate;
		this.scaleRate = scaleRate;
		this.fontSize = 85 * scaleRate;
		this.lineHeight = this.fontSize * 1.2;
		this.textColor = "white";
		this.backgroundColor = "rgba(0,0,0,0.5)";
	}

	deleteMessage(id) {
		for (let i = 0; i < this.messages.length; ++i) {
			if (this.messages[i].id == id) {
				this.messages.splice(i, 1);
			}
		}
	}

	clear() {
		this.messages = [];
	}

	addMessage(message) {
		this.messages.forEach(mess => {
			if (message.id == mess.id) {
				return;
			}
		});

		this.messages.push(message);
		if (this.messages.length > 5) {
			for (let i = 0; i < this.messages.length; ++i) {
				if (this.messages[i].isStatic) {
					this.messages.splice(i, 1);
					break;
				}
			}
		}
	}

	drawOnContext(ctx) {
		if (this.messages.length == 0) {
			return;
		}

		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(this.posX, this.posY, this.width, this.height);

		ctx.fillStyle = this.textColor;
		const messagesSpaceX = this.width;
		const messagesSpaceY = this.height / this.messages.length;
		for (let messageIndex = 0; messageIndex < this.messages.length; ++messageIndex) {
			const text = this.messages[messageIndex].isStatic ? this.messages[messageIndex].text : this.messages[messageIndex].text();
			const textMetrics = getTextMetrics(messagesSpaceX, messagesSpaceY, text, 0.75, "Monospace");
			ctx.font = "bold " + textMetrics.fontSize + "px Monospace";
			ctx.fillText(text, this.posX + textMetrics.textX, this.posY + textMetrics.textY + messageIndex * messagesSpaceY);
		}
	}
}