const fs = require('fs');
let script = fs.readFileSync('script.js', 'utf8');
const squadData = fs.readFileSync('squad_data.js', 'utf8');
const squadPlayersMatch = squadData.match(/const officialSquadPlayers = \{([\s\S]*?)\n\};/);
const officialSquadPlayers = squadPlayersMatch ? squadPlayersMatch[0] : null;
const scorerConversionsMatch = squadData.match(/const officialSquadConversions = \{[\s\S]*?\};/);
const officialSquadConversions = scorerConversionsMatch ? scorerConversionsMatch[0] : null;
const wcDbMatch = squadData.match(/const officialWcPlayerDatabase = \[[\s\S]*?\];/);
const officialWcPlayerDatabase = wcDbMatch ? wcDbMatch[0] : null;
console.log('Extracted officialSquadPlayers:', officialSquadPlayers ? 'YES' : 'NO');
console.log('Extracted officialSquadConversions:', officialSquadConversions ? 'YES' : 'NO');
console.log('Extracted officialWcPlayerDatabase:', officialWcPlayerDatabase ? 'YES' : 'NO');

// Replace scorerNameConversions (match from comment to end of object)
const oldScorerConvRegex = /\/\/ Helper function to format a single scorer string for display[\s\S]*?const scorerNameConversions = \{[\s\S]*?\n\};/;
script = script.replace(oldScorerConvRegex, officialSquadConversions + '\n');

// Replace playerTeamDatabase
const oldPlayerTeamDbRegex = /\/\/ Official squad players[\s\S]*?officialSquadPlayers = \{[\s\S]*?\};/;
script = script.replace(oldPlayerTeamDbRegex, officialSquadPlayers);

// Replace wcPlayerDatabase  
const oldWcDbRegex = /\/\/ Official World Cup[\s\S]*?officialWcPlayerDatabase = \[[\s\S]*?\];/;
script = script.replace(oldWcDbRegex, officialWcPlayerDatabase);

fs.writeFileSync('script.js', script);
console.log('\nDone! Updated script.js');
