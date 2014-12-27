# Battleship "Solver"
A Javascript-based battleship AI (with a UI). Runs in a browser.

Based on http://www.datagenetics.com/blog/december32011/index.html, but with a few very important improvements:

* Some randomization is added to the cell probabilities to make the algorithm harder to detect & defeat (although it can't really be defeated, just delayed slightly be placing the ships at the very edges of the board)
* As you play, you mark the sunken ships on the board, reducing the possible positions as you eliminate ships and solving the problem of the algorithm always firing every cardinal position around a hit
* Directional weighting (e.g. if A2 and B2 are hit consecutively, C2 will be weighted over A1.)

## Still needed:

* Undo button. Currently, if you give the solver incorrect input about a move, the only choice is to start the game over
* Auto-solve. Right now it can't run automatically. While it can and does place ships on the board for testing, there's nothing that tells the algorithm automatically when a ship has been sunk, removing the positions as possible superpositions and reducing the pool of remaining ships.
* Ability to place the ships in custom positions.

# License:

Um, have at it.

# Changelog

## 1.0
* Inital publication