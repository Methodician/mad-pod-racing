type BarracksTypes = "ARCHER" | "KNIGHT";

let nextBarracksType: BarracksTypes = "KNIGHT";
let gold = 0;
const centerpoint = () => new Coords(1920 / 2, 1000 / 2);

let units: Unit[] = []; // could track enemy units to decide what to build

const sites: Record<number, Site> = {};
const ownedBarracks = {} as Record<number, BarracksTypes>;

// ARCHER / KNIGHT
const targetBuildRatio = 1 / 2;

let ownedBarracksCounts: Record<BarracksTypes, number> = {
  ARCHER: 0,
  KNIGHT: 0,
};

class Unit {
  owner: number;
  location: Coords;
  health: number;
  unitType: number;

  constructor(
    owner: number,
    location: Coords,
    health: number,
    unitType: number
  ) {
    this.owner = owner;
    this.location = location;
    this.health = health;
    this.unitType = unitType;
  }

  isMine = () => this.owner === 0;
}

class Queen extends Unit {
  constructor(owner: number, location: Coords, health: number) {
    super(owner, location, health, -1);
  }

  takeTurn = () => {
    const _ownedBarracksCounts = Object.values(ownedBarracks).reduce(
      (acc, type) => {
        acc[type] = acc[type] + 1;
        return acc;
      },
      {
        ARCHER: 0,
        KNIGHT: 0,
      } as Record<BarracksTypes, number>
    );

    ownedBarracksCounts = _ownedBarracksCounts;
    const nearbySite = nearestToMe();
    const builtRatio =
      _ownedBarracksCounts.ARCHER / _ownedBarracksCounts.KNIGHT;

    if (builtRatio < targetBuildRatio) {
      nextBarracksType = "ARCHER";
    } else {
      nextBarracksType = "KNIGHT";
    }

    this.buildBarracks(nearbySite.id, nextBarracksType);
  };

  attackSite = (site: Site) => {
    this.moveToLocation(site.location.x, site.location.y);
  };

  wait = () => console.log("WAIT");

  // attack by just moving to the site
  moveToLocation = (x: number, y: number) => console.log(`MOVE ${x} ${y}`);

  buildBarracks = (siteId: number, type: string) =>
    console.log(`BUILD ${siteId} BARRACKS-${type}`);
}

class Site {
  id: number;
  location: Coords;
  type: number;
  owner: number;
  param1: number;
  param2: number;
  radius: number;

  constructor(id: number, location: Coords, radius: number) {
    this.id = id;
    this.location = location;
    this.radius = radius;
  }

  update = (type: number, owner: number, param1: number, param2: number) => {
    // console.error("what is this?");
    // console.error(`id: ${this.id}, p1: ${param1}, p2: ${param2}`);
    if (this.type !== 2 && type === 2) {
      // a new Barracks was built
      if (owner === 0) {
        // it was mine
        ownedBarracks[this.id] = nextBarracksType;
      }
    }
    if (this.type === 2 && type !== 2) {
      // a Barracks was destroyed
      if (this.owner === 0) {
        // it was mine
        delete ownedBarracks[this.id];
      }
    }

    this.type = type;
    this.owner = owner;
    this.param1 = param1;
    this.param2 = param2;
  };

  loggable = () =>
    `id: ${this.id} | type: ${this.type} | owner: ${this.owner} | param1: ${this.param1} | param2: ${this.param2} | radius: ${this.radius} |`;
}

class Coords {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  sortedByDistance = (others: Coords[]) => {
    const sorted = others.sort(
      (a, b) => this.distanceBetween(a) - this.distanceBetween(b)
    );
    return sorted;
  };

  distanceBetween = (other: Coords) =>
    Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
}

let myQueen: Queen = new Queen(0, new Coords(0, 0), 0);
let enemyLocation = new Coords(0, 0);

const nearestToMe = () => {
  const sorted = Object.values(sites).sort(
    (a, b) =>
      myQueen.location.distanceBetween(a.location) -
      myQueen.location.distanceBetween(b.location)
  );

  return sorted.find((s) => s.owner !== 0) || sorted[0];
};

const nearestToEnemy = () => {
  const sorted = Object.values(sites).sort(
    (a, b) =>
      enemyLocation.distanceBetween(a.location) -
      enemyLocation.distanceBetween(b.location)
  );

  return sorted.find((s) => s.owner !== 0) || sorted[0];
};

