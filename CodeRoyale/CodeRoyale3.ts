namespace CodeRoyale3 {
  class Location {
    x: number;
    y: number;
    radius: number;

    constructor(x: number, y: number, radius = 0) {
      this.x = Math.round(x);
      this.y = Math.round(y);
      this.radius = Math.round(radius);
    }

    pointOnRadiusNearestTo(other: Location): Location {
      if (this.sharesCenterWith(other)) {
        return other;
      }

      const deltaX = other.x - this.x;
      const deltaY = other.y - this.y;
      const distanceToCenter = this.distanceTo(other);

      const x = this.x + (deltaX / distanceToCenter) * this.radius;
      const y = this.y + (deltaY / distanceToCenter) * this.radius;

      return new Location(x, y);
    }

    sharesCenterWith = (other: Location) => {
      return this.x === other.x && this.y === other.y;
    };

    distanceTo = (location: Location) => {
      return this.distanceToPoint(location.x, location.y);
    };

    distanceToPoint = (x: number, y: number) => {
      return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
    };

    withRadiusBuffer = (buffer: number) => {
      return new Location(this.x, this.y, this.radius + buffer);
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

    /**
     *
     * @param x
     * @param y
     * @param margin added to radius to allow for some tolerance
     * @returns boolean
     */
    containsPoint(x: number, y: number, margin = 0): boolean {
      return this.distanceToPoint(x, y) <= this.radius + margin;
    }

    containsLocationCenter(other: Location, margin = 0): boolean {
      return this.containsPoint(other.x, other.y, margin);
    }
  }

  class Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    get a() {
      return new Location(this.x1, this.y1);
    }

    get b() {
      return new Location(this.x2, this.y2);
    }

    constructor(x1: number, y1: number, x2: number, y2: number) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    }

    static fromLocations = (l1: Location, l2: Location) => {
      return new Line(l1.x, l1.y, l2.x, l2.y);
    };

    extendedBy = (addition: number) => {
      // Add a number of pixels to the line
      const { x1, y1, x2, y2 } = this;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / length;
      const unitY = dy / length;
      return new Line(
        x1 - unitX * addition,
        y1 - unitY * addition,
        x2 + unitX * addition,
        y2 + unitY * addition
      );
    };

    multipliedBy = (multiplier: number) => {
      const { x1, y1, x2, y2 } = this;
      return new Line(
        x1,
        y1,
        x1 + (x2 - x1) * multiplier,
        y1 + (y2 - y1) * multiplier
      );
    };

    rotatedAroundStartBy(radians: number): Line {
      const { x1, y1, x2, y2 } = this;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      const x = cos * (x2 - x1) - sin * (y2 - y1) + x1;
      const y = sin * (x2 - x1) + cos * (y2 - y1) + y1;

      return new Line(x1, y1, x, y);
    }

    midPoint(): Location {
      const midX = (this.x1 + this.x2) / 2;
      const midY = (this.y1 + this.y2) / 2;
      return new Location(midX, midY);
    }

    circleIntersectionPoints(circle: Location): Location[] {
      const dx = this.x2 - this.x1;
      const dy = this.y2 - this.y1;

      const a = dx * dx + dy * dy;
      const b = 2 * (dx * (this.x1 - circle.x) + dy * (this.y1 - circle.y));
      const c =
        (this.x1 - circle.x) * (this.x1 - circle.x) +
        (this.y1 - circle.y) * (this.y1 - circle.y) -
        circle.radius * circle.radius;

      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        return []; // No intersection
      } else {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

        const intersections = [];
        if (t1 >= 0 && t1 <= 1) {
          intersections.push(
            new Location(this.x1 + t1 * dx, this.y1 + t1 * dy)
          );
        }
        if (t2 >= 0 && t2 <= 1) {
          intersections.push(
            new Location(this.x1 + t2 * dx, this.y1 + t2 * dy)
          );
        }
        return intersections;
      }
    }
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
        location: new Location(this.location.x, this.location.y, this.param2),
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

    isSiteThreatenedByTowers = (site: Site, towerCount = 1, tolerance = -50) =>
      state.enemyTowers.filter((tower) =>
        tower.towerSpecs.location.containsLocationCenter(
          site.location,
          tolerance
        )
      ).length >= towerCount;

    isSiteThreatenedByKnights = (site: Site, range = 220, count = 1) =>
      state.enemyKnights.filter(
        (knight) =>
          knight.location.distanceTo(site.location) <
          range + site.location.radius
      ).length >= count;

    areTooManyKnightsInHomeBase = (count = 16, shouldScale = true) => {
      const knightsInHere = state.enemyKnights.filter((knight) =>
        this.homeBase().containsLocationCenter(knight.location)
      );
      const threshold = shouldScale ? count * (queen.health / 100) : count;
      return knightsInHere.length > threshold;
    };

    homeBase = () =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 1000 / 2, 800)
        : new Location(1920, 1000 / 2, 800);

    hunkerCorner = () =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 1000, 700)
        : new Location(1920, 0, 700);

    startCorner = () =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 0, 800)
        : new Location(1920, 1000, 800);

    siteNearestTo = (location: Location, sites?: Site[]) => {
      if (!sites) {
        sites = state.sites;
      }
      return sites.reduce(
        (nearest, site) =>
          nearest.location.distanceTo(location) >
          site.location.distanceTo(location)
            ? site
            : nearest,
        sites[0]
      );
    };

    sitesWithin = (location: Location, sites?: Site[]) => {
      if (!sites) {
        sites = state.sites;
      }
      return sites.filter((site) =>
        location.containsLocationCenter(site.location)
      );
    };

    wayAroundObstacle = (
      obstacle: Location,
      currentPath: Line,
      radiusBuffer = 0,
      newPathLengthBuffer = 0
    ) => {
      const intersections = currentPath.circleIntersectionPoints(
        obstacle.withRadiusBuffer(radiusBuffer)
      );
      if (intersections.length < 2) {
        return null;
      }
      const mindPoint = Line.fromLocations(
        intersections[0],
        intersections[1]
      ).midPoint();

      if (obstacle.sharesCenterWith(mindPoint)) {
        return currentPath.rotatedAroundStartBy(Math.PI / 4);
      }
      const surfacePoint = obstacle.pointOnRadiusNearestTo(mindPoint);
      const newPath = Line.fromLocations(
        currentPath.a,
        surfacePoint
      ).extendedBy(newPathLengthBuffer);
      return newPath;
    };
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
      let straightPath = new Line(
        this.location.x,
        this.location.y,
        target.x,
        target.y
      ).extendedBy(60);

      // First find path around enemy towers
      const enemyTowersByProximityToQueen = state.enemyTowers.sort(
        (a, b) =>
          a.towerSpecs.location.distanceTo(queen.location) -
          b.towerSpecs.location.distanceTo(queen.location)
      );

      for (let tower of enemyTowersByProximityToQueen) {
        if (tower.location.sharesCenterWith(target)) {
          continue; // should never happen given current setup
        }
        const wayAround = senses.wayAroundObstacle(
          tower.towerSpecs.location,
          straightPath,
          30,
          60
        );
        if (wayAround) {
          straightPath = wayAround;
          break;
        }
      }

      // Then find path around enemy any sites
      const sitesByProximityToQueen = state.sites.sort(
        (a, b) =>
          a.location.distanceTo(queen.location) -
          b.location.distanceTo(queen.location)
      );

      for (let site of sitesByProximityToQueen) {
        if (site.location.sharesCenterWith(target)) {
          continue;
        }
        // queen radius is 30, so adding that to the buffer
        const wayAround = senses.wayAroundObstacle(
          site.location,
          straightPath,
          30,
          60
        );
        if (wayAround) {
          straightPath = wayAround;
          break;
        }
      }
      const _target = straightPath.b;
      return `MOVE ${_target.x} ${_target.y}`;
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
    unitTrainQueue: ("KNIGHT" | "ARCHER" | "GIANT")[] = [];

    enqueueTrining = (unitType: "KNIGHT" | "ARCHER" | "GIANT") => {
      this.unitTrainQueue.push(unitType);
    };

    get knightsInTrainQueue() {
      return this.unitTrainQueue.filter((unit) => unit === "KNIGHT").length;
    }

    get archersInTrainQueue() {
      return this.unitTrainQueue.filter((unit) => unit === "ARCHER").length;
    }

    get giantsInTrainQueue() {
      return this.unitTrainQueue.filter((unit) => unit === "GIANT").length;
    }

    readonly UnitCosts = {
      KNIGHT: 80,
      ARCHER: 100,
      GIANT: 140,
    };

    canAfford = (unitType: "KNIGHT" | "ARCHER" | "GIANT", unitCount = 1) => {
      return state.gold > this.UnitCosts[unitType] * unitCount;
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

    trainNext = () => {
      console.error("TRAIN:", this.unitTrainQueue.join(" "));
      const nextUnitType = this.unitTrainQueue[0];
      if (nextUnitType) {
        if (nextUnitType === "KNIGHT") {
          if (this.canAfford("KNIGHT") && state.friendlyKnightBarracks.length) {
            // barracks closest to enemy queen
            const idealBarracks = state.friendlyKnightBarracks.sort(
              (a, b) =>
                a.location.distanceTo(state.enemyQueen.location) -
                b.location.distanceTo(state.enemyQueen.location)
            )[0];
            this.unitTrainQueue.shift();
            return this.trainAt(idealBarracks.id);
          }
          return this.wait();
        }
        if (nextUnitType === "ARCHER") {
          if (this.canAfford("ARCHER") && state.friendlyArcherBarracks.length) {
            // barracks closest to my queen
            const idealBarracks = state.friendlyArcherBarracks.sort(
              (a, b) =>
                a.location.distanceTo(queen.location) -
                b.location.distanceTo(queen.location)
            )[0];
            this.unitTrainQueue.shift();
            return this.trainAt(idealBarracks.id);
          }
          return this.wait();
        }
        if (nextUnitType === "GIANT") {
          if (this.canAfford("GIANT") && state.friendlyGiantBarracks.length) {
            // barracks closest to my queen
            const idealBarracks = state.friendlyGiantBarracks.sort(
              (a, b) =>
                a.location.distanceTo(queen.location) -
                b.location.distanceTo(queen.location)
            )[0];
            this.unitTrainQueue.shift();
            return this.trainAt(idealBarracks.id);
          }
          return this.wait();
        }
      }
      return this.wait();
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
      const {
        triageStep,
        queenStep,
        trainerStep,
        getNextStrategy,
        logDescription,
      } = strategy;
      triageStep();
      console.log(queenStep());
      console.log(trainerStep());
      console.error(logDescription);
      return getNextStrategy();
    };
  }

  interface Strategy {
    triageStep: (touchedSite?: Site) => void;
    queenStep: () => string;
    trainerStep: () => string; // If this stays super basic might do away with it and just train in base
    getNextStrategy: () => Strategy;
    logDescription: string;
  }

  const isGoodMineSite = (site: Site) =>
    !site.isFriendly &&
    site.goldRemaining > 35 &&
    site.structureType !== "TOWER" &&
    !senses.isSiteThreatenedByKnights(site);

  class StrategyCore {
    nextStrategy: Strategy | void = undefined;
    barracksBuildQueue: ("KNIGHT" | "ARCHER" | "GIANT")[] = [];

    get knightsInBuildQueue() {
      return this.barracksBuildQueue.filter((unit) => unit === "KNIGHT").length;
    }

    get archersInBuildQueue() {
      return this.barracksBuildQueue.filter((unit) => unit === "ARCHER").length;
    }

    get giantsInBuildQueue() {
      return this.barracksBuildQueue.filter((unit) => unit === "GIANT").length;
    }

    // No longer using senses.isGoodMineSite?
    shouldExpandGoldMine = (site: Site) =>
      site.isFriendly &&
      site.structureType === "MINE" &&
      site.goldRemaining > 60 &&
      !site.mineSpecs.isMaxedOut &&
      !senses.isSiteThreatenedByKnights(site);

    shouldExpandTower = (site: Site, rangeCap?: number) =>
      site.isFriendly &&
      site.structureType === "TOWER" &&
      !(!rangeCap
        ? site.towerSpecs.isBigEnough
        : site.towerSpecs.location.radius >= rangeCap);

    distanceFromSiteToEnemyQueen = (location: Location) =>
      state.enemyQueen.location.distanceTo(location);

    shouldBuildTower = (site: Site) =>
      !site.isFriendly &&
      site.canBeBuiltOn &&
      (senses.isSiteThreatenedByKnights(site) ||
        this.distanceFromSiteToEnemyQueen(site.location) < 200);

    nearbyBarracks = () =>
      !state.enemyQueen
        ? undefined
        : senses.siteNearestTo(
            state.enemyQueen.location,
            state.friendlyKnightBarracks
          );
    distanceFromEnemyQueenToNearestFriendlyKnightBarracks = () =>
      this.nearbyBarracks()?.location.distanceTo(state.enemyQueen.location);
    shouldBuildKnightBarracks = (site: Site) =>
      site.canBeBuiltOn &&
      this.distanceFromEnemyQueenToNearestFriendlyKnightBarracks() &&
      this.distanceFromEnemyQueenToNearestFriendlyKnightBarracks()! > 1100 &&
      this.distanceFromSiteToEnemyQueen(site.location) < 770 &&
      (site.goldRemaining < 100 || site.maxMineSize < 3);

    buildStructure = (site: Site, towerCap?: number) => {
      console.error("BUILD:", this.barracksBuildQueue.join(" "));

      if (
        this.barracksBuildQueue.length > 0 &&
        site.canBeBuiltOn &&
        !(
          site.isFriendly &&
          (site.structureType === "BARRACKS" ||
            (site.structureType === "MINE" &&
              site.goldRemaining > 100 &&
              site.maxMineSize > 1))
        )
      ) {
        const barracksType = this.barracksBuildQueue.shift();
        return queen.build(site.id, "BARRACKS", barracksType);
      }

      if (this.shouldExpandGoldMine(site)) {
        return queen.build(site.id, "MINE");
      }
      if (
        this.shouldExpandTower(site, towerCap) ||
        this.shouldBuildTower(site)
      ) {
        return queen.build(site.id, "TOWER");
      }

      if (this.shouldBuildKnightBarracks(site)) {
        return queen.build(site.id, "BARRACKS", "KNIGHT");
      }
      // Returning null allows strategy to make a choice
      return null;
    };

    getUnCapturedViableSites = () =>
      state.sites.filter((site) => !site.isFriendly && site.canBeBuiltOn);
    getAllViableSites = () => state.sites.filter((site) => site.canBeBuiltOn);

    centralLocation = new Location(1920 / 2, 1000 / 2, 310);
    getGoodKnightSites = () =>
      senses
        .sitesWithin(this.centralLocation)
        .filter((site) => site.canBeBuiltOn);
  }

  class DefensiveStrategy extends StrategyCore implements Strategy {
    logDescription = "Defensive Strategy";
    maxKnightsInQueue = 4;
    maxArchersInQueue = 2;
    maxGiantsInQueue = 1;

    private getViableSitesInHomeBase = () =>
      this.getUnCapturedViableSites().filter((site) =>
        senses.homeBase().containsLocationCenter(site.location)
      );

    private getViableSite = () => {
      let sites: Site[] = [];

      if (!state.wasInitialBuildOutCompleted) {
        sites = this.getViableSitesInHomeBase();
      }
      if (sites.length === 0) {
        console.error("no sites in home base, looking for any site");
        sites = this.getUnCapturedViableSites();
      }

      if (sites.length === 0) {
        return null;
      }

      return senses.siteNearestTo(queen.location, sites);
    };

    triageStep = () => {
      // ---Prioritize building queues---
      if (
        state.friendlyArcherBarracks.length < 1 &&
        this.archersInBuildQueue < 1
      ) {
        const archerBuildTarget = queen.health < 50 ? 1 : 2;
        if (
          trainer.turnsUntilCanAfford("ARCHER", archerBuildTarget) <
          archerBuildTarget * 5 - 3
        ) {
          this.barracksBuildQueue.push("ARCHER");
          trainer.enqueueTrining("ARCHER");
        }
      }

      if (
        state.friendlyGiantBarracks.length < 1 &&
        this.giantsInBuildQueue < 1 &&
        trainer.turnsUntilCanAfford("GIANT", 1) < 8 &&
        state.enemyTowers.length > 2
      ) {
        this.barracksBuildQueue.push("GIANT");
        trainer.enqueueTrining("GIANT");
      }

      if (
        state.wasInitialKnightBarracksBuilt &&
        state.friendlyArcherBarracks.length > 0 &&
        state.friendlyKnightBarracks.length < 1 &&
        this.knightsInBuildQueue < 1 &&
        trainer.turnsUntilCanAfford("KNIGHT", 2) < 8
      ) {
        this.barracksBuildQueue.push("KNIGHT");
        trainer.enqueueTrining("KNIGHT");
      }

      // ---Prioritize training queues---
      if (
        state.friendlyArcherBarracks.length > 0 &&
        state.enemyKnights.length > 0 &&
        trainer.archersInTrainQueue < this.maxArchersInQueue &&
        (state.friendlyArchers.length < 1 ||
          (state.friendlyArchers.length < 10 &&
            trainer.turnsUntilCanAfford("ARCHER", 1) < 4))
      ) {
        trainer.enqueueTrining("ARCHER");
      }

      if (
        state.friendlyKnightBarracks.length > 0 &&
        trainer.knightsInTrainQueue < this.maxKnightsInQueue &&
        (state.friendlyKnights.length < 1 ||
          (state.friendlyKnights.length < 10 &&
            trainer.knightsInTrainQueue < 2 &&
            trainer.turnsUntilCanAfford("KNIGHT", 2) < 4))
      ) {
        trainer.enqueueTrining("KNIGHT");
      }

      if (
        state.friendlyGiantBarracks.length > 0 &&
        trainer.giantsInTrainQueue < this.maxGiantsInQueue &&
        state.enemyTowers.length / 3 >
          state.friendlyGiants.length + trainer.giantsInTrainQueue
      ) {
        trainer.enqueueTrining("GIANT");
      }

      // ---Prioritize strategies---
      if (
        !state.wasInitialKnightBarracksBuilt &&
        trainer.turnsUntilCanAfford("KNIGHT", 2) < 8 &&
        state.friendlyArchers.length > 0
      ) {
        trainer.enqueueTrining("KNIGHT");
        trainer.enqueueTrining("KNIGHT");
        this.nextStrategy = new BuildInitialKnightBarracksStrategy();
      } else if (senses.areTooManyKnightsInHomeBase()) {
        this.nextStrategy = new BunkerStrategy();
      } else if (
        state.friendlyArchers.length > 5 &&
        state.enemyKnights.length < 5
      ) {
        this.nextStrategy = new ExploreStrategy();
      }

      if (this.getViableSitesInHomeBase().length < 3) {
        state.wasInitialBuildOutCompleted = true;
      }
    };

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        const site = this.getViableSite();
        if (site) {
          return queen.move(site.location);
        }
        console.error("NO SITE");
        return queen.move(senses.homeBase());
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];
      const defaultBuildStep = this.buildStructure(touchedSite);
      if (defaultBuildStep) {
        return defaultBuildStep;
      }

      // build mine if decent
      if (isGoodMineSite(touchedSite)) {
        return queen.build(touchedSite.id, "MINE");
      }

      // build tower if we can still build
      if (!touchedSite.isFriendly && touchedSite.canBeBuiltOn) {
        return queen.build(touchedSite.id, "TOWER");
      }

      // find a new site if nothing else to do
      const site = this.getViableSite();
      if (site) {
        return queen.move(site.location);
      }

      console.error("NO SITE");
      return queen.wait();
    };

    trainerStep = () => {
      return trainer.trainNext();
    };

    getNextStrategy = (): Strategy =>
      this.nextStrategy || new DefensiveStrategy();
  }

  // class BuildArcherBarracksStrategy extends StrategyCore implements Strategy {}

  class KnightRushStrategy extends StrategyCore implements Strategy {
    logDescription = "Rushing with knights";
    maxKnightsInQueue = 6;
    maxArchersInQueue = 2;
    maxGiantsInQueue = 1;

    private shouldShiftToKnightStrategy = () =>
      !state.wasInitialKnightBarracksBuilt &&
      trainer.turnsUntilCanAfford("KNIGHT", this.getInitialKnightTarget()) <=
        this.getInitialKnightTarget() * 3 - 3 &&
      state.incomeRate > 3;

    private getViableSite = () => {
      let sites = this.getUnCapturedViableSites().filter((site) =>
        senses.startCorner().containsLocationCenter(site.location)
      );
      if (sites.length === 0) {
        sites = this.getUnCapturedViableSites().filter((site) =>
          senses.hunkerCorner().containsLocationCenter(site.location)
        );
      }
      if (sites.length === 0) {
        sites = this.getUnCapturedViableSites().filter((site) =>
          senses.homeBase().containsLocationCenter(site.location)
        );
      }
      if (sites.length === 0) {
        return null;
      }

      return senses.siteNearestTo(queen.location, sites);
    };

    private getInitialKnightTarget = () =>
      queen.health >= 75 ? 3 : queen.health >= 50 ? 2 : 1;

    // Quite a bit of code duplication between strategies
    // May be able to reduce this to defining conditions that differ between strategies
    triageStep = () => {
      // ---Prioritize building queues---
      if (
        state.enemyKnights.length > 6 &&
        state.friendlyArcherBarracks.length < 1 &&
        this.archersInBuildQueue < 1
      ) {
        const archerBuildTarget = queen.health < 50 ? 1 : 2;
        if (
          trainer.turnsUntilCanAfford("ARCHER", archerBuildTarget) <
          archerBuildTarget * 5 - 3
        ) {
          this.barracksBuildQueue.push("ARCHER");
          trainer.enqueueTrining("ARCHER");
        }
      }

      if (
        state.friendlyGiantBarracks.length < 1 &&
        this.giantsInBuildQueue < 1 &&
        trainer.turnsUntilCanAfford("GIANT", 1) < 6 &&
        state.enemyTowers.length > 3
      ) {
        this.barracksBuildQueue.push("GIANT");
        trainer.enqueueTrining("GIANT");
      }

      if (
        state.wasInitialKnightBarracksBuilt &&
        state.friendlyKnightBarracks.length < 1 &&
        this.knightsInBuildQueue < 1 &&
        trainer.turnsUntilCanAfford("KNIGHT", 1) < 4
      ) {
        this.barracksBuildQueue.push("KNIGHT");
        trainer.enqueueTrining("KNIGHT");
      }

      // ---Prioritize training queues---
      if (
        state.friendlyArcherBarracks.length > 0 &&
        state.enemyKnights.length > 4 &&
        trainer.archersInTrainQueue < this.maxArchersInQueue &&
        state.friendlyArchers.length < state.enemyKnights.length / 5
      ) {
        trainer.enqueueTrining("ARCHER");
      }

      if (
        state.friendlyKnightBarracks.length > 0 &&
        trainer.knightsInTrainQueue < this.maxKnightsInQueue &&
        state.friendlyKnights.length < 12
      ) {
        trainer.enqueueTrining("KNIGHT");
      }

      if (this.shouldShiftToKnightStrategy() && this.knightsInBuildQueue < 1) {
        while (trainer.knightsInTrainQueue < this.getInitialKnightTarget()) {
          trainer.enqueueTrining("KNIGHT");
        }
      }

      if (
        state.friendlyGiantBarracks.length > 0 &&
        trainer.giantsInTrainQueue < this.maxGiantsInQueue &&
        state.enemyTowers.length / 3 >
          state.friendlyGiants.length + trainer.giantsInTrainQueue
      ) {
        trainer.enqueueTrining("GIANT");
      }
    };

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
      const defaultBuildStep = this.buildStructure(touchedSite);
      if (defaultBuildStep) {
        return defaultBuildStep;
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
      return trainer.trainNext();
    };

    getNextStrategy = (): Strategy => {
      if (this.shouldShiftToKnightStrategy()) {
        console.error("---Shifting to Knight Barracks Strategy");
        return new BuildInitialKnightBarracksStrategy();
      } else if (senses.areTooManyKnightsInHomeBase(8)) {
        console.error("---Shifting to Bunker Strategy");
        return new BunkerStrategy();
      } else if (
        state.friendlyKnights.length > 16 &&
        state.enemyKnights.length < 6
      ) {
        console.error("---Shifting to Explore Strategy");
        return new ExploreStrategy();
      }
      console.error("---Staying in Knight Rush Strategy");
      // May do away with the local var "nextStrategy"
      return this.nextStrategy || new KnightRushStrategy();
    };
  }

  class BuildInitialKnightBarracksStrategy
    extends StrategyCore
    implements Strategy
  {
    logDescription = "Building Knight Barracks";

    private getViableSite = () => {
      let viableSites = this.getGoodKnightSites();
      if (viableSites.length === 0) {
        viableSites = this.getAllViableSites();
      }
      if (viableSites.length === 0) {
        return null;
      }
      return senses.siteNearestTo(queen.location, viableSites);
    };

    triageStep = () => {
      // ---Prioritize training queues---
      if (
        trainer.knightsInTrainQueue < 1 &&
        trainer.turnsUntilCanAfford("KNIGHT", 2) <= 4
      ) {
        trainer.enqueueTrining("KNIGHT");
      }

      // ---Prioritize building queues---
      // Probably don't want to do any of that on this step
      // because we want more fine-tuned control over the barracks location

      // ---Prioritize strategies---
      if (state.friendlyKnightBarracks.length > 0) {
        state.wasInitialKnightBarracksBuilt = true;
        this.nextStrategy = state.initialStrategy;
      }
    };

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

      // build a barracks near center, or mines and towers as needed on the way
      if (touchedSite.canBeBuiltOn) {
        if (
          !(
            touchedSite.structureType === "BARRACKS" &&
            touchedSite.barracksSpecs.type === "KNIGHT"
          ) &&
          this.centralLocation.containsLocationCenter(touchedSite.location)
        ) {
          return queen.build(queen.touchedSiteId, "BARRACKS", "KNIGHT");
        }
        if (
          isGoodMineSite(touchedSite) &&
          senses.isSiteThreatenedByKnights(touchedSite) // may not be needed now that default checks to build towers
        ) {
          return queen.build(queen.touchedSiteId, "MINE");
        }
        if (!touchedSite.isFriendly) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        // Nothing to build here so just move towards the center
        const site = this.getViableSite();
        if (site) {
          return queen.move(site.location);
        }
      }

      const defaultBuildStep = this.buildStructure(touchedSite);
      if (defaultBuildStep) {
        return defaultBuildStep;
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
      return trainer.trainNext();
    };

    getNextStrategy = (): Strategy =>
      this.nextStrategy || new BuildInitialKnightBarracksStrategy();
  }

  class ExploreStrategy extends StrategyCore implements Strategy {
    logDescription = "Exploring";

    private getViableSite = () => {
      const viableSites = this.getUnCapturedViableSites().filter(
        (site) =>
          !senses.isSiteThreatenedByTowers(site, 3, 0) &&
          !senses.isSiteThreatenedByTowers(site, 2, -50) &&
          !senses.isSiteThreatenedByTowers(site, 1, -100)
      );

      if (viableSites.length === 0) {
        return null;
      }

      return senses.siteNearestTo(queen.location, viableSites);
    };

    triageStep = (touchedSite?: Site) => {
      // ---Prioritize training queues---
      if (
        trainer.giantsInTrainQueue + state.friendlyGiants.length <
          state.enemyTowers.length / 3 &&
        state.friendlyGiantBarracks.length > 0 &&
        trainer.turnsUntilCanAfford("GIANT", 1) <= 3
      ) {
        // We can afford a giant, have a barracks, and we don't have enough giants
        trainer.enqueueTrining("GIANT");
      }

      if (
        trainer.knightsInTrainQueue < 2 &&
        state.friendlyKnightBarracks.length > 0 &&
        trainer.turnsUntilCanAfford("KNIGHT", 3) <= 4
      ) {
        // May as well train knights when we can afford it.
        // May want to include consideration of how far enemy queen
        // is from nearest friendly knight barracks
        trainer.enqueueTrining("KNIGHT");
      }

      // ---Prioritize building queues---
      if (
        state.friendlyKnightBarracks.length < 1 &&
        this.knightsInBuildQueue < 1 &&
        trainer.turnsUntilCanAfford("KNIGHT", 2) < 7
      ) {
        // We can afford some knights and love them, but no barracks!?!
        this.barracksBuildQueue.push("KNIGHT");
      }

      if (
        state.enemyTowers.length > 3 &&
        this.giantsInBuildQueue < 1 &&
        state.friendlyGiantBarracks.length < 1 &&
        trainer.turnsUntilCanAfford("GIANT", 1) < 7
      ) {
        this.barracksBuildQueue.push("GIANT");
      }

      // ---Prioritize strategies---
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

      const defaultBuildStep = this.buildStructure(touchedSite);
      if (defaultBuildStep) {
        return defaultBuildStep;
      }
      // if we don't already own it and can build on it
      if (!touchedSite.isFriendly && touchedSite.canBeBuiltOn) {
        // replace friendly sites with mines if it seems like a good idea
        if (touchedSite.isFriendly) {
          if (
            state.incomeRate < 6 &&
            touchedSite.goldRemaining > 200 &&
            touchedSite.maxMineSize > 1 &&
            isGoodMineSite(touchedSite)
          ) {
            return queen.build(queen.touchedSiteId, "MINE");
          }
        }
        if (
          (state.incomeRate < 9 && touchedSite.goldRemaining > 80) ||
          isGoodMineSite(touchedSite)
        ) {
          return queen.build(queen.touchedSiteId, "MINE");
        }
        return queen.build(queen.touchedSiteId, "TOWER");
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
      return trainer.trainNext();
    };

    getNextStrategy = (): Strategy => {
      // if the queen is threatened by MANY knights, hunker in bunker
      if (senses.isQueenThreatenedByKnights(150, 600, 4, 21)) {
        return new BunkerStrategy();
      }

      return this.nextStrategy || new ExploreStrategy();
    };
  }

  class BunkerStrategy extends StrategyCore implements Strategy {
    logDescription = "Hunkering in Bunker!";

    private areTooManyKnightsInHomeBase = () => {
      const knightsInHere = state.enemyKnights.filter((knight) =>
        senses.homeBase().containsLocationCenter(knight.location)
      );
      const threshold = 13 * (queen.health / 100);
      return knightsInHere.length > threshold;
    };

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
          senses.hunkerCorner().containsLocationCenter(knight.location)
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
      const safeCorner = this.safeCorner();
      let sites = this.getUnCapturedViableSites().filter((site) =>
        safeCorner.containsLocationCenter(site.location)
      );

      if (sites.length === 0) {
        return null;
      }

      // May experiment with focusing on site nearest to the corner
      return senses.siteNearestTo(queen.location, sites);
    };

    triageStep = (touchedSite?: Site) => {
      // ---prioritize training queues---
      if (
        trainer.turnsUntilCanAfford("ARCHER") < 2 &&
        state.friendlyArcherBarracks.length > 0 &&
        trainer.archersInTrainQueue < 1
      ) {
        // We can afford archers and have a barracks, and aren't training them.
        // This is a defensive strategy, so we want to train archers.
        trainer.enqueueTrining("ARCHER");
      }

      if (
        trainer.turnsUntilCanAfford("KNIGHT", 3) < 7 &&
        state.friendlyKnightBarracks.length > 0 &&
        trainer.knightsInTrainQueue < 2
      ) {
        // We could train some knights without fret, so why not...
        trainer.enqueueTrining("KNIGHT");
      }

      // ---prioritize building queues---
      if (
        (state.gold > 300 || state.incomeRate > 6) &&
        !!touchedSite &&
        !touchedSite.isFriendly &&
        touchedSite.canBeBuiltOn &&
        state.friendlyArcherBarracks.length === 0
      ) {
        // We can probably afford some knights and this is a defensive strategy.
        // Let's build some knights.
        this.barracksBuildQueue.push("ARCHER");
      }

      // ---prioritize strategies---
      if (!this.areTooManyKnightsInHomeBase()) {
        this.nextStrategy = state.initialStrategy;
      }
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

      const defaultBuildStep = this.buildStructure(touchedSite, 255);
      if (defaultBuildStep) {
        return defaultBuildStep;
      }

      // If nothing else, just a tower. It's defensive...
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
      return trainer.trainNext();
    };

    getNextStrategy = (): Strategy => this.nextStrategy || new BunkerStrategy();
  }

  //   class GoldDiggerStrategy implements Strategy {}

  class GameState {
    gold = 0;
    siteRecord: Record<number, Site> = {};
    units: Unit[] = [];
    wasInitialKnightBarracksBuilt = false;
    wasInitialBuildOutCompleted = false;
    private _startLocation: "TOP_LEFT" | "BOTTOM_RIGHT" | null = null;
    get startLocation() {
      if (!this._startLocation) {
        throw new Error("Start location not set yet!");
      }
      return this._startLocation;
    }
    private _initialQueenHealth = 0;
    get initialQueenHealth() {
      return this._initialQueenHealth;
    }

    private static instance: GameState;
    private constructor() {}
    static getInstance(): GameState {
      if (!GameState.instance) {
        GameState.instance = new GameState();
      }
      return GameState.instance;
    }

    get initialStrategy(): Strategy {
      return this.initialQueenHealth > 50
        ? new DefensiveStrategy()
        : new KnightRushStrategy();
    }

    currentStrategy: Strategy = this.initialStrategy;

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
        if (owner === 0 && unitType === -1) {
          // It was our queen
          // The game just started. Store init variables
          if (this._startLocation === null) {
            this._startLocation = x < 500 ? "TOP_LEFT" : "BOTTOM_RIGHT";
          }
          if (this._initialQueenHealth === 0) {
            this._initialQueenHealth = health;
            this.currentStrategy = this.initialStrategy;
          }
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

    get friendlyArchers() {
      return this.units.filter(
        (unit) => unit.isFriendly && unit.unitType === "ARCHER"
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

  // let currentStrategy: Strategy = new DefensiveStrategy();

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
    state.currentStrategy = executor.execute(state.currentStrategy);
  }
}

// NOTES TO SELF:

// I'm still sometimes attempting to build mines when enemy knights are on top of it. That is dumb.
// I think this is because of the site radius. I need to check if the site + its radius is too close to knights?

// When I'm near an enemy knight barracks I may as well chase it and convert it to a tower, archer, knight, or maybe just whatever is convenient

// I like how I moved the training queue into the Trainer class. Should I do the same moving the build queue into the queen class?
// Maybe even build a new architect class or a city planner class lol

// I can start each game with a different strategy depending on starting health, and possibly other variables such as the number if sites in various areas...
// e.g. start with a rush strategy when we have lower starting health, and defensive strategy if we have higher starting health
