using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;

class OgRay
{
    public int X1 { get; private set; }
    public int Y1 { get; private set; }
    public int X2 { get; private set; }
    public int Y2 { get; private set; }
    public Location A
    {
        get
        {
            return new Location(X1, Y1);
        }
    }
    public Location B
    {
        get
        {
            return new Location(X2, Y2);
        }
    }

    public OgRay(int x1, int y1, int x2, int y2)
    {
        this.X1 = x1;
        this.Y1 = y1;
        this.X2 = x2;
        this.Y2 = y2;
    }

    public OgRay(Location c1, Location c2)
    {
        this.X1 = c1.X;
        this.Y1 = c1.Y;
        this.X2 = c2.X;
        this.Y2 = c2.Y;
    }

    public string Loggable() => $"a: [{X1}|{Y1}], b: [{X2}|{Y2}]";

    public void Iterate(int x, int y)
    {
        X1 = X2;
        Y1 = Y2;
        X2 = x;
        Y2 = y;
    }

    public void Iterate(Location next)
    {
        X1 = X2;
        Y1 = Y2;
        X2 = next.X;
        Y2 = next.Y;
    }

    public OgRay Rotated(double angle)
    {
        double cos = Math.Cos(angle);
        double sin = Math.Sin(angle);

        int x = (int)(cos * (X2 - X1) - sin * (Y2 - Y1) + X1);
        int y = (int)(sin * (X2 - X1) + cos * (Y2 - Y1) + Y1);

        return new Ray(X1, Y1, x, y);
    }

    public OgRay Reversed()
    {
        // Swaps the starting point and ending point
        return new Ray(X2, Y2, X1, Y1);
    }

    public OgRay Opposite()
    {
        // Keeps the original starting point, but places the ending point in the opposite direction
        return new Ray(X2, Y2, X1 + (X1 - X2), Y1 + (Y1 - Y2));
    }

    public double AngleBetween(OgRay other)
    {
        // Copilot suggested this version. Works as good as other, but there is a tiny margin of error between them.
        double dot = (X2 - X1) * (other.X2 - other.X1) + (Y2 - Y1) * (other.Y2 - other.Y1);
        double det = (X2 - X1) * (other.Y2 - other.Y1) - (Y2 - Y1) * (other.X2 - other.X1);
        return Math.Atan2(det, dot);
    }
}

class Location
{
    public int X { get; }
    public int Y { get; }

    public Location(int x, int y)
    {
        X = x;
        Y = y;
    }

    public Location(Location other)
    {
        X = other.X;
        Y = other.Y;
    }

    public double Proximity(Location other)
    {
        int deltaX = X - other.X;
        int deltaY = Y - other.Y;
        return Math.Sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    public Location Midpoint(Location other)
    {
        int x = (X + other.X) / 2;
        int y = (Y + other.Y) / 2;
        return new Location(x, y);
    }

    public List<Location> SortedByProximity(List<Location> others)
    {
        return others.OrderBy(o => Proximity(o)).ToList();
    }

    public static Location Average(List<Location> locations)
    {
        int x = (int)locations.Average(l => l.X);
        int y = (int)locations.Average(l => l.Y);
        return new Location(x, y);
    }
}

class Unit
{
    public int Id { get; set; }
    public int Owner { get; set; }
    public Location Location { get; set; }
    public int Type { get; set; }
    public int Health { get; set; }

    public Unit(int id, int owner, Location location, int type, int health)
    {
        Id = id;
        Owner = owner;
        Location = location;
        Type = type;
        Health = health;
    }
}

class UnitTracker
{
    private Dictionary<int, Unit> Units;

    public UnitTracker(List<Unit> units)
    {
        Units = new Dictionary<int, Unit>();
        foreach (var unit in units)
        {
            Add(unit);
        }
    }

    public Unit Get(int id)
    {
        return Units[id];
    }

    private void Add(Unit unit)
    {
        if (unit.Type == 0)
            Units.Add(
                unit.Id,
                new Knight(unit.Id, unit.Owner, unit.Location, unit.Type, unit.Health)
            );
        else if (unit.Type == 2)
            Units.Add(
                unit.Id,
                new Giant(unit.Id, unit.Owner, unit.Location, unit.Type, unit.Health)
            );
        else
            Units.Add(unit.Id, unit);
    }

    public List<Unit> AllUnits()
    {
        return Units.Values.ToList();
    }

    public List<Unit> UnitsOwnedBy(int owner)
    {
        return Units.Values.Where(u => u.Owner == owner).ToList();
    }

    public List<Unit> EnemyUnits()
    {
        return UnitsOwnedBy(1);
    }