const nearestToCenter = () => {
  const sorted = Object.values(sites).sort(
    (a, b) =>
      centerpoint().distanceBetween(a.location) -
      centerpoint().distanceBetween(b.location)
  );

  return sorted.find((s) => s.owner !== 0) || sorted[0];
};

const knightBarracksNearestEnemy = () => {
  const knightBarracks = Object.entries(sites)
    .filter((s) => ownedBarracks[s[0]] === "KNIGHT")
    .map((s) => s[1]);

  const nearestToEnemy = knightBarracks.sort(
    (a, b) =>
      enemyLocation.distanceBetween(a.location) -
      enemyLocation.distanceBetween(b.location)
  );

  return nearestToEnemy[0];
};

const archerBarracksNearestQueen = () => {
  const archerBarracks = Object.entries(sites)
    .filter((s) => ownedBarracks[s[0]] === "ARCHER")
    .map((s) => s[1]);

  const nearestToSelf = archerBarracks.sort(
    (a, b) =>
      myQueen.location.distanceBetween(a.location) -
      myQueen.location.distanceBetween(b.location)
  );

  return nearestToSelf[0];
};

// READ INIT STUFF
const numSites: number = parseInt(readline());
for (let i = 0; i < numSites; i++) {
  var inputs: string[] = readline().split(" ");
  const siteId: number = parseInt(inputs[0]);
  const x: number = parseInt(inputs[1]);
  const y: number = parseInt(inputs[2]);
  const radius: number = parseInt(inputs[3]);
  sites[siteId] = new Site(siteId, new Coords(x, y), radius);
}

// game loop
while (true) {
  units = [];
  // READ TURN STUFF
  var inputs: string[] = readline().split(" ");
  const inputGold: number = parseInt(inputs[0]);
  const touchedSite: number = parseInt(inputs[1]); // -1 if none
  gold = inputGold;
  for (let i = 0; i < numSites; i++) {
    var inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const ignore1: number = parseInt(inputs[1]); // used in future leagues
    const ignore2: number = parseInt(inputs[2]); // used in future leagues
    const structureType: number = parseInt(inputs[3]); // -1 = No structure, 2 = Barracks
    const owner: number = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
    const param1: number = parseInt(inputs[5]);
    const param2: number = parseInt(inputs[6]);
    sites[siteId].update(structureType, owner, param1, param2);
    // console.error(sites[siteId].loggable());
  }
  const numUnits: number = parseInt(readline());
  for (let i = 0; i < numUnits; i++) {
    var inputs: string[] = readline().split(" ");
    const x: number = parseInt(inputs[0]);
    const y: number = parseInt(inputs[1]);
    const owner: number = parseInt(inputs[2]);
    const unitType: number = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER
    const health: number = parseInt(inputs[4]);
    if (owner == 0 && unitType == -1) {
      if (myQueen.location.x == 0 && myQueen.location.y == 0) {
        myQueen = new Queen(owner, new Coords(x, y), health);
      } else {
        myQueen.health = health;
        myQueen.location = new Coords(x, y);
      }
    }

    units.push(new Unit(owner, new Coords(x, y), health, unitType));

    if (owner == 1 && unitType == -1) {
      enemyLocation.x = x;
      enemyLocation.y = y;
    }
  }

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');

  // First line: A valid queen action
  // Second line: A set of training instructions
  myQueen.takeTurn();

  const myUnits = units.filter((u) => u.isMine());
  const currentUnitsRatio =
    myUnits.filter((u) => u.unitType === 1).length /
    myUnits.filter((u) => u.unitType === 0).length;

  console.error(currentUnitsRatio);

  // train units based on ration vs target ratio
  if (currentUnitsRatio < targetBuildRatio) {
    // find nearest ARCHER barracks to self
    const nearestToSelf = archerBarracksNearestQueen();
    if (!!nearestToSelf) {
      console.log(`TRAIN ${nearestToSelf.id}`);
    } else {
      console.log("TRAIN");
    }
  } else {
    // find nearest KNIGHT barracks to enemy
    const nearestToEnemy = knightBarracksNearestEnemy();
    if (!!nearestToEnemy) {
      console.log(`TRAIN ${nearestToEnemy.id}`);
    } else {
      console.log("TRAIN");
    }
  }
}

// MAKE VSCODE HAPPY
function readline(): string {
  throw new Error("Function not implemented.");
}
