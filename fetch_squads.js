const https = require('https');
const fs = require('fs');

// List of all 48 teams with their slug and display name
const teams = [
  'algeria', 'argentina', 'australia', 'austria', 'belgium', 'bosnia-and-herzegovina',
  'brazil', 'canada', 'cape-verde', 'colombia', 'croatia', 'curacao',
  'czech-republic', 'dr-congo', 'ecuador', 'egypt', 'england', 'france',
  'germany', 'ghana', 'haiti', 'iran', 'iraq', 'ivory-coast',
  'japan', 'jordan', 'mexico', 'morocco', 'netherlands', 'new-zealand',
  'norway', 'panama', 'paraguay', 'portugal', 'qatar', 'saudi-arabia',
  'scotland', 'senegal', 'south-africa', 'south-korea', 'spain', 'sweden',
  'switzerland', 'tunisia', 'turkey', 'united-states', 'uruguay', 'uzbekistan'
];

// Map slug to proper team name
const teamNameMap = {
  'algeria': 'Algeria', 'argentina': 'Argentina', 'australia': 'Australia', 
  'austria': 'Austria', 'belgium': 'Belgium', 'bosnia-and-herzegovina': 'Bosnia and Herzegovina',
  'brazil': 'Brazil', 'canada': 'Canada', 'cape-verde': 'Cape Verde', 
  'colombia': 'Colombia', 'croatia': 'Croatia', 'curacao': 'Curaçao',
  'czech-republic': 'Czech Republic', 'dr-congo': 'DR Congo', 'ecuador': 'Ecuador', 
  'egypt': 'Egypt', 'england': 'England', 'france': 'France',
  'germany': 'Germany', 'ghana': 'Ghana', 'haiti': 'Haiti', 'iran': 'Iran', 
  'iraq': 'Iraq', 'ivory-coast': 'Ivory Coast',
  'japan': 'Japan', 'jordan': 'Jordan', 'mexico': 'Mexico', 'morocco': 'Morocco', 
  'netherlands': 'Netherlands', 'new-zealand': 'New Zealand',
  'norway': 'Norway', 'panama': 'Panama', 'paraguay': 'Paraguay', 
  'portugal': 'Portugal', 'qatar': 'Qatar', 'saudi-arabia': 'Saudi Arabia',
  'scotland': 'Scotland', 'senegal': 'Senegal', 'south-africa': 'South Africa', 
  'south-korea': 'South Korea', 'spain': 'Spain', 'sweden': 'Sweden',
  'switzerland': 'Switzerland', 'tunisia': 'Tunisia', 'turkey': 'Turkey', 
  'united-states': 'USA', 'uruguay': 'Uruguay', 'uzbekistan': 'Uzbekistan'
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseSquadPage(html) {
  const players = [];
  
  // Extract players from table rows
  const rowRegex = /<tr><td>(\d+)<\/td><td>(GK|DF|MF|FW)<\/td><td>([^<]+)<\/td><td>[^<]*<\/td><\/tr>/g;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const number = match[1];
    const position = match[2];
    const nameOnShirt = match[3].trim().toUpperCase();
    players.push({ number, position, nameOnShirt });
  }
  
  return players;
}

