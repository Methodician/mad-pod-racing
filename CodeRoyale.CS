using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;

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

class Queen : Unit {
    public int TouchedSite;
    public Queen(int id, int owner, Location location, int type, int health)
        : base(id, owner, location, type, health) {
            this.TouchedSite = -1;
    }

    public void Update(Location location, int health, int touchedSite) {
        Location = location;
        Health = health;
        TouchedSite = touchedSite;
    }

    public void Move(Location target) {
        Console.WriteLine($"MOVE {target.X} {target.Y}");
    }
    
    public void BuildMine(int siteId) {
        Console.WriteLine($"BUILD {siteId} MINE");
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

    // public void Act(GameState gameState, List<Unit> units) {
    //     // if TouchedSite is not -1, then we have a site
    //     if(TouchedSite != -1) {
    //         var site = gameState.SiteTracker.Get(TouchedSite);
    //         // if it is not a maxed out mine, build
    //         if (site.GoldRemaining > 50 && site.MaxMineSize > site.Param1) {
    //             BuildMine(site.Id);
    //         } else {
    //             Wait();
    //         }
    //     }

    //     // move towards nearest safe site
    //     var safeSites = SiteTracker.SitesByProximityTo(gameState.SiteTracker.SafeBuildSites(), Location);
    //     if (safeSites.Count > 0) {
    //         var target = safeSites[0].Location;
    //         Move(target);
    //     } else {
    //         // Should implement a retreat method instead of just waiting
    //         Wait();
    //     }
    // }
}

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
}

// class Mine : Site {
//     public Mine(int id, Location location, int radius) : base(id, location, radius) {
//     }

//     public void
// }

// May be useful to implement a UnitTracker too.
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
        return Sites.Values.Where(s => s.Owner != 0 & s.StructureType != 1).ToList();
    }

    public List<Site> OwnedBarracks() {
        return Sites.Values.Where(s => s.StructureType == 2 & s.Owner == 0).ToList();
    }

    public static List<Site> SitesByProximityTo(List<Site> sites, Location location) {
        return sites.OrderBy(s => s.Location.Proximity(location)).ToList();
    }
}



class Trainer {
    public int Gold { get; set; }
}


class GameState {
    public int Gold;
    public bool ShouldSave = true;
    public int TargetSavings = 200;
    public int MinSavings = 30;

    public Queen Queen;
    public SiteTracker SiteTracker;

    // public UnitTracker UnitTracker;

    public GameState() {
        Gold = 0;
        Queen = null;
        SiteTracker = new SiteTracker();
    }

    public void Update(int gold, Queen queen, List<SiteUpdate> updates) {
        Gold = gold;
        Queen = queen;
        SiteTracker.Update(updates);
    }
    
    // Maybe goes outside of GameState
    public void QueenTurn() {
        // if TouchedSite is not -1, then we have a site
        var site = Queen.GetTouchedSite(SiteTracker);
        var siteHasEnoughGold = false;
        var siteIsMaxedOut = false;
        var BarracksCount = SiteTracker.OwnedBarracks().Count;
        if (site != null) {
            siteHasEnoughGold = site.GoldRemaining > 50;
            siteIsMaxedOut = site.MaxMineSize == site.Param1;
        }

        Console.Error.WriteLine($"${site} | {siteHasEnoughGold} | {siteIsMaxedOut} | {BarracksCount} | {ShouldSave}");

        if (site != null & !ShouldSave & BarracksCount < 1){
            Queen.BuildBarracks(site.Id, "KNIGHT");
        } else if (site != null & siteHasEnoughGold & !siteIsMaxedOut) {
            Queen.BuildMine(site.Id);
        } else {
            // move towards nearest safe site
            var safeSites = SiteTracker.SitesByProximityTo(SiteTracker.SafeBuildSites(), Queen.Location);
            if (safeSites.Count > 0) {
                var target = safeSites[0].Location;
                Queen.Move(target);
            } else {
                // Should implement a retreat method instead of just waiting
                Queen.Wait();
            }

        }

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
    public void TakeTurn() {
        if (Gold >= TargetSavings) {
            ShouldSave = false;
        } else if (Gold < MinSavings) {
            ShouldSave = true;
        }
        QueenTurn();
        TrainTurn();
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
            gameState.Gold = gold;
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
                        gameState.Queen.Update(new Location(x, y), health, touchedSite);                                                                    
                    }
                } else {
                    units.Add(new Unit(i, owner, new Location(x, y), unitType, health));
                }
            }

            // Write an action using Console.WriteLine()
            // To debug: Console.Error.WriteLine("Debug messages...");
            gameState.TakeTurn();


            // First line: A valid queen action
            // Second line: A set of training instructions
            // Console.WriteLine("WAIT");
            // Console.WriteLine("TRAIN");
        }
    }
}