    public List<Unit> FriendlyUnits => UnitsOwnedBy(0);



    public List<T> FriendlyUnitsOfType<T>() where T : Unit => FriendlyUnits.OfType<T>().ToList();

    public List<Unit> UnitsByProximity(Location location)
    {
        return Units.Values.OrderBy(u => u.Location.Proximity(location)).ToList();
    }

    public static List<T> UnitsByProximityTo<T>(List<T> units, Location location) where T : Unit
    {
        return units.OrderBy(u => u.Location.Proximity(location)).ToList();
    }
}

class Knight : Unit
{
    public Knight(int id, int owner, Location location, int type, int health)
        : base(id, owner, location, type, health) { }
}

class Giant : Unit
{
    public Giant(int id, int owner, Location location, int type, int health)
        : base(id, owner, location, type, health) { }
}

class QueenUpdate
{
    public Location location { get; set; }
    public int health { get; set; }
    public int touchedSite { get; set; }

    public QueenUpdate(Location location, int health, int touchedSite)
    {
        this.location = location;
        this.health = health;
        this.touchedSite = touchedSite;
    }
}

class Queen : Unit
{
    public int TouchedSite;
    private QueenBrain brain;
    private GameState state;
    public QueenSenses Senses;

    public Queen(int id, int owner, Location location, int type, int health)
        : base(id, owner, location, type, health)
    {
        this.TouchedSite = -1;
        brain = new QueenBrain(this);
        state = new GameState();
        Senses = new QueenSenses(this, state);
    }

    public void TakeTurn(GameState state)
    {
        this.state = state;
        Senses = new QueenSenses(this, state);
        Console.Error.WriteLine($"Enemy Knights: {Senses.EnemyKnights.Count}");
        brain.Think(state);
    }

    public void Update(QueenUpdate update, GameState state)
    {
        Location = update.location;
        Health = update.health;
        TouchedSite = update.touchedSite;
    }

    public void Move(Location target)
    {
        // Ensure that the target location is within the bounds of the game board
        // Needs more nuance but should at least prevent aggressively pushing into the edge
        Console.Error.WriteLine($"Target: {target.X}, {target.Y}");
        var xInset = 140;
        var yInset = 115;
        var x = Math.Max(xInset, Math.Min(1920 - xInset, target.X));
        var y = Math.Max(yInset, Math.Min(1000 - yInset, target.Y));
        Console.WriteLine($"MOVE {x} {y}");

        //  Console.WriteLine($"MOVE {target.X} {target.Y}");
    }

    public void BuildMine(int siteId)
    {
        Console.WriteLine($"BUILD {siteId} MINE");
    }

    public void BuildTower(int siteId)
    {
        Console.WriteLine($"BUILD {siteId} TOWER");
    }

    public void BuildBarracks(int siteId, string barracksType)
    {
        Console.WriteLine($"BUILD {siteId} BARRACKS-{barracksType}");
    }


    public void Wait()
    {
        Console.WriteLine("WAIT");
    }

    public bool IsTouchingSite()
    {
        return TouchedSite != -1;
    }

    public Site? GetTouchedSite(SiteTracker tracker)
    {
        if (IsTouchingSite())
        {
            return tracker.Get(TouchedSite);
        }
        else
        {
            return null;
        }
    }

    public bool IsUnderAttack(int proximityThreshold, int attackerCountThreshold, bool shouldScale = true) =>
        Senses.IsNearEnemyKnights(proximityThreshold, attackerCountThreshold, shouldScale);
}

class QueenSenses
{
    private Queen queen;
    private GameState state;


    public QueenSenses(Queen queen, GameState state)
    {
        this.queen = queen;
        this.state = state;
    }
    public List<Knight> EnemyKnights => state.UnitTracker.EnemyUnits().OfType<Knight>().ToList();

    public List<Knight> NearbyEnemyKnights(int proximityThreshold)
    {
        var nearbyKnights = state.UnitTracker.EnemyUnits().OfType<Knight>().Where(k => k.Location.Proximity(queen.Location) < proximityThreshold);
        return nearbyKnights.ToList();
    }

