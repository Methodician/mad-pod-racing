namespace CodeRoyale2 {
  // general vars
  class GameState {
    gold = 0;
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

    get allSites() {
      return Object.values(this.sites);
    }

    getSite(id: number) {
      return this.sites[id];
    }
  }

  class Location {
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
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
    towerSpecs: {
      hp: number;
      range: number;
      isMaxedOut: boolean;
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

    constructor(id: number, x: number, y: number) {
      this.id = id;
      this.location = new Location(x, y);
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

    get towerSpecs() {
      return {
        hp: this.param1,
        range: this.param2,
        isMaxedOut: this.param1 >= this.param2, // TODO: check if this is correct
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
    // queen = Queen.getInstance();

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

    isThreatenedByKnights = (
      proximityMin = 150,
      proximityMax = 700,
      countMin = 2,
      countMax = 15
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

    move = (x: number, y: number) => {
      console.log(`MOVE ${x} ${y}`);
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
    // nextStrategy: () => Strategy;
  }

  class ExploreStrategy implements Strategy {
    queenStep = () => {
      const structureType = this.structureTypeToBuild();
      if (queen.touchedSiteId !== -1 && structureType !== "NONE") {
        queen.build(queen.touchedSiteId, structureType);
      } else {
        const unownedSiteNearestToStart = Object.values(gameState.sites)
          .filter((site) => site.ownerId === -1)
          .sort(
            (a, b) =>
              a.location.distanceTo(gameState.startLocation) -
              b.location.distanceTo(gameState.startLocation)
          )[0];
        const { x, y } = unownedSiteNearestToStart.location;
        queen.move(x, y);
      }
    };

    trainStep = () => {
      const trainer = Trainer.getInstance();
      trainer.wait();
    };

    structureTypeToBuild = (): StructureType => {
      if (queen.touchedSiteId === -1) {
        return "NONE";
      }

      const site = gameState.sites[queen.touchedSiteId];
      console.error(`site: ${JSON.stringify(site, null, 2)}`);
      if (site.structureType === "TOWER" && site.ownerId === 1) {
        return "NONE";
      }
      if (
        site.structureType === "TOWER" &&
        site.ownerId === 0 &&
        !site.towerSpecs.isMaxedOut
      ) {
        return "TOWER";
      }
      if (site.structureType === "MINE" && !site.mineSpecs.isMaxedOut) {
        return "MINE";
      }
      const queenSenses = new QueenSenses();
      if (
        queenSenses.isThreatenedByKnights() &&
        site.structureType === "NONE"
      ) {
        return "TOWER";
      }

      if (site.structureType === "NONE") {
        if (
          site.location.nearest(
            gameState.units
              .filter(
                (unit) => unit.unitType === "KNIGHT" && unit.ownerId === 1
              )
              .map((unit) => unit.location)
          ).distance < 300
        ) {
          return "TOWER";
        } else {
          return "MINE";
        }
      }

      return "NONE";
    };
  }
  const queen = Queen.getInstance();
  const gameState = GameState.getInstance();
  const numSites: number = parseInt(readline());

  for (let i = 0; i < numSites; i++) {
    var inputs: string[] = readline().split(" ");
    const siteId: number = parseInt(inputs[0]);
    const x: number = parseInt(inputs[1]);
    const y: number = parseInt(inputs[2]);
    const radius: number = parseInt(inputs[3]);
    gameState.sites[siteId] = new Site(siteId, x, y);
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

    const strategy = new ExploreStrategy();
    strategy.queenStep();
    strategy.trainStep();
  }
}
