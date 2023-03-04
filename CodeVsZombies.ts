/**
 * Save humans, destroy zombies!
 **/
const GUN_RANGE = 2000;
// distance per turn
const ASH_SPEED = 1000;
const ZOMBIE_SPEED = 400;

type NearnessIndicator = {
  distance: number;
  index: number;
  position: Position;
};

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  distanceTo(other: Position) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distance(a: Position, b: Position) {
    return a.distanceTo(b);
  }

  nearest(positions: Position[]) {
    return positions.reduce(
      (nearest, location, index) => {
        const distance = this.distanceTo(location);
        if (distance < nearest.distance) {
          nearest.distance = distance;
          nearest.position = location;
          nearest.index = index;
        }
        return nearest;
      },
      {
        distance: Number.MAX_VALUE,
        index: 0,
        position: positions[0],
      } as NearnessIndicator
    );
  }

  // number of turns to reach reach another position at a given speed
  tunsFrom(other: Position, speed: number, range: number = 0) {
    if (this.distanceTo(other) <= range) {
      return 0;
    }
    return (this.distanceTo(other) - range) / speed;
  }
}

class Human {
  id: number;
  position: Position;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.position = new Position(x, y);
    // console.error(`human ${id} at ${x} ${y}`);
  }
}

class Zombie {
  id: number;
  position: Position;
  nextPosition: Position;

  constructor(id: number, x: number, y: number, xNext: number, yNext: number) {
    this.id = id;
    this.position = new Position(x, y);
    this.nextPosition = new Position(xNext, yNext);
  }
}

class Player {
  position: Position;

  constructor(x: number, y: number) {
    this.position = new Position(x, y);
  }

  // Would like to have this return actual zombie, not just position
  nearestZombie(zombies: Zombie[]) {
    return this.position.nearest(zombies.map((zombie) => zombie.position));
  }

  takeTurn = (humans: Human[], zombies: Zombie[]) => {
    // Could target the location the zombie will be after the number of turns it takes to reach that location
    // let targetLocation = this.position;
    let targetZombie =
      zombies[
        this.position.nearest(zombies.map((zombie) => zombie.position)).index
      ];
    let minTurnsAshCanBeat = Number.MAX_VALUE;
    let humanToSave = humans[0];

    // find the zombie closest to a human that Ash can reach in time
    // Could take clustered humans into account to save largest number of humans
    for (const human of humans) {
      const nearestZombie =
        zombies[
          human.position.nearest(zombies.map((zombie) => zombie.position)).index
        ];

      const ashTurnsToReach = this.position.tunsFrom(
        human.position,
        ASH_SPEED,
        GUN_RANGE
      );

      const zombieTurnsToReach = nearestZombie.position.tunsFrom(
        human.position,
        ZOMBIE_SPEED
      );

      if (
        zombieTurnsToReach > ashTurnsToReach &&
        zombieTurnsToReach < minTurnsAshCanBeat
      ) {
        targetZombie = nearestZombie;
        minTurnsAshCanBeat = zombieTurnsToReach;
        humanToSave = human;
        console.error(`targeting zombie ${targetZombie.id}`);
        console.error(`turns to reach: ${zombieTurnsToReach}`);
      }
    }

    console.error(`current position: ${this.position.x} ${this.position.y}`);
    console.error(
      `human position: ${humanToSave.position.x} ${humanToSave.position.y}`
    );

    if (targetZombie) {
      this.move(targetZombie.nextPosition.x, targetZombie.nextPosition.y);
    } else {
      this.move(this.position.x, this.position.y);
    }
  };

  private move = (x: number, y: number) => {
    console.log(`${x} ${y}`);
  };
}

// May be in a game state later:
const humans: Human[] = [];
const zombies: Zombie[] = [];
let player: Player = new Player(0, 0);

// game loop
while (true) {
  var inputs: string[] = readline().split(" ");
  const x: number = parseInt(inputs[0]);
  const y: number = parseInt(inputs[1]);
  const humanCount: number = parseInt(readline());
  player = new Player(x, y);
  humans.length = 0;

  for (let i = 0; i < humanCount; i++) {
    var inputs: string[] = readline().split(" ");
    const humanId: number = parseInt(inputs[0]);
    const humanX: number = parseInt(inputs[1]);
    const humanY: number = parseInt(inputs[2]);
    humans.push(new Human(humanId, humanX, humanY));
  }
  const zombieCount: number = parseInt(readline());
  zombies.length = 0;
  for (let i = 0; i < zombieCount; i++) {
    var inputs: string[] = readline().split(" ");
    const zombieId: number = parseInt(inputs[0]);
    const zombieX: number = parseInt(inputs[1]);
    const zombieY: number = parseInt(inputs[2]);
    const zombieXNext: number = parseInt(inputs[3]);
    const zombieYNext: number = parseInt(inputs[4]);
    zombies.push(
      new Zombie(zombieId, zombieX, zombieY, zombieXNext, zombieYNext)
    );
  }

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');

  player.takeTurn(humans, zombies);
}
