const STORAGE_KEY = 'wc2026Scoreboard';
const state = {
  scores: {},
  collapsedGroups: {},
  lastApiUpdate: null,
  apiSourcedMatches: {}, // Track which matches have scores from API
  apiMatchTimes: {}, // Store API match times (UTC) for timezone conversion
};
loadState();

// API Team Name Mapping (API name -> Project name)
const apiTeamNameMap = {
  'Mexico': 'Mexico',
  'South Africa': 'South Africa',
  'South Korea': 'Rep. of Korea',
  'Czech Republic': 'Czech Rep.',
  'Canada': 'Canada',
  'Bosnia and Herzegovina': 'Bosnia/Herzeg.',
  'United States': 'USA',
  'Paraguay': 'Paraguay',
  'Qatar': 'Qatar',
  'Switzerland': 'Switzerland',
  'Brazil': 'Brazil',
  'Morocco': 'Morocco',
  'Haiti': 'Haiti',
  'Australia': 'Australia',
  'Turkey': 'Turkey',
  'Germany': 'Germany',
  'Curaçao': 'Curaçao',
  'Netherlands': 'Netherlands',
  'Japan': 'Japan',
  'Ivory Coast': 'Ivory Coast',
  'Ecuador': 'Ecuador',
  'Sweden': 'Sweden',
  'Tunisia': 'Tunisia',
  'Spain': 'Spain',
  'Cape Verde': 'Cape Verde',
  'Saudi Arabia': 'Saudi Arabia',
  'Uruguay': 'Uruguay',
  'Belgium': 'Belgium',
  'Egypt': 'Egypt',
  'Iran': 'IR Iran',
  'New Zealand': 'New Zealand',
  'France': 'France',
  'Iraq': 'Iraq',
  'Norway': 'Norway',
  'Senegal': 'Senegal',
  'Algeria': 'Algeria',
  'Argentina': 'Argentina',
  'Austria': 'Austria',
  'Jordan': 'Jordan',
  'Colombia': 'Colombia',
  'Democratic Republic of the Congo': 'DR Congo',
  'Portugal': 'Portugal',
  'Uzbekistan': 'Uzbekistan',
  'Croatia': 'Croatia',
  'England': 'England',
  'Ghana': 'Ghana',
  'Panama': 'Panama',
  'Scotland': 'Scotland',
};

// Reverse map (Project name -> API name)
const projectToApiNameMap = Object.entries(apiTeamNameMap).reduce((acc, [api, proj]) => {
  acc[proj] = api;
  return acc;
}, {});

// API Configuration
const API_URL = 'https://worldcup26.ir/get/games';
const API_REFRESH_INTERVAL = 30000; // 30 seconds
const API_SYNC_COOLDOWN = 10000; // 10 seconds cooldown between manual syncs
let apiRefreshTimer = null;
let lastSyncTime = 0; // Track last sync timestamp

const flagCodeMap = {
  'Mexico': 'mx',
  'South Africa': 'za',
  'Rep. of Korea': 'kr',
  'Czech Rep.': 'cz',
  'Canada': 'ca',
  'Bosnia/Herzeg.': 'ba',
  'USA': 'us',
  'Paraguay': 'py',
  'Qatar': 'qa',
  'Switzerland': 'ch',
  'Brazil': 'br',
  'Morocco': 'ma',
  'Haiti': 'ht',
  'Australia': 'au',
  'Turkey': 'tr',
  'Germany': 'de',
  'Curaçao': 'cw',
  'Netherlands': 'nl',
  'Japan': 'jp',
  'Ivory Coast': 'ci',
  'Ecuador': 'ec',
  'Sweden': 'se',
  'Tunisia': 'tn',
  'Spain': 'es',
  'Cape Verde': 'cv',
  'Saudi Arabia': 'sa',
  'Uruguay': 'uy',
  'Belgium': 'be',
  'Egypt': 'eg',
  'IR Iran': 'ir',
  'New Zealand': 'nz',
  'France': 'fr',
  'Iraq': 'iq',
  'Norway': 'no',
  'Senegal': 'sn',
  'Algeria': 'dz',
  'Argentina': 'ar',
  'Austria': 'at',
  'Jordan': 'jo',
  'Colombia': 'co',
  'DR Congo': 'cd',
  'Portugal': 'pt',
  'Uzbekistan': 'uz',
  'Croatia': 'hr',
  'Ghana': 'gh',
  'Panama': 'pa',
};

const teamInitialMap = {
  'Czech Rep.': 'CZE',
  'Mexico': 'MEX',
  'Rep. of Korea': 'KOR',
  'South Africa': 'SAF',
  'Canada': 'CAN',
  'Bosnia/Herzeg.': 'BIH',
  'USA': 'USA',
  'Paraguay': 'PAR',
  'Qatar': 'QAT',
  'Switzerland': 'SWI',
  'Brazil': 'BRA',
  'Morocco': 'MAR',
  'Haiti': 'HAI',
  'Scotland': 'SCO',
  'Australia': 'AUS',
  'Turkey': 'TUR',
  'Germany': 'GER',
  'Curaçao': 'CUR',
  'Netherlands': 'NED',
  'Japan': 'JPN',
  'Ivory Coast': 'IVC',
  'Ecuador': 'ECU',
  'Sweden': 'SWE',
  'Tunisia': 'TUN',
  'Spain': 'ESP',
  'Cape Verde': 'CPV',
  'Saudi Arabia': 'SAU',
  'Uruguay': 'URU',
  'Belgium': 'BEL',
  'Egypt': 'EGY',
  'IR Iran': 'IRI',
  'New Zealand': 'NZL',
  'France': 'FRA',
  'Iraq': 'IRQ',
  'Norway': 'NOR',
  'Senegal': 'SEN',
  'Algeria': 'ALG',
  'Argentina': 'ARG',
  'Austria': 'AUT',
  'Jordan': 'JOR',
  'Colombia': 'COL',
  'DR Congo': 'DRC',
  'Portugal': 'POR',
  'Uzbekistan': 'UZB',
  'Croatia': 'CRO',
  'England': 'ENG',
  'Ghana': 'GHA',
  'Panama': 'PAN',
};

