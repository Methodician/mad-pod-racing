/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

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
    const owner: number = parseInt(inputs[2]);
    const unitType: number = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
    const health: number = parseInt(inputs[4]);
  }

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');

  // First line: A valid queen action
  // Second line: A set of training instructions
  console.log("WAIT");
  console.log("TRAIN");
}
