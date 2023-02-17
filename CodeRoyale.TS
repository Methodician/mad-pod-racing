// NOTE random idea - build tower at center and always
// try to grow it unless I need to build more barracks

type BarracksTypes = "ARCHER" | "KNIGHT" | "GIANT"; // should add "GIANT" here
type BuildingTypes = BarracksTypes | "TOWER" | "MINE";

let nextBuildingType: BuildingTypes = "KNIGHT";
let gold = 0;
const centerpoint = () => new Coords(1920 / 2, 1000 / 2);

let units: Unit[] = []; // could track enemy units to decide what to build

const sites: Record<number, Site> = {};
const ownedBuildings = {} as Record<number, BuildingTypes>;

// ARCHER / KNIGHT / GIANT
const targetTrainingRatio = {
  KNIGHT: 0.75,
  ARCHER: 0.0,
  GIANT: 0.25,
};

// Check if targetRatios add up to 1
const targetTrainingRatioSum = Object.values(targetTrainingRatio).reduce(
  (a, b) => a + b,
  0
);
if (targetTrainingRatioSum !== 1) {
  throw new Error("targetTrainingRatio does not add up to 1");
}

const targetKnightBarracks = 1;
const targetArcherBarracks = 0;
const targetGiantBarracks = 1;
const targetTowers = 3;
const targetMines = 3;

let shouldWorkMines = false;
let nextMineIndex = 0;
const cycleMineIndex = () => {
  const index = (nextMineIndex + 1) % ownedMineSiteIds.length;
  if (index === 0) {
    shouldWorkMines = false;
  }
  nextMineIndex = index;
};
let nextTowerIndex = 0;
const cycleTowerIndex = () => {
  const index = (nextTowerIndex + 1) % ownedTowerSiteIds.length;
  if (index === 0) {
    shouldWorkMines = true;
  }
  nextTowerIndex = index;
};

const ownedArcherBarracksSiteIds: number[] = [];
const ownedKnightBarracksSiteIds: number[] = [];
const ownedGiantBarracksSiteIds: number[] = [];
const ownedTowerSiteIds: number[] = []; // Could maybe use this instead of keeping towers in ownedBuildingCounts
const ownedMineSiteIds: number[] = [];

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
  attackerProximityThreshold = 400;
  attackerCountThresholds = {
    MINE: 1,
    GENERAL: 3,
  };

  touchedSite: number;
  startingLocation: Coords;
  constructor(owner: number, location: Coords, health: number) {
    super(owner, location, health, -1);
    this.startingLocation = { ...location };
  }

  isUnderAttack = (threshold: "MINE" | "GENERAL") => {
    const attackers = units.filter(
      (u) =>
        !u.isMine() &&
        u.location.proximityTo(this.location) < this.attackerProximityThreshold
    );
    return attackers.length > this.attackerCountThresholds[threshold];
  };

  attackSite = (site: Site) => {
    this.moveToLocation(site.location.x, site.location.y);
  };

  // This could be for both towers and mines
  expandTowers = () => {
    // cycle through all owned towers by calling buildTower on each until I need to build something else
    this.buildTower(ownedTowerSiteIds[nextTowerIndex]);
    if (this.touchedSite === ownedTowerSiteIds[nextTowerIndex]) {
      cycleTowerIndex();
    }
  };

  wait = () => console.log("WAIT");

  // attack by just moving to the site
  moveToLocation = (x: number, y: number) => console.log(`MOVE ${x} ${y}`);

  buildBarracks = (siteId: number, type: string) =>
    console.log(`BUILD ${siteId} BARRACKS-${type}`);

  buildTower = (siteId: number) => console.log(`BUILD ${siteId} TOWER`);

  buildMine = (siteId: number) => console.log(`BUILD ${siteId} MINE`);
}

class Site {
  id: number;
  location: Coords;
  type: number;
  goldRemaining: number;
  maxMineSize: number;
  owner: number;
  param1: number; // mine size or tower range
  param2: number;
  radius: number;
  buildingType: BuildingTypes | null;

  constructor(id: number, location: Coords, radius: number) {
    this.id = id;
    this.location = location;
    this.radius = radius;
  }

