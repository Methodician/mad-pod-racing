using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;

class Robot
{
    // Might decide and hold its own target
    // Could also memorize targets, perhaps in a queue, to predict the next one after it has seen them all.
    public bool WasBoostUsed {get; private set;}
    public Ray Heading {get; set;}
    public Ray CurrentTarget {get; set;}
    public Ray AdjustedTarget {get; set;}
    public Vector Velocity {get; set;}
    public Location LastLocation {get; private set;}
    private Location currentLocation;
    public Location CurrentLocation {
        get {
            return currentLocation;
        }
        set {
            if (LastLocation.x == 0 && LastLocation.y == 0) {
                LastLocation = value;
            }
            Velocity = new Vector(LastLocation.x, LastLocation.y, value.x, value.y);
            LastLocation = currentLocation;
            currentLocation = value;
        }
    }
    public Vector TargetDirection {get; private set;}
    private Checkpoint target;
    public Checkpoint Target {
        get {
            return target;
        }
        set {
            TargetDirection = new Vector(currentLocation.x, currentLocation.y, value.Center.x, value.Center.y);
            target = value;
        }
    }
    private Queue<Checkpoint> memorizedCheckpoints = new Queue<Checkpoint>();
    private Checkpoint futureCheckpoint = new Checkpoint();

    public Robot() {
        LastLocation = new Location();
        currentLocation = new Location();
        Velocity = new Vector(0, 0);
        target = new Checkpoint();
        TargetDirection = new Vector(0, 0);
    }

    public void RememberCheckpoint(Checkpoint newCheckpoint) {
        if (memorizedCheckpoints.Contains(newCheckpoint)) {
            memorizedCheckpoints.Dequeue();
            futureCheckpoint = memorizedCheckpoints.Peek();
            Console.Error.WriteLine($"I can see the future: {futureCheckpoint.Center.x}, {futureCheckpoint.Center.y}");
        }
        memorizedCheckpoints.Enqueue(newCheckpoint);
        // temp
        foreach (Checkpoint checkpoint in memorizedCheckpoints) {
            Console.Error.WriteLine($"{checkpoint.Center.x}, {checkpoint.Center.y}");
        }
    }

    public double AngleOffFromTarget() {
        return Velocity.AngleBetweenWithDirection(TargetDirection);
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
}

class Ray {
    public Location L1 {get; set;}
    public Location L2 {get; set;}

    // Could have a constructor that takes Robot, or another ray type class that does.
    public Ray(Location l1, Location l2) {
        L1 = l1;
        L2 = l2;
    }

    public Ray(Robot robot)
    {
        L1 = robot.LastLocation;
        L2 = robot.CurrentLocation;
    }

    public Ray Rotated(double angle)
    {
        double cos = Math.Cos(angle);
        double sin = Math.Sin(angle);

        double x = cos * (L2.x - L1.x) - sin * (L2.y - L1.y) + L1.x;
        double y = sin * (L2.x - L1.x) + cos * (L2.y - L1.y) + L1.y;
        return new Ray(L1, new Location((int)Math.Round(x), (int)Math.Round(y)));
    }

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