function getTeamInitials(team) {
  return teamInitialMap[team] || team.split(/[^A-Za-z0-9]+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase();
}

const localFlagMap = {
  'Scotland': 'assets/scotland.svg',
  'England': 'assets/england.png',
};

const flagMap = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'Rep. of Korea': '🇰🇷',
  'Czech Rep.': '🇨🇿',
  'Canada': '🇨🇦',
  'Bosnia/Herzeg.': '🇧🇦',
  'USA': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷',
  'Morocco': '🇲🇦',
  'Haiti': '🇭🇹',
  'Scotland': '🏴',
  'Australia': '🇦🇺',
  'Turkey': '🇹🇷',
  'Germany': '🇩🇪',
  'Curaçao': '🇨🇼',
  'Netherlands': '🇳🇱',
  'Japan': '🇯🇵',
  'Ivory Coast': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Sweden': '🇸🇪',
  'Tunisia': '🇹🇳',
  'Spain': '🇪🇸',
  'Cape Verde': '🇨🇻',
  'Saudi Arabia': '🇸🇦',
  'Uruguay': '🇺🇾',
  'Belgium': '🇧🇪',
  'Egypt': '🇪🇬',
  'IR Iran': '🇮🇷',
  'New Zealand': '🇳🇿',
  'France': '🇫🇷',
  'Iraq': '🇮🇶',
  'Norway': '🇳🇴',
  'Senegal': '🇸🇳',
  'Algeria': '🇩🇿',
  'Argentina': '🇦🇷',
  'Austria': '🇦🇹',
  'Jordan': '🇯🇴',
  'Colombia': '🇨🇴',
  'DR Congo': '🇨🇩',
  'Portugal': '🇵🇹',
  'Uzbekistan': '🇺🇿',
  'Croatia': '🇭🇷',
  'England': '🇬🇧',
  'Ghana': '🇬🇭',
  'Panama': '🇵🇦',
};

function getFlagUrl(team, size = 40) {
  if (localFlagMap[team]) {
    return localFlagMap[team];
  }
  const code = flagCodeMap[team];
  return code ? `https://flagcdn.com/w${size}/${code.toLowerCase()}.png` : null;
}

function formatFlag(team) {
  const url = getFlagUrl(team, 40);
  if (!url) {
    return `<span class="team-flag">${flagMap[team] || '🏳️'}</span>`;
  }
  const isLocal = Boolean(localFlagMap[team]);
  const srcset = isLocal ? '' : ` srcset="https://flagcdn.com/w80/${flagCodeMap[team].toLowerCase()}.png 2x"`;
  return `
    <span class="team-flag">
      <img
        src="${url}"
        ${srcset}
        width="20"
        height="14"
        alt="${team} flag"
        loading="lazy"
        onerror="this.parentNode.textContent='${flagMap[team] || '🏳️'}'"
      />
    </span>
  `;
}

const stageLabels = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarterfinal',
  sf: 'Semifinal',
  third: 'Third Place',
  final: 'Final',
};

// Venue to IANA timezone mapping for World Cup 2026 host cities
const venueTimezones = {
  'Mexico City': 'America/Mexico_City',
  'Guadalajara': 'America/Bogota', // Guadalajara uses same timezone as Bogota (CST)
  'Toronto': 'America/Toronto',
  'Vancouver': 'America/Vancouver',
  'Los Angeles': 'America/Los_Angeles',
  'San Francisco Bay Area': 'America/Los_Angeles',
  'Seattle': 'America/Los_Angeles',
  'Dallas': 'America/Chicago',
  'Houston': 'America/Chicago',
  'Kansas City': 'America/Chicago',
  'Phoenix': 'America/Phoenix',
  'Philadelphia': 'America/New_York',
  'Boston': 'America/New_York',
  'New York/New Jersey': 'America/New_York',
  'Miami': 'America/New_York',
  'Atlanta': 'America/New_York',
  'Monterrey': 'America/Monterrey',
  'Denver': 'America/Denver',
  'Boston': 'America/New_York',
};

// Stadium data cache (fetched from API)
let stadiumData = null;

// Fetch stadium data from API
async function fetchStadiumData() {
  try {
    const response = await fetch('https://worldcup26.ir/get/stadiums');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    stadiumData = data.stadiums || [];
    // Re-render after stadium data is loaded to update venue names
    render();
    return stadiumData;
  } catch (error) {
    console.error('Failed to fetch stadium data:', error);
    return null;
  }
}

// Get stadium info by FIFA name (matches our venue names)
function getStadiumInfo(venueName) {
  if (!stadiumData) return null;

  // Find stadium by fifa_name matching our venue names
  // Our venue names match the pattern "City Stadium" or "City" in fifa_name
  const stadium = stadiumData.find(s => {
    // Try to match by city name in fifa_name
    const fifaName = s.fifa_name.toLowerCase();
    const venueLower = venueName.toLowerCase();

    // Direct match with common patterns
    if (fifaName.includes('mexico city') && venueLower.includes('mexico')) return true;
    if (fifaName.includes('guadalajara') && venueLower.includes('guadalajara')) return true;
    if (fifaName.includes('toronto') && venueLower.includes('toronto')) return true;
    if (fifaName.includes('vancouver') && venueLower.includes('vancouver')) return true;
    if (fifaName.includes('los angeles') && venueLower.includes('los angeles')) return true;
    if (fifaName.includes('san francisco') && venueLower.includes('san francisco')) return true;
    if (fifaName.includes('seattle') && venueLower.includes('seattle')) return true;
    if (fifaName.includes('dallas') && venueLower.includes('dallas')) return true;
    if (fifaName.includes('houston') && venueLower.includes('houston')) return true;
    if (fifaName.includes('kansas city') && venueLower.includes('kansas')) return true;
    if (fifaName.includes('philadelphia') && venueLower.includes('philadelphia')) return true;
    if (fifaName.includes('boston') && venueLower.includes('boston')) return true;
    if (fifaName.includes('new york') && venueLower.includes('new york')) return true;
    if (fifaName.includes('miami') && venueLower.includes('miami')) return true;
    if (fifaName.includes('atlanta') && venueLower.includes('atlanta')) return true;
    if (fifaName.includes('monterrey') && venueLower.includes('monterrey')) return true;

    return false;
  });

  return stadium || null;
}

// Team FIFA code mapping
let teamFifaCodeMap = null;

// Fetch teams data from API
async function fetchTeamsData() {
  try {
    const response = await fetch('https://worldcup26.ir/get/teams');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const teams = data.teams || [];
    
    // Create mapping from team name to FIFA code
    teamFifaCodeMap = {};
    
    // Mapping from abbreviated names in schedule_data.js to FIFA codes
    const nameMapping = {
      'Rep. of Korea': 'South Korea',
      'Czech Rep.': 'Czech Republic',
      'Bosnia/Herzeg.': 'Bosnia and Herzegovina',
      'DR Congo': 'Democratic Republic of the Congo',
      'IR Iran': 'Iran',
      'USA': 'United States'
    };
    
    teams.forEach(team => {
      // Map from official FIFA name to FIFA code
      teamFifaCodeMap[team.name_en] = team.fifa_code;
      
      // Also map from abbreviated names
      Object.entries(nameMapping).forEach(([abbrev, official]) => {
        if (team.name_en === official) {
          teamFifaCodeMap[abbrev] = team.fifa_code;
        }
      });
    });
    
    // Re-render after team data is loaded to update team codes
    render();
    return teamFifaCodeMap;
  } catch (error) {
    console.error('Failed to fetch teams data:', error);
    return null;
  }
}