    public bool IsNearEnemyKnights(int proximityThreshold, int attackerCountThreshold, bool shouldScale)
    {

        // ChatGPT original suggestion
        // int scaledProximityThreshold = proximityThreshold + (int)(queen.Health * 0.1);
        // int scaledAttackerCountThreshold = attackerCountThreshold + (int)(queen.Health * 0.05);
        double queenHealthPercentage = queen.Health / 100.0;
        int scaledProximityThreshold = shouldScale ? proximityThreshold + 80 - (int)(queenHealthPercentage * proximityThreshold) : proximityThreshold;
        int scaledAttackerCountThreshold = shouldScale ? (int)(queenHealthPercentage * attackerCountThreshold) : attackerCountThreshold;
        Console.Error.WriteLine($"Queen Health: {queen.Health}, SPThreshold: {scaledProximityThreshold}, SACThreshold: {scaledAttackerCountThreshold}");
        var nearbyKnights = state.UnitTracker.EnemyUnits().OfType<Knight>().Where(k => k.Location.Proximity(queen.Location) < scaledProximityThreshold);
        return nearbyKnights.Count() >= scaledAttackerCountThreshold;
    }
    // public bool IsNearEnemyKnights(int proximityThreshold, int attackerCountThreshold)
    // {
        
    //     var nearbyKnights = state.UnitTracker.EnemyUnits().OfType<Knight>().Where(k => k.Location.Proximity(queen.Location) < proximityThreshold);
    //     return nearbyKnights.Count() >= attackerCountThreshold;
    // }

    public Location AverageEnemyKnightLocationWithin(int proximityThreshold)
    {
        var knights = state.UnitTracker.EnemyUnits().OfType<Knight>().Where(k => k.Location.Proximity(queen.Location) < proximityThreshold);
        var averageLocation = Location.Average(knights.Select(k => k.Location).ToList());
        return averageLocation;
    }

    public OgRay AwayFromNearbyHordes(int proximityThreshold)
    {
        var averageLocation = AverageEnemyKnightLocationWithin(proximityThreshold);
        return new OgRay(queen.Location, averageLocation).Opposite();
    }

     public Site NearestUnownedSafeBuildSite()
    {
        var safeSites = state.SiteTracker.UnownedSafeBuildSites();
        var safeSite = SiteTracker.SitesByProximityTo(safeSites, queen.Location).FirstOrDefault();

        if (safeSite == null)
        {
            throw new Exception("No safe build sites");
        }

        return safeSite;
    }

    public Site? NearestSafeTower()
    {
        var safeSites = state.SiteTracker.FriendlyTowers;
        var safeSite = SiteTracker.SitesByProximityTo(safeSites, queen.Location).FirstOrDefault();

        return safeSite;
    }
}

class QueenBrain
{

    private Queen queen;
    private Strategy currentStrategy;

    public QueenBrain(Queen queen)
    {
        this.queen = queen;
        this.currentStrategy = new ExploreStrategy(queen);
    }

    public void Think(GameState state)
    {
        currentStrategy = currentStrategy.GetNextStrategy(state);

        currentStrategy.Execute(state);
    }
}

interface Strategy
{
    Strategy GetNextStrategy(GameState state);
    void Execute(GameState state);
}

class ExploreStrategy : Strategy
{
    private Queen queen;

    public ExploreStrategy(Queen queen)
    {
        this.queen = queen;
    }

    public Strategy GetNextStrategy(GameState state)
    {
        // Note that starting HP varies widely, so starting strategy could be adjusted based on that
        // Rush/defend if start low, turtle if start high
        // May be as simple as adjusting the savings targets
        var ts = queen.GetTouchedSite(state.SiteTracker);
        if (ts != null)
        {
            if (!ts.IsFriendly()) {
                // it's a viable building site
                return new CaptureSiteStrategy(queen, ts, state);
            } else {
                // it's a friendly site and we're done. Explore some more.
                return this;
            }
        } else if (queen.IsUnderAttack(1100, 25))
        {
            return new FleeStrategy(queen);
        } else {
            return this;
        }
    }

    public void Execute(GameState state)
    {
        Console.Error.WriteLine("Exploring");
        var touchedSite = queen.GetTouchedSite(state.SiteTracker);
        if (touchedSite != null) {
            if (!touchedSite.IsFriendly()) {
                if(queen.IsUnderAttack(2000, 32)) {
                    queen.BuildTower(touchedSite.Id);
                } else {
                    queen.BuildMine(touchedSite.Id);
                }
            } else {
                approachNearbyBuildingSite();
            }
        } else {
            approachNearbyBuildingSite();
        }
    }

    private void approachNearbyBuildingSite()
    {
        var viableSite = queen.Senses.NearestUnownedSafeBuildSite();
        queen.Move(viableSite.Location);
    }
}

enum SiteCapturePreference {
    GIANT,
    ARCHER,
    KNIGHT,
    TOWER,
    MINE
}

class CaptureSiteStrategy : Strategy {
    private Queen queen;
    private Site touchedSite;
    private GameState state;
    private SiteCapturePreference capturePreference;
    public CaptureSiteStrategy(Queen queen, Site touchedSite, GameState state) {
        this.queen = queen;
        this.touchedSite = touchedSite;
        this.state = state;
        this.capturePreference = GetSiteCapturePreference();
    }

