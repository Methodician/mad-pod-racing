using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Windows;

class Pod {
    // bool WasInitialized = false;
    // bool WasBoostUsed = false;
    public Ray Heading {get; private set;} // Also organically stores last location
    public Ray Target {get; private set;}
    public Vector Velocity {get; private set;}

    public void SetTarget(Coords self, Coords dest) {
        Target = new Ray(self, dest);
    }

    public void SetHeading(Coords self) {
        if (Heading == null) {
            Heading = new Ray(self, self);
        } else {
            Heading.Iterate(self);
        }
    }
}



class Racer : Pod {
    public void TakeTurn(Coords target, Coords self) {
        // TargetDirection = new Ray(self[0], self[1], target[0], target[1]);
        SetHeading(self);
        SetTarget(self, target);
        var angleOff = Target.AngleBetween(Heading);
        Console.Error.WriteLine($"angleOff: {angleOff}");
        Thrust(AdjustTargetDirection(Target).B, 100);
    }

    void Thrust(int x, int y, int power) {
        power = Math.Max(Math.Min(power, 100), 0); // power now between 0 and 100
        Console.WriteLine($"{x} {y} {power}");
    }

    void Thrust(Coords target, int power) {
        power = Math.Max(Math.Min(power, 100), 0); // power now between 0 and 100
        Console.WriteLine($"{target.X} {target.Y} {power}");
    }

    private Ray AdjustTargetDirection(Ray target) {
        double angleOff = target.AngleBetween(Heading);
        if (Math.Abs(angleOff) > Math.PI * .75) {
            Console.Error.WriteLine($"I'm going backwards. angleOff: {angleOff}");

            return target;
        }  
        if (Math.Abs(angleOff) > Math.PI / 2) {
            Console.Error.WriteLine($"I'm a bit turned around. angleOff: {angleOff}");
            if (angleOff < 0) {

                return target.Rotated(-angleOff).Rotated(-(Math.PI / 2));
            } else {

                return target.Rotated(-angleOff).Rotated((Math.PI / 2));
            }
        }
        Console.Error.WriteLine($"I'm generally okay. angleOff: {angleOff}");
        return target.Rotated(-angleOff);      
    }
}


class Coords {
    public int X {get; private set;}
    public int Y {get; private set;}

    public Coords(int x, int y) {
        X = x;
        Y = y;
    }

    public void Set(int x, int y) {
        X = x;
        Y = y;
    }

    public void SetX(int x) {
        X = x;
    }

    public void SetY(int y) {
        Y = y;
    }

    public string Loggable() => $"{X}, {Y}";
}

class Ray {
    public int X1 {get; private set;}
    public int Y1 {get; private set;}
    public int X2 {get; private set;}
    public int Y2 {get; private set;}
    public Coords A {
        get {
            return new Coords(X1, Y1);
        }
    }
    public Coords B {
        get {
            return new Coords(X2, Y2);
        }
    }

    public Ray (int x1, int y1, int x2, int y2) {
        this.X1 = x1;
        this.Y1 = y1;
        this.X2 = x2;
        this.Y2 = y2;
    }