async function main() {
  console.log('Fetching squad data for all 48 teams...\n');
  
  const allPlayers = {};
  
  for (const teamSlug of teams) {
    try {
      const url = `https://worldcupranking.com/world-cup-2026/squads/${teamSlug}/`;
      console.log(`Fetching ${teamNameMap[teamSlug]}...`);
      
      const html = await fetchUrl(url);
      const players = parseSquadPage(html);
      
      const teamName = teamNameMap[teamSlug];
      allPlayers[teamName] = players;
      
      console.log(`  Found ${players.length} players`);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`  Error fetching ${teamNameMap[teamSlug]}: ${err.message}`);
    }
  }
  
  // Generate JavaScript code for the databases
  // 1. officialSquadPlayers: Maps "NAME ON SHIRT" -> team name (for OG detection)
  let playerTeamDb = '// Official squad players: "NAME ON SHIRT" -> team\nconst officialSquadPlayers = {\n';
  
  // 2. scorerNameConversions: Maps garbled API names -> "NAME ON SHIRT"
  let scorerConversions = '// Garbled API name -> "NAME ON SHIRT" conversion\nconst officialSquadConversions = {\n';
  
  // 3. Full wcPlayerDatabase with all info
  let wcPlayerDb = '// Official World Cup 2026 Squad Database\nconst officialWcPlayerDatabase = [\n';
  
  // Map from known garbled API names to "NAME ON SHIRT" format
  const garbledToShirt = {};
  
  for (const [teamName, players] of Object.entries(allPlayers)) {
    playerTeamDb += `  // ${teamName}\n`;
    
    for (const p of players) {
      const nameOnShirt = p.nameOnShirt.trim();
      
      // Add to officialSquadPlayers (for OG detection using "NAME ON SHIRT")
      playerTeamDb += `  '${nameOnShirt}': '${teamName}',\n`;
      
      // Add to full database
      wcPlayerDb += `  { fullName: '${nameOnShirt}', nickname: '${nameOnShirt}', team: '${teamName}', position: '${p.position}' },\n`;
      
      // Store mapping from normalized name to shirt name for garbled name detection
      const normalized = nameOnShirt.toLowerCase().replace(/\s+/g, '').replace(/[.''-]/g, '');
      garbledToShirt[normalized] = nameOnShirt;
    }
  }
  
  playerTeamDb += '};\n';
  wcPlayerDb += '];\n';
  
  // Generate scorerNameConversions for existing garbled names
  // Known garbled names from the API
  const knownGarbled = {
    'Arling Halnd': 'HÅLAND',
    'Liv Avstigard': 'ØSTIGÅRD',
    'Livnl Msi': 'MESSI',
    'K. Mbappé': 'MBAPPÉ',
    'B. Barcola': 'BARCOLA',
    'K. Havertz': 'HAVERTZ',
    'J. Musiala': 'MUSIALA',
    'N. Schlotterbeck': 'SCHLOTTERBECK',
    'N. Brown': 'N. BROWN',
    'Felix Nmecha': 'NMECHA',
    'D. Undav': 'UNDAV',
    'F. Balogun': 'BALOGUN',
    'G. Reyna': 'REYNA',
    'D. Bobadilla': 'BOBADILLA',
    'Y.Ayari': 'AYARI',
    'A. Isak': 'ISAK',
    'V. Gyökeres': 'GYÖKERES',
    'M. Svanberg': 'SVANBERG',
    'J. Quiñones': 'QUIÑONES',
    'R. Jiménez': 'JIMÉNEZ',
    'I.B. Hwang': 'HWANG',
    'H.G. Oh': 'OH',
    'Rvmanv Ashmid': 'SCHMID',
    'Izn Alarb': 'Y. AL-ARAB',
    'Ali Avlvan': 'ALI AL-ARAB',
    'L. Krejčí': 'KREJCI',
    'C. Larin': 'LARIN',
    'B. Khoukhi': 'KHOUKHI',
    'Breel Embolo': 'EMBOLO',
    'V. Júnior': 'VINÍCIUS JR',
    'I. Saibari': 'SAIBARI',
    'J. McGinn': 'MCGINN',
    'Nestory Irankunda': 'IRANKUNDA',
    'C. Metcalfe': 'METCALFE',
    'Virgil van Dijk': 'VAN DIJK',
    'C. Summerville': 'SUMMERVILLE',
    'K. Nakamura': 'NAKAMURA',
    'K. Ogawa': 'OGAWA',
    'A. Diallo': 'A. DIALLO',
    'O. Rekik': 'REKIT',
    'Mohamed Hany': 'HANY',
    'Emam Ashour': 'ASHOUR',
    'Ramin Rezaiian': 'REZAEIAN',
    'Mohammad Mohebi': 'MOHEBI',
    'Elijah Just': 'JUST',
    'Abdulelah Al-Amri': 'AL-AMRI',
    'Maximiliano Araújo': 'ARAÚJO',
    'I. Mbaye': 'MBAYE',
    'Aimn Hsin': 'REGIFE',
    'Jovo Lukić': 'LUKIĆ',
  };
  
  for (const [garbled, shirtName] of Object.entries(knownGarbled)) {
    scorerConversions += `  '${garbled}': '${shirtName}',\n`;
  }
  
  scorerConversions += '};\n';
  
  // Write to file
  const output = `${playerTeamDb}\n\n${scorerConversions}\n\n${wcPlayerDb}`;
  fs.writeFileSync('squad_data.js', output);
  
  console.log('\n✅ Squad data saved to squad_data.js');
  console.log(`   Total teams: ${Object.keys(allPlayers).length}`);
  const totalPlayers = Object.values(allPlayers).reduce((sum, p) => sum + p.length, 0);
  console.log(`   Total players: ${totalPlayers}`);
}

main().catch(console.error);