    public Strategy GetNextStrategy(GameState state) {
        if (shouldExpandTower) {
            return new ExpandTowerStrategy(queen, touchedSite);
        } else if (shouldExpandGoldMine) {
            return new ExpandMineStrategy(queen, touchedSite, state);
        } else {
            return new ExploreStrategy(queen);
        }
    }

    public void Execute(GameState state)
    {
        Console.Error.Write("Capturing Site");
        switch(capturePreference)
        {
            case SiteCapturePreference.GIANT:
                Console.Error.WriteLine("... Building GIANT BARRACKS");
                queen.BuildBarracks(touchedSite.Id, "GIANT");
                break;
            case SiteCapturePreference.ARCHER:
                Console.Error.WriteLine("... Building ARCHER BARRACKS");
                queen.BuildBarracks(touchedSite.Id, "ARCHER");
                break;
            case SiteCapturePreference.KNIGHT:
                Console.Error.WriteLine("... Building KNIGHT BARRACKS");
                queen.BuildBarracks(touchedSite.Id, "KNIGHT");
                break;
            case SiteCapturePreference.TOWER:
                Console.Error.WriteLine("... Building TOWER");
                queen.BuildTower(touchedSite.Id);
                break;
            case SiteCapturePreference.MINE:
                Console.Error.WriteLine("... Building MINE");
                queen.BuildMine(touchedSite.Id);
                break;
        }
    }

    private SiteCapturePreference GetSiteCapturePreference() {
        // Replicate logic from Execute method above
        if (state.NeededBarracksType == BarracksType.GIANT & state.SiteTracker.FriendlyGiantBarracks.Count() == 0)
            return SiteCapturePreference.GIANT;
        else if (state.NeededBarracksType == BarracksType.ARCHER & state.SiteTracker.FriendlyArcherBarracks.Count() == 0)
            return SiteCapturePreference.ARCHER;
        else if (state.NeededBarracksType == BarracksType.KNIGHT & state.SiteTracker.FriendlyKnightBarracks.Count() == 0)
            return SiteCapturePreference.KNIGHT;
        else if (shouldExpandTower | shouldBuildTower)
            return SiteCapturePreference.TOWER;
        else if (shouldBuildGoldMine())
            return SiteCapturePreference.MINE;
        else
            return SiteCapturePreference.TOWER;

    }

    private bool shouldBuildTower => queen.IsUnderAttack(1200, 16);

    private bool shouldExpandTower =>
        touchedSite.IsTower() & touchedSite.IsFriendly() & touchedSite.Param1 < touchedSite.Param2;

    private bool shouldBuildGoldMine()
    {
        var hasEnoughGold = touchedSite.GoldRemaining > 40;
        var nearestKnight = UnitTracker.UnitsByProximityTo(state.EnemyKnights, touchedSite.Location).FirstOrDefault();
        if (nearestKnight == null)
            return hasEnoughGold;
        var distanceToNearestKnight = nearestKnight.Location.Proximity(touchedSite.Location);
        if (distanceToNearestKnight > 400)
            return hasEnoughGold;
        return false;
    }

    private bool shouldExpandGoldMine =>
        capturePreference == SiteCapturePreference.MINE
        // Since we can assume we just built it, we can just check the MaxMineSize against a presumed current size of 1
        & touchedSite.GoldRemaining > 110 & touchedSite.MaxMineSize > 1;
}

class ExpandTowerStrategy : Strategy {
    private Queen queen;
    private Site site;
    public ExpandTowerStrategy(Queen queen, Site site) {
        this.queen = queen;
        this.site = site;
    }

    public Strategy GetNextStrategy(GameState state) {
        if (site.Param1 < site.Param2 & site.IsFriendly() & site.IsTower())
            return new ExpandTowerStrategy(queen, site);
        return new ExploreStrategy(queen);
    }

    public void Execute(GameState state) {
        Console.Error.WriteLine("Expanding Tower");
        queen.BuildTower(site.Id);
    }
}

class BuildTowerStrategy : Strategy
{
    private Queen queen;
    private Site site;

    public BuildTowerStrategy(Queen queen, Site site)
    {
        this.queen = queen;
        this.site = site;
    }

    public Strategy GetNextStrategy(GameState state)
    {
        return new ExpandTowerStrategy(queen, site);
    }

