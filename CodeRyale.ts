let unitsTracked = 0;
const sites: Record<number, Site> = {};

class Unit {
  owner: number;
  location: Coords;
  health: number;

  constructor(owner: number, location: Coords, health: number) {
    this.owner = owner;
    this.location = location;
    this.health = health;
  }

  isMine = () => this.owner === 0;
}

class Queen extends Unit {
  desiredTypeCounts: Record<string, number> = {
    ARCHER: 2,
    KNIGHT: 3,
  };

  constructor(owner: number, location: Coords, health: number) {
    super(owner, location, health);
  }

  nearestSite = (sites: Site[]) => {
    const sorted = sites.sort(
      (a, b) =>
        this.location.distanceBetween(a.location) -
        this.location.distanceBetween(b.location)
    );

    return sorted.find((s) => s.owner === -1);
  };

  ownedSites = (sites: Site[]) => sites.filter((s) => s.owner === 0);

  ownedTypesCounts = (sites: Site[]): Record<string, number> => {
    const counts = this.ownedSites(sites)
      .map((s) => s.type)
      .filter((t) => t !== -1)
      .reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

    return counts;
  };

  buildNextTypeAtNearestSite = (sites: Site[]) => {
    const site = this.nearestSite(sites);
    if (site) {
      this.buildNextType(site.id.toString());
    }
  };

  buildNextType = (siteId: string) => {
    let nextSiteType = "ARCHER";
    if (
      this.ownedTypesCounts(Object.values(sites)).ARCHER >=
      this.desiredTypeCounts.ARCHER
    ) {
      nextSiteType = "KNIGHT";
    }
    if (
      this.ownedTypesCounts(Object.values(sites)).KNIGHT >=
      this.desiredTypeCounts.KNIGHT
    ) {
      nextSiteType = "";
    }

    if (nextSiteType) {
      this.buildBarracks(siteId, nextSiteType);
    } else {
      // Introducing a code smell... Separate concerns!
      this.attackNearestEnemySite(Object.values(sites));
    }
  };

  attackNearestEnemySite = (sites: Site[]) => {
    const sorted = sites.sort(
      (a, b) =>
        this.location.distanceBetween(a.location) -
        this.location.distanceBetween(b.location)
    );

    const enemySite = sorted.find((s) => s.owner === 1);
    if (enemySite) {
      this.attackSite(enemySite);
    }
  };

  attackSite = (site: Site) => {
    this.moveToLocation(site.location.x, site.location.y);
  };

  // attack by just moving to the site
  moveToLocation = (x: number, y: number) => console.log(`MOVE ${x} ${y}`);

  buildBarracks = (siteId: string, type: string) =>
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
    this.type = type;
    this.owner = owner;
    this.param1 = param1;
    this.param2 = param2;
  };

  loggable = () =>
    `id: ${this.id} | type: ${this.type} | owner: ${this.owner} | param1: ${this.param1} | param2: ${this.param2} | radius: ${this.radius}`;
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
  // READ TURN STUFF
  var inputs: string[] = readline().split(" ");
  const gold: number = parseInt(inputs[0]);
  const touchedSite: number = parseInt(inputs[1]); // -1 if none
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
    console.error(sites[siteId].loggable());
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
    console.error(
      `type: ${unitType} | loc: ${x}, ${y} | owner: ${owner} | health: ${health}`
    );
  }

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');

  // First line: A valid queen action
  // Second line: A set of training instructions
  myQueen.buildNextTypeAtNearestSite(Object.values(sites));

  const ownedBarracks = Object.values(sites).filter(
    (s) => s.owner === 0 && s.type === 2
  );

  if (ownedBarracks.length > 0) {
    // create a string of barracks ids separated by spaces
    const barracksIds = ownedBarracks.map((b) => b.id).join(" ");
    console.log(`TRAIN ${barracksIds}`);
  }
}

// MAKE VSCODE HAPPY
function readline(): string {
  throw new Error("Function not implemented.");
}