  update = (
    type: number,
    goldRemaining: number,
    maxMineSize: number,
    owner: number,
    param1: number,
    param2: number
  ) => {
    // console.error("what is this?");
    // console.error(`id: ${this.id}, p1: ${param1}, p2: ${param2}`);
    this.goldRemaining = goldRemaining;
    this.maxMineSize = maxMineSize;
    if (this.owner !== 0 && owner == 0) {
      // I built something
      switch (nextBuildingType) {
        case "ARCHER":
          ownedArcherBarracksSiteIds.push(this.id);
          this.buildingType = "ARCHER";
          break;
        case "KNIGHT":
          ownedKnightBarracksSiteIds.push(this.id);
          this.buildingType = "KNIGHT";
          break;
        case "GIANT":
          ownedGiantBarracksSiteIds.push(this.id);
          this.buildingType = "GIANT";
          break;
        case "TOWER":
          ownedTowerSiteIds.push(this.id);
          this.buildingType = "TOWER";
          break;
        case "MINE":
          ownedMineSiteIds.push(this.id);
          this.buildingType = "MINE";
          break;
      }
    }
    if (this.owner == 0 && owner !== 0) {
      // I lost something
      switch (this.buildingType) {
        case "ARCHER":
          ownedArcherBarracksSiteIds.splice(
            ownedArcherBarracksSiteIds.indexOf(this.id),
            1
          );
          break;
        case "KNIGHT":
          ownedKnightBarracksSiteIds.splice(
            ownedKnightBarracksSiteIds.indexOf(this.id),
            1
          );
          break;
        case "GIANT":
          ownedGiantBarracksSiteIds.splice(
            ownedGiantBarracksSiteIds.indexOf(this.id),
            1
          );
          break;
        case "TOWER":
          ownedTowerSiteIds.splice(ownedTowerSiteIds.indexOf(this.id), 1);
          break;
        case "MINE":
          ownedMineSiteIds.splice(ownedMineSiteIds.indexOf(this.id), 1);
          break;
      }
      this.buildingType = null;
    }

    // May drop much of the below logic in favor of dedicated arrays
    if (this.type !== 2 && type === 2) {
      // a new Barracks was built
      if (owner === 0) {
        // it was mine
        ownedBuildings[this.id] = nextBuildingType;
      }
    }
    if (this.type === 2 && type !== 2) {
      // a Barracks was destroyed
      if (this.owner === 0) {
        // it was mine
        delete ownedBuildings[this.id];
      }
    }

    this.type = type;
    this.owner = owner;
    this.param1 = param1;
    this.param2 = param2;
  };

  loggable = () =>
    `id:${this.id}|type:${this.type}|owner:${this.owner}|gold:${this.goldRemaining}|maxS:${this.maxMineSize}|p1:${this.param1}|p2:${this.param2}|radius:${this.radius}`;
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
      (a, b) => this.proximityTo(a) - this.proximityTo(b)
    );
    return sorted;
  };

  proximityTo = (other: Coords) =>
    Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));

  midPoint = (other: Coords) =>
    new Coords(
      Math.round((this.x + other.x) / 2),
      Math.round((this.y + other.y) / 2)
    );
}

let myQueen: Queen = new Queen(0, new Coords(0, 0), 0);
let enemyQueen = new Queen(0, new Coords(0, 0), 0);

const unownedByMeSites = () =>
  Object.values(sites).filter((s) => s.owner !== 0);
const unownedSites = () => Object.values(sites).filter((s) => s.owner === -1);
const unownedByMeAndNotTowerSites = () =>
  Object.values(sites).filter((s) => s.owner !== 0 && s.type !== 1);
const ownedSites = () => Object.values(sites).filter((s) => s.owner === 0);

const sitesByProximityToTarget = (target: Coords, otherSites: Site[]) =>
  otherSites.sort(
    (a, b) => target.proximityTo(a.location) - target.proximityTo(b.location)
  );

// GAME LOGIC

