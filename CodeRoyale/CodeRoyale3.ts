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

    locationsWithinRadius(locations: Location[], margin = 0): Location[] {
      return locations.filter((location) =>
        this.containsLocationCenter(location, margin)
      );
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

    containsLocationCenter = (location: Location) => {
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
        isMaxedOut: this.param2 >= 500, // TODO: check if this is correct/useful
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

    isSiteNearEnemyQueen = (site: Site, range = 200) =>
      state.enemyQueen.location.distanceTo(site.location) < range;

    areTooManyKnightsInHomeBase = (count = 16, shouldScale = true) => {
      const knightsInHere = state.enemyKnights.filter((knight) =>
        this.homeBase().containsLocationCenter(knight.location)
      );
      const threshold = shouldScale ? count * (queen.health / 100) : count;
      return knightsInHere.length > threshold;
    };

    isFriendlyBarracks = (site: Site) =>
      site.structureType === "BARRACKS" && site.isFriendly;

    isTowerWorthKeeping = (site: Site, minRange = 200) =>
      site.isFriendly &&
      site.structureType === "TOWER" &&
      site.towerSpecs.location.radius > minRange;

    isMineWorthKeeping = (site: Site) =>
      site.isFriendly &&
      site.structureType === "MINE" &&
      site.mineSpecs.incomeRate > 1 &&
      site.goldRemaining > 100;

    isGoodMineSite = (site: Site, minSize = 1, minGold = 55) =>
      !site.isFriendly &&
      site.goldRemaining >= minGold &&
      site.maxMineSize >= minSize &&
      site.structureType !== "TOWER" &&
      !senses.isSiteThreatenedByKnights(site);

    centralPark = (radius = 400) => new Location(1920 / 2, 1000 / 2, radius);

    backWall = (width = 200) =>
      state.startLocation === "TOP_LEFT"
        ? new Box(0, 0, width, 1000)
        : new Box(1920 - width, 0, width, 1000);

    homeBase = (radius = 650) =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 1000 / 2, radius)
        : new Location(1920, 1000 / 2, radius);

    hunkerCorner = (radius = 600) =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 1000, radius)
        : new Location(1920, 0, radius);

    startCorner = (radius = 800) =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 0, radius)
        : new Location(1920, 1000, radius);

    wallBox = (width = 420) =>
      state.startLocation === "TOP_LEFT"
        ? new Box(1920 / 2 - width + 100, 0, 1920 / 2 + 100, 1000)
        : new Box(1920 / 2 - 100, 0, 1920 / 2 + width - 100, 1000);

    territoryBox = (width = 1920 / 2, buffer = 100) =>
      state.startLocation === "TOP_LEFT"
        ? new Box(0, 0, width + buffer, 1000)
        : new Box(width - buffer, 0, 1920, 1000);

    hunkerEdge = () =>
      state.startLocation === "TOP_LEFT"
        ? new Location(0, 1000 / 2, 350)
        : new Location(1920, 1000 / 2, 350);

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

    get vision() {
      return new Location(queen.location.x, queen.location.y, 300);
    }

    get proximity() {
      return new Location(queen.location.x, queen.location.y, 600);
    }

    get area() {
      return new Location(queen.location.x, queen.location.y, 1000);
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
      console.error(`Target: ${target.x} ${target.y}`);
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
    trainingQueue: ("KNIGHT" | "ARCHER" | "GIANT")[] = [];

    enqueueTraining = (unitType: "KNIGHT" | "ARCHER" | "GIANT") => {
      const [last, secondToLast] = [
        this.trainingQueue[this.trainingQueue.length - 1],
        this.trainingQueue[this.trainingQueue.length - 2],
      ];
      if (last === unitType && secondToLast === unitType) {
        return;
      }
      this.trainingQueue.push(unitType);
    };

    // todo: deprecate the above in favor of this:
    creepsOfTypeInQueue = (type: BarracksType) => {
      return this.trainingQueue.filter((unit) => unit === type).length;
    };

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
      console.error("TRAIN:", this.trainingQueue.join(" "));
      const nextUnitType = this.trainingQueue[0];
      if (nextUnitType) {
        if (nextUnitType === "KNIGHT") {
          return this.trainKnights();
        }
        if (nextUnitType === "ARCHER") {
          return this.trainArchers();
        }
        if (nextUnitType === "GIANT") {
          return this.trainGiants();
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

    trainKnights = () => {
      // train knights only if we can afford as many as we have barracks
      if (
        state.friendlyKnightBarracks.length > 0 &&
        this.canAfford("KNIGHT", state.friendlyKnightBarracks.length)
      ) {
        const viableBarracks = state.friendlyKnightBarracks.filter(
          (b) => b.barracksSpecs.turnsUntilCanTrain === 0
        );
        if (
          viableBarracks.length >= state.friendlyBarracksOfType("KNIGHT").length
        ) {
          const barracksIds = viableBarracks.map((b) => b.id).join(" ");
          this.trainingQueue.shift();
          return `TRAIN ${barracksIds}`;
        }
      }
      return this.wait();
    };

    trainArchers = () => {
      if (this.canAfford("ARCHER") && state.friendlyArcherBarracks.length) {
        // barracks closest to my queen
        const idealBarracks = state.friendlyArcherBarracks
          .sort(
            (a, b) =>
              a.location.distanceTo(queen.location) -
              b.location.distanceTo(queen.location)
          )
          .find((b) => b.barracksSpecs.turnsUntilCanTrain === 0);
        if (idealBarracks) {
          this.trainingQueue.shift();

          return this.trainAt(idealBarracks.id);
        }
      }
      return this.wait();
    };

    trainGiants = () => {
      if (this.canAfford("GIANT")) {
        if (state.friendlyGiantBarracks.length === 0) {
          // No sense in waiting to build a barracks before training something
          if (state.friendlyKnightBarracks.length) {
            return this.trainKnights();
          }
          if (state.friendlyArcherBarracks.length) {
            return this.trainArchers();
          }
        }
        // barracks closest to my queen
        const idealBarracks = state.friendlyGiantBarracks
          .sort(
            (a, b) =>
              a.location.distanceTo(queen.location) -
              b.location.distanceTo(queen.location)
          )
          .find((b) => b.barracksSpecs.turnsUntilCanTrain === 0);
        if (idealBarracks) {
          this.trainingQueue.shift();
          return this.trainAt(idealBarracks.id);
        }
      }
      return this.wait();
    };
  }

  class Executor {
    execute = (strategy: Strategy) => {
      const { trainingStep, queenStep, getNextStrategy, logDescription } =
        strategy;
      console.error(logDescription);
      trainingStep();
      console.log(queenStep());
      console.log(trainer.trainNext());
      state.currentStrategy = getNextStrategy();
    };
  }

  interface Strategy {
    strategyId: string;
    equals: (other: Strategy) => boolean;
    trainingStep: (touchedSite?: Site) => void;
    queenStep: () => string;
    getNextStrategy: () => Strategy;
    logDescription: string;
  }

  class StrategyCore {
    strategyId = "CORE";
    maxKnightsInQueue = 3;
    maxArchersInQueue = 2;
    maxGiantsInQueue = 1;
    nextStrategy: Strategy | void = undefined;

    equals = (other: Strategy) => {
      return this.strategyId === other.strategyId;
    };

    get touchedSite() {
      return (
        queen.touchedSiteId !== -1 && state.siteRecord[queen.touchedSiteId]
      );
    }

    get startupSites() {
      let sites = state.sites.filter(
        (site) =>
          !site.isFriendly &&
          senses.startCorner().containsLocationCenter(site.location)
      );

      if (sites.length === 0) {
        sites = state.sites.filter(
          (site) =>
            !site.isFriendly &&
            senses.hunkerCorner().containsLocationCenter(site.location)
        );
      }

      if (sites.length === 0) {
        sites = state.sites.filter(
          (site) =>
            !site.isFriendly &&
            senses.centralPark(900).containsLocationCenter(site.location)
        );
      }

      if (sites.length === 0) {
        sites = state.sites.filter((site) => !site.isFriendly);
      }

      return sites;
    }

    coreTrainingStep = () => {
      // no archers in remaining strategies
      // if (
      //   state.friendlyArcherBarracks.length > 0 &&
      //   trainer.creepsOfTypeInQueue("ARCHER") < this.maxArchersInQueue &&
      //   trainer.turnsUntilCanAfford("ARCHER", 1) <= 4
      // ) {
      //   trainer.enqueueTraining("ARCHER");
      // }
      if (
        state.friendlyKnightBarracks.length > 0 &&
        trainer.creepsOfTypeInQueue("KNIGHT") < 1 &&
        trainer.turnsUntilCanAfford(
          "KNIGHT",
          state.friendlyBarracksOfType("KNIGHT").length
        ) < 4
      ) {
        trainer.enqueueTraining("KNIGHT");
      }
      if (
        state.friendlyGiantBarracks.length > 0 &&
        trainer.creepsOfTypeInQueue("GIANT") < this.maxGiantsInQueue &&
        state.enemyTowers.length / 3 >
          state.friendlyGiants.length + trainer.creepsOfTypeInQueue("GIANT")
      ) {
        trainer.enqueueTraining("GIANT");
      }
    };

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
        ? site.towerSpecs.isMaxedOut
        : site.towerSpecs.location.radius >= rangeCap);

    shouldBuildTower = (site: Site) =>
      !site.isFriendly &&
      site.canBeBuiltOn &&
      (senses.isSiteThreatenedByKnights(site) ||
        senses.isSiteNearEnemyQueen(site));

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
      senses.isSiteNearEnemyQueen(site, 770) &&
      (site.goldRemaining < 100 || site.maxMineSize < 3);

    coreQueenStep = (site: Site, towerCap?: number) => {
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

      // If the queen is near an enemy barracks, capture it
      for (let barracks of state.enemyBarracks) {
        if (queen.proximity.containsLocationCenter(barracks.location)) {
          return queen.move(barracks.location);
        }
      }

      // If the queen is near an enemy mine, capture it
      for (let mine of state.enemyMines) {
        if (queen.proximity.containsLocationCenter(mine.location)) {
          return queen.move(mine.location);
        }
      }

      // Returning null allows strategy to make a choice
      return null;
    };

    coreQueenStepSecondary = (site: Site) => {
      if (senses.isSiteThreatenedByKnights(site)) {
        return queen.build(site.id, "TOWER");
      }

      // build mine if it's decent
      if (senses.isGoodMineSite(site, 2, 110)) {
        return queen.build(site.id, "MINE");
      }

      // default to building a tower
      if (!site.isFriendly && site.canBeBuiltOn) {
        return queen.build(site.id, "TOWER");
      }

      // Returning null allows strategy to make a choice
      return null;
    };

    getUnCapturedViableSites = () =>
      state.sites.filter((site) => !site.isFriendly && site.canBeBuiltOn);

    // deprecate me
    getAllViableSites = () => state.sites.filter((site) => site.canBeBuiltOn);

    coreStrategyTriage = (): Strategy | null => {
      if (!state.wasInitialBuildOutCompleted) {
        return null;
      }
      if (
        senses.isQueenThreatenedByKnights(250, 850, 2, 11) ||
        (state.enemyKnights.length > 8 &&
          new Location(
            queen.location.x,
            queen.location.y,
            900
          ).locationsWithinRadius(
            state.enemyKnights.map((knight) => knight.location)
          ).length >= 4)
      ) {
        return new TowerWallStrategy();
      }

      if (
        state.enemyTowers.length > 3 &&
        state.enemyTowers.length > state.friendlyGiants.length / 4 &&
        state.friendlyBarracksOfType("GIANT").length < 1 &&
        state.currentStrategy.strategyId !== "BUILD_BARRACKS"
      ) {
        return new BuildBarracksStrategy("GIANT");
      }

      return null;
    };
  }

  class KnightSwarmStrategy extends StrategyCore implements Strategy {
    strategyId = "KNIGHT_SWARM";
    logDescription = "SWARMING with knights";
    maxKnightsInQueue = 1;
    maxArchersInQueue = 1;
    maxGiantsInQueue = 1;

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
        sites = this.getUnCapturedViableSites().filter((site) =>
          senses.centralPark().containsLocationCenter(site.location)
        );
      }
      if (sites.length === 0) {
        sites = this.getUnCapturedViableSites();
      }
      if (sites.length === 0) {
        return null;
      }

      return senses.siteNearestTo(queen.location, sites);
    };

    trainingStep = () => {
      if (trainer.canAfford("KNIGHT", state.friendlyKnightBarracks.length)) {
        trainer.enqueueTraining("KNIGHT");
      }
    };

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        const site = this.getViableSite();
        if (site) {
          return queen.move(site.location);
        }
        console.error("No viable site found, WAITING!!!");
        return queen.move(senses.homeBase());
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];
      const defaultBuildStep = this.coreQueenStep(touchedSite);
      if (defaultBuildStep) {
        return defaultBuildStep;
      }

      // These maybe go into default.
      // I can prioritize the strategy moves on these build strategies by ordering them
      // build mine if it's decent
      if (senses.isGoodMineSite(touchedSite)) {
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
      if (senses.isQueenThreatenedByKnights()) {
        return new TowerWallStrategy();
      }
      if (state.incomeRate > state.friendlyKnightBarracks.length * 4) {
        // build another knight barracks
        return new BuildBarracksStrategy("KNIGHT");
      }
      if (state.incomeRate < state.friendlyKnightBarracks.length * 3) {
        // build more mines
        return new GoldDiggerStrategy();
      }
      return this;
    };
  }

  class TowerWallStrategy extends StrategyCore implements Strategy {
    strategyId = "TOWER WALL";
    logDescription = "Building tower wall";
    shouldGoToEdge: boolean;

    constructor(shouldGoToEdge = false) {
      super();
      this.shouldGoToEdge = shouldGoToEdge;
    }

    private areTooManyKnightsInTerritory = (
      minKnights: number,
      maxKnights: number,
      exponent = 1
    ) => {
      const scaledKnightCount =
        (maxKnights - minKnights) * Math.pow(queen.health / 100, exponent) +
        minKnights;
      return (
        state.enemyKnights.filter((knight) =>
          senses.territoryBox().containsLocationCenter(knight.location)
        ).length > scaledKnightCount
      );
    };

    private isViableSite = (site: Site) =>
      site.canBeBuiltOn &&
      !senses.isTowerWorthKeeping(site) &&
      !senses.isMineWorthKeeping(site) &&
      !senses.isFriendlyBarracks(site) &&
      // any site on my side if many knights, else just the wall box
      ((this.areTooManyKnightsInTerritory(2, 9, 1) &&
        senses.territoryBox().containsLocationCenter(site.location)) ||
        senses.wallBox().containsLocationCenter(site.location));

    private arePlentyOfTowersInWall = () => {
      const wallTowerCount = state.wasInitialBuildOutCompleted ? 3 : 2;
      const territoryTowerCount = state.wasInitialBuildOutCompleted ? 5 : 3;
      return (
        state.friendlyTowers.filter((tower) =>
          senses.wallBox().containsLocationCenter(tower.location)
        ).length >= wallTowerCount ||
        state.friendlyTowers.filter((tower) =>
          senses.territoryBox().containsLocationCenter(tower.location)
        ).length >= territoryTowerCount
      );
    };

    private getViableSite = () => {
      console.error(
        `wall box: ${senses.wallBox().x1}, ${senses.wallBox().y1}, ${
          senses.wallBox().x2
        }, ${senses.wallBox().y2}`
      );
      let sites = state.sites.filter((site) => this.isViableSite(site));
      console.error("Viable sites: " + sites.length);

      if (sites.length === 0) {
        return null;
      }

      return senses.siteNearestTo(queen.location, sites);
    };

    trainingStep = () => {
      return this.coreTrainingStep();
    };

    private shouldTargetEdgeInInitialSequence = () =>
      !state.wasInitialBuildOutCompleted && this.arePlentyOfTowersInWall();

    queenStep = () => {
      if (this.areTooManyKnightsInTerritory(4, 14, 1)) {
        return queen.move(senses.hunkerEdge());
      }
      if (queen.touchedSiteId === -1) {
        // if there is a viable site in the bunker box, approach it
        const site = this.getViableSite();
        if (!site || this.shouldTargetEdgeInInitialSequence()) {
          return queen.move(senses.hunkerEdge());
        }
        return queen.move(site.location);
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];

      const defaultBuildStep = this.coreQueenStep(touchedSite, 330);
      if (defaultBuildStep) {
        return defaultBuildStep;
      }

      if (
        this.arePlentyOfTowersInWall() ||
        (state.incomeRate < 4 && !senses.isQueenThreatenedByKnights())
      ) {
        if (
          !senses.isTowerWorthKeeping(touchedSite) &&
          !senses.isSiteThreatenedByKnights(touchedSite) &&
          senses.isGoodMineSite(touchedSite)
        ) {
          console.error("Bunker Strategy: building a mine");
          return queen.build(queen.touchedSiteId, "MINE");
        }
      }

      // If nothing else, just a tower. It's defensive...
      if (this.isViableSite(touchedSite)) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }

      const viableSite = this.getViableSite();
      if (!viableSite || this.shouldTargetEdgeInInitialSequence()) {
        return queen.move(senses.hunkerEdge());
      }

      return queen.move(viableSite.location);
    };

    getNextStrategy = (): Strategy => {
      // if (this.shouldGoToEdge) {
      //   if (!senses.hunkerEdge().containsLocationCenter(queen.location)) {
      //     return this;
      //   }
      // }

      if (!this.arePlentyOfTowersInWall()) {
        return this;
      }

      if (
        !senses.isQueenThreatenedByKnights(300, 900, 2, 9) &&
        !this.areTooManyKnightsInTerritory(3, 11, 1)
      ) {
        console.error("I can leave bunker");
        console.error(state.lastStrategy.strategyId);
        if (!state.wasInitialBuildOutCompleted) {
          return state.initialStrategySequence.shift()!;
        }
        return state.lastStrategy;
      }
      return this;
    };
  }

  class BuildBarracksStrategy extends StrategyCore implements Strategy {
    barracksType: BarracksType;
    strategyId = "BUILD_BARRACKS";
    logDescription = "Building Barracks";
    nextStrategy: Strategy = this;

    constructor(
      barracksType: BarracksType,
      private centralRadiusMin = 370,
      private centralRadiusMax = 680
    ) {
      super();
      this.logDescription = `Building ${barracksType} Barracks`;
      this.barracksType = barracksType;
    }

    private isViableBuildSite = (site: Site) =>
      site.canBeBuiltOn &&
      !senses.isFriendlyBarracks(site) &&
      !senses.isMineWorthKeeping(site) &&
      !senses.isTowerWorthKeeping(site) &&
      !senses.isSiteThreatenedByTowers(site) &&
      senses
        .centralPark(this.centralRadiusMax)
        .containsLocationCenter(site.location);

    private sendQueenToBuildSite = () => {
      let viableSites = senses
        .sitesWithin(senses.centralPark(this.centralRadiusMin))
        .filter((s) => this.isViableBuildSite(s));

      if (viableSites.length === 0) {
        viableSites = senses
          .sitesWithin(senses.centralPark(this.centralRadiusMax))
          .filter((s) => this.isViableBuildSite(s));
      }

      if (viableSites.length === 0) {
        viableSites = this.getAllViableSites().filter((s) =>
          this.isViableBuildSite(s)
        );
      }

      if (viableSites.length === 0) {
        console.error("No viable site, WAITING!!!");
        return queen.wait();
      }

      const site = senses.siteNearestTo(queen.location, viableSites);
      return queen.move(site.location);
    };

    trainingStep = () => {
      this.coreTrainingStep();
      if (
        trainer.creepsOfTypeInQueue(this.barracksType) < 1 &&
        trainer.turnsUntilCanAfford(this.barracksType, 1) <= 4
      ) {
        trainer.enqueueTraining(this.barracksType);
      }
    };

    queenStep = () => {
      if (queen.touchedSiteId === -1) {
        return this.sendQueenToBuildSite();
      }

      const touchedSite = state.siteRecord[queen.touchedSiteId];

      if (
        senses.isSiteNearEnemyQueen(touchedSite) ||
        senses.isSiteThreatenedByKnights(touchedSite)
      ) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }

      if (this.isViableBuildSite(touchedSite)) {
        if (!state.wasInitialBuildOutCompleted) {
          this.nextStrategy = state.initialStrategySequence.shift()!;
        } else {
          this.nextStrategy = state.lastStrategy;
        }
        return queen.build(queen.touchedSiteId, "BARRACKS", this.barracksType);
      }

      if (senses.isGoodMineSite(touchedSite)) {
        return queen.build(queen.touchedSiteId, "MINE");
      }

      if (!touchedSite.isFriendly && touchedSite.canBeBuiltOn) {
        return queen.build(queen.touchedSiteId, "TOWER");
      }

      return this.sendQueenToBuildSite();
    };

    // If these remain identical maybe it goes into executor
    trainerStep = () => {
      return trainer.trainNext();
    };

    getNextStrategy = (): Strategy => {
      if (!this.nextStrategy.equals(this)) {
        return this.nextStrategy;
      }

      const core = this.coreStrategyTriage();
      if (core) {
        return core;
      }
      if (this.barracksType === "KNIGHT") {
        if (
          state.incomeRate <
          state.friendlyBarracksOfType("KNIGHT").length * 4
        ) {
          return state.lastStrategy;
        }
      } else if (state.friendlyBarracksOfType(this.barracksType).length > 0) {
        if (state.wasInitialBuildOutCompleted) {
          return state.lastStrategy;
        }
      }
      return this;
    };
  }
  class GoldDiggerStrategy extends StrategyCore implements Strategy {
    strategyId = "GOLD_DIGGER";
    logDescription = "Digging for gold";

    private lastSite?: Site;

    private hunkerProximity = () =>
      new Location(senses.hunkerCorner().x, senses.hunkerCorner().y, 350);

    private isViableBuildSite = (site: Site) =>
      site.canBeBuiltOn &&
      (site.goldRemaining > 80 || site.goldRemaining === -1) &&
      !(site.structureType === "MINE" && site.isFriendly) &&
      !senses.isSiteThreatenedByTowers(site, 2, -35) &&
      (senses.backWall().containsLocationCenter(site.location) ||
        this.hunkerProximity().containsLocationCenter(site.location) ||
        (!senses.isTowerWorthKeeping(site) &&
          !senses.isFriendlyBarracks(site)));

    private sendQueenToBuildSite = () => {
      let hunkerSites: Site[] = [];
      if (queen.area.containsLocationCenter(senses.hunkerCorner())) {
        hunkerSites = senses.sitesWithin(this.hunkerProximity());
      }

      const possibleSites = state.wasInitialBuildOutCompleted
        ? state.sites
        : this.startupSites;

      possibleSites.concat(hunkerSites);

      let viableSites = senses
        .sitesWithin(queen.vision, possibleSites)
        .filter((site) => this.isViableBuildSite(site));

      if (viableSites.length === 0) {
        console.error("no sites within VISION");
        viableSites = senses
          .sitesWithin(queen.proximity, possibleSites)
          .filter((site) => this.isViableBuildSite(site));
      }

      if (viableSites.length === 0) {
        console.error("no sites within PROXIMITY");
        viableSites = senses
          .sitesWithin(queen.area, possibleSites)
          .filter((site) => this.isViableBuildSite(site));
      }

      if (viableSites.length === 0) {
        console.error("no sites within AREA");
        viableSites = this.getAllViableSites().filter((site) =>
          this.isViableBuildSite(site)
        );
      }

      if (viableSites.length === 0) {
        console.error("no sites AT ALL");
        if (this.lastSite) {
          return queen.move(this.lastSite.location);
        }
        console.error("No viable GOLD site, WAITING!!!");
        return queen.wait();
      }

      const prioritizedSites = viableSites
        .sort((a, b) => {
          return b.goldRemaining - a.goldRemaining;
        })
        .sort((a, b) => {
          return b.maxMineSize - a.maxMineSize;
        });

      console.error("Prioritized sites: ");
      for (let site of prioritizedSites) {
        console.error(
          `site: ${site.id} gold: ${site.goldRemaining} maxMineSize: ${site.maxMineSize}`
        );
      }

      const nextSite = prioritizedSites[0];
      if (
        !!this.lastSite &&
        ((this.isViableBuildSite(this.lastSite) &&
          this.lastSite.location.distanceTo(queen.location) <
            nextSite.location.distanceTo(queen.location)) ||
          prioritizedSites.includes(this.lastSite))
      ) {
        console.error("Going back to last site");
        return queen.move(this.lastSite.location);
      }

      this.lastSite = nextSite;

      console.error("Going to next site");
      return queen.move(this.lastSite.location);
    };

    trainingStep = () => {
      this.coreTrainingStep();
    };

    queenStep = () => {
      if (!this.touchedSite) {
        return this.sendQueenToBuildSite();
      }
      const touchedSite = this.touchedSite;

      console.error("touched site"),
        console.error(
          `id: ${touchedSite.id} gold: ${touchedSite.goldRemaining} rate: ${touchedSite.maxMineSize} owner: ${touchedSite.ownerId}`
        );

      let buildStep = this.coreQueenStep(touchedSite, 300);
      if (buildStep) {
        return buildStep;
      }

      if (this.isViableBuildSite(touchedSite)) {
        if (
          senses.isSiteThreatenedByKnights(touchedSite, 180, 1) ||
          senses.isSiteNearEnemyQueen(touchedSite)
        ) {
          return queen.build(queen.touchedSiteId, "TOWER");
        }
        return queen.build(queen.touchedSiteId, "MINE");
      }

      buildStep = this.coreQueenStepSecondary(touchedSite);

      return this.sendQueenToBuildSite();
    };

    getNextStrategy = (): Strategy => {
      const coreStrategy = this.coreStrategyTriage();
      if (coreStrategy && coreStrategy.strategyId !== this.strategyId) {
        console.error("going with core strategy");
        return coreStrategy;
      }
      if (!(this.touchedSite && this.shouldExpandGoldMine(this.touchedSite))) {
        if (!state.wasInitialBuildOutCompleted) {
          if (
            state.incomeRate > state.targetIncomeRate() ||
            state.friendlyGoldMines.length > 3
          ) {
            console.error(
              "strategies left: " + state.initialStrategySequence.length
            );
            return state.initialStrategySequence.shift()!;
          }
        } else if (state.lastStrategy.strategyId === "KNIGHT_SWARM") {
          if (state.incomeRate < state.friendlyKnightBarracks.length * 4) {
            return this;
          }
          return state.lastStrategy;
        } else if (state.incomeRate > state.targetIncomeRate()) {
          return state.lastStrategy;
        }
      }
      return this;
    };
  }

  class GameState {
    private static instance: GameState;
    private constructor() {
      this._currentStrategy = this.initialStrategySequence.shift()!;
      this._lastStrategy = this._currentStrategy;
    }
    static getInstance(): GameState {
      if (!GameState.instance) {
        GameState.instance = new GameState();
      }
      return GameState.instance;
    }
    gold = 0;
    siteRecord: Record<number, Site> = {};
    units: Unit[] = [];
    targetKnightBarracksCount = 1;
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

    // can make this conditional/dynamic, but for now:
    initialStrategySequence = [
      new GoldDiggerStrategy(),
      new BuildBarracksStrategy("KNIGHT"),
      new TowerWallStrategy(true),
      new KnightSwarmStrategy(),
    ];

    get wasInitialBuildOutCompleted() {
      return this.initialStrategySequence.length === 0;
    }

    private _currentStrategy: Strategy;
    private _lastStrategy: Strategy;
    get currentStrategy() {
      return this._currentStrategy;
    }
    set currentStrategy(strategy: Strategy) {
      if (!strategy.equals(this._currentStrategy)) {
        if (
          this._currentStrategy.strategyId !== "BUNKER" &&
          this._currentStrategy.strategyId !== "GOLD_DIGGER" &&
          this._currentStrategy.strategyId !== "BUILD_BARRACKS"
        ) {
          // then it's something I want to come back to
          this.lastStrategy = this._currentStrategy;
        }
        this._currentStrategy = strategy;
      }
    }
    get lastStrategy() {
      return this._lastStrategy;
    }
    private set lastStrategy(strategy: Strategy) {
      console.error(
        "setting last strategy to:",
        strategy.strategyId,
        "from:",
        this._lastStrategy.strategyId
      );
      this._lastStrategy = strategy;
    }

    minIncomeRate(max = 9, min = 2, shouldScale = true) {
      const rate = shouldScale ? (max - min) * (queen.health / 100) + min : max;
      console.error("min income:", rate);

      return rate;
    }

    targetIncomeRate(max = 12, min = 3, shouldScale = true): number {
      if (!this.wasInitialBuildOutCompleted) {
        return 3;
      }
      const rate = shouldScale ? (max - min) * (queen.health / 100) + min : max;
      console.error("target income:", rate);

      return rate;
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
        if (owner === 0 && unitType === -1) {
          // It was our queen
          // The game just started. Store init variables
          if (this._startLocation === null) {
            this._startLocation = x < 500 ? "TOP_LEFT" : "BOTTOM_RIGHT";
          }
          if (this._initialQueenHealth === 0) {
            this._initialQueenHealth = health;
            // this.currentStrategy = this.initialStrategy;
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

    get friendlyTowers() {
      return this.sites.filter(
        (site) => site.isFriendly && site.structureType === "TOWER"
      );
    }

    get enemyBarracks() {
      return this.sites.filter(
        (site) => site.ownerId === 1 && site.structureType === "BARRACKS"
      );
    }

    get enemyMines() {
      return this.sites.filter(
        (site) => site.ownerId === 1 && site.structureType === "MINE"
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

    // todo: deprecate above in favor of this:
    friendlyBarracksOfType = (type: BarracksType) =>
      this.sites.filter(
        (s) =>
          s.isFriendly &&
          s.structureType === "BARRACKS" &&
          s.barracksSpecs.type === type
      );

    get friendlyGoldMines() {
      return this.sites.filter(
        (site) => site.isFriendly && site.structureType === "MINE"
      );
    }
  }

  const state = GameState.getInstance();
  const queen = Queen.getInstance();
  const senses = new Senses();
  const executor = new Executor();
  const trainer = new Trainer();

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
    executor.execute(state.currentStrategy);
  }
}

// NOTES TO SELF:

// Bunker strategy could check if there are plenty of towers in bunker and try to build mines near corner/wall

// I'm seeing a lot of success from folks who build towers near the middle.
// May want to flesh out a new "tower wall" strategy where I build towers along my side of the middle

// Either stop building two knight barracks or figure out how to train simultaneously

// I'm still sometimes attempting to build mines when enemy knights are on top of it. That is dumb.
// I think this is because of the site radius. I need to check if the site + its radius is too close to knights?

// When I'm near an enemy knight barracks I may as well chase it and convert it to a tower, archer, knight, or maybe just whatever is convenient

// Consider using a build queue to decide when to take up building-specific strategies
