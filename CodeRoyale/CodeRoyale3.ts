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
        if (this.isFriendly && this.barracksSpecs.turnsUntilCanTrain > 0) {
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

    get isFriendly() {
      return this.ownerId === 0;
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

    get isFriendly() {
      return this.ownerId === 0;
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

    bunkerBox = () =>
      state.startLocation === "TOP_LEFT"
        ? new Box(0, 1000 / 3, 1920 / 3, 1000)
        : new Box((1920 / 3) * 2, 0, 1920, (1000 / 3) * 2);

    hunkerCorner = () =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 1000)
        : new Location(1920, 0);

    startCorner = () =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 0)
        : new Location(1920, 1000);
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
    site.isFriendly &&
    site.structureType === "MINE" &&
    site.goldRemaining > 60 &&
    !site.mineSpecs.isMaxedOut &&
    !senses.isSiteThreatenedByKnights(site);

  const shouldExpandTower = (site: Site) =>
    site.isFriendly &&
    site.structureType === "TOWER" &&
    !site.towerSpecs.isBigEnough &&
    !senses.isQueenThreatenedByKnights(30, 160, 1, 9);

  const isGoodMineSite = (site: Site) =>
    !site.isFriendly &&
    site.goldRemaining > 30 &&
    site.structureType !== "TOWER" &&
    !senses.isSiteThreatenedByKnights(site);

  class SetupStrategy implements Strategy {
    logDescription = "Setting up";
    private _nextStrategy: Strategy | void = undefined;

    private getViableSite = () => {
      let sites = state.sites.filter(
        (site) =>
          !site.isFriendly &&
          site.canBeBuiltOn &&
          senses.initialBuildOutBox().contains(site.location)
      );
      if (sites.length === 0) {
        sites = state.sites;
      }

      const viableSites = sites.filter(
        (site) => !site.isFriendly && site.canBeBuiltOn
      );

      if (viableSites.length === 0) {
        return null;
      }

      return viableSites.reduce(
        (nearest, site) =>
          nearest.location.distanceTo(queen.location) >
          site.location.distanceTo(queen.location)
            ? site
            : nearest,
        sites[0]
      );
    };

    private getInitialKnightTarget = () =>
      queen.health >= 75 ? 3 : queen.health >= 50 ? 2 : 1;

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        // approach nearest site within build out box
        const site = this.getViableSite();
        if (site) {
          return queen.move(site.location);
        }
        console.error("No viable site found, WAITING!!!");
        return queen.wait();
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];

      // if it's a mine that is not maxed out, expand it
      if (shouldExpandGoldMine(touchedSite)) {
        return queen.build(queen.touchedSiteId, "MINE");
      }

      // if we can afford 3 knights within 3 turns, build a barracks and exit setup
      if (
        trainer.turnsUntilCanAfford("KNIGHT", this.getInitialKnightTarget()) <=
        this.getInitialKnightTarget() - 1
      ) {
        if (
          !touchedSite.isFriendly &&
          touchedSite.canBeBuiltOn &&
          state.friendlyKnightBarracks.length < 1
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
        }
        const viableSite = this.getViableSite();
        if (viableSite) {
          return queen.move(viableSite.location);
        }
        console.error("NO VIABLE INIT SITES WTF");
        return queen.move(senses.hunkerCorner());
      }

      // build mine if it's decent
      if (isGoodMineSite(touchedSite)) {
        return queen.build(queen.touchedSiteId, "MINE");
      }

      // default to building a tower
      if (!touchedSite.isFriendly && touchedSite.canBeBuiltOn) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }

      // If there's nothing to do at this site, move on
      const site = this.getViableSite();
      if (site) {
        return queen.move(site.location);
      }
      console.error("No viable site found, WAITING!!!");
      return queen.wait();
    };

    trainerStep = () => {
      if (state.incomeRate > 3 && state.friendlyKnights.length > 0) {
        this._nextStrategy = new BunkerStrategy();
      }
      if (
        state.friendlyKnightBarracks.length > 0 &&
        trainer.turnsUntilCanAfford("KNIGHT", this.getInitialKnightTarget()) ===
          0
      ) {
        return trainer.trainAt(state.friendlyKnightBarracks[0].id);
      }
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
      const viableSites = state.sites.filter(
        (site) =>
          !site.isFriendly &&
          site.canBeBuiltOn &&
          !senses.isSiteThreatenedByTowers(site)
      );

      if (viableSites.length === 0) {
        return null;
      }

      // Closest one to queen
      const site = viableSites.reduce(
        (nearest, site) =>
          nearest.location.distanceTo(queen.location) >
          site.location.distanceTo(queen.location)
            ? site
            : nearest,
        viableSites[0]
      );

      return site;
    };

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        // approach nearest safe, unowned building site
        const site = this.getViableSite();
        if (site) {
          return queen.move(site.location);
        }
        console.error("No viable site found, HUNKERING!!");
        return queen.move(senses.hunkerCorner());
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
      if (!touchedSite.isFriendly && touchedSite.canBeBuiltOn) {
        console.error(
          state.enemyQueen.location.distanceTo(touchedSite.location)
        );
        if (state.enemyQueen.location.distanceTo(touchedSite.location) < 175) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        if (
          state.friendlyKnightBarracks.length < 1 &&
          trainer.turnsUntilCanAfford("KNIGHT", 2) < 3
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
        }
        if (
          state.enemyTowers.length > 3 &&
          state.friendlyGiantBarracks.length < 1 &&
          trainer.turnsUntilCanAfford("GIANT", 1) < 2
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "GIANT");
        }
        if (senses.isSiteThreatenedByKnights(touchedSite, 250, 3)) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        if (isGoodMineSite(touchedSite)) {
          return queen.build(queen.touchedSiteId, "MINE");
        }
        if (touchedSite.isFriendly && touchedSite.structureType === "TOWER") {
          if (
            state.incomeRate < 6 &&
            touchedSite.goldRemaining > 200 &&
            touchedSite.maxMineSize > 1
          ) {
            return queen.build(queen.touchedSiteId, "MINE");
          }
        }
        if (!touchedSite.isFriendly && touchedSite.canBeBuiltOn) {
          if (state.incomeRate < 9 && touchedSite.goldRemaining > 80) {
            return queen.build(queen.touchedSiteId, "MINE");
          }
          return queen.build(queen.touchedSiteId, "TOWER");
        }
      }

      // If there's nothing to do at this site, move on
      const site = this.getViableSite();
      if (site) {
        return queen.move(site.location);
      }

      console.error("No viable site found, HUNKERING!!!");
      return queen.move(senses.hunkerCorner());
    };

    trainerStep = () => {
      if (
        state.friendlyGiantBarracks.length > 1 &&
        state.friendlyGiants.length < state.enemyTowers.length / 3 &&
        trainer.turnsUntilCanAfford("GIANT", 1) < 2
      ) {
        return trainer.trainAt(state.friendlyGiantBarracks[0].id);
      }
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
      // if the queen is threatened by MANY knights, hunker in bunker
      if (senses.isQueenThreatenedByKnights(150, 600, 4, 21)) {
        return new BunkerStrategy();
      }

      return;
    };
  }

  class BunkerStrategy implements Strategy {
    logDescription = "Hunkering in Bunker!";
    private _hasInitHunkerPassed = false;

    private areTooManyKnightsInHunkerBox = (
      minKnights: number,
      maxKnights: number,
      exponent = 1
    ) => {
      const scaledKnightCount =
        (maxKnights - minKnights) * Math.pow(queen.health / 100, exponent) +
        minKnights;
      return (
        state.enemyKnights.filter((knight) =>
          senses.bunkerBox().contains(knight.location)
        ).length > scaledKnightCount
      );
    };
    private safeCorner = () => {
      if (this.areTooManyKnightsInHunkerBox(3, 11)) {
        return senses.startCorner();
      }
      return senses.hunkerCorner();
    };

    private getViableSite = () => {
      let sites = state.sites.filter(
        (site) =>
          senses.bunkerBox().contains(site.location) &&
          site.canBeBuiltOn &&
          !site.isFriendly
      );

      if (sites.length === 0) {
        return null;
      }

      return sites.reduce(
        (nearest, site) =>
          nearest.location.distanceTo(queen.location) >
          site.location.distanceTo(queen.location)
            ? site
            : nearest,
        sites[0]
      );
    };

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        // if there is a viable site in the bunker box, approach it
        const site = this.getViableSite();
        if (site) {
          return queen.move(site.location);
        }
        return queen.move(this.safeCorner());
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];
      // if lots of money/income and no archer barracks, build one if possible
      if (
        (state.gold > 300 || state.incomeRate > 8) &&
        !touchedSite.isFriendly &&
        touchedSite.canBeBuiltOn &&
        state.friendlyArcherBarracks.length === 0
      ) {
        return queen.build(queen.touchedSiteId, "BARRACKS", "ARCHER");
      }

      // Expand if it's a tower that's not kinda big
      if (
        touchedSite.structureType === "TOWER" &&
        touchedSite.towerSpecs.range < 255
      ) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }

      // build a tower if possible
      if (touchedSite.canBeBuiltOn && !touchedSite.isFriendly) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }

      // if there are viable sites, approach one
      const viableSite = this.getViableSite();
      if (viableSite) {
        return queen.move(viableSite.location);
      }

      // If nothing else to do run to far corner
      return queen.move(this.safeCorner());
    };

    trainerStep = () => {
      // if we can afford archers and have a barracks
      if (
        trainer.turnsUntilCanAfford("ARCHER") < 2 &&
        state.friendlyArcherBarracks.length > 0
      ) {
        return trainer.trainAt(state.friendlyArcherBarracks[0].id);
      }
      // if we can afford many knights and have a barracks
      if (
        trainer.turnsUntilCanAfford("KNIGHT", 2) < 2 &&
        state.friendlyKnightBarracks.length > 0
      ) {
        return trainer.trainAt(state.friendlyKnightBarracks[0].id);
      }
      return trainer.wait();
    };

    nextStrategy = () => {
      if (!this._hasInitHunkerPassed) {
        // if there are no sites left in the bunker box
        if (
          this.getViableSite() === null &&
          !this.areTooManyKnightsInHunkerBox(1, 4)
        ) {
          this._hasInitHunkerPassed = true;
        }
      }
      if (this._hasInitHunkerPassed) {
        // if the queen is super safe, go to the next strategy
        if (
          !senses.isQueenThreatenedByKnights(400, 1300, 2, 7) &&
          !this.areTooManyKnightsInHunkerBox(1, 7)
        ) {
          return new ExploreStrategy();
        }
      }
      return;
    };
  }

  //   class GoldDiggerStrategy implements Strategy {}

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

    update = () => {
      const inputs: string[] = readline().split(" ");
      this.gold = parseInt(inputs[0]);
      queen.touchedSiteId = parseInt(inputs[1]); // -1 if none
      for (let i = 0; i < numSites; i++) {
        const inputs: string[] = readline().split(" ");
        const siteId: number = parseInt(inputs[0]);
        this.siteRecord[siteId].goldRemaining = parseInt(inputs[1]); // -1 if unknown
        this.siteRecord[siteId].maxMineSize = parseInt(inputs[2]); // -1 if unknown
        this.siteRecord[siteId].structureTypeId = parseInt(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
        this.siteRecord[siteId].ownerId = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
        this.siteRecord[siteId].param1 = parseInt(inputs[5]);
        this.siteRecord[siteId].param2 = parseInt(inputs[6]);
      }
      const numUnits: number = parseInt(readline());
      this.units = [];
      for (let i = 0; i < numUnits; i++) {
        const inputs: string[] = readline().split(" ");
        const x: number = parseInt(inputs[0]);
        const y: number = parseInt(inputs[1]);
        const owner: number = parseInt(inputs[2]);
        const unitType: number = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
        const health: number = parseInt(inputs[4]);
        this.units.push(new Unit(x, y, health, owner, unitType));
        if (owner === 0 && unitType === -1 && this.startLocation === null) {
          // The game just started. Store init variables
          this.startLocation = x < 500 ? "TOP_LEFT" : "BOTTOM_RIGHT";
        }
      }
    };

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
        (unit) => unit.isFriendly && unit.unitType === "KNIGHT"
      );
    }

    get friendlyGiants() {
      return this.units.filter(
        (unit) => unit.isFriendly && unit.unitType === "GIANT"
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
        (unit) => unit.isFriendly && unit.unitType === "QUEEN"
      ) as Unit; // there will always be a friendly queen
    }

    get friendlyKnightBarracks() {
      return this.sites.filter(
        (site) =>
          site.isFriendly &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "KNIGHT"
      );
    }

    get friendlyArcherBarracks() {
      return this.sites.filter(
        (site) =>
          site.isFriendly &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "ARCHER"
      );
    }

    get friendlyGiantBarracks() {
      return this.sites.filter(
        (site) =>
          site.isFriendly &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "GIANT"
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
    state.update();
    currentStrategy = executor.execute(currentStrategy) || currentStrategy;
  }
}
