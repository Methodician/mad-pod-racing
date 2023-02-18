using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;

class Ray {
    public int X1 {get; private set;}
    public int Y1 {get; private set;}
    public int X2 {get; private set;}
    public int Y2 {get; private set;}
    public Location A {
        get {
            return new Location(X1, Y1);
        }
    }
    public Location B {
        get {
            return new Location(X2, Y2);
        }
    }

    public Ray (int x1, int y1, int x2, int y2) {
        this.X1 = x1;
        this.Y1 = y1;
        this.X2 = x2;
        this.Y2 = y2;
    }

    public Ray(Location c1, Location c2) {
        this.X1 = c1.X;
        this.Y1 = c1.Y;
        this.X2 = c2.X;
        this.Y2 = c2.Y;
    }

    public string Loggable() => $"a: [{X1}|{Y1}], b: [{X2}|{Y2}]";

    public void Iterate(int x, int y) {
        X1 = X2;
        Y1 = Y2;
        X2 = x;
        Y2 = y;
    }
    
    public void Iterate(Location next) {
        X1 = X2;
        Y1 = Y2;
        X2 = next.X;
        Y2 = next.Y;
    }

    public Ray Rotated(double angle) {
        double cos = Math.Cos(angle);
        double sin = Math.Sin(angle);

        int x = (int)(cos * (X2 - X1) - sin * (Y2 - Y1) + X1);
        int y = (int)(sin * (X2 - X1) + cos * (Y2 - Y1) + Y1);

        return new Ray(X1, Y1, x, y);
    }

    public Ray Reversed() {
        return new Ray(X2, Y2, X1, Y1);
    }

    public double AngleBetween(Ray other) {
        // Copilot suggested this version. Works as good as other, but there is a tiny margin of error between them.
        double dot = (X2 - X1) * (other.X2 - other.X1) + (Y2 - Y1) * (other.Y2 - other.Y1);
        double det = (X2 - X1) * (other.Y2 - other.Y1) - (Y2 - Y1) * (other.X2 - other.X1);
        return Math.Atan2(det, dot);
    }
}

class Location {
    public int X {get; }
    public int Y {get; }

    public Location(int x, int y) {
        X = x;
        Y = y;
    }

    public Location(Location other) {
        X = other.X;
        Y = other.Y;
    }

    public double Proximity(Location other) {
        int deltaX = X - other.X;
        int deltaY = Y - other.Y;
        return Math.Sqrt(deltaX * deltaX + deltaY * deltaY);       
    }

    public Location Midpoint(Location other) {
        int x = (X + other.X) / 2;
        int y = (Y + other.Y) / 2;
        return new Location(x, y);
    }

    public List<Location> SortedByProximity(List<Location> others) {
        return others.OrderBy(o => Proximity(o)).ToList();
    }
}

class Unit {
    public int Id { get; set; }
    public int Owner { get; set; }
    public Location Location { get; set; }
    public int Type { get; set; }
    public int Health { get; set; }

    public Unit(int id, int owner, Location location, int type, int health) {
        Id = id;
        Owner = owner;
        Location = location;
        Type = type;
        Health = health;
    }
}

class QueenUpdate {
    public Location location { get; set; }
    public int health { get; set; }
    public int touchedSite { get; set; }

    public QueenUpdate(Location location, int health, int touchedSite) {
        this.location = location;
        this.health = health;
        this.touchedSite = touchedSite;
    }
}

class Queen : Unit {
    public int TouchedSite;
    private QueenBrain brain;

    public Queen(int id, int owner, Location location, int type, int health)
        : base(id, owner, location, type, health) {
            this.TouchedSite = -1;
            brain = new QueenBrain(this);
    }

    public void TakeTurn(GameState state) {
        brain.Think(state);
    }

    public void Update(QueenUpdate update, GameState state) {
        Location = update.location;
        Health = update.health;
        TouchedSite = update.touchedSite;
    }