    public Ray(Coords c1, Coords c2) {
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
    
    public void Iterate(Coords next) {
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

    public double AngleBetween(Ray other) {
        // Copilot suggested this version. Works as good as other, but there is a tiny margin of error between them.
        double dot = (X2 - X1) * (other.X2 - other.X1) + (Y2 - Y1) * (other.Y2 - other.Y1);
        double det = (X2 - X1) * (other.Y2 - other.Y1) - (Y2 - Y1) * (other.X2 - other.X1);
        return Math.Atan2(det, dot);
    }
}

class Vector {
    // implementation completely Copilot version. See if this is usable.
    int x1;
    int y1;
    int x2;
    int y2;

    public Vector (int x1, int y1, int x2, int y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    public string Loggable() => $"a: [{x1}|{y1}], b: [{x2}|{y2}]";

    public double Magnitude() {
        return Math.Sqrt(Math.Pow(x2 - x1, 2) + Math.Pow(y2 - y1, 2));
    }
}


// ORIGINAL
class Robot
{
    // Might decide and hold its own target
    // Could also memorize targets, perhaps in a queue, to predict the next one after it has seen them all.
    public bool WasInitialized {get; private set;}
    public bool WasBoostUsed {get; private set;}
    public bool HasMemorizedAllCheckpoints {get; private set;}
    public int NextCheckpointDist {get; private set;}
    public Ray Heading {get; private set;}
    public Ray EnemyHeading {get; private set;}
    public Ray TargetDirection {get; private set;}
    public Vector Velocity {get; private set;}
    public Location LastLocation {get; private set;}
    private Location enemy;
    public Location Enemy {
        get {
            return enemy;
        }
        private set {
            if (enemy.x == 0 & enemy.y == 0) {
                enemy = value;
            } else {
                EnemyHeading = new Ray(enemy, value);
                enemy = value;
            }
        }
    }
    private Location self;
    public Location Self {
        get {
            return self;
        }
        private set {
            if (LastLocation.x == 0 && LastLocation.y == 0) {
                LastLocation = value; // Maybe I don't keep track of this. Don't need it for enemy....
            }
            Velocity = new Vector(LastLocation.x, LastLocation.y, value.x, value.y); // Do I even need this?
            Heading = new Ray(LastLocation, value);
            LastLocation = self;
            self = value;
        }
    }
    public Vector TargetVector {get; private set;}
    private Location target;
    public Location Target {
        get {
            return target;
        }
        private set {
            TargetVector = new Vector(self.x, self.y, value.x, value.y); // Do I even need this?
            target = value;
        }
    }
    private Queue<Location> memorizedCheckpoints = new Queue<Location>();
    private Location futureCheckpoint = new Location();

    public Robot() {
        LastLocation = new Location();
        self = new Location();
        Velocity = new Vector(0, 0);
        target = new Location();
        TargetVector = new Vector(0, 0);
        enemy = new Location();
    }

    public void Initialize(Location nextCheckpoint, Location self, Location enemy, int nextCheckDist) {
        Self = self;
        Enemy = enemy;
        Target = nextCheckpoint;
        RememberCheckpoint(nextCheckpoint);
        TargetDirection = new Ray(self, nextCheckpoint);
        NextCheckpointDist = nextCheckDist;
        if (nextCheckDist > 4000) {
            Boost(nextCheckpoint);
        } else {
            ApplyThrust(nextCheckpoint, 100);
        }
        WasInitialized = true;
    }
    
    public void TakeTurn(Location nextCheckpoint, Location self, Location enemy, int nextCheckDist) {
        Self = self;
        Enemy = enemy;
        TargetDirection = new Ray(self, nextCheckpoint);
        if (!Target.Equals(nextCheckpoint)) {
            RememberCheckpoint(nextCheckpoint);
            NextCheckpointDist = nextCheckDist; // Can make choices by comparing this to current one
            Target = new Location(nextCheckpoint.x, nextCheckpoint.y);
        }

        var adjustedTarget = AdjustTargetDirection(TargetDirection);

        // maybe do this combat check in another method
        var enemyDirection = new Ray(Self, Enemy);
        var enemyAngleFromTarget = TargetDirection.AngleBetween(enemyDirection);
        var enemyHeadingAngleFromHeading = Heading.AngleBetweenSigned(EnemyHeading);
        var enemyDistance = Math.Sqrt(Math.Pow(Enemy.x - Self.x, 2) + Math.Pow(Enemy.y - Self.y, 2));
        Console.Error.WriteLine($"enemyAngle: {enemyAngleFromTarget}, enemyDistance: {enemyDistance}, enemyHeadingAngle: {enemyHeadingAngleFromHeading}");
        if (enemyDistance < 1000 & enemyAngleFromTarget > 2 & enemyAngleFromTarget < 6) {
            RaiseShield(adjustedTarget.L2);
        } else if (nextCheckDist > 4750 & Math.Abs(Heading.AngleBetween(TargetDirection)) < Math.PI / 6 & !WasBoostUsed) {
            Boost(adjustedTarget.L2);
        } else if (HasMemorizedAllCheckpoints & nextCheckDist < 1650 & Velocity.Magnitude() > 800 ) {
            var futureCheck = memorizedCheckpoints.Peek();
            Console.Error.WriteLine($"Redirecting towards: {futureCheck.Loggable()}");
            ApplyThrust(AdjustTargetDirection(new Ray(Self, futureCheck)).L2, 50);
        } else if (nextCheckDist < 1800 & Velocity.Magnitude() > 700) {
                ApplyThrust(adjustedTarget.L2, 30);
        } else {
            ApplyThrust(adjustedTarget.L2, 100);
        }


        // Copilot threw this out might experiment later
        // else if (nextCheckDist > 6750 & adjustedTarget.AngleBetween(TargetDirection) > Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 100);
        // } else if (nextCheckDist > 3000 & adjustedTarget.AngleBetween(TargetDirection) < Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 100);
        // } else if (nextCheckDist > 3000 & adjustedTarget.AngleBetween(TargetDirection) > Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 50);
        // } else if (nextCheckDist > 1000 & adjustedTarget.AngleBetween(TargetDirection) < Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 50);
        // } else if (nextCheckDist > 1000 & adjustedTarget.AngleBetween(TargetDirection) > Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 25);
        // } else if (nextCheckDist > 500 & adjustedTarget.AngleBetween(TargetDirection) < Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 25);
        // } else if (nextCheckDist > 500 & adjustedTarget.AngleBetween(TargetDirection) > Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 10);
        // } else if (nextCheckDist > 100 & adjustedTarget.AngleBetween(TargetDirection) < Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 10);
        // } else if (nextCheckDist > 100 & adjustedTarget.AngleBetween(TargetDirection) > Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 5);
        // } else if (nextCheckDist > 50 & adjustedTarget.AngleBetween(TargetDirection) < Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2, 5);
        // } else if (nextCheckDist > 50 & adjustedTarget.AngleBetween(TargetDirection) > Math.PI / 2) {
        //     ApplyThrust(adjustedTarget.L2,
    }

    private Ray AdjustTargetDirection(Ray target) {
        double angleOff = target.AngleBetweenSigned(Heading);        
        if (Math.Abs(angleOff) > Math.PI / 2 | double.IsNaN(angleOff)) {
            Console.Error.WriteLine("Im' off by more than 90 degrees or have no angle to work with... so my algo bugs out. Using straight target instead.");
            // adjustedTarget = TargetDirection;
            return target;
        } else if (Math.Abs(angleOff) > Math.PI / 3) {
            Console.Error.WriteLine("Im' off by more than 60 degrees... Should I do anything different?");
            return target.Rotated(-angleOff);
            // adjustedTarget = TargetDirection.Rotated(-angleOff);
        } else {
            // If we're less than 60 degrees off, we'll adjust the target direction to be closer to the heading.
            return target.Rotated(-angleOff);
            // adjustedTarget = TargetDirection.Rotated(-angleOff / 2); // Copilot thought this would be good. Let's test it later.
            // adjustedTarget = TargetDirection.Rotated(-angleOff);
        }
    }

    public void RememberCheckpoint(Location newCheckpoint) {
        Console.Error.WriteLine($"Remembering a new location: {newCheckpoint.Loggable()}");
        if (memorizedCheckpoints.Contains(newCheckpoint)) {
            HasMemorizedAllCheckpoints = true;
            var overflowCheck = memorizedCheckpoints.Dequeue();
            futureCheckpoint = memorizedCheckpoints.Peek();
            Console.Error.WriteLine($"I can see the future: {futureCheckpoint.Loggable()} and past {overflowCheck.Loggable()}");
        }
        memorizedCheckpoints.Enqueue(newCheckpoint);
        // temp
        foreach (Location checkpoint in memorizedCheckpoints) {
            Console.Error.WriteLine($"{checkpoint.x}, {checkpoint.y}");
        }
    }

    // Could/should this take a Vector instead?
    public void ApplyThrust(Location target, int power) {
        if(power > 100) power = 100;
        if(power < 0) power = 0;
        Console.WriteLine($"{target.x} {target.y} {power}");
    }

    public void Boost(Location target) {
        Console.WriteLine($"{target.x} {target.y} BOOST");
        WasBoostUsed = true;
    }

    public void RaiseShield(Location target) {
        Console.WriteLine($"{target.x} {target.y} SHIELD");
    }
}

class Ray {
    public Location L1 {get; set;}
    public Location L2 {get; set;}

    // Could have a constructor that takes Robot, or another ray type class that does.
    public Ray(Location l1, Location l2) {
        L1 = l1;
        L2 = l2;
    }

    public string Loggable() => $"L1: {L1.Loggable() }, L2: {L2.Loggable() }";

    public void Iterate(Location newEnd) {
        L1 = L2;
        L2 = newEnd;
    }

    public Ray Rotated(double angle)
    {
        double cos = Math.Cos(angle);
        double sin = Math.Sin(angle);

        double x = cos * (L2.x - L1.x) - sin * (L2.y - L1.y) + L1.x;
        double y = sin * (L2.x - L1.x) + cos * (L2.y - L1.y) + L1.y;
        return new Ray(L1, new Location((int)Math.Round(x), (int)Math.Round(y)));
    }

    // public Ray Inverted()
    // {

    //     End = new Vector2(Start.X - (End.X - Start.X), Start.Y - (End.Y - Start.Y));
    // }

    public double AngleBetween(Ray other)
    {
        double dotProduct = (L2.x - L1.x) * (other.L2.x - other.L1.x) + (L2.y - L1.y) * (other.L2.y - other.L1.y);
        double magnitude1 = Math.Sqrt((L2.x - L1.x) * (L2.x - L1.x) + (L2.y - L1.y) * (L2.y - L1.y));
        double magnitude2 = Math.Sqrt((other.L2.x - other.L1.x) * (other.L2.x - other.L1.x) + (other.L2.y - other.L1.y) * (other.L2.y - other.L1.y));
        double cosine = dotProduct / (magnitude1 * magnitude2);
        double angle = Math.Acos(cosine);
        return angle;
    }

    public double AngleBetweenSigned(Ray other)
    {
        double angle = AngleBetween(other);
        double crossProduct = (L2.x - L1.x) * (other.L2.y - other.L1.y) - (L2.y - L1.y) * (other.L2.x - other.L1.x);
        if (crossProduct < 0)
        {
            angle = -angle;
        }
        return angle;
    }

}

class Vector
{
    public int x {get; set;}
    public int y {get; set;}

    public Vector(int xVec, int yVec) {
        x = xVec;
        y = yVec;
    }

    public Vector(int x1, int y1, int x2, int y2) {
        x = x2 - x1;
        y = y2 - y1;
    }

    public string Loggable() {
        return $"{x}, {y}";
    }
    public Vector Subtract(Vector other) {
        return new Vector(x - other.x, y - other.y);
    }

    public Vector Add(Vector other) {
        return new Vector(x + other.x, y + other.y);
    }

    public Vector Add(Location other) {
        return new Vector(x + other.x, y + other.y);
    }

    public Vector Multiply(double factor) {
        return new Vector((int)(x * factor), (int)(y * factor));
    }

    public double DotProduct(Vector other) {
        return x * other.x + y * other.y;
    }

    public Vector ProjectOnto(Vector other)
    {
        double projection = (DotProduct(other) / Math.Pow(other.Magnitude(), 2)) * other.Magnitude();
        return new Vector((int)projection * other.x, (int)projection * other.y);
    }

    public Vector Rotate(double angle)
    {
        // double radians = angle * (Math.PI / 180);
        double xNew = x * Math.Cos(angle) - y * Math.Sin(angle);
        double yNew = x * Math.Sin(angle) + y * Math.Cos(angle);
        return new Vector((int)xNew, (int)yNew);
    }

    public double AngleBetween(Vector other) {
        return Math.Acos(DotProduct(other) / (Magnitude() * other.Magnitude()));
    }

    public double AngleBetweenWithDirection(Vector other) {
        double angle = AngleBetween(other);
        int crossProduct = x * other.y - y * other.x;
        return crossProduct > 0 ? angle : Math.PI - angle;
    }

    public double Magnitude() {
        return Math.Sqrt(x * x + y * y);
    }

    public override bool Equals(object otherVector)
    {
        if (otherVector == null || !(otherVector is Vector))
        {
            return false;
        }

        var other = (Vector)otherVector;
        return other.x == x && other.y == y;
    }

    public override int GetHashCode()
    {
        return (x, y).GetHashCode();
    }
}

class Location
{
    public int x {get; set;}
    public int y {get; set;}

    public Location(int xCoord, int yCoord)
    {
        x = xCoord;
        y = yCoord;
    }

    public Location(){}

    public string Loggable() {
        return $"{x}, {y}";
    }


    public Location Add(Vector other) {
        return new Location(x + other.x, y + other.y);
    }

    public override bool Equals(object otherCoords)
    {
        if (otherCoords == null || !(otherCoords is Location))
        {
            return false;
        }

        var other = (Location)otherCoords;
        return other.x == x && other.y == y;
    }

    public override int GetHashCode()
    {
        return (x, y).GetHashCode();
    }
}

// class Checkpoint // Do I even need these? How relevant is that radius?
// {
//     public Location Center {get; set;}
//     public int Radius {get; set;}

//     public string Loggable() {
//         return $"{Center.x}, {Center.y}";
//     }

//     public Checkpoint(int x, int y, int r) {
//         Center = new Location(x, y);
//         Radius = r;
//     }

//     public Checkpoint(){}
// }
/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/
class Player
{
    static void Main(string[] args)
    {
        // boierplate
        string[] inputs;
        int laps = int.Parse(Console.ReadLine());
        int checkpointCount = int.Parse(Console.ReadLine());
        // end boilerplate

        Coords[] checkpoints = new Coords[checkpointCount];
        Racer[] racers = new Racer[2];
        racers[0] = new Racer();
        racers[1] = new Racer();

        for (int i = 0; i < checkpointCount; i++)
        {
            // bolerplate
            inputs = Console.ReadLine().Split(' ');
            int x = int.Parse(inputs[0]);
            int y = int.Parse(inputs[1]);
            // end boilerplate

            checkpoints[i] = new Coords(x, y);
        }

        // game loop
        while (true)
        {
            for (int i = 0; i < 2; i++)
            {
                // boilerplate
                inputs = Console.ReadLine().Split(' ');
                int x = int.Parse(inputs[0]); // x position of your pod
                int y = int.Parse(inputs[1]); // y position of your pod
                int vx = int.Parse(inputs[2]); // x speed of your pod
                int vy = int.Parse(inputs[3]); // y speed of your pod
                int angle = int.Parse(inputs[4]); // angle of your pod
                int nextCheckPointId = int.Parse(inputs[5]); // next check point id of your pod
                // end boilerplate

                var self = new Coords(x, y);
                var target = checkpoints[nextCheckPointId];
                racers[i].TakeTurn(target, self);
            }
            for (int i = 0; i < 2; i++)
            {
                // boilerplate
                inputs = Console.ReadLine().Split(' ');
                int x2 = int.Parse(inputs[0]); // x position of the opponent's pod
                int y2 = int.Parse(inputs[1]); // y position of the opponent's pod
                int vx2 = int.Parse(inputs[2]); // x speed of the opponent's pod
                int vy2 = int.Parse(inputs[3]); // y speed of the opponent's pod
                int angle2 = int.Parse(inputs[4]); // angle of the opponent's pod
                int nextCheckPointId2 = int.Parse(inputs[5]); // next check point id of the opponent's pod
                // end boilerplate
            }

            // Write an action using Console.WriteLine()
            // To debug: Console.Error.WriteLine("Debug messages...");


            // You have to output the target position
            // followed by the power (0 <= thrust <= 100)
            // i.e.: "x y thrust"
            // Console.WriteLine("8000 4500 100");
            // Console.WriteLine("8000 4500 100");
        }
    }
}

// ORIGINAL
class Player
{
    static void Main(string[] args)
    {
        string[] inputs;
        var robot = new Robot();
        Location lastCheckLocation = new Location();
        Location futureCheck = new Location();
        Location lastLocation = new Location();
        Queue<Location> checkpoints = new Queue<Location>();
        Location target = new Location();


        // game loop
        while (true)
        {
            inputs = Console.ReadLine().Split(' ');
            int x = int.Parse(inputs[0]);
            int y = int.Parse(inputs[1]);
            int nextCheckpointX = int.Parse(inputs[2]); // x position of the next check point
            int nextCheckpointY = int.Parse(inputs[3]); // y position of the next check point
            int nextCheckDist = int.Parse(inputs[4]); // distance to the next checkpoint
            int nextCheckpointAngle = int.Parse(inputs[5]); // angle between your pod orientation and the direction of the next checkpoint


            inputs = Console.ReadLine().Split(' ');
            int opponentX = int.Parse(inputs[0]);
            int opponentY = int.Parse(inputs[1]);

            // MY CODE BELOW
            var nextCheck = new Location(nextCheckpointX, nextCheckpointY);
            var nextCheckLocation = new Location(nextCheckpointX, nextCheckpointY); // may drop this it's getting vestigial
            var self = new Location(x, y);  
            var enemyLocation = new Location(opponentX, opponentY);


            if(!robot.WasInitialized) {
                robot.Initialize(nextCheck, self, enemyLocation, nextCheckDist);
            } else {
                robot.TakeTurn(nextCheck, self, enemyLocation, nextCheckDist);
            }

           
            lastLocation = self;
        }
    }
}