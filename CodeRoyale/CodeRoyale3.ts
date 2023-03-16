namespace CodeRoyale3 {
  class Location {
    x: number;
    y: number;
    radius: number;

    constructor(x: number, y: number, radius = 0) {
      this.x = x;
      this.y = y;
      this.radius = radius;
    }

    distanceTo = (location: Location) => {
      return Math.sqrt(
        Math.pow(this.x - location.x, 2) + Math.pow(this.y - location.y, 2)
      );
    };

    nearest = (locations: Location[]) => {
      let nearest: Location | null = null;
      let nearestDistance = Number.MAX_VALUE;
      locations.forEach((location) => {
        const distance = this.distanceTo(location);
        if (distance < nearestDistance) {
          nearest = location;
          nearestDistance = distance;
        }
      });
      return { nearest, distance: nearestDistance };
    };
  }

  // Defines a rectangle using two corners
  class Box {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    }

    contains = (location: Location) => {
      return (
        location.x >= this.x1 &&
        location.x <= this.x2 &&
        location.y >= this.y1 &&
        location.y <= this.y2
      );
    };
  }

  type BarracksType = "KNIGHT" | "ARCHER" | "GIANT";
  type StructureType = "MINE" | "TOWER" | "BARRACKS" | "NONE";
  class Site {
    id: number;
    location: Location;
    maxMineSize = -1;
    goldRemaining = -1;
    structureTypeId = -1;
    ownerId = -1;
    param1 = -1;
    param2 = -1;

    constructor(id: number, x: number, y: number, r: number) {
      this.id = id;
      this.location = new Location(x, y, r);
    }

    get structureType(): StructureType {
      switch (this.structureTypeId) {
        case -1:
          return "NONE";
        case 0:
          return "MINE";
        case 1:
          return "TOWER";
        case 2:
          return "BARRACKS";
        default:
          throw new Error("Unknown structure type");
      }
    }

    get canBeBuiltOn() {
      if (this.structureType === "BARRACKS") {
        if (this.ownerId === 0 && this.barracksSpecs.turnsUntilCanTrain > 0) {
          // Can't build on friendly barracks that are training
          return false;
        }
        // todo: check if can build on hostile barracks that are training
      }
      if (this.structureType === "TOWER" && this.ownerId === 1) {
        // Can't build on enemy towers
        return false;
      }
      return true;
    }

    get towerSpecs() {
      return {
        hp: this.param1,
        range: this.param2,
        isBigEnough: this.param2 > 310, // TODO: check if this is correct/useful
      };
    }

    get barracksSpecs() {
      const type: BarracksType =
        this.param2 === 0 ? "KNIGHT" : this.param2 === 1 ? "ARCHER" : "GIANT";
      return {
        turnsUntilCanTrain: this.param1,
        type,
      };
    }

    get mineSpecs() {
      return {
        incomeRate: this.param1,
        isMaxedOut: this.param1 === this.maxMineSize,
      };
    }
  }

  class Unit {
    location: Location;
    health: number;
    ownerId: number;
    unitTypeId: number;

    constructor(
      x: number,
      y: number,
      health: number,
      ownerId: number,
      unitTypeId: number
    ) {
      this.location = new Location(x, y);
      this.health = health;
      this.ownerId = ownerId;
      this.unitTypeId = unitTypeId;
    }

    get unitType() {
      switch (this.unitTypeId) {
        case -1:
          return "QUEEN";
        case 0:
          return "KNIGHT";
        case 1:
          return "ARCHER";
        case 2:
          return "GIANT";
        default:
          throw new Error("Unknown unit type");
      }
    }
  }

  class Senses {
    /**
     *
     * @param proximityMin - how close to let enemy knights when health is high
     * @param proximityMax - how far to keep enemy knights when health is low
     * @param countMin - how many knights are scary when health is low
     * @param countMax - how bold can we be when health is high
     * @param exponent - how extremely to scale with health (1 = linear)
     * @returns true if there are too many enemy knights nearby
     */
    isQueenThreatenedByKnights = (
      proximityMin = 100,
      proximityMax = 750,
      countMin = 2,
      countMax = 16,
      exponent = 1.8
    ) =>
      state.enemyKnights.filter(
        (knight) =>
          knight.location.distanceTo(queen.location) <
          proximityMax -
            (proximityMax - proximityMin) *
              Math.pow(queen.health / 100, exponent)
      ).length >=
      (countMax - countMin) * Math.pow(queen.health / 100, exponent) + countMin;

    isSiteThreatenedByTowers = (site: Site, tolerance = 50) =>
      state.enemyTowers.some(
        (tower) =>
          tower.location.distanceTo(site.location) <
          tower.towerSpecs.range - tolerance
      );

    isSiteThreatenedByKnights = (site: Site, range = 220, count = 1) =>
      state.enemyKnights.filter(
        (knight) => knight.location.distanceTo(site.location) < range
      ).length >= count;

    initialBuildOutBox = () =>
      state.startLocation === "TOP_LEFT"
        ? new Box(0, 0, 1920 / 2, 1000 / 2)
        : new Box(1920 / 2, 1000 / 2, 1920, 1000);
  }

  class Queen {
    private static instance: Queen;
    touchedSiteId = -1;
    get location() {
      return state.friendlyQueen.location;
    }
    get health() {
      return state.friendlyQueen.health;
    }

    private constructor() {}

    static getInstance(): Queen {
      if (!Queen.instance) {
        Queen.instance = new Queen();
      }
      return Queen.instance;
    }

    move = (target: Location) => {
      return `MOVE ${target.x} ${target.y}`;
    };

    wait = () => {
      return "WAIT";
    };

    build = (
      siteId: number,
      buildingType: "MINE" | "TOWER" | "BARRACKS",
      barracksType?: "KNIGHT" | "ARCHER" | "GIANT"
    ) => {
      if (barracksType) {
        return `BUILD ${siteId} ${buildingType}-${barracksType}`;
      } else {
        return `BUILD ${siteId} ${buildingType}`;
      }
    };
  }

  class Trainer {
    readonly UnitCosts = {
      KNIGHT: 80,
      ARCHER: 100,
      GIANT: 140,
    };

    turnsUntilCanAfford = (
      unitType: "KNIGHT" | "ARCHER" | "GIANT",
      unitCount = 1
    ) => {
      console.error(
        `incomeRate: ${state.incomeRate} gold: ${state.gold} cost: ${
          this.UnitCosts[unitType] * unitCount
        }`
      );
      if (state.gold >= this.UnitCosts[unitType] * unitCount) {
        return 0;
      }
      return Math.ceil(
        (this.UnitCosts[unitType] * unitCount - state.gold) / state.incomeRate -
          1 // subtracting one because our known income rate seems to lag behind by a turn
      );
    };
    trainAt = (barracksId: number) => {
      return `TRAIN ${barracksId}`;
    };

    wait = () => {
      return "TRAIN";
    };
  }

  class Executor {
    execute = (strategy: Strategy) => {
      const { queenStep, trainerStep, nextStrategy, logDescription } = strategy;
      console.log(queenStep());
      console.log(trainerStep());
      console.error(logDescription);
      return nextStrategy();
    };
  }

  interface Strategy {
    queenStep: () => string;
    trainerStep: () => string;
    nextStrategy: () => Strategy | void;
    logDescription: string;
  }

  const shouldExpandGoldMine = (site: Site) =>
    site.ownerId === 0 &&
    site.structureType === "MINE" &&
    site.goldRemaining > 60 &&
    !site.mineSpecs.isMaxedOut &&
    !senses.isSiteThreatenedByKnights(site);

  const shouldExpandTower = (site: Site) =>
    site.ownerId === 0 &&
    site.structureType === "TOWER" &&
    !site.towerSpecs.isBigEnough &&
    !senses.isQueenThreatenedByKnights(30, 160, 1, 9);

  const isGoodMineSite = (site: Site) =>
    site.ownerId !== 0 &&
    site.goldRemaining > 30 &&
    site.structureType !== "TOWER" &&
    !senses.isSiteThreatenedByKnights(site);

  class SetupStrategy implements Strategy {
    logDescription = "Setting up";
    private _nextStrategy: Strategy | void = undefined;

    private sitesWithinBuildOutBox = () =>
      state.sites.filter((site) =>
        senses.initialBuildOutBox().contains(site.location)
      );

    private getViableSite = () =>
      this.sitesWithinBuildOutBox().reduce((nearest, site) =>
        site.ownerId !== 0 &&
        nearest.location.distanceTo(queen.location) >
          site.location.distanceTo(queen.location)
          ? site
          : nearest
      );

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        // approach nearest site within build out box
        return queen.move(this.getViableSite().location);
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];

      // if it's a mine that is not maxed out, expand it
      if (shouldExpandGoldMine(touchedSite)) {
        return queen.build(queen.touchedSiteId, "MINE");
      }

      // if we can afford 3 knights within 3 turns, build a barracks and exit setup
      if (trainer.turnsUntilCanAfford("KNIGHT", 3) <= 3) {
        this._nextStrategy = new ExploreStrategy(); // May want to go right into defensive at first
        return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
      }

      // build mine if it's decent
      if (isGoodMineSite(touchedSite)) {
        return queen.build(queen.touchedSiteId, "MINE");
      }

      // If there's nothing to do at this site, move on
      return queen.move(this.getViableSite().location);
    };

    trainerStep = () => {
      return trainer.wait();
    };

    nextStrategy = () => {
      // If queen is threated by knights, go into defensive
      return this._nextStrategy;
    };
  }

  class ExploreStrategy implements Strategy {
    logDescription = "Exploring";

    private getViableSite = () => {
      // keeps returning sites I already own. No idea why and GPT 4 doesn't get it either.
      //   const site = state.sites.reduce((nearest, site) => {
      //     return site.ownerId !== 0 &&
      //       nearest.location.distanceTo(queen.location) >
      //         site.location.distanceTo(queen.location) &&
      //       !senses.isSiteThreatenedByTowers(site)
      //       ? site
      //       : nearest;
      //   });
      const viableSites = state.sites.filter((site) => {
        return site.ownerId !== 0 && !senses.isSiteThreatenedByTowers(site);
      });

      //   const sortedByDistanceFromQueen = viableSites.sort((a, b) => {
      //     return (
      //       a.location.distanceTo(queen.location) -
      //       b.location.distanceTo(queen.location)
      //     );
      //   });
      const site = viableSites.reduce((nearest, site) => {
        return nearest.location.distanceTo(queen.location) >
          site.location.distanceTo(queen.location)
          ? site
          : nearest;
      }, viableSites[0]);

      return site;
    };

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        // approach nearest safe, unowned building site
        return queen.move(this.getViableSite().location);
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];
      // if it's a more or tower that needs to be expanded, do that
      if (shouldExpandTower(touchedSite)) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }
      if (shouldExpandGoldMine(touchedSite)) {
        return queen.build(queen.touchedSiteId, "MINE");
      }
      // if we don't already own it and can build on it
      if (touchedSite.ownerId !== 0 && touchedSite.canBeBuiltOn) {
        // if queen is threated by knights or it's not a good mine site, build towers, else build mines
        if (senses.isQueenThreatenedByKnights()) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        if (isGoodMineSite(touchedSite)) {
          return queen.build(queen.touchedSiteId, "MINE");
        }
        if (touchedSite.ownerId !== 0) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
      }
      return queen.move(this.getViableSite().location);
    };

    trainerStep = () => {
      // If we can afford knights and have a barracks, train knights
      if (
        trainer.turnsUntilCanAfford("KNIGHT") < 2 &&
        state.friendlyKnightBarracks.length > 0
      ) {
        return trainer.trainAt(state.friendlyKnightBarracks[0].id);
      }

      return trainer.wait();
    };
    nextStrategy = () => {
      return;
    };
  }

  class GameState {
    gold = 0;
    siteRecord: Record<number, Site> = {};
    units: Unit[] = [];
    startLocation: "TOP_LEFT" | "BOTTOM_RIGHT" | null = null;

    private static instance: GameState;
    private constructor() {}
    static getInstance(): GameState {
      if (!GameState.instance) {
        GameState.instance = new GameState();
      }
      return GameState.instance;
    }

    get incomeRate() {
      return this.sites.reduce((sum, site) => {
        return site.structureType === "MINE" && site.ownerId === 0
          ? sum + site.mineSpecs.incomeRate
          : sum;
      }, 0);
    }

    get sites() {
      return Object.values(this.siteRecord);
    }

    get enemyKnights() {
      return this.units.filter(
        (unit) => unit.ownerId === 1 && unit.unitType === "KNIGHT"
      );
    }

    get friendlyKnights() {
      return this.units.filter(
        (unit) => unit.ownerId === 0 && unit.unitType === "KNIGHT"
      );
    }

    get enemyTowers() {
      return this.sites.filter(
        (site) => site.ownerId === 1 && site.structureType === "TOWER"
      );
    }

    get enemyQueen() {
      return this.units.find(
        (unit) => unit.ownerId === 1 && unit.unitType === "QUEEN"
      ) as Unit; // there will always be an enemy queen
    }
    get friendlyQueen() {
      return this.units.find(
        (unit) => unit.ownerId === 0 && unit.unitType === "QUEEN"
      ) as Unit; // there will always be a friendly queen
    }

    get friendlyKnightBarracks() {
      return this.sites.filter(
        (site) =>
          site.ownerId === 0 &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "KNIGHT"
      );
    }
  }

  const state = GameState.getInstance();
  const queen = Queen.getInstance();
  const senses = new Senses();
  const executor = new Executor();
  const trainer = new Trainer();

  let currentStrategy: Strategy = new SetupStrategy();

  // game init
  const numSites: number = parseInt(readline());
  for (let i = 0; i < numSites; i++) {
    const inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const x: number = parseInt(inputs[1]);
    const y: number = parseInt(inputs[2]);
    const radius: number = parseInt(inputs[3]);
    state.siteRecord[siteId] = new Site(siteId, x, y, radius);
  }

  // game loop
  while (true) {
    const inputs: string[] = readline().split(" ");
    state.gold = parseInt(inputs[0]);
    queen.touchedSiteId = parseInt(inputs[1]); // -1 if none
    for (let i = 0; i < numSites; i++) {
      const inputs: string[] = readline().split(" ");
      const siteId: number = parseInt(inputs[0]);
      state.siteRecord[siteId].goldRemaining = parseInt(inputs[1]); // -1 if unknown
      state.siteRecord[siteId].maxMineSize = parseInt(inputs[2]); // -1 if unknown
      state.siteRecord[siteId].structureTypeId = parseInt(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
      state.siteRecord[siteId].ownerId = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
      state.siteRecord[siteId].param1 = parseInt(inputs[5]);
      state.siteRecord[siteId].param2 = parseInt(inputs[6]);
    }
    const numUnits: number = parseInt(readline());
    state.units = [];
    for (let i = 0; i < numUnits; i++) {
      const inputs: string[] = readline().split(" ");
      const x: number = parseInt(inputs[0]);
      const y: number = parseInt(inputs[1]);
      const owner: number = parseInt(inputs[2]);
      const unitType: number = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
      const health: number = parseInt(inputs[4]);
      state.units.push(new Unit(x, y, health, owner, unitType));
      if (owner === 0 && unitType === -1 && state.startLocation === null) {
        // The game just started. Store init variables
        state.startLocation = x < 500 ? "TOP_LEFT" : "BOTTOM_RIGHT";
      }
    }

    // Write an action using console.log()
    // To debug: console.error('Debug messages...');

    // First line: A valid queen action
    // Second line: A set of training instructions
    currentStrategy = executor.execute(currentStrategy) || currentStrategy;
  }
}