// Get FIFA code for a team
function getTeamFifaCode(teamName) {
  if (!teamFifaCodeMap) return teamName;
  return teamFifaCodeMap[teamName] || teamName;
}

// Get display name for a venue (stadium name + city)
function getVenueDisplayName(venueName) {
  const info = getStadiumInfo(venueName);
  if (info) {
    // Extract city name (remove parenthetical details)
    const cityName = info.city_en.split('(')[0].trim();
    return `${info.name_en}, ${cityName}`;
  }
  return venueName || '';
}

// Get stadium name only
function getStadiumName(venueName) {
  const info = getStadiumInfo(venueName);
  if (info) {
    return info.name_en;
  }
  return '';
}

// Get city name for a venue
function getCityName(venueName) {
  const info = getStadiumInfo(venueName);
  if (info) {
    // Extract city name (remove parenthetical details)
    return info.city_en.split('(')[0].trim();
  }
  return venueName || '';
}

// Helper function to format venue local time to user's local machine timezone
function formatApiTime(apiLocalDate, venue) {
  if (!apiLocalDate) return null;

  // Parse the API date format: "06/11/2026 13:00"
  const [datePart, timePart] = apiLocalDate.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Get the venue's timezone (default to US Eastern if unknown)
  const venueTimezone = venueTimezones[venue] || 'America/New_York';

  // Get user's local machine timezone
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a formatter to check what time a UTC moment shows in the venue timezone
  const venueFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: venueTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Create a UTC date assuming the time parts are correct
  // Then adjust until the venue formatter shows the correct local time
  let correctUTC = null;

  // Try all possible offsets from -12 hours to +14 hours in 15-min increments
  for (let offsetMinutes = -720; offsetMinutes <= 840; offsetMinutes += 15) {
    const testUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60 * 1000);
    const parts = venueFormatter.formatToParts(testUTC);
    const partMap = {};
    parts.forEach(p => partMap[p.type] = parseInt(p.value));

    // Check if this UTC time shows the correct local time in venue timezone
    if (partMap.month === month && partMap.day === day &&
      partMap.hour === hours && partMap.minute === minutes) {
      correctUTC = testUTC;
      break;
    }
  }

  // Fallback: just use UTC if no match found
  if (!correctUTC) {
    correctUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  }

  // Get short timezone abbreviation for user's timezone
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: localTimezone,
    timeZoneName: 'short'
  });
  const tzParts = tzFormatter.formatToParts(correctUTC);
  const tzAbbr = tzParts.find(p => p.type === 'timeZoneName')?.value || '';

  // Create formatters for the user's local timezone
  const localDateFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: localTimezone,
    month: 'short',
    day: 'numeric'
  });

  const localTimeFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: localTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: localTimezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const fullTimeFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: localTimezone,
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format the corrected UTC timestamp in user's local timezone
  return {
    dateLabel: localDateFormatter.format(correctUTC),
    timeLabel: localTimeFormatter.format(correctUTC),
    tzAbbr: tzAbbr,
    fullDate: fullDateFormatter.format(correctUTC),
    fullTime: fullTimeFormatter.format(correctUTC),
    timestamp: correctUTC.getTime(),
    venueTimezone: venueTimezone,
    localTimezone: localTimezone,
    isLocal: true
  };
}

// Get match time for display (API time if available, otherwise fallback)
function getMatchTime(matchNo, venue) {
  const apiTime = state.apiMatchTimes[matchNo];
  if (apiTime) {
    return formatApiTime(apiTime, venue);
  }
  return null;
}

// Get local machine timezone name
function getLocalTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Generate date/time label for a match (uses API time if available)
function getMatchDateTimeLabel(matchNo, venue, fallbackDate, fallbackTime) {
  const apiTime = getMatchTime(matchNo, venue);
  if (apiTime) {
    return {
      dateLabel: apiTime.dateLabel,
      timeLabel: apiTime.timeLabel,
      tzAbbr: apiTime.tzAbbr,
      fullDate: apiTime.fullDate,
      fullTime: apiTime.fullTime
    };
  }
  // Fallback to original schedule data
  if (fallbackDate) {
    const date = new Date(fallbackDate);
    // Get user's timezone abbreviation
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: localTimezone,
      timeZoneName: 'short'
    });
    const tzParts = tzFormatter.formatToParts(date);
    const tzAbbr = tzParts.find(p => p.type === 'timeZoneName')?.value || '';
    const timeWithTz = fallbackTime ? `${fallbackTime} ${tzAbbr}` : '';
    return {
      dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      timeLabel: fallbackTime || '',
      tzAbbr: tzAbbr,
      fullDate: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      fullTime: timeWithTz
    };
  }
  return {
    dateLabel: '',
    timeLabel: fallbackTime || '',
    tzAbbr: '',
    fullDate: '',
    fullTime: fallbackTime || ''
  };
}

const groupListElement = document.getElementById('group-list');
const bracketContainer = document.getElementById('bracket-container');
const clearButton = document.getElementById('clearButton');
const exportButton = document.getElementById('exportButton');
const matchDetailElement = document.getElementById('match-detail');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const THEMES = ['color', 'light', 'dark'];
const THEME_LABELS = {
  color: '<span class="material-symbols-outlined">palette</span> Color',
  light: '<span class="material-symbols-outlined">light_mode</span> Light',
  dark: '<span class="material-symbols-outlined">dark_mode</span> Dark'
};

const savedTheme = localStorage.getItem('wc2026Theme') || 'color';
document.documentElement.setAttribute('data-theme', savedTheme);

const THEME_LOGOS = {
  light: 'assets/images/fifa-world-cup-2026-logo.png',
  color: 'assets/images/fifa-world-cup-2026-logo-alt.png',
  dark: 'assets/images/fifa-world-cup-2026-logo-white.png',
};

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('wc2026Theme', theme);
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = THEME_LABELS[theme];
  }
  const heroLogo = document.querySelector('.hero-logo');
  if (heroLogo && THEME_LOGOS[theme]) {
    heroLogo.src = THEME_LOGOS[theme];
  }
}

applyTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'color';
    const nextIndex = (THEMES.indexOf(current) + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex]);
  });
}