let isInitialBuildOutDone = false;
const queenTurn = () => {
  const touched = sites[myQueen.touchedSite];

  const buildTower = () => {
    const targetSite = sitesByProximityToTarget(
      myQueen.startingLocation.midPoint(centerpoint()),
      unownedByMeAndNotTowerSites()
    )[0];
    nextBuildingType = "TOWER";
    myQueen.buildTower(targetSite.id);
  };

  const buildMine = () => {
    const sortedSites = sitesByProximityToTarget(
      myQueen.startingLocation,
      unownedByMeAndNotTowerSites()
    );
    const targetSite = sortedSites.find(
      (site) => site.goldRemaining === -1 || site.goldRemaining > 70
    );
    if (!targetSite) {
      // May just go into defense mode instead
      buildTower();
    } else {
      if (myQueen.isUnderAttack("MINE")) {
        nextBuildingType = "TOWER";
        myQueen.buildTower(targetSite.id);
      } else {
        nextBuildingType = "MINE";
        myQueen.buildMine(targetSite.id);
        // May want to get her to upgrade it a few times immediately
      }
    }
  };

  const buildArcherBarracks = () => {
    const siteNearQueen = sitesByProximityToTarget(
      myQueen.location,
      unownedByMeAndNotTowerSites()
    )[0];
    nextBuildingType = "ARCHER";
    myQueen.buildBarracks(siteNearQueen.id, nextBuildingType);
  };

  const buildKnightBarracks = () => {
    const siteNearQueen = sitesByProximityToTarget(
      myQueen.location,
      unownedByMeAndNotTowerSites()
    )[0];
    nextBuildingType = "KNIGHT";
    myQueen.buildBarracks(siteNearQueen.id, nextBuildingType);
  };

  const buildGiantBarracks = () => {
    const siteNearQueen = sitesByProximityToTarget(
      myQueen.location,
      unownedByMeAndNotTowerSites()
    )[0];
    nextBuildingType = "GIANT";
    myQueen.buildBarracks(siteNearQueen.id, nextBuildingType);
  };

  const initialBuildOut = () => {
    if (
      // if it's a mine, and it's not maxed out, and it's not empty, upgrade it
      touched &&
      touched.type === 0 &&
      touched.owner === 0 &&
      touched.param1 < touched.maxMineSize &&
      touched.goldRemaining > 95
    ) {
      myQueen.buildMine(touched.id);
    } else if (
      // if it's a tower and not maxed out then upgrade it
      touched &&
      touched.type === 1 &&
      touched.param1 < touched.param2 // I don't actually understand this but the Princess Boss seems to do it
    ) {
      myQueen.buildTower(touched.id);
    } else if (
      ownedKnightBarracksSiteIds.length < Math.min(1, targetKnightBarracks)
    ) {
      buildKnightBarracks();
    } else if (ownedMineSiteIds.length < Math.min(2, targetMines)) {
      buildMine();
    } else if (ownedTowerSiteIds.length < Math.min(3, targetTowers)) {
      buildTower();
    } else if (
      ownedArcherBarracksSiteIds.length < Math.min(1, targetArcherBarracks)
    ) {
      buildArcherBarracks();
    } else {
      console.error("initial build out done");
      isInitialBuildOutDone = true;
      standardLoop();
    }
  };

  const standardLoop = () => {
    if (
      // if it's a mine, and it's not maxed out, and it's not empty, upgrade it
      touched &&
      touched.type === 0 &&
      touched.owner === 0 &&
      touched.param1 < touched.maxMineSize &&
      touched.goldRemaining > 95
    ) {
      myQueen.buildMine(touched.id);
    } else if (
      // if it's a tower and not maxed out then upgrade it
      touched &&
      touched.type === 1 &&
      touched.param1 < touched.param2 // I don't actually understand this but the Princess Boss seems to do it
    ) {
      myQueen.buildTower(touched.id);
    } else if (ownedMineSiteIds.length < targetMines) {
      buildMine();
    } else if (ownedTowerSiteIds.length < targetTowers) {
      buildTower();
    } else if (ownedArcherBarracksSiteIds.length < targetArcherBarracks) {
      buildArcherBarracks();
    } else if (ownedKnightBarracksSiteIds.length < targetKnightBarracks) {
      buildKnightBarracks();
    } else if (ownedGiantBarracksSiteIds.length < targetGiantBarracks) {
      buildGiantBarracks();
    } else {
      buildTower();
    }
  };

  const retreatLoop = () => {
    // build tower at nearest site to queen or just expand if no more sites
    const nearbySite = sitesByProximityToTarget(
      myQueen.location,
      unownedByMeAndNotTowerSites()
    )[0];
    if (!!nearbySite) {
      nextBuildingType = "TOWER";
      myQueen.buildTower(nearbySite.id);
    } else {
      myQueen.expandTowers();
    }
  };

  if (myQueen.isUnderAttack("GENERAL")) {
    console.error("queen is under attack");
    retreatLoop();
  } else if (!isInitialBuildOutDone) {
    console.error("starting initial build out");
    initialBuildOut();
  } else {
    console.error("starting standard loop");
    standardLoop();
  }

  //   myQueen.buildBarracks(nearbySite.id, nextBuildingType);
};

let shouldSaveUp = true;
const saveThreshold = 50;
const spendThreshold = 200;

