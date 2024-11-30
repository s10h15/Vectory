import { encodeValue, decodeValue, createBinaryFile, readBinaryFile } from "/binary.js";

export class Hit {
	constructor(x = 0, y = 0, strength = 0, step = 0) {
		this.directionX = x;
		this.directionY = y;
		this.strengthRate = strength;
		this.occurredAtStepIndex = step;
	}
}

export class Replay {
	constructor() {
		this.worldSeed = null;
		this.worldSave = null;
		this.hits = [];
		this.initialPlayerPosX = null;
		this.initialPlayerPosY = null;
		this.initialPlayerSpeedX = null;
		this.initialPlayerSpeedY = null;
		this.version = "1.0";
	}

	setWorldSave(worldSaveBuffer) {
		this.worldSave = worldSaveBuffer;
	}

	getSave() {
		const hitsData = this.hits.map(hit => [
			hit.directionX,
			hit.directionY,
			hit.strengthRate,
			hit.occurredAtStepIndex
        ]);
		return createBinaryFile(this.version, this.worldSeed, [this.initialPlayerPosX, this.initialPlayerPosY], [this.initialPlayerSpeedX, this.initialPlayerSpeedY], hitsData, this.worldSave);
	}
	loadFromSave(buffer) {
		if (buffer === null) {
			return false;
		}

		const reconstructed = readBinaryFile(buffer);
		const [version, seed, playerPos, playerSpeed, hits, worldSave] = reconstructed;

		this.version = version;
		this.worldSeed = seed;
		this.worldSave = worldSave;
		[this.initialPlayerPosX, this.initialPlayerPosY] = playerPos;
		[this.initialPlayerSpeedX, this.initialPlayerSpeedY] = playerSpeed;

		this.hits = [];
		for (const hit of hits) {
			this.hits.push(new Hit(
				hit[0],
				hit[1],
				hit[2],
				hit[3]
			));
		}

		return true;
	}
	debug() {
		const save = this.getSave();
		this.loadFromSave(save);
	}
}