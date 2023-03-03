/**
 * Save humans, destroy zombies!
 **/
const GUN_RANGE = 2000;
const ZOMBIE_RANGE = 400;

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

  nearest(locations: Position[]) {
    return locations.reduce(
      (nearest, location, index) => {
        const distance = this.distanceTo(location);
        if (distance < nearest.distance) {
          nearest.distance = distance;
          nearest.location = location;
          nearest.index = index;
        }
        return nearest;
      },
      { distance: Number.MAX_VALUE, location: locations[0], index: 0 }
    );
  }
}

class Human {
  id: number;
  position: Position;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.position = new Position(x, y);
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
    let targetZombie: Zombie | undefined;
    let smallestZombieDistance = Number.MAX_VALUE;

    for (const human of humans) {
      const nearestZombie = human.position.nearest(
        zombies.map((zombie) => zombie.position)
      );
      if (nearestZombie.distance < smallestZombieDistance) {
        targetZombie = zombies[nearestZombie.index];
        smallestZombieDistance = Number.MAX_VALUE;
      }
    }

    if (!targetZombie) {
      return;
    }

    if (smallestZombieDistance > ZOMBIE_RANGE) {
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