    public void Execute(GameState state)
    {
        Console.Error.WriteLine("Building Tower");
        queen.BuildTower(site.Id);
    }
}

class ExpandMineStrategy : Strategy {
    private Queen queen;
    private Site mine;

    private GameState state;

    public ExpandMineStrategy(Queen queen, Site mine, GameState state) {
        this.queen = queen;
        this.mine = mine;
        this.state = state;
    }

    public Strategy GetNextStrategy(GameState state) {
        var goldMine = new GoldMine(state.SiteTracker.Get(mine.Id));
        if (shouldKeepExpanding())
            return new ExpandMineStrategy(queen, mine, state);
        return new ExploreStrategy(queen);
    }

    public void Execute(GameState state) {
        Console.Error.WriteLine("Expanding Mine");
        queen.BuildMine(mine.Id);
    }

    private bool shouldKeepExpanding()
    {
        var goldMine = new GoldMine(state.SiteTracker.Get(mine.Id));
        var hasEnoughGold = goldMine.GoldRemaining > 40;
        var isBelowMax = goldMine.Size < goldMine.MaxMineSize;
        var nearestKnight = UnitTracker.UnitsByProximityTo(state.EnemyKnights, goldMine.Location).FirstOrDefault();
        if (nearestKnight == null)
            return hasEnoughGold & isBelowMax;
        var distanceToNearestKnight = nearestKnight.Location.Proximity(goldMine.Location);
        if (distanceToNearestKnight > 400)
            return hasEnoughGold & isBelowMax;
        return false;
    }
}

class BuildBarracksStrategy : Strategy {
    private Queen queen;
    private Site site;
    public BuildBarracksStrategy(Queen queen, Site site) {
        this.queen = queen;
        this.site = site;
    }

    public Strategy GetNextStrategy(GameState state) {
        return new ExploreStrategy(queen);
    }

    public void Execute(GameState state) {
        Console.Error.WriteLine("Building Barracks");
        queen.BuildBarracks(site.Id, "KNIGHT");
    }
}

// Needs work...
class FleeStrategy : Strategy
{
    private Queen queen;

    public FleeStrategy(Queen queen)
    {
        this.queen = queen;
    }

    public Strategy GetNextStrategy(GameState state)
    {
        if (queen.IsUnderAttack(900, 15))
        {
            return new FleeStrategy(queen);
        }
        return new ExploreStrategy(queen);
    }

    public void Execute(GameState state)
    {
        Console.Error.WriteLine("Fleeing");
        void moveAwayFromHorde(int hordeProximityThreshold, int attackerCountThreshold)
        {
            if (queen.IsUnderAttack(hordeProximityThreshold, attackerCountThreshold))
            {
                Console.Error.Write("... Away from Horde");
                var awayFromHorde = queen.Senses.AwayFromNearbyHordes(hordeProximityThreshold);
                queen.Move(awayFromHorde.B);
            } else {
                Console.Error.Write("... Towards earest Safe Site");
                var nearestSafeBuildSite = queen.Senses.NearestUnownedSafeBuildSite();
                queen.Move(nearestSafeBuildSite.Location);
            }
        }
        var site = queen.GetTouchedSite(state.SiteTracker);
        if (site != null) {
            if (site.IsFriendly() & site.IsGoldMine() & site.GoldRemaining < 100) {
                Console.Error.Write("... actually building tower over mine");
                queen.BuildTower(site.Id);
            } else if (!site.IsTower() & !site.IsGoldMine()) {
                Console.Error.Write("... actually building a new tower");
                queen.BuildTower(site.Id);
            } else if (!site.IsFriendly()) {
                Console.Error.Write("... actually building a new tower");
                queen.BuildTower(site.Id);
            } else {
                Console.Error.Write("... actually really far");
                moveAwayFromHorde(800, 12);
            }
        } else {  
            Console.Error.Write("... actually really far");
            moveAwayFromHorde(600, 12);
        }
    }
}

class SiteUpdate
{
    public int id { get; set; }
    public int goldRemaining { get; set; }
    public int maxMineSize { get; set; }
    public int structureType { get; set; }
    public int owner { get; set; }
    public int param1 { get; set; }
    public int param2 { get; set; }
}

class Site
{
    public int Id { get; }
    public Location Location { get; }
    public int Radius { get; }
    public int GoldRemaining { get; private set; }
    public int MaxMineSize { get; private set; }
    public int StructureType { get; private set; }
    public int Owner { get; private set; }
    public int Param1 { get; private set; }
    public int Param2 { get; private set; }

    public Site(int id, Location location, int radius)
    {
        Id = id;
        Location = location;
        Radius = radius;
    }