const trainTurn = () => {
  const maxRetries = 10;
  let retries = 0;
  const myUnits = units.filter((u) => u.isMine());
  const currentKnightsPercentage =
    myUnits.filter((u) => u.unitType === 0).length / myUnits.length;
  const currentArchersPercentage =
    myUnits.filter((u) => u.unitType === 1).length / myUnits.length;
  const currentGiantsPercentage =
    myUnits.filter((u) => u.unitType === 2).length / myUnits.length;

  console.error(
    "knight/archer/giant",
    currentKnightsPercentage,
    currentArchersPercentage,
    currentGiantsPercentage
  );

  const trainNothing = () => {
    if (gold > spendThreshold) {
      shouldSaveUp = false;
    }
    console.log("TRAIN");
  };

  const trainKnight = () => {
    // train at knight barracks closes to enemy
    const ownedKnightBarracksSites = ownedKnightBarracksSiteIds.map(
      (id) => sites[id]
    );
    const nearestToEnemy = sitesByProximityToTarget(
      enemyQueen.location,
      ownedKnightBarracksSites
    )[0];
    if (!!nearestToEnemy) {
      retries = 0;
      console.log(`TRAIN ${nearestToEnemy.id}`);
    } else if (retries < maxRetries) {
      retries++;
      console.error("no knight barracks sites");
      trainArchers();
    } else {
      trainNothing();
    }
  };

  const trainArchers = () => {
    // train at archer barracks closest to myQueen
    const ownedArcherBarracksSites = ownedArcherBarracksSiteIds.map(
      (id) => sites[id]
    );
    const nearestToSelf = sitesByProximityToTarget(
      myQueen.location,
      ownedArcherBarracksSites
    )[0];
    if (!!nearestToSelf) {
      retries = 0;
      console.log(`TRAIN ${nearestToSelf.id}`);
    } else if (retries < maxRetries) {
      retries++;
      console.error("no archer barracks sites");
      trainGiants();
    } else {
      trainNothing();
    }
  };

  const trainGiants = () => {
    // train at giant barracks closest to enemy
    const ownedGiantBarracksSites = ownedGiantBarracksSiteIds.map(
      (id) => sites[id]
    );
    const nearestToEnemy = sitesByProximityToTarget(
      enemyQueen.location,
      ownedGiantBarracksSites
    )[0];
    if (!!nearestToEnemy) {
      retries = 0;
      console.log(`TRAIN ${nearestToEnemy.id}`);
    } else if (retries < maxRetries) {
      retries++;
      console.error("no giant barracks sites");
      trainKnight();
    } else {
      trainNothing();
    }
  };

  // train units based on ration vs target ratio
  if (shouldSaveUp) {
    trainNothing();
  } else {
    if (gold < saveThreshold) {
      shouldSaveUp = true;
    }
    if (currentKnightsPercentage < targetTrainingRatio.KNIGHT) {
      trainKnight();
    } else if (currentArchersPercentage < targetTrainingRatio.ARCHER) {
      trainArchers();
    } else if (currentGiantsPercentage < targetTrainingRatio.GIANT) {
      trainGiants();
    }
  }
};

// READ INIT STUFF
const numSites: number = parseInt(readline());
for (let i = 0; i < numSites; i++) {
  var inputs: string[] = readline().split(" ");
  const siteId: number = parseInt(inputs[0]);
  const x: number = parseInt(inputs[1]);
  const y: number = parseInt(inputs[2]);
  const radius: number = parseInt(inputs[3]);

  // use init sites
  sites[siteId] = new Site(siteId, new Coords(x, y), radius);
}

// game loop
while (true) {
  units = [];
  // READ INIT turn STUFF
  var inputs: string[] = readline().split(" ");
  const inputGold: number = parseInt(inputs[0]);
  const touchedSite: number = parseInt(inputs[1]); // -1 if none
  // use init stuff
  myQueen.touchedSite = touchedSite;
  gold = inputGold;
  // READ SITES
  for (let i = 0; i < numSites; i++) {
    var inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const goldRemaining: number = parseInt(inputs[1]); // -1 if unknown
    const maxMineSize: number = parseInt(inputs[2]); // -1 if unknown
    const structureType: number = parseInt(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
    const owner: number = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
    const param1: number = parseInt(inputs[5]);
    const param2: number = parseInt(inputs[6]);
    sites[siteId].update(
      structureType,
      goldRemaining,
      maxMineSize,
      owner,
      param1,
      param2
    );
    // console.error(sites[siteId].loggable());
  }
  const numUnits: number = parseInt(readline());
  for (let i = 0; i < numUnits; i++) {
    var inputs: string[] = readline().split(" ");
    const x: number = parseInt(inputs[0]);
    const y: number = parseInt(inputs[1]);
    const owner: number = parseInt(inputs[2]);
    const unitType: number = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    const health: number = parseInt(inputs[4]);
    if (unitType == -1) {
      if (owner == 0) {
        if (myQueen.location.x == 0 && myQueen.location.y == 0) {
          myQueen = new Queen(owner, new Coords(x, y), health);
        } else {
          myQueen.health = health;
          myQueen.location = new Coords(x, y);
        }
      } else {
        if (enemyQueen.location.x == 0 && enemyQueen.location.y == 0) {
          enemyQueen = new Queen(owner, new Coords(x, y), health);
        } else {
          enemyQueen.health = health;
          enemyQueen.location = new Coords(x, y);
        }
      }
    }

    units.push(new Unit(owner, new Coords(x, y), health, unitType));
  }

  // GAME CODE
  // Write an action using console.log()
  // To debug: console.error('Debug messages...');
  // First line: A valid queen action
  // Second line: A set of training instructions

  queenTurn();
  trainTurn();
}

// MAKE VSCODE HAPPY
function readline(): string {
  throw new Error("Function not implemented.");
}
