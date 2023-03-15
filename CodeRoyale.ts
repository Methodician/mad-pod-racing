namespace CodeRoyale2 {
  class GameState {
    gold = 0;
    isInitBuildDone = false;
    // Can track income rate to decide when to build mines, barracks, or train units based on 2-3 consecutive trainings, or even multiple barracks training simultaneously to overwhhelming enemy
    get incomeRate() {
      return this.friendlyGoldMines.reduce(
        (acc, site) => acc + site.mineSpecs.incomeRate,
        0
      );
    }
    startLocation = new Location(0, 0);
    sites: Record<number, SiteI> = {};
    units: UnitI[] = [];

    private static instance: GameState;
    private constructor() {}
    static getInstance() {
      if (!GameState.instance) {
        GameState.instance = new GameState();
      }
      return GameState.instance;
    }

    get retreatCorner() {
      if (this.startLocation.x < 1920 / 2) {
        return new Location(0, 1000);
      }
      return new Location(1920, 0);
    }

    get initBuildBox() {
      if (this.startLocation.x < 1920 / 2) {
        return new BoxBounds(
          new Location(0, 0),
          new Location(1920 / 2 - 50, 1000 / 2)
        );
      }
      return new BoxBounds(
        new Location(1920 / 2 + 50, 1000 / 2),
        new Location(1920, 1000)
      );
    }

    get initBuildSites() {
      const sites = this.allSites.filter((site) =>
        this.initBuildBox.contains(site.location)
      );

      if (sites.every((site) => site.structureType !== "NONE")) {
        console.error("Init build done!");
        this.isInitBuildDone = true;
      }
      return sites;
    }

    get allSites() {
      return Object.values(this.sites);
    }

    get friendlyTowers() {
      return this.allSites.filter(
        (site) => site.ownerId === 0 && site.structureType === "TOWER"
      );
    }

    get friendlyKnightBarracks() {
      return this.allSites.filter(
        (site) =>
          site.ownerId === 0 &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "KNIGHT"
      );
    }

    get friendlyArcherBarracks() {
      return this.allSites.filter(
        (site) =>
          site.ownerId === 0 &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "ARCHER"
      );
    }

    get friendlyGiantBarracks() {
      return this.allSites.filter(
        (site) =>
          site.ownerId === 0 &&
          site.structureType === "BARRACKS" &&
          site.barracksSpecs.type === "GIANT"
      );
    }

    get friendlyGoldMines() {
      return this.allSites.filter(
        (site) => site.ownerId === 0 && site.structureType === "MINE"
      );
    }

    get hostileTowers() {
      return this.allSites.filter(
        (site) => site.ownerId === 1 && site.structureType === "TOWER"
      );
    }

    get hostileQueen() {
      return this.units.find(
        (unit) => unit.ownerId === 1 && unit.unitType === "QUEEN"
      ) as UnitI;
    }

    get hostileKnights() {
      return this.units.filter(
        (unit) => unit.ownerId === 1 && unit.unitType === "KNIGHT"
      );
    }

    get hostileGiants() {
      return this.units.filter(
        (unit) => unit.ownerId === 1 && unit.unitType === "GIANT"
      );
    }

    get friendlyGiants() {
      return this.units.filter(
        (unit) => unit.ownerId === 0 && unit.unitType === "GIANT"
      );
    }

    getSite(id: number) {
      return this.sites[id];
    }

    turnsUntilCanAfford = (cost: number) => {
      const canAfford = this.gold >= cost;
      if (canAfford) {
        return 0;
      }
      const goldNeeded = cost - this.gold;
      return Math.ceil(goldNeeded / this.incomeRate) - 1;
    };
  }

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

  class BoxBounds {
    a: Location;
    b: Location;

    constructor(a: Location, b: Location) {
      this.a = a;
      this.b = b;
    }

    contains = (location: Location) => {
      return (
        location.x >= this.a.x &&
        location.x <= this.b.x &&
        location.y >= this.a.y &&
        location.y <= this.b.y
      );
    };
  }

  // class Line {
  //   l1: Location;
  //   l2: Location;
  //   constructor(l1: Location, l2: Location) {
  //     this.l1 = l1;
  //     this.l2 = l2;
  //   }

  //   intersectsCircle = (location: Location) => {
  //     const { x, y, radius } = location;
  //     const { x: x1, y: y1 } = this.l1;
  //     const { x: x2, y: y2 } = this.l2;

  //     // find slope
  //     const m = (y2 - y1) / (x2 - x1);
  //   };
  // }

  type BarracksType = "KNIGHT" | "ARCHER" | "GIANT";
  type StructureType = "MINE" | "TOWER" | "BARRACKS" | "NONE";
  interface SiteI {
    id: number;
    location: Location;
    maxMineSize: number;
    goldRemaining: number;
    structureTypeId: number;
    structureType: StructureType;
    ownerId: number;
    param1: number;
    param2: number;
    canBeBuiltOn: boolean;
    towerSpecs: {
      hp: number;
      range: number;
      isBigEnough: boolean;
    };
    barracksSpecs: {
      turnsUntilCanTrain: number;
      type: BarracksType;
    };
    mineSpecs: {
      incomeRate: number;
      isMaxedOut: boolean;
    };
  }

  class Site implements SiteI {
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

  interface UnitI {
    location: Location;
    health: number;
    ownerId: number;
    unitType: "QUEEN" | "KNIGHT" | "ARCHER" | "GIANT";
  }

  class Unit implements UnitI {
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

  class QueenSenses {
    scaledProximityThreshold = (min: number, max: number, exponent = 1.8) => {
      if (max < min) {
        throw new Error("max must be greater than min");
      }
      if (min < 1) {
        throw new Error("min must be greater than 0");
      }
      const queenHealthFraction = queen.health / 100;
      // https://www.wolframalpha.com/input?i=plot+1000+-+800%28x%5E1.8%29+from+0+to+1
      // max - (max - min) * queenHealthFraction^exponent
      return max - (max - min) * Math.pow(queenHealthFraction, exponent);
    };

    scaledAttackerCountThreshold = (
      min: number,
      max: number,
      exponent = 1.8
    ) => {
      if (max < min) {
        throw new Error("max must be greater than or equal to min");
      }
      if (min < 1) {
        throw new Error("min must be greater than or equal to 1");
      }
      const queenHealthFraction = queen.health / 100;
      // https://www.wolframalpha.com/input?i=plot+10%28x%5E1.8%29+%2B+0+from+0+to+1
      // (max - min) * queenHealthFraction^exponent +_min
      return (max - min) * Math.pow(queenHealthFraction, exponent) + min;
    };

    /**
     *
     * @param proximityMin - how close to let enemy knights when health is high
     * @param proximityMax - how far to keep enemy knights when health is low
     * @param countMin - how many knights are scary when health is low
     * @param countMax - how bold can we be when health is high
     * @returns true if there are too many enemy knights nearby
     */
    isThreatenedByKnights = (
      proximityMin = 100,
      proximityMax = 750,
      countMin = 2,
      countMax = 16
    ) => {
      const enemyKnightLocations = gameState.units
        .filter((unit) => unit.ownerId === 1 && unit.unitType === "KNIGHT")
        .map((unit) => unit.location);
      const proximityThreshold = this.scaledProximityThreshold(
        proximityMin,
        proximityMax
      );
      const countThreshold = this.scaledAttackerCountThreshold(
        countMin,
        countMax
      );
      const knightLocationsTooClose = enemyKnightLocations.filter(
        (knight) => queen.location.distanceTo(knight) < proximityThreshold
      );

      return knightLocationsTooClose.length >= countThreshold;
    };

    isSiteNearEnemyTower = (site: Site) => {
      const isNearEnemyTower = gameState.hostileTowers.some(
        (tower) =>
          tower.location.distanceTo(site.location) < tower.towerSpecs.range
      );
      return isNearEnemyTower;
    };
  }

  class Queen {
    private static instance: Queen;
    touchedSiteId = -1;
    location = new Location(-1, -1);
    health = 0;

    private constructor() {}

    update(x: number, y: number, health: number, touchedSiteId: number) {
      this.location.x = x;
      this.location.y = y;
      this.health = health;
      this.touchedSiteId = touchedSiteId;
    }

    static getInstance(): Queen {
      if (!Queen.instance) {
        Queen.instance = new Queen();
      }
      return Queen.instance;
    }

    // Should be able to detect obstacles and move around them
    // If a site is between queen and target, taking into account the site
    // radius, and queen radius, generate intermediate points to move to
    move = (target: Location) => {
      // const straightPath = new Line(queen.location, target);
      // const intersectingSites = gameState.allSites.filter((site) =>
      //   straightPath.intersectsCircle(site.location)
      // );
      // if (intersectingSites.length > 0) {
      //   console.error(
      //     `Queen is blocked by a site: ${intersectingSites[0].id} at ${intersectingSites[0].location.x}, ${intersectingSites[0].location.y}`
      //   );
      // }
      // if (intersectingSites.length === 0) {
      //   console.log(`MOVE ${target.x} ${target.y}`);
      //   return;
      // }

      console.log(`MOVE ${target.x} ${target.y}`);
    };

    wait = () => {
      console.log("WAIT");
    };

    build = (
      siteId: number,
      buildingType: "MINE" | "TOWER" | "BARRACKS",
      barracksType?: "KNIGHT" | "ARCHER" | "GIANT"
    ) => {
      if (barracksType) {
        console.log(`BUILD ${siteId} ${buildingType}-${barracksType}`);
      } else {
        console.log(`BUILD ${siteId} ${buildingType}`);
      }
    };
  }

  class Trainer {
    private static instance: Trainer;
    private constructor() {}

    static getInstance(): Trainer {
      if (!Trainer.instance) {
        Trainer.instance = new Trainer();
      }
      return Trainer.instance;
    }

    trainAt = (barracksId: number) => {
      console.log(`TRAIN ${barracksId}`);
    };

    wait = () => {
      console.log("TRAIN");
    };
  }

  interface Strategy {
    queenStep: () => void;
    trainStep: () => void;
    execute: () => void;
    // nextStrategy: () => Strategy;
  }

  class ExploreStrategy implements Strategy {
    execute = () => {
      console.error("Strategy: Explore");
      this.queenStep();
      this.trainStep();
    };

    queenStep = () => {
      const structureTypeToBuild = this.structureTypeToBuild();
      const touchedSite = gameState.getSite(queen.touchedSiteId);
      if (
        queen.touchedSiteId !== -1 &&
        !(touchedSite.ownerId === 0 && touchedSite.structureType !== "NONE") &&
        structureTypeToBuild !== "NONE" &&
        touchedSite.canBeBuiltOn
      ) {
        if (
          gameState.hostileQueen.location.distanceTo(touchedSite.location) < 400
        ) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        if (structureTypeToBuild === "BARRACKS") {
          return queen.build(
            queen.touchedSiteId,
            structureTypeToBuild,
            "ARCHER"
          );
        } else {
          return queen.build(queen.touchedSiteId, structureTypeToBuild);
        }
      }
      // if initial build out out is not done, nearest viable site in build out box
      if (!gameState.isInitBuildDone) {
        const nearestViableSite = gameState.initBuildSites
          .sort(
            (a, b) =>
              a.location.distanceTo(queen.location) -
              b.location.distanceTo(queen.location)
          )
          .find((site) => site.structureType === "NONE");
        if (nearestViableSite) {
          return queen.move(nearestViableSite.location);
        }
      }

      // if queen is under threat, find a viable site near start, else nearest queen
      const isUnderThreat = queenSenses.isThreatenedByKnights(300, 1200, 1, 20);
      if (isUnderThreat) {
        console.error("Looking near home");
      } else {
        console.error("Looking near queen");
      }

      let viableSitesNearStart = gameState.allSites.filter(
        (site) => site.ownerId !== 0 && !queenSenses.isSiteNearEnemyTower(site)
      );

      if (viableSitesNearStart.length < 1) {
        viableSitesNearStart = gameState.allSites.filter(
          (site) => site.ownerId !== 0
        );
      }

      viableSitesNearStart = viableSitesNearStart.sort((a, b) =>
        isUnderThreat
          ? a.location.distanceTo(gameState.startLocation) -
            b.location.distanceTo(gameState.startLocation)
          : a.location.distanceTo(queen.location) -
            b.location.distanceTo(queen.location)
      );

      if (viableSitesNearStart.length > 0) {
        return queen.move(viableSitesNearStart[0].location);
      }

      console.error("NO VIABLE SITES so just sitting WTF");
      return queen.wait();
    };

    trainStep = () => {
      // Train archers if we have a barracks and enemy has too many knights or giants
      if (
        gameState.friendlyArcherBarracks.length > 0 &&
        (gameState.hostileKnights.length >= 8 ||
          queenSenses.isThreatenedByKnights(200, 500, 3, 11) ||
          gameState.hostileGiants.length > 0)
      ) {
        const archerBarracks = gameState.friendlyArcherBarracks.find(
          (site) => site.barracksSpecs.turnsUntilCanTrain === 0
        );
        if (archerBarracks) {
          return trainer.trainAt(archerBarracks.id);
        }
      }
      // If the enemy queen is generally weak and we can,
      // and we don't need giants, then just make knights
      if (
        gameState.hostileQueen.health < 26 &&
        gameState.friendlyKnightBarracks.length > 0 &&
        !(
          gameState.hostileTowers.length > 3 &&
          gameState.units.filter((unit) => unit.unitType === "GIANT").length < 1
        )
      ) {
        // sort knight barracks by distance to enemy queen
        const knightBarracks = gameState.friendlyKnightBarracks
          .sort(
            (a, b) =>
              a.location.distanceTo(gameState.hostileQueen.location) -
              b.location.distanceTo(gameState.hostileQueen.location)
          )
          .find((site) => site.barracksSpecs.turnsUntilCanTrain === 0);
        if (knightBarracks) {
          return trainer.trainAt(knightBarracks.id);
        }
      }

      // If the enemy has a few towers and we don't have enough giants, train a giant
      const myGiants = gameState.units.filter(
        (unit) => unit.unitType === "GIANT"
      );
      if (
        gameState.hostileTowers.length >= 3 &&
        (myGiants.length < 1 ||
          myGiants.length < gameState.hostileTowers.length / 3)
      ) {
        const giantBarracks = gameState.friendlyGiantBarracks.find(
          (site) => site.barracksSpecs.turnsUntilCanTrain === 0
        );
        if (giantBarracks) {
          return trainer.trainAt(giantBarracks.id);
        }
      }

      // If we have a knight barracks and more than 80 gold, train a knight
      if (gameState.gold >= 80) {
        const knightBarracks = gameState.friendlyKnightBarracks
          .sort(
            (a, b) =>
              a.location.distanceTo(gameState.hostileQueen.location) -
              b.location.distanceTo(gameState.hostileQueen.location)
          )
          .find((site) => site.barracksSpecs.turnsUntilCanTrain === 0);
        if (knightBarracks) {
          return trainer.trainAt(knightBarracks.id);
        }
      }
      return trainer.wait();
    };

    structureTypeToBuild = (): StructureType => {
      if (queen.touchedSiteId === -1) {
        return "NONE";
      }

      const site = gameState.sites[queen.touchedSiteId];
      const closestKnightDistance = () =>
        site.location.nearest(
          gameState.units
            .filter((unit) => unit.unitType === "KNIGHT" && unit.ownerId === 1)
            .map((unit) => unit.location)
        ).distance;

      const closestGiantDistance = () =>
        site.location.nearest(
          gameState.units
            .filter((unit) => unit.unitType === "GIANT" && unit.ownerId === 1)
            .map((unit) => unit.location)
        ).distance;

      const enemyQueenDistance = () =>
        site.location.distanceTo(gameState.hostileQueen.location);

      if (site.structureType === "TOWER" && site.ownerId === 1) {
        // Don't bother if it's an enemy tower

        return "NONE";
      }
      // If the enemy queen is really close default to tower or knight barracks
      if (enemyQueenDistance() < 240) {
        if (gameState.friendlyKnightBarracks.length < 2) {
          return "BARRACKS";
        }
        return "TOWER";
      }
      // If it's a friendly tower, and not maxed out
      if (
        site.structureType === "TOWER" &&
        site.ownerId === 0 &&
        !site.towerSpecs.isBigEnough
      ) {
        // If there's a giant nearby, build an archer barracks
        if (
          closestGiantDistance() < 300 &&
          gameState.friendlyArcherBarracks.length < 1
        ) {
          return "BARRACKS";
        }
        // if no knights are nearby, and it's a good gold site, build a mine
        if (
          !queenSenses.isThreatenedByKnights() &&
          closestKnightDistance() > 300 &&
          site.goldRemaining > 100 &&
          site.maxMineSize > 1
        ) {
          return "MINE";
        }

        return "TOWER";
      }

      console.error(
        `type: ${site.structureType} maxed: ${site.mineSpecs.isMaxedOut} gold: ${site.goldRemaining}`
      );
      // If it's a friendly mine, and not maxed out
      if (
        site.structureType === "MINE" &&
        !site.mineSpecs.isMaxedOut &&
        site.goldRemaining > 100
      ) {
        // if there are enemy knights too close, build a tower
        if (closestKnightDistance() < 300) {
          return "TOWER";
        }

        return "MINE";
      }

      // if nothing is build on it yet
      if (site.structureType === "NONE") {
        // if the queen is highly threatened, or there are nearby knights, build a tower
        if (
          queenSenses.isThreatenedByKnights(200, 500, 1, 9) ||
          closestKnightDistance() < 225
        ) {
          return "TOWER";
        }
        // if there are nearby giants, build a barracks
        if (
          closestGiantDistance() < 300 &&
          gameState.friendlyGiantBarracks.length < 1
        ) {
          return "BARRACKS";
        }
        if (site.goldRemaining > 60) {
          return "MINE";
        }
        return "TOWER";
      }

      console.error(
        `No build strategy for ${site.structureType} at ${site.location.x}, ${site.location.y}`
      );
      return "NONE";
    };
  }

  class BuildKnightBarracksStrategy implements Strategy {
    execute = () => {
      console.error("Strategy: Knight Barracks");
      this.queenStep();
      this.trainStep();
    };

    queenStep = () => {
      // Approach nearest site if not touching one, else build a knight barracks
      if (
        queen.touchedSiteId !== -1 &&
        gameState.getSite(queen.touchedSiteId).structureType === "NONE"
      ) {
        return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
      }
      // if initial build out is not done, nearest viable site to center
      if (!gameState.isInitBuildDone) {
        const center = new Location(1920 / 2, 1000 / 2);
        const nearestViableSite = gameState.allSites
          .sort(
            (a, b) =>
              a.location.distanceTo(center) - b.location.distanceTo(center)
          )
          .find((site) => site.canBeBuiltOn && !(site.ownerId === 0));

        if (nearestViableSite) {
          return queen.move(nearestViableSite.location);
        }
      }
      const viableSites = gameState.allSites
        .filter(
          (site) =>
            site.ownerId !== 0 && !queenSenses.isSiteNearEnemyTower(site)
        )
        .sort(
          (a, b) =>
            a.location.distanceTo(queen.location) -
            b.location.distanceTo(queen.location)
        );
      if (viableSites.length > 0) {
        return queen.move(viableSites[0].location);
      }
      console.error("NO VIABLE SITES so just sitting WTF");
      return queen.wait();
    };

    trainStep = () => {
      // build knights if savings goal is met
      if (
        (gameState.gold >= 155 || gameState.hostileQueen.health < 50) &&
        gameState.friendlyKnightBarracks.length > 0
      ) {
        // build knights at a barracks
        const knightBarracks = gameState.friendlyKnightBarracks
          .sort(
            (a, b) =>
              a.location.distanceTo(gameState.hostileQueen.location) -
              b.location.distanceTo(gameState.hostileQueen.location)
          )
          .find((barracks) => barracks.barracksSpecs.turnsUntilCanTrain === 0);
        if (knightBarracks) {
          return trainer.trainAt(knightBarracks.id);
        }
      }

      return trainer.wait();
    };
  }

  class BuildGiantBarracksStrategy implements Strategy {
    execute = () => {
      console.error("Strategy: Giant Barracks");
      this.queenStep();
      this.trainStep();
    };

    queenStep = () => {
      // Approach nearest site if not touching one, else build a giant barracks
      // Could adapt this to find average enemy tower location and build at safe site near that
      if (
        queen.touchedSiteId !== -1 &&
        gameState.getSite(queen.touchedSiteId).structureType === "NONE"
      ) {
        // if the enemy queen is somewhat near and we don't have a knight barracks
        // near by, build a knight barracks
        if (
          gameState.hostileQueen.location.distanceTo(
            gameState.getSite(queen.touchedSiteId).location
          ) < 330 &&
          (gameState.friendlyKnightBarracks.length < 1 ||
            gameState.hostileQueen.location.nearest(
              gameState.friendlyKnightBarracks.map((b) => b.location)
            ).distance > 750)
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
        }
        // if the enemy queen is too close, build a tower
        if (
          gameState.hostileQueen.location.distanceTo(
            gameState.getSite(queen.touchedSiteId).location
          ) < 225
        ) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        return queen.build(queen.touchedSiteId, "BARRACKS", "GIANT");
      }

      const viableSites = gameState.allSites
        .filter(
          (site) =>
            site.ownerId !== 0 && !queenSenses.isSiteNearEnemyTower(site)
        )
        .sort(
          (a, b) =>
            a.location.distanceTo(queen.location) -
            b.location.distanceTo(queen.location)
        );
      if (viableSites.length > 0) {
        return queen.move(viableSites[0].location);
      }
      console.error("NO VIABLE SITES so just sitting WTF");
      return queen.wait();
    };

    trainStep = () => {
      // build giants if possible
      if (gameState.gold >= 140 && gameState.friendlyGiantBarracks.length > 0) {
        // build giants at a barracks
        const barracks = gameState.friendlyGiantBarracks[0];
        if (barracks) {
          return trainer.trainAt(barracks.id);
        }
      }

      return trainer.wait();
    };
  }

  class BuildArcherBarracksStrategy implements Strategy {
    execute = () => {
      console.error("Strategy: Archer Barracks");
      this.queenStep();
      this.trainStep();
    };

    queenStep = () => {
      // Approach nearest site if not touching one, else build an archer barracks
      if (
        queen.touchedSiteId !== -1 &&
        gameState.getSite(queen.touchedSiteId).structureType === "NONE"
      ) {
        // if the enemy queen is somewhat near and we don't have a knight barracks
        // near by, build a knight barracks
        if (
          // repeated in BuildGiantBarracksStrategy
          gameState.hostileQueen.location.distanceTo(
            gameState.getSite(queen.touchedSiteId).location
          ) < 330 &&
          (gameState.friendlyKnightBarracks.length < 1 ||
            gameState.hostileQueen.location.nearest(
              gameState.friendlyKnightBarracks.map((b) => b.location)
            ).distance > 750)
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
        }

        if (
          // repeated in BuildGiantBarracksStrategy
          gameState.hostileQueen.location.distanceTo(
            gameState.getSite(queen.touchedSiteId).location
          ) < 225
        ) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        return queen.build(queen.touchedSiteId, "BARRACKS", "ARCHER");
      }
      // repeated in BuildGiantBarracksStrategy
      const viableSites = gameState.allSites
        .filter(
          (site) =>
            site.ownerId !== 0 && !queenSenses.isSiteNearEnemyTower(site)
        )
        .sort(
          (a, b) =>
            a.location.distanceTo(queen.location) -
            b.location.distanceTo(queen.location)
        );
      if (viableSites.length > 0) {
        return queen.move(viableSites[0].location);
      }
      console.error("NO VIABLE SITES so just sitting WTF");
      return queen.wait();
    };

    trainStep = () => {
      // build archers if possible
      if (
        gameState.gold >= 100 &&
        gameState.friendlyArcherBarracks.length > 0
      ) {
        // build archers at a barracks
        const barracks = gameState.friendlyArcherBarracks[0];
        if (barracks) {
          return trainer.trainAt(barracks.id);
        }
      }

      return trainer.wait();
    };
  }

  class RetreatStrategy implements Strategy {
    execute = () => {
      console.error("Strategy: RETREAT");
      this.queenStep();
      this.trainStep();
    };

    queenStep = () => {
      // head towards starting location and surround yourself with towers
      if (
        queen.touchedSiteId !== -1 &&
        gameState.getSite(queen.touchedSiteId).canBeBuiltOn
      ) {
        const site = gameState.getSite(queen.touchedSiteId);
        if (
          gameState.incomeRate < 7 &&
          site.ownerId !== 0 &&
          site.location.nearest(
            gameState.units
              .filter(
                (unit) => unit.unitType === "KNIGHT" && unit.ownerId === 1
              )
              .map((unit) => unit.location)
          ).distance > 300
        ) {
          return queen.build(queen.touchedSiteId, "MINE");
        }
        if (
          gameState.turnsUntilCanAfford(80 * 2) < 4 &&
          gameState.friendlyKnightBarracks.length < 1 &&
          site.ownerId !== 0
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
        }
        if (
          site.ownerId !== 0 ||
          (site.structureType === "TOWER" &&
            site.ownerId === 0 &&
            !site.towerSpecs.isBigEnough)
        ) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
      }
      const viableSite = gameState.allSites
        .sort(
          (a, b) =>
            a.location.distanceTo(gameState.retreatCorner) -
            b.location.distanceTo(gameState.retreatCorner)
        )
        .find(
          (site) =>
            site.canBeBuiltOn &&
            !queenSenses.isSiteNearEnemyTower(site) &&
            !(site.ownerId === 0)
        );

      if (viableSite) {
        return queen.move(viableSite.location);
      }
      console.error("NO VIABLE SITES so just sitting WTF");
      queen.wait();
    };

    trainStep = () => {
      // train archers if possible,
      // or giants if enemy has lots of towers,
      // or knights if enemy queen is weak
      if (
        gameState.gold >= 100 &&
        gameState.friendlyArcherBarracks.length > 0
      ) {
        // build archers at a barracks
        const barracks = gameState.friendlyArcherBarracks[0];
        if (barracks) {
          return trainer.trainAt(barracks.id);
        }
      }
      if (
        gameState.hostileTowers.length > 2 &&
        gameState.gold >= 140 &&
        gameState.friendlyGiantBarracks.length > 0 &&
        gameState.friendlyGiants.length < 1
      ) {
        // build giants at a barracks
        const barracks = gameState.friendlyGiantBarracks[0];
        if (barracks) {
          return trainer.trainAt(barracks.id);
        }
      }
      if (gameState.friendlyKnightBarracks.length > 0 && gameState.gold >= 80) {
        // build knights at a barracks
        const barracks = gameState.friendlyKnightBarracks[0];
        if (barracks) {
          return trainer.trainAt(barracks.id);
        }
      }
      return trainer.wait();
    };
  }

  const trainer = Trainer.getInstance();
  const queen = Queen.getInstance();
  const queenSenses = new QueenSenses();
  const gameState = GameState.getInstance();
  const numSites: number = parseInt(readline());
  const explore = new ExploreStrategy();
  const knightBarracks = new BuildKnightBarracksStrategy();
  const giantBarracks = new BuildGiantBarracksStrategy();
  const archerBarracks = new BuildArcherBarracksStrategy();
  const retreat = new RetreatStrategy();

  for (let i = 0; i < numSites; i++) {
    var inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const x: number = parseInt(inputs[1]);
    const y: number = parseInt(inputs[2]);
    const radius: number = parseInt(inputs[3]);
    gameState.sites[siteId] = new Site(siteId, x, y, radius);
  }

  // game loop
  while (true) {
    gameState.units = [];
    var inputs: string[] = readline().split(" ");
    gameState.gold = parseInt(inputs[0]);
    const touchedSiteId: number = parseInt(inputs[1]); // -1 if none
    for (let i = 0; i < numSites; i++) {
      var inputs: string[] = readline().split(" ");
      const siteId: number = parseInt(inputs[0]);
      gameState.sites[siteId].goldRemaining = parseInt(inputs[1]); // -1 if unknown
      gameState.sites[siteId].maxMineSize = parseInt(inputs[2]); // -1 if unknown
      gameState.sites[siteId].structureTypeId = parseInt(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
      gameState.sites[siteId].ownerId = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
      gameState.sites[siteId].param1 = parseInt(inputs[5]);
      gameState.sites[siteId].param2 = parseInt(inputs[6]);
    }
    const numUnits: number = parseInt(readline());
    for (let i = 0; i < numUnits; i++) {
      var inputs: string[] = readline().split(" ");
      const x: number = parseInt(inputs[0]);
      const y: number = parseInt(inputs[1]);
      const owner: number = parseInt(inputs[2]);
      const unitType: number = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
      const health: number = parseInt(inputs[4]);
      if (owner === 0 && unitType === -1) {
        queen.update(x, y, health, touchedSiteId);
        if (
          gameState.startLocation.x === 0 &&
          gameState.startLocation.y === 0
        ) {
          gameState.startLocation = new Location(x, y);
        }
      } else {
        gameState.units.push(new Unit(x, y, health, owner, unitType));
      }
    }

    // TESTING STUFF:

    // GAME STRATEGIES:
    // If I just built my first barracks, retreat
    if (
      gameState.friendlyKnightBarracks.length === 1 &&
      gameState.isInitBuildDone === false &&
      gameState.incomeRate > 8
    ) {
      // gameState.isInitBuildDone = true;
      retreat.execute();
    }
    // if I'm in a bad situation, retreat
    else if (
      gameState.hostileKnights.length > 20 ||
      queenSenses.isThreatenedByKnights(250, 3000, 3, 16)
    ) {
      retreat.execute();
    }
    // if the enemy has lots of knights or giants, and I'm rich enough, build archer barracks
    else if (
      (gameState.hostileKnights.length >= 8 ||
        gameState.hostileGiants.length > 0) &&
      gameState.friendlyArcherBarracks.length === 0 &&
      (gameState.gold > 150 || gameState.incomeRate > 16)
    ) {
      archerBarracks.execute();
    }
    // if the enemy has 3 or more towers and we don't have a giant barracks, and I'm rich enough, build one
    else if (
      gameState.hostileTowers.length >= 3 &&
      gameState.friendlyGiantBarracks.length === 0 &&
      (gameState.gold > 150 || gameState.incomeRate > 16)
    ) {
      giantBarracks.execute();
      // if we have almost enough cash to build knights twice but no knight barracks
      // or if we have lots of gold/income income and less than 2 barracks and we're near the enemy queen
      // or the enemy queen is just weak, build a knight barracks
    } else if (
      ((gameState.turnsUntilCanAfford(80 * 3) < 6 ||
        gameState.hostileQueen.health <= 30) &&
        gameState.friendlyKnightBarracks.length === 0) ||
      ((gameState.incomeRate > 20 || gameState.gold > 210) &&
        gameState.friendlyKnightBarracks.length < 2 &&
        gameState.hostileQueen.location.distanceTo(queen.location) < 600)
    ) {
      knightBarracks.execute();
    } else {
      explore.execute();
    }
  }
}