    public void Move(Location target) {
        Console.WriteLine($"MOVE {target.X} {target.Y}");
    }
    
    public void BuildMine(int siteId) {
        Console.WriteLine($"BUILD {siteId} MINE");
    }

    public void BuildTower(int siteId) {
        Console.WriteLine($"BUILD {siteId} TOWER");
    }

    public void BuildBarracks(int siteId, string barracksType) {
        Console.WriteLine($"BUILD {siteId} BARRACKS-{barracksType}");
    }


    public void Wait() {
        Console.WriteLine("WAIT");
    }

    public bool IsTouchingSite() {
        return TouchedSite != -1;
    }

    public Site GetTouchedSite(SiteTracker tracker) {
        if (IsTouchingSite()) {
            return tracker.Get(TouchedSite);
        } else {
            return null;
        }
    }
}

class QueenBrain {
    private Queen queen;
    private GameState state;
    private int attackerProximityThreshold = 600;

    public QueenBrain(Queen queen) {
        this.queen = queen;
        this.state = new GameState();
    }

    public void Think(GameState state) {
        this.state = state;

        if(queen.IsNearEnemyTower()) {
            Console.Error.WriteLine("I'm near enemy tower!");
            var enemyTowerDirection = queen.GetDirectionToNearestEnemyTower();
            var awayFromTower = enemyTowerDirection.Reversed();
            queen.Move(awayFromTower.B);
        } else if (queen.IsTouchingSite()) {
            var touchedSite = queen.GetTouchedSite(state.SiteTracker);

            if (IsUnderAttack()) {
                Console.Error.WriteLine("I'm under ATTACK!");
            }

            // Expand if queen just built a tower or mine
            if(touchedSite.IsTower() & touchedSite.IsFriendly() & touchedSite.Param1 < touchedSite.Param2) {
                Console.Error.WriteLine("expanding tower");
                // expand the tower
                queen.BuildTower(touchedSite.Id);
            } else if (touchedSite.IsGoldMine() & touchedSite.IsFriendly() & touchedSite.Param1 < touchedSite.MaxMineSize & touchedSite.GoldRemaining > 80) {
                // expand the mine
                Console.Error.WriteLine("expanding mine");
                queen.BuildMine(touchedSite.Id);
            } else {
                if (IsUnderAttack() & !touchedSite.IsTower()) {
                    // Build tower if in danger
                    Console.Error.WriteLine("building tower");
                    queen.BuildTower(touchedSite.Id);
                } else if (!state.ShouldSave & state.SiteTracker.OwnedBarracks().Count() < 1) {
                    // Build barracks if we need one
                    queen.BuildBarracks(touchedSite.Id, "KNIGHT");
                } else if (!IsUnderAttack() & !touchedSite.IsFriendly() & !touchedSite.IsGoldMine()) {
                    // Build mine if nothing better to do
                    Console.Error.WriteLine("building mine");
                    queen.BuildMine(touchedSite.Id);
                } else {
                    // Get a move on if we're not doing anything
                    queen.Move(NearestSafeBuildSite().Location);
                }
            }
        } else {
            // if the queen is not near a building site, move to it
            var nearestSite = NearestSafeBuildSite();
            if (nearestSite != null) {
                queen.Move(nearestSite.Location);
            } else {
                queen.Wait();
            }
        }


        // if the queen is under attack, build towers

        // if we have enough savings but don't have a barracks, build a barracks

        // if the queen is not under attack, build mines
    }

    private Site NearestSafeBuildSite() {
        var safeSites = state.SiteTracker.SafeBuildSites();
        var sortedSites = SiteTracker.SitesByProximityTo(safeSites, queen.Location);
        return sortedSites.FirstOrDefault();
    }

    private Site NearestSite() {
        var sortedSites = state.SiteTracker.SitesByProximity(queen.Location);
        return sortedSites.FirstOrDefault();
    }

