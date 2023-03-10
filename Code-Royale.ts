namespace CodeRoyale {
  type NearnessIndicator = {
    isValid: boolean;
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

    static distanceBetween(a: Position, b: Position) {
      return a.distanceTo(b);
    }

    static Average(positions: Position[]) {
      return new Position(
        positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
        positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length
      );
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
          isValid: positions.length > 0,
        } as NearnessIndicator
      );
    }

    static average(positions: Position[]) {
      return new Position(
        positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
        positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length
      );
    }
  }
  class Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    get origin(): Position {
      return new Position(this.x1, this.y1);
    }
    get destination(): Position {
      return new Position(this.x2, this.y2);
    }

    constructor(origin: Position, direction: Position);
    constructor(x1: number, y1: number, x2: number, y2: number);
    constructor(
      a: Position | number,
      b: Position | number,
      c?: number,
      d?: number
    ) {
      if (a instanceof Position && b instanceof Position) {
        this.x1 = a.x;
        this.y1 = a.y;
        this.x2 = b.x;
        this.y2 = b.y;
      } else if (
        typeof a === "number" &&
        typeof b === "number" &&
        typeof c === "number" &&
        typeof d === "number"
      ) {
        this.x1 = a;
        this.y1 = b;
        this.x2 = c;
        this.y2 = d;
      } else {
        throw new Error("Invalid constructor arguments");
      }
    }

    oppositeLine() {
      const { x1, y1, x2, y2 } = this;
      return new Line(x1, y1, x1 + (x1 - x2), y1 + (y1 - y2));
    }

    extendedLine = (multiplier: number) => {
      const { x1, y1, x2, y2 } = this;
      return new Line(
        x1,
        y1,
        x1 + (x2 - x1) * multiplier,
        y1 + (y2 - y1) * multiplier
      );
    };
  }

  type PlayerId = -1 | 0 | 1;
  type UnitTypeId = -1 | 0 | 1 | 2;
  type UnitType = "QUEEN" | "KNIGHT" | "ARCHER" | "GIANT" | "UNKNOWN";

  // type UnitRadius = 30 | 20 | 25 | 40;
  // type UnitSpeed = 60 | 100 | 75 | 50;
  class Unit {
    id: number;
    ownerId: PlayerId;
    _unitTypeId: UnitTypeId;
    health: number;
    position: Position;

    // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    get unitType(): UnitType {
      switch (this._unitTypeId) {
        case -1:
          return "QUEEN";
        case 0:
          return "KNIGHT";
        case 1:
          return "ARCHER";
        case 2:
          return "GIANT";
        default:
          return "UNKNOWN";
      }
    }

    // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    // QUEEN = 30, KNIGHT = 20, ARCHER = 25, GIANT = 40
    get radius(): number {
      switch (this._unitTypeId) {
        case -1:
          return 30;
        case 0:
          return 20;
        case 1:
          return 25;
        case 2:
          return 40;
        default:
          return 0;
      }
    }

    // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    // QUEEN = 60, KNIGHT = 100, ARCHER = 75, GIANT = 50
    get speed(): number {
      switch (this._unitTypeId) {
        case -1:
          return 60;
        case 0:
          return 100;
        case 1:
          return 75;
        case 2:
          return 50;
        default:
          return 0;
      }
    }

    // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    // QUEEN = 200, KNIGHT = 25, ARCHER = 45, GIANT = 200
    get maxHealth(): number {
      switch (this._unitTypeId) {
        case -1:
          return 200;
        case 0:
          return 25;
        case 1:
          return 45;
        case 2:
          return 200;
        default:
          return 0;
      }
    }

    get isFriendly(): boolean {
      return this.ownerId === 0;
    }

    get isHostile(): boolean {
      return this.ownerId === 1;
    }

    constructor(
      id: number,
      owner: PlayerId,
      type: UnitTypeId,
      health: number,
      x: number,
      y: number
    ) {
      this.id = id;
      this.ownerId = owner;
      this._unitTypeId = type;
      this.health = health;
      this.position = new Position(x, y);
    }
  }

  type SiteTypeId = -1 | 0 | 1 | 2;
  type SiteType = "MINE" | "TOWER" | "BARRACKS" | "UNKNOWN";
  interface SiteUpdate {
    id: number;
    goldRemaining: number;
    maxMineSize: number;
    siteType: SiteTypeId;
    owner: PlayerId;
    param1: number;
    param2: number;
  }
  interface SiteConstructor {
    id: number;
    radius: number;
    x: number;
    y: number;
  }
  type BarracksType = "KNIGHT" | "ARCHER" | "GIANT";

  class Site {
    id: number;
    goldRemaining: number = -1;
    maxMineSize: number = -1;
    radius: number;
    owner: PlayerId = -1;
    param1: number = -1;
    param2: number = -1;
    position: Position;
    private _siteType: SiteTypeId = -1;

    constructor(siteConstructor: SiteConstructor) {
      const { id, radius, x, y } = siteConstructor;
      this.id = id;
      this.radius = radius;
      this.position = new Position(x, y);
    }

    update(update: SiteUpdate) {
      this._siteType = update.siteType;
      this.goldRemaining = update.goldRemaining;
      this.maxMineSize = update.maxMineSize;
      this.owner = update.owner;
      this.param1 = update.param1;
      this.param2 = update.param2;
    }

    get siteType(): SiteType {
      return this._siteType == -1
        ? "UNKNOWN"
        : this._siteType == 0
        ? "MINE"
        : this._siteType == 1
        ? "TOWER"
        : this._siteType == 2
        ? "BARRACKS"
        : "UNKNOWN";
    }

    get isNotOurs() {
      return this.owner !== 0;
    }

    get isFriendly() {
      return this.owner === 0;
    }

    get isHostile() {
      return this.owner === 1;
    }

    get isUnowned() {
      return this.owner === -1;
    }

    get isTower() {
      return this.siteType === "TOWER";
    }

    get towerSpecs() {
      return {
        hp: this.param1,
        range: this.param2,
        isMaxedOut: this.param1 >= this.param2,
      };
    }

    get isBarracks() {
      return this.siteType === "BARRACKS";
    }

    get barracksSpecs(): {
      type: BarracksType;
      turnsUntilCanTrain: number;
    } {
      return {
        type:
          this.param2 === 0 ? "KNIGHT" : this.param2 === 1 ? "ARCHER" : "GIANT",
        turnsUntilCanTrain: this.param1,
      };
    }

    get isGoldMine() {
      return this.siteType === "MINE";
    }

    get goldMineSpecs() {
      return {
        incomeRate: this.param1,
        isMaxedOut: this.param1 >= this.maxMineSize,
      };
    }
  }

  class QueenSenses {
    // Does it make sense to make this a singleton?
    // It makes it convenient to access from anywhere, but it also makes it a bit harder to test
    private static instance: QueenSenses;

    static getInstance = (): QueenSenses => {
      if (!QueenSenses.instance) {
        QueenSenses.instance = new QueenSenses();
      }
      return QueenSenses.instance;
    };

    nextTargetBuildingSite = (): Site | null => {
      const siteTracker = SiteTracker.getInstance();
      // May want to extend the logic to decide whether to expand to all safe sites or just stop building
      let possibleSites = siteTracker.unownedSafeBuildingSites;
      if (possibleSites.length === 0) {
        console.error(
          'No unowned safe building sites, falling back to "all safe sites"'
        );
        possibleSites = siteTracker.allSafeBuildingSites;
      }
      if (possibleSites.length === 0) {
        console.error("NO POSSIBLE BUILDING SITES - THAT SEEMS WEIRD");
        return null;
      }

      const queen = Queen.getInstance();
      const nearnessIndicator = queen.position.nearest(
        possibleSites.map((site) => site.position)
      );
      if (!nearnessIndicator.isValid) {
        console.error("nearnessIndicator is NOT VALID");
      }
      return possibleSites[nearnessIndicator.index];
    };

    isThreatenedByKnights = (
      proximityThreshold: number,
      attackerCountThreshold: number,
      shouldScale: boolean
    ): boolean => {
      const queen = Queen.getInstance();
      const queenHealthFraction = queen.health / queen.maxHealth;
      const scaledProximityThreshold = shouldScale
        ? proximityThreshold + 80 - queenHealthFraction * proximityThreshold
        : proximityThreshold;
      const scaledAttackerCountThreshold = shouldScale
        ? queenHealthFraction * attackerCountThreshold
        : attackerCountThreshold;
      console.error(`queenHealthFraction: ${queenHealthFraction}`);
      console.error(`scaledProximityThreshold: ${scaledProximityThreshold}`);
      console.error(
        `scaledAttackerCountThreshold: ${scaledAttackerCountThreshold}`
      );
      const unitTracker = UnitTracker.getInstance();
      const nearbyKnights = unitTracker.hostileKnights.filter(
        (knight) =>
          knight.position.distanceTo(queen.position) < scaledProximityThreshold
      );
      return nearbyKnights.length > scaledAttackerCountThreshold;
    };

    awayFromKnightHorde = (proximityThreshold: number): Line => {
      const queen = Queen.getInstance();
      const unitTracker = UnitTracker.getInstance();
      const averagePosition = Position.average(
        unitTracker.hostileKnights
          .filter(
            (knight) =>
              knight.position.distanceTo(queen.position) < proximityThreshold
          )
          .map((knight) => knight.position)
      );
      // Should vary inversely with proximityThreshold
      // Need to figure out what the range of plausible ProximityThresholds is first.
      const lineExtensionMultiplier = 4;
      const directionTo = new Line(queen.position, averagePosition);
      const directionAway = directionTo.oppositeLine();
      const extendedDirectionAway = directionAway.extendedLine(
        lineExtensionMultiplier
      );
      return extendedDirectionAway;
    };
  }

  class QueenBrain {
    // Does it make sense to make this a singleton?
    // Is it really helpful in any way?
    private static instance: QueenBrain;
    private strategy: Strategy = new ExploreStrategy();

    static getInstance = (): QueenBrain => {
      if (!QueenBrain.instance) {
        QueenBrain.instance = new QueenBrain();
      }
      return QueenBrain.instance;
    };

    think = (): void => {
      // getting next strategy first accounts for first-move and
      // maybe some race conditions between turns
      this.strategy = this.strategy.nextStrategy();
      this.strategy.execute();
    };
  }

  interface Strategy {
    execute: () => void;
    nextStrategy: () => Strategy;
  }

  const approachNearbyBuildingSite = (): void => {
    const site = QueenSenses.getInstance().nextTargetBuildingSite();
    const queen = Queen.getInstance();
    if (!site) {
      console.error("NO SITE FOUND SO JUST STANDING STILL WTF");
      queen.wait();
    } else {
      queen.move(site.position);
    }
  };

  class ExploreStrategy implements Strategy {
    nextStrategy = (): Strategy => {
      const queen = Queen.getInstance();

      // if the queen is touching a site that we do not own, then we should capture it
      // Apparently which queen can build if they both try depends if the turn is even
      // or odd so if the other queen is touching it, and it's not our turn, just move on.
      if (
        queen.touchedSite !== -1 &&
        !SiteTracker.getInstance().getSite(queen.touchedSite).isFriendly
      ) {
        return new SiteCaptureStrategy();
      } else {
        return new ExploreStrategy();
      }
    };

    execute = (): void => {
      console.error("Exploring");
      const queen = Queen.getInstance();
      if (queen.touchedSite !== -1) {
        approachNearbyBuildingSite();
      } else {
        approachNearbyBuildingSite();
      }
    };
  }

  const shouldExpandTower = (site: Site) =>
    !!site && site.isTower && site.isFriendly && !site.towerSpecs.isMaxedOut;

  const shouldExpandGoldMine = (site: Site) =>
    !!site &&
    site.isGoldMine &&
    site.isFriendly &&
    site.goldRemaining > 80 &&
    !site.goldMineSpecs.isMaxedOut;

  class SiteCaptureStrategy implements Strategy {
    nextStrategy = (): Strategy => {
      const touchedSite = SiteTracker.getInstance().getSite(
        Queen.getInstance().touchedSite
      );

      if (shouldExpandTower(touchedSite)) {
        return new TowerExpansionStrategy();
      } else if (shouldExpandGoldMine(touchedSite)) {
        return new GoldMineExpansionStrategy();
      } else {
        return new ExploreStrategy();
      }
    };

    execute = (): void => {
      console.error("Capturing");
      const queen = Queen.getInstance();
      const site = SiteTracker.getInstance().getSite(queen.touchedSite);
      // testing
      const enemyQueen = UnitTracker.getInstance().enemyQueen;
      console.error(enemyQueen?.id);
      if (enemyQueen) {
        // log distance from the site to enemy queen
        console.error(
          `Distance from site to enemy queen: ${site.position.distanceTo(
            enemyQueen.position
          )}`
        );
      }
      // end testing
      if (site.isFriendly) {
        console.error("Site is already friendly, just standing still");
        queen.wait();
      } else {
        const capPref = this.siteCapturePreference();
        switch (capPref) {
          case "KNIGHT_BARRACKS":
            queen.buildBarracks(site.id, "KNIGHT");
            break;
          case "ARCHER_BARRACKS":
            queen.buildBarracks(site.id, "ARCHER");
            break;
          case "GIANT_BARRACKS":
            queen.buildBarracks(site.id, "GIANT");
            break;
          case "GOLD_MINE":
            queen.buildGoldMine(site.id);
            break;
          case "TOWER":
            queen.buildTower(site.id);
            break;
          default:
            queen.wait();
        }
      }
    };

    private siteCapturePreference = (): SiteBuildType => {
      const trainer = Trainer.getInstance();
      const tracker = SiteTracker.getInstance();
      const enemyQueen = UnitTracker.getInstance().enemyQueen;
      const site = tracker.getSite(Queen.getInstance().touchedSite);
      const distanceFromSiteToEnemyQueen = enemyQueen
        ? site.position.distanceTo(enemyQueen.position)
        : Number.MAX_VALUE;

      console.error(`trainer.unitTypeNeeded: ${trainer.unitTypeNeeded}`);
      // Should consider max mine size before just building anything else
      if (
        (trainer.unitTypeNeeded === "KNIGHT" &&
          tracker.friendlyKnightBarracks.length < 1) ||
        distanceFromSiteToEnemyQueen < 390
      ) {
        // Consider adding more barracks close to enemy queen if the site is not awesome for gold etc
        return "KNIGHT_BARRACKS";
      } else if (
        trainer.unitTypeNeeded === "ARCHER" &&
        tracker.friendlyArcherBarracks.length < 1
      ) {
        return "ARCHER_BARRACKS";
      } else if (
        trainer.unitTypeNeeded === "GIANT" &&
        tracker.friendlyGiantBarracks.length < 1
      ) {
        return "GIANT_BARRACKS";
      } else if (this.shouldBuildGoldMine()) {
        return "GOLD_MINE";
      } else return "TOWER";
    };

    private shouldBuildGoldMine = (): boolean => {
      const touchedSite = SiteTracker.getInstance().getSite(
        Queen.getInstance().touchedSite
      );
      const hasEnoughGold = touchedSite.goldRemaining >= 80; // could be prop of site?
      if (!hasEnoughGold) {
        return false;
      }

      const nearestKnightIndicator = touchedSite.position.nearest(
        UnitTracker.getInstance().hostileKnightPositions
      );
      if (!nearestKnightIndicator.isValid) {
        console.error("nearestKnightIndicator is NOT VALID");
      }
      if (nearestKnightIndicator.distance < 400) {
        return false;
      }
      return true;
    };
  }

  class TowerExpansionStrategy implements Strategy {
    nextStrategy = (): Strategy => {
      const touchedSite = SiteTracker.getInstance().getSite(
        Queen.getInstance().touchedSite
      );
      if (!touchedSite) {
        return new ExploreStrategy();
      } else if (shouldExpandTower(touchedSite)) {
        return new TowerExpansionStrategy();
      } else {
        return new ExploreStrategy();
      }
    };

    execute = (): void => {
      console.error("Expanding TOWER");
      const queen = Queen.getInstance();
      const touchedSite = SiteTracker.getInstance().getSite(queen.touchedSite);
      if (shouldExpandTower(touchedSite)) {
        queen.buildTower(queen.touchedSite);
      } else {
        approachNearbyBuildingSite();
      }
    };
  }

  class GoldMineExpansionStrategy implements Strategy {
    nextStrategy = (): Strategy => {
      const touchedSite = SiteTracker.getInstance().getSite(
        Queen.getInstance().touchedSite
      );
      if (!touchedSite) {
        return new ExploreStrategy();
      } else if (shouldExpandGoldMine(touchedSite)) {
        return new GoldMineExpansionStrategy();
      } else {
        return new ExploreStrategy();
      }
    };

    execute = (): void => {
      console.error("Expanding GOLD MINE");
      const queen = Queen.getInstance();
      const touchedSite = SiteTracker.getInstance().getSite(queen.touchedSite);
      if (shouldExpandGoldMine(touchedSite)) {
        queen.buildGoldMine(queen.touchedSite);
      } else {
        approachNearbyBuildingSite();
      }
    };
  }

  interface QueenUpdate {
    touchedSite: number;
    position: Position;
    health: number;
  }

  // Consider merging with SiteType
  // and maybe merging siteType getter with barracksSpecks type
  type SiteBuildType =
    | "TOWER"
    | "GOLD_MINE"
    | "KNIGHT_BARRACKS"
    | "ARCHER_BARRACKS"
    | "GIANT_BARRACKS";

  class Queen extends Unit {
    // Keeping this as a singleton makes it so we can't have multiple queens
    // Enemy queen doesn't need all the same properties so maybe that's fine.
    private static instance: Queen;
    touchedSite: number = -1;

    private constructor(
      id: number,
      owner: PlayerId,
      type: UnitTypeId,
      health: number,
      x: number,
      y: number,
      touchedSite: number
    ) {
      super(id, owner, type, health, x, y);
      this.touchedSite = touchedSite;
    }

    static createInstance(
      id: number,
      owner: PlayerId,
      type: UnitTypeId,
      health: number,
      x: number,
      y: number,
      touchedSite: number
    ) {
      if (!Queen.instance) {
        Queen.instance = new Queen(id, owner, type, health, x, y, touchedSite);
      }
      return Queen.instance;
    }

    static getInstance() {
      if (!Queen.instance) {
        throw new Error("Queen instance not initialized");
      }
      return Queen.instance;
    }

    static hasInstance() {
      return !!Queen.instance;
    }

    update(update: QueenUpdate) {
      this.touchedSite = update.touchedSite;
      this.position = update.position;
      this.health = update.health;
    }

    move = (target: Position) => {
      console.error(`Moving target: ${target.x}, ${target.y}`);
      // Ensure that destination is within bounds of game board minus margins
      // Needs more nuance but helps prevent pushing aggressively into edge of map
      const mapWidth = 1920;
      const mapHeight = 1000;
      const xMargin = 140;
      const yMargin = 115;
      const x = Math.max(
        xMargin,
        Math.min(mapWidth - xMargin, target.x)
      ).toFixed(0);
      const y = Math.max(
        yMargin,
        Math.min(mapHeight - yMargin, target.y)
      ).toFixed(0);
      console.log(`MOVE ${x} ${y}`);
    };

    wait = () => {
      console.log("WAIT");
    };

    buildGoldMine = (siteId: number) => {
      console.log(`BUILD ${siteId} MINE`);
    };

    buildTower = (siteId: number) => {
      console.log(`BUILD ${siteId} TOWER`);
    };

    buildBarracks = (siteId: number, type: BarracksType) => {
      console.log(`BUILD ${siteId} BARRACKS-${type}`);
    };

    isTouchingAnySite = () => {
      // So far never used...
      return this.touchedSite !== -1;
    };

    // may be superfluous
    isTouchingSite = (siteId: number) => {
      // so far never used...
      return this.touchedSite === siteId;
    };
  }

  type UnitTypeNeeded = "KNIGHT" | "ARCHER" | "GIANT" | "NONE";
  class Trainer {
    unitTypeNeeded: UnitTypeNeeded = "NONE";
    // For now a singleton but I'm wondering if this shouldn't be a
    // property of the Queen, supplemental to the QueenBrain
    private static instance: Trainer;

    static getInstance() {
      if (!Trainer.instance) {
        Trainer.instance = new Trainer();
      }
      return Trainer.instance;
    }

    public train = (): void => {
      const unitTypeNeeded = this.getUnitTypeNeeded();
      console.error(`Unit type needed: ${unitTypeNeeded}`);
      if (unitTypeNeeded !== "NONE") {
        switch (unitTypeNeeded) {
          case "KNIGHT":
            this.trainKnights();
            break;
          case "ARCHER":
            this.trainArchers();
            break;
          case "GIANT":
            this.trainGiants();
            break;
          default:
            this.trainNothing();
        }
      } else {
        // nothing to do here...
        this.trainNothing();
      }
      this.unitTypeNeeded = unitTypeNeeded;
    };

    private trainKnights = (): void => {
      const siteTracker = SiteTracker.getInstance();
      const knightBarracks = siteTracker.friendlyKnightBarracks;
      const knightBarracksPositions =
        siteTracker.friendlyKnightBarracksPositions;
      // if there are no knight barracks then just chill.
      if (knightBarracks.length === 0) {
        console.error("Knights wanted but no barracks found.");
        this.trainNothing();
      } else {
        // find the knight barracks closest to the enemy queen
        const enemyQueen = UnitTracker.getInstance().enemyQueen;
        if (!enemyQueen) {
          throw new Error("Enemy queen not found");
        }
        // Should consider strategies to build barracks in different locations
        // Ideal to train knights closer to enemy queen
        // If a location has little gold or small max mine rate and we want lots of knights, then...
        const nearestBarracksIndicator = enemyQueen.position.nearest(
          knightBarracksPositions
        );
        if (!nearestBarracksIndicator.isValid) {
          console.error("nearestBarracksIndicator NOT VALID");
        }
        const nearestBarracks = knightBarracks[nearestBarracksIndicator.index]; // does this work?
        // likely to deprecate this:
        const closestBarracks = knightBarracks.reduce((closest, barracks) => {
          const proximity = enemyQueen.position.distanceTo(barracks.position);
          if (proximity < closest.position.distanceTo(enemyQueen.position)) {
            return barracks;
          } else {
            return closest;
          }
        }, knightBarracks[0]);
        // just checking for now:
        console.error(`closest barracks: ${closestBarracks.id}`);
        console.error(`nearest barracks: ${nearestBarracks.id}`);
        console.log(`TRAIN ${nearestBarracks.id}`);
      }
    };

    private trainArchers = (): void => {
      const siteTracker = SiteTracker.getInstance();
      const archerBarracks = siteTracker.friendlyArcherBarracks;
      // if there are no archer barracks then just chill.
      if (archerBarracks.length === 0) {
        console.error("Archers wanted but no barracks found.");
        this.trainNothing();
      } else {
        // find the archer barracks closest to enemy knight barracks
        const enemyKnightBarracks = siteTracker.hostileKnightBarracks;
        const queenLocation = Queen.getInstance().position;
        if (enemyKnightBarracks.length === 0) {
          // just train closest to queen
          const closestBarracksIndicator = queenLocation.nearest(
            archerBarracks.map((b) => b.position)
          );
          if (!closestBarracksIndicator.isValid) {
            console.error("closestBarracksIndicator NOT VALID");
          }
          const closestBarracks =
            archerBarracks[closestBarracksIndicator.index];
          console.log(`TRAIN ${closestBarracks.id}`);
        } else {
          const knightBarracksClosestToQueen = enemyKnightBarracks.reduce(
            (closest, barracks) => {
              const proximity = queenLocation.distanceTo(barracks.position);
              if (proximity < closest.position.distanceTo(queenLocation)) {
                return barracks;
              } else {
                return closest;
              }
            },
            enemyKnightBarracks[0]
          );
          const archerBarracksClosestToKnightBarracks = archerBarracks.reduce(
            (closest, barracks) => {
              const proximity =
                knightBarracksClosestToQueen.position.distanceTo(
                  barracks.position
                );
              if (
                proximity <
                closest.position.distanceTo(
                  knightBarracksClosestToQueen.position
                )
              ) {
                return barracks;
              } else {
                return closest;
              }
            },
            archerBarracks[0]
          );
          console.log(`TRAIN ${archerBarracksClosestToKnightBarracks.id}`);
        }
      }
    };

    private trainGiants = (): void => {
      // train giants at the closest barracks to the enemy tower closest to my queen
      const giantBarracks = SiteTracker.getInstance().friendlyGiantBarracks;
      // if there are no giant barracks then just chill.
      if (giantBarracks.length === 0) {
        console.error("Giants wanted but no barracks found.");
        this.trainNothing();
      } else {
        const enemyTowers = SiteTracker.getInstance().hostileTowers;
        const queenLocation = Queen.getInstance().position;
        const enemyTowerClosestToQueen = enemyTowers.reduce(
          (closest, tower) => {
            const proximity = queenLocation.distanceTo(tower.position);
            if (proximity < closest.position.distanceTo(queenLocation)) {
              return tower;
            } else {
              return closest;
            }
          },
          enemyTowers[0]
        );
        const giantBarracksClosestToEnemyTower = giantBarracks.reduce(
          (closest, barracks) => {
            const proximity = enemyTowerClosestToQueen.position.distanceTo(
              barracks.position
            );
            if (
              proximity <
              closest.position.distanceTo(enemyTowerClosestToQueen.position)
            ) {
              return barracks;
            } else {
              return closest;
            }
          },
          giantBarracks[0]
        );
        console.log(`TRAIN ${giantBarracksClosestToEnemyTower.id}`);
      }
    };

    private trainNothing = (): void => {
      console.log("TRAIN");
    };

    private getUnitTypeNeeded = (): UnitTypeNeeded => {
      const unitTracker = UnitTracker.getInstance();
      const siteTracker = SiteTracker.getInstance();
      const gameState = GameState.getInstance();
      const enemyQueen = unitTracker.enemyQueen;
      const queenFriendlyKnightBarracksNearnessIndicator =
        enemyQueen.position.nearest(
          siteTracker.friendlyKnightBarracks.map(
            (barracks) => barracks.position
          )
        );
      if (!queenFriendlyKnightBarracksNearnessIndicator.isValid) {
        console.error("queenFriendlyKnightBarracksNearnessIndicator NOT VALID");
      }
      // if I have a barracks less than 400 units away from queen just train knights
      if (queenFriendlyKnightBarracksNearnessIndicator.distance < 400) {
        return "KNIGHT";
        // if they have more than 3 towers and I don't have enough giants
      } else if (
        siteTracker.hostileTowers.length > 3 &&
        unitTracker.friendlyGiants.length < 3
      ) {
        return "GIANT";
        // if they have a knight barracks and I don't have enough archers
      } else if (
        siteTracker.hostileKnightBarracks.length > 0 &&
        unitTracker.friendlyArchers.length < 1
      ) {
        return "ARCHER";
        // if they just have a lot of knights and I don't have enough archers
      } else if (
        unitTracker.hostileKnights.length > 8 &&
        unitTracker.friendlyArchers.length < 6
      ) {
        return "ARCHER";
        // if I don't need to save any money and don't have other necessities...
      } else if (!gameState.shouldSave) {
        return "KNIGHT";
      } else {
        return "NONE";
      }
    };
  }

  class UnitTracker {
    private static instance: UnitTracker;
    private units: Unit[] = [];

    static getInstance() {
      if (!UnitTracker.instance) {
        UnitTracker.instance = new UnitTracker();
      }
      return UnitTracker.instance;
    }

    getUnit(id: number) {
      return this.units.find((unit) => unit.id === id);
    }

    addUnit(unit: Unit) {
      this.units.push(unit);
    }

    resetUnits() {
      this.units = [];
    }

    get allUnits() {
      return this.units;
    }

    get friendlyUnits() {
      return this.units.filter((unit) => unit.isFriendly);
    }

    get hostileUnits() {
      return this.units.filter((unit) => unit.isHostile);
    }

    get hostileKnights() {
      return this.hostileUnits.filter((unit) => unit.unitType === "KNIGHT");
    }

    get hostileKnightPositions() {
      return this.hostileKnights.map((knight) => knight.position);
    }

    get friendlyKnights() {
      return this.friendlyUnits.filter((unit) => unit.unitType === "KNIGHT");
    }

    get hostileArchers() {
      return this.hostileUnits.filter((unit) => unit.unitType === "ARCHER");
    }

    get friendlyArchers() {
      return this.friendlyUnits.filter((unit) => unit.unitType === "ARCHER");
    }

    get hostileGiants() {
      return this.hostileUnits.filter((unit) => unit.unitType === "GIANT");
    }

    get friendlyGiants() {
      return this.friendlyUnits.filter((unit) => unit.unitType === "GIANT");
    }

    get enemyQueen(): Unit {
      const queen = this.hostileUnits.find((unit) => unit.unitType === "QUEEN");
      if (!queen) {
        throw new Error("No enemy queen found.");
      }
      return queen;
    }

    getUnitsByProximity(target: Position) {
      return this.units.sort((a, b) => {
        return a.position.distanceTo(target) - b.position.distanceTo(target);
      });
    }

    static getUnitsByProximityTo(target: Position, units: Unit[]) {
      return units.sort((a, b) => {
        return a.position.distanceTo(target) - b.position.distanceTo(target);
      });
    }
  }

  class SiteTracker {
    private static instance: SiteTracker;
    private sitesById: Record<number, Site> = {};

    static getInstance() {
      if (!SiteTracker.instance) {
        this.instance = new SiteTracker();
      }
      return SiteTracker.instance;
    }

    addSite = (site: Site) => {
      this.sitesById[site.id] = site;
    };

    setSite = (site: Site) => {
      this.sitesById[site.id] = site;
    };

    get allSites(): Site[] {
      return Object.values(this.sitesById);
    }

    getSite<T extends Site>(id: number) {
      return this.sitesById[id] as T;
    }

    get friendlySites() {
      return this.allSites.filter((site) => site.isFriendly);
    }

    get hostileSites() {
      return this.allSites.filter((site) => site.isHostile);
    }

    get unownedSites() {
      return this.allSites.filter((site) => site.isUnowned);
    }

    get hostileTowers() {
      return this.hostileSites.filter((site) => site.isTower);
    }

    get friendlyKnightBarracks() {
      return this.friendlySites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "KNIGHT"
      );
    }

    get friendlyKnightBarracksPositions() {
      return this.friendlyKnightBarracks.map((barracks) => barracks.position);
    }

    get hostileKnightBarracks() {
      return this.hostileSites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "KNIGHT"
      );
    }

    get friendlyArcherBarracks() {
      return this.friendlySites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "ARCHER"
      );
    }

    get hostileArcherBarracks() {
      return this.hostileSites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "ARCHER"
      );
    }

    get friendlyGiantBarracks() {
      return this.friendlySites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "GIANT"
      );
    }

    get hostileGiantBarracks() {
      return this.hostileSites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "GIANT"
      );
    }

    get unownedSafeBuildingSites() {
      const hostileTowers = this.hostileTowers;
      return this.unownedSites.filter((site) => {
        const isSafe = hostileTowers.every(
          (tower) =>
            tower.position.distanceTo(site.position) >
              tower.towerSpecs.range - 100 && !site.isHostile
        );
        return isSafe;
      });
    }

    get allSafeBuildingSites() {
      const hostileTowers = this.hostileTowers;
      return this.allSites.filter((site) => {
        const isSafe = hostileTowers.every(
          (tower) =>
            tower.position.distanceTo(site.position) <
            tower.towerSpecs.range - 100
        );
        return isSafe;
      });
    }

    static SitesByProximityTo(sites: Site[], position: Position) {
      return sites.sort((a, b) => {
        return (
          a.position.distanceTo(position) - b.position.distanceTo(position)
        );
      });
    }
  }

  // must be a singleton
  class GameState {
    private static instance: GameState;
    private gold = 0;
    shouldSave = true;
    neededBarracksType: BarracksType | "NONE" = "NONE";

    readonly targetSavings = 140;
    readonly minSavings = 20;

    static getInstance = () => {
      if (!GameState.instance) {
        GameState.instance = new GameState();
      }
      return GameState.instance;
    };

    updateGold = (gold: number) => {
      this.gold = gold;
      if (this.gold > this.targetSavings) {
        this.shouldSave = false;
      } else if (this.gold < this.minSavings) {
        this.shouldSave = true;
      }
    };

    createQueen = (
      id: number,
      owner: PlayerId,
      type: UnitTypeId,
      health: number,
      x: number,
      y: number,
      touchedSite: number
    ) => {
      Queen.createInstance(id, owner, type, health, x, y, touchedSite);
    };

    updateQueen = (
      touchedSite: number,
      health: number,
      x: number,
      y: number
    ) => {
      const queen = Queen.getInstance();
      queen.update({ touchedSite, health, position: new Position(x, y) });
    };

    addSite = (constructor: SiteConstructor) => {
      const tracker = SiteTracker.getInstance();
      tracker.addSite(new Site(constructor));
    };

    updateSite = (update: SiteUpdate) => {
      const tracker = SiteTracker.getInstance();
      const site = tracker.getSite(update.id);
      site.update(update);
      tracker.setSite(site); // is this even necessary?
    };

    resetUnits = () => {
      UnitTracker.getInstance().resetUnits();
    };

    addUnit = (
      id: number,
      owner: PlayerId,
      type: UnitTypeId,
      health: number,
      x: number,
      y: number,
      touchedSite: number
    ) => {
      if (type === -1 && owner === 0) {
        if (Queen.hasInstance()) {
          this.updateQueen(touchedSite, health, x, y);
        } else {
          this.createQueen(id, owner, type, health, x, y, touchedSite);
        }
      } else {
        UnitTracker.getInstance().addUnit(
          new Unit(id, owner, type, health, x, y)
        );
      }
    };
  }

  const gameState = GameState.getInstance();
  const numSites: number = parseInt(readline());
  for (let i = 0; i < numSites; i++) {
    var inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const x: number = parseInt(inputs[1]);
    const y: number = parseInt(inputs[2]);
    const radius: number = parseInt(inputs[3]);
    gameState.addSite({
      id: siteId,
      radius,
      x,
      y,
    });
  }
  // game loop
  while (true) {
    // read inputs
    var inputs: string[] = readline().split(" ");
    const gold: number = parseInt(inputs[0]);
    gameState.updateGold(gold);
    const touchedSite: number = parseInt(inputs[1]); // -1 if none
    for (let i = 0; i < numSites; i++) {
      var inputs: string[] = readline().split(" ");
      const siteId: number = parseInt(inputs[0]);
      const goldRemaining: number = parseInt(inputs[1]); // -1 if unknown
      const maxMineSize: number = parseInt(inputs[2]); // -1 if unknown
      const siteType = parseInt(inputs[3]) as SiteTypeId; // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
      const owner = parseInt(inputs[4]) as PlayerId; // -1 = No structure, 0 = Friendly, 1 = Enemy
      const param1: number = parseInt(inputs[5]);
      const param2: number = parseInt(inputs[6]);
      gameState.updateSite({
        id: siteId,
        goldRemaining,
        maxMineSize,
        siteType,
        owner,
        param1,
        param2,
      });
    }
    gameState.resetUnits(); // Unit info seems simple to just reset every turn
    const numUnits: number = parseInt(readline());
    for (let i = 0; i < numUnits; i++) {
      var inputs: string[] = readline().split(" ");
      const x: number = parseInt(inputs[0]);
      const y: number = parseInt(inputs[1]);
      const owner = parseInt(inputs[2]) as PlayerId;
      const unitType = parseInt(inputs[3]) as UnitTypeId; // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
      const health: number = parseInt(inputs[4]);
      gameState.addUnit(i, owner, unitType, health, x, y, touchedSite);
    }
    // To debug: console.error('Debug messages...'); // Write an action using console.log()

    // First line: A valid queen action
    // Second line: A set of training instructions
    QueenBrain.getInstance().think();
    Trainer.getInstance().train();
  }
}
