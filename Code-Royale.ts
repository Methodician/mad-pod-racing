namespace CodeRoyale {
  type NearnessIndicator = {
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
  type UnitType = -1 | 0 | 1 | 2;
  // type UnitRadius = 30 | 20 | 25 | 40;
  // type UnitSpeed = 60 | 100 | 75 | 50;
  class Unit {
    id: number;
    ownerId: PlayerId;
    type: UnitType;
    health: number;
    position: Position;

    // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    get unitType(): string {
      switch (this.type) {
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
      switch (this.type) {
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
      switch (this.type) {
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
      switch (this.type) {
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
      type: UnitType,
      health: number,
      x: number,
      y: number
    ) {
      this.id = id;
      this.ownerId = owner;
      this.type = type;
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
    siteType: SiteTypeId | SiteType;
    owner: PlayerId;
    param1: number;
    param2: number;
  }
  interface SiteConstructor {
    constructor: {
      id: number;
      radius: number;
      x: number;
      y: number;
    };
    site?: Site;
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
    siteType: SiteType = "UNKNOWN";

    constructor(siteConstructor: SiteConstructor) {
      const { id, radius, x, y } = siteConstructor.constructor;
      this.id = id;
      this.radius = radius;
      this.position = new Position(x, y);
      if (siteConstructor.site) {
        const {
          id,
          goldRemaining,
          maxMineSize,
          siteType,
          owner,
          param1,
          param2,
        } = siteConstructor.site;
        const update: SiteUpdate = {
          id,
          goldRemaining,
          maxMineSize,
          siteType,
          owner,
          param1,
          param2,
        };
        this.update(update);
      }
    }

    update(update: SiteUpdate) {
      if (typeof update.siteType === "number") {
        switch (update.siteType) {
          case -1:
            this.siteType = "UNKNOWN";
            break;
          case 0:
            this.siteType = "MINE";
            break;
          case 1:
            this.siteType = "TOWER";
            break;
          case 2:
            this.siteType = "BARRACKS";
            break;
          default:
            this.siteType = "UNKNOWN";
            break;
        }
      } else {
        this.siteType = update.siteType;
      }
      this.goldRemaining = update.goldRemaining;
      this.maxMineSize = update.maxMineSize;
      this.owner = update.owner;
      this.param1 = update.param1;
      this.param2 = update.param2;
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
    private static instance: QueenSenses;

    private constructor() {}

    static getInstance = (): QueenSenses => {
      if (!QueenSenses.instance) {
        QueenSenses.instance = new QueenSenses();
      }
      return QueenSenses.instance;
    };

    nextTargetBuildingSite = (): Site | null => {
      const siteTracker = SiteTracker.getInstance();
      // May want to extend the logic to decide whether to expand to all save sites or just stop building
      let possibleSites = siteTracker.unownedSafeBuildingSites;
      if (possibleSites.length === 0) {
        possibleSites = siteTracker.allSafeBuildingSites;
      }
      if (possibleSites.length === 0) {
        console.error("NO POSSIBLE BUILDING SITES - THAT SEEMS WEIRD");
        return null;
      }

      const queen = Queen.getInstance();
      let NearnessIndicator = queen.position.nearest(
        possibleSites.map((site) => site.position)
      );

      return possibleSites[NearnessIndicator.index];
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
    private static instance: QueenBrain;
    private strategy: Strategy = new ExploreStrategy();

    private constructor() {}

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
    constructor() {}

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
    site.isGoldMine && site.isFriendly && site.goldMineSpecs.isMaxedOut;

  class SiteCaptureStrategy implements Strategy {
    nextStrategy = (): Strategy => {
      const touchedSite = SiteTracker.getInstance().getSite(
        Queen.getInstance().touchedSite
      );

      if (shouldExpandTower(touchedSite)) {
        return new TowerExpansionStrategy();
      }
      return new ExploreStrategy();
    };

    execute = (): void => {
      console.error("Capturing");
      const queen = Queen.getInstance();
      const site = SiteTracker.getInstance().getSite(queen.touchedSite);
      if (site.isFriendly) {
        queen.wait();
      } else {
        queen.buildTower(queen.touchedSite);
      }
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
      }
      return new ExploreStrategy();
    };

    execute = (): void => {
      console.error("Expanding");
      const queen = Queen.getInstance();
      const touchedSite = SiteTracker.getInstance().getSite(queen.touchedSite);
      if (shouldExpandTower(touchedSite)) {
        queen.buildTower(queen.touchedSite);
      } else {
        approachNearbyBuildingSite();
      }
    };
  }

  interface QueenUpdate {
    touchedSite: number;
    position?: Position;
    health?: number;
  }

  class Queen extends Unit {
    private static instance: Queen;
    touchedSite: number = -1;

    private constructor(
      id: number,
      owner: PlayerId,
      type: UnitType,
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
      type: UnitType,
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
      if (update.position) {
        this.position = update.position;
      }
      if (update.health) {
        this.health = update.health;
      }
    }

    takeTurn = () => {
      throw new Error("Method not implemented.");
    };

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

    buildMine = (siteId: number) => {
      console.log(`BUILD ${siteId} MINE`);
    };

    buildTower = (siteId: number) => {
      console.log(`BUILD ${siteId} TOWER`);
    };

    buildBarracks = (siteId: number, type: BarracksType) => {
      console.log(`BUILD ${siteId} BARRACKS-${type}`);
    };

    isTouchingAnySite = () => {
      return this.touchedSite !== -1;
    };

    // may be superfluous
    isTouchingSite = (siteId: number) => {
      return this.touchedSite === siteId;
    };
  }

  type UnitTypeNeeded = "KNIGHT" | "ARCHER" | "GIANT" | "NONE";
  class Trainer {
    private constructor() {
      throw new Error("Trainer is not implemented");
    }
  }

  class UnitTracker {
    private static instance: UnitTracker;
    private units: Unit[] = [];

    private constructor() {}

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

    private constructor() {}

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

    get friendlyArcherBarracks() {
      return this.friendlySites.filter(
        (site) => site.isBarracks && site.barracksSpecs.type === "ARCHER"
      );
    }

    get friendlyGiantBarracks() {
      return this.friendlySites.filter(
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
    gold = 0;
    shouldSave = true;
    neededBarracksType: BarracksType | "NONE" = "NONE";

    readonly targetSavings = 140;
    readonly minSavings = 20;

    private constructor() {}

    static getInstance = () => {
      if (!GameState.instance) {
        GameState.instance = new GameState();
      }
      return GameState.instance;
    };

    createQueen = (
      id: number,
      owner: PlayerId,
      type: UnitType,
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
      type: UnitType,
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
      constructor: {
        id: siteId,
        radius,
        x,
        y,
      },
    });
  }
  // game loop
  while (true) {
    // read inputs
    var inputs: string[] = readline().split(" ");
    const gold: number = parseInt(inputs[0]);
    gameState.gold = gold;
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
      const unitType = parseInt(inputs[3]) as UnitType; // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
      const health: number = parseInt(inputs[4]);
      gameState.addUnit(i, owner, unitType, health, x, y, touchedSite);
    }
    // To debug: console.error('Debug messages...'); // Write an action using console.log()

    // First line: A valid queen action
    // Second line: A set of training instructions
    QueenBrain.getInstance().think();
    console.log("TRAIN");
  }
}
