function battleShipSolver() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var cellW = canvas.width / 10;
	var cellH = canvas.height / 10;
	var confirmMode = false;
	var shotCount = 0;
	var randomness = 3;

	var ships = {
		'battleship': {
			alive: true,
			length: 4,
			position: 0,
			orientation: 'vertical',
		},
		'destroyer': {
			alive: true,
			length: 3,
			position: 0,
			orientation: 'vertical',
		},
		'aircraftcarrier': {
			alive: true,
			length: 5,
			position: 0,
			orientation: 'vertical',
		},
		'submarine': {
			alive: true,
			length: 3,
			position: 0,
			orientation: 'vertical',
		},
		'patrolboat': {
			alive: true,
			length: 2,
			position: 0,
			orientation: 'vertical',
		},
	};

	// Set up position array
	var positions = [];
	for (var i = 0; i < 100; i++) {
		var row = Math.floor(i / 10),
				col = i % 10;
		positions[i] = {
			index: i,
			probability: 0,
			occupied: false,
			fired: false,
			hit: false,
			confirmed: false,
			row: row,
			col: col,
		};
	}

	// Set references to other positions (for convinence & code clarity)
	for (var i = 0; i < 100; i++) {
		positions[i].w = (positions[i - 1] && positions[i - 1].row === positions[i].row) ? positions[i - 1] : null;
		positions[i].e = (positions[i + 1] && positions[i + 1].row === positions[i].row) ? positions[i + 1] : null;
		positions[i].n = positions[i - 10] ? positions[i - 10] : null;
		positions[i].s = positions[i + 10] ? positions[i + 10] : null;
	}

	function step() {
		fireNext();
		updateProbabilities();
		redrawBoard();
	}

	function updateProbabilities() {
		var ship, position, lastPosition, hitStreak = 0;
		var directions = {'w':null, 'n':null, 'e':null, 's':null};
		for (var i = 0; i < 100; i++) {
			positions[i].probability = 0;
		}
		for (var shipName in ships) {
			ship = ships[shipName];
			if (ship.alive) {
				for (var i = 0; i < 100; i++) {
					if (tryShipAtPosition(ship, i, 's', 'confirmed')) {
						lastPosition = positions[i];
						for (var j = 0; j < ship.length; j++) {
							lastPosition.probability++;
							lastPosition = lastPosition['s'];
						}
					}
					if (tryShipAtPosition(ship, i, 'e', 'confirmed')) {
						lastPosition = positions[i];
						for (var j = 0; j < ship.length; j++) {
							lastPosition.probability++;
							lastPosition = lastPosition['e'];
						}
					}
				}
			}
		}
		for (var i = 0; i < 100; i++) {
			position = positions[i];
			if (position.probability > 0) {
				position.probability += Math.floor(Math.random() * randomness);
			}
			if (position.fired) {
				if (position.hit && !position.confirmed) {
					for (var direction in directions) {
						lastPosition = position;
						hitStreak = 1;
						while(lastPosition[direction] && lastPosition[direction].hit && !lastPosition[direction].confirmed) {
							hitStreak++;
							lastPosition = lastPosition[direction];
						}
						lastPosition = lastPosition[direction];
						if (lastPosition && !lastPosition.fired) {
							lastPosition.probability += hitStreak * 10;
						}
					}
				}
				// All positions that have already been fired at should have the lowest probability
				position.probability = -1;
			}
		}
	}

	// Test if a ship will fit at a given position & direction
	function tryShipAtPosition(ship, position, orientation, propertyToTest) {
		var lastPosition = positions[position], fit = true;
		for (var i = 0; i < ship.length; i++) {
			if (!lastPosition || lastPosition[propertyToTest]) {
				fit = false;
				break;
			}
			lastPosition = lastPosition[orientation];
		}
		return fit;
	}

	function removeShip(shipName) {
		var allDead = true;
		ships[shipName].alive = false;

		// If this is the last ship, end the game.
		for (var ship in ships) {
			if (ships[ship].alive) {
				allDead = false;
			}
		}
		if (allDead) {
			document.getElementById('result').innerHTML = 'Game over! Move count: '+shotCount;
		}

		updateProbabilities();
		redrawBoard();
	}

	// Random ship placement
	// Todo: allow custom positions as params
	function placeShips() {
		var index, orientation, validPosition = false, lastPosition;
		for(ship in ships) {
			while(!validPosition) {
				index = getRandomPosition();
				orientation = (Math.random() * 2 > 1) ? 'e' : 's';
				if (tryShipAtPosition(ships[ship], index, orientation, 'occupied')) {
					validPosition = true;
				}
			}
			lastPosition = positions[index];
			for (var i = 0; i < ships[ship].length; i++) {
				lastPosition.occupied = true;
				lastPosition = lastPosition[orientation];
			}
			ships[ship].position = index;
			validPosition = false;
		}
	}

	function getRandomPosition() {
		return Math.floor(Math.random() * 100);
	}

	// Sorts the board pieces by probability and finds out whether a hit or a miss is found at highest probability position. Re-sorts based on index when finished.
	function fireNext() {
		shotCount++;

		positions.sort(function sortByProbability(a, b) {
			if (a.fired) {
				return 1;
			} else {
				return b.probability - a.probability;
			}
		});

		positions[0].fired = true;
		var hit = positions[0].hit = confirm('hit at '+getIndexNicename(0)+'?');
		// misses are set to confirmed to improve the probability engine
		positions[0].confirmed = hit ? false : true;
		var index = positions[0].index;
		positions[0].probability = -1;

		positions.sort(function sortByIndex(a, b) {
			return a.index - b.index;
		});

		return index;
	}

	function toggleConfirmMode(e) {
		if (confirmMode) {
			confirmMode = false;
			updateProbabilities();
			redrawBoard();
			canvas.removeEventListener('click', updateConfirmations);
			e.target.innerHTML = "Confirm hits";
		} else {
			confirmMode = true;
			drawConfirmations();
			canvas.addEventListener('click', updateConfirmations);
			e.target.innerHTML = "Done";
		}
	}

	// Fires whenever canvas receives a click if confirmMode is active
	function updateConfirmations(e) {
		var index = getIndexFromClickPosition(e.layerX, e.layerY);
		positions[index].confirmed = positions[index].confirmed ? false : true; // flip value
		redrawBoard();
		drawConfirmations();
	}

	function getIndexFromClickPosition(x, y) {
		var pos = 0;
		pos += Math.floor(x / (canvas.width / 10));
		pos += Math.floor(y / (canvas.width / 10)) * 10;
		return pos;
	}

	function getIndexNicename(index) {
		var letterCodes = ['A','B','C','D','E','F','G','H','I','J'];
		return letterCodes[positions[index].row]+','+(positions[index].col + 1);
	}

	// Todo: combine draw functions into unified loop to increase efficiency & clarity

	function redrawBoard() {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		drawGrid();
		drawShips();
		drawShots();
		drawSuperPositions();
	}

	function drawConfirmations() {
		ctx.fillStyle = 'rgba(45,204,71,0.6)';
		for (var i = 0; i < 100; i++) {
			if (positions[i].confirmed) {
				ctx.fillRect(cellW * (i % 10) + 6, cellH * Math.floor(i / 10) + 6, cellW - 12, cellH - 12);
			}
		}
	}

	function drawGrid() {
		ctx.strokeStyle = "#000";
		for (var i = 0; i <= 100; i++) {
			ctx.strokeRect(cellW * (i % 10), cellH * Math.floor(i / 10), cellW, cellH);
		}
	}

	function drawShips() {
		ctx.fillStyle = '#2E8ED8';
		for (var i = 0; i < 100; i++) {
			if (!positions[i].occupied) {
				ctx.fillRect(cellW * (i % 10) + 1, cellH * Math.floor(i / 10) + 1, cellW - 2, cellH - 2);
			}
		}
	}

	function drawSuperPositions() {
		var ceiling = 0;
		for (var i = 0; i < 100; i++) {
			ceiling = positions[i].probability > ceiling ? positions[i].probability : ceiling;
		}
		for (var i = 0; i < 100; i++) {
			ctx.fillStyle = 'rgba(0,0,0,'+(positions[i].probability / ceiling * 0.6)+')';
			ctx.fillRect(cellW * (i % 10) + 1, cellH * Math.floor(i / 10) + 1, cellW - 2, cellH - 2);
			ctx.fillText(positions[i].probability, cellW * (i % 10) + 2, cellH * Math.floor(i / 10) + cellH - 2);
		}
	}

	function drawShots() {
		for (var i = 0; i < 100; i++) {
			if (positions[i].fired) {
				if (positions[i].hit) {
					ctx.fillStyle = 'red';
				} else {
					ctx.fillStyle = 'gray';
				}
				ctx.fillRect(cellW * (i % 10) + 6, cellH * Math.floor(i / 10) + 6, cellW - 12, cellH - 12);
			}
		}
	}

	function eventProcessor (e) {
		switch(e.target.id) {
			case 'step':
				step();
				break;

			case 'confirm-hits':
				toggleConfirmMode(e);
				break;

			case 'sunk-battleship':
				removeShip('battleship');
				break;

			case 'sunk-destroyer':
				removeShip('destroyer');
				break;

			case 'sunk-aircraftcarrier':
				removeShip('aircraftcarrier');
				break;

			case 'sunk-submarine':
				removeShip('submarine');
				break;

			case 'sunk-patrolboat':
				removeShip('patrolboat');
				break;
		}
	}

	var eventHandles = ['step', 'sunk-battleship', 'sunk-destroyer', 'sunk-aircraftcarrier', 'sunk-submarine', 'sunk-patrolboat', 'confirm-hits'];
	for (var i = 0; i < eventHandles.length; i++) {
		document.getElementById(eventHandles[i]).addEventListener('click', eventProcessor);
	}

	drawGrid();
	placeShips();
	updateProbabilities();
	drawShips();
	drawSuperPositions();
}

window.addEventListener("DOMContentLoaded", battleShipSolver);