    public string Coords(){
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

    public string Coords(){
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

class Checkpoint
{
    public Location Center {get; set;}
    public int Radius {get; set;}

    public string Coords(){
        return $"{Center.x}, {Center.y}";
    }

    public Checkpoint(int x, int y, int r) {
        Center = new Location(x, y);
        Radius = r;
    }

    public Checkpoint(){}
}
/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/
class Player
{
    static void Main(string[] args)
    {
        string[] inputs;

        int maxPower = 100;
        int initialDist = 0;
        
        var robot = new Robot();
        Location lastCheckLocation = new Location();
        Location futureCheck = new Location();
        Location lastLocation = new Location();
        Queue<Location> checkpoints = new Queue<Location>();
        Location target = new Location();

        bool shouldAdjust = true;

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
            var nextCheck = new Checkpoint(nextCheckpointX, nextCheckpointY, 600);
            var nextCheckLocation = new Location(nextCheckpointX, nextCheckpointY); // may drop this it's getting vestigial
            var location = new Location(x, y);

            robot.CurrentLocation = location;          
            Console.Error.WriteLine($"robot: {robot}, location: {robot.CurrentLocation.x}, {robot.CurrentLocation.y}");
            robot.Target = nextCheck;
            Console.Error.WriteLine($"angle from target: {robot.AngleOffFromTarget()}");
    



            if (target.x == 0) {
                // THE GAME STARTED
                // Initialize some vals
                // assumes a target will never have a zero coordinate, so this must be the start
                target.x = nextCheckLocation.x;
                target.y = nextCheckLocation.y;
                lastCheckLocation.x = target.x;
                lastCheckLocation.y = target.y;
                initialDist = nextCheckDist;
                checkpoints.Enqueue(new Location(nextCheckpointX, nextCheckpointY));
                robot.RememberCheckpoint(nextCheck);
            }

            if (!nextCheckLocation.Equals(lastCheckLocation)) {
                // A CHECK POINT WAS REACHED
                // Do some things
                robot.RememberCheckpoint(nextCheck);
                if(checkpoints.Contains(nextCheckLocation)) {
                    // We have all the checkpoints scouted
                    checkpoints.Dequeue();
                    futureCheck = checkpoints.Peek();
                    Console.Error.WriteLine($"future X: {futureCheck.x}, future Y: {futureCheck.y}");
                }
                checkpoints.Enqueue(nextCheckLocation);
                initialDist = nextCheckDist;
                lastCheckLocation = nextCheckLocation;
                target = nextCheckLocation;
            }


            // if (nextCheckDist < 2700 & nextCheckDist < initialDist / 3 & !isCourseCorrectionActive) {
            //     Console.Error.WriteLine("I'm slowig for approach");
            //     maxPower = 20;
                
            //     if (futureCheck.x != 0 && !isCourseCorrectionActive) {
            //         Console.Error.WriteLine("I'm thinking ahead!");
            //         Console.Error.WriteLine($"future X: {futureCheck.x}, future Y: {futureCheck.y}");
            //         target = futureCheck;
            //     }
            // } else if (maxPower < 50) {
            //     Console.Error.WriteLine("Why am I going slow");
            //     maxPower = 100;
            // }

            // if (nextCheckDist < 1600 & nextCheckDist < initialDist / 3) {
            //     Console.Error.WriteLine("I'm slowig for approach");
            //     maxPower = 20;
                
            //     // if (futureCheck.x != 0 && !isCourseCorrectionActive) {
            //     //     Console.Error.WriteLine("I'm thinking ahead!");
            //     //     Console.Error.WriteLine($"future X: {futureCheck.x}, future Y: {futureCheck.y}");
            //     //     target = futureCheck;
            //     // }
            // } else if (maxPower < 50) {
            //     Console.Error.WriteLine("Why am I going slow");
            //     maxPower = 100;
            // }

            // Testing
            robot.Heading = new Ray(robot);
            Console.Error.WriteLine($"current heading: {robot.Heading.L2.Coords()}");
            robot.CurrentTarget = new Ray(robot.CurrentLocation, nextCheckLocation);
            Console.Error.WriteLine($"current target: {robot.CurrentTarget.L2.Coords()}");
            double angleOff = robot.CurrentTarget.AngleBetweenSigned(robot.Heading);
            Console.Error.WriteLine($"angleOff: {angleOff}");
            var adjustedHeading = robot.CurrentTarget.Rotated(-angleOff);
            if (Math.Abs(angleOff) > Math.PI / 2) {
                Console.Error.WriteLine("I'm off by more than 90 degrees");
                shouldAdjust = false;
                // adjustedHeading = robot.CurrentTarget.Rotated(-angleOff / 3);
            } else if (Math.Abs(angleOff) > Math.PI / 3) {
                Console.Error.WriteLine("I'm off by more than a third");
                // shouldAdjust = false;
                // adjustedHeading = robot.CurrentTarget.Rotated(-angleOff / 2);
            }
            Console.Error.WriteLine($"adjsuted target: {adjustedHeading.L2.Coords()}");
            // end testing
           
            if (nextCheckDist > 6750 & nextCheckpointAngle < 1 & !robot.WasBoostUsed) {
                robot.Boost(target);
            } else {
                if (shouldAdjust) {
                    robot.ApplyThrust(adjustedHeading.L2, maxPower);
                } else {
                    robot.ApplyThrust(nextCheckLocation, maxPower);
                    shouldAdjust = true;
                }
            }
            lastLocation = location;
        }
    }
}