    public Site(Site site)
    {
        Id = site.Id;
        Location = site.Location;
        Radius = site.Radius;
        GoldRemaining = site.GoldRemaining;
        MaxMineSize = site.MaxMineSize;
        StructureType = site.StructureType;
        Owner = site.Owner;
        Param1 = site.Param1;
        Param2 = site.Param2;
    }

    public void Update(SiteUpdate update)
    {
        GoldRemaining = update.goldRemaining;
        MaxMineSize = update.maxMineSize;
        StructureType = update.structureType;
        Owner = update.owner;
        Param1 = update.param1;
        Param2 = update.param2;
    }

    public void Update(Site site) {
        GoldRemaining = site.GoldRemaining;
        MaxMineSize = site.MaxMineSize;
        StructureType = site.StructureType;
        Owner = site.Owner;
        Param1 = site.Param1;
        Param2 = site.Param2;
    }

    public bool IsNotOurs()
    {
        return Owner != 0;
    }

    public bool IsFriendly()
    {
        return Owner == 0;
    }

    public bool IsHostile()
    {
        return Owner == 1;
    }

    public bool IsEmpty()
    {
        return StructureType == -1;
    }

    public bool IsGoldMine()
    {
        return StructureType == 0;
    }

    public bool IsTower()
    {
        return StructureType == 1;
    }

    public bool isBarracks()
    {
        return StructureType == 2;
    }
}

class Tower : Site
{
    public int HP
    {
        get
        {
            return Param1;
        }
    }

    public int AttackRange
    {
        get
        {
            return Param2;
        }
    }

    public Tower(int id, Location location, int radius) : base(id, location, radius) { }


}

class GoldMine : Site{
    public int Size
    {
        get
        {
            return Param1;
        }
    }
    

    public GoldMine(int id, Location location, int radius)
     : base(id, location, radius) { }

    public GoldMine(Site site) : base(site) { }

}

enum BarracksType{
    KNIGHT,
    ARCHER,
    GIANT
}
class Barracks : Site
{
    public BarracksType Type
    {
        get
        {
            return (BarracksType)Param2;
        }
    }

    public int SpawnCooldown
    {
        get
        {
            return Param2;
        }
    }

    public Barracks(int id, Location location, int radius) : base(id, location, radius) { }

    public void Train()
    {
        if (SpawnCooldown > 0)
            Console.WriteLine("TRAIN");
        else
            Console.WriteLine($"TRAIN {Id}");
    }
}


class SiteTracker
{
    
    private Dictionary<int, Site> Sites;

    public SiteTracker()
    {
        Sites = new Dictionary<int, Site>();
    }

    public Site Get(int id)
    {
        return Sites[id];
    }

    public void Add(Site site)
    {
        Sites.Add(site.Id, site);
    }

    public void Update(SiteUpdate update)
    {
        if (update.structureType == 0 & Sites[update.id].StructureType != 0) {
            Sites[update.id] = new GoldMine(update.id, Sites[update.id].Location, Sites[update.id].Radius);
        }
        else if (update.structureType == 1 & Sites[update.id].StructureType != 1) {
            Sites[update.id] = new Tower(update.id, Sites[update.id].Location, Sites[update.id].Radius);
        }
        else if (update.structureType == 2 & Sites[update.id].StructureType != 2) {
            Sites[update.id] = new Barracks(update.id, Sites[update.id].Location, Sites[update.id].Radius);
        } else if (update.structureType == -1 & Sites[update.id].StructureType != -1) {
            Sites[update.id] = new Site(update.id, Sites[update.id].Location, Sites[update.id].Radius);
        }
    
        Sites[update.id].Update(update);
    }

    public void Update(List<SiteUpdate> updates)
    {
        foreach (var update in updates)
        {
            Update(update);
        }
    }

    public List<Site> AllSites()
    {
        return Sites.Values.ToList();
    }

    public List<Site> FriendlySites => Sites.Values.Where(s => s.IsFriendly()).ToList();

    public List<Site> HostileSites => Sites.Values.Where(s => s.IsHostile()).ToList();

    public List<Tower> HostileTowers => HostileSites.OfType<Tower>().ToList();

    public List<Tower> FriendlyTowers => FriendlySites.OfType<Tower>().ToList();

    public List<Barracks> FriendlyKnightBarracks =>
        FriendlySites.OfType<Barracks>().Where(b => b.Type == BarracksType.KNIGHT).ToList();

    public List<Barracks> FriendlyArcherBarracks =>
        FriendlySites.OfType<Barracks>().Where(b => b.Type == BarracksType.ARCHER).ToList();