    private List<Unit> FriendlyUnits() {
        var friendlyUnits = state.UnitTracker.FriendlyUnits();
        return friendlyUnits;
    }

    private List<Unit> EnemyUnits() {
        var enemyUnits = state.UnitTracker.EnemyUnits();
        return enemyUnits;
    }

    private bool IsUnderAttack() {
        var enemyUnits = EnemyUnits();
        var sortedUnits = UnitTracker.UnitsByProximityTo(enemyUnits, queen.Location);
        return queen.Location.Proximity(sortedUnits[0].Location) < attackerProximityThreshold;
    }

    public Site NearestEnemyTower() {
        var enemyTowers = state.SiteTracker.EnemyTowers();
        var sortedTowers = SiteTracker.SitesByProximityTo(enemyTowers, queen.Location);
        return sortedTowers.FirstOrDefault();
    }

    public Ray GetRayToNearestEnemyTower() {
        var enemyTower = NearestEnemyTower();
        if (enemyTower != null) {
            return new Ray(queen.Location, enemyTower.Location);
        } else {
            return null;
        }
    }

    private bool IsNearEnemyTower() {
        var enemyTowers = state.SiteTracker.EnemyTowers();
        var sortedTowers = SiteTracker.SitesByProximityTo(enemyTowers, queen.Location);
        var nearbyTowers = sortedTowers.Where(t => t.Location.Proximity(queen.Location) < 200).ToList();

        Console.Error.WriteLine($"Queen is near {nearbyTowers.Count()} enemy towers.");

        foreach (Site t in nearbyTowers) {
            Console.Error.WriteLine($"Tower at {t.Location.X}, {t.Location.Y} is {t.Location.Proximity(queen.Location)} units away");
        }

        return sortedTowers.Count() > 0;
    }

    private bool IsQueenInDanger() {
        // Check if there are enemy units nearby
        var nearbyEnemies = state.UnitTracker.UnitsByProximity(queen.Location)
            .Where(u => u.Owner != queen.Owner)
            .Where(u => u.Type != -1)  // exclude the queen
            .Take(3);
        if (nearbyEnemies.Any()) {
            return true;
        }

        // Check if there are any enemy towers nearby
        var enemyTowers = state.SiteTracker.SitesOwnedBy(1)
            .Where(s => s.StructureType == 1)
            .Where(s => s.Location.Proximity(queen.Location) > 500);
        if (enemyTowers.Any()) {
            return true;
        }

        return false;
    }
}

// Interesting response from ChatGPT to "That's awesome. Now let's implement the brain"
// class QueenBrain {
//     private readonly Queen Queen;
//     private readonly SiteTracker SiteTracker;
//     private readonly UnitTracker UnitTracker;

//     public QueenBrain(Queen queen, SiteTracker siteTracker, UnitTracker unitTracker) {
//         Queen = queen;
//         SiteTracker = siteTracker;
//         UnitTracker = unitTracker;
//     }

//     public void Think() {
//         // Check if the queen is in danger
//         if (IsQueenInDanger()) {
//             // If in danger, look for a safe place to move to
//             MoveToSafety();
//         }
//         else {
//             // If not in danger, try to collect resources and build structures
//             CollectResourcesAndBuildStructures();
//         }
//     }

//     private bool IsQueenInDanger() {
//         // Check if there are enemy units nearby
//         var nearbyEnemies = UnitTracker.UnitsByProximity(Queen.Location)
//             .Where(u => u.Owner != Queen.Owner)
//             .Where(u => u.Type != -1)  // exclude the queen
//             .Take(3);
//         if (nearbyEnemies.Any()) {
//             return true;
//         }

//         // Check if there are any enemy towers nearby
//         var enemyTowers = SiteTracker.SitesOwnedBy(1)
//             .Where(s => s.StructureType == 1)
//             .Where(s => s.Location.Proximity(Queen.Location) < 2000);
//         if (enemyTowers.Any()) {
//             return true;
//         }

