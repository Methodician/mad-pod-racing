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
    }

    public void Update(Location location, int health, int touchedSite) {
        Location = location;
        Health = health;
        TouchedSite = touchedSite;
    }

    public void Move(Location target) {
        Console.WriteLine($"MOVE {Id} {target.X} {target.Y}");
    }
    
    public void Build(int structureType, Location location) {
        Console.WriteLine($"BUILD {structureType} {location.X} {location.Y}");
    }

    public void Wait() {
        Console.WriteLine("WAIT");
    }
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

    public void Update(int goldRemaining, int maxMineSize, int structureType, int owner, int param1, int param2) {
        GoldRemaining = goldRemaining;
        MaxMineSize = maxMineSize;
        StructureType = structureType;
        Owner = owner;
        Param1 = param1;
        Param2 = param2;
    }
}



class Trainer {
    public int Gold { get; set; }
}


/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/
class Player
{
    static void Main(string[] args)
    {
        var gold = 0;
        Queen queen = null;
        var sites = new Dictionary<int, Site>();
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
            sites.Add(siteId, new Site(siteId, new Location(x, y), radius));
        }

        // game loop
        while (true)
        {
            units = new List<Unit>();
            inputs = Console.ReadLine().Split(' ');
            int inputGold = int.Parse(inputs[0]);
            int touchedSite = int.Parse(inputs[1]); // -1 if none
            gold = inputGold;
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
                sites[siteId].Update(goldRemaining, maxMineSize, structureType, owner, param1, param2);
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
                    if (queen == null) {
                        queen = new Queen(i, owner, new Location(x, y), unitType, health);
                    } else {
                        queen.Update(new Location(x, y), health, touchedSite);
                    }
                } else {
                    units.Add(new Unit(i, owner, new Location(x, y), unitType, health));
                }
            }

            // Write an action using Console.WriteLine()
            // To debug: Console.Error.WriteLine("Debug messages...");


            // First line: A valid queen action
            // Second line: A set of training instructions
            Console.WriteLine("WAIT");
            Console.WriteLine("TRAIN");
        }
    }
}