    public List<Barracks> FriendlyGiantBarracks =>
        FriendlySites.OfType<Barracks>().Where(b => b.Type == BarracksType.GIANT).ToList();


    public List<Site> SitesWithGold => Sites.Values.Where(s => s.GoldRemaining > 30).ToList();

    public List<Site> UnownedSafeBuildSites()
    {
        var hostileTowers = HostileTowers;

        return Sites.Values.Where(s => {

            if (s is Tower)
                return false;

            foreach (var t in hostileTowers)
            {
                if (s.Location.Proximity(t.Location) <= t.AttackRange)
                {
                    return false;
                }
            }
            return  s.IsNotOurs();
        }).ToList();
    }

    public List<Site> AllSafeBuildSites()
    {
        var hostileTowers = HostileTowers;

        return Sites.Values.Where(s => {

            foreach (var t in hostileTowers)
            {
                if (s.Location.Proximity(t.Location) <= t.AttackRange)
                {
                    return false;
                }
            }
            return  true;
        }).ToList();
    }

    public static List<T> SitesByProximityTo<T>(List<T> sites, Location location) where T : Site
    {
        return sites.OrderBy(s => s.Location.Proximity(location)).ToList();
    }
}


enum NeededUnitTypes
{
    KNIGHT,
    ARCHER,
    GIANT,
    NONE
}
class Trainer
{
    private GameState state;

    public Trainer(GameState state)
    {
        this.state = state;
    }

    // Consider replacing all of these with a single method to decide what to prioritize building
    public bool AreArchersNeeded =>
        (state.EnemyKnightBarracks.Count() > 0 & state.SiteTracker.FriendlyArcherBarracks.Count() == 0)
        || (state.EnemyKnights.Count() > 4);

    public bool AreGiantsNeeded => state.SiteTracker.HostileTowers.Count() > 3;

    // public void TakeTurn(Location queenLocation, Location enemyLocation) {
    public void TakeTurn(Location queenLocation)
    {
        var neededType = NeededUnitType();
        switch (neededType)
        {
            case NeededUnitTypes.ARCHER:
                TrainArchers(queenLocation);
                break;
            case NeededUnitTypes.GIANT:
                TrainGiants(queenLocation);
                break;
            case NeededUnitTypes.KNIGHT:
                TrainKnights();
                break;
            case NeededUnitTypes.NONE:
                Console.WriteLine("TRAIN");
                break;
        }
    }

    public NeededUnitTypes NeededUnitType() {
        if (
            state.SiteTracker.HostileTowers.Count() > 3
            & state.UnitTracker.FriendlyUnitsOfType<Giant>().Count() < 3
        )
            return NeededUnitTypes.GIANT;
        else if (state.EnemyKnightBarracks.Count() > 0 & state.SiteTracker.FriendlyArcherBarracks.Count() == 0)
            return NeededUnitTypes.ARCHER;
        else if (state.EnemyKnights.Count() > 3)
            return NeededUnitTypes.ARCHER;
        else if (!state.ShouldSave)
            return NeededUnitTypes.KNIGHT;
        else
            return NeededUnitTypes.NONE;
        
    }

    private void TrainGiants(Location queenLocation)
    {
        if (state.SiteTracker.FriendlyGiantBarracks.Count() == 0)
        {
            state.NeededBarracksType = BarracksType.GIANT;
            if (!state.ShouldSave)
                TrainKnights();
            else
                Console.WriteLine("TRAIN");
        }
        else
        {
            state.NeededBarracksType = null;
            // Should consider strategies to build barracks in different locations
            var optimalBarracks = SiteTracker.SitesByProximityTo(state.SiteTracker.FriendlyGiantBarracks, queenLocation).First();
            Console.WriteLine($"TRAIN {optimalBarracks.Id}");
        }
    }
    public void TrainArchers(Location queenLocation) {
        if (state.SiteTracker.FriendlyArcherBarracks.Count() == 0)
        {
            state.NeededBarracksType = BarracksType.ARCHER;
            if (!state.ShouldSave)
                TrainKnights();
            else
                Console.WriteLine("TRAIN");
        }
        else
        {
            state.NeededBarracksType = null;
            // Should consider strategies to build barracks in different locations
            var optimalBarracks = SiteTracker.SitesByProximityTo(state.SiteTracker.FriendlyArcherBarracks, queenLocation).First();
            Console.WriteLine($"TRAIN {optimalBarracks.Id}");
        }
    }

