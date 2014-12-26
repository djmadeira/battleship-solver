function battleShipSolver() {

	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var cellW = canvas.width / 10;
	var cellH = canvas.height / 10;
	var letterCodes = ['A','B','C','D','E','F','G','H','I','J'];
	var confirmMode = false;
	var shotCount = 0;

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

	// Set up position arrays
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

	// Set up references to other objects
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

	function redrawBoard() {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		drawGrid();
		drawShips();
		drawShots();
		drawSuperPositions();
	}

	function updateProbabilities() {
		var ship, position;
		var directions = {'w':null, 'n':null, 'e':null, 's':null};
		for (var i = 0; i < 100; i++) {
			positions[i].probability = 0;
		}
		for (var shipName in ships) {
			ship = ships[shipName];
			if (ship.alive) {
				for (var i = 0; i < 100; i++) {
					
					doProbabilities(ship, i, 's');
					doProbabilities(ship, i, 'e');
				}
			}
		}
		for (var i = 0; i < 100; i++) {
			position = positions[i];
			if (position.fired && !position.confirmed) {
				if (position.hit) {
					for (var direction in directions) {
						if (position[direction] && !position[direction].confirmed && position[direction].probability > 0) {
							position[direction].probability += 15;
						}
					}
				}
				positions[i].probability = -1;
			}
		}
	}

	function doProbabilities (ship, position, orientation) {
		var lastPosition = positions[position], fit = true;
		for (var i = 0; i < ship.length; i++) {
			if (!lastPosition || lastPosition.confirmed) {
				fit = false;
				break;
			}
			lastPosition = lastPosition[orientation];
		}
		if (fit) {
			lastPosition = positions[position];
			for (var i = 0; i < ship.length; i++) {
				lastPosition.probability++;
				lastPosition = lastPosition[orientation];
			}
		}
		fit = true;
	}

	function removeShip(shipName) {
		var allDead = true;
		ships[shipName].alive = false;

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

	function placeShips() {
		var index, orientation, validPosition = false, lastPosition;
		for(ship in ships) {
			while(!validPosition) {
				index = getRandomPosition();
				if (!positions[index].occupied) {
					orientation = (Math.random() * 2 > 1) ? 'e' : 's';
					lastPosition = positions[index];
					for (var i = 0; i < ships[ship].length; i++) {
						if (lastPosition[orientation] && !lastPosition[orientation].occupied) {
							lastPosition = lastPosition[orientation];
						} else {
							break;
						}
					}
					if (i == ships[ship].length - 1) {
						validPosition = true;
					}
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

	function updateConfirmations(e) {
		var index = getIndexFromClickPosition(e.offsetX, e.offsetY);
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

	function getIndexNicename(index) {
		return letterCodes[positions[index].row]+','+(positions[index].col + 1);
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
	for (event of eventHandles) { // ES6
		document.getElementById(event).addEventListener('click', eventProcessor);
	}

	drawGrid();
	placeShips();
	updateProbabilities();
	drawShips();
	drawSuperPositions();
}

window.addEventListener("DOMContentLoaded", battleShipSolver);