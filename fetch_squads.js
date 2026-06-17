/**
 * Fetch World Cup 2026 Squad Data from worldcupranking.com
 * Extracts: # | POS | NAME_ON_SHIRT | CLUB
 */

const fs = require('fs');
const https = require('https');

const teams = [
  'algeria', 'argentina', 'austria', 'belgium', 'bolivia', 'brazil', 'cameroon',
  'canada', 'chile', 'china', 'colombia', 'costa-rica', 'croatia', 'denmark',
  'ecuador', 'egypt', 'england', 'france', 'germany', 'ghana', 'guatemala',
  'indonesia', 'iran', 'iraq', 'italy', 'jamaica', 'japan', 'jordan', 'mexico',
  'morocco', 'netherlands', 'new-zealand', 'nigeria', 'norway', 'palestine',
  'panama', 'paraguay', 'peru', 'portugal', 'qatar', 'romania', 'saudi-arabia',
  'senegal', 'serbia', 'slovakia', 'south-africa', 'south-korea', 'spain',
  'sweden', 'switzerland', 'ukraine', 'united-states', 'uruguay', 'uzbekistan'
];

// Map from URL slug to display name
const teamNames = {
  'south-korea': 'Rep. of Korea',
  'costa-rica': 'Costa Rica',
  'saudi-arabia': 'Saudi Arabia',
  'new-zealand': 'New Zealand',
  'south-africa': 'South Africa',
  'united-states': 'USA'
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseSquad(html) {
  const players = [];
  
  // Match table rows: <tr><td>1</td><td>GK</td><td>MUSSO</td><td>Club (COUN)</td></tr>
  const rowRegex = /<tr><td>(\d+)<\/td><td>(GK|DF|MF|FW)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g;
  let match;
  
  while ((match = rowRegex.exec(html)) !== null) {
    const number = match[1];
    const position = match[2];
    const nameOnShirt = match[3].trim();
    const club = match[4].trim();
    
    players.push({ number, position, nameOnShirt, club });
  }
  
  return players;
}

async function main() {
  const allPlayers = {};
  
  for (const team of teams) {
    const url = `https://worldcupranking.com/world-cup-2026/squads/${team}/`;
    console.log(`Fetching ${team}...`);
    
    try {
      const html = await fetchPage(url);
      const players = parseSquad(html);
      
      const displayName = teamNames[team] || team.charAt(0).toUpperCase() + team.slice(1);
      allPlayers[displayName] = players;
      
      console.log(`  Found ${players.length} players`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
  
  // Generate JavaScript code with jersey numbers
  // Format: 'NUMBER NAME_ON_SHIRT': { team, position, club }
  let playerDb = '// Official World Cup 2026 Squad with Jersey Numbers\n';
  playerDb += '// Format: # | POS | NAME ON SHIRT | CLUB\n';
  playerDb += 'const officialWcPlayerDatabase = [\n';
  
  // For OG detection: NAME ON SHIRT -> team
  let squadPlayers = '// Official squad: NAME ON SHIRT -> team (for OG detection)\n';
  squadPlayers += 'const officialSquadPlayers = {\n';
  
  // Scorer conversions: garbled API -> NAME ON SHIRT
  let scorerConversions = '// Garbled API name -> NAME ON SHIRT conversion\n';
  scorerConversions += 'const officialSquadConversions = {\n';
  
  for (const [teamName, players] of Object.entries(allPlayers)) {
    for (const p of players) {
      const num = p.number.padStart(2, ' ');
      const key = `${num} ${p.nameOnShirt}`;
      
      // Full player database entry
      playerDb += `  { number: ${p.number}, nameOnShirt: '${p.nameOnShirt}', fullName: '${p.nameOnShirt}', team: '${teamName}', position: '${p.position}', club: '${p.club}' },\n`;
      
      // OG detection: NAME ON SHIRT -> team
      squadPlayers += `  '${p.nameOnShirt}': '${teamName}',\n`;
    }
  }
  
  playerDb += '];\n';
  squadPlayers += '};\n';
  
  // Known garbled API names -> NAME ON SHIRT
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
    'O. Rekik': 'REKIK',
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
  const output = `${playerDb}\n\n${squadPlayers}\n\n${scorerConversions}`;
  fs.writeFileSync('squad_data.js', output);
  
  console.log('\n✅ Squad data saved to squad_data.js');
  console.log(`   Total teams: ${Object.keys(allPlayers).length}`);
  const totalPlayers = Object.values(allPlayers).reduce((sum, p) => sum + p.length, 0);
  console.log(`   Total players: ${totalPlayers}`);
}

main().catch(console.error);