//         return false;
//     }

//     private void MoveToSafety() {
//         // Find the closest safe site and move to it
//         var safeSites = SiteTracker.SafeBuildSites();
//         var sortedSites = SiteTracker.SitesByProximity(safeSites, Queen.Location);
//         var closestSafeSite = sortedSites.FirstOrDefault();
//         if (closestSafeSite != null) {
//             Queen.Move(closestSafeSite.Location);
//         }
//         else {
//             Queen.Wait();
//         }
//     }

//     private void CollectResourcesAndBuildStructures() {
//         var goldSites = SiteTracker.SitesWithGold();
//         var sortedGoldSites = SiteTracker.SitesByProximity(goldSites, Queen.Location);

//         if (Queen.TouchedSite != -1) {
//             // If the queen is on a site, check if it needs to be mined or if a structure needs to be built
//             var site = SiteTracker.Get(Queen.TouchedSite);
//             if (site.StructureType == -1) {
//                 Queen.Build(0, site.Location);
//             }
//             else if (site.StructureType == 0) {
//                 if (site.GoldRemaining > 0) {
//                     Queen.Build(0, site.Location);
//                 }
//                 else {
//                     var sortedSafeSites = SiteTracker.SitesByProximity(SiteTracker.SafeBuildSites(), Queen.Location);
//                     var safeSite = sortedSafeSites.FirstOrDefault();
//                     if (safeSite != null) {
//                         Queen.Build(1, safeSite.Location);
//                     }
//                     else {
//                         Queen.Wait();
//                     }
//                 }
//             }
//         }
//         else {
//             // If the queen is not on a site, move to the closest gold site and mine it
//             var closestGoldSite = sortedGoldSites.FirstOrDefault();
//             if (closestGoldSite != null) {
//                 Queen.Move(closestGoldSite.Location);
//             }
//             else {
//                 Queen.Wait();
//             }
//         }
//     }
// }


class SiteUpdate {
    public int id {get; set;}
    public int goldRemaining {get; set;}
    public int maxMineSize {get; set;}
    public int structureType {get; set;}
    public int owner {get; set;}
    public int param1 {get; set;}
    public int param2 {get; set;}
}

class Site {
    public int Id { get; }
    public Location Location { get; }
    public int Radius { get; }
    public int GoldRemaining { get; private set; }
    public int MaxMineSize { get; private set; }
    public int StructureType { get; private set; }
    public int Owner { get; private set; }
    public int Param1 { get; private set; }
    public int Param2 { get; private set; }

    public Site(int id, Location location, int radius) {
        Id = id;
        Location = location;
        Radius = radius;
    }

    public void Update(SiteUpdate update) {
        GoldRemaining = update.goldRemaining;
        MaxMineSize = update.maxMineSize;
        StructureType = update.structureType;
        Owner = update.owner;
        Param1 = update.param1;
        Param2 = update.param2;
    }
    
    public bool IsNotOurs() {
        return Owner != 0;
    }

    public bool IsFriendly() {
        return Owner == 0;
    }

    public bool IsHostile() {
        return Owner == 1;
    }

    public bool IsEmpty() {
        return StructureType == -1;
    }

    public bool IsGoldMine() {
        return StructureType == 0;
    }

    public bool IsTower() {
        return StructureType == 1;
    }

    public bool isBarracks() {
        return StructureType == 2;
    }
}

class SiteTracker {
    private Dictionary<int, Site> Sites;

    public SiteTracker() {
        Sites = new Dictionary<int, Site>();
    }

    public Site Get(int id) {
        return Sites[id];
    }

    public void Add(Site site) {
        Sites.Add(site.Id, site);
    }

    public void Update(SiteUpdate update) {
        Sites[update.id].Update(update);
    }

    public void Update(List<SiteUpdate> updates) {
        foreach (var update in updates) {
            Update(update);
        }
    }