clearButton.addEventListener('click', () => {
  if (confirm('Clear all manually entered scores? API-synced scores will be preserved.')) {
    // Only clear scores that are NOT from the API
    const nonApiScores = {};
    const nonApiMatchNos = Object.keys(state.scores).filter(matchNo => !state.apiSourcedMatches[matchNo]);

    // Preserve API-sourced scores
    Object.keys(state.scores).forEach(matchNo => {
      if (state.apiSourcedMatches[matchNo]) {
        nonApiScores[matchNo] = state.scores[matchNo];
      }
    });

    state.scores = nonApiScores;
    // Note: We keep apiSourcedMatches intact since those scores are preserved
    saveState();
    render();

    const clearedCount = nonApiMatchNos.length;
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} manually entered score(s). API-synced scores preserved.`);
    }
  }
});

exportButton.addEventListener('click', () => {
  const csv = buildExportCsv();
  downloadCsv(csv, 'worldcup-2026-scores.csv');
});

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored && typeof stored === 'object') {
      state.scores = stored.scores || stored;
      state.collapsedGroups = stored.collapsedGroups || {};
      state.apiSourcedMatches = stored.apiSourcedMatches || {};
      state.apiMatchTimes = stored.apiMatchTimes || {};
    }
  } catch {
    state.scores = {};
    state.collapsedGroups = {};
    state.apiSourcedMatches = {};
    state.apiMatchTimes = {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    scores: state.scores,
    collapsedGroups: state.collapsedGroups,
    apiSourcedMatches: state.apiSourcedMatches,
    apiMatchTimes: state.apiMatchTimes,
  }));
}

// ── Live API Integration ──────────────────────────────────────────────

let refreshButton = null;
let liveIndicator = null;

function initLiveApi() {
  // Get references to existing elements
  refreshButton = document.getElementById('liveRefreshBtn');
  liveIndicator = document.getElementById('liveIndicator');

  // Add click listener to refresh button
  if (refreshButton) {
    refreshButton.addEventListener('click', fetchLiveScores);
  }

  // Fetch stadium data on init
  fetchStadiumData();
  
  // Fetch teams data on init
  fetchTeamsData();
}

async function fetchLiveScores() {
  if (!refreshButton) return;

  // Check cooldown for manual syncs (not auto-refresh)
  const now = Date.now();
  const timeSinceLastSync = now - lastSyncTime;

  if (timeSinceLastSync < API_SYNC_COOLDOWN) {
    const remainingSeconds = Math.ceil((API_SYNC_COOLDOWN - timeSinceLastSync) / 1000);
    console.log(`Please wait ${remainingSeconds} seconds before syncing again.`);
    refreshButton.querySelector('.btn-text').textContent = `Wait ${remainingSeconds}s`;
    setTimeout(() => {
      if (refreshButton) {
        refreshButton.querySelector('.btn-text').textContent = 'Sync Live';
      }
    }, remainingSeconds * 1000);
    return;
  }

  lastSyncTime = now;
  refreshButton.disabled = true;
  refreshButton.querySelector('.btn-text').textContent = 'Syncing...';

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const games = data.games || [];

    let updatedCount = 0;
    let timesUpdated = 0;

    games.forEach(game => {
      const homeApiName = game.home_team_name_en;
      const awayApiName = game.away_team_name_en;
      const homeProjectName = apiTeamNameMap[homeApiName];
      const awayProjectName = apiTeamNameMap[awayApiName];

      if (!homeProjectName || !awayProjectName) return;

      const homeScore = parseInt(game.home_score) || 0;
      const awayScore = parseInt(game.away_score) || 0;

      // Find matching match in our scheduleData (both group and knockout matches)
      const allMatches = [...scheduleData.groupMatches, ...scheduleData.knockoutMatches];

      const matchingMatch = allMatches.find(m => {
        return (m.team1 === homeProjectName && m.team2 === awayProjectName) ||
          (m.team1 === awayProjectName && m.team2 === homeProjectName);
      });

      const targetMatch = matchingMatch;

      if (targetMatch) {
        // Store the API match time (UTC) for timezone conversion
        if (game.local_date && !state.apiMatchTimes[targetMatch.matchNo]) {
          state.apiMatchTimes[targetMatch.matchNo] = game.local_date;
          timesUpdated++;
        }

        // Update score if match is finished
        if (game.finished === 'TRUE') {
          // Determine correct score order based on which team is home
          const isHomeTeam = targetMatch.team1 === homeProjectName;
          const score1 = isHomeTeam ? homeScore : awayScore;
          const score2 = isHomeTeam ? awayScore : homeScore;

          // Update score if different from current
          const currentScore = state.scores[targetMatch.matchNo];
          if (!currentScore ||
            parseInt(currentScore.score1) !== score1 ||
            parseInt(currentScore.score2) !== score2) {
            state.scores[targetMatch.matchNo] = { score1: String(score1), score2: String(score2) };
            updatedCount++;
          }

          // Mark this match as API-sourced (for disabling inputs)
          state.apiSourcedMatches[targetMatch.matchNo] = true;
        }
      }
    });

    // Save state if any updates were made (scores or times)
    if (updatedCount > 0 || timesUpdated > 0) {
      saveState();
      render();
    }

    state.lastApiUpdate = new Date().toLocaleTimeString();
    updateLiveIndicator(true);

    console.log(`Live scores synced: ${updatedCount} match(es) updated, ${timesUpdated} time(s) stored`);

  } catch (error) {
    console.error('Failed to fetch live scores:', error);
    updateLiveIndicator(false);
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.querySelector('.btn-text').textContent = 'Sync Live Scores';
    }
  }
}

// Helper function to check if a match has API-sourced scores
function isApiSourcedMatch(matchNo) {
  return state.apiSourcedMatches[matchNo] === true;
}

function updateLiveIndicator(success) {
  if (!liveIndicator) return;

  if (success) {
    liveIndicator.classList.add('connected');
    const timeSpan = liveIndicator.querySelector('.live-text');
    if (timeSpan) {
      timeSpan.textContent = state.lastApiUpdate ? `Updated ${state.lastApiUpdate}` : 'Connected';
    }
  } else {
    liveIndicator.classList.remove('connected');
    const timeSpan = liveIndicator.querySelector('.live-text');
    if (timeSpan) {
      timeSpan.textContent = 'Offline';
    }
  }
}

function startAutoRefresh() {
  if (apiRefreshTimer) clearInterval(apiRefreshTimer);
  apiRefreshTimer = setInterval(fetchLiveScores, API_REFRESH_INTERVAL);
}

function toTeamLabel(team) {
  if (!team) return 'TBD';
  return `${formatFlag(team)} ${team}`;
}

function parseScore(value) {
  const normalized = value.trim();
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function updateScore(matchNo, side, value) {
  if (!state.scores[matchNo]) {
    state.scores[matchNo] = { score1: '', score2: '' };
  }
  state.scores[matchNo][side] = value;
  saveState();
  render();
}

function toggleGroupCollapse(group) {
  state.collapsedGroups[group] = !state.collapsedGroups[group];
  saveState();
  render();
}

function computeGroupStandings() {
  const groups = {};
  Object.keys(scheduleData.groups).sort().forEach((group) => {
    groups[group] = scheduleData.groups[group].map((team) => ({
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    }));
  });

  const teamIndex = {};
  Object.entries(groups).forEach(([group, rows]) => {
    rows.forEach((row, index) => {
      teamIndex[row.team] = { group, index };
    });
  });

  scheduleData.groupMatches.forEach((match) => {
    const score1 = parseScore(state.scores[match.matchNo]?.score1 || '');
    const score2 = parseScore(state.scores[match.matchNo]?.score2 || '');
    if (score1 === null || score2 === null) return;

    const teamA = teamIndex[match.team1];
    const teamB = teamIndex[match.team2];
    if (!teamA || !teamB) return;

    const rowA = groups[teamA.group][teamA.index];
    const rowB = groups[teamB.group][teamB.index];
    rowA.played += 1;
    rowB.played += 1;
    rowA.gf += score1;
    rowA.ga += score2;
    rowB.gf += score2;
    rowB.ga += score1;
    rowA.gd = rowA.gf - rowA.ga;
    rowB.gd = rowB.gf - rowB.ga;

    if (score1 > score2) {
      rowA.wins += 1;
      rowA.points += 3;
      rowB.losses += 1;
    } else if (score1 < score2) {
      rowB.wins += 1;
      rowB.points += 3;
      rowA.losses += 1;
    } else {
      rowA.draws += 1;
      rowB.draws += 1;
      rowA.points += 1;
      rowB.points += 1;
    }
  });

  const rankings = {};
  Object.entries(groups).forEach(([group, rows]) => {
    rankings[group] = [...rows].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  });

  const totalGroups = Object.keys(scheduleData.groups).length;
  const groupsCompleteCount = Object.keys(rankings).filter(g => isGroupComplete(g)).length;
  const allGroupsComplete = groupsCompleteCount === totalGroups;

  const thirdPlaceTeams = Object.entries(rankings).map(([group, rows]) => ({
    group: group,
    team: rows[2].team,
    points: rows[2].points,
    gd: rows[2].gd,
    gf: rows[2].gf,
    ga: rows[2].ga,
  })).sort((a, b) => {
    // Official ranking tie-breakers + Alphabetical fallback
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  // A team is tentatively qualified if it's in the top 8.
  // We calculate this for the UI markers even if not complete.
  const qualifyingThirds = thirdPlaceTeams.slice(0, 8);
  const thirdPlaceAssignments = allocateThirdPlaceTeams(qualifyingThirds);

  return { rankings, thirdPlaceTeams, thirdPlaceAssignments, allGroupsComplete };
}

/**
 * Assigns 8 qualifying third-place teams to their 8 bracket slots.
 * Using a simple backtracking matching algorithm to ensure constraints are met.
 */
function allocateThirdPlaceTeams(qualifiers) {
  if (qualifiers.length < 8) return {};

  const slots = [
    { matchNo: 74, groups: 'ABCDF' },
    { matchNo: 77, groups: 'CDFGH' },
    { matchNo: 79, groups: 'CEFHI' },
    { matchNo: 80, groups: 'EHIJK' },
    { matchNo: 81, groups: 'BEFIJ' },
    { matchNo: 82, groups: 'AEHIJ' },
    { matchNo: 85, groups: 'EFGIJ' },
    { matchNo: 87, groups: 'DEIJL' }
  ];

  const assignment = {};
  const usedTeams = new Set();

  function backtrack(slotIdx) {
    if (slotIdx === slots.length) return true;

    const slot = slots[slotIdx];
    for (const teamObj of qualifiers) {
      if (usedTeams.has(teamObj.team)) continue;
      if (slot.groups.includes(teamObj.group)) {
        assignment[slot.matchNo] = teamObj;
        usedTeams.add(teamObj.team);
        if (backtrack(slotIdx + 1)) return true;
        usedTeams.delete(teamObj.team);
        delete assignment[slot.matchNo];
      }
    }
    return false;
  }

  // If no perfect matching found (unlikely with FIFA distributions), fallback to greedily filling
  if (!backtrack(0)) {
    console.warn("Could not find perfect 3rd place matching, falling back to greedy.");
    const used = new Set();
    slots.forEach(slot => {
      const match = qualifiers.find(t => !used.has(t.team) && slot.groups.includes(t.group));
      if (match) {
        assignment[slot.matchNo] = match;
        used.add(match.team);
      }
    });
  }

  return assignment;
}

// Returns true only when every match in a given group has both scores entered
function isGroupComplete(group) {
  return scheduleData.groupMatches
    .filter((m) => m.pos1 && m.pos1[0] === group)
    .every((m) => {
      const s1 = parseScore(state.scores[m.matchNo]?.score1 || '');
      const s2 = parseScore(state.scores[m.matchNo]?.score2 || '');
      return s1 !== null && s2 !== null;
    });
}

function resolveTeamPosition(position, rankings, thirdPlaceTeams, knockoutMap, requireComplete = false, matchNo = null, assignments = {}) {
  if (!position) return { name: 'TBD', note: 'TBD' };

  if (position.startsWith('1') || position.startsWith('2')) {
    const group = position.slice(1);
    if (requireComplete && !isGroupComplete(group)) return { name: 'TBD', note: 'TBD' };
    const groupRows = rankings[group];
    if (!groupRows) return { name: position, note: 'TBD' };
    const idx = Number(position[0]) - 1;
    return groupRows[idx] ? { name: groupRows[idx].team, note: `${position}` } : { name: position, note: 'TBD' };
  }

  if (position.startsWith('3-')) {
    // Always show numbered "Best 3rd place" labels – never resolve to actual teams
    const slotMatchNos = [74, 77, 79, 80, 81, 82, 85, 87];
    const slotIndex = slotMatchNos.indexOf(matchNo);
    const label = slotIndex >= 0 ? `Best 3rd place ${'#'}${slotIndex + 1}` : 'Best 3rd place #';
    return { name: 'TBD', note: label };
  }

  if (position.startsWith('W') || position.startsWith('RU')) {
    const type = position.startsWith('RU') ? 'runner' : 'winner';
    const matchNoRef = Number(position.replace(/[WRU]/g, ''));
    const result = knockoutMap[matchNoRef];
    if (!result) return { name: position, note: 'TBD' };
    if (type === 'winner') {
      return { name: result.winner, note: `Winner ${matchNoRef}` };
    }
    return { name: result.runner, note: `Runner ${matchNoRef}` };
  }

  return { name: position, note: position };
}

function computeKnockoutResults(rankings, thirdPlaceTeams, assignments) {
  const map = {};
  scheduleData.knockoutMatches.forEach((match) => {
    const score1 = parseScore(state.scores[match.matchNo]?.score1 || '');
    const score2 = parseScore(state.scores[match.matchNo]?.score2 || '');
    if (score1 === null || score2 === null) return;
    let name1 = match.team1;
    let name2 = match.team2;

    if (!name1) {
      name1 = resolveTeamPosition(match.pos1, rankings, thirdPlaceTeams, map, false, match.matchNo, assignments).name;
    }
    if (!name2) {
      name2 = resolveTeamPosition(match.pos2, rankings, thirdPlaceTeams, map, false, match.matchNo, assignments).name;
    }

    if (!name1 || !name2) return;

    if (score1 > score2) {
      map[match.matchNo] = { winner: name1, runner: name2 };
    } else if (score1 < score2) {
      map[match.matchNo] = { winner: name2, runner: name1 };
    } else {
      map[match.matchNo] = { winner: name1, runner: name2 };
    }
  });
  return map;
}

function buildScoreInputs(match) {
  const scoreData = state.scores[match.matchNo] || { score1: '', score2: '' };
  const isApiSourced = isApiSourcedMatch(match.matchNo);
  const disabledAttr = isApiSourced ? 'disabled' : '';
  const apiBadge = isApiSourced ? '<span class="api-badge">Live</span>' : '';
  return `
    <div class="match-score">
      <input class="score-input" type="number" min="0" value="${scoreData.score1}" data-match="${match.matchNo}" data-side="score1" ${disabledAttr} />
      <span class="match-vs">vs</span>
      <input class="score-input" type="number" min="0" value="${scoreData.score2}" data-match="${match.matchNo}" data-side="score2" ${disabledAttr} />
      ${apiBadge}
    </div>
  `;
}

function buildGroupCard(group, teams, rankings) {
  const rows = rankings[group] || teams.map((team) => ({ team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 }));
  return `
    <article class="group-card">
      <div class="group-card-header">
        <div>
          <h3>Group ${group}</h3>
          <div class="group-label">Teams</div>
        </div>
      </div>
      <div class="match-list">
        <table class="group-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Pts</th>
              <th>GD</th>
              <th>GF</th>
              <th>GA</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
            <tr>
              <td class="team-label">${formatFlag(row.team)} ${row.team}</td>
              <td>${row.points}</td>
              <td>${row.gd}</td>
              <td>${row.gf}</td>
              <td>${row.ga}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function buildGroupMatches(group, matches) {
  return matches
    .filter((match) => match.pos1 && match.pos1[0] === group)
    .sort((a, b) => a.matchNo - b.matchNo)
    .map((match) => {
      const { dateLabel, timeLabel, tzAbbr } = getMatchDateTimeLabel(match.matchNo, match.venue, match.date, match.time);
      const timeDisplay = tzAbbr ? `${timeLabel} ${tzAbbr}` : timeLabel;
      const score1Val = state.scores[match.matchNo]?.score1 ?? '';
      const score2Val = state.scores[match.matchNo]?.score2 ?? '';
      const isApiSourced = isApiSourcedMatch(match.matchNo);
      const disabledAttr = isApiSourced ? 'disabled' : '';
      const apiBadge = isApiSourced ? '<span class="api-badge-small">Full-time</span>' : '';
      return `
      <div class="match-card match-compact clickable" data-matchno="${match.matchNo}">
        <div class="match-top">
          <div class="team-left">
            <div class="team-flag-name">${formatFlag(match.team1)}<div class="team-name">${getTeamFifaCode(match.team1)}</div></div>
          </div>
          <div class="score-left">
            <input class="score-input" type="number" min="0" value="${score1Val}" data-match="${match.matchNo}" data-side="score1" ${disabledAttr} />
          </div>
          <div class="vs">vs</div>
          <div class="score-right">
            <input class="score-input" type="number" min="0" value="${score2Val}" data-match="${match.matchNo}" data-side="score2" ${disabledAttr} />
          </div>
          <div class="team-right">
            <div class="team-flag-name">${formatFlag(match.team2)}<div class="team-name">${getTeamFifaCode(match.team2)}</div></div>
          </div>
        </div>

        <div class="match-mid">${dateLabel} · ${timeDisplay} ${apiBadge}</div>
        <div class="match-bottom">
          <div class="stadium-name">${getStadiumName(match.venue) || ''}</div>
          <div class="city-name">${getCityName(match.venue) || ''}</div>
        </div>
        <div class="match-number">Match ${match.matchNo}</div>
      </div>
    `;
    }).join('');
}

let selectedMatchNo = null;

function findMatchByNo(matchNo) {
  matchNo = Number(matchNo);
  const all = [...scheduleData.groupMatches, ...scheduleData.knockoutMatches];
  return all.find((m) => Number(m.matchNo) === matchNo) || null;
}

function renderMatchDetail(matchNo) {
  const container = matchDetailElement;
  if (!container) return;
  const match = findMatchByNo(matchNo);
  if (!match) {
    container.querySelector('.match-detail-inner').innerHTML = `<div class="placeholder-detail"><h3>Select a match</h3><p>Click any match to view stadium, date/time and enter scores in the detail panel.</p></div>`;
    return;
  }

  const score1 = state.scores[match.matchNo]?.score1 ?? '';
  const score2 = state.scores[match.matchNo]?.score2 ?? '';
  const { dateLabel, timeLabel, fullDate, fullTime } = getMatchDateTimeLabel(match.matchNo, match.venue, match.date, match.time);

  const teamA = match.team1 ? { name: match.team1 } : resolveTeamPosition(match.pos1 || '', currentRankings, currentThirdPlacers, {}, false, match.matchNo, currentAssignments);
  const teamB = match.team2 ? { name: match.team2 } : resolveTeamPosition(match.pos2 || '', currentRankings, currentThirdPlacers, {}, false, match.matchNo, currentAssignments);

  const apiTime = getMatchTime(match.matchNo, match.venue);
  const timezoneDisplay = apiTime
    ? `Your time (${apiTime.localTimezone})`
    : `Local time: ${getLocalTimezone()}`;

  container.querySelector('.match-detail-inner').innerHTML = `
    <div class="match-detail-top">
      <div class="match-title">Match ${match.matchNo}</div>
      <h3>${teamA.name} vs ${teamB.name}</h3>
      <div class="meta">${dateLabel} · ${timeLabel} · ${getVenueDisplayName(match.venue) || ''}</div>
      <div class="timezone-info">${timezoneDisplay}</div>
    </div>
    <div class="team-row">
      <div class="team-left">
        <div class="team-label">${toTeamLabel(teamA.name)}</div>
      </div>
      <div class="big-score">
        <input class="score-input" type="number" min="0" value="${score1}" data-match="${match.matchNo}" data-side="score1" />
        <div class="match-vs">-</div>
        <input class="score-input" type="number" min="0" value="${score2}" data-match="${match.matchNo}" data-side="score2" />
      </div>
      <div class="team-right">
        <div class="team-label">${toTeamLabel(teamB.name)}</div>
      </div>
    </div>
    <div class="meta">Stadium: ${getVenueDisplayName(match.venue) || 'TBD'}</div>
  `;

  // attach input listeners inside detail
  container.querySelectorAll('.score-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const matchNo = Number(event.target.dataset.match);
      const side = event.target.dataset.side;
      updateScore(matchNo, side, event.target.value);
    });
  });
}

