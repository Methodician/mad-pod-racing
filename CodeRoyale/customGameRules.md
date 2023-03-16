# Goals

## Build structures

Structures should be built quickly and endlessly. Building structures is free, and the queen can only move and build structures, so this is always her priority.

There are limited building sites for structures, so we're always competing with the enemy queen for them, and need to prioritize what to build carefully.

Note that our queen can capture sites occupied by enemy barracks and gold mines, but not enemy towers.

## Earn gold and train units

Sites have limited gold, and some of them have higher max mining rates ("maxMineSize") so those with more gold and higher maxMineSize should be prioritized for gold mines.

Units can be trained at barracks. Each barracks type trains a different unit type, and without the correct barracks type, those units cannot be trained. We need to manage our budget to

## Destroy the enemy queen without letting our queen get destroyed

The enemy queen can be damaged by one unit type: KNIGHT, and one structure type: TOWER. We need to quickly and endlessly produce knights and towers. Towers also help protect the queens, because they attack knights.

# Rules

The game is played in a finite loop. Each loop is considered a "turn" and there are only 250 max turns. The game ends immediately if one of the queens dies, and if 250 turns are reached, the queen with the most HP wins.

## Field

The game field is represented on a two-dimensional map 1920 units wide and 1000 units high. There are 24 building sites distributed on the map. Sites locations are generated procedurally for each new game, oriented symmetrically around the map's center. Each building site has its own radius and other statistics.

## Queens
