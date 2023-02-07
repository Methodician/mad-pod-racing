using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;


class Pod {

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
    public void TakeTurn(Coords target, Coords self, int angle) {
        SetHeading(self);
        SetTarget(self, target);
        var adjustedDirection = AdjustTargetDirection(Target);
        var adjustedThrust = AdjustedThrust(angle);
        Thrust(adjustedDirection.B, 100);
    }

    void Thrust(int x, int y, int power) {
        power = Math.Max(Math.Min(power, 100), 0); // power now between 0 and 100
        Console.WriteLine($"{x} {y} {power}");
    }

    void Thrust(Coords target, int power) {
        power = Math.Max(Math.Min(power, 100), 0); // power now between 0 and 100
        Console.WriteLine($"{target.X} {target.Y} {power}");
    }

    private int AdjustedThrust(int angleOff) {
        Console.Error.WriteLine($"angleOff: {angleOff}");
        return 100;
    }

    private Ray AdjustTargetDirection(Ray target) {
        // Test real quick for absolute orientation of target
        double targetAngle = target.AngleBetween(new Ray(0, 0, 0, 1));
        Console.Error.WriteLine($"absolute angle of target: {targetAngle}");

        // end test
        double angleOff = target.AngleBetween(Heading);
        Console.Error.WriteLine($"angleOff: {angleOff}");

        if (Math.Abs(angleOff) > Math.PI * .75) {
            Console.Error.WriteLine($"I'm going backwards");

            return target;
        }  
        if (Math.Abs(angleOff) > Math.PI / 2) {
            Console.Error.WriteLine($"I'm a bit turned around");
            if (angleOff < 0) {

                return target.Rotated(-angleOff).Rotated(-(Math.PI / 2));
            } else {

                return target.Rotated(-angleOff).Rotated((Math.PI / 2));
            }
        }
        Console.Error.WriteLine($"I'm generally okay.");
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
                var velocity = new Coords(vx, vy);
                Console.Error.WriteLine($"velocity: {velocity.Loggable()}");

                var target = checkpoints[nextCheckPointId];
                racers[i].TakeTurn(target, self, angle);
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