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

  interface Site {
    id: number;
    goldRemaining: number;
    maxMineSize: number;
    radius: number;
    owner: PlayerId;
    param1: number;
    param2: number;
    position: Position;
    structureType: SiteType;

    update: (update: SiteUpdate) => void;
    isNotOurs: () => boolean;
    isFriendly: () => boolean;
    isHostile: () => boolean;
    isUnowned: () => boolean;
  }

  interface SiteUpdate {
    id: number;
    goldRemaining: number;
    maxMineSize: number;
    structureTypeId: SiteTypeId;
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
  class BaseSite implements Site {
    id: number;
    goldRemaining: number = -1;
    maxMineSize: number = -1;
    radius: number;
    owner: PlayerId = -1;
    param1: number = -1;
    param2: number = -1;
    position: Position;

    private siteTypeMap: Record<SiteTypeId, SiteType> = {
      "-1": "UNKNOWN",
      "0": "MINE",
      "1": "TOWER",
      "2": "BARRACKS",
    };
    private _structureTypeId: SiteTypeId = -1;
    get structureType(): SiteType {
      return this.siteTypeMap[this._structureTypeId];
    }

    constructor({ id, radius, x, y }: SiteConstructor) {
      this.id = id;
      this.radius = radius;
      this.position = new Position(x, y);
    }

    update(update: SiteUpdate) {
      this.goldRemaining = update.goldRemaining;
      this.maxMineSize = update.maxMineSize;
      this._structureTypeId = update.structureTypeId;
      this.owner = update.owner;
      this.param1 = update.param1;
      this.param2 = update.param2;
    }

    isNotOurs = () => {
      return this.owner !== 0;
    };

    isFriendly = () => {
      return this.owner === 0;
    };

    isHostile = () => {
      return this.owner === 1;
    };

    isUnowned = () => {
      return this.owner === -1;
    };
  }

  type BarracksType = "KNIGHT" | "ARCHER" | "GIANT";
  class Barracks extends BaseSite implements Site {
    private barracksTypeMap: Record<number, BarracksType> = {
      "0": "KNIGHT",
      "1": "ARCHER",
      "2": "GIANT",
    };
    get barracksType(): BarracksType {
      return this.barracksTypeMap[this.param2];
    }
    get turnsUntilCanTrain(): number {
      return this.param1;
    }

    constructor(constructor: SiteConstructor) {
      super(constructor);
    }
  }

  class Tower extends BaseSite implements Site {
    get hp(): number {
      return this.param1;
    }

    // I think if we know the max of this, we can fix isMaxedOut.
    get range(): number {
      return this.param2;
    }

    // No idea if this is right but it kinda works.
    get isMaxedOut(): boolean {
      return this.param1 >= this.param2;
    }

    constructor(constructor: SiteConstructor) {
      super(constructor);
    }
  }

  class GoldMine extends BaseSite implements Site {
    get incomeRate(): number {
      return this.param1;
    }

    get isMaxedOut(): boolean {
      return this.param1 >= this.maxMineSize;
    }

    constructor(constructor: SiteConstructor) {
      super(constructor);
    }
  }

  class QueenSenses {
    queen: Queen;
    unitTracker: UnitTracker;
    siteTracker: SiteTracker;

    constructor(
      queen: Queen,
      unitTracker: UnitTracker,
      siteTracker: SiteTracker
    ) {
      this.queen = queen;
      this.unitTracker = unitTracker;
      this.siteTracker = siteTracker;
    }

    nextTargetBuildingSite = (): Site | null => {
      // May want to extend the logic to decide whether to expand to all save sites or just stop building
      let possibleSites = this.siteTracker.unownedSafeBuildingSites;
      if (possibleSites.length === 0) {
        possibleSites = this.siteTracker.allSafeBuildingSites;
      }
      if (possibleSites.length === 0) {
        return null;
      }

      let NearnessIndicator = this.queen.position.nearest(
        possibleSites.map((site) => site.position)
      );

      return possibleSites[NearnessIndicator.index];
    };

    isThreatenedByKnights = (
      proximityThreshold: number,
      attackerCountThreshold: number,
      shouldScale: boolean
    ): boolean => {
      const queenHealthFraction = this.queen.health / this.queen.maxHealth;
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
      const nearbyKnights = this.unitTracker.hostileKnights.filter(
        (knight) =>
          knight.position.distanceTo(this.queen.position) <
          scaledProximityThreshold
      );
      return nearbyKnights.length > scaledAttackerCountThreshold;
    };

    awayFromKnightHorde = (proximityThreshold: number): Line => {
      const averagePosition = Position.average(
        this.unitTracker.hostileKnights
          .filter(
            (knight) =>
              knight.position.distanceTo(this.queen.position) <
              proximityThreshold
          )
          .map((knight) => knight.position)
      );
      // Should vary inversely with proximityThreshold
      // Need to figure out what the range of plausible ProximityThresholds is first.
      const lineExtensionMultiplier = 4;
      const directionTo = new Line(this.queen.position, averagePosition);
      const directionAway = directionTo.oppositeLine();
      const extendedDirectionAway = directionAway.extendedLine(
        lineExtensionMultiplier
      );
      return extendedDirectionAway;
    };
  }

  // class QueenBrain {
  //   queen: Queen;
  //   strategy: Strategy;

  //   constructor(queen: Queen) {
  //     this.queen = queen;
  //     this.strategy = new ExploreStrategy();
  //   }

  //   think = (): void => {
  //     this.strategy = this.strategy.nextStrategy(args);

  //     this.strategy.execute(state);
  //   };
  // }

  // interface Strategy {
  //   execute: (state: GameState) => void;
  //   nextStrategy: (state: GameState) => Strategy;
  // }

  // class ExploreStrategy implements Strategy {

  //   constructor(private queen: Queen) {}

  //   nextStrategy = (state: GameState): Strategy => {
  //     const { queen } = this;
  //     const { unitTracker, siteTracker } = state;
  //     const { nextTargetBuildingSite } = queen.senses;

  //     const targetSite = nextTargetBuildingSite();
  //     if (targetSite) {
  //       return new BuildStrategy(queen, targetSite);
  //     }

  //     return this;
  //   }
  // }

  // class SiteCaptureStrategy implements Strategy {}

  interface QueenUpdate {
    touchedSite: number;
    location?: Position;
    health?: number;
  }

  class Queen extends Unit {
    touchedSite: number = -1;
    // senses: QueenSenses;
    // brain: QueenBrain;
    // state: GameState;

    constructor(
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

    update(update: QueenUpdate) {
      this.touchedSite = update.touchedSite;
      if (update.location) {
        this.position = update.location;
      }
      if (update.health) {
        this.health = update.health;
      }
    }

    takeTurn = () => {};

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

    // touchedSite: Site = () => {
    //   return this.touchedSite;
    // }
  }

  type UnitTypeNeeded = "KNIGHT" | "ARCHER" | "GIANT" | "NONE";
  class Trainer {
    constructor() {}
  }

  class UnitTracker {
    // I'm questioning whether this should just always be kept as an array
    unitsById: Record<number, Unit> = {};

    constructor(units: Unit[]) {
      units.forEach((unit) => {
        this.unitsById[unit.id] = unit;
      });
    }

    get units(): Unit[] {
      return Object.values(this.unitsById);
    }

    getUnit<T extends Unit>(id: number) {
      return this.unitsById[id] as T;
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

  type StructureType = Site | Barracks | Tower | GoldMine;
  class SiteTracker {
    private sitesById: Record<number, StructureType> = {};

    constructor() {}

    addSite = (site: StructureType) => {
      this.sitesById[site.id] = site;
    };

    setSite = (site: StructureType) => {};

    get sites(): StructureType[] {
      return Object.values(this.sitesById);
    }

    getSite<T extends StructureType>(id: number) {
      return this.sitesById[id] as T;
    }

    get friendlySites() {
      return this.sites.filter((site) => site.isFriendly());
    }

    get hostileSites() {
      return this.sites.filter((site) => site.isHostile());
    }

    get unownedSites() {
      return this.sites.filter((site) => site.isUnowned());
    }

    get hostileTowers() {
      return this.hostileSites.filter(
        (site) => site.structureType === "TOWER"
      ) as Tower[];
    }

    get friendlyKnightBarracks() {
      return this.friendlySites.filter(
        (site) =>
          site.structureType === "BARRACKS" &&
          (site as Barracks).barracksType === "KNIGHT"
      ) as Barracks[];
    }

    get friendlyArcherBarracks() {
      return this.friendlySites.filter(
        (site) =>
          site.structureType === "BARRACKS" &&
          (site as Barracks).barracksType === "ARCHER"
      ) as Barracks[];
    }

    get friendlyGiantBarracks() {
      return this.friendlySites.filter(
        (site) =>
          site.structureType === "BARRACKS" &&
          (site as Barracks).barracksType === "GIANT"
      ) as Barracks[];
    }

    get unownedSafeBuildingSites() {
      const hostileTowers = this.hostileTowers;
      return this.unownedSites.filter((site) => {
        const isSafe = hostileTowers.every(
          (tower) => tower.position.distanceTo(site.position) > tower.range
        );
        return isSafe;
      });
    }

    get allSafeBuildingSites() {
      const hostileTowers = this.hostileTowers;
      return this.sites.filter((site) => {
        const isSafe = hostileTowers.every(
          (tower) => tower.position.distanceTo(site.position) > tower.range
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
  class GameState {
    gold = 0;
    shouldSave = true;
    neededBarracksType: BarracksType | "NONE" = "NONE";

    readonly targetSavings = 140;
    readonly minSavings = 20;

    siteTracker: SiteTracker;
    unitTracker: UnitTracker;

    constructor(siteTracker: SiteTracker) {
      this.siteTracker = siteTracker;
      this.unitTracker = new UnitTracker([]);
    }

    addSite = (constructor: SiteConstructor) => {
      this.siteTracker.addSite(new BaseSite(constructor));
    };

    updateSite = (updates: SiteUpdate) => {
      let site = this.siteTracker.getSite(updates.id);
      site.update(updates);
      switch (updates.structureTypeId) {
        case -1:
          site = site as BaseSite;
          break;
        case 0:
          site = site as GoldMine;
          break;
        case 1:
          site = site as Tower;
          break;
        case 2:
          site = site as Barracks;
          break;
        default:
          break;
      }
      this.siteTracker.setSite(site);
    };

    resetUnits = () => {
      // maybe belongs in UnitTracker
      this.unitTracker.unitsById = {};
    };

    addUnit = (
      id: number,
      owner: PlayerId,
      type: UnitType,
      health: number,
      x: number,
      y: number
    ) => {
      this.unitTracker.;
    };
  }

  const siteTracker = new SiteTracker();
  const gameState = new GameState(siteTracker);
  const numSites: number = parseInt(readline());
  for (let i = 0; i < numSites; i++) {
    var inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const x: number = parseInt(inputs[1]);
    const y: number = parseInt(inputs[2]);
    const radius: number = parseInt(inputs[3]);
  }
  // game loop
  while (true) {
    gameState.resetUnits();
    // read inputs
    var inputs: string[] = readline().split(" ");
    const gold: number = parseInt(inputs[0]);
    const touchedSite: number = parseInt(inputs[1]); // -1 if none
    for (let i = 0; i < numSites; i++) {
      var inputs: string[] = readline().split(" ");
      const siteId: number = parseInt(inputs[0]);
      const goldRemaining: number = parseInt(inputs[1]); // -1 if unknown
      const maxMineSize: number = parseInt(inputs[2]); // -1 if unknown
      const structureType: number = parseInt(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
      const owner: number = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
      const param1: number = parseInt(inputs[5]);
      const param2: number = parseInt(inputs[6]);
    }
    const numUnits: number = parseInt(readline());
    for (let i = 0; i < numUnits; i++) {
      var inputs: string[] = readline().split(" ");
      const x: number = parseInt(inputs[0]);
      const y: number = parseInt(inputs[1]);
      const owner = parseInt(inputs[2]) as PlayerId;
      const unitType = parseInt(inputs[3]) as UnitType; // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
      const health: number = parseInt(inputs[4]);
      gameState.addUnit(i, owner, unitType, health, x, y);
    }
    // To debug: console.error('Debug messages...'); // Write an action using console.log()

    // First line: A valid queen action
    // Second line: A set of training instructions
    console.log("WAIT");
    console.log("TRAIN");
  }
}