    public void TrainKnights() {
        if (state.SiteTracker.FriendlyKnightBarracks.Count() == 0)
        {
            state.NeededBarracksType = BarracksType.KNIGHT;
            Console.WriteLine("TRAIN");
        }
        else
        {
            state.NeededBarracksType = null;
            // Should consider strategies to build barracks in different locations
            // Ideal to train knights closer to enemy queen
            var optimalBarracks = state.SiteTracker.FriendlyKnightBarracks.First();
            Console.WriteLine($"TRAIN {optimalBarracks.Id}");
        }
    }

}


class GameState
{
    public int Gold { get; private set; }
    public bool ShouldSave { get; private set; } = true;
    public BarracksType? NeededBarracksType { get; set; }

    // Could be more nuanced and adjustable, or sometimes flat out ignored
    readonly int TargetSavings = 140;
    readonly int MinSavings = 20;


    public SiteTracker SiteTracker { get; private set; }
    public UnitTracker UnitTracker;

    public GameState()
    {
        Gold = 0;
        SiteTracker = new SiteTracker();
        UnitTracker = new UnitTracker(new List<Unit>());
    }

    public List<Knight> EnemyKnights => UnitTracker.EnemyUnits().OfType<Knight>().ToList();

    public List<Giant> EnemyGiants => UnitTracker.EnemyUnits().OfType<Giant>().ToList();
    
    public List<Barracks> EnemyBarracks => SiteTracker.HostileSites.OfType<Barracks>().ToList();

    public List<Barracks> EnemyKnightBarracks => EnemyBarracks.Where(b => b.Type == BarracksType.KNIGHT).ToList();

    public void UpdateSites(List<SiteUpdate> updates)
    {
        SiteTracker.Update(updates);
    }

    public void UpdateGold(int gold)
    {
        Gold = gold;

        if (gold > TargetSavings)
        {
            Console.Error.WriteLine("We saved PLENTY");
            ShouldSave = false;
        }
        else if (gold < MinSavings)
        {
            Console.Error.WriteLine("We spent PLENTY");
            ShouldSave = true;
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
        var units = new List<Unit>();
        var gameState = new GameState();
        Queen? queen = null;
        Trainer trainer = new Trainer(gameState);

        // init read
        string[] inputs;
        int numSites = int.Parse(Console.ReadLine()!);
        for (int i = 0; i < numSites; i++)
        {
            inputs = Console.ReadLine()!.Split(' ');
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
            inputs = Console.ReadLine()!.Split(' ');
            int gold = int.Parse(inputs[0]);
            int touchedSite = int.Parse(inputs[1]); // -1 if none
            // gold = inputGold;
            gameState.UpdateGold(gold);
            // gameState.Gold = gold;
            for (int i = 0; i < numSites; i++)
            {
                inputs = Console.ReadLine()!.Split(' ');
                int siteId = int.Parse(inputs[0]);
                int goldRemaining = int.Parse(inputs[1]); // -1 if unknown
                int maxMineSize = int.Parse(inputs[2]); // -1 if unknown
                int structureType = int.Parse(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
                int owner = int.Parse(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
                int param1 = int.Parse(inputs[5]);
                int param2 = int.Parse(inputs[6]);

                gameState.SiteTracker.Update(new SiteUpdate
                {
                    id = siteId,
                    goldRemaining = goldRemaining,
                    maxMineSize = maxMineSize,
                    structureType = structureType,
                    owner = owner,
                    param1 = param1,
                    param2 = param2,
                });
            }
            int numUnits = int.Parse(Console.ReadLine()!);
            for (int i = 0; i < numUnits; i++)
            {
                inputs = Console.ReadLine()!.Split(' ');
                int x = int.Parse(inputs[0]);
                int y = int.Parse(inputs[1]);
                int owner = int.Parse(inputs[2]);
                int unitType = int.Parse(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
                int health = int.Parse(inputs[4]);
                if (owner == 0 && unitType == -1)
                {
                    if (queen == null)
                    {
                        queen = new Queen(i, owner, new Location(x, y), unitType, health);
                    }
                    else
                    {
                        var update = new QueenUpdate(new Location(x, y), health, touchedSite);
                        queen.Update(update, gameState);
                    }
                }
                else
                {
                    units.Add(new Unit(i, owner, new Location(x, y), unitType, health));
                }
                gameState.UnitTracker = new UnitTracker(units);
            }



            // Write an action using Console.WriteLine()
            // To debug: Console.Error.WriteLine("Debug messages...");
            if (queen == null) {
                throw new Exception("Queen is null during game loop");
            } else {
                queen.TakeTurn(gameState);
            }
            trainer.TakeTurn(queen.Location);


            // First line: A valid queen action
            // Second line: A set of training instructions
            // Console.WriteLine("WAIT");
            // Console.WriteLine("TRAIN");
        }
    }
}