function renderThirdPlaceStandings(thirdPlaceTeams) {
  const qualifyingTeams = thirdPlaceTeams.slice(0, 8);
  const nonQualifyingTeams = thirdPlaceTeams.slice(8);

  return `
    <div class="third-place-standings">
      <div class="third-place-header">
        <div class="third-place-title">
          <h3>Best 3rd Place Rankings</h3>
          <p>Top 8 teams advance to the Round of 32</p>
        </div>
        <div class="third-place-stats">
          <div class="stat-qualifying">
            <span class="stat-number">${qualifyingTeams.length}</span>
            <span class="stat-label">Qualifying</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-waiting">
            <span class="stat-number">${nonQualifyingTeams.length}</span>
            <span class="stat-label">Waiting</span>
          </div>
        </div>
      </div>
      
      <div class="third-place-content">
        <div class="qualifying-section">
          <div class="section-badge qualifying-badge">
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Qualifying for Round of 32
          </div>
          <div class="third-place-grid qualifying-grid">
            ${qualifyingTeams.map((entry, idx) => `
              <div class="third-place-card qualifying-card" data-rank="${idx + 1}">
                <div class="card-rank">${idx + 1}</div>
                <div class="card-team">
                  ${formatFlag(entry.team)}
                  <span class="team-name">${entry.team}</span>
                </div>
                <div class="card-stats">
                  <div class="stat">
                    <span class="stat-value">${entry.points}</span>
                    <span class="stat-name">Pts</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">${entry.gd > 0 ? '+' : ''}${entry.gd}</span>
                    <span class="stat-name">GD</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">${entry.gf}</span>
                    <span class="stat-name">GF</span>
                  </div>
                </div>
                <div class="card-group">Group ${entry.group}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${nonQualifyingTeams.length > 0 ? `
        <div class="cutoff-divider">
          <span class="cutoff-line"></span>
          <span class="cutoff-text">Cutoff Line</span>
          <span class="cutoff-line"></span>
        </div>
        
        <div class="waiting-section">
          <div class="section-badge waiting-badge">
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Waiting for Results
          </div>
          <div class="third-place-grid waiting-grid">
            ${nonQualifyingTeams.map((entry, idx) => `
              <div class="third-place-card waiting-card" data-rank="${qualifyingTeams.length + idx + 1}">
                <div class="card-rank">${qualifyingTeams.length + idx + 1}</div>
                <div class="card-team">
                  ${formatFlag(entry.team)}
                  <span class="team-name">${entry.team}</span>
                </div>
                <div class="card-stats">
                  <div class="stat">
                    <span class="stat-value">${entry.points}</span>
                    <span class="stat-name">Pts</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">${entry.gd > 0 ? '+' : ''}${entry.gd}</span>
                    <span class="stat-name">GD</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">${entry.gf}</span>
                    <span class="stat-name">GF</span>
                  </div>
                </div>
                <div class="card-group">Group ${entry.group}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderGroups(rankings, thirdPlaceTeams) {
  const qualifyingThirdTeams = thirdPlaceTeams.slice(0, 8).map(t => t.team);

  const groupHtml = Object.keys(scheduleData.groups).sort().map((group) => {
    const collapsed = state.collapsedGroups[group] ?? true;
    const groupRankings = rankings[group];

    return `
      <div class="group-card group-${group} ${collapsed ? 'collapsed' : ''}" data-group="${group}">
        <div class="group-card-header">
          <div>
            <h3>Group ${group}</h3>
            <p>${scheduleData.groups[group].length} teams</p>
            <div class="group-flags">
              ${scheduleData.groups[group].map((team) => formatFlag(team)).join('')}
            </div>
          </div>
          <div class="header-actions">
            <div class="group-label">${group}</div>
            <button class="group-toggle" data-group="${group}" aria-expanded="${!collapsed}" aria-label="${collapsed ? 'Expand group' : 'Collapse group'}">
              <span class="material-symbols-outlined">${collapsed ? 'expand_more' : 'expand_less'}</span>
            </button>
          </div>
        </div>
        <div class="group-panel-wrapper">
          <div class="group-panel">
            <div class="group-separator">Standings</div>
            <div class="match-list">
              <table class="group-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Pts</th>
                    <th>GD</th>
                    <th>GF</th>
                    <th>GA</th>
                  </tr>
                </thead>
                <tbody>
                  ${groupRankings.map((row, idx) => {
      let advClass = '';
      if (idx < 2) advClass = 'advancement-direct';
      else if (idx === 2 && qualifyingThirdTeams.includes(row.team)) advClass = 'advancement-best-third';

      return `
                    <tr class="${advClass}">
                      <td class="team-label">
                        <span class="adv-indicator"></span>
                        ${formatFlag(row.team)} ${row.team}
                      </td>
                      <td>${row.points}</td>
                      <td>${row.gd}</td>
                      <td>${row.gf}</td>
                      <td>${row.ga}</td>
                    </tr>
                    `;
    }).join('')}
                </tbody>
              </table>
            </div>
            <div class="group-separator">Matches</div>
            <div class="match-list">
              ${buildGroupMatches(group, scheduleData.groupMatches)}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const legendHtml = `
    <div class="advancement-legend">
      <div class="legend-item">
        <span class="legend-dot advancement-direct"></span>
        <span class="legend-text">Top 2: Direct Qualification</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot advancement-best-third"></span>
        <span class="legend-text">Best 8 Third-place Teams</span>
      </div>
    </div>
  `;

  const thirdPlaceHtml = renderThirdPlaceStandings(thirdPlaceTeams);
  groupListElement.innerHTML = groupHtml + legendHtml + thirdPlaceHtml;

  groupListElement.querySelectorAll('.score-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const matchNo = event.target.dataset.match;
      const side = event.target.dataset.side;
      updateScore(Number(matchNo), side, event.target.value);
    });
  });

  groupListElement.querySelectorAll('.group-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      const group = event.currentTarget.dataset.group;
      toggleGroupCollapse(group);
    });
  });
}

function buildMatchCardHtml(match, stage, rankings, thirdPlaceTeams, knockoutMap, assignments) {
  const isR32 = stage === 'r32';
  const teamA = match.team1 ? { name: match.team1, note: '' } : resolveTeamPosition(match.pos1, rankings, thirdPlaceTeams, knockoutMap, isR32, match.matchNo, assignments);
  const teamB = match.team2 ? { name: match.team2, note: '' } : resolveTeamPosition(match.pos2, rankings, thirdPlaceTeams, knockoutMap, isR32, match.matchNo, assignments);
  const scoreA = state.scores[match.matchNo]?.score1 ?? '';
  const scoreB = state.scores[match.matchNo]?.score2 ?? '';
  const isTBDA = teamA.name === 'TBD' || teamA.note === 'TBD' || teamA.note.includes('Waiting');
  const isTBDB = teamB.name === 'TBD' || teamB.note === 'TBD' || teamB.note.includes('Waiting');
  const isApiSourced = isApiSourcedMatch(match.matchNo);
  const disabledAttr = isTBDA || isTBDB || isApiSourced ? 'disabled' : '';
  const apiBadge = isApiSourced ? '<span class="api-badge-bracket">Live</span>' : '';
  const { dateLabel, timeLabel, tzAbbr } = getMatchDateTimeLabel(match.matchNo, match.venue, match.date, match.time);
  const timeDisplay = tzAbbr ? `${timeLabel} ${tzAbbr}` : timeLabel;
  return `
    <div class="bracket-match-node" data-matchno="${match.matchNo}" data-stage="${stage}">
      <div class="bracket-match-inner">
        <div class="bracket-team ${isTBDA ? 'placeholder' : ''}">
          <div class="bracket-team-info">
            ${isTBDA ? '<span class="team-flag">🏳️</span>' : formatFlag(teamA.name)}
            <span class="bracket-team-name">
              ${isTBDA ? (teamA.name === 'TBD' ? (teamA.note || match.pos1) : teamA.name) : getTeamFifaCode(teamA.name)}
            </span>
          </div>
          <input class="score-input bracket-score" type="number" min="0" value="${scoreA}" data-match="${match.matchNo}" data-side="score1" ${disabledAttr} />
        </div>
        <div class="bracket-team ${isTBDB ? 'placeholder' : ''}">
          <div class="bracket-team-info">
            ${isTBDB ? '<span class="team-flag">🏳️</span>' : formatFlag(teamB.name)}
            <span class="bracket-team-name">
              ${isTBDB ? (teamB.name === 'TBD' ? (teamB.note || match.pos2) : teamB.name) : getTeamFifaCode(teamB.name)}
            </span>
          </div>
          <input class="score-input bracket-score" type="number" min="0" value="${scoreB}" data-match="${match.matchNo}" data-side="score2" ${disabledAttr} />
        </div>
      </div>
      <div class="bracket-match-meta">
        <span class="bracket-datetime">${dateLabel} · ${timeDisplay} ${apiBadge}</span>
        <div class="bracket-venue">
          <div class="bracket-stadium-name">${getStadiumName(match.venue) || ''}</div>
          <div class="bracket-city-name">${getCityName(match.venue) || ''}</div>
        </div>
      </div>
      <div class="bracket-match-number">M${match.matchNo}</div>
    </div>
  `;
}

function buildStageHtml(stage, matches, rankings, thirdPlaceTeams, knockoutMap, assignments) {
  const matchCards = matches.map(m => buildMatchCardHtml(m, stage, rankings, thirdPlaceTeams, knockoutMap, assignments));

  // Group matches into pairs for bracket connectors (skip for third/final)
  let matchesHtml;
  if (stage === 'third' || stage === 'final') {
    matchesHtml = matchCards.join('');
  } else {
    matchesHtml = '';
    for (let i = 0; i < matchCards.length; i += 2) {
      if (i + 1 < matchCards.length) {
        matchesHtml += `<div class="bracket-pair">${matchCards[i]}${matchCards[i + 1]}</div>`;
      } else {
        matchesHtml += matchCards[i];
      }
    }
  }

  return `
    <div class="bracket-stage bracket-stage-${stage}">
      <div class="bracket-stage-header">
        <span class="bracket-stage-label">${stageLabels[stage]}</span>
        <span class="bracket-stage-count">${matches.length} matches</span>
      </div>
      <div class="bracket-stage-matches">
        ${matchesHtml}
      </div>
    </div>
  `;
}

function renderBracket(rankings, thirdPlaceTeams, assignments) {
  const grouped = scheduleData.knockoutMatches.reduce((acc, match) => {
    acc[match.stage] = acc[match.stage] || [];
    acc[match.stage].push(match);
    return acc;
  }, {});

  const stageOrder = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];
  let html = '';
  const resultMap = computeKnockoutResults(rankings, thirdPlaceTeams, assignments);

  stageOrder.forEach((stage) => {
    if (!grouped[stage]?.length) return;
    html += buildStageHtml(stage, grouped[stage].sort((a, b) => a.matchNo - b.matchNo), rankings, thirdPlaceTeams, resultMap, assignments);
  });

  bracketContainer.innerHTML = html;

  bracketContainer.querySelectorAll('.score-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const matchNo = event.target.dataset.match;
      const side = event.target.dataset.side;
      updateScore(Number(matchNo), side, event.target.value);
    });
  });
}

function buildExportCsv() {
  const header = ['Stage', 'Match No', 'Team 1', 'Team 2', 'Score 1', 'Score 2', 'Venue', 'Date', 'Time'];
  const rows = [];
  scheduleData.groupMatches.forEach((match) => {
    const score1 = state.scores[match.matchNo]?.score1 ?? '';
    const score2 = state.scores[match.matchNo]?.score2 ?? '';
    const dateLabel = new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    rows.push([
      'Group',
      match.matchNo,
      match.team1 || 'TBD',
      match.team2 || 'TBD',
      score1,
      score2,
      match.venue || '',
      dateLabel,
      match.time || '',
    ]);
  });

  scheduleData.knockoutMatches.forEach((match) => {
    const score1 = state.scores[match.matchNo]?.score1 ?? '';
    const score2 = state.scores[match.matchNo]?.score2 ?? '';
    const dateLabel = match.date ? new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    rows.push([
      stageLabels[match.stage] || match.stage,
      match.matchNo,
      match.team1 || '',
      match.team2 || '',
      score1,
      score2,
      match.venue || '',
      dateLabel,
      match.time || '',
    ]);
  });

  const csvRows = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  return csvRows.join('\n');
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

let currentRankings = null;
let currentThirdPlacers = null;
let currentAssignments = {};

function render() {
  const { rankings, thirdPlaceTeams, thirdPlaceAssignments } = computeGroupStandings();
  currentRankings = rankings;
  currentThirdPlacers = thirdPlaceTeams;
  currentAssignments = thirdPlaceAssignments;
  renderGroups(rankings, thirdPlaceTeams);
  renderBracket(rankings, thirdPlaceTeams, thirdPlaceAssignments);
}

// Initialize Live API features
document.addEventListener('DOMContentLoaded', () => {
  initLiveApi();
  startAutoRefresh();
  // Initial fetch on page load
  fetchLiveScores();
});

render();