    public List<Site> AllSites() {
        return Sites.Values.ToList();
    }
    
    public List<Site> SitesByProximity(Location location) {
        return SitesByProximityTo(AllSites(), location);
    }

    public List<Site> FriendlySites() {
        return Sites.Values.Where(s => s.IsFriendly()).ToList();
    }

    public List<Site> HostileSites() {
        return Sites.Values.Where(s => s.IsHostile()).ToList();
    }

    public List<Site> EnemyTowers() {
        return HostileSites().Where(s => s.StructureType == 1).ToList();
    }

    public List<Site> SitesOwnedBy(int owner) {
        return Sites.Values.Where(s => s.Owner == owner).ToList();
    }

    public List<Site> SitesNotOwnedBy(int owner) {
        return Sites.Values.Where(s => s.Owner != owner).ToList();
    }

    public List<Site> SitesWithGold() {
        return Sites.Values.Where(s => s.GoldRemaining > 30).ToList();
    }

    public List<Site> SafeBuildSites() {
        return Sites.Values.Where(s => s.IsNotOurs() & !s.IsTower()).ToList();
    }

    public List<Site> OwnedBarracks() {
        return Sites.Values.Where(s => s.isBarracks() & s.IsFriendly()).ToList();
    }

    public static List<Site> SitesByProximityTo(List<Site> sites, Location location) {
        return sites.OrderBy(s => s.Location.Proximity(location)).ToList();
    }
}

class UnitTracker {
    private Dictionary<int, Unit> Units;

    public UnitTracker() {
        Units = new Dictionary<int, Unit>();
    }

    public Unit Get(int id) {
        return Units[id];
    }

    public void Add(Unit unit) {
        Units.Add(unit.Id, unit);
    }

    public void Update(Unit unit) {
        Units[unit.Id] = unit;
    }

    public void Update(List<Unit> units) {
        foreach (var unit in units) {
            Update(unit);
        }
    }

    public List<Unit> AllUnits() {
        return Units.Values.ToList();
    }

    public List<Unit> UnitsOwnedBy(int owner) {
        return Units.Values.Where(u => u.Owner == owner).ToList();
    }

    public List<Unit> EnemyUnits() {
        return UnitsOwnedBy(1);
    }

    public List<Unit> FriendlyUnits() {
        return UnitsOwnedBy(0);
    }

    public List<Unit> UnitsByProximity(Location location) {
        return Units.Values.OrderBy(u => u.Location.Proximity(location)).ToList();
    }

    public static List<Unit> UnitsByProximityTo(List<Unit> units, Location location) {
        return units.OrderBy(u => u.Location.Proximity(location)).ToList();
    }
}



class Trainer {
    public int Gold { get; set; }


}


class GameState {
    public int Gold {get; private set;}
    public bool ShouldSave {get; private set;} = true;
    readonly int TargetSavings = 160;
    readonly int MinSavings = 30;

    public Queen Queen;
    public SiteTracker SiteTracker {get; private set;}
    public UnitTracker UnitTracker;

    // public UnitTracker UnitTracker;

    public GameState() {
        Gold = 0;
        Queen = null;
        SiteTracker = new SiteTracker();
        UnitTracker = new UnitTracker();
    }

    public void UpdateSites (List<SiteUpdate> updates) {
        SiteTracker.Update(updates);
    }

    public void UpdateGold (int gold) {
        Console.Error.WriteLine("updating gold");
        Gold = gold;

        if (gold > TargetSavings) {
            Console.Error.WriteLine("We saved PLENTY");
            ShouldSave = false;
        } else if (gold < MinSavings) {
            Console.Error.WriteLine("We spent PLENTY");
            ShouldSave = true;
        }
    }

    public void Update(Queen queen, List<Unit> units) {
        Queen = queen;
        UnitTracker.Update(units);      
    }
    
    // Maybe goes outside of GameState
    public void QueenTurn() {
        Queen.TakeTurn(this);
    }

