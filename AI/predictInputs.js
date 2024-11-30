import { getRandomFloat, getRandomInt, isChance, setRandomizerSeed, getDistance, getPath, getClamped } from "/Math.js";

setRandomizerSeed(+Math.random());

function isCellWalkable(cell) {
	return !cell.isSolid;
}

let inputs = null;

function copyInputs(inputs) {
	const copy = [];
	for (const pair of inputs) {
		copy.push([...pair]);
	}
	return copy;
}

function mutateInputs() {
	const backupInputs = copyInputs(inputs);

	for (let y = 0; y < inputs.length; ++y) {
		for (let x = 0; x < inputs[0].length; ++x) {
			if (isChance(0.2)) {
				inputs[y][x] = getRandomFloat(-1, 1);
			}
		}
	}

	return backupInputs;
}

export function predictGameInputs(player, world, deltaTime, numHitsToPredict) {
	let isAct = true;

	if (inputs == null) {
		inputs = [];

		for (let y = 0; y < numHitsToPredict; ++y) {
			let newPair = [];
			for (let x = 0; x < 3; ++x) {
				newPair.push(getRandomFloat(-1, 1));
			}
			inputs.push(newPair);
		}
	}

	if (player.isHitable) {
		const initialPlayerPosX = player.posX;
		const initialPlayerPosY = player.posY;
		const initialPlayerSpeedX = player.speedX;
		const initialPlayerSpeedY = player.speedY;
		const initialPlayerIsTouchedGround = player.isTouchedGround;

		let bestDistance = 9007199254740991;
		let bestInputs = copyInputs(inputs);

		for (let i = 0; i < 350; ++i) {
			let backupInputs = mutateInputs();
			let totalDistance = 0;

			for (let j = 0; j < inputs.length; ++j) {
				const pair = inputs[j];
				player.hit(pair[0], pair[1], pair[2] * player.hitStrength);

				let k = 0;
				do {
					player.move(deltaTime, world.getClosestTileHitboxesToPos(player.posX, player.posY, 6));
					if (world.isPlayerWon(player.posX, player.posY)) {
						return { inputs, isAct };
					}
					++k;
				} while (!player.isHitable && k < 10000);

				const landingPlayerGridIndexX = ~~(player.posX / world.cellsSize);
				const landingPlayerGridIndexY = ~~(player.posY / world.cellsSize);
				const [pathToGoal, _] = getPath(world.grid, landingPlayerGridIndexX, landingPlayerGridIndexY, world.aiGoalCellIndexX, world.aiGoalCellIndexY, isCellWalkable);

				const landingToGoalDistance = pathToGoal.length;
				const weightedDistance = landingToGoalDistance; // / (j + 1);
				totalDistance += weightedDistance;
			}

			if (totalDistance < bestDistance) {
				bestDistance = totalDistance;
				bestInputs = copyInputs(inputs);
			} else {
				inputs = backupInputs;
			}

			player.posX = initialPlayerPosX;
			player.posY = initialPlayerPosY;
			player.speedX = initialPlayerSpeedX;
			player.speedY = initialPlayerSpeedY;
			player.isHitable = true;
			player.isTouchedGround = initialPlayerIsTouchedGround;
		}

		inputs = bestInputs;
	}

	return { inputs, isAct };
}