    // Maybe goes outside of GameState
    public void TrainTurn() {
        if (ShouldSave) {
            Console.WriteLine("TRAIN");
        } else {
            var ownedBarracks = SiteTracker.OwnedBarracks();
            if (ownedBarracks.Count > 0) {
                Console.WriteLine($"TRAIN {ownedBarracks[0].Id}");
            } else {
                Console.WriteLine("TRAIN");
            }
        }
    }
}

/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/
class Player
{
    static void Main(string[] args)
    {
        // var gold = 0;
        // Queen queen = null;
        // var sites = new Dictionary<int, Site>();
        var gameState = new GameState();
        var units = new List<Unit>();

        // init read
        string[] inputs;
        int numSites = int.Parse(Console.ReadLine());
        for (int i = 0; i < numSites; i++)
        {
            inputs = Console.ReadLine().Split(' ');
            int siteId = int.Parse(inputs[0]);
            int x = int.Parse(inputs[1]);
            int y = int.Parse(inputs[2]);
            int radius = int.Parse(inputs[3]);
            // sites.Add(siteId, new Site(siteId, new Location(x, y), radius));
            gameState.SiteTracker.Add(new Site(siteId, new Location(x, y), radius));
        }

        // game loop
        while (true)
        {
            units = new List<Unit>();
            inputs = Console.ReadLine().Split(' ');
            int gold = int.Parse(inputs[0]);
            int touchedSite = int.Parse(inputs[1]); // -1 if none
            // gold = inputGold;
            gameState.UpdateGold(gold);
            // gameState.Gold = gold;
            for (int i = 0; i < numSites; i++)
            {
                inputs = Console.ReadLine().Split(' ');
                int siteId = int.Parse(inputs[0]);
                int goldRemaining = int.Parse(inputs[1]); // -1 if unknown
                int maxMineSize = int.Parse(inputs[2]); // -1 if unknown
                int structureType = int.Parse(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
                int owner = int.Parse(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
                int param1 = int.Parse(inputs[5]);
                int param2 = int.Parse(inputs[6]);
                // sites[siteId].Update(goldRemaining, maxMineSize, structureType, owner, param1, param2);
                gameState.SiteTracker.Update(new SiteUpdate {
                    id = siteId,
                    goldRemaining = goldRemaining,
                    maxMineSize = maxMineSize,
                    structureType = structureType,
                    owner = owner,
                    param1 = param1,
                    param2 = param2,
                });
            }
            int numUnits = int.Parse(Console.ReadLine());
            for (int i = 0; i < numUnits; i++)
            {
                inputs = Console.ReadLine().Split(' ');
                int x = int.Parse(inputs[0]);
                int y = int.Parse(inputs[1]);
                int owner = int.Parse(inputs[2]);
                int unitType = int.Parse(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
                int health = int.Parse(inputs[4]);
                if (owner == 0 && unitType == -1){
                    if (gameState.Queen == null) {
                        gameState.Queen = new Queen(i, owner, new Location(x, y), unitType, health);
                    } else {
                        var update = new QueenUpdate(new Location(x, y), health, touchedSite);
                        gameState.Queen.Update(update, gameState);                                                                    
                    }
                } else {
                    units.Add(new Unit(i, owner, new Location(x, y), unitType, health));
                }
                gameState.UnitTracker.Update(units);
            }


            var enemyTowers = gameState.SiteTracker.EnemyTowers();
            foreach (var tower in enemyTowers) {
                Console.Error.WriteLine($"TOWER: p1-{tower.Param1} p2-{tower.Param2}");
            }

            // Write an action using Console.WriteLine()
            // To debug: Console.Error.WriteLine("Debug messages...");
            gameState.QueenTurn();
            gameState.TrainTurn();


            // First line: A valid queen action
            // Second line: A set of training instructions
            // Console.WriteLine("WAIT");
            // Console.WriteLine("TRAIN");
        }
    }
}