const STORAGE_KEY = 'wc2026Scoreboard';
const state = {
  scores: {},
  collapsedGroups: {},
  lastApiUpdate: null,
  apiSourcedMatches: {}, // Track which matches have scores from API
  apiMatchTimes: {}, // Store API match times (UTC) for timezone conversion
  liveMatches: {}, // Track which matches are currently live
  finishedMatches: {}, // Track which matches are finished from API
  apiScorers: {}, // Store scorer data from API { matchNo: { home: [...], away: [...] } }
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
  // Map from API name to full database team name
};

// Map from API name to full team name used in wcPlayerDatabase
const apiToDbTeamName = {
  'Mexico': 'Mexico',
  'South Africa': 'South Africa',
  'South Korea': 'Rep. of Korea',
  'Czech Republic': 'Czechia',
  'Canada': 'Canada',
  'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
  'United States': 'United States',
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
  'Cape Verde': 'Cabo Verde',
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
  'Democratic Republic of the Congo': 'Congo DR',
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

// Helper function to format venue local time to user\'s local machine timezone
function formatApiTime(apiLocalDate, venue) {
  if (!apiLocalDate) return null;

  // Parse the API date format: "06/11/2026 13:00"
  const [datePart, timePart] = apiLocalDate.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Get the venue\'s timezone (default to US Eastern if unknown)
  const venueTimezone = venueTimezones[venue] || 'America/New_York';

  // Get user\'s local machine timezone
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

  // Get short timezone abbreviation for user\'s timezone
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: localTimezone,
    timeZoneName: 'short'
  });
  const tzParts = tzFormatter.formatToParts(correctUTC);
  const tzAbbr = tzParts.find(p => p.type === 'timeZoneName')?.value || '';

  // Create formatters for the user\'s local timezone
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

  // Format the corrected UTC timestamp in user\'s local timezone
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
  // Fallback to original schedule data (stored in local venue time)
  if (fallbackDate) {
    // Parse the schedule date/time which is stored as local venue time
    // The date string format is "2026-06-14T05:00:00" (local time at venue) or "2026-06-14" (date only)
    const dateStr = fallbackDate.endsWith('Z') ? fallbackDate.slice(0, -1) : fallbackDate;
    
    // Get venue timezone for parsing the schedule data
    const venueTimezone = venueTimezones[venue] || 'America/New_York';
    
    // Get user\'s browser timezone for display
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Parse the local venue date/time components
    // Handle both formats: "2026-06-14T05:00:00" and "2026-06-14"
    let year, month, day, hours, minutes;
    
    if (dateStr.includes('T')) {
      // Full format with time: "2026-06-14T05:00:00"
      const [datePart, timePart] = dateStr.split('T');
      [year, month, day] = datePart.split('-');
      const timeParts = timePart.split(':');
      hours = parseInt(timeParts[0]) || 0;
      minutes = parseInt(timeParts[1]) || 0;
    } else {
      // Date-only format: "2026-06-14"
      [year, month, day] = dateStr.split('-');
      // Parse time from fallbackTime parameter (format "HH:MM")
      if (fallbackTime && fallbackTime.includes(':')) {
        const timeParts = fallbackTime.split(':');
        hours = parseInt(timeParts[0]) || 0;
        minutes = parseInt(timeParts[1]) || 0;
      } else {
        hours = 0;
        minutes = 0;
      }
    }
    
    // Convert venue local time to UTC using the correct timezone
    // Create a formatter to check what UTC time corresponds to the venue local time
    const venueFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: venueTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Find the correct UTC timestamp that corresponds to the venue local time
    let correctUTC = null;
    for (let offsetMinutes = -720; offsetMinutes <= 840; offsetMinutes += 15) {
      const testUTC = new Date(Date.UTC(year, parseInt(month) - 1, parseInt(day), hours, minutes) - offsetMinutes * 60 * 1000);
      const parts = venueFormatter.formatToParts(testUTC);
      const partMap = {};
      parts.forEach(p => partMap[p.type] = parseInt(p.value));
      
      if (partMap.month === parseInt(month) && partMap.day === parseInt(day) &&
        partMap.hour === hours && partMap.minute === minutes) {
        correctUTC = testUTC;
        break;
      }
    }
    
    if (!correctUTC) {
      correctUTC = new Date(Date.UTC(year, parseInt(month) - 1, parseInt(day), hours, minutes));
    }
    
    // Get user\'s timezone abbreviation
    const userTzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      timeZoneName: 'short'
    });
    const userTzParts = userTzFormatter.formatToParts(correctUTC);
    const userTzAbbr = userTzParts.find(p => p.type === 'timeZoneName')?.value || '';
    
    // Format for display - convert UTC to user\'s browser timezone
    const userDateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      month: 'short',
      day: 'numeric'
    });
    const userTimeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const dateLabel = userDateFormatter.format(correctUTC);
    const localTimeStr = userTimeFormatter.format(correctUTC);
    
    return {
      dateLabel: dateLabel,
      timeLabel: localTimeStr || '',
      tzAbbr: userTzAbbr,
      fullDate: correctUTC.toLocaleDateString(undefined, { timeZone: userTimezone, weekday: 'short', month: 'short', day: 'numeric' }),
      fullTime: `${localTimeStr} ${userTzAbbr}`
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
const todaysMatchesElement = document.getElementById('todays-matches-list');
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
      state.liveMatches = stored.liveMatches || {};
      state.finishedMatches = stored.finishedMatches || {};
    }
  } catch {
    state.scores = {};
    state.collapsedGroups = {};
    state.apiSourcedMatches = {};
    state.apiMatchTimes = {};
    state.liveMatches = {};
    state.finishedMatches = {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    scores: state.scores,
    collapsedGroups: state.collapsedGroups,
    apiSourcedMatches: state.apiSourcedMatches,
    apiMatchTimes: state.apiMatchTimes,
    liveMatches: state.liveMatches,
    finishedMatches: state.finishedMatches,
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

        // Only update score for live and finished matches (not upcoming)
        const isLiveOrFinished = game.finished === 'TRUE' || game.time_elapsed === 'live';
        
        if (isLiveOrFinished) {
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
        }

        // Check if match is live (not finished, time_elapsed is "live")
        if (game.finished === 'TRUE') {
          // Mark this match as API-sourced and finished
          state.apiSourcedMatches[targetMatch.matchNo] = true;
          state.liveMatches[targetMatch.matchNo] = false;
          state.finishedMatches[targetMatch.matchNo] = true;
        } else if (game.time_elapsed === 'live') {
          // Mark this match as live but NOT finished
          state.liveMatches[targetMatch.matchNo] = true;
          state.apiSourcedMatches[targetMatch.matchNo] = true;
          state.finishedMatches[targetMatch.matchNo] = false;
        } else {
          // Match is not live and not finished (pre-match)
          state.liveMatches[targetMatch.matchNo] = false;
          state.apiSourcedMatches[targetMatch.matchNo] = false;
          state.finishedMatches[targetMatch.matchNo] = false;
        }

        // Parse and store scorer data from API
        if (isLiveOrFinished && (game.home_scorers || game.away_scorers)) {
          try {
            // Helper function to parse the malformed JSON from API (uses single quotes)
            const parseScorers = (scorersStr) => {
              if (!scorersStr || scorersStr === 'null') return [];
              try {
                // First try standard JSON parse
                return JSON.parse(scorersStr);
              } catch {
                // The API returns malformed JSON with single quotes
                // Format: {"Name 90'","Name 45'(p)"}
                // Convert to valid JSON by replacing ' with \" and wrapping array elements properly
                // Extract the array content and parse each element
                const content = scorersStr.replace(/^\{|\}$/g, '');
                const matches = [];
                let current = '';
                let inQuote = false;
                let escapeNext = false;
                
                for (let i = 0; i < content.length; i++) {
                  const char = content[i];
                  if (escapeNext) {
                    current += char;
                    escapeNext = false;
                    continue;
                  }
                  if (char === '\\') {
                    escapeNext = true;
                    current += char;
                    continue;
                  }
                  if (char === '"') {
                    inQuote = !inQuote;
                    current += char;
                  } else if (char === ',' && !inQuote) {
                    // End of element
                    const trimmed = current.trim();
                    if (trimmed) {
                      // Remove surrounding quotes and unescape
                      const clean = trimmed.replace(/^"|"$/g, '').replace(/\\"/g, '"');
                      matches.push(clean);
                    }
                    current = '';
                  } else {
                    current += char;
                  }
                }
                // Don\'t forget the last element
                if (current.trim()) {
                  const clean = current.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                  matches.push(clean);
                }
                return matches;
              }
            };
            
            const homeScorersRaw = parseScorers(game.home_scorers);
            const awayScorersRaw = parseScorers(game.away_scorers);
            
            // Store scorer data with API team names for proper matching
            state.apiScorers[targetMatch.matchNo] = {
              home: homeScorersRaw,
              away: awayScorersRaw,
              homeTeamApiName: homeApiName,                    // e.g., "Argentina"
              awayTeamApiName: awayApiName,                    // e.g., "Brazil"
              homeTeamDbName: apiToDbTeamName[homeApiName] || homeApiName,  // e.g., "Argentina"
              awayTeamDbName: apiToDbTeamName[awayApiName] || awayApiName   // e.g., "Brazil"
            };
          } catch (e) {
            // Failed to parse scorers JSON, ignore
            console.warn(`Failed to parse scorers for match ${targetMatch.matchNo}:`, e);
          }
        }
      }
    });

    // Save state if any updates were made (scores, times, or scorers)
    if (updatedCount > 0 || timesUpdated > 0 || games.some(g => g.home_scorers || g.away_scorers)) {
      saveState();
      render();
    }

    state.lastApiUpdate = new Date().toLocaleTimeString();
    updateLiveIndicator(true);
    
    // Update top scorers table with new data
    renderTopScorers();

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

// Helper function to check if a match is currently live
function isLiveMatch(matchNo) {
  return state.liveMatches[matchNo] === true;
}

// Helper function to check if a match is finished (from API)
function isFinishedMatch(matchNo) {
  return state.finishedMatches[matchNo] === true;
}

// Helper function to get scorers for a match
function getMatchScorers(matchNo) {
  return state.apiScorers[matchNo] || { home: [], away: [] };
}

// Helper function to check if a match has scorer data
function hasScorerData(matchNo) {
  const scorers = state.apiScorers[matchNo];
  return scorers && (scorers.home.length > 0 || scorers.away.length > 0);
}

const officialSquadConversions = {
  // Top scorers from API - map to nameOnShirt in database
  'Arling Halnd': 'BRAUT HAALAND',
  'Erling Haaland': 'BRAUT HAALAND',
  'Liv Avstigard': 'ØSTIGÅRD',
  'Leo Østigård': 'ØSTIGÅRD',
  'Livnl Msi': 'MESSI',
  'Lionel Messi': 'MESSI',
  'K. Mbappé': 'MBAPPE',
  'K. Mbappe': 'MBAPPE',
  'Kylian Mbappé': 'MBAPPE',
  'Kylian Mbappe': 'MBAPPE',
  'B. Barcola': 'BARCOLA',
  'Bradley Barcola': 'BARCOLA',
  'K. Havertz': 'HAVERTZ',
  'Kai Havertz': 'HAVERTZ',
  'J. Musiala': 'MUSIALA',
  'Jamal Musiala': 'MUSIALA',
  'N. Schlotterbeck': 'SCHLOTTERBECK',
  'N. Brown': 'N. BROWN',
  'Felix Nmecha': 'NMECHA',
  'Deniz Undav': 'UNDAV',
  'D. Undav': 'UNDAV',
  'F. Balogun': 'BALOGUN',
  'Folarin Balogun': 'BALOGUN',
  'G. Reyna': 'REYNA',
  'Giovanni Reyna': 'REYNA',
  'D. Bobadilla': 'BOBADILLA',
  'Y. Ayari': 'AYARI',
  'Yasin Ayari': 'AYARI',
  'A. Isak': 'ISAK',
  'Alexander Isak': 'ISAK',
  'V. Gyökeres': 'GYÖKERES',
  'Viktor Gyökeres': 'GYÖKERES',
  'M. Svanberg': 'SVANBERG',
  'Mattias Svanberg': 'SVANBERG',
  'J. Quiñones': 'QUINONES',
  'J. Quinones': 'QUINONES',
  'R. Jiménez': 'JIMENEZ',
  'R. Jimenez': 'JIMENEZ',
  'Raul Jimenez': 'JIMENEZ',
  'I.B. Hwang': 'I.B. HWANG',
  'H.G. Oh': 'H.G. OH',
  'Romano Schmid': 'SCHMID',
  'Rvmanv Ashmid': 'SCHMID',
  'Izn Alarb': 'Y. AL-ARAB',
  'Ali Avlvan': 'Y. AL-ARAB',
  'Yazan Al-Arab': 'Y. AL-ARAB',
  'L. Krejčí': 'L. KREJCI',
  'L. Krejci': 'L. KREJCI',
  'C. Larin': 'LARIN',
  'Cyle Larin': 'LARIN',
  'B. Khoukhi': 'KHOUKHI',
  'Boualem Khoukhi': 'KHOUKHI',
  'Breel Embolo': 'EMBOLO',
  'V. Júnior': 'VINICIUS JR',
  'V. Junior': 'VINICIUS JR',
  'Vinicius Jr': 'VINICIUS JR',
  'I. Saibari': 'SAIBARI',
  'Ismael Saibari': 'SAIBARI',
  'J. McGinn': 'MCGINN',
  'John McGinn': 'MCGINN',
  'Nestory Irankunda': 'IRANKUNDA',
  'C. Metcalfe': 'METCALFE',
  'Connor Metcalfe': 'METCALFE',
  'Virgil van Dijk': 'VAN DIJK',
  'C. Summerville': 'SUMMERVILLE',
  'Crysencio Summerville': 'SUMMERVILLE',
  'K. Nakamura': 'NAKAMURA',
  'Keito Nakamura': 'NAKAMURA',
  'K. Ogawa': 'OGAWA',
  'Koki Ogawa': 'OGAWA',
  'Kōki Ogawa': 'OGAWA',
  'A. Diallo': 'A. DIALLO',
  'Abdoulaye Diallo': 'A. DIALLO',
  'O. Rekik': 'REKIK',
  'Omar Rekik': 'REKIK',
  'Mohamed Hany': 'M. HANY',
  'Emam Ashour': 'M. ASHOUR',
  'Ramin Rezaiian': 'REZAEIAN',
  'Ramin Rezaeian': 'REZAEIAN',
  'Mohammad Mohebi': 'MOHEBI',
  'Elijah Just': 'JUST',
  'Abdulelah Al-Amri': 'AL-AMRI',
  'Maximiliano Araújo': 'ARAUJO',
  'Maximiliano Araujo': 'ARAUJO',
  'I. Mbaye': 'MBAYE',
  'Ibrahim Mbaye': 'MBAYE',
  'Aimn Hsin': 'REGIFE',
  'Jovo Lukić': 'LUKIC',
  'Jovo Lukic': 'LUKIC',
  'Aymen Hussein': 'HUSSEIN',
  // Additional common names
  'Harry Kane': 'KANE',
  'Jude Bellingham': 'BELLINGHAM',
  'Marcus Rashford': 'RASHFORD',
  'Bukayo Saka': 'SAKA',
  'Phil Foden': 'FODEN',
  'Declan Rice': 'RICE',
  'Mohamed Salah': 'M. SALAH',
  'Cristiano Ronaldo': 'RONALDO',
  'Kylian Mbappe': 'MBAPPE',
  // Corrupted API names - garbled by the API
  'Dnil Mvnvz': 'D. MUÑOZ',  // Daniel Muñoz (Colombia)
  'Kalb Iirnki': 'CALEB',      // Caleb Yirenkyi (Ghana)
  // Correct database nameOnShirt values
  'V. Júnior': 'VINI JR.',
  'V. Junior': 'VINI JR.',
  'Vinicius Jr': 'VINI JR.',
};


const officialSquadPlayers = {
  'MASTIL': 'Algeria',
  'MANDI': 'Algeria',
  'ABADA': 'Algeria',
  'TOUGAI': 'Algeria',
  'BELAID': 'Algeria',
  'ZERROUKI': 'Algeria',
  'MAHREZ': 'Algeria',
  'AOUAR': 'Algeria',
  'GHOURI': 'Algeria',
  'CHAIBI': 'Algeria',
  'HADJ MOUSSA': 'Algeria',
  'BENBOUALI': 'Algeria',
  'HADJAM': 'Algeria',
  'BOUDAOUI': 'Algeria',
  'AIT NOURI': 'Algeria',
  'BENBOT': 'Algeria',
  'BELGHALI': 'Algeria',
  'AMOURA': 'Algeria',
  'BENTALEB': 'Algeria',
  'BOULBINA': 'Algeria',
  'BENSEBAINI': 'Algeria',
  'MAZA': 'Algeria',
  'ZIDANE': 'Algeria',
  'TITRAOUI': 'Algeria',
  'GHEDJEMIS': 'Algeria',
  'CHERGUI': 'Algeria',
  'M. ELSHENAWY': 'Egypt',
  'YASSER': 'Egypt',
  'M. HANY': 'Egypt',
  'HOSSAM': 'Egypt',
  'R. RABIAA': 'Egypt',
  'M. ABDELMONEIM': 'Egypt',
  'M. TREZEGUET': 'Egypt',
  'E. ASHOUR': 'Egypt',
  'ABDELKARIM': 'Egypt',
  'M. SALAH': 'Egypt',
  'ZICO': 'Egypt',
  'H. HASSAN': 'Egypt',
  'A. FATOUH': 'Egypt',
  'H. FATHY': 'Egypt',
  'K. HAFEZ': 'Egypt',
  'M. SOLIMAN': 'Egypt',
  'M. LASHIN': 'Egypt',
  'DONGA': 'Egypt',
  'M. ATTIA': 'Egypt',
  'I. ADEL': 'Egypt',
  'M. SABER': 'Egypt',
  'MARMOUSH': 'Egypt',
  'SHOUBIR': 'Egypt',
  'T. ALAA': 'Egypt',
  'ZIZO': 'Egypt',
  'M. ALAA': 'Egypt',
  'BONO': 'Morocco',
  'HAKIMI': 'Morocco',
  'MAZRAOUI': 'Morocco',
  'AMRABAT': 'Morocco',
  'AGUERD': 'Morocco',
  'BOUADDI': 'Morocco',
  'TALBI': 'Morocco',
  'OUAHI': 'Morocco',
  'RAHIMI': 'Morocco',
  'BRAHIM': 'Morocco',
  'SAIBARI': 'Morocco',
  'EL KAJOUI': 'Morocco',
  'EL OUAHDI': 'Morocco',
  'ISSA': 'Morocco',
  'EL MOURABET': 'Morocco',
  'YASSINE': 'Morocco',
  'EZZALZOULI': 'Morocco',
  'RIAD': 'Morocco',
  'BELAMMARI': 'Morocco',
  'EL KAABI': 'Morocco',
  'AMAIMOUNI': 'Morocco',
  'TAGNAOUTI': 'Morocco',
  'EL KHANNOUSS': 'Morocco',
  'EL AYNAOUI': 'Morocco',
  'HALHAL': 'Morocco',
  'SALAH-EDDINE': 'Morocco',
  'WILLIAMS': 'South Africa',
  'MATULUDI': 'South Africa',
  'NDAMANE': 'South Africa',
  'MOKOENA': 'South Africa',
  'MBATHA': 'South Africa',
  'MODIBA': 'South Africa',
  'APPOLLIS': 'South Africa',
  'MOREMI': 'South Africa',
  'FOSTER': 'South Africa',
  'MOFOKENG': 'South Africa',
  'ZWANE': 'South Africa',
  'MASEKO': 'South Africa',
  'SITHOLE': 'South Africa',
  'MBOKAZI': 'South Africa',
  'RAYNERS': 'South Africa',
  'CHAINE': 'South Africa',
  'MAKGOPA': 'South Africa',
  'KABINI': 'South Africa',
  'SIBISI': 'South Africa',
  'MUDAU': 'South Africa',
  'OKON': 'South Africa',
  'GOSS': 'South Africa',
  'ADAMS': 'South Africa',
  'MAKHANYA': 'South Africa',
  'SEBELEBELE': 'South Africa',
  'CROSS': 'South Africa',
  'CHAMAKH': 'Tunisia',
  'ABDI': 'Tunisia',
  'TALBI': 'Tunisia',
  'REKIK': 'Tunisia',
  'AROUS': 'Tunisia',
  'BRONN': 'Tunisia',
  'ACHOURI': 'Tunisia',
  'SAAD': 'Tunisia',
  'MASTOURI': 'Tunisia',
  'MEJBRI': 'Tunisia',
  'GHARBI': 'Tunisia',
  'BEN OUANES': 'Tunisia',
  'KHEDIRA': 'Tunisia',
  'AYARI': 'Tunisia',
  'BELHADJ MAHMOUD': 'Tunisia',
  'DAHMEN': 'Tunisia',
  'SKHIRI': 'Tunisia',
  'ELLOUMI': 'Tunisia',
  'CHAOUAT': 'Tunisia',
  'VALERY': 'Tunisia',
  'BEN HMIDA': 'Tunisia',
  'BEN HSAN': 'Tunisia',
  'NEFFATI': 'Tunisia',
  'CHIKHAOUI': 'Tunisia',
  'SLIMANE': 'Tunisia',
  'TOUNEKTI': 'Tunisia',
  'Y. DIOUF': 'Senegal',
  'SARR': 'Senegal',
  'KOULIBALY': 'Senegal',
  'SECK': 'Senegal',
  'GANA': 'Senegal',
  'P.I. CISS': 'Senegal',
  'DIAO': 'Senegal',
  'LAMINE': 'Senegal',
  'B. DIENG': 'Senegal',
  'MANÉ': 'Senegal',
  'JACKSON': 'Senegal',
  'CHERIF': 'Senegal',
  'NDIAYE': 'Senegal',
  'JAKOBS': 'Senegal',
  'KRÉPIN': 'Senegal',
  'MENDY': 'Senegal',
  'P.M. SARR': 'Senegal',
  'SARR': 'Senegal',
  'NIAKHATE': 'Senegal',
  'MBAYE': 'Senegal',
  'H. DIARRA': 'Senegal',
  'BARA': 'Senegal',
  'DIAW': 'Senegal',
  'A. MENDY': 'Senegal',
  'DIOUF': 'Senegal',
  'GUEYE': 'Senegal',
  'ZIGI': 'Ghana',
  'SEIDU': 'Ghana',
  'CALEB': 'Ghana',
  'ADJETEY': 'Ghana',
  'THOMAS': 'Ghana',
  'SULEMAN': 'Ghana',
  'FATAWU': 'Ghana',
  'SIBO': 'Ghana',
  'AYEW': 'Ghana',
  'ASANTE': 'Ghana',
  'SEMENYO': 'Ghana',
  'ANANG': 'Ghana',
  'BAAH': 'Ghana',
  'MENSAH': 'Ghana',
  'OWUSU': 'Ghana',
  'ASARE': 'Ghana',
  'BABA': 'Ghana',
  'OPOKU': 'Ghana',
  'WILLIAMS': 'Ghana',
  'BOAKYE': 'Ghana',
  'PEPRAH': 'Ghana',
  'KAMALDEEN': 'Ghana',
  'LUCKASSEN': 'Ghana',
  'NUAMAH': 'Ghana',
  'ADU': 'Ghana',
  'SENEYA': 'Ghana',
  'VOZINHA': 'Cabo Verde',
  'STOPIRA': 'Cabo Verde',
  'BORGES': 'Cabo Verde',
  'LOPES': 'Cabo Verde',
  'LOGAN': 'Cabo Verde',
  'KEVIN L.': 'Cabo Verde',
  'JOVANE': 'Cabo Verde',
  'JOAO PAULO': 'Cabo Verde',
  'BENCHIMOL': 'Cabo Verde',
  'MONTEIRO': 'Cabo Verde',
  'RODRIGUES': 'Cabo Verde',
  'MARCIO': 'Cabo Verde',
  'LOPES CABRAL': 'Cabo Verde',
  'D. DUARTE': 'Cabo Verde',
  'DUARTE': 'Cabo Verde',
  'Y. SEMEDO': 'Cabo Verde',
  'SEMEDO': 'Cabo Verde',
  'ARCANJO': 'Cabo Verde',
  'LIVRAMENTO': 'Cabo Verde',
  'RYAN': 'Cabo Verde',
  'DA COSTA': 'Cabo Verde',
  'MOREIRA': 'Cabo Verde',
  'DOS SANTOS': 'Cabo Verde',
  'WAGNER P.': 'Cabo Verde',
  'KELVIN': 'Cabo Verde',
  'HÉLIO': 'Cabo Verde',
  'Y. FOFANA': 'Côte d\'Ivoire',
  'O. DIOMANDE': 'Côte d\'Ivoire',
  'G. KONAN': 'Côte d\'Ivoire',
  'SERI': 'Côte d\'Ivoire',
  'SINGO': 'Côte d\'Ivoire',
  'FOFANA': 'Côte d\'Ivoire',
  'KOSSOUNOU': 'Côte d\'Ivoire',
  'KESSIE': 'Côte d\'Ivoire',
  'BONNY': 'Côte d\'Ivoire',
  'ADINGRA': 'Côte d\'Ivoire',
  'YAN DIOMANDE': 'Côte d\'Ivoire',
  'WAHI': 'Côte d\'Ivoire',
  'OPERI': 'Côte d\'Ivoire',
  'DIAKITE': 'Côte d\'Ivoire',
  'AMAD': 'Côte d\'Ivoire',
  'KONE': 'Côte d\'Ivoire',
  'G. DOUE': 'Côte d\'Ivoire',
  'SANGARE': 'Côte d\'Ivoire',
  'PEPE': 'Côte d\'Ivoire',
  'AGBADOU': 'Côte d\'Ivoire',
  'NDICKA': 'Côte d\'Ivoire',
  'GUESSAND': 'Côte d\'Ivoire',
  'LAFONT': 'Côte d\'Ivoire',
  'TOURE': 'Côte d\'Ivoire',
  'GUIAGON': 'Côte d\'Ivoire',
  'INAO': 'Côte d\'Ivoire',
  'SUZUKI': 'Japan',
  'SUGAWARA': 'Japan',
  'TANIGUCHI': 'Japan',
  'ITAKURA': 'Japan',
  'NAGATOMO': 'Japan',
  'ENDO': 'Japan',
  'TANAKA': 'Japan',
  'KUBO': 'Japan',
  'GOTO': 'Japan',
  'DOAN': 'Japan',
  'DAIZEN': 'Japan',
  'OSAKO': 'Japan',
  'NAKAMURA': 'Japan',
  'ITO': 'Japan',
  'KAMADA': 'Japan',
  'WATANABE': 'Japan',
  'Y. SUZUKI': 'Japan',
  'AYASE': 'Japan',
  'OGAWA': 'Japan',
  'SEKO': 'Japan',
  'H. ITO': 'Japan',
  'TOMIYASU': 'Japan',
  'HAYAKAWA': 'Japan',
  'SANO': 'Japan',
  'J. SUZUKI': 'Japan',
  'SHIOGAI': 'Japan',
  'YAZEED': 'Jordan',
  'ABU HASHEESH': 'Jordan',
  'NASIB': 'Jordan',
  'ABU DHAB': 'Jordan',
  'ALARAB': 'Jordan',
  'JAMOUS': 'Jordan',
  'ABU ZRAIQ': 'Jordan',
  'ALRAWABDEH': 'Jordan',
  'OLWAN': 'Jordan',
  'ALTAMARI': 'Jordan',
  'ODEH': 'Jordan',
  'BANI ATEYAH': 'Jordan',
  'ALMARDI': 'Jordan',
  'RAJAEI': 'Jordan',
  'SADEH': 'Jordan',
  'ABULNADI': 'Jordan',
  'SALEM': 'Jordan',
  'SABRA': 'Jordan',
  'SAEED': 'Jordan',
  'ABU TAHA': 'Jordan',
  'NIZAR': 'Jordan',
  'ALFAKHORI': 'Jordan',
  'EHSAN': 'Jordan',
  'AZAIZEH': 'Jordan',
  'ALDAOUD': 'Jordan',
  'BADAWI': 'Jordan',
  'SEUNGGYU': 'Korea Republic',
  'HANBEOM': 'Korea Republic',
  'GIHYUK': 'Korea Republic',
  'MINJAE': 'Korea Republic',
  'TAEHYEON': 'Korea Republic',
  'INBEOM': 'Korea Republic',
  'HEUNGMIN': 'Korea Republic',
  'SEUNGHO': 'Korea Republic',
  'GUSEUNG': 'Korea Republic',
  'JAESUNG': 'Korea Republic',
  'HEECHAN': 'Korea Republic',
  'BUMKEUN': 'Korea Republic',
  'TAESEOK': 'Korea Republic',
  'WIJE': 'Korea Republic',
  'MOONHWAN': 'Korea Republic',
  'JINSEOB': 'Korea Republic',
  'JUNHO': 'Korea Republic',
  'HYEONGYU': 'Korea Republic',
  'KANGIN': 'Korea Republic',
  'HYUNJUN': 'Korea Republic',
  'HYEONWOO': 'Korea Republic',
  'YOUNGWOO': 'Korea Republic',
  'JENS': 'Korea Republic',
  'JINGYU': 'Korea Republic',
  'JISUNG': 'Korea Republic',
  'DONGGYEONG': 'Korea Republic',
  'BEIRANVAND': 'Iran',
  'SALEH': 'Iran',
  'E. HAJISAFI': 'Iran',
  'SHOJA': 'Iran',
  'M. MOHAMMADI': 'Iran',
  'S. EZATOLAHI': 'Iran',
  'A. JAHANBAKHSH': 'Iran',
  'M. MOHEBI': 'Iran',
  'TAREMI': 'Iran',
  'MEHDI GHAYEDI': 'Iran',
  'A. ALIPOUR': 'Iran',
  'PAYAM': 'Iran',
  'KANANI': 'Iran',
  'GHODDOOS': 'Iran',
  'ROOZBEH': 'Iran',
  'M. TORABI': 'Iran',
  'ARYA': 'Iran',
  'AMIRHOSSEIN': 'Iran',
  'ALI': 'Iran',
  'SHAHRIYAR': 'Iran',
  'MOHAMMAD': 'Iran',
  'HOSSEINI': 'Iran',
  'RAMIN': 'Iran',
  'DARGAHI': 'Iran',
  'DANIAL': 'Iran',
  'RAZAGH': 'Iran',
  'FAHAD': 'Iraq',
  'REBIN': 'Iraq',
  'HUSSEIN': 'Iraq',
  'ZAID T.': 'Iraq',
  'AKAM': 'Iraq',
  'MUNAF': 'Iraq',
  'YOUSSEF': 'Iraq',
  'IBRAHIM': 'Iraq',
  'AL-HAMADI': 'Iraq',
  'MOHANAD': 'Iraq',
  'AHMED Q.': 'Iraq',
  'JALAL': 'Iraq',
  'ALI Y.': 'Iraq',
  'Z. IQBAL': 'Iraq',
  'AHMED': 'Iraq',
  'AL-AMMARI': 'Iraq',
  'ALI J.': 'Iraq',
  'AYMEN': 'Iraq',
  'K. YAKOB': 'Iraq',
  'AIMAR': 'Iraq',
  'MARKO': 'Iraq',
  'AHMED B.': 'Iraq',
  'DOSKI': 'Iraq',
  'ZAID I.': 'Iraq',
  'MUSTAFA': 'Iraq',
  'FRANS': 'Iraq',
  'ALAQIDI': 'Saudi Arabia',
  'MAJRASHI': 'Saudi Arabia',
  'LAJAMI': 'Saudi Arabia',
  'ALAMRI': 'Saudi Arabia',
  'ALTAMBAKTI': 'Saudi Arabia',
  'NASSER': 'Saudi Arabia',
  'MUSAB': 'Saudi Arabia',
  'AIMAN': 'Saudi Arabia',
  'FERAS': 'Saudi Arabia',
  'SALEM': 'Saudi Arabia',
  'ALSHEHRI': 'Saudi Arabia',
  'SAUD': 'Saudi Arabia',
  'NAWAF': 'Saudi Arabia',
  'KADISH': 'Saudi Arabia',
  'ALKHAIBARI': 'Saudi Arabia',
  'ZIYAD': 'Saudi Arabia',
  'KHALID': 'Saudi Arabia',
  'ALHAJJI': 'Saudi Arabia',
  'ALHAMDDAN': 'Saudi Arabia',
  'MANDASH': 'Saudi Arabia',
  'ALOWAIS': 'Saudi Arabia',
  'ALKASSAR': 'Saudi Arabia',
  'KANNO': 'Saudi Arabia',
  'MOTEB': 'Saudi Arabia',
  'JEHAD': 'Saudi Arabia',
  'MOHAMMED': 'Saudi Arabia',
  'ABUNADA': 'Qatar',
  'PEDRO': 'Qatar',
  'L. MENDES': 'Qatar',
  'GUEYE': 'Qatar',
  'JASSEM': 'Qatar',
  'A. AZIZ': 'Qatar',
  'ALAEDDIN': 'Qatar',
  'EDMILSON JR.': 'Qatar',
  'MUNTARI': 'Qatar',
  'ALHAYDOS': 'Qatar',
  'AFIF': 'Qatar',
  'KARIM': 'Qatar',
  'AYOUB': 'Qatar',
  'HOMAM': 'Qatar',
  'YUSUF': 'Qatar',
  'KHOUKHI': 'Qatar',
  'A. ALGANEHI': 'Qatar',
  'SULTAN': 'Qatar',
  'ALMOEZ': 'Qatar',
  'A. FATHY': 'Qatar',
  'SALAH': 'Qatar',
  'BARSHAM': 'Qatar',
  'MADIBO': 'Qatar',
  'TAHSIN': 'Qatar',
  'ALHASHMI': 'Qatar',
  'MANAI': 'Qatar',
  'RYAN': 'Australia',
  'DEGENEK': 'Australia',
  'CIRCATI': 'Australia',
  'ITALIANO': 'Australia',
  'BOS': 'Australia',
  'GERIA': 'Australia',
  'LECKIE': 'Australia',
  'METCALFE': 'Australia',
  'TOURE': 'Australia',
  'HRUSTIC': 'Australia',
  'MABIL': 'Australia',
  'IZZO': 'Australia',
  'O\'NEILL': 'Australia',
  'DEVLIN': 'Australia',
  'TREWIN': 'Australia',
  'BEHICH': 'Australia',
  'IRANKUNDA': 'Australia',
  'BEACH': 'Australia',
  'SOUTTAR': 'Australia',
  'VOLPATO': 'Australia',
  'BURGESS': 'Australia',
  'IRVINE': 'Australia',
  'VELUPILLAY': 'Australia',
  'OKON-ENGSTLER': 'Australia',
  'HERRINGTON': 'Australia',
  'YENGI': 'Australia',
  'YUSUPOV': 'Uzbekistan',
  'KHUSANOV': 'Uzbekistan',
  'ALIJONOV': 'Uzbekistan',
  'SAYFIEV': 'Uzbekistan',
  'ASHURMATOV': 'Uzbekistan',
  'MOZGOVOY': 'Uzbekistan',
  'SHUKUROV': 'Uzbekistan',
  'ISKANDEROV': 'Uzbekistan',
  'XAMROBEKOV': 'Uzbekistan',
  'MASHARIPOV': 'Uzbekistan',
  'URUNOV': 'Uzbekistan',
  'NEMATOV': 'Uzbekistan',
  'NASRULLAEV': 'Uzbekistan',
  'SHOMURODOV': 'Uzbekistan',
  'ESHMURODOV': 'Uzbekistan',
  'ERGASHEV': 'Uzbekistan',
  'KHAMDAMOV': 'Uzbekistan',
  'ABDULLAEV': 'Uzbekistan',
  'GANIEV': 'Uzbekistan',
  'AMONOV': 'Uzbekistan',
  'SERGEEV': 'Uzbekistan',
  'FAYZULLAEV': 'Uzbekistan',
  'ESANOV': 'Uzbekistan',
  'KARIMOV': 'Uzbekistan',
  'ULMASALIYEV': 'Uzbekistan',
  'UROZOV': 'Uzbekistan',
  'PICKFORD': 'England',
  'KONSA': 'England',
  'O\'REILLY': 'England',
  'RICE': 'England',
  'STONES': 'England',
  'GUEHI': 'England',
  'SAKA': 'England',
  'ANDERSON': 'England',
  'KANE': 'England',
  'BELLINGHAM': 'England',
  'RASHFORD': 'England',
  'LIVRAMENTO': 'England',
  'D. HENDERSON': 'England',
  'J. HENDERSON': 'England',
  'BURN': 'England',
  'MAINOO': 'England',
  'ROGERS': 'England',
  'GORDON': 'England',
  'WATKINS': 'England',
  'MADUEKE': 'England',
  'EZE': 'England',
  'TONEY': 'England',
  'TRAFFORD': 'England',
  'JAMES': 'England',
  'SPENCE': 'England',
  'QUANSAH': 'England',
  'SAMBA': 'France',
  'GUSTO': 'France',
  'DIGNE': 'France',
  'UPAMECANO': 'France',
  'KOUNDE': 'France',
  'KONE': 'France',
  'DEMBELE': 'France',
  'TCHOUAMENI': 'France',
  'THURAM': 'France',
  'MBAPPE': 'France',
  'OLISE': 'France',
  'BARCOLA': 'France',
  'KANTE': 'France',
  'RABIOT': 'France',
  'KONATE': 'France',
  'MAIGNAN': 'France',
  'SALIBA': 'France',
  'ZAIRE EMERY': 'France',
  'T. HERNANDEZ': 'France',
  'DOUE': 'France',
  'L. HERNANDEZ': 'France',
  'MATETA': 'France',
  'RISSER': 'France',
  'CHERKI': 'France',
  'AKLIOUCHE': 'France',
  'LACROIX': 'France',
  'NEUER': 'Germany',
  'RUDIGER': 'Germany',
  'ANTON': 'Germany',
  'TAH': 'Germany',
  'PAVLOVIC': 'Germany',
  'KIMMICH': 'Germany',
  'HAVERTZ': 'Germany',
  'GORETZKA': 'Germany',
  'LEWELING': 'Germany',
  'MUSIALA': 'Germany',
  'WOLTEMADE': 'Germany',
  'BAUMANN': 'Germany',
  'GROß': 'Germany',
  'BEIER': 'Germany',
  'SCHLOTTERBECK': 'Germany',
  'STILLER': 'Germany',
  'WIRTZ': 'Germany',
  'BROWN': 'Germany',
  'SANÉ': 'Germany',
  'AMIRI': 'Germany',
  'NÜBEL': 'Germany',
  'RAUM': 'Germany',
  'NMECHA': 'Germany',
  'THIAW': 'Germany',
  'KARL': 'Germany',
  'UNDAV': 'Germany',
  'RAYA': 'Spain',
  'MARC PUBILL': 'Spain',
  'GRIMALDO': 'Spain',
  'ERIC': 'Spain',
  'M. LLORENTE': 'Spain',
  'MERINO': 'Spain',
  'FERRAN': 'Spain',
  'FABIÁN': 'Spain',
  'GAVI': 'Spain',
  'OLMO': 'Spain',
  'JEREMY': 'Spain',
  'PEDRO PORRO': 'Spain',
  'JOAN GARCÍA': 'Spain',
  'LAPORTE': 'Spain',
  'ALEX B.': 'Spain',
  'RODRIGO': 'Spain',
  'WILLIAMS JR': 'Spain',
  'ZUBIMENDI': 'Spain',
  'LAMINE YAMAL': 'Spain',
  'PEDRI': 'Spain',
  'OYARZABAL': 'Spain',
  'CUBARSI': 'Spain',
  'UNAI SIMÓN': 'Spain',
  'CUCURELLA': 'Spain',
  'VICTOR M.V.': 'Spain',
  'B. IGLESIAS': 'Spain',
  'DIOGO COSTA': 'Portugal',
  'N. SEMEDO': 'Portugal',
  'RÚBEN DIAS': 'Portugal',
  'TOMAS A.': 'Portugal',
  'DALOT': 'Portugal',
  'MATHEUS N.': 'Portugal',
  'RONALDO': 'Portugal',
  'B. FERNANDES': 'Portugal',
  'G. RAMOS': 'Portugal',
  'BERNARDO': 'Portugal',
  'JOÃO FÉLIX': 'Portugal',
  'JOSÉ SÁ': 'Portugal',
  'RENATO VEIGA': 'Portugal',
  'G. INÁCIO': 'Portugal',
  'JOÃO NEVES': 'Portugal',
  'TRINCÃO': 'Portugal',
  'RAFA LEÃO': 'Portugal',
  'NETO': 'Portugal',
  'G. GUEDES': 'Portugal',
  'JOÃO CANCELO': 'Portugal',
  'R. NEVES': 'Portugal',
  'RUI SILVA': 'Portugal',
  'VITINHA': 'Portugal',
  'SAMU': 'Portugal',
  'N. MENDES': 'Portugal',
  'F. CONCEIÇÃO': 'Portugal',
  'VERBRUGGEN': 'Netherlands',
  'J. TIMBER': 'Netherlands',
  'DE ROON': 'Netherlands',
  'VIRGIL': 'Netherlands',
  'AKÉ': 'Netherlands',
  'VAN HECKE': 'Netherlands',
  'KLUIVERT': 'Netherlands',
  'GRAVENBERCH': 'Netherlands',
  'WEGHORST': 'Netherlands',
  'MEMPHIS': 'Netherlands',
  'GAKPO': 'Netherlands',
  'WIEFFER': 'Netherlands',
  'ROEFS': 'Netherlands',
  'REIJNDERS': 'Netherlands',
  'VAN DE VEN': 'Netherlands',
  'TIL': 'Netherlands',
  'LANG': 'Netherlands',
  'MALEN': 'Netherlands',
  'BROBBEY': 'Netherlands',
  'KOOPMEINERS': 'Netherlands',
  'F. DE JONG': 'Netherlands',
  'DUMFRIES': 'Netherlands',
  'FLEKKEN': 'Netherlands',
  'SUMMERVILLE': 'Netherlands',
  'HATO': 'Netherlands',
  'Q. TIMBER': 'Netherlands',
  'COURTOIS': 'Belgium',
  'DEBAST': 'Belgium',
  'THIATE': 'Belgium',
  'MECHELE': 'Belgium',
  'DE CUYPER': 'Belgium',
  'WITSEL': 'Belgium',
  'DE BRUYNE': 'Belgium',
  'TIELEMANS': 'Belgium',
  'LUKAKU': 'Belgium',
  'TROSSARD': 'Belgium',
  'DOKU': 'Belgium',
  'LAMMENS': 'Belgium',
  'PENDERS': 'Belgium',
  'LUKEBAKIO': 'Belgium',
  'MEUNIER': 'Belgium',
  'DE WINTER': 'Belgium',
  'DE KETELAERE': 'Belgium',
  'SEYS': 'Belgium',
  'MOREIRA': 'Belgium',
  'VANAKEN': 'Belgium',
  'CASTAGNE': 'Belgium',
  'SAELEMAEKERS': 'Belgium',
  'RASKIN': 'Belgium',
  'ONANA': 'Belgium',
  'NGOY': 'Belgium',
  'FERNANDEZ-PARDO': 'Belgium',
  'NYLAND': 'Norway',
  'THORSBY': 'Norway',
  'VASSBAKK AJER': 'Norway',
  'ØSTIGÅRD': 'Norway',
  'MØLLER WOLFE': 'Norway',
  'BERG': 'Norway',
  'SØRLOTH': 'Norway',
  'BERGE': 'Norway',
  'BRAUT HAALAND': 'Norway',
  'ØDEGAARD': 'Norway',
  'STRAND LARSEN': 'Norway',
  'TANGVIK': 'Norway',
  'SELVIK': 'Norway',
  'AURSNES': 'Norway',
  'BJØRKAN': 'Norway',
  'HOLMGREN': 'Norway',
  'HEGGEM': 'Norway',
  'THORSTVEDT': 'Norway',
  'AASGAARD': 'Norway',
  'NUSA': 'Norway',
  'SCHJELDERUP': 'Norway',
  'BOBB': 'Norway',
  'HAUGE': 'Norway',
  'LANGÅS': 'Norway',
  'FALCHENER': 'Norway',
  'RYERSON': 'Norway',
  'KOBEL': 'Switzerland',
  'MUHEIM': 'Switzerland',
  'WIDMER': 'Switzerland',
  'ELVEDI': 'Switzerland',
  'AKANJI': 'Switzerland',
  'ZAKARIA': 'Switzerland',
  'EMBOLO': 'Switzerland',
  'FREULER': 'Switzerland',
  'MANZAMBI': 'Switzerland',
  'XHAKA': 'Switzerland',
  'NDOYE': 'Switzerland',
  'MVOGO': 'Switzerland',
  'RODRÍGUEZ': 'Switzerland',
  'JASHARI': 'Switzerland',
  'SOW': 'Switzerland',
  'FASSNACHT': 'Switzerland',
  'VARGAS': 'Switzerland',
  'COMERT': 'Switzerland',
  'OKAFOR': 'Switzerland',
  'AEBISCHER': 'Switzerland',
  'KELLER': 'Switzerland',
  'RIEDER': 'Switzerland',
  'AMDOUNI': 'Switzerland',
  'AMENDA': 'Switzerland',
  'JAQUEZ': 'Switzerland',
  'ITTEN': 'Switzerland',
  'ZETTERSTRÖM': 'Sweden',
  'LAGERBIELKE': 'Sweden',
  'LINDELÖF': 'Sweden',
  'HIEN': 'Sweden',
  'GUDMUNDSSON': 'Sweden',
  'H. JOHANSSON': 'Sweden',
  'BERGVALL': 'Sweden',
  'SVENSSON': 'Sweden',
  'ISAK': 'Sweden',
  'NYGREN': 'Sweden',
  'ELANGA': 'Sweden',
  'V. JOHANSSON': 'Sweden',
  'SEMA': 'Sweden',
  'EKDAL': 'Sweden',
  'STARFELT': 'Sweden',
  'KARLSTRÖM': 'Sweden',
  'GYÖKERES': 'Sweden',
  'AYARI': 'Sweden',
  'SVANBERG': 'Sweden',
  'SMITH': 'Sweden',
  'BERNHARDSSON': 'Sweden',
  'ZENELI': 'Sweden',
  'NORDFELDT': 'Sweden',
  'STROUD': 'Sweden',
  'NILSSON': 'Sweden',
  'ALI': 'Sweden',
  'SCHLAGER': 'Austria',
  'AFFENGRUBER': 'Austria',
  'DANSO': 'Austria',
  'XAVER': 'Austria',
  'POSCH': 'Austria',
  'SEIWALD': 'Austria',
  'ARNAUTOVIC': 'Austria',
  'ALABA': 'Austria',
  'SABITZER': 'Austria',
  'GRILLITSCH': 'Austria',
  'GREGORITSCH': 'Austria',
  'WIEGELE': 'Austria',
  'PENTZ': 'Austria',
  'KALAJDZIC': 'Austria',
  'LIENHART': 'Austria',
  'MWENE': 'Austria',
  'CHUKWUEMEKA': 'Austria',
  'SCHMID': 'Austria',
  'BAUMGARTNER': 'Austria',
  'LAIMER': 'Austria',
  'WIMMER': 'Austria',
  'PRASS': 'Austria',
  'FRIEDL': 'Austria',
  'WANNER': 'Austria',
  'SVOBODA': 'Austria',
  'SCHÖPF': 'Austria',
  'LIVAKOVIC': 'Croatia',
  'STANISIC': 'Croatia',
  'PONGRACIC': 'Croatia',
  'GVARDIOL': 'Croatia',
  'CALETA-CAR': 'Croatia',
  'SUTALO': 'Croatia',
  'MORO': 'Croatia',
  'KOVACIC': 'Croatia',
  'KRAMARIC': 'Croatia',
  'MODRIC': 'Croatia',
  'BUDIMIR': 'Croatia',
  'PANDUR': 'Croatia',
  'VLASIC': 'Croatia',
  'PERISIC': 'Croatia',
  'PASALIC': 'Croatia',
  'BATURINA': 'Croatia',
  'P. SUCIC': 'Croatia',
  'JAKIC': 'Croatia',
  'FRUK': 'Croatia',
  'MATANOVIC': 'Croatia',
  'SUCIC': 'Croatia',
  'VUSKOVIC': 'Croatia',
  'KOTARSKI': 'Croatia',
  'M. PASALIC': 'Croatia',
  'ERLIC': 'Croatia',
  'MUSA': 'Croatia',
  'GUNN': 'Scotland',
  'HICKEY': 'Scotland',
  'ROBERTSON': 'Scotland',
  'MCTOMINAY': 'Scotland',
  'HANLEY': 'Scotland',
  'TIERNEY': 'Scotland',
  'MCGINN': 'Scotland',
  'FLETCHER': 'Scotland',
  'DYKES': 'Scotland',
  'ADAMS': 'Scotland',
  'CHRISTIE': 'Scotland',
  'KELLY': 'Scotland',
  'HENDRY': 'Scotland',
  'STEWART': 'Scotland',
  'SOUTTAR': 'Scotland',
  'HYAM': 'Scotland',
  'GANNON DOAK': 'Scotland',
  'HIRST': 'Scotland',
  'FERGUSON': 'Scotland',
  'SHANKLAND': 'Scotland',
  'GORDON': 'Scotland',
  'PATTERSON': 'Scotland',
  'MCLEAN': 'Scotland',
  'RALSTON': 'Scotland',
  'CURTIS': 'Scotland',
  'MCKENNA': 'Scotland',
  'MERT': 'Türkiye',
  'ZEKI ÇELIK': 'Türkiye',
  'DEMIRAL': 'Türkiye',
  'ÇAĞLAR': 'Türkiye',
  'OZCAN': 'Türkiye',
  'ORKUN KÖKÇÜ': 'Türkiye',
  'AKTÜRKOĞLU': 'Türkiye',
  'ARDA GÜLER': 'Türkiye',
  'DENIZ GÜL': 'Türkiye',
  'ÇALHANOĞLU': 'Türkiye',
  'YILDIZ': 'Türkiye',
  'ALTAY': 'Türkiye',
  'EREN ELMALI': 'Türkiye',
  'ABDÜLKERIM': 'Türkiye',
  'OZAN KABAK': 'Türkiye',
  'ISMAIL': 'Türkiye',
  'KAHVECI': 'Türkiye',
  'MERT MULDUR': 'Türkiye',
  'YUNUS': 'Türkiye',
  'F. KADIOĞLU': 'Türkiye',
  'BARIŞ': 'Türkiye',
  'KAAN': 'Türkiye',
  'UGURCAN': 'Türkiye',
  'OGUZ': 'Türkiye',
  'SAMET AKAYDIN': 'Türkiye',
  'CAN UZUN': 'Türkiye',
  'KOVAR': 'Czechia',
  'ZIMA': 'Czechia',
  'HOLES': 'Czechia',
  'HRANAC': 'Czechia',
  'COUFAL': 'Czechia',
  'CHALOUPEK': 'Czechia',
  'KREJCI': 'Czechia',
  'DARIDA': 'Czechia',
  'HLOZEK': 'Czechia',
  'SCHICK': 'Czechia',
  'KUCHTA': 'Czechia',
  'CERV': 'Czechia',
  'CHYTIL': 'Czechia',
  'JURASEK': 'Czechia',
  'SULC': 'Czechia',
  'STANEK': 'Czechia',
  'PROVOD': 'Czechia',
  'SADILEK': 'Czechia',
  'CHORY': 'Czechia',
  'ZELENY': 'Czechia',
  'DOUDERA': 'Czechia',
  'SOUCEK': 'Czechia',
  'HORNICEK': 'Czechia',
  'SOJKA': 'Czechia',
  'SOCHUREK': 'Czechia',
  'VISINSKY': 'Czechia',
  'VASILJ': 'Bosnia and Herzegovina',
  'MUJAKIC': 'Bosnia and Herzegovina',
  'HADZIKADUNIC': 'Bosnia and Herzegovina',
  'MUHAREMOVIC': 'Bosnia and Herzegovina',
  'KOLASINAC': 'Bosnia and Herzegovina',
  'TAHIROVIC': 'Bosnia and Herzegovina',
  'DEDIC': 'Bosnia and Herzegovina',
  'GIGOVIC': 'Bosnia and Herzegovina',
  'BAZDAR': 'Bosnia and Herzegovina',
  'DEMIROVIC': 'Bosnia and Herzegovina',
  'DZEKO': 'Bosnia and Herzegovina',
  'JURKAS': 'Bosnia and Herzegovina',
  'BASIC': 'Bosnia and Herzegovina',
  'SUNJIC': 'Bosnia and Herzegovina',
  'MEMIC': 'Bosnia and Herzegovina',
  'HADZIAHMETOVIC': 'Bosnia and Herzegovina',
  'BURNIC': 'Bosnia and Herzegovina',
  'KATIC': 'Bosnia and Herzegovina',
  'ALAJBEGOVIC': 'Bosnia and Herzegovina',
  'BAJRAKTAREVIC': 'Bosnia and Herzegovina',
  'RADELJIC': 'Bosnia and Herzegovina',
  'ZLOMISLIC': 'Bosnia and Herzegovina',
  'TABAKOVIC': 'Bosnia and Herzegovina',
  'CELIK': 'Bosnia and Herzegovina',
  'LUKIC': 'Bosnia and Herzegovina',
  'MAHMIC': 'Bosnia and Herzegovina',
  'TURNER': 'United States',
  'DEST': 'United States',
  'RICHARDS': 'United States',
  'ADAMS': 'United States',
  'A. ROBINSON': 'United States',
  'TRUSTY': 'United States',
  'REYNA': 'United States',
  'MCKENNIE': 'United States',
  'PEPI': 'United States',
  'PULISIC': 'United States',
  'AARONSON': 'United States',
  'M. ROBINSON': 'United States',
  'REAM': 'United States',
  'BERHALTER': 'United States',
  'ROLDAN': 'United States',
  'FREEMAN': 'United States',
  'TILLMAN': 'United States',
  'ARFSTEN': 'United States',
  'WRIGHT': 'United States',
  'BALOGUN': 'United States',
  'WEAH': 'United States',
  'MCKENZIE': 'United States',
  'SCALLY': 'United States',
  'FREESE': 'United States',
  'BRADY': 'United States',
  'ZENDEJAS': 'United States',
  'R. RANGEL': 'Mexico',
  'J. SÁNCHEZ': 'Mexico',
  'C. MONTES': 'Mexico',
  'E. ÁLVAREZ': 'Mexico',
  'J. VÁSQUEZ': 'Mexico',
  'E. LIRA': 'Mexico',
  'L. ROMO': 'Mexico',
  'FIDALGO': 'Mexico',
  'RAÚL': 'Mexico',
  'A. VEGA': 'Mexico',
  'S. GIMÉNEZ': 'Mexico',
  'C. ACEVEDO': 'Mexico',
  'G. OCHOA': 'Mexico',
  'A. GONZÁLEZ': 'Mexico',
  'I. REYES': 'Mexico',
  'J. QUIÑONES': 'Mexico',
  'ORBELÍN': 'Mexico',
  'O. VARGAS': 'Mexico',
  'G. MORA': 'Mexico',
  'M. CHÁVEZ': 'Mexico',
  'C. HUERTA': 'Mexico',
  'G. MARTÍNEZ': 'Mexico',
  'J. GALLARDO': 'Mexico',
  'L. CHÁVEZ': 'Mexico',
  'R. ALVARADO': 'Mexico',
  'B. GUTIÉRREZ': 'Mexico',
  'MEJÍA': 'Panama',
  'BLACKMAN': 'Panama',
  'CORDOBA': 'Panama',
  'F. ESCOBAR': 'Panama',
  'FARIÑA': 'Panama',
  'MARTÍNEZ': 'Panama',
  'J.L. RODRÍGUEZ': 'Panama',
  'CARRASQUILLA': 'Panama',
  'T. RODRÍGUEZ': 'Panama',
  'ISMAEL': 'Panama',
  'BÁRCENAS': 'Panama',
  'SAMUDIO': 'Panama',
  'RAMOS': 'Panama',
  'HARVEY': 'Panama',
  'DAVIS': 'Panama',
  'ANDRADE': 'Panama',
  'FAJARDO': 'Panama',
  'WATERMAN': 'Panama',
  'QUINTERO': 'Panama',
  'GODOY': 'Panama',
  'YANIS': 'Panama',
  'MOSQUERA': 'Panama',
  'A. MURILLO': 'Panama',
  'LONDONO': 'Panama',
  'MILLER': 'Panama',
  'GUTIÉRREZ': 'Panama',
  'ST. CLAIR': 'Canada',
  'JOHNSTON': 'Canada',
  'JONES': 'Canada',
  'DE FOUGEROLLES': 'Canada',
  'WATERMAN': 'Canada',
  'CHOINIÈRE': 'Canada',
  'EUSTAQUIO': 'Canada',
  'KONÉ': 'Canada',
  'LARIN': 'Canada',
  'J. DAVID': 'Canada',
  'MILLAR': 'Canada',
  'OLUWASEYI': 'Canada',
  'CORNELIUS': 'Canada',
  'SHAFFELBURG': 'Canada',
  'BOMBITO': 'Canada',
  'CREPEAU': 'Canada',
  'BUCHANAN': 'Canada',
  'GOODMAN': 'Canada',
  'DAVIES': 'Canada',
  'AHMED': 'Canada',
  'OSORIO': 'Canada',
  'LARYEA': 'Canada',
  'SIGUR': 'Canada',
  'PROMISE': 'Canada',
  'SALIBA': 'Canada',
  'MARCELO': 'Canada',
  'PLACIDE': 'Haiti',
  'ARCUS': 'Haiti',
  'THERMONCY': 'Haiti',
  'ADE': 'Haiti',
  'DELCROIX': 'Haiti',
  'SAINTE': 'Haiti',
  'ETIENNE JR': 'Haiti',
  'EXPERIENCE': 'Haiti',
  'NAZON': 'Haiti',
  'BELLEGARDE': 'Haiti',
  'DEEDSON': 'Haiti',
  'A. PIERRE': 'Haiti',
  'LACROIX': 'Haiti',
  'L. PIERRE': 'Haiti',
  'PROVIDENCE': 'Haiti',
  'JOSEPH': 'Haiti',
  'JEAN JACQUES': 'Haiti',
  'ISIDOR': 'Haiti',
  'FORTUNE': 'Haiti',
  'PIERROT': 'Haiti',
  'CASIMIR': 'Haiti',
  'DUVERNE': 'Haiti',
  'DUVERGER': 'Haiti',
  'PAUGIN': 'Haiti',
  'SIMON': 'Haiti',
  'W. PIERRE': 'Haiti',
  'ROOM': 'Curaçao',
  'SAMBO': 'Curaçao',
  'GAARI': 'Curaçao',
  'VAN EIJMA': 'Curaçao',
  'FLORANUS': 'Curaçao',
  'ROEMERATOE': 'Curaçao',
  'J. BACUNA': 'Curaçao',
  'COMENENCIA': 'Curaçao',
  'LOCADIA': 'Curaçao',
  'L. BACUNA': 'Curaçao',
  'ANTONISSE': 'Curaçao',
  'HANSEN': 'Curaçao',
  'NOSLIN': 'Curaçao',
  'GORRE': 'Curaçao',
  'MARTHA': 'Curaçao',
  'MARGARITHA': 'Curaçao',
  'KUWAS': 'Curaçao',
  'OBISPO': 'Curaçao',
  'KASTANEER': 'Curaçao',
  'BRENET': 'Curaçao',
  'CHONG': 'Curaçao',
  'FELIDA': 'Curaçao',
  'BAZOER': 'Curaçao',
  'FONVILLE': 'Curaçao',
  'BODAK': 'Curaçao',
  'DOORNBUSCH': 'Curaçao',
  'MUSSO': 'Argentina',
  'BALERDI': 'Argentina',
  'TAGLIAFICO': 'Argentina',
  'MONTIEL': 'Argentina',
  'PAREDES': 'Argentina',
  'MARTÍNEZ': 'Argentina',
  'DE PAUL': 'Argentina',
  'BARCO': 'Argentina',
  'J. ALVAREZ': 'Argentina',
  'MESSI': 'Argentina',
  'LO CELSO': 'Argentina',
  'RULLI': 'Argentina',
  'ROMERO': 'Argentina',
  'PALACIOS': 'Argentina',
  'N. GONZÁLEZ': 'Argentina',
  'ALMADA': 'Argentina',
  'SIMEONE': 'Argentina',
  'NICO PAZ': 'Argentina',
  'OTAMENDI': 'Argentina',
  'MAC ALLISTER': 'Argentina',
  'LOPEZ': 'Argentina',
  'L. MARTÍNEZ': 'Argentina',
  'E. MARTÍNEZ': 'Argentina',
  'E. FERNÁNDEZ': 'Argentina',
  'MEDINA': 'Argentina',
  'MOLINA': 'Argentina',
  'A. BECKER': 'Brazil',
  'WESLEY': 'Brazil',
  'GABRIEL': 'Brazil',
  'MARQUINHOS': 'Brazil',
  'CASEMIRO': 'Brazil',
  'ALEX SANDRO': 'Brazil',
  'VINI JR.': 'Brazil',
  'BRUNO G.': 'Brazil',
  'CUNHA': 'Brazil',
  'NEYMAR JR': 'Brazil',
  'RAPHINHA': 'Brazil',
  'WEVERTON': 'Brazil',
  'DANILO': 'Brazil',
  'BREMER': 'Brazil',
  'LEO PEREIRA': 'Brazil',
  'DOUGLAS SANTOS': 'Brazil',
  'FABINHO': 'Brazil',
  'DANILO S.': 'Brazil',
  'ENDRICK': 'Brazil',
  'L. PAQUETA': 'Brazil',
  'L. HENRIQUE': 'Brazil',
  'MARTINELLI': 'Brazil',
  'EDERSON': 'Brazil',
  'IBANEZ': 'Brazil',
  'THIAGO': 'Brazil',
  'RAYAN': 'Brazil',
  'OSPINA': 'Colombia',
  'D. MUÑOZ': 'Colombia',
  'J. LUCUMI': 'Colombia',
  'ARIAS': 'Colombia',
  'K. CASTAÑO': 'Colombia',
  'RICHARD RIOS': 'Colombia',
  'LUIS DIAZ': 'Colombia',
  'CARRASCAL': 'Colombia',
  'CORDOBA': 'Colombia',
  'JAMES': 'Colombia',
  'J. ARIAS': 'Colombia',
  'C. VARGAS': 'Colombia',
  'Y. MINA': 'Colombia',
  'PUERTA': 'Colombia',
  'PORTILLA': 'Colombia',
  'J. LERMA': 'Colombia',
  'J. MOJICA': 'Colombia',
  'W. DITTA': 'Colombia',
  'C. HERNANDEZ': 'Colombia',
  'QUINTERO': 'Colombia',
  'CAMPAZ': 'Colombia',
  'MACHADO': 'Colombia',
  'SANCHEZ': 'Colombia',
  'MONTERO': 'Colombia',
  'SUAREZ': 'Colombia',
  'A. GOMEZ': 'Colombia',
  'GALINDEZ': 'Ecuador',
  'TORRES': 'Ecuador',
  'HINCAPIE': 'Ecuador',
  'ORDOÑEZ': 'Ecuador',
  'ALCIVAR': 'Ecuador',
  'PACHO': 'Ecuador',
  'ESTUPIÑAN': 'Ecuador',
  'A. VALENCIA': 'Ecuador',
  'YEBOAH ZAMORA': 'Ecuador',
  'PAEZ': 'Ecuador',
  'RODRIGUEZ': 'Ecuador',
  'RAMIREZ': 'Ecuador',
  'E. VALENCIA': 'Ecuador',
  'MINDA': 'Ecuador',
  'VITE': 'Ecuador',
  'J. CAICEDO': 'Ecuador',
  'PRECIADO': 'Ecuador',
  'CASTILLO': 'Ecuador',
  'PLATA': 'Ecuador',
  'ANGULO': 'Ecuador',
  'FRANCO': 'Ecuador',
  'VALLE': 'Ecuador',
  'M. CAICEDO': 'Ecuador',
  'AREVALO': 'Ecuador',
  'POROZO': 'Ecuador',
  'MEDINA': 'Ecuador',
  'FERNANDEZ': 'Paraguay',
  'VELÁZQUEZ': 'Paraguay',
  'ALDERETE': 'Paraguay',
  'CÁCERES': 'Paraguay',
  'BALBUENA': 'Paraguay',
  'ALONSO': 'Paraguay',
  'SOSA': 'Paraguay',
  'D. GOMEZ': 'Paraguay',
  'SANABRIA': 'Paraguay',
  'M. ALMIRÓN': 'Paraguay',
  'MAURICIO': 'Paraguay',
  'O. GILL': 'Paraguay',
  'CANALE': 'Paraguay',
  'CUBAS': 'Paraguay',
  'G. GOMEZ': 'Paraguay',
  'BOBADILLA': 'Paraguay',
  'R. GAMARRA': 'Paraguay',
  'ARCE': 'Paraguay',
  'ENCISO': 'Paraguay',
  'OJEDA': 'Paraguay',
  'AVALOS': 'Paraguay',
  'OLIVEIRA': 'Paraguay',
  'GALARZA': 'Paraguay',
  'CABALLERO': 'Paraguay',
  'PITTA': 'Paraguay',
  'MAIDANA': 'Paraguay',
  'S. ROCHET': 'Uruguay',
  'J.M. GIMÉNEZ': 'Uruguay',
  'S. CÁCERES': 'Uruguay',
  'R. ARAUJO': 'Uruguay',
  'M. UGARTE': 'Uruguay',
  'R. BENTANCUR': 'Uruguay',
  'N. DE LA CRUZ': 'Uruguay',
  'F. VALVERDE': 'Uruguay',
  'D. NÚÑEZ': 'Uruguay',
  'G. DE ARRASCAETA': 'Uruguay',
  'F. PELLISTRI': 'Uruguay',
  'S. MELE': 'Uruguay',
  'G. VARELA': 'Uruguay',
  'A. CANOBBIO': 'Uruguay',
  'E. MARTÍNEZ': 'Uruguay',
  'M. OLIVERA': 'Uruguay',
  'M. VIÑA': 'Uruguay',
  'B. RODRÍGUEZ': 'Uruguay',
  'R. AGUIRRE': 'Uruguay',
  'M. ARAUJO': 'Uruguay',
  'F. VIÑAS': 'Uruguay',
  'J. PIQUEREZ': 'Uruguay',
  'F. MUSLERA': 'Uruguay',
  'S. BUENO': 'Uruguay',
  'J.M. SANABRIA': 'Uruguay',
  'R. ZALAZAR': 'Uruguay',
  'CROCOMBE': 'New Zealand',
  'PAYNE': 'New Zealand',
  'DE VRIES': 'New Zealand',
  'BINDON': 'New Zealand',
  'BOXALL': 'New Zealand',
  'BELL': 'New Zealand',
  'GARBETT': 'New Zealand',
  'STAMENIC': 'New Zealand',
  'WOOD': 'New Zealand',
  'SINGH': 'New Zealand',
  'JUST': 'New Zealand',
  'PAULSEN': 'New Zealand',
  'CACACE': 'New Zealand',
  'RUFER': 'New Zealand',
  'PIJNAKER': 'New Zealand',
  'SURMAN': 'New Zealand',
  'BARBAROUSES': 'New Zealand',
  'WAINE': 'New Zealand',
  'OLD': 'New Zealand',
  'MCCOWATT': 'New Zealand',
  'RANDALL': 'New Zealand',
  'WOUD': 'New Zealand',
  'THOMAS': 'New Zealand',
  'ELLIOT': 'New Zealand',
  'BAYLISS': 'New Zealand',
  'SMITH': 'New Zealand',
  'MPASI': 'Congo DR',
  'WAN BISSAKA': 'Congo DR',
  'KAPUADI': 'Congo DR',
  'TUANZEBE': 'Congo DR',
  'BATUBINSIKA': 'Congo DR',
  'MUKAU': 'Congo DR',
  'MBUKU': 'Congo DR',
  'MOUTOUSSAMY': 'Congo DR',
  'CIPENGA': 'Congo DR',
  'BONGONDA': 'Congo DR',
  'KAKUTA': 'Congo DR',
  'J. KAYEMBE': 'Congo DR',
  'ELIA': 'Congo DR',
  'SADIKI': 'Congo DR',
  'TSHIBOLA': 'Congo DR',
  'FAYULU': 'Congo DR',
  'BAKAMBU': 'Congo DR',
  'PICKEL': 'Congo DR',
  'MAYELE': 'Congo DR',
  'WISSA': 'Congo DR',
  'EPOLO': 'Congo DR',
  'MBEMBA': 'Congo DR',
  'BANZA': 'Congo DR',
  'G. KALULU': 'Congo DR',
  'KAYEMBE': 'Congo DR',
  'MASUAKU': 'Congo DR',
};

// Player portrait URLs - now uses TheSportsDB API dynamically
// This map is kept for any manual overrides if needed
// Portrait fetching is done via fetchPortraitFromSportsDB() which queries TheSportsDB API
const playerPortraitMap = {
  // Empty - all portraits are fetched dynamically from TheSportsDB API
};

// Cache for dynamically fetched portraits
const portraitCache = {};

// Helper function to get player portrait from TheSportsDB API
async function fetchPortraitFromSportsDB(playerName) {
  const cacheKey = playerName.toLowerCase();
  
  // Check memory cache first
  if (portraitCache[cacheKey]) {
    return portraitCache[cacheKey];
  }
  
  // Check local map first (prioritize static entries)
  const localUrl = getPortraitFromLocalMap(playerName);
  if (localUrl) {
    portraitCache[cacheKey] = localUrl;
    return localUrl;
  }
  
  try {
    // Fetch from TheSportsDB API
    const apiUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.player && data.player.length > 0) {
      // Get the most relevant player (first result)
      const player = data.player[0];
      // Prefer strThumb (full portrait) over strCutout (silhouette)
      const imageUrl = player.strThumb || player.strCutout;
      if (imageUrl) {
        portraitCache[cacheKey] = imageUrl;
        return imageUrl;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch portrait from SportsDB:', error);
  }
  
  return null;
}

// Helper function to check local portrait map
function getPortraitFromLocalMap(playerName) {
  // Direct match
  if (playerPortraitMap[playerName]) {
    return playerPortraitMap[playerName];
  }
  
  // Normalize name for comparison (remove accents)
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Try normalized comparison
  const normalizedInput = normalize(playerName);
  for (const key in playerPortraitMap) {
    if (normalize(key) === normalizedInput) {
      return playerPortraitMap[key];
    }
  }
  
  // Try last name only match
  const nameParts = playerName.split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const normalizedLastName = normalize(lastName);
  
  for (const key in playerPortraitMap) {
    const keyParts = key.split(' ');
    const keyLastName = keyParts[keyParts.length - 1];
    if (normalize(keyLastName) === normalizedLastName && normalize(key).startsWith(normalizedInput.substring(0, 2))) {
      return playerPortraitMap[key];
    }
  }
  
  return null;
}

// Synchronous wrapper for getPlayerPortrait (returns cached or local URLs immediately)
function getPlayerPortrait(playerName) {
  const cacheKey = playerName.toLowerCase();
  
  // Check memory cache first
  if (portraitCache[cacheKey]) {
    return portraitCache[cacheKey];
  }
  
  // Return local map URL if available (synchronous)
  const localUrl = getPortraitFromLocalMap(playerName);
  if (localUrl) {
    portraitCache[cacheKey] = localUrl;
    return localUrl;
  }
  
  // Trigger async fetch for future use, but return null now
  fetchPortraitFromSportsDB(playerName);
  
  return null;
}

// Async version that waits for API response
async function getPlayerPortraitAsync(playerName) {
  const cacheKey = playerName.toLowerCase();
  
  if (portraitCache[cacheKey]) {
    return portraitCache[cacheKey];
  }
  
  return await fetchPortraitFromSportsDB(playerName);
}

const wcPlayerDatabase = [
  { number: 1, nameOnShirt: 'MASTIL', fullName: 'Melvin Mastil', team: 'Algeria', position: 'GK', club: 'FC Stade Nyonnais (SUI)' },
  { number: 2, nameOnShirt: 'MANDI', fullName: 'Aïssa Mandi', team: 'Algeria', position: 'DF', club: 'Lille OSC (FRA)' },
  { number: 3, nameOnShirt: 'ABADA', fullName: 'Achref Abada', team: 'Algeria', position: 'DF', club: 'USM Alger (ALG)' },
  { number: 4, nameOnShirt: 'TOUGAI', fullName: 'Mohamed Amine Tougai', team: 'Algeria', position: 'DF', club: 'Espérance De Tunisie (TUN)' },
  { number: 5, nameOnShirt: 'BELAID', fullName: 'Zineddine Belaïd', team: 'Algeria', position: 'DF', club: 'JS Kabylie (ALG)' },
  { number: 6, nameOnShirt: 'ZERROUKI', fullName: 'Ramiz Zerrouki', team: 'Algeria', position: 'MF', club: 'FC Twente (NED)' },
  { number: 7, nameOnShirt: 'MAHREZ', fullName: 'Riyad Mahrez', team: 'Algeria', position: 'FW', club: 'Al Ahli FC (KSA)' },
  { number: 8, nameOnShirt: 'AOUAR', fullName: 'Houssem Aouar', team: 'Algeria', position: 'MF', club: 'Al Ittihad (KSA)' },
  { number: 9, nameOnShirt: 'GHOURI', fullName: 'GHOURI', team: 'Algeria', position: 'FW', club: 'Olympique Marseille (FRA)' },
  { number: 10, nameOnShirt: 'CHAIBI', fullName: 'Farès Chaïbi', team: 'Algeria', position: 'MF', club: 'Eintracht Frankfurt (GER)' },
  { number: 11, nameOnShirt: 'HADJ MOUSSA', fullName: 'Anis Hadj Moussa', team: 'Algeria', position: 'FW', club: 'Feyenoord Rotterdam (NED)' },
  { number: 12, nameOnShirt: 'BENBOUALI', fullName: 'Nadhir Benbouali', team: 'Algeria', position: 'FW', club: 'Györi ETO FC (HUN)' },
  { number: 13, nameOnShirt: 'HADJAM', fullName: 'Anis Hadj Moussa', team: 'Algeria', position: 'DF', club: 'BSC Young Boys (SUI)' },
  { number: 14, nameOnShirt: 'BOUDAOUI', fullName: 'Hicham Boudaoui', team: 'Algeria', position: 'MF', club: 'OGC Nice (FRA)' },
  { number: 15, nameOnShirt: 'AIT NOURI', fullName: 'Rayan Aït-Nouri', team: 'Algeria', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 16, nameOnShirt: 'BENBOT', fullName: 'Oussama Benbot', team: 'Algeria', position: 'GK', club: 'USM Alger (ALG)' },
  { number: 17, nameOnShirt: 'BELGHALI', fullName: 'Rafik Belghali', team: 'Algeria', position: 'DF', club: 'Hellas Verona FC (ITA)' },
  { number: 18, nameOnShirt: 'AMOURA', fullName: 'Mohamed Amoura', team: 'Algeria', position: 'FW', club: 'VfL Wolfsburg (GER)' },
  { number: 19, nameOnShirt: 'BENTALEB', fullName: 'Nabil Bentaleb', team: 'Algeria', position: 'MF', club: 'Lille OSC (FRA)' },
  { number: 20, nameOnShirt: 'BOULBINA', fullName: 'Adil Boulbina', team: 'Algeria', position: 'FW', club: 'Al Duhail SC (QAT)' },
  { number: 21, nameOnShirt: 'BENSEBAINI', fullName: 'Ramy Bensebaini', team: 'Algeria', position: 'DF', club: 'Borussia Dortmund (GER)' },
  { number: 22, nameOnShirt: 'MAZA', fullName: 'Ibrahim Maza', team: 'Algeria', position: 'MF', club: 'Bayer Leverkusen (GER)' },
  { number: 23, nameOnShirt: 'ZIDANE', fullName: 'Luca Zidane', team: 'Algeria', position: 'GK', club: 'Granada CF (ESP)' },
  { number: 24, nameOnShirt: 'TITRAOUI', fullName: 'Yacine Titraoui', team: 'Algeria', position: 'MF', club: 'Sporting Charleroi (BEL)' },
  { number: 25, nameOnShirt: 'GHEDJEMIS', fullName: 'Farès Ghedjemis', team: 'Algeria', position: 'FW', club: 'Frosinone (ITA)' },
  { number: 26, nameOnShirt: 'CHERGUI', fullName: 'Samir Chergui', team: 'Algeria', position: 'DF', club: 'Paris FC (FRA)' },
  { number: 1, nameOnShirt: 'M. ELSHENAWY', fullName: 'Mohamed El Shenawy', team: 'Egypt', position: 'GK', club: 'Al Ahly FC (EGY)' },
  { number: 2, nameOnShirt: 'YASSER', fullName: 'Yasser Ibrahim', team: 'Egypt', position: 'DF', club: 'Al Ahly FC (EGY)' },
  { number: 3, nameOnShirt: 'M. HANY', fullName: 'Mohamed Hany', team: 'Egypt', position: 'DF', club: 'Al Ahly FC (EGY)' },
  { number: 4, nameOnShirt: 'HOSSAM', fullName: 'Hossam Abdelmaguid', team: 'Egypt', position: 'DF', club: 'Zamalek SC (EGY)' },
  { number: 5, nameOnShirt: 'R. RABIAA', fullName: 'Ramy Rabia', team: 'Egypt', position: 'DF', club: 'Al Ain FC (UAE)' },
  { number: 6, nameOnShirt: 'M. ABDELMONEIM', fullName: 'Mohamed El Shenawy', team: 'Egypt', position: 'DF', club: 'OGC Nice (FRA)' },
  { number: 7, nameOnShirt: 'M. TREZEGUET', fullName: 'Trézéguet', team: 'Egypt', position: 'FW', club: 'Al Ahly FC (EGY)' },
  { number: 8, nameOnShirt: 'E. ASHOUR', fullName: 'Emam Ashour', team: 'Egypt', position: 'MF', club: 'Al Ahly FC (EGY)' },
  { number: 9, nameOnShirt: 'ABDELKARIM', fullName: 'Mohamed El Shenawy', team: 'Egypt', position: 'FW', club: 'FC Barcelona (ESP)' },
  { number: 10, nameOnShirt: 'M. SALAH', fullName: 'Mohamed Salah', team: 'Egypt', position: 'FW', club: 'Liverpool FC (ENG)' },
  { number: 11, nameOnShirt: 'ZICO', fullName: 'ZICO', team: 'Egypt', position: 'MF', club: 'Pyramids FC (EGY)' },
  { number: 12, nameOnShirt: 'H. HASSAN', fullName: 'Haissem Hassan', team: 'Egypt', position: 'FW', club: 'Real Oviedo (ESP)' },
  { number: 13, nameOnShirt: 'A. FATOUH', fullName: 'Ahmed Fatouh', team: 'Egypt', position: 'DF', club: 'Zamalek SC (EGY)' },
  { number: 14, nameOnShirt: 'H. FATHY', fullName: 'Hamdy Fathy', team: 'Egypt', position: 'MF', club: 'Al Wakrah SC (QAT)' },
  { number: 15, nameOnShirt: 'K. HAFEZ', fullName: 'Karim Hafez', team: 'Egypt', position: 'DF', club: 'Pyramids FC (EGY)' },
  { number: 16, nameOnShirt: 'M. SOLIMAN', fullName: 'El Mahdy Soliman', team: 'Egypt', position: 'GK', club: 'Zamalek SC (EGY)' },
  { number: 17, nameOnShirt: 'M. LASHIN', fullName: 'M. LASHIN', team: 'Egypt', position: 'MF', club: 'Pyramids FC (EGY)' },
  { number: 18, nameOnShirt: 'DONGA', fullName: 'DONGA', team: 'Egypt', position: 'MF', club: 'Al Najmah SC (KSA)' },
  { number: 19, nameOnShirt: 'M. ATTIA', fullName: 'Marwan Attia', team: 'Egypt', position: 'MF', club: 'Al Ahly FC (EGY)' },
  { number: 20, nameOnShirt: 'I. ADEL', fullName: 'Mohamed El Shenawy', team: 'Egypt', position: 'FW', club: 'FC Nordsjælland (DEN)' },
  { number: 21, nameOnShirt: 'M. SABER', fullName: 'Mahmoud Saber', team: 'Egypt', position: 'MF', club: 'ZED FC (EGY)' },
  { number: 22, nameOnShirt: 'MARMOUSH', fullName: 'Omar Marmoush', team: 'Egypt', position: 'FW', club: 'Manchester City FC (ENG)' },
  { number: 23, nameOnShirt: 'SHOUBIR', fullName: 'SHOUBIR', team: 'Egypt', position: 'GK', club: 'Al Ahly FC (EGY)' },
  { number: 24, nameOnShirt: 'T. ALAA', fullName: 'Tarek Alaa', team: 'Egypt', position: 'DF', club: 'ZED FC (EGY)' },
  { number: 25, nameOnShirt: 'ZIZO', fullName: 'ZIZO', team: 'Egypt', position: 'FW', club: 'Al Ahly FC (EGY)' },
  { number: 26, nameOnShirt: 'M. ALAA', fullName: 'Tarek Alaa', team: 'Egypt', position: 'GK', club: 'El Gouna FC (EGY)' },
  { number: 1, nameOnShirt: 'BONO', fullName: 'BONO', team: 'Morocco', position: 'GK', club: 'Al Hilal SC (KSA)' },
  { number: 2, nameOnShirt: 'HAKIMI', fullName: 'Achraf Hakimi', team: 'Morocco', position: 'DF', club: 'Paris Saint-Germain (FRA)' },
  { number: 3, nameOnShirt: 'MAZRAOUI', fullName: 'Noussair Mazraoui', team: 'Morocco', position: 'DF', club: 'Manchester United FC (ENG)' },
  { number: 4, nameOnShirt: 'AMRABAT', fullName: 'Sofyan Amrabat', team: 'Morocco', position: 'MF', club: 'Real Betis (ESP)' },
  { number: 5, nameOnShirt: 'AGUERD', fullName: 'AGUERD', team: 'Morocco', position: 'DF', club: 'Olympique Marseille (FRA)' },
  { number: 6, nameOnShirt: 'BOUADDI', fullName: 'Ayyoub Bouaddi', team: 'Morocco', position: 'MF', club: 'Lille OSC (FRA)' },
  { number: 7, nameOnShirt: 'TALBI', fullName: 'Chemsdine Talbi', team: 'Morocco', position: 'MF', club: 'Sunderland AFC (ENG)' },
  { number: 8, nameOnShirt: 'OUAHI', fullName: 'OUAHI', team: 'Morocco', position: 'MF', club: 'Girona FC (ESP)' },
  { number: 9, nameOnShirt: 'RAHIMI', fullName: 'Soufiane Rahimi', team: 'Morocco', position: 'FW', club: 'Al Ain FC (UAE)' },
  { number: 10, nameOnShirt: 'BRAHIM', fullName: 'Brahim Díaz', team: 'Morocco', position: 'FW', club: 'Real Madrid C. F. (ESP)' },
  { number: 11, nameOnShirt: 'SAIBARI', fullName: 'Ismael Saibari', team: 'Morocco', position: 'MF', club: 'PSV Eindhoven (NED)' },
  { number: 12, nameOnShirt: 'EL KAJOUI', fullName: 'Ismael Saibari', team: 'Morocco', position: 'GK', club: 'RS Berkane (MAR)' },
  { number: 13, nameOnShirt: 'EL OUAHDI', fullName: 'Ismael Saibari', team: 'Morocco', position: 'DF', club: 'KRC Genk (BEL)' },
  { number: 14, nameOnShirt: 'ISSA', fullName: 'Issa Diop', team: 'Morocco', position: 'DF', club: 'Fulham FC (ENG)' },
  { number: 15, nameOnShirt: 'EL MOURABET', fullName: 'Ismael Saibari', team: 'Morocco', position: 'MF', club: 'RC Strasbourg (FRA)' },
  { number: 16, nameOnShirt: 'YASSINE', fullName: 'Yassine Bounou', team: 'Morocco', position: 'MF', club: 'RC Strasbourg (FRA)' },
  { number: 17, nameOnShirt: 'EZZALZOULI', fullName: 'EZZALZOULI', team: 'Morocco', position: 'FW', club: 'Real Betis (ESP)' },
  { number: 18, nameOnShirt: 'RIAD', fullName: 'Chadi Riad', team: 'Morocco', position: 'DF', club: 'Crystal Palace FC (ENG)' },
  { number: 19, nameOnShirt: 'BELAMMARI', fullName: 'Zakaria El Ouahdi', team: 'Morocco', position: 'DF', club: 'Al Ahly FC (EGY)' },
  { number: 20, nameOnShirt: 'EL KAABI', fullName: 'Ismael Saibari', team: 'Morocco', position: 'FW', club: 'Olympiacos FC (GRE)' },
  { number: 21, nameOnShirt: 'AMAIMOUNI', fullName: 'Ayoube Amaimouni', team: 'Morocco', position: 'FW', club: 'Eintracht Frankfurt (GER)' },
  { number: 22, nameOnShirt: 'TAGNAOUTI', fullName: 'Ahmed Reda Tagnaouti', team: 'Morocco', position: 'GK', club: 'ASFAR (MAR)' },
  { number: 23, nameOnShirt: 'EL KHANNOUSS', fullName: 'Ismael Saibari', team: 'Morocco', position: 'MF', club: 'VfB Stuttgart (GER)' },
  { number: 24, nameOnShirt: 'EL AYNAOUI', fullName: 'Ismael Saibari', team: 'Morocco', position: 'MF', club: 'AS Roma (ITA)' },
  { number: 25, nameOnShirt: 'HALHAL', fullName: 'Redouane Halhal', team: 'Morocco', position: 'DF', club: 'KV Mechelen (BEL)' },
  { number: 26, nameOnShirt: 'SALAH-EDDINE', fullName: 'Anass Salah-Eddine', team: 'Morocco', position: 'DF', club: 'PSV Eindhoven (NED)' },
  { number: 1, nameOnShirt: 'WILLIAMS', fullName: 'Ronwen Williams', team: 'South Africa', position: 'GK', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 2, nameOnShirt: 'MATULUDI', fullName: 'Thabang Matuludi', team: 'South Africa', position: 'DF', club: 'Polokwane City FC (RSA)' },
  { number: 3, nameOnShirt: 'NDAMANE', fullName: 'Khulumani Ndamane', team: 'South Africa', position: 'DF', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 4, nameOnShirt: 'MOKOENA', fullName: 'Teboho Mokoena', team: 'South Africa', position: 'MF', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 5, nameOnShirt: 'MBATHA', fullName: 'Thalente Mbatha', team: 'South Africa', position: 'MF', club: 'Orlando Pirates FC (RSA)' },
  { number: 6, nameOnShirt: 'MODIBA', fullName: 'Aubrey Modiba', team: 'South Africa', position: 'DF', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 7, nameOnShirt: 'APPOLLIS', fullName: 'Oswin Appollis', team: 'South Africa', position: 'FW', club: 'Orlando Pirates FC (RSA)' },
  { number: 8, nameOnShirt: 'MOREMI', fullName: 'Tshepang Moremi', team: 'South Africa', position: 'FW', club: 'Orlando Pirates FC (RSA)' },
  { number: 9, nameOnShirt: 'FOSTER', fullName: 'Lyle Foster', team: 'South Africa', position: 'FW', club: 'Burnley FC (ENG)' },
  { number: 10, nameOnShirt: 'MOFOKENG', fullName: 'Relebohile Mofokeng', team: 'South Africa', position: 'FW', club: 'Orlando Pirates FC (RSA)' },
  { number: 11, nameOnShirt: 'ZWANE', fullName: 'Themba Zwane', team: 'South Africa', position: 'MF', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 12, nameOnShirt: 'MASEKO', fullName: 'Thapelo Maseko', team: 'South Africa', position: 'FW', club: 'AEL Limassol (CYP)' },
  { number: 13, nameOnShirt: 'SITHOLE', fullName: 'Sphephelo Sithole', team: 'South Africa', position: 'MF', club: 'CD Tondela (POR)' },
  { number: 14, nameOnShirt: 'MBOKAZI', fullName: 'Mbekezeli Mbokazi', team: 'South Africa', position: 'DF', club: 'Chicago Fire FC (USA)' },
  { number: 15, nameOnShirt: 'RAYNERS', fullName: 'Iqraam Rayners', team: 'South Africa', position: 'FW', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 16, nameOnShirt: 'CHAINE', fullName: 'Sipho Chaine', team: 'South Africa', position: 'GK', club: 'Orlando Pirates FC (RSA)' },
  { number: 17, nameOnShirt: 'MAKGOPA', fullName: 'Evidence Makgopa', team: 'South Africa', position: 'FW', club: 'Orlando Pirates FC (RSA)' },
  { number: 18, nameOnShirt: 'KABINI', fullName: 'Samukele Kabini', team: 'South Africa', position: 'DF', club: 'Molde FK (NOR)' },
  { number: 19, nameOnShirt: 'SIBISI', fullName: 'Nkosinathi Sibisi', team: 'South Africa', position: 'DF', club: 'Orlando Pirates FC (RSA)' },
  { number: 20, nameOnShirt: 'MUDAU', fullName: 'Khuliso Mudau', team: 'South Africa', position: 'DF', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 21, nameOnShirt: 'OKON', fullName: 'Ime Okon', team: 'South Africa', position: 'DF', club: 'Hannover 96 (GER)' },
  { number: 22, nameOnShirt: 'GOSS', fullName: 'Ricardo Goss', team: 'South Africa', position: 'GK', club: 'Siwelele FC (RSA)' },
  { number: 23, nameOnShirt: 'ADAMS', fullName: 'Jayden Adams', team: 'South Africa', position: 'MF', club: 'Mamelodi Sundowns FC (RSA)' },
  { number: 24, nameOnShirt: 'MAKHANYA', fullName: 'Olwethu Makhanya', team: 'South Africa', position: 'DF', club: 'Philadelphia Union (USA)' },
  { number: 25, nameOnShirt: 'SEBELEBELE', fullName: 'Kamogelo Sebelebele', team: 'South Africa', position: 'FW', club: 'Orlando Pirates FC (RSA)' },
  { number: 26, nameOnShirt: 'CROSS', fullName: 'Bradley Cross', team: 'South Africa', position: 'DF', club: 'Kaizer Chiefs FC (RSA)' },
  { number: 1, nameOnShirt: 'CHAMAKH', fullName: 'Mouhib Chamakh', team: 'Tunisia', position: 'GK', club: 'Club Africain (TUN)' },
  { number: 2, nameOnShirt: 'ABDI', fullName: 'Ali Abdi', team: 'Tunisia', position: 'DF', club: 'OGC Nice (FRA)' },
  { number: 3, nameOnShirt: 'TALBI', fullName: 'Montassar Talbi', team: 'Tunisia', position: 'DF', club: 'FC Lorient (FRA)' },
  { number: 4, nameOnShirt: 'REKIK', fullName: 'Omar Rekik', team: 'Tunisia', position: 'DF', club: 'NK Maribor (SVN)' },
  { number: 5, nameOnShirt: 'AROUS', fullName: 'Adem Arous', team: 'Tunisia', position: 'DF', club: 'Kasımpa ş a SK (TUR)' },
  { number: 6, nameOnShirt: 'BRONN', fullName: 'Dylan Bronn', team: 'Tunisia', position: 'DF', club: 'Servette FC (SUI)' },
  { number: 7, nameOnShirt: 'ACHOURI', fullName: 'Elias Achouri', team: 'Tunisia', position: 'FW', club: 'FC København (DEN)' },
  { number: 8, nameOnShirt: 'SAAD', fullName: 'Elias Saad', team: 'Tunisia', position: 'FW', club: 'Hannover 96 (GER)' },
  { number: 9, nameOnShirt: 'MASTOURI', fullName: 'Hazem Mastouri', team: 'Tunisia', position: 'FW', club: 'FC Dynamo Makhachkala (RUS)' },
  { number: 10, nameOnShirt: 'MEJBRI', fullName: 'Hannibal Mejbri', team: 'Tunisia', position: 'MF', club: 'Burnley FC (ENG)' },
  { number: 11, nameOnShirt: 'GHARBI', fullName: 'Ismaël Gharbi', team: 'Tunisia', position: 'MF', club: 'FC Augsburg (GER)' },
  { number: 12, nameOnShirt: 'BEN OUANES', fullName: 'Mortadha Ben Ouanes', team: 'Tunisia', position: 'DF', club: 'Kasımpa ş a SK (TUR)' },
  { number: 13, nameOnShirt: 'KHEDIRA', fullName: 'Rani Khedira', team: 'Tunisia', position: 'MF', club: '1. FC Union Berlin (GER)' },
  { number: 14, nameOnShirt: 'AYARI', fullName: 'Khalil Ayari', team: 'Tunisia', position: 'MF', club: 'Paris Saint-Germain (FRA)' },
  { number: 15, nameOnShirt: 'BELHADJ MAHMOUD', fullName: 'Hadj Mahmoud', team: 'Tunisia', position: 'MF', club: 'FC Lugano (SUI)' },
  { number: 16, nameOnShirt: 'DAHMEN', fullName: 'Aymen Dahmen', team: 'Tunisia', position: 'GK', club: 'CS Sfaxien (TUN)' },
  { number: 17, nameOnShirt: 'SKHIRI', fullName: 'Ellyes Skhiri', team: 'Tunisia', position: 'MF', club: 'Eintracht Frankfurt (GER)' },
  { number: 18, nameOnShirt: 'ELLOUMI', fullName: 'Rayan Elloumi', team: 'Tunisia', position: 'FW', club: 'Vancouver Whitecaps FC (CAN)' },
  { number: 19, nameOnShirt: 'CHAOUAT', fullName: 'Firas Chaouat', team: 'Tunisia', position: 'FW', club: 'Club Africain (TUN)' },
  { number: 20, nameOnShirt: 'VALERY', fullName: 'Yan Valery', team: 'Tunisia', position: 'DF', club: 'BSC Young Boys (SUI)' },
  { number: 21, nameOnShirt: 'BEN HMIDA', fullName: 'Mortadha Ben Ouanes', team: 'Tunisia', position: 'DF', club: 'Espérance De Tunisie (TUN)' },
  { number: 22, nameOnShirt: 'BEN HSAN', fullName: 'Mortadha Ben Ouanes', team: 'Tunisia', position: 'GK', club: 'Étoile Du Sahel (TUN)' },
  { number: 23, nameOnShirt: 'NEFFATI', fullName: 'Moutaz Neffati', team: 'Tunisia', position: 'DF', club: 'IFK Norrköping FK (SWE)' },
  { number: 24, nameOnShirt: 'CHIKHAOUI', fullName: 'Raed Chikhaoui', team: 'Tunisia', position: 'DF', club: 'US Monastir (TUN)' },
  { number: 25, nameOnShirt: 'SLIMANE', fullName: 'Anis Ben Slimane', team: 'Tunisia', position: 'MF', club: 'Norwich City FC (ENG)' },
  { number: 26, nameOnShirt: 'TOUNEKTI', fullName: 'Sebastian Tounekti', team: 'Tunisia', position: 'MF', club: 'Celtic FC (SCO)' },
  { number: 1, nameOnShirt: 'Y. DIOUF', fullName: 'Yehvann Diouf', team: 'Senegal', position: 'GK', club: 'OGC Nice (FRA)' },
  { number: 2, nameOnShirt: 'SARR', fullName: 'Mamadou Sarr', team: 'Senegal', position: 'DF', club: 'Chelsea FC (ENG)' },
  { number: 3, nameOnShirt: 'KOULIBALY', fullName: 'Kalidou Koulibaly', team: 'Senegal', position: 'DF', club: 'Al Hilal SC (KSA)' },
  { number: 4, nameOnShirt: 'SECK', fullName: 'Abdoulaye Seck', team: 'Senegal', position: 'DF', club: 'Maccabi Haifa FC (ISR)' },
  { number: 5, nameOnShirt: 'GANA', fullName: 'GANA', team: 'Senegal', position: 'MF', club: 'Everton FC (ENG)' },
  { number: 6, nameOnShirt: 'P.I. CISS', fullName: 'Pathé Ciss', team: 'Senegal', position: 'MF', club: 'Rayo Vallecano (ESP)' },
  { number: 7, nameOnShirt: 'DIAO', fullName: 'Assane Diao', team: 'Senegal', position: 'FW', club: 'Como (ITA)' },
  { number: 8, nameOnShirt: 'LAMINE', fullName: 'Lamine Camara', team: 'Senegal', position: 'MF', club: 'AS Monaco (FRA)' },
  { number: 9, nameOnShirt: 'B. DIENG', fullName: 'Bamba Dieng', team: 'Senegal', position: 'FW', club: 'FC Lorient (FRA)' },
  { number: 10, nameOnShirt: 'MANÉ', fullName: 'Sadio Mané', team: 'Senegal', position: 'FW', club: 'Al Nassr FC (KSA)' },
  { number: 11, nameOnShirt: 'JACKSON', fullName: 'Nicolas Jackson', team: 'Senegal', position: 'FW', club: 'FC Bayern München (GER)' },
  { number: 12, nameOnShirt: 'CHERIF', fullName: 'Cherif Ndiaye', team: 'Senegal', position: 'FW', club: 'Samsunspor (TUR)' },
  { number: 13, nameOnShirt: 'NDIAYE', fullName: 'Cherif Ndiaye', team: 'Senegal', position: 'FW', club: 'Everton FC (ENG)' },
  { number: 14, nameOnShirt: 'JAKOBS', fullName: 'Ismail Jakobs', team: 'Senegal', position: 'DF', club: 'Galatasaray SK (TUR)' },
  { number: 15, nameOnShirt: 'KRÉPIN', fullName: 'Krépin Diatta', team: 'Senegal', position: 'DF', club: 'AS Monaco (FRA)' },
  { number: 16, nameOnShirt: 'MENDY', fullName: 'Édouard Mendy', team: 'Senegal', position: 'GK', club: 'Al Ahli FC (KSA)' },
  { number: 17, nameOnShirt: 'P.M. SARR', fullName: 'Mamadou Sarr', team: 'Senegal', position: 'MF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 18, nameOnShirt: 'SARR', fullName: 'Mamadou Sarr', team: 'Senegal', position: 'FW', club: 'Crystal Palace FC (ENG)' },
  { number: 19, nameOnShirt: 'NIAKHATE', fullName: 'Moussa Niakhaté', team: 'Senegal', position: 'DF', club: 'Olympique Lyonnais (FRA)' },
  { number: 20, nameOnShirt: 'MBAYE', fullName: 'Ibrahim Mbaye', team: 'Senegal', position: 'FW', club: 'Paris Saint-Germain (FRA)' },
  { number: 21, nameOnShirt: 'H. DIARRA', fullName: 'Habib Diarra', team: 'Senegal', position: 'MF', club: 'Sunderland AFC (ENG)' },
  { number: 22, nameOnShirt: 'BARA', fullName: 'Bara Sapoko Ndiaye', team: 'Senegal', position: 'MF', club: 'FC Bayern München (GER)' },
  { number: 23, nameOnShirt: 'DIAW', fullName: 'Mory Diaw', team: 'Senegal', position: 'GK', club: 'Le Havre AC (FRA)' },
  { number: 24, nameOnShirt: 'A. MENDY', fullName: 'Édouard Mendy', team: 'Senegal', position: 'DF', club: 'OGC Nice (FRA)' },
  { number: 25, nameOnShirt: 'DIOUF', fullName: 'Yehvann Diouf', team: 'Senegal', position: 'DF', club: 'West Ham United FC (ENG)' },
  { number: 26, nameOnShirt: 'GUEYE', fullName: 'Idrissa Gueye', team: 'Senegal', position: 'MF', club: 'Villarreal CF (ESP)' },
  { number: 1, nameOnShirt: 'ZIGI', fullName: 'Lawrence Ati-Zigi', team: 'Ghana', position: 'GK', club: 'FC St. Gallen (SUI)' },
  { number: 2, nameOnShirt: 'SEIDU', fullName: 'Alidu Seidu', team: 'Ghana', position: 'DF', club: 'Stade Rennais FC (FRA)' },
  { number: 3, nameOnShirt: 'CALEB', fullName: 'Caleb Yirenkyi', team: 'Ghana', position: 'MF', club: 'FC Nordsjælland (DEN)' },
  { number: 4, nameOnShirt: 'ADJETEY', fullName: 'Jonas Adjetey', team: 'Ghana', position: 'DF', club: 'VfL Wolfsburg (GER)' },
  { number: 5, nameOnShirt: 'THOMAS', fullName: 'Thomas Partey', team: 'Ghana', position: 'MF', club: 'Villarreal CF (ESP)' },
  { number: 6, nameOnShirt: 'SULEMAN', fullName: 'Kamaldeen Sulemana', team: 'Ghana', position: 'DF', club: 'Rayo Vallecano (ESP)' },
  { number: 7, nameOnShirt: 'FATAWU', fullName: 'Abdul Fatawu', team: 'Ghana', position: 'FW', club: 'Leicester City FC (ENG)' },
  { number: 8, nameOnShirt: 'SIBO', fullName: 'Kwasi Sibo', team: 'Ghana', position: 'MF', club: 'Real Oviedo (ESP)' },
  { number: 9, nameOnShirt: 'AYEW', fullName: 'Jordan Ayew', team: 'Ghana', position: 'FW', club: 'Leicester City FC (ENG)' },
  { number: 10, nameOnShirt: 'ASANTE', fullName: 'Brandon Thomas-Asante', team: 'Ghana', position: 'FW', club: 'Coventry City FC (ENG)' },
  { number: 11, nameOnShirt: 'SEMENYO', fullName: 'Antoine Semenyo', team: 'Ghana', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 12, nameOnShirt: 'ANANG', fullName: 'ANANG', team: 'Ghana', position: 'GK', club: 'St Patrick\'s Athletic FC (IRL)' },
  { number: 13, nameOnShirt: 'BAAH', fullName: 'Christopher Bonsu Baah', team: 'Ghana', position: 'FW', club: 'Al Qadsiah FC (KSA)' },
  { number: 14, nameOnShirt: 'MENSAH', fullName: 'Gideon Mensah', team: 'Ghana', position: 'DF', club: 'AJ Auxerre (FRA)' },
  { number: 15, nameOnShirt: 'OWUSU', fullName: 'Elisha Owusu', team: 'Ghana', position: 'MF', club: 'AJ Auxerre (FRA)' },
  { number: 16, nameOnShirt: 'ASARE', fullName: 'Benjamin Asare', team: 'Ghana', position: 'GK', club: 'Hearts Of Oak SC (GHA)' },
  { number: 17, nameOnShirt: 'BABA', fullName: 'Abdul Rahman Baba', team: 'Ghana', position: 'DF', club: 'PAOK Saloniki (GRE)' },
  { number: 18, nameOnShirt: 'OPOKU', fullName: 'Jerome Opoku', team: 'Ghana', position: 'DF', club: 'Ba ş ak ş ehir FK (TUR)' },
  { number: 19, nameOnShirt: 'WILLIAMS', fullName: 'Iñaki Williams', team: 'Ghana', position: 'FW', club: 'Athletic Club (ESP)' },
  { number: 20, nameOnShirt: 'BOAKYE', fullName: 'Augustine Boakye', team: 'Ghana', position: 'MF', club: 'AS Saint-Etienne (FRA)' },
  { number: 21, nameOnShirt: 'PEPRAH', fullName: 'Kojo Peprah Oppong', team: 'Ghana', position: 'DF', club: 'OGC Nice (FRA)' },
  { number: 22, nameOnShirt: 'KAMALDEEN', fullName: 'Kamaldeen Sulemana', team: 'Ghana', position: 'FW', club: 'Atalanta Bergamo (ITA)' },
  { number: 23, nameOnShirt: 'LUCKASSEN', fullName: 'Derrick Luckassen', team: 'Ghana', position: 'DF', club: 'Pafos FC (CYP)' },
  { number: 24, nameOnShirt: 'NUAMAH', fullName: 'Ernest Nuamah', team: 'Ghana', position: 'FW', club: 'Olympique Lyonnais (FRA)' },
  { number: 25, nameOnShirt: 'ADU', fullName: 'Prince Kwabena Adu', team: 'Ghana', position: 'FW', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 26, nameOnShirt: 'SENEYA', fullName: 'SENEYA', team: 'Ghana', position: 'DF', club: 'AJ Auxerre (FRA)' },
  { number: 1, nameOnShirt: 'VOZINHA', fullName: 'VOZINHA', team: 'Cabo Verde', position: 'GK', club: 'GD Chaves (POR)' },
  { number: 2, nameOnShirt: 'STOPIRA', fullName: 'STOPIRA', team: 'Cabo Verde', position: 'DF', club: 'SCU Torreense (POR)' },
  { number: 3, nameOnShirt: 'BORGES', fullName: 'BORGES', team: 'Cabo Verde', position: 'DF', club: 'Al Bataeh Club (UAE)' },
  { number: 4, nameOnShirt: 'LOPES', fullName: 'Pico Lopes', team: 'Cabo Verde', position: 'DF', club: 'Shamrock Rovers FC (IRL)' },
  { number: 5, nameOnShirt: 'LOGAN', fullName: 'Logan Costa', team: 'Cabo Verde', position: 'DF', club: 'Villarreal CF (ESP)' },
  { number: 6, nameOnShirt: 'KEVIN L.', fullName: 'Kevin Pina', team: 'Cabo Verde', position: 'MF', club: 'FC Krasnodar (RUS)' },
  { number: 7, nameOnShirt: 'JOVANE', fullName: 'Jovane Cabral', team: 'Cabo Verde', position: 'MF', club: 'CF Estrela Da Amadora (POR)' },
  { number: 8, nameOnShirt: 'JOAO PAULO', fullName: 'João Paulo Fernandes', team: 'Cabo Verde', position: 'MF', club: 'FC FCSB (ROU)' },
  { number: 9, nameOnShirt: 'BENCHIMOL', fullName: 'Gilson Benchimol', team: 'Cabo Verde', position: 'FW', club: 'FC Akron Tolyatti (RUS)' },
  { number: 10, nameOnShirt: 'MONTEIRO', fullName: 'Jamiro Monteiro', team: 'Cabo Verde', position: 'MF', club: 'PEC Zwolle (NED)' },
  { number: 11, nameOnShirt: 'RODRIGUES', fullName: 'Garry Rodrigues', team: 'Cabo Verde', position: 'MF', club: 'Apollon Limassol (CYP)' },
  { number: 12, nameOnShirt: 'MARCIO', fullName: 'Márcio Rosa', team: 'Cabo Verde', position: 'GK', club: 'PFC Montana (BUL)' },
  { number: 13, nameOnShirt: 'LOPES CABRAL', fullName: 'Pico Lopes', team: 'Cabo Verde', position: 'DF', club: 'SL Benca (POR)' },
  { number: 14, nameOnShirt: 'D. DUARTE', fullName: 'Deroy Duarte', team: 'Cabo Verde', position: 'MF', club: 'PFC Ludogorets Razgrad (BUL)' },
  { number: 15, nameOnShirt: 'DUARTE', fullName: 'Deroy Duarte', team: 'Cabo Verde', position: 'MF', club: 'Puskás Akadémia FC (HUN)' },
  { number: 16, nameOnShirt: 'Y. SEMEDO', fullName: 'Yannick Semedo', team: 'Cabo Verde', position: 'MF', club: 'SC Farense (POR)' },
  { number: 17, nameOnShirt: 'SEMEDO', fullName: 'Yannick Semedo', team: 'Cabo Verde', position: 'MF', club: 'AC Omonia (CYP)' },
  { number: 18, nameOnShirt: 'ARCANJO', fullName: 'Telmo Arcanjo', team: 'Cabo Verde', position: 'MF', club: 'Vitória SC (POR)' },
  { number: 19, nameOnShirt: 'LIVRAMENTO', fullName: 'Dailon Livramento', team: 'Cabo Verde', position: 'FW', club: 'Casa Pia AC (POR)' },
  { number: 20, nameOnShirt: 'RYAN', fullName: 'Ryan Mendes', team: 'Cabo Verde', position: 'FW', club: 'I ğ dır FK (TUR)' },
  { number: 21, nameOnShirt: 'DA COSTA', fullName: 'Logan Costa', team: 'Cabo Verde', position: 'MF', club: 'Ba ş ak ş ehir FK (TUR)' },
  { number: 22, nameOnShirt: 'MOREIRA', fullName: 'Steven Moreira', team: 'Cabo Verde', position: 'DF', club: 'Columbus Crew (USA)' },
  { number: 23, nameOnShirt: 'DOS SANTOS', fullName: 'CJ dos Santos', team: 'Cabo Verde', position: 'GK', club: 'San Diego FC (USA)' },
  { number: 24, nameOnShirt: 'WAGNER P.', fullName: 'Wagner Pina', team: 'Cabo Verde', position: 'DF', club: 'Trabzonspor (TUR)' },
  { number: 25, nameOnShirt: 'KELVIN', fullName: 'Kelvin Pires', team: 'Cabo Verde', position: 'DF', club: 'SJK (FIN)' },
  { number: 26, nameOnShirt: 'HÉLIO', fullName: 'Hélio Varela', team: 'Cabo Verde', position: 'MF', club: 'Maccabi Tel-Aviv FC (ISR)' },
  { number: 1, nameOnShirt: 'Y. FOFANA', fullName: 'Y. FOFANA', team: 'Côte d\'Ivoire', position: 'GK', club: 'Çaykur Rizespor (TUR)' },
  { number: 2, nameOnShirt: 'O. DIOMANDE', fullName: 'O. DIOMANDE', team: 'Côte d\'Ivoire', position: 'DF', club: 'Sporting CP (POR)' },
  { number: 3, nameOnShirt: 'G. KONAN', fullName: 'G. KONAN', team: 'Côte d\'Ivoire', position: 'DF', club: 'Gil Vicente FC (POR)' },
  { number: 4, nameOnShirt: 'SERI', fullName: 'SERI', team: 'Côte d\'Ivoire', position: 'MF', club: 'NK Maribor (SVN)' },
  { number: 5, nameOnShirt: 'SINGO', fullName: 'SINGO', team: 'Côte d\'Ivoire', position: 'DF', club: 'Galatasaray SK (TUR)' },
  { number: 6, nameOnShirt: 'FOFANA', fullName: 'FOFANA', team: 'Côte d\'Ivoire', position: 'MF', club: 'FC Porto (POR)' },
  { number: 7, nameOnShirt: 'KOSSOUNOU', fullName: 'KOSSOUNOU', team: 'Côte d\'Ivoire', position: 'DF', club: 'Atalanta Bergamo (ITA)' },
  { number: 8, nameOnShirt: 'KESSIE', fullName: 'KESSIE', team: 'Côte d\'Ivoire', position: 'MF', club: 'Al Ahli FC (KSA)' },
  { number: 9, nameOnShirt: 'BONNY', fullName: 'BONNY', team: 'Côte d\'Ivoire', position: 'FW', club: 'FC Internazionale Milano (ITA)' },
  { number: 10, nameOnShirt: 'ADINGRA', fullName: 'ADINGRA', team: 'Côte d\'Ivoire', position: 'FW', club: 'AS Monaco (FRA)' },
  { number: 11, nameOnShirt: 'YAN DIOMANDE', fullName: 'YAN DIOMANDE', team: 'Côte d\'Ivoire', position: 'FW', club: 'RB Leipzig (GER)' },
  { number: 12, nameOnShirt: 'WAHI', fullName: 'WAHI', team: 'Côte d\'Ivoire', position: 'FW', club: 'OGC Nice (FRA)' },
  { number: 13, nameOnShirt: 'OPERI', fullName: 'OPERI', team: 'Côte d\'Ivoire', position: 'DF', club: 'Ba ş ak ş ehir FK (TUR)' },
  { number: 14, nameOnShirt: 'DIAKITE', fullName: 'DIAKITE', team: 'Côte d\'Ivoire', position: 'FW', club: 'Cercle Brugge (BEL)' },
  { number: 15, nameOnShirt: 'AMAD', fullName: 'AMAD', team: 'Côte d\'Ivoire', position: 'FW', club: 'Manchester United FC (ENG)' },
  { number: 16, nameOnShirt: 'KONE', fullName: 'Boubakary Soumare', team: 'Côte d\'Ivoire', position: 'GK', club: 'Sporting Charleroi (BEL)' },
  { number: 17, nameOnShirt: 'G. DOUE', fullName: 'G. DOUE', team: 'Côte d\'Ivoire', position: 'DF', club: 'RC Strasbourg (FRA)' },
  { number: 18, nameOnShirt: 'SANGARE', fullName: 'SANGARE', team: 'Côte d\'Ivoire', position: 'MF', club: 'Nottingham Forest FC (ENG)' },
  { number: 19, nameOnShirt: 'PEPE', fullName: 'PEPE', team: 'Côte d\'Ivoire', position: 'FW', club: 'Villarreal CF (ESP)' },
  { number: 20, nameOnShirt: 'AGBADOU', fullName: 'AGBADOU', team: 'Côte d\'Ivoire', position: 'DF', club: 'Be ş ikta ş  JK (TUR)' },
  { number: 21, nameOnShirt: 'NDICKA', fullName: 'NDICKA', team: 'Côte d\'Ivoire', position: 'DF', club: 'AS Roma (ITA)' },
  { number: 22, nameOnShirt: 'GUESSAND', fullName: 'GUESSAND', team: 'Côte d\'Ivoire', position: 'FW', club: 'Crystal Palace FC (ENG)' },
  { number: 23, nameOnShirt: 'LAFONT', fullName: 'LAFONT', team: 'Côte d\'Ivoire', position: 'GK', club: 'Panathinaikos FC (GRE)' },
  { number: 24, nameOnShirt: 'TOURE', fullName: 'TOURE', team: 'Côte d\'Ivoire', position: 'FW', club: 'TSG Hoffenheim (GER)' },
  { number: 25, nameOnShirt: 'GUIAGON', fullName: 'GUIAGON', team: 'Côte d\'Ivoire', position: 'MF', club: 'Sporting Charleroi (BEL)' },
  { number: 26, nameOnShirt: 'INAO', fullName: 'INAO', team: 'Côte d\'Ivoire', position: 'MF', club: 'Trabzonspor (TUR)' },
  { number: 1, nameOnShirt: 'SUZUKI', fullName: 'Zion Suzuki', team: 'Japan', position: 'GK', club: 'Parma (ITA)' },
  { number: 2, nameOnShirt: 'SUGAWARA', fullName: 'Yukinari Sugawara', team: 'Japan', position: 'DF', club: 'SV Werder Bremen (GER)' },
  { number: 3, nameOnShirt: 'TANIGUCHI', fullName: 'Shōgo Taniguchi', team: 'Japan', position: 'DF', club: 'Sint-Truiden VV (BEL)' },
  { number: 4, nameOnShirt: 'ITAKURA', fullName: 'Kō Itakura', team: 'Japan', position: 'DF', club: 'AFC Ajax (NED)' },
  { number: 5, nameOnShirt: 'NAGATOMO', fullName: 'Yūto Nagatomo', team: 'Japan', position: 'DF', club: 'FC Tokyo (JPN)' },
  { number: 6, nameOnShirt: 'ENDO', fullName: 'ENDO', team: 'Japan', position: 'MF', club: 'Liverpool FC (ENG)' },
  { number: 7, nameOnShirt: 'TANAKA', fullName: 'Ao Tanaka', team: 'Japan', position: 'MF', club: 'Leeds United FC (ENG)' },
  { number: 8, nameOnShirt: 'KUBO', fullName: 'Takefusa Kubo', team: 'Japan', position: 'MF', club: 'Real Sociedad (ESP)' },
  { number: 9, nameOnShirt: 'GOTO', fullName: 'Keisuke Gotō', team: 'Japan', position: 'FW', club: 'Sint-Truiden VV (BEL)' },
  { number: 10, nameOnShirt: 'DOAN', fullName: 'Ritsu Dōan', team: 'Japan', position: 'MF', club: 'Eintracht Frankfurt (GER)' },
  { number: 11, nameOnShirt: 'DAIZEN', fullName: 'Daizen Maeda', team: 'Japan', position: 'MF', club: 'Celtic FC (SCO)' },
  { number: 12, nameOnShirt: 'OSAKO', fullName: 'Kō Itakura', team: 'Japan', position: 'GK', club: 'Sanfrecce Hiroshima (JPN)' },
  { number: 13, nameOnShirt: 'NAKAMURA', fullName: 'Keito Nakamura', team: 'Japan', position: 'MF', club: 'Stade Reims (FRA)' },
  { number: 14, nameOnShirt: 'ITO', fullName: 'Keito Nakamura', team: 'Japan', position: 'MF', club: 'KRC Genk (BEL)' },
  { number: 15, nameOnShirt: 'KAMADA', fullName: 'Daichi Kamada', team: 'Japan', position: 'MF', club: 'Crystal Palace FC (ENG)' },
  { number: 16, nameOnShirt: 'WATANABE', fullName: 'Tsuyoshi Watanabe', team: 'Japan', position: 'DF', club: 'Feyenoord Rotterdam (NED)' },
  { number: 17, nameOnShirt: 'Y. SUZUKI', fullName: 'Zion Suzuki', team: 'Japan', position: 'MF', club: 'SC Freiburg (GER)' },
  { number: 18, nameOnShirt: 'AYASE', fullName: 'Ayase Ueda', team: 'Japan', position: 'FW', club: 'Feyenoord Rotterdam (NED)' },
  { number: 19, nameOnShirt: 'OGAWA', fullName: 'Kōki Ogawa', team: 'Japan', position: 'FW', club: 'NEC Nijmegen (NED)' },
  { number: 20, nameOnShirt: 'SEKO', fullName: 'Kō Itakura', team: 'Japan', position: 'DF', club: 'Le Havre AC (FRA)' },
  { number: 21, nameOnShirt: 'H. ITO', fullName: 'Keito Nakamura', team: 'Japan', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 22, nameOnShirt: 'TOMIYASU', fullName: 'Takehiro Tomiyasu', team: 'Japan', position: 'DF', club: 'AFC Ajax (NED)' },
  { number: 23, nameOnShirt: 'HAYAKAWA', fullName: 'Tomoki Hayakawa', team: 'Japan', position: 'GK', club: 'Kashima Antlers (JPN)' },
  { number: 24, nameOnShirt: 'SANO', fullName: 'Kaishū Sano', team: 'Japan', position: 'MF', club: '1. FSV Mainz 05 (GER)' },
  { number: 25, nameOnShirt: 'J. SUZUKI', fullName: 'Zion Suzuki', team: 'Japan', position: 'DF', club: 'FC København (DEN)' },
  { number: 26, nameOnShirt: 'SHIOGAI', fullName: 'Kento Shiogai', team: 'Japan', position: 'FW', club: 'VfL Wolfsburg (GER)' },
  { number: 1, nameOnShirt: 'YAZEED', fullName: 'Yazeed Abulaila', team: 'Jordan', position: 'GK', club: 'Al Hussein SC (JOR)' },
  { number: 2, nameOnShirt: 'ABU HASHEESH', fullName: 'Yazeed Abulaila', team: 'Jordan', position: 'DF', club: 'Al Karma SC (IRQ)' },
  { number: 3, nameOnShirt: 'NASIB', fullName: 'NASIB', team: 'Jordan', position: 'DF', club: 'Al Zawra\'a SC (IRQ)' },
  { number: 4, nameOnShirt: 'ABU DHAB', fullName: 'Yazeed Abulaila', team: 'Jordan', position: 'DF', club: 'Al Faisaly SC (JOR)' },
  { number: 5, nameOnShirt: 'ALARAB', fullName: 'ALARAB', team: 'Jordan', position: 'DF', club: 'FC Seoul (KOR)' },
  { number: 6, nameOnShirt: 'JAMOUS', fullName: 'JAMOUS', team: 'Jordan', position: 'MF', club: 'Al Zawra\'a SC (IRQ)' },
  { number: 7, nameOnShirt: 'ABU ZRAIQ', fullName: 'Yazeed Abulaila', team: 'Jordan', position: 'FW', club: 'Raja Casablanca (MAR)' },
  { number: 8, nameOnShirt: 'ALRAWABDEH', fullName: 'ALRAWABDEH', team: 'Jordan', position: 'MF', club: 'Selangor FC (MAS)' },
  { number: 9, nameOnShirt: 'OLWAN', fullName: 'Ali Olwan', team: 'Jordan', position: 'FW', club: 'Al Sailiya SC (QAT)' },
  { number: 10, nameOnShirt: 'ALTAMARI', fullName: 'ALTAMARI', team: 'Jordan', position: 'FW', club: 'Stade Rennais FC (FRA)' },
  { number: 11, nameOnShirt: 'ODEH', fullName: 'Odeh Al-Fakhouri', team: 'Jordan', position: 'FW', club: 'Pyramids FC (EGY)' },
  { number: 12, nameOnShirt: 'BANI ATEYAH', fullName: 'Nour Bani Attiah', team: 'Jordan', position: 'GK', club: 'Al Faisaly SC (JOR)' },
  { number: 13, nameOnShirt: 'ALMARDI', fullName: 'ALMARDI', team: 'Jordan', position: 'FW', club: 'Al Hussein SC (JOR)' },
  { number: 14, nameOnShirt: 'RAJAEI', fullName: 'Rajaei Ayed', team: 'Jordan', position: 'MF', club: 'Al Hussein SC (JOR)' },
  { number: 15, nameOnShirt: 'SADEH', fullName: 'Ibrahim Sadeh', team: 'Jordan', position: 'MF', club: 'Al Karma SC (IRQ)' },
  { number: 16, nameOnShirt: 'ABULNADI', fullName: 'Mohammad Abu Hashish', team: 'Jordan', position: 'DF', club: 'Selangor FC (MAS)' },
  { number: 17, nameOnShirt: 'SALEM', fullName: 'SALEM', team: 'Jordan', position: 'DF', club: 'Al Hussein SC (JOR)' },
  { number: 18, nameOnShirt: 'SABRA', fullName: 'SABRA', team: 'Jordan', position: 'FW', club: 'NK Lokomotiva Zagreb (CRO)' },
  { number: 19, nameOnShirt: 'SAEED', fullName: 'SAEED', team: 'Jordan', position: 'DF', club: 'Al Hussein SC (JOR)' },
  { number: 20, nameOnShirt: 'ABU TAHA', fullName: 'Yazeed Abulaila', team: 'Jordan', position: 'MF', club: 'Al-Quwa Al-Jawiya (IRQ)' },
  { number: 21, nameOnShirt: 'NIZAR', fullName: 'Nizar Al-Rashdan', team: 'Jordan', position: 'MF', club: 'Qatar SC (QAT)' },
  { number: 22, nameOnShirt: 'ALFAKHORI', fullName: 'ALFAKHORI', team: 'Jordan', position: 'GK', club: 'Al Wahdat SC (JOR)' },
  { number: 23, nameOnShirt: 'EHSAN', fullName: 'EHSAN', team: 'Jordan', position: 'DF', club: 'Al Hussein SC (JOR)' },
  { number: 24, nameOnShirt: 'AZAIZEH', fullName: 'Ali Azaizeh', team: 'Jordan', position: 'FW', club: 'Al Shabab FC (KSA)' },
  { number: 25, nameOnShirt: 'ALDAOUD', fullName: 'ALDAOUD', team: 'Jordan', position: 'MF', club: 'Al Wahdat SC (JOR)' },
  { number: 26, nameOnShirt: 'BADAWI', fullName: 'Anas Badawi', team: 'Jordan', position: 'DF', club: 'Al Faisaly SC (JOR)' },
  { number: 1, nameOnShirt: 'SEUNGGYU', fullName: 'SEUNGGYU', team: 'Korea Republic', position: 'GK', club: 'FC Tokyo (JPN)' },
  { number: 2, nameOnShirt: 'HANBEOM', fullName: 'Eom Ji-sung', team: 'Korea Republic', position: 'DF', club: 'FC Midtjylland (DEN)' },
  { number: 3, nameOnShirt: 'GIHYUK', fullName: 'GIHYUK', team: 'Korea Republic', position: 'MF', club: 'Gangwon FC (KOR)' },
  { number: 4, nameOnShirt: 'MINJAE', fullName: 'MINJAE', team: 'Korea Republic', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 5, nameOnShirt: 'TAEHYEON', fullName: 'TAEHYEON', team: 'Korea Republic', position: 'DF', club: 'Kashima Antlers (JPN)' },
  { number: 6, nameOnShirt: 'INBEOM', fullName: 'Eom Ji-sung', team: 'Korea Republic', position: 'MF', club: 'Feyenoord Rotterdam (NED)' },
  { number: 7, nameOnShirt: 'HEUNGMIN', fullName: 'HEUNGMIN', team: 'Korea Republic', position: 'FW', club: 'LAFC (USA)' },
  { number: 8, nameOnShirt: 'SEUNGHO', fullName: 'SEUNGHO', team: 'Korea Republic', position: 'MF', club: 'Birmingham City FC (ENG)' },
  { number: 9, nameOnShirt: 'GUSEUNG', fullName: 'GUSEUNG', team: 'Korea Republic', position: 'FW', club: 'FC Midtjylland (DEN)' },
  { number: 10, nameOnShirt: 'JAESUNG', fullName: 'JAESUNG', team: 'Korea Republic', position: 'MF', club: '1. FSV Mainz 05 (GER)' },
  { number: 11, nameOnShirt: 'HEECHAN', fullName: 'HEECHAN', team: 'Korea Republic', position: 'MF', club: 'Wolverhampton Wanderers FC (ENG)' },
  { number: 12, nameOnShirt: 'BUMKEUN', fullName: 'BUMKEUN', team: 'Korea Republic', position: 'GK', club: 'Jeonbuk Hyundai Motors FC (KOR)' },
  { number: 13, nameOnShirt: 'TAESEOK', fullName: 'TAESEOK', team: 'Korea Republic', position: 'DF', club: 'FK Austria Wien (AUT)' },
  { number: 14, nameOnShirt: 'WIJE', fullName: 'WIJE', team: 'Korea Republic', position: 'DF', club: 'Jeonbuk Hyundai Motors FC (KOR)' },
  { number: 15, nameOnShirt: 'MOONHWAN', fullName: 'MOONHWAN', team: 'Korea Republic', position: 'DF', club: 'Daejeon Hana Citizen FC (KOR)' },
  { number: 16, nameOnShirt: 'JINSEOB', fullName: 'JINSEOB', team: 'Korea Republic', position: 'DF', club: 'Zhejiang FC (CHN)' },
  { number: 17, nameOnShirt: 'JUNHO', fullName: 'JUNHO', team: 'Korea Republic', position: 'MF', club: 'Stoke City FC (ENG)' },
  { number: 18, nameOnShirt: 'HYEONGYU', fullName: 'HYEONGYU', team: 'Korea Republic', position: 'FW', club: 'Be ş ikta ş  JK (TUR)' },
  { number: 19, nameOnShirt: 'KANGIN', fullName: 'KANGIN', team: 'Korea Republic', position: 'MF', club: 'Paris Saint-Germain (FRA)' },
  { number: 20, nameOnShirt: 'HYUNJUN', fullName: 'HYUNJUN', team: 'Korea Republic', position: 'MF', club: 'Celtic FC (SCO)' },
  { number: 21, nameOnShirt: 'HYEONWOO', fullName: 'HYEONWOO', team: 'Korea Republic', position: 'GK', club: 'Ulsan HD (KOR)' },
  { number: 22, nameOnShirt: 'YOUNGWOO', fullName: 'YOUNGWOO', team: 'Korea Republic', position: 'DF', club: 'FK Crvena Zvezda (SRB)' },
  { number: 23, nameOnShirt: 'JENS', fullName: 'Jens Castrop', team: 'Korea Republic', position: 'DF', club: 'Borussia Mönchengladbach (GER)' },
  { number: 24, nameOnShirt: 'JINGYU', fullName: 'JINGYU', team: 'Korea Republic', position: 'MF', club: 'Jeonbuk Hyundai Motors FC (KOR)' },
  { number: 25, nameOnShirt: 'JISUNG', fullName: 'JISUNG', team: 'Korea Republic', position: 'MF', club: 'Swansea City AFC (WAL)' },
  { number: 26, nameOnShirt: 'DONGGYEONG', fullName: 'DONGGYEONG', team: 'Korea Republic', position: 'MF', club: 'Ulsan HD (KOR)' },
  { number: 1, nameOnShirt: 'BEIRANVAND', fullName: 'Alireza Beiranvand', team: 'Iran', position: 'GK', club: 'Tractor Sazi Tabriz FC (IRN)' },
  { number: 2, nameOnShirt: 'SALEH', fullName: 'Saleh Hardani', team: 'Iran', position: 'DF', club: 'Esteghlal Tehran FC (IRN)' },
  { number: 3, nameOnShirt: 'E. HAJISAFI', fullName: 'E. HAJISAFI', team: 'Iran', position: 'DF', club: 'Sepahan SC (IRN)' },
  { number: 4, nameOnShirt: 'SHOJA', fullName: 'Shojae Khalilzadeh', team: 'Iran', position: 'DF', club: 'Tractor Sazi Tabriz FC (IRN)' },
  { number: 5, nameOnShirt: 'M. MOHAMMADI', fullName: 'Milad Mohammadi', team: 'Iran', position: 'DF', club: 'Persepolis FC (IRN)' },
  { number: 6, nameOnShirt: 'S. EZATOLAHI', fullName: 'Saeid Ezatolahi', team: 'Iran', position: 'MF', club: 'Shabab Al Ahli Club (UAE)' },
  { number: 7, nameOnShirt: 'A. JAHANBAKHSH', fullName: 'Alireza Jahanbakhsh', team: 'Iran', position: 'MF', club: 'FCV Dender EH (BEL)' },
  { number: 8, nameOnShirt: 'M. MOHEBI', fullName: 'Mohammad Mohebi', team: 'Iran', position: 'MF', club: 'FC Rostov (RUS)' },
  { number: 9, nameOnShirt: 'TAREMI', fullName: 'Mehdi Taremi', team: 'Iran', position: 'FW', club: 'Olympiacos FC (GRE)' },
  { number: 10, nameOnShirt: 'MEHDI GHAYEDI', fullName: 'Mehdi Taremi', team: 'Iran', position: 'FW', club: 'Al Nasr SC (UAE)' },
  { number: 11, nameOnShirt: 'A. ALIPOUR', fullName: 'Ali Alipour', team: 'Iran', position: 'FW', club: 'Persepolis FC (IRN)' },
  { number: 12, nameOnShirt: 'PAYAM', fullName: 'Payam Niazmand', team: 'Iran', position: 'GK', club: 'Persepolis FC (IRN)' },
  { number: 13, nameOnShirt: 'KANANI', fullName: 'KANANI', team: 'Iran', position: 'DF', club: 'Persepolis FC (IRN)' },
  { number: 14, nameOnShirt: 'GHODDOOS', fullName: 'GHODDOOS', team: 'Iran', position: 'MF', club: 'Al Ittihad Kalba SCC (UAE)' },
  { number: 15, nameOnShirt: 'ROOZBEH', fullName: 'ROOZBEH', team: 'Iran', position: 'MF', club: 'Esteghlal Tehran FC (IRN)' },
  { number: 16, nameOnShirt: 'M. TORABI', fullName: 'Mahdi Torabi', team: 'Iran', position: 'MF', club: 'Tractor Sazi Tabriz FC (IRN)' },
  { number: 17, nameOnShirt: 'ARYA', fullName: 'Arya Yousefi', team: 'Iran', position: 'DF', club: 'Sepahan SC (IRN)' },
  { number: 18, nameOnShirt: 'AMIRHOSSEIN', fullName: 'Hossein Kanaanizadegan', team: 'Iran', position: 'FW', club: 'Tractor Sazi Tabriz FC (IRN)' },
  { number: 19, nameOnShirt: 'ALI', fullName: 'Alireza Beiranvand', team: 'Iran', position: 'DF', club: 'Foolad Khuzestan FC (IRN)' },
  { number: 20, nameOnShirt: 'SHAHRIYAR', fullName: 'Shahriyar Moghanlou', team: 'Iran', position: 'FW', club: 'Al Ittihad Kalba SCC (UAE)' },
  { number: 21, nameOnShirt: 'MOHAMMAD', fullName: 'Milad Mohammadi', team: 'Iran', position: 'MF', club: 'Al Wahda SC (UAE)' },
  { number: 22, nameOnShirt: 'HOSSEINI', fullName: 'Hossein Kanaanizadegan', team: 'Iran', position: 'GK', club: 'Sepahan SC (IRN)' },
  { number: 23, nameOnShirt: 'RAMIN', fullName: 'Ramin Rezaeian', team: 'Iran', position: 'DF', club: 'Foolad Khuzestan FC (IRN)' },
  { number: 24, nameOnShirt: 'DARGAHI', fullName: 'DARGAHI', team: 'Iran', position: 'FW', club: 'Standard Liège (BEL)' },
  { number: 25, nameOnShirt: 'DANIAL', fullName: 'Danial Eiri', team: 'Iran', position: 'DF', club: 'Malavan Anzali FC (IRN)' },
  { number: 26, nameOnShirt: 'RAZAGH', fullName: 'RAZAGH', team: 'Iran', position: 'MF', club: 'Esteghlal Tehran FC (IRN)' },
  { number: 1, nameOnShirt: 'FAHAD', fullName: 'Fahad Talib', team: 'Iraq', position: 'GK', club: 'Al Talaba SC (IRQ)' },
  { number: 2, nameOnShirt: 'REBIN', fullName: 'Rebin Sulaka', team: 'Iraq', position: 'DF', club: 'Port FC (THA)' },
  { number: 3, nameOnShirt: 'HUSSEIN', fullName: 'Hussein Ali', team: 'Iraq', position: 'DF', club: 'Pogo ń  Szczecin (POL)' },
  { number: 4, nameOnShirt: 'ZAID T.', fullName: 'Zaid Tahseen', team: 'Iraq', position: 'DF', club: 'Pakhtakor Tashkent FK (UZB)' },
  { number: 5, nameOnShirt: 'AKAM', fullName: 'AKAM', team: 'Iraq', position: 'DF', club: 'Al Zawra\'a SC (IRQ)' },
  { number: 6, nameOnShirt: 'MUNAF', fullName: 'MUNAF', team: 'Iraq', position: 'DF', club: 'Al Shorta SC (IRQ)' },
  { number: 7, nameOnShirt: 'YOUSSEF', fullName: 'Youssef Amyn', team: 'Iraq', position: 'MF', club: 'AEK Larnaca FC (CYP)' },
  { number: 8, nameOnShirt: 'IBRAHIM', fullName: 'Ibrahim Bayesh', team: 'Iraq', position: 'MF', club: 'Al Dhafra SCC (UAE)' },
  { number: 9, nameOnShirt: 'AL-HAMADI', fullName: 'Ali Al-Hamadi', team: 'Iraq', position: 'FW', club: 'Luton Town FC (ENG)' },
  { number: 10, nameOnShirt: 'MOHANAD', fullName: 'Mohanad Ali', team: 'Iraq', position: 'FW', club: 'Dibba FC (UAE)' },
  { number: 11, nameOnShirt: 'AHMED Q.', fullName: 'Ahmed Qasem', team: 'Iraq', position: 'FW', club: 'Nashville SC (USA)' },
  { number: 12, nameOnShirt: 'JALAL', fullName: 'JALAL', team: 'Iraq', position: 'GK', club: 'Al Zawra\'a SC (IRQ)' },
  { number: 13, nameOnShirt: 'ALI Y.', fullName: 'Fahad Talib', team: 'Iraq', position: 'FW', club: 'Al Talaba SC (IRQ)' },
  { number: 14, nameOnShirt: 'Z. IQBAL', fullName: 'Zidane Iqbal', team: 'Iraq', position: 'MF', club: 'FC Utrecht (NED)' },
  { number: 15, nameOnShirt: 'AHMED', fullName: 'Ahmed Qasem', team: 'Iraq', position: 'DF', club: 'Al Shorta SC (IRQ)' },
  { number: 16, nameOnShirt: 'AL-AMMARI', fullName: 'Amir Al-Ammari', team: 'Iraq', position: 'MF', club: 'KS Cracovia (POL)' },
  { number: 17, nameOnShirt: 'ALI J.', fullName: 'Fahad Talib', team: 'Iraq', position: 'FW', club: 'Al Najmah SC (KSA)' },
  { number: 18, nameOnShirt: 'AYMEN', fullName: 'Aymen Hussein', team: 'Iraq', position: 'FW', club: 'Al Karma SC (IRQ)' },
  { number: 19, nameOnShirt: 'K. YAKOB', fullName: 'Kevin Yakob', team: 'Iraq', position: 'MF', club: 'Aarhus GF (DEN)' },
  { number: 20, nameOnShirt: 'AIMAR', fullName: 'Aimar Sher', team: 'Iraq', position: 'MF', club: 'Sarpsborg 08 FF (NOR)' },
  { number: 21, nameOnShirt: 'MARKO', fullName: 'Marko Farji', team: 'Iraq', position: 'FW', club: 'Venezia FC (ITA)' },
  { number: 22, nameOnShirt: 'AHMED B.', fullName: 'Ahmed Qasem', team: 'Iraq', position: 'GK', club: 'Al Shorta SC (IRQ)' },
  { number: 23, nameOnShirt: 'DOSKI', fullName: 'Merchas Doski', team: 'Iraq', position: 'DF', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 24, nameOnShirt: 'ZAID I.', fullName: 'Zaid Tahseen', team: 'Iraq', position: 'MF', club: 'Al Talaba SC (IRQ)' },
  { number: 25, nameOnShirt: 'MUSTAFA', fullName: 'Mustafa Saadoon', team: 'Iraq', position: 'DF', club: 'Al Shorta SC (IRQ)' },
  { number: 26, nameOnShirt: 'FRANS', fullName: 'Frans Putros', team: 'Iraq', position: 'DF', club: 'Persib Bandung (IDN)' },
  { number: 1, nameOnShirt: 'ALAQIDI', fullName: 'ALAQIDI', team: 'Saudi Arabia', position: 'GK', club: 'Al Nassr FC (KSA)' },
  { number: 2, nameOnShirt: 'MAJRASHI', fullName: 'Ali Majrashi', team: 'Saudi Arabia', position: 'DF', club: 'Al Ahli FC (KSA)' },
  { number: 3, nameOnShirt: 'LAJAMI', fullName: 'Ali Lajami', team: 'Saudi Arabia', position: 'DF', club: 'Al Hilal SC (KSA)' },
  { number: 4, nameOnShirt: 'ALAMRI', fullName: 'ALAMRI', team: 'Saudi Arabia', position: 'DF', club: 'Al Nassr FC (KSA)' },
  { number: 5, nameOnShirt: 'ALTAMBAKTI', fullName: 'ALTAMBAKTI', team: 'Saudi Arabia', position: 'DF', club: 'Al Hilal SC (KSA)' },
  { number: 6, nameOnShirt: 'NASSER', fullName: 'Nasser Al-Dawsari', team: 'Saudi Arabia', position: 'MF', club: 'Al Hilal SC (KSA)' },
  { number: 7, nameOnShirt: 'MUSAB', fullName: 'Musab Al-Juwayr', team: 'Saudi Arabia', position: 'MF', club: 'Al Qadsiah FC (KSA)' },
  { number: 8, nameOnShirt: 'AIMAN', fullName: 'AIMAN', team: 'Saudi Arabia', position: 'FW', club: 'Al Nassr FC (KSA)' },
  { number: 9, nameOnShirt: 'FERAS', fullName: 'FERAS', team: 'Saudi Arabia', position: 'FW', club: 'Al Ahli FC (KSA)' },
  { number: 10, nameOnShirt: 'SALEM', fullName: 'Salem Al-Dawsari', team: 'Saudi Arabia', position: 'FW', club: 'Al Hilal SC (KSA)' },
  { number: 11, nameOnShirt: 'ALSHEHRI', fullName: 'ALSHEHRI', team: 'Saudi Arabia', position: 'FW', club: 'Al Ittihad (KSA)' },
  { number: 12, nameOnShirt: 'SAUD', fullName: 'Saud Abdulhamid', team: 'Saudi Arabia', position: 'DF', club: 'RC Lens (FRA)' },
  { number: 13, nameOnShirt: 'NAWAF', fullName: 'Nawaf Al-Aqidi', team: 'Saudi Arabia', position: 'DF', club: 'Al Nassr FC (KSA)' },
  { number: 14, nameOnShirt: 'KADISH', fullName: 'KADISH', team: 'Saudi Arabia', position: 'DF', club: 'Al Ittihad (KSA)' },
  { number: 15, nameOnShirt: 'ALKHAIBARI', fullName: 'ALKHAIBARI', team: 'Saudi Arabia', position: 'MF', club: 'Al Nassr FC (KSA)' },
  { number: 16, nameOnShirt: 'ZIYAD', fullName: 'Ziyad Al-Johani', team: 'Saudi Arabia', position: 'MF', club: 'Al Ahli FC (KSA)' },
  { number: 17, nameOnShirt: 'KHALID', fullName: 'Ali Majrashi', team: 'Saudi Arabia', position: 'FW', club: 'Al Ettifaq FC (KSA)' },
  { number: 18, nameOnShirt: 'ALHAJJI', fullName: 'ALHAJJI', team: 'Saudi Arabia', position: 'MF', club: 'Neom SC (KSA)' },
  { number: 19, nameOnShirt: 'ALHAMDDAN', fullName: 'ALHAMDDAN', team: 'Saudi Arabia', position: 'FW', club: 'Al Nassr FC (KSA)' },
  { number: 20, nameOnShirt: 'MANDASH', fullName: 'Sultan Mandash', team: 'Saudi Arabia', position: 'FW', club: 'Al Hilal SC (KSA)' },
  { number: 21, nameOnShirt: 'ALOWAIS', fullName: 'ALOWAIS', team: 'Saudi Arabia', position: 'GK', club: 'Al Ula Saudi FC (KSA)' },
  { number: 22, nameOnShirt: 'ALKASSAR', fullName: 'ALKASSAR', team: 'Saudi Arabia', position: 'GK', club: 'Al Qadsiah FC (KSA)' },
  { number: 23, nameOnShirt: 'KANNO', fullName: 'Mohamed Kanno', team: 'Saudi Arabia', position: 'MF', club: 'Al Hilal SC (KSA)' },
  { number: 24, nameOnShirt: 'MOTEB', fullName: 'Moteb Al-Harbi', team: 'Saudi Arabia', position: 'DF', club: 'Al Hilal SC (KSA)' },
  { number: 25, nameOnShirt: 'JEHAD', fullName: 'Jehad Thakri', team: 'Saudi Arabia', position: 'DF', club: 'Al Qadsiah FC (KSA)' },
  { number: 26, nameOnShirt: 'MOHAMMED', fullName: 'Mohammed Al-Owais', team: 'Saudi Arabia', position: 'DF', club: 'Al Qadsiah FC (KSA)' },
  { number: 1, nameOnShirt: 'ABUNADA', fullName: 'Mahmud Abunada', team: 'Qatar', position: 'GK', club: 'Al Rayyan SC (QAT)' },
  { number: 2, nameOnShirt: 'PEDRO', fullName: 'Pedro Miguel', team: 'Qatar', position: 'DF', club: 'Al Sadd SC (QAT)' },
  { number: 3, nameOnShirt: 'L. MENDES', fullName: 'Lucas Mendes', team: 'Qatar', position: 'DF', club: 'Al Wakrah SC (QAT)' },
  { number: 4, nameOnShirt: 'GUEYE', fullName: 'GUEYE', team: 'Qatar', position: 'DF', club: 'Al Arabi SC (QAT)' },
  { number: 5, nameOnShirt: 'JASSEM', fullName: 'Jassem Gaber', team: 'Qatar', position: 'DF', club: 'Al Rayyan SC (QAT)' },
  { number: 6, nameOnShirt: 'A. AZIZ', fullName: 'Abdulaziz Hatem', team: 'Qatar', position: 'MF', club: 'Al Rayyan SC (QAT)' },
  { number: 7, nameOnShirt: 'ALAEDDIN', fullName: 'ALAEDDIN', team: 'Qatar', position: 'FW', club: 'Al Rayyan SC (QAT)' },
  { number: 8, nameOnShirt: 'EDMILSON JR.', fullName: 'Edmilson Junior', team: 'Qatar', position: 'FW', club: 'Al Duhail SC (QAT)' },
  { number: 9, nameOnShirt: 'MUNTARI', fullName: 'Mohammed Muntari', team: 'Qatar', position: 'FW', club: 'Al Gharafa SC (QAT)' },
  { number: 10, nameOnShirt: 'ALHAYDOS', fullName: 'ALHAYDOS', team: 'Qatar', position: 'FW', club: 'Al Sadd SC (QAT)' },
  { number: 11, nameOnShirt: 'AFIF', fullName: 'Akram Afif', team: 'Qatar', position: 'FW', club: 'Al Sadd SC (QAT)' },
  { number: 12, nameOnShirt: 'KARIM', fullName: 'Karim Boudiaf', team: 'Qatar', position: 'MF', club: 'Al Duhail SC (QAT)' },
  { number: 13, nameOnShirt: 'AYOUB', fullName: 'Ayoub Al-Oui', team: 'Qatar', position: 'DF', club: 'Al Gharafa SC (QAT)' },
  { number: 14, nameOnShirt: 'HOMAM', fullName: 'Homam Ahmed', team: 'Qatar', position: 'DF', club: 'Cultural Leonesa (ESP)' },
  { number: 15, nameOnShirt: 'YUSUF', fullName: 'Yusuf Abdurisag', team: 'Qatar', position: 'FW', club: 'Al Wakrah SC (QAT)' },
  { number: 16, nameOnShirt: 'KHOUKHI', fullName: 'Boualem Khoukhi', team: 'Qatar', position: 'DF', club: 'Al Sadd SC (QAT)' },
  { number: 17, nameOnShirt: 'A. ALGANEHI', fullName: 'A. ALGANEHI', team: 'Qatar', position: 'MF', club: 'Al Gharafa SC (QAT)' },
  { number: 18, nameOnShirt: 'SULTAN', fullName: 'Sultan Al-Brake', team: 'Qatar', position: 'DF', club: 'Al Duhail SC (QAT)' },
  { number: 19, nameOnShirt: 'ALMOEZ', fullName: 'Almoez Ali', team: 'Qatar', position: 'FW', club: 'Al Duhail SC (QAT)' },
  { number: 20, nameOnShirt: 'A. FATHY', fullName: 'Ahmed Fathy', team: 'Qatar', position: 'MF', club: 'Al Arabi SC (QAT)' },
  { number: 21, nameOnShirt: 'SALAH', fullName: 'Salah Zakaria', team: 'Qatar', position: 'GK', club: 'Al Duhail SC (QAT)' },
  { number: 22, nameOnShirt: 'BARSHAM', fullName: 'Meshaal Barsham', team: 'Qatar', position: 'GK', club: 'Al Sadd SC (QAT)' },
  { number: 23, nameOnShirt: 'MADIBO', fullName: 'Assim Madibo', team: 'Qatar', position: 'MF', club: 'Al Wakrah SC (QAT)' },
  { number: 24, nameOnShirt: 'TAHSIN', fullName: 'Tahsin Jamshid', team: 'Qatar', position: 'FW', club: 'Al Duhail SC (QAT)' },
  { number: 25, nameOnShirt: 'ALHASHMI', fullName: 'ALHASHMI', team: 'Qatar', position: 'DF', club: 'Al Arabi SC (QAT)' },
  { number: 26, nameOnShirt: 'MANAI', fullName: 'Mohamed Manai', team: 'Qatar', position: 'FW', club: 'Al Shamal SC (QAT)' },
  { number: 1, nameOnShirt: 'RYAN', fullName: 'Mathew Ryan', team: 'Australia', position: 'GK', club: 'Levante UD (ESP)' },
  { number: 2, nameOnShirt: 'DEGENEK', fullName: 'Miloš Degenek', team: 'Australia', position: 'DF', club: 'APOEL FC (CYP)' },
  { number: 3, nameOnShirt: 'CIRCATI', fullName: 'Alessandro Circati', team: 'Australia', position: 'DF', club: 'Parma (ITA)' },
  { number: 4, nameOnShirt: 'ITALIANO', fullName: 'Jacob Italiano', team: 'Australia', position: 'DF', club: 'Grazer AK (AUT)' },
  { number: 5, nameOnShirt: 'BOS', fullName: 'Jordan Bos', team: 'Australia', position: 'DF', club: 'Feyenoord Rotterdam (NED)' },
  { number: 6, nameOnShirt: 'GERIA', fullName: 'Jason Geria', team: 'Australia', position: 'DF', club: 'Albirex Niigata (JPN)' },
  { number: 7, nameOnShirt: 'LECKIE', fullName: 'Mathew Leckie', team: 'Australia', position: 'FW', club: 'Melbourne City FC (AUS)' },
  { number: 8, nameOnShirt: 'METCALFE', fullName: 'Connor Metcalfe', team: 'Australia', position: 'MF', club: 'FC St. Pauli (GER)' },
  { number: 9, nameOnShirt: 'TOURE', fullName: 'Mohamed Touré', team: 'Australia', position: 'FW', club: 'Norwich City FC (ENG)' },
  { number: 10, nameOnShirt: 'HRUSTIC', fullName: 'Ajdin Hrustic', team: 'Australia', position: 'FW', club: 'SC Heracles Almelo (NED)' },
  { number: 11, nameOnShirt: 'MABIL', fullName: 'Awer Mabil', team: 'Australia', position: 'FW', club: 'CD Castellón (ESP)' },
  { number: 12, nameOnShirt: 'IZZO', fullName: 'Paul Izzo', team: 'Australia', position: 'GK', club: 'Randers FC (DEN)' },
  { number: 13, nameOnShirt: 'O\'NEILL', fullName: 'O\'NEILL', team: 'Australia', position: 'MF', club: 'New York City FC (USA)' },
  { number: 14, nameOnShirt: 'DEVLIN', fullName: 'Cammy Devlin', team: 'Australia', position: 'MF', club: 'Heart Of Midlothian FC (SCO)' },
  { number: 15, nameOnShirt: 'TREWIN', fullName: 'Kai Trewin', team: 'Australia', position: 'DF', club: 'New York City FC (USA)' },
  { number: 16, nameOnShirt: 'BEHICH', fullName: 'Aziz Behich', team: 'Australia', position: 'DF', club: 'Melbourne City FC (AUS)' },
  { number: 17, nameOnShirt: 'IRANKUNDA', fullName: 'Nestory Irankunda', team: 'Australia', position: 'FW', club: 'Watford FC (ENG)' },
  { number: 18, nameOnShirt: 'BEACH', fullName: 'Patrick Beach', team: 'Australia', position: 'GK', club: 'Melbourne City FC (AUS)' },
  { number: 19, nameOnShirt: 'SOUTTAR', fullName: 'Harry Souttar', team: 'Australia', position: 'DF', club: 'Leicester City FC (ENG)' },
  { number: 20, nameOnShirt: 'VOLPATO', fullName: 'Cristian Volpato', team: 'Australia', position: 'FW', club: 'US Sassuolo (ITA)' },
  { number: 21, nameOnShirt: 'BURGESS', fullName: 'Cameron Burgess', team: 'Australia', position: 'DF', club: 'Swansea City AFC (WAL)' },
  { number: 22, nameOnShirt: 'IRVINE', fullName: 'Jackson Irvine', team: 'Australia', position: 'MF', club: 'FC St. Pauli (GER)' },
  { number: 23, nameOnShirt: 'VELUPILLAY', fullName: 'Nishan Velupillay', team: 'Australia', position: 'FW', club: 'Melbourne Victory FC (AUS)' },
  { number: 24, nameOnShirt: 'OKON-ENGSTLER', fullName: 'Paul Okon-Engstler', team: 'Australia', position: 'MF', club: 'Sydney FC (AUS)' },
  { number: 25, nameOnShirt: 'HERRINGTON', fullName: 'Lucas Herrington', team: 'Australia', position: 'DF', club: 'Colorado Rapids (USA)' },
  { number: 26, nameOnShirt: 'YENGI', fullName: 'Tete Yengi', team: 'Australia', position: 'FW', club: 'FC Machida Zelvia (JPN)' },
  { number: 1, nameOnShirt: 'YUSUPOV', fullName: 'Utkir Yusupov', team: 'Uzbekistan', position: 'GK', club: 'PFC Navbahor Namangan (UZB)' },
  { number: 2, nameOnShirt: 'KHUSANOV', fullName: 'Abdukodir Khusanov', team: 'Uzbekistan', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 3, nameOnShirt: 'ALIJONOV', fullName: 'Khojiakbar Alijonov', team: 'Uzbekistan', position: 'DF', club: 'Pakhtakor Tashkent FK (UZB)' },
  { number: 4, nameOnShirt: 'SAYFIEV', fullName: 'SAYFIEV', team: 'Uzbekistan', position: 'DF', club: 'FK Neftchi Farg\'ona (UZB)' },
  { number: 5, nameOnShirt: 'ASHURMATOV', fullName: 'Rustam Ashurmatov', team: 'Uzbekistan', position: 'DF', club: 'Esteghlal Tehran FC (IRN)' },
  { number: 6, nameOnShirt: 'MOZGOVOY', fullName: 'Akmal Mozgovoy', team: 'Uzbekistan', position: 'MF', club: 'Pakhtakor Tashkent FK (UZB)' },
  { number: 7, nameOnShirt: 'SHUKUROV', fullName: 'Otabek Shukurov', team: 'Uzbekistan', position: 'MF', club: 'Baniyas Club (UAE)' },
  { number: 8, nameOnShirt: 'ISKANDEROV', fullName: 'ISKANDEROV', team: 'Uzbekistan', position: 'MF', club: 'FK Neftchi Farg\'ona (UZB)' },
  { number: 9, nameOnShirt: 'XAMROBEKOV', fullName: 'XAMROBEKOV', team: 'Uzbekistan', position: 'MF', club: 'Tractor Sazi Tabriz FC (IRN)' },
  { number: 10, nameOnShirt: 'MASHARIPOV', fullName: 'MASHARIPOV', team: 'Uzbekistan', position: 'MF', club: 'Esteghlal Tehran FC (IRN)' },
  { number: 11, nameOnShirt: 'URUNOV', fullName: 'Oston Urunov', team: 'Uzbekistan', position: 'MF', club: 'Persepolis FC (IRN)' },
  { number: 12, nameOnShirt: 'NEMATOV', fullName: 'Abduvohid Nematov', team: 'Uzbekistan', position: 'GK', club: 'Nasaf Qarshi FC (UZB)' },
  { number: 13, nameOnShirt: 'NASRULLAEV', fullName: 'Sherzod Nasrullaev', team: 'Uzbekistan', position: 'DF', club: 'Pakhtakor Tashkent FK (UZB)' },
  { number: 14, nameOnShirt: 'SHOMURODOV', fullName: 'Eldor Shomurodov', team: 'Uzbekistan', position: 'FW', club: 'Ba ş ak ş ehir FK (TUR)' },
  { number: 15, nameOnShirt: 'ESHMURODOV', fullName: 'Umar Eshmurodov', team: 'Uzbekistan', position: 'DF', club: 'Nasaf Qarshi FC (UZB)' },
  { number: 16, nameOnShirt: 'ERGASHEV', fullName: 'ERGASHEV', team: 'Uzbekistan', position: 'GK', club: 'FK Neftchi Farg\'ona (UZB)' },
  { number: 17, nameOnShirt: 'KHAMDAMOV', fullName: 'Dostonbek Khamdamov', team: 'Uzbekistan', position: 'MF', club: 'Pakhtakor Tashkent FK (UZB)' },
  { number: 18, nameOnShirt: 'ABDULLAEV', fullName: 'Abdulla Abdullaev', team: 'Uzbekistan', position: 'DF', club: 'Dibba FC (UAE)' },
  { number: 19, nameOnShirt: 'GANIEV', fullName: 'Azizjon Ganiev', team: 'Uzbekistan', position: 'MF', club: 'Al Bataeh Club (UAE)' },
  { number: 20, nameOnShirt: 'AMONOV', fullName: 'Azizbek Amonov', team: 'Uzbekistan', position: 'FW', club: 'FK Dinamo Samarkand (UZB)' },
  { number: 21, nameOnShirt: 'SERGEEV', fullName: 'Igor Sergeev', team: 'Uzbekistan', position: 'FW', club: 'Persepolis FC (IRN)' },
  { number: 22, nameOnShirt: 'FAYZULLAEV', fullName: 'Abbosbek Fayzullaev', team: 'Uzbekistan', position: 'MF', club: 'Ba ş ak ş ehir FK (TUR)' },
  { number: 23, nameOnShirt: 'ESANOV', fullName: 'Sherzod Esanov', team: 'Uzbekistan', position: 'MF', club: 'FK Buxoro (UZB)' },
  { number: 24, nameOnShirt: 'KARIMOV', fullName: 'Bekhruz Karimov', team: 'Uzbekistan', position: 'DF', club: 'Surkhon FK (UZB)' },
  { number: 25, nameOnShirt: 'ULMASALIYEV', fullName: 'ULMASALIYEV', team: 'Uzbekistan', position: 'DF', club: 'OKMK FK (UZB)' },
  { number: 26, nameOnShirt: 'UROZOV', fullName: 'Jakhongir Urozov', team: 'Uzbekistan', position: 'DF', club: 'FK Dinamo Samarkand (UZB)' },
  { number: 1, nameOnShirt: 'PICKFORD', fullName: 'Jordan Pickford', team: 'England', position: 'GK', club: 'Everton FC (ENG)' },
  { number: 2, nameOnShirt: 'KONSA', fullName: 'Ezri Konsa', team: 'England', position: 'DF', club: 'Aston Villa FC (ENG)' },
  { number: 3, nameOnShirt: 'O\'REILLY', fullName: 'O\'REILLY', team: 'England', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 4, nameOnShirt: 'RICE', fullName: 'Declan Rice', team: 'England', position: 'MF', club: 'Arsenal FC (ENG)' },
  { number: 5, nameOnShirt: 'STONES', fullName: 'John Stones', team: 'England', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 6, nameOnShirt: 'GUEHI', fullName: 'Marc Guéhi', team: 'England', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 7, nameOnShirt: 'SAKA', fullName: 'Bukayo Saka', team: 'England', position: 'FW', club: 'Arsenal FC (ENG)' },
  { number: 8, nameOnShirt: 'ANDERSON', fullName: 'Elliot Anderson', team: 'England', position: 'MF', club: 'Nottingham Forest FC (ENG)' },
  { number: 9, nameOnShirt: 'KANE', fullName: 'Harry Kane', team: 'England', position: 'FW', club: 'FC Bayern München (GER)' },
  { number: 10, nameOnShirt: 'BELLINGHAM', fullName: 'Jude Bellingham', team: 'England', position: 'MF', club: 'Real Madrid C. F. (ESP)' },
  { number: 11, nameOnShirt: 'RASHFORD', fullName: 'Marcus Rashford', team: 'England', position: 'FW', club: 'FC Barcelona (ESP)' },
  { number: 12, nameOnShirt: 'LIVRAMENTO', fullName: 'LIVRAMENTO', team: 'England', position: 'DF', club: 'Newcastle United FC (ENG)' },
  { number: 13, nameOnShirt: 'D. HENDERSON', fullName: 'Dean Henderson', team: 'England', position: 'GK', club: 'Crystal Palace FC (ENG)' },
  { number: 14, nameOnShirt: 'J. HENDERSON', fullName: 'Dean Henderson', team: 'England', position: 'MF', club: 'Brentford FC (ENG)' },
  { number: 15, nameOnShirt: 'BURN', fullName: 'Dan Burn', team: 'England', position: 'DF', club: 'Newcastle United FC (ENG)' },
  { number: 16, nameOnShirt: 'MAINOO', fullName: 'Kobbie Mainoo', team: 'England', position: 'MF', club: 'Manchester United FC (ENG)' },
  { number: 17, nameOnShirt: 'ROGERS', fullName: 'Morgan Rogers', team: 'England', position: 'MF', club: 'Aston Villa FC (ENG)' },
  { number: 18, nameOnShirt: 'GORDON', fullName: 'Anthony Gordon', team: 'England', position: 'FW', club: 'Newcastle United FC (ENG)' },
  { number: 19, nameOnShirt: 'WATKINS', fullName: 'Ollie Watkins', team: 'England', position: 'FW', club: 'Aston Villa FC (ENG)' },
  { number: 20, nameOnShirt: 'MADUEKE', fullName: 'Noni Madueke', team: 'England', position: 'FW', club: 'Arsenal FC (ENG)' },
  { number: 21, nameOnShirt: 'EZE', fullName: 'Eberechi Eze', team: 'England', position: 'MF', club: 'Arsenal FC (ENG)' },
  { number: 22, nameOnShirt: 'TONEY', fullName: 'Ivan Toney', team: 'England', position: 'FW', club: 'Al Ahli FC (KSA)' },
  { number: 23, nameOnShirt: 'TRAFFORD', fullName: 'James Trafford', team: 'England', position: 'GK', club: 'Manchester City FC (ENG)' },
  { number: 24, nameOnShirt: 'JAMES', fullName: 'James Trafford', team: 'England', position: 'DF', club: 'Chelsea FC (ENG)' },
  { number: 25, nameOnShirt: 'SPENCE', fullName: 'Djed Spence', team: 'England', position: 'DF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 26, nameOnShirt: 'QUANSAH', fullName: 'Jarell Quansah', team: 'England', position: 'DF', club: 'Bayer Leverkusen (GER)' },
  { number: 1, nameOnShirt: 'SAMBA', fullName: 'Brice Samba', team: 'France', position: 'GK', club: 'Stade Rennais FC (FRA)' },
  { number: 2, nameOnShirt: 'GUSTO', fullName: 'Malo Gusto', team: 'France', position: 'DF', club: 'Chelsea FC (ENG)' },
  { number: 3, nameOnShirt: 'DIGNE', fullName: 'Lucas Digne', team: 'France', position: 'DF', club: 'Aston Villa FC (ENG)' },
  { number: 4, nameOnShirt: 'UPAMECANO', fullName: 'Dayot Upamecano', team: 'France', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 5, nameOnShirt: 'KOUNDE', fullName: 'Jules Koundé', team: 'France', position: 'DF', club: 'FC Barcelona (ESP)' },
  { number: 6, nameOnShirt: 'KONE', fullName: 'Manu Koné', team: 'France', position: 'MF', club: 'AS Roma (ITA)' },
  { number: 7, nameOnShirt: 'DEMBELE', fullName: 'Ousmane Dembélé', team: 'France', position: 'FW', club: 'Paris Saint-Germain (FRA)' },
  { number: 8, nameOnShirt: 'TCHOUAMENI', fullName: 'Aurélien Tchouaméni', team: 'France', position: 'MF', club: 'Real Madrid C. F. (ESP)' },
  { number: 9, nameOnShirt: 'THURAM', fullName: 'Marcus Thuram', team: 'France', position: 'FW', club: 'FC Internazionale Milano (ITA)' },
  { number: 10, nameOnShirt: 'MBAPPE', fullName: 'Kylian Mbappé', team: 'France', position: 'FW', club: 'Real Madrid C. F. (ESP)' },
  { number: 11, nameOnShirt: 'OLISE', fullName: 'Michael Olise', team: 'France', position: 'FW', club: 'FC Bayern München (GER)' },
  { number: 12, nameOnShirt: 'BARCOLA', fullName: 'Bradley Barcola', team: 'France', position: 'FW', club: 'Paris Saint-Germain (FRA)' },
  { number: 13, nameOnShirt: 'KANTE', fullName: 'N\'Golo Kanté', team: 'France', position: 'MF', club: 'Fenerbahçe SK (TUR)' },
  { number: 14, nameOnShirt: 'RABIOT', fullName: 'Adrien Rabiot', team: 'France', position: 'MF', club: 'AC Milan (ITA)' },
  { number: 15, nameOnShirt: 'KONATE', fullName: 'Ibrahima Konaté', team: 'France', position: 'DF', club: 'Liverpool FC (ENG)' },
  { number: 16, nameOnShirt: 'MAIGNAN', fullName: 'Mike Maignan', team: 'France', position: 'GK', club: 'AC Milan (ITA)' },
  { number: 17, nameOnShirt: 'SALIBA', fullName: 'William Saliba', team: 'France', position: 'DF', club: 'Arsenal FC (ENG)' },
  { number: 18, nameOnShirt: 'ZAIRE EMERY', fullName: 'Warren Zaïre-Emery', team: 'France', position: 'MF', club: 'Paris Saint-Germain (FRA)' },
  { number: 19, nameOnShirt: 'T. HERNANDEZ', fullName: 'Théo Hernandez', team: 'France', position: 'DF', club: 'Al Hilal SC (KSA)' },
  { number: 20, nameOnShirt: 'DOUE', fullName: 'Désiré Doué', team: 'France', position: 'FW', club: 'Paris Saint-Germain (FRA)' },
  { number: 21, nameOnShirt: 'L. HERNANDEZ', fullName: 'Théo Hernandez', team: 'France', position: 'DF', club: 'Paris Saint-Germain (FRA)' },
  { number: 22, nameOnShirt: 'MATETA', fullName: 'Jean-Philippe Mateta', team: 'France', position: 'FW', club: 'Crystal Palace FC (ENG)' },
  { number: 23, nameOnShirt: 'RISSER', fullName: 'Robin Risser', team: 'France', position: 'GK', club: 'RC Lens (FRA)' },
  { number: 24, nameOnShirt: 'CHERKI', fullName: 'Rayan Cherki', team: 'France', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 25, nameOnShirt: 'AKLIOUCHE', fullName: 'Maghnes Akliouche', team: 'France', position: 'MF', club: 'AS Monaco (FRA)' },
  { number: 26, nameOnShirt: 'LACROIX', fullName: 'Maxence Lacroix', team: 'France', position: 'DF', club: 'Crystal Palace FC (ENG)' },
  { number: 1, nameOnShirt: 'NEUER', fullName: 'Manuel Neuer', team: 'Germany', position: 'GK', club: 'FC Bayern München (GER)' },
  { number: 2, nameOnShirt: 'RUDIGER', fullName: 'Antonio Rüdiger', team: 'Germany', position: 'DF', club: 'Real Madrid C. F. (ESP)' },
  { number: 3, nameOnShirt: 'ANTON', fullName: 'Antonio Rüdiger', team: 'Germany', position: 'DF', club: 'Borussia Dortmund (GER)' },
  { number: 4, nameOnShirt: 'TAH', fullName: 'Jonathan Tah', team: 'Germany', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 5, nameOnShirt: 'PAVLOVIC', fullName: 'Aleksandar Pavlović', team: 'Germany', position: 'MF', club: 'FC Bayern München (GER)' },
  { number: 6, nameOnShirt: 'KIMMICH', fullName: 'Joshua Kimmich', team: 'Germany', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 7, nameOnShirt: 'HAVERTZ', fullName: 'Kai Havertz', team: 'Germany', position: 'FW', club: 'Arsenal FC (ENG)' },
  { number: 8, nameOnShirt: 'GORETZKA', fullName: 'Leon Goretzka', team: 'Germany', position: 'MF', club: 'FC Bayern München (GER)' },
  { number: 9, nameOnShirt: 'LEWELING', fullName: 'Jamie Leweling', team: 'Germany', position: 'MF', club: 'VfB Stuttgart (GER)' },
  { number: 10, nameOnShirt: 'MUSIALA', fullName: 'Jamal Musiala', team: 'Germany', position: 'MF', club: 'FC Bayern München (GER)' },
  { number: 11, nameOnShirt: 'WOLTEMADE', fullName: 'Nick Woltemade', team: 'Germany', position: 'FW', club: 'Newcastle United FC (ENG)' },
  { number: 12, nameOnShirt: 'BAUMANN', fullName: 'Oliver Baumann', team: 'Germany', position: 'GK', club: 'TSG Hoffenheim (GER)' },
  { number: 13, nameOnShirt: 'GROß', fullName: 'Pascal Groß', team: 'Germany', position: 'MF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 14, nameOnShirt: 'BEIER', fullName: 'Maximilian Beier', team: 'Germany', position: 'FW', club: 'Borussia Dortmund (GER)' },
  { number: 15, nameOnShirt: 'SCHLOTTERBECK', fullName: 'Nico Schlotterbeck', team: 'Germany', position: 'DF', club: 'Borussia Dortmund (GER)' },
  { number: 16, nameOnShirt: 'STILLER', fullName: 'Angelo Stiller', team: 'Germany', position: 'MF', club: 'VfB Stuttgart (GER)' },
  { number: 17, nameOnShirt: 'WIRTZ', fullName: 'Florian Wirtz', team: 'Germany', position: 'MF', club: 'Liverpool FC (ENG)' },
  { number: 18, nameOnShirt: 'BROWN', fullName: 'Nathaniel Brown', team: 'Germany', position: 'DF', club: 'Eintracht Frankfurt (GER)' },
  { number: 19, nameOnShirt: 'SANÉ', fullName: 'Leroy Sané', team: 'Germany', position: 'MF', club: 'Galatasaray SK (TUR)' },
  { number: 20, nameOnShirt: 'AMIRI', fullName: 'Nadiem Amiri', team: 'Germany', position: 'MF', club: '1. FSV Mainz 05 (GER)' },
  { number: 21, nameOnShirt: 'NÜBEL', fullName: 'Alexander Nübel', team: 'Germany', position: 'GK', club: 'VfB Stuttgart (GER)' },
  { number: 22, nameOnShirt: 'RAUM', fullName: 'David Raum', team: 'Germany', position: 'DF', club: 'RB Leipzig (GER)' },
  { number: 23, nameOnShirt: 'NMECHA', fullName: 'Felix Nmecha', team: 'Germany', position: 'MF', club: 'Borussia Dortmund (GER)' },
  { number: 24, nameOnShirt: 'THIAW', fullName: 'Malick Thiaw', team: 'Germany', position: 'DF', club: 'Newcastle United FC (ENG)' },
  { number: 25, nameOnShirt: 'KARL', fullName: 'KARL', team: 'Germany', position: 'MF', club: 'FC Bayern München (GER)' },
  { number: 26, nameOnShirt: 'UNDAV', fullName: 'Deniz Undav', team: 'Germany', position: 'FW', club: 'VfB Stuttgart (GER)' },
  { number: 1, nameOnShirt: 'RAYA', fullName: 'David Raya', team: 'Spain', position: 'GK', club: 'Arsenal FC (ENG)' },
  { number: 2, nameOnShirt: 'MARC PUBILL', fullName: 'MARC PUBILL', team: 'Spain', position: 'DF', club: 'Atlético De Madrid (ESP)' },
  { number: 3, nameOnShirt: 'GRIMALDO', fullName: 'Álex Grimaldo', team: 'Spain', position: 'DF', club: 'Bayer Leverkusen (GER)' },
  { number: 4, nameOnShirt: 'ERIC', fullName: 'Eric García', team: 'Spain', position: 'DF', club: 'FC Barcelona (ESP)' },
  { number: 5, nameOnShirt: 'M. LLORENTE', fullName: 'Marcos Llorente', team: 'Spain', position: 'DF', club: 'Atlético De Madrid (ESP)' },
  { number: 6, nameOnShirt: 'MERINO', fullName: 'Mikel Merino', team: 'Spain', position: 'MF', club: 'Arsenal FC (ENG)' },
  { number: 7, nameOnShirt: 'FERRAN', fullName: 'Ferran Torres', team: 'Spain', position: 'FW', club: 'FC Barcelona (ESP)' },
  { number: 8, nameOnShirt: 'FABIÁN', fullName: 'Fabián Ruiz', team: 'Spain', position: 'MF', club: 'Paris Saint-Germain (FRA)' },
  { number: 9, nameOnShirt: 'GAVI', fullName: 'GAVI', team: 'Spain', position: 'MF', club: 'FC Barcelona (ESP)' },
  { number: 10, nameOnShirt: 'OLMO', fullName: 'Dani Olmo', team: 'Spain', position: 'FW', club: 'FC Barcelona (ESP)' },
  { number: 11, nameOnShirt: 'JEREMY', fullName: 'JEREMY', team: 'Spain', position: 'FW', club: 'Crystal Palace FC (ENG)' },
  { number: 12, nameOnShirt: 'PEDRO PORRO', fullName: 'PEDRO PORRO', team: 'Spain', position: 'DF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 13, nameOnShirt: 'JOAN GARCÍA', fullName: 'Eric García', team: 'Spain', position: 'GK', club: 'FC Barcelona (ESP)' },
  { number: 14, nameOnShirt: 'LAPORTE', fullName: 'Aymeric Laporte', team: 'Spain', position: 'DF', club: 'Athletic Club (ESP)' },
  { number: 15, nameOnShirt: 'ALEX B.', fullName: 'Álex Grimaldo', team: 'Spain', position: 'MF', club: 'Atlético De Madrid (ESP)' },
  { number: 16, nameOnShirt: 'RODRIGO', fullName: 'Rodri', team: 'Spain', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 17, nameOnShirt: 'WILLIAMS JR', fullName: 'Nico Williams', team: 'Spain', position: 'FW', club: 'Athletic Club (ESP)' },
  { number: 18, nameOnShirt: 'ZUBIMENDI', fullName: 'Martín Zubimendi', team: 'Spain', position: 'MF', club: 'Arsenal FC (ENG)' },
  { number: 19, nameOnShirt: 'LAMINE YAMAL', fullName: 'LAMINE YAMAL', team: 'Spain', position: 'FW', club: 'FC Barcelona (ESP)' },
  { number: 20, nameOnShirt: 'PEDRI', fullName: 'PEDRI', team: 'Spain', position: 'MF', club: 'FC Barcelona (ESP)' },
  { number: 21, nameOnShirt: 'OYARZABAL', fullName: 'Mikel Oyarzabal', team: 'Spain', position: 'FW', club: 'Real Sociedad (ESP)' },
  { number: 22, nameOnShirt: 'CUBARSI', fullName: 'Pau Cubarsí', team: 'Spain', position: 'DF', club: 'FC Barcelona (ESP)' },
  { number: 23, nameOnShirt: 'UNAI SIMÓN', fullName: 'UNAI SIMÓN', team: 'Spain', position: 'GK', club: 'Athletic Club (ESP)' },
  { number: 24, nameOnShirt: 'CUCURELLA', fullName: 'Marc Cucurella', team: 'Spain', position: 'DF', club: 'Chelsea FC (ENG)' },
  { number: 25, nameOnShirt: 'VICTOR M.V.', fullName: 'Víctor Muñoz', team: 'Spain', position: 'FW', club: 'CA Osasuna (ESP)' },
  { number: 26, nameOnShirt: 'B. IGLESIAS', fullName: 'Borja Iglesias', team: 'Spain', position: 'FW', club: 'RC Celta Vigo (ESP)' },
  { number: 1, nameOnShirt: 'DIOGO COSTA', fullName: 'DIOGO COSTA', team: 'Portugal', position: 'GK', club: 'FC Porto (POR)' },
  { number: 2, nameOnShirt: 'N. SEMEDO', fullName: 'Nélson Semedo', team: 'Portugal', position: 'DF', club: 'Fenerbahçe SK (TUR)' },
  { number: 3, nameOnShirt: 'RÚBEN DIAS', fullName: 'RÚBEN DIAS', team: 'Portugal', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 4, nameOnShirt: 'TOMAS A.', fullName: 'Tomás Araújo', team: 'Portugal', position: 'DF', club: 'SL Benca (POR)' },
  { number: 5, nameOnShirt: 'DALOT', fullName: 'Diogo Dalot', team: 'Portugal', position: 'DF', club: 'Manchester United FC (ENG)' },
  { number: 6, nameOnShirt: 'MATHEUS N.', fullName: 'Matheus Nunes', team: 'Portugal', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 7, nameOnShirt: 'RONALDO', fullName: 'Cristiano Ronaldo', team: 'Portugal', position: 'FW', club: 'Al Nassr FC (KSA)' },
  { number: 8, nameOnShirt: 'B. FERNANDES', fullName: 'Bruno Fernandes', team: 'Portugal', position: 'MF', club: 'Manchester United FC (ENG)' },
  { number: 9, nameOnShirt: 'G. RAMOS', fullName: 'Gonçalo Ramos', team: 'Portugal', position: 'FW', club: 'Paris Saint-Germain (FRA)' },
  { number: 10, nameOnShirt: 'BERNARDO', fullName: 'Bernardo Silva', team: 'Portugal', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 11, nameOnShirt: 'JOÃO FÉLIX', fullName: 'JOÃO FÉLIX', team: 'Portugal', position: 'FW', club: 'Al Nassr FC (KSA)' },
  { number: 12, nameOnShirt: 'JOSÉ SÁ', fullName: 'JOSÉ SÁ', team: 'Portugal', position: 'GK', club: 'Wolverhampton Wanderers FC (ENG)' },
  { number: 13, nameOnShirt: 'RENATO VEIGA', fullName: 'RENATO VEIGA', team: 'Portugal', position: 'DF', club: 'Villarreal CF (ESP)' },
  { number: 14, nameOnShirt: 'G. INÁCIO', fullName: 'Gonçalo Inácio', team: 'Portugal', position: 'DF', club: 'Sporting CP (POR)' },
  { number: 15, nameOnShirt: 'JOÃO NEVES', fullName: 'João Félix', team: 'Portugal', position: 'MF', club: 'Paris Saint-Germain (FRA)' },
  { number: 16, nameOnShirt: 'TRINCÃO', fullName: 'Francisco Trincão', team: 'Portugal', position: 'FW', club: 'Sporting CP (POR)' },
  { number: 17, nameOnShirt: 'RAFA LEÃO', fullName: 'Rafael Leão', team: 'Portugal', position: 'FW', club: 'AC Milan (ITA)' },
  { number: 18, nameOnShirt: 'NETO', fullName: 'Pedro Neto', team: 'Portugal', position: 'FW', club: 'Chelsea FC (ENG)' },
  { number: 19, nameOnShirt: 'G. GUEDES', fullName: 'Gonçalo Guedes', team: 'Portugal', position: 'FW', club: 'Real Sociedad (ESP)' },
  { number: 20, nameOnShirt: 'JOÃO CANCELO', fullName: 'João Félix', team: 'Portugal', position: 'DF', club: 'FC Barcelona (ESP)' },
  { number: 21, nameOnShirt: 'R. NEVES', fullName: 'João Neves', team: 'Portugal', position: 'MF', club: 'Al Hilal SC (KSA)' },
  { number: 22, nameOnShirt: 'RUI SILVA', fullName: 'Bernardo Silva', team: 'Portugal', position: 'GK', club: 'Sporting CP (POR)' },
  { number: 23, nameOnShirt: 'VITINHA', fullName: 'VITINHA', team: 'Portugal', position: 'MF', club: 'Paris Saint-Germain (FRA)' },
  { number: 24, nameOnShirt: 'SAMU', fullName: 'José Sá', team: 'Portugal', position: 'DF', club: 'RCD Mallorca (ESP)' },
  { number: 25, nameOnShirt: 'N. MENDES', fullName: 'Nuno Mendes', team: 'Portugal', position: 'DF', club: 'Paris Saint-Germain (FRA)' },
  { number: 26, nameOnShirt: 'F. CONCEIÇÃO', fullName: 'Francisco Conceição', team: 'Portugal', position: 'FW', club: 'Juventus FC (ITA)' },
  { number: 1, nameOnShirt: 'VERBRUGGEN', fullName: 'Bart Verbruggen', team: 'Netherlands', position: 'GK', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 2, nameOnShirt: 'J. TIMBER', fullName: 'Quinten Timber', team: 'Netherlands', position: 'DF', club: 'Arsenal FC (ENG)' },
  { number: 3, nameOnShirt: 'DE ROON', fullName: 'Marten de Roon', team: 'Netherlands', position: 'MF', club: 'Atalanta Bergamo (ITA)' },
  { number: 4, nameOnShirt: 'VIRGIL', fullName: 'Virgil van Dijk', team: 'Netherlands', position: 'DF', club: 'Liverpool FC (ENG)' },
  { number: 5, nameOnShirt: 'AKÉ', fullName: 'Nathan Aké', team: 'Netherlands', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 6, nameOnShirt: 'VAN HECKE', fullName: 'Virgil van Dijk', team: 'Netherlands', position: 'DF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 7, nameOnShirt: 'KLUIVERT', fullName: 'Justin Kluivert', team: 'Netherlands', position: 'MF', club: 'AFC Bournemouth (ENG)' },
  { number: 8, nameOnShirt: 'GRAVENBERCH', fullName: 'Ryan Gravenberch', team: 'Netherlands', position: 'MF', club: 'Liverpool FC (ENG)' },
  { number: 9, nameOnShirt: 'WEGHORST', fullName: 'Wout Weghorst', team: 'Netherlands', position: 'FW', club: 'AFC Ajax (NED)' },
  { number: 10, nameOnShirt: 'MEMPHIS', fullName: 'Memphis Depay', team: 'Netherlands', position: 'FW', club: 'SC Corinthians (BRA)' },
  { number: 11, nameOnShirt: 'GAKPO', fullName: 'Cody Gakpo', team: 'Netherlands', position: 'FW', club: 'Liverpool FC (ENG)' },
  { number: 12, nameOnShirt: 'WIEFFER', fullName: 'Mats Wieffer', team: 'Netherlands', position: 'DF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 13, nameOnShirt: 'ROEFS', fullName: 'Robin Roefs', team: 'Netherlands', position: 'GK', club: 'Sunderland AFC (ENG)' },
  { number: 14, nameOnShirt: 'REIJNDERS', fullName: 'Marten de Roon', team: 'Netherlands', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 15, nameOnShirt: 'VAN DE VEN', fullName: 'Micky van de Ven', team: 'Netherlands', position: 'DF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 16, nameOnShirt: 'TIL', fullName: 'Guus Til', team: 'Netherlands', position: 'MF', club: 'PSV Eindhoven (NED)' },
  { number: 17, nameOnShirt: 'LANG', fullName: 'Noa Lang', team: 'Netherlands', position: 'FW', club: 'Galatasaray SK (TUR)' },
  { number: 18, nameOnShirt: 'MALEN', fullName: 'Donyell Malen', team: 'Netherlands', position: 'FW', club: 'AS Roma (ITA)' },
  { number: 19, nameOnShirt: 'BROBBEY', fullName: 'Brian Brobbey', team: 'Netherlands', position: 'FW', club: 'Sunderland AFC (ENG)' },
  { number: 20, nameOnShirt: 'KOOPMEINERS', fullName: 'Teun Koopmeiners', team: 'Netherlands', position: 'MF', club: 'Juventus FC (ITA)' },
  { number: 21, nameOnShirt: 'F. DE JONG', fullName: 'Frenkie de Jong', team: 'Netherlands', position: 'MF', club: 'FC Barcelona (ESP)' },
  { number: 22, nameOnShirt: 'DUMFRIES', fullName: 'Denzel Dumfries', team: 'Netherlands', position: 'DF', club: 'FC Internazionale Milano (ITA)' },
  { number: 23, nameOnShirt: 'FLEKKEN', fullName: 'Mark Flekken', team: 'Netherlands', position: 'GK', club: 'Bayer Leverkusen (GER)' },
  { number: 24, nameOnShirt: 'SUMMERVILLE', fullName: 'Crysencio Summerville', team: 'Netherlands', position: 'FW', club: 'West Ham United FC (ENG)' },
  { number: 25, nameOnShirt: 'HATO', fullName: 'Jorrel Hato', team: 'Netherlands', position: 'DF', club: 'Chelsea FC (ENG)' },
  { number: 26, nameOnShirt: 'Q. TIMBER', fullName: 'Quinten Timber', team: 'Netherlands', position: 'MF', club: 'Olympique Marseille (FRA)' },
  { number: 1, nameOnShirt: 'COURTOIS', fullName: 'Thibaut Courtois', team: 'Belgium', position: 'GK', club: 'Real Madrid C. F. (ESP)' },
  { number: 2, nameOnShirt: 'DEBAST', fullName: 'Zeno Debast', team: 'Belgium', position: 'DF', club: 'Sporting CP (POR)' },
  { number: 3, nameOnShirt: 'THIATE', fullName: 'THIATE', team: 'Belgium', position: 'DF', club: 'Eintracht Frankfurt (GER)' },
  { number: 4, nameOnShirt: 'MECHELE', fullName: 'Brandon Mechele', team: 'Belgium', position: 'DF', club: 'Club Brugge (BEL)' },
  { number: 5, nameOnShirt: 'DE CUYPER', fullName: 'Zeno Debast', team: 'Belgium', position: 'DF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 6, nameOnShirt: 'WITSEL', fullName: 'Axel Witsel', team: 'Belgium', position: 'MF', club: 'Girona FC (ESP)' },
  { number: 7, nameOnShirt: 'DE BRUYNE', fullName: 'Zeno Debast', team: 'Belgium', position: 'MF', club: 'SSC Napoli (ITA)' },
  { number: 8, nameOnShirt: 'TIELEMANS', fullName: 'Youri Tielemans', team: 'Belgium', position: 'MF', club: 'Aston Villa FC (ENG)' },
  { number: 9, nameOnShirt: 'LUKAKU', fullName: 'Romelu Lukaku', team: 'Belgium', position: 'FW', club: 'SSC Napoli (ITA)' },
  { number: 10, nameOnShirt: 'TROSSARD', fullName: 'Leandro Trossard', team: 'Belgium', position: 'FW', club: 'Arsenal FC (ENG)' },
  { number: 11, nameOnShirt: 'DOKU', fullName: 'Jérémy Doku', team: 'Belgium', position: 'FW', club: 'Manchester City FC (ENG)' },
  { number: 12, nameOnShirt: 'LAMMENS', fullName: 'Senne Lammens', team: 'Belgium', position: 'GK', club: 'Manchester United FC (ENG)' },
  { number: 13, nameOnShirt: 'PENDERS', fullName: 'Maxim De Cuyper', team: 'Belgium', position: 'GK', club: 'RC Strasbourg (FRA)' },
  { number: 14, nameOnShirt: 'LUKEBAKIO', fullName: 'Dodi Lukébakio', team: 'Belgium', position: 'FW', club: 'SL Benca (POR)' },
  { number: 15, nameOnShirt: 'MEUNIER', fullName: 'Thomas Meunier', team: 'Belgium', position: 'DF', club: 'Lille OSC (FRA)' },
  { number: 16, nameOnShirt: 'DE WINTER', fullName: 'Zeno Debast', team: 'Belgium', position: 'DF', club: 'AC Milan (ITA)' },
  { number: 17, nameOnShirt: 'DE KETELAERE', fullName: 'Zeno Debast', team: 'Belgium', position: 'FW', club: 'Atalanta Bergamo (ITA)' },
  { number: 18, nameOnShirt: 'SEYS', fullName: 'Joaquin Seys', team: 'Belgium', position: 'DF', club: 'Club Brugge (BEL)' },
  { number: 19, nameOnShirt: 'MOREIRA', fullName: 'Diego Moreira', team: 'Belgium', position: 'MF', club: 'RC Strasbourg (FRA)' },
  { number: 20, nameOnShirt: 'VANAKEN', fullName: 'Hans Vanaken', team: 'Belgium', position: 'MF', club: 'Club Brugge (BEL)' },
  { number: 21, nameOnShirt: 'CASTAGNE', fullName: 'Timothy Castagne', team: 'Belgium', position: 'DF', club: 'Fulham FC (ENG)' },
  { number: 22, nameOnShirt: 'SAELEMAEKERS', fullName: 'Alexis Saelemaekers', team: 'Belgium', position: 'MF', club: 'AC Milan (ITA)' },
  { number: 23, nameOnShirt: 'RASKIN', fullName: 'Nicolas Raskin', team: 'Belgium', position: 'MF', club: 'Rangers FC (SCO)' },
  { number: 24, nameOnShirt: 'ONANA', fullName: 'Amadou Onana', team: 'Belgium', position: 'MF', club: 'Aston Villa FC (ENG)' },
  { number: 25, nameOnShirt: 'NGOY', fullName: 'Nathan Ngoy', team: 'Belgium', position: 'DF', club: 'Lille OSC (FRA)' },
  { number: 26, nameOnShirt: 'FERNANDEZ-PARDO', fullName: 'Maxim De Cuyper', team: 'Belgium', position: 'FW', club: 'Lille OSC (FRA)' },
  { number: 1, nameOnShirt: 'NYLAND', fullName: 'Ørjan Nyland', team: 'Norway', position: 'GK', club: 'Sevilla FC (ESP)' },
  { number: 2, nameOnShirt: 'THORSBY', fullName: 'Morten Thorsby', team: 'Norway', position: 'MF', club: 'US Cremonese (ITA)' },
  { number: 3, nameOnShirt: 'VASSBAKK AJER', fullName: 'Kristoffer Ajer', team: 'Norway', position: 'DF', club: 'Brentford FC (ENG)' },
  { number: 4, nameOnShirt: 'ØSTIGÅRD', fullName: 'Leo Østigård', team: 'Norway', position: 'DF', club: 'Genoa CFC (ITA)' },
  { number: 5, nameOnShirt: 'MØLLER WOLFE', fullName: 'David Møller Wolfe', team: 'Norway', position: 'DF', club: 'Wolverhampton Wanderers FC (ENG)' },
  { number: 6, nameOnShirt: 'BERG', fullName: 'Patrick Berg', team: 'Norway', position: 'MF', club: 'FK Bodø/Glimt (NOR)' },
  { number: 7, nameOnShirt: 'SØRLOTH', fullName: 'Alexander Sørloth', team: 'Norway', position: 'FW', club: 'Atlético De Madrid (ESP)' },
  { number: 8, nameOnShirt: 'BERGE', fullName: 'Patrick Berg', team: 'Norway', position: 'MF', club: 'Fulham FC (ENG)' },
  { number: 9, nameOnShirt: 'BRAUT HAALAND', fullName: 'Erling Haaland', team: 'Norway', position: 'FW', club: 'Manchester City FC (ENG)' },
  { number: 10, nameOnShirt: 'ØDEGAARD', fullName: 'Martin Ødegaard', team: 'Norway', position: 'MF', club: 'Arsenal FC (ENG)' },
  { number: 11, nameOnShirt: 'STRAND LARSEN', fullName: 'Jørgen Strand Larsen', team: 'Norway', position: 'FW', club: 'Crystal Palace FC (ENG)' },
  { number: 12, nameOnShirt: 'TANGVIK', fullName: 'Sander Tangvik', team: 'Norway', position: 'GK', club: 'Hamburger SV (GER)' },
  { number: 13, nameOnShirt: 'SELVIK', fullName: 'Egil Selvik', team: 'Norway', position: 'GK', club: 'Watford FC (ENG)' },
  { number: 14, nameOnShirt: 'AURSNES', fullName: 'Fredrik Aursnes', team: 'Norway', position: 'MF', club: 'SL Benca (POR)' },
  { number: 15, nameOnShirt: 'BJØRKAN', fullName: 'Fredrik André Bjørkan', team: 'Norway', position: 'DF', club: 'FK Bodø/Glimt (NOR)' },
  { number: 16, nameOnShirt: 'HOLMGREN', fullName: 'Marcus Holmgren Pedersen', team: 'Norway', position: 'DF', club: 'Torino FC (ITA)' },
  { number: 17, nameOnShirt: 'HEGGEM', fullName: 'Torbjørn Heggem', team: 'Norway', position: 'DF', club: 'Bologna FC (ITA)' },
  { number: 18, nameOnShirt: 'THORSTVEDT', fullName: 'Kristian Thorstvedt', team: 'Norway', position: 'MF', club: 'US Sassuolo (ITA)' },
  { number: 19, nameOnShirt: 'AASGAARD', fullName: 'Thelo Aasgaard', team: 'Norway', position: 'MF', club: 'Rangers FC (SCO)' },
  { number: 20, nameOnShirt: 'NUSA', fullName: 'Antonio Nusa', team: 'Norway', position: 'FW', club: 'RB Leipzig (GER)' },
  { number: 21, nameOnShirt: 'SCHJELDERUP', fullName: 'Andreas Schjelderup', team: 'Norway', position: 'MF', club: 'SL Benca (POR)' },
  { number: 22, nameOnShirt: 'BOBB', fullName: 'Oscar Bobb', team: 'Norway', position: 'MF', club: 'Fulham FC (ENG)' },
  { number: 23, nameOnShirt: 'HAUGE', fullName: 'Jens Petter Hauge', team: 'Norway', position: 'MF', club: 'FK Bodø/Glimt (NOR)' },
  { number: 24, nameOnShirt: 'LANGÅS', fullName: 'Sondre Langås', team: 'Norway', position: 'DF', club: 'Derby County FC (ENG)' },
  { number: 25, nameOnShirt: 'FALCHENER', fullName: 'Henrik Falchener', team: 'Norway', position: 'DF', club: 'Viking Stavanger (NOR)' },
  { number: 26, nameOnShirt: 'RYERSON', fullName: 'Julian Ryerson', team: 'Norway', position: 'FW', club: 'Borussia Dortmund (GER)' },
  { number: 1, nameOnShirt: 'KOBEL', fullName: 'Gregor Kobel', team: 'Switzerland', position: 'GK', club: 'Borussia Dortmund (GER)' },
  { number: 2, nameOnShirt: 'MUHEIM', fullName: 'Miro Muheim', team: 'Switzerland', position: 'DF', club: 'Hamburger SV (GER)' },
  { number: 3, nameOnShirt: 'WIDMER', fullName: 'Silvan Widmer', team: 'Switzerland', position: 'DF', club: '1. FSV Mainz 05 (GER)' },
  { number: 4, nameOnShirt: 'ELVEDI', fullName: 'Nico Elvedi', team: 'Switzerland', position: 'DF', club: 'Borussia Mönchengladbach (GER)' },
  { number: 5, nameOnShirt: 'AKANJI', fullName: 'Manuel Akanji', team: 'Switzerland', position: 'DF', club: 'FC Internazionale Milano (ITA)' },
  { number: 6, nameOnShirt: 'ZAKARIA', fullName: 'Denis Zakaria', team: 'Switzerland', position: 'MF', club: 'AS Monaco (FRA)' },
  { number: 7, nameOnShirt: 'EMBOLO', fullName: 'Breel Embolo', team: 'Switzerland', position: 'FW', club: 'Stade Rennais FC (FRA)' },
  { number: 8, nameOnShirt: 'FREULER', fullName: 'Remo Freuler', team: 'Switzerland', position: 'MF', club: 'Bologna FC (ITA)' },
  { number: 9, nameOnShirt: 'MANZAMBI', fullName: 'Johan Manzambi', team: 'Switzerland', position: 'MF', club: 'SC Freiburg (GER)' },
  { number: 10, nameOnShirt: 'XHAKA', fullName: 'Granit Xhaka', team: 'Switzerland', position: 'MF', club: 'Sunderland AFC (ENG)' },
  { number: 11, nameOnShirt: 'NDOYE', fullName: 'Dan Ndoye', team: 'Switzerland', position: 'FW', club: 'Nottingham Forest FC (ENG)' },
  { number: 12, nameOnShirt: 'MVOGO', fullName: 'Yvon Mvogo', team: 'Switzerland', position: 'GK', club: 'FC Lorient (FRA)' },
  { number: 13, nameOnShirt: 'RODRÍGUEZ', fullName: 'RODRÍGUEZ', team: 'Switzerland', position: 'DF', club: 'Real Betis (ESP)' },
  { number: 14, nameOnShirt: 'JASHARI', fullName: 'Ardon Jashari', team: 'Switzerland', position: 'MF', club: 'AC Milan (ITA)' },
  { number: 15, nameOnShirt: 'SOW', fullName: 'Djibril Sow', team: 'Switzerland', position: 'MF', club: 'Sevilla FC (ESP)' },
  { number: 16, nameOnShirt: 'FASSNACHT', fullName: 'Christian Fassnacht', team: 'Switzerland', position: 'FW', club: 'BSC Young Boys (SUI)' },
  { number: 17, nameOnShirt: 'VARGAS', fullName: 'Rubén Vargas', team: 'Switzerland', position: 'FW', club: 'Sevilla FC (ESP)' },
  { number: 18, nameOnShirt: 'COMERT', fullName: 'Eray Cömert', team: 'Switzerland', position: 'DF', club: 'Valencia CF (ESP)' },
  { number: 19, nameOnShirt: 'OKAFOR', fullName: 'Noah Okafor', team: 'Switzerland', position: 'FW', club: 'Leeds United FC (ENG)' },
  { number: 20, nameOnShirt: 'AEBISCHER', fullName: 'Michel Aebischer', team: 'Switzerland', position: 'MF', club: 'Pisa SC (ITA)' },
  { number: 21, nameOnShirt: 'KELLER', fullName: 'Marvin Keller', team: 'Switzerland', position: 'GK', club: 'BSC Young Boys (SUI)' },
  { number: 22, nameOnShirt: 'RIEDER', fullName: 'Fabian Rieder', team: 'Switzerland', position: 'MF', club: 'FC Augsburg (GER)' },
  { number: 23, nameOnShirt: 'AMDOUNI', fullName: 'Zeki Amdouni', team: 'Switzerland', position: 'FW', club: 'Burnley FC (ENG)' },
  { number: 24, nameOnShirt: 'AMENDA', fullName: 'Aurèle Amenda', team: 'Switzerland', position: 'DF', club: 'Eintracht Frankfurt (GER)' },
  { number: 25, nameOnShirt: 'JAQUEZ', fullName: 'Luca Jaquez', team: 'Switzerland', position: 'DF', club: 'VfB Stuttgart (GER)' },
  { number: 26, nameOnShirt: 'ITTEN', fullName: 'Cedric Itten', team: 'Switzerland', position: 'FW', club: 'Fortuna Düsseldorf (GER)' },
  { number: 1, nameOnShirt: 'ZETTERSTRÖM', fullName: 'Jacob Widell Zetterström', team: 'Sweden', position: 'GK', club: 'Derby County FC (ENG)' },
  { number: 2, nameOnShirt: 'LAGERBIELKE', fullName: 'Gustaf Lagerbielke', team: 'Sweden', position: 'DF', club: 'SC Braga (POR)' },
  { number: 3, nameOnShirt: 'LINDELÖF', fullName: 'Victor Lindelöf', team: 'Sweden', position: 'DF', club: 'Aston Villa FC (ENG)' },
  { number: 4, nameOnShirt: 'HIEN', fullName: 'Isak Hien', team: 'Sweden', position: 'DF', club: 'Atalanta Bergamo (ITA)' },
  { number: 5, nameOnShirt: 'GUDMUNDSSON', fullName: 'Gabriel Gudmundsson', team: 'Sweden', position: 'DF', club: 'Leeds United FC (ENG)' },
  { number: 6, nameOnShirt: 'H. JOHANSSON', fullName: 'Herman Johansson', team: 'Sweden', position: 'DF', club: 'FC Dallas (USA)' },
  { number: 7, nameOnShirt: 'BERGVALL', fullName: 'Lucas Bergvall', team: 'Sweden', position: 'MF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 8, nameOnShirt: 'SVENSSON', fullName: 'Daniel Svensson', team: 'Sweden', position: 'DF', club: 'Borussia Dortmund (GER)' },
  { number: 9, nameOnShirt: 'ISAK', fullName: 'Isak Hien', team: 'Sweden', position: 'FW', club: 'Liverpool FC (ENG)' },
  { number: 10, nameOnShirt: 'NYGREN', fullName: 'Benjamin Nygren', team: 'Sweden', position: 'MF', club: 'Celtic FC (SCO)' },
  { number: 11, nameOnShirt: 'ELANGA', fullName: 'Anthony Elanga', team: 'Sweden', position: 'FW', club: 'Newcastle United FC (ENG)' },
  { number: 12, nameOnShirt: 'V. JOHANSSON', fullName: 'Herman Johansson', team: 'Sweden', position: 'GK', club: 'Stoke City FC (ENG)' },
  { number: 13, nameOnShirt: 'SEMA', fullName: 'Ken Sema', team: 'Sweden', position: 'MF', club: 'Pafos FC (CYP)' },
  { number: 14, nameOnShirt: 'EKDAL', fullName: 'Hjalmar Ekdal', team: 'Sweden', position: 'DF', club: 'Burnley FC (ENG)' },
  { number: 15, nameOnShirt: 'STARFELT', fullName: 'Carl Starfelt', team: 'Sweden', position: 'DF', club: 'RC Celta Vigo (ESP)' },
  { number: 16, nameOnShirt: 'KARLSTRÖM', fullName: 'Jesper Karlström', team: 'Sweden', position: 'MF', club: 'Udinese (ITA)' },
  { number: 17, nameOnShirt: 'GYÖKERES', fullName: 'Viktor Gyökeres', team: 'Sweden', position: 'FW', club: 'Arsenal FC (ENG)' },
  { number: 18, nameOnShirt: 'AYARI', fullName: 'Yasin Ayari', team: 'Sweden', position: 'MF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 19, nameOnShirt: 'SVANBERG', fullName: 'Mattias Svanberg', team: 'Sweden', position: 'MF', club: 'VfL Wolfsburg (GER)' },
  { number: 20, nameOnShirt: 'SMITH', fullName: 'Eric Smith', team: 'Sweden', position: 'DF', club: 'FC St. Pauli (GER)' },
  { number: 21, nameOnShirt: 'BERNHARDSSON', fullName: 'Alexander Bernhardsson', team: 'Sweden', position: 'DF', club: 'Holstein Kiel (GER)' },
  { number: 22, nameOnShirt: 'ZENELI', fullName: 'Besfort Zeneli', team: 'Sweden', position: 'MF', club: 'Royale Union Saint-Gilloise (BEL)' },
  { number: 23, nameOnShirt: 'NORDFELDT', fullName: 'Kristoffer Nordfeldt', team: 'Sweden', position: 'GK', club: 'AIK Stockholm (SWE)' },
  { number: 24, nameOnShirt: 'STROUD', fullName: 'Elliot Stroud', team: 'Sweden', position: 'DF', club: 'Mjällby AIF (SWE)' },
  { number: 25, nameOnShirt: 'NILSSON', fullName: 'Gustaf Nilsson', team: 'Sweden', position: 'FW', club: 'Club Brugge (BEL)' },
  { number: 26, nameOnShirt: 'ALI', fullName: 'Taha Ali', team: 'Sweden', position: 'FW', club: 'Malmö FF (SWE)' },
  { number: 1, nameOnShirt: 'SCHLAGER', fullName: 'Alexander Schlager', team: 'Austria', position: 'GK', club: 'FC Red Bull Salzburg (AUT)' },
  { number: 2, nameOnShirt: 'AFFENGRUBER', fullName: 'David Affengruber', team: 'Austria', position: 'DF', club: 'Elche CF (ESP)' },
  { number: 3, nameOnShirt: 'DANSO', fullName: 'Kevin Danso', team: 'Austria', position: 'DF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 4, nameOnShirt: 'XAVER', fullName: 'Xaver Schlager', team: 'Austria', position: 'MF', club: 'RB Leipzig (GER)' },
  { number: 5, nameOnShirt: 'POSCH', fullName: 'Stefan Posch', team: 'Austria', position: 'DF', club: '1. FSV Mainz 05 (GER)' },
  { number: 6, nameOnShirt: 'SEIWALD', fullName: 'Nicolas Seiwald', team: 'Austria', position: 'MF', club: 'RB Leipzig (GER)' },
  { number: 7, nameOnShirt: 'ARNAUTOVIC', fullName: 'Marko Arnautović', team: 'Austria', position: 'FW', club: 'FK Crvena Zvezda (SRB)' },
  { number: 8, nameOnShirt: 'ALABA', fullName: 'David Alaba', team: 'Austria', position: 'DF', club: 'Real Madrid C. F. (ESP)' },
  { number: 9, nameOnShirt: 'SABITZER', fullName: 'Marcel Sabitzer', team: 'Austria', position: 'MF', club: 'Borussia Dortmund (GER)' },
  { number: 10, nameOnShirt: 'GRILLITSCH', fullName: 'Florian Grillitsch', team: 'Austria', position: 'MF', club: 'SC Braga (POR)' },
  { number: 11, nameOnShirt: 'GREGORITSCH', fullName: 'Michael Gregoritsch', team: 'Austria', position: 'FW', club: 'FC Augsburg (GER)' },
  { number: 12, nameOnShirt: 'WIEGELE', fullName: 'Florian Wiegele', team: 'Austria', position: 'GK', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 13, nameOnShirt: 'PENTZ', fullName: 'Patrick Pentz', team: 'Austria', position: 'GK', club: 'Brøndby IF (DEN)' },
  { number: 14, nameOnShirt: 'KALAJDZIC', fullName: 'Saša Kalajdžić', team: 'Austria', position: 'FW', club: 'LASK Linz (AUT)' },
  { number: 15, nameOnShirt: 'LIENHART', fullName: 'Philipp Lienhart', team: 'Austria', position: 'DF', club: 'SC Freiburg (GER)' },
  { number: 16, nameOnShirt: 'MWENE', fullName: 'Phillipp Mwene', team: 'Austria', position: 'DF', club: '1. FSV Mainz 05 (GER)' },
  { number: 17, nameOnShirt: 'CHUKWUEMEKA', fullName: 'Carney Chukwuemeka', team: 'Austria', position: 'MF', club: 'Borussia Dortmund (GER)' },
  { number: 18, nameOnShirt: 'SCHMID', fullName: 'Romano Schmid', team: 'Austria', position: 'MF', club: 'SV Werder Bremen (GER)' },
  { number: 19, nameOnShirt: 'BAUMGARTNER', fullName: 'BAUMGARTNER', team: 'Austria', position: 'MF', club: 'RB Leipzig (GER)' },
  { number: 20, nameOnShirt: 'LAIMER', fullName: 'Konrad Laimer', team: 'Austria', position: 'MF', club: 'FC Bayern München (GER)' },
  { number: 21, nameOnShirt: 'WIMMER', fullName: 'Patrick Wimmer', team: 'Austria', position: 'FW', club: 'VfL Wolfsburg (GER)' },
  { number: 22, nameOnShirt: 'PRASS', fullName: 'Alexander Prass', team: 'Austria', position: 'MF', club: 'TSG Hoffenheim (GER)' },
  { number: 23, nameOnShirt: 'FRIEDL', fullName: 'Marco Friedl', team: 'Austria', position: 'DF', club: 'SV Werder Bremen (GER)' },
  { number: 24, nameOnShirt: 'WANNER', fullName: 'Paul Wanner', team: 'Austria', position: 'MF', club: 'PSV Eindhoven (NED)' },
  { number: 25, nameOnShirt: 'SVOBODA', fullName: 'Michael Svoboda', team: 'Austria', position: 'DF', club: 'Venezia FC (ITA)' },
  { number: 26, nameOnShirt: 'SCHÖPF', fullName: 'Alessandro Schöpf', team: 'Austria', position: 'MF', club: 'Wolfsberger AC (AUT)' },
  { number: 1, nameOnShirt: 'LIVAKOVIC', fullName: 'Dominik Livaković', team: 'Croatia', position: 'GK', club: 'GNK Dinamo Zagreb (CRO)' },
  { number: 2, nameOnShirt: 'STANISIC', fullName: 'Josip Stanišić', team: 'Croatia', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 3, nameOnShirt: 'PONGRACIC', fullName: 'Marin Pongračić', team: 'Croatia', position: 'DF', club: 'ACF Fiorentina (ITA)' },
  { number: 4, nameOnShirt: 'GVARDIOL', fullName: 'Joško Gvardiol', team: 'Croatia', position: 'DF', club: 'Manchester City FC (ENG)' },
  { number: 5, nameOnShirt: 'CALETA-CAR', fullName: 'Duje Ćaleta-Car', team: 'Croatia', position: 'DF', club: 'Real Sociedad (ESP)' },
  { number: 6, nameOnShirt: 'SUTALO', fullName: 'Josip Šutalo', team: 'Croatia', position: 'DF', club: 'AFC Ajax (NED)' },
  { number: 7, nameOnShirt: 'MORO', fullName: 'Nikola Moro', team: 'Croatia', position: 'MF', club: 'Bologna FC (ITA)' },
  { number: 8, nameOnShirt: 'KOVACIC', fullName: 'Mateo Kovačić', team: 'Croatia', position: 'MF', club: 'Manchester City FC (ENG)' },
  { number: 9, nameOnShirt: 'KRAMARIC', fullName: 'Andrej Kramarić', team: 'Croatia', position: 'FW', club: 'TSG Hoffenheim (GER)' },
  { number: 10, nameOnShirt: 'MODRIC', fullName: 'Luka Modrić', team: 'Croatia', position: 'MF', club: 'AC Milan (ITA)' },
  { number: 11, nameOnShirt: 'BUDIMIR', fullName: 'Ante Budimir', team: 'Croatia', position: 'FW', club: 'CA Osasuna (ESP)' },
  { number: 12, nameOnShirt: 'PANDUR', fullName: 'Ivor Pandur', team: 'Croatia', position: 'GK', club: 'Hull City FC (ENG)' },
  { number: 13, nameOnShirt: 'VLASIC', fullName: 'Nikola Vlašić', team: 'Croatia', position: 'MF', club: 'Torino FC (ITA)' },
  { number: 14, nameOnShirt: 'PERISIC', fullName: 'Ivan Perišić', team: 'Croatia', position: 'FW', club: 'PSV Eindhoven (NED)' },
  { number: 15, nameOnShirt: 'PASALIC', fullName: 'Mario Pašalić', team: 'Croatia', position: 'MF', club: 'Atalanta Bergamo (ITA)' },
  { number: 16, nameOnShirt: 'BATURINA', fullName: 'Martin Baturina', team: 'Croatia', position: 'MF', club: 'Como (ITA)' },
  { number: 17, nameOnShirt: 'P. SUCIC', fullName: 'Petar Sučić', team: 'Croatia', position: 'MF', club: 'FC Internazionale Milano (ITA)' },
  { number: 18, nameOnShirt: 'JAKIC', fullName: 'Kristijan Jakić', team: 'Croatia', position: 'DF', club: 'FC Augsburg (GER)' },
  { number: 19, nameOnShirt: 'FRUK', fullName: 'Toni Fruk', team: 'Croatia', position: 'MF', club: 'HNK Rijeka (CRO)' },
  { number: 20, nameOnShirt: 'MATANOVIC', fullName: 'Igor Matanović', team: 'Croatia', position: 'FW', club: 'SC Freiburg (GER)' },
  { number: 21, nameOnShirt: 'SUCIC', fullName: 'Petar Sučić', team: 'Croatia', position: 'MF', club: 'Real Sociedad (ESP)' },
  { number: 22, nameOnShirt: 'VUSKOVIC', fullName: 'Luka Vušković', team: 'Croatia', position: 'DF', club: 'Hamburger SV (GER)' },
  { number: 23, nameOnShirt: 'KOTARSKI', fullName: 'Dominik Kotarski', team: 'Croatia', position: 'GK', club: 'FC København (DEN)' },
  { number: 24, nameOnShirt: 'M. PASALIC', fullName: 'Mario Pašalić', team: 'Croatia', position: 'FW', club: 'Orlando City SC (USA)' },
  { number: 25, nameOnShirt: 'ERLIC', fullName: 'Martin Erlić', team: 'Croatia', position: 'DF', club: 'FC Midtjylland (DEN)' },
  { number: 26, nameOnShirt: 'MUSA', fullName: 'Petar Musa', team: 'Croatia', position: 'FW', club: 'FC Dallas (USA)' },
  { number: 1, nameOnShirt: 'GUNN', fullName: 'Angus Gunn', team: 'Scotland', position: 'GK', club: 'Nottingham Forest FC (ENG)' },
  { number: 2, nameOnShirt: 'HICKEY', fullName: 'Aaron Hickey', team: 'Scotland', position: 'DF', club: 'Brentford FC (ENG)' },
  { number: 3, nameOnShirt: 'ROBERTSON', fullName: 'Andy Robertson', team: 'Scotland', position: 'DF', club: 'Liverpool FC (ENG)' },
  { number: 4, nameOnShirt: 'MCTOMINAY', fullName: 'Scott McTominay', team: 'Scotland', position: 'MF', club: 'SSC Napoli (ITA)' },
  { number: 5, nameOnShirt: 'HANLEY', fullName: 'Grant Hanley', team: 'Scotland', position: 'DF', club: 'Hibernian FC (SCO)' },
  { number: 6, nameOnShirt: 'TIERNEY', fullName: 'Kieran Tierney', team: 'Scotland', position: 'DF', club: 'Celtic FC (SCO)' },
  { number: 7, nameOnShirt: 'MCGINN', fullName: 'John McGinn', team: 'Scotland', position: 'MF', club: 'Aston Villa FC (ENG)' },
  { number: 8, nameOnShirt: 'FLETCHER', fullName: 'Tyler Fletcher', team: 'Scotland', position: 'MF', club: 'Manchester United FC (ENG)' },
  { number: 9, nameOnShirt: 'DYKES', fullName: 'Lyndon Dykes', team: 'Scotland', position: 'FW', club: 'Charlton Athletic FC (ENG)' },
  { number: 10, nameOnShirt: 'ADAMS', fullName: 'Ché Adams', team: 'Scotland', position: 'FW', club: 'Torino FC (ITA)' },
  { number: 11, nameOnShirt: 'CHRISTIE', fullName: 'Ryan Christie', team: 'Scotland', position: 'MF', club: 'AFC Bournemouth (ENG)' },
  { number: 12, nameOnShirt: 'KELLY', fullName: 'Liam Kelly', team: 'Scotland', position: 'GK', club: 'Rangers FC (SCO)' },
  { number: 13, nameOnShirt: 'HENDRY', fullName: 'Jack Hendry', team: 'Scotland', position: 'DF', club: 'Al Ettifaq FC (KSA)' },
  { number: 14, nameOnShirt: 'STEWART', fullName: 'Ross Stewart', team: 'Scotland', position: 'FW', club: 'Southampton FC (ENG)' },
  { number: 15, nameOnShirt: 'SOUTTAR', fullName: 'John Souttar', team: 'Scotland', position: 'DF', club: 'Rangers FC (SCO)' },
  { number: 16, nameOnShirt: 'HYAM', fullName: 'Dominic Hyam', team: 'Scotland', position: 'DF', club: 'Wrexham AFC (WAL)' },
  { number: 17, nameOnShirt: 'GANNON DOAK', fullName: 'Ben Gannon-Doak', team: 'Scotland', position: 'FW', club: 'AFC Bournemouth (ENG)' },
  { number: 18, nameOnShirt: 'HIRST', fullName: 'George Hirst', team: 'Scotland', position: 'FW', club: 'Ipswich Town FC (ENG)' },
  { number: 19, nameOnShirt: 'FERGUSON', fullName: 'Lewis Ferguson', team: 'Scotland', position: 'MF', club: 'Bologna FC (ITA)' },
  { number: 20, nameOnShirt: 'SHANKLAND', fullName: 'Lawrence Shankland', team: 'Scotland', position: 'FW', club: 'Heart Of Midlothian FC (SCO)' },
  { number: 21, nameOnShirt: 'GORDON', fullName: 'Craig Gordon', team: 'Scotland', position: 'GK', club: 'Heart Of Midlothian FC (SCO)' },
  { number: 22, nameOnShirt: 'PATTERSON', fullName: 'Nathan Patterson', team: 'Scotland', position: 'DF', club: 'Everton FC (ENG)' },
  { number: 23, nameOnShirt: 'MCLEAN', fullName: 'Kenny McLean', team: 'Scotland', position: 'MF', club: 'Norwich City FC (ENG)' },
  { number: 24, nameOnShirt: 'RALSTON', fullName: 'Anthony Ralston', team: 'Scotland', position: 'DF', club: 'Celtic FC (SCO)' },
  { number: 25, nameOnShirt: 'CURTIS', fullName: 'Findlay Curtis', team: 'Scotland', position: 'FW', club: 'Kilmarnock FC (SCO)' },
  { number: 26, nameOnShirt: 'MCKENNA', fullName: 'Scott McKenna', team: 'Scotland', position: 'DF', club: 'GNK Dinamo Zagreb (CRO)' },
  { number: 1, nameOnShirt: 'MERT', fullName: 'MERT', team: 'Türkiye', position: 'GK', club: 'Fenerbahçe SK (TUR)' },
  { number: 2, nameOnShirt: 'ZEKI ÇELIK', fullName: 'ZEKI ÇELIK', team: 'Türkiye', position: 'DF', club: 'AS Roma (ITA)' },
  { number: 3, nameOnShirt: 'DEMIRAL', fullName: 'DEMIRAL', team: 'Türkiye', position: 'DF', club: 'Al Ahli FC (KSA)' },
  { number: 4, nameOnShirt: 'ÇAĞLAR', fullName: 'ÇAĞLAR', team: 'Türkiye', position: 'DF', club: 'Fenerbahçe SK (TUR)' },
  { number: 5, nameOnShirt: 'OZCAN', fullName: 'OZCAN', team: 'Türkiye', position: 'MF', club: 'Borussia Dortmund (GER)' },
  { number: 6, nameOnShirt: 'ORKUN KÖKÇÜ', fullName: 'ORKUN KÖKÇÜ', team: 'Türkiye', position: 'MF', club: 'Be ş ikta ş  JK (TUR)' },
  { number: 7, nameOnShirt: 'AKTÜRKOĞLU', fullName: 'AKTÜRKOĞLU', team: 'Türkiye', position: 'FW', club: 'Fenerbahçe SK (TUR)' },
  { number: 8, nameOnShirt: 'ARDA GÜLER', fullName: 'ARDA GÜLER', team: 'Türkiye', position: 'FW', club: 'Real Madrid C. F. (ESP)' },
  { number: 9, nameOnShirt: 'DENIZ GÜL', fullName: 'DENIZ GÜL', team: 'Türkiye', position: 'FW', club: 'FC Porto (POR)' },
  { number: 10, nameOnShirt: 'ÇALHANOĞLU', fullName: 'ÇALHANOĞLU', team: 'Türkiye', position: 'MF', club: 'FC Internazionale Milano (ITA)' },
  { number: 11, nameOnShirt: 'YILDIZ', fullName: 'YILDIZ', team: 'Türkiye', position: 'FW', club: 'Juventus FC (ITA)' },
  { number: 12, nameOnShirt: 'ALTAY', fullName: 'ALTAY', team: 'Türkiye', position: 'GK', club: 'Manchester United FC (ENG)' },
  { number: 13, nameOnShirt: 'EREN ELMALI', fullName: 'EREN ELMALI', team: 'Türkiye', position: 'DF', club: 'Galatasaray SK (TUR)' },
  { number: 14, nameOnShirt: 'ABDÜLKERIM', fullName: 'ABDÜLKERIM', team: 'Türkiye', position: 'DF', club: 'Galatasaray SK (TUR)' },
  { number: 15, nameOnShirt: 'OZAN KABAK', fullName: 'OZAN KABAK', team: 'Türkiye', position: 'DF', club: 'TSG Hoffenheim (GER)' },
  { number: 16, nameOnShirt: 'ISMAIL', fullName: 'ISMAIL', team: 'Türkiye', position: 'MF', club: 'Fenerbahçe SK (TUR)' },
  { number: 17, nameOnShirt: 'KAHVECI', fullName: 'KAHVECI', team: 'Türkiye', position: 'FW', club: 'Kasımpa ş a SK (TUR)' },
  { number: 18, nameOnShirt: 'MERT MULDUR', fullName: 'MERT MULDUR', team: 'Türkiye', position: 'DF', club: 'Fenerbahçe SK (TUR)' },
  { number: 19, nameOnShirt: 'YUNUS', fullName: 'YUNUS', team: 'Türkiye', position: 'FW', club: 'Galatasaray SK (TUR)' },
  { number: 20, nameOnShirt: 'F. KADIOĞLU', fullName: 'F. KADIOĞLU', team: 'Türkiye', position: 'DF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 21, nameOnShirt: 'BARIŞ', fullName: 'BARIŞ', team: 'Türkiye', position: 'FW', club: 'Galatasaray SK (TUR)' },
  { number: 22, nameOnShirt: 'KAAN', fullName: 'KAAN', team: 'Türkiye', position: 'MF', club: 'Galatasaray SK (TUR)' },
  { number: 23, nameOnShirt: 'UGURCAN', fullName: 'UGURCAN', team: 'Türkiye', position: 'GK', club: 'Galatasaray SK (TUR)' },
  { number: 24, nameOnShirt: 'OGUZ', fullName: 'OGUZ', team: 'Türkiye', position: 'FW', club: 'Fenerbahçe SK (TUR)' },
  { number: 25, nameOnShirt: 'SAMET AKAYDIN', fullName: 'SAMET AKAYDIN', team: 'Türkiye', position: 'DF', club: 'Çaykur Rizespor (TUR)' },
  { number: 26, nameOnShirt: 'CAN UZUN', fullName: 'CAN UZUN', team: 'Türkiye', position: 'FW', club: 'Eintracht Frankfurt (GER)' },
  { number: 1, nameOnShirt: 'KOVAR', fullName: 'Matěj Kovář', team: 'Czechia', position: 'GK', club: 'PSV Eindhoven (NED)' },
  { number: 2, nameOnShirt: 'ZIMA', fullName: 'David Zima', team: 'Czechia', position: 'DF', club: 'SK Slavia Praha (CZE)' },
  { number: 3, nameOnShirt: 'HOLES', fullName: 'Tomáš Holeš', team: 'Czechia', position: 'DF', club: 'SK Slavia Praha (CZE)' },
  { number: 4, nameOnShirt: 'HRANAC', fullName: 'Robin Hranáč', team: 'Czechia', position: 'DF', club: 'TSG Hoffenheim (GER)' },
  { number: 5, nameOnShirt: 'COUFAL', fullName: 'Vladimír Coufal', team: 'Czechia', position: 'DF', club: 'TSG Hoffenheim (GER)' },
  { number: 6, nameOnShirt: 'CHALOUPEK', fullName: 'Štěpán Chaloupek', team: 'Czechia', position: 'DF', club: 'SK Slavia Praha (CZE)' },
  { number: 7, nameOnShirt: 'KREJCI', fullName: 'Ladislav Krejčí', team: 'Czechia', position: 'DF', club: 'Wolverhampton Wanderers FC (ENG)' },
  { number: 8, nameOnShirt: 'DARIDA', fullName: 'Vladimír Darida', team: 'Czechia', position: 'MF', club: 'FC Hradec Králové (CZE)' },
  { number: 9, nameOnShirt: 'HLOZEK', fullName: 'Adam Hložek', team: 'Czechia', position: 'FW', club: 'TSG Hoffenheim (GER)' },
  { number: 10, nameOnShirt: 'SCHICK', fullName: 'Patrik Schick', team: 'Czechia', position: 'FW', club: 'Bayer Leverkusen (GER)' },
  { number: 11, nameOnShirt: 'KUCHTA', fullName: 'Jan Kuchta', team: 'Czechia', position: 'FW', club: 'AC Sparta Praha (CZE)' },
  { number: 12, nameOnShirt: 'CERV', fullName: 'Lukáš Červ', team: 'Czechia', position: 'MF', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 13, nameOnShirt: 'CHYTIL', fullName: 'Mojmír Chytil', team: 'Czechia', position: 'FW', club: 'SK Slavia Praha (CZE)' },
  { number: 14, nameOnShirt: 'JURASEK', fullName: 'David Jurásek', team: 'Czechia', position: 'DF', club: 'SK Slavia Praha (CZE)' },
  { number: 15, nameOnShirt: 'SULC', fullName: 'Pavel Šulc', team: 'Czechia', position: 'FW', club: 'Olympique Lyonnais (FRA)' },
  { number: 16, nameOnShirt: 'STANEK', fullName: 'Jindřich Staněk', team: 'Czechia', position: 'GK', club: 'SK Slavia Praha (CZE)' },
  { number: 17, nameOnShirt: 'PROVOD', fullName: 'Lukáš Provod', team: 'Czechia', position: 'MF', club: 'SK Slavia Praha (CZE)' },
  { number: 18, nameOnShirt: 'SADILEK', fullName: 'Michal Sadílek', team: 'Czechia', position: 'MF', club: 'SK Slavia Praha (CZE)' },
  { number: 19, nameOnShirt: 'CHORY', fullName: 'Tomáš Chorý', team: 'Czechia', position: 'FW', club: 'SK Slavia Praha (CZE)' },
  { number: 20, nameOnShirt: 'ZELENY', fullName: 'Jaroslav Zelený', team: 'Czechia', position: 'DF', club: 'AC Sparta Praha (CZE)' },
  { number: 21, nameOnShirt: 'DOUDERA', fullName: 'David Douděra', team: 'Czechia', position: 'DF', club: 'SK Slavia Praha (CZE)' },
  { number: 22, nameOnShirt: 'SOUCEK', fullName: 'Tomáš Souček', team: 'Czechia', position: 'MF', club: 'West Ham United FC (ENG)' },
  { number: 23, nameOnShirt: 'HORNICEK', fullName: 'Lukáš Horníček', team: 'Czechia', position: 'GK', club: 'SC Braga (POR)' },
  { number: 24, nameOnShirt: 'SOJKA', fullName: 'Alexandr Sojka', team: 'Czechia', position: 'MF', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 25, nameOnShirt: 'SOCHUREK', fullName: 'Hugo Sochůrek', team: 'Czechia', position: 'MF', club: 'AC Sparta Praha (CZE)' },
  { number: 26, nameOnShirt: 'VISINSKY', fullName: 'Denis Višinský', team: 'Czechia', position: 'FW', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 1, nameOnShirt: 'VASILJ', fullName: 'Nikola Vasilj', team: 'Bosnia and Herzegovina', position: 'GK', club: 'FC St. Pauli (GER)' },
  { number: 2, nameOnShirt: 'MUJAKIC', fullName: 'Nihad Mujakić', team: 'Bosnia and Herzegovina', position: 'DF', club: 'Gaziantep FK (TUR)' },
  { number: 3, nameOnShirt: 'HADZIKADUNIC', fullName: 'Dennis Hadžikadunić', team: 'Bosnia and Herzegovina', position: 'DF', club: 'UC Sampdoria (ITA)' },
  { number: 4, nameOnShirt: 'MUHAREMOVIC', fullName: 'Tarik Muharemović', team: 'Bosnia and Herzegovina', position: 'DF', club: 'US Sassuolo (ITA)' },
  { number: 5, nameOnShirt: 'KOLASINAC', fullName: 'Sead Kolašinac', team: 'Bosnia and Herzegovina', position: 'DF', club: 'Atalanta Bergamo (ITA)' },
  { number: 6, nameOnShirt: 'TAHIROVIC', fullName: 'Benjamin Tahirović', team: 'Bosnia and Herzegovina', position: 'MF', club: 'Brøndby IF (DEN)' },
  { number: 7, nameOnShirt: 'DEDIC', fullName: 'Amar Dedić', team: 'Bosnia and Herzegovina', position: 'DF', club: 'SL Benca (POR)' },
  { number: 8, nameOnShirt: 'GIGOVIC', fullName: 'Armin Gigović', team: 'Bosnia and Herzegovina', position: 'MF', club: 'BSC Young Boys (SUI)' },
  { number: 9, nameOnShirt: 'BAZDAR', fullName: 'Samed Baždar', team: 'Bosnia and Herzegovina', position: 'FW', club: 'Jagiellonia Bia ł ystok (POL)' },
  { number: 10, nameOnShirt: 'DEMIROVIC', fullName: 'Ermedin Demirović', team: 'Bosnia and Herzegovina', position: 'FW', club: 'VfB Stuttgart (GER)' },
  { number: 11, nameOnShirt: 'DZEKO', fullName: 'Edin Džeko', team: 'Bosnia and Herzegovina', position: 'FW', club: 'FC Schalke 04 (GER)' },
  { number: 12, nameOnShirt: 'JURKAS', fullName: 'Mladen Jurkas', team: 'Bosnia and Herzegovina', position: 'GK', club: 'FK Borac Banja Luka (BIH)' },
  { number: 13, nameOnShirt: 'BASIC', fullName: 'Ivan Bašić', team: 'Bosnia and Herzegovina', position: 'MF', club: 'FC Astana (KAZ)' },
  { number: 14, nameOnShirt: 'SUNJIC', fullName: 'Ivan Šunjić', team: 'Bosnia and Herzegovina', position: 'MF', club: 'Pafos FC (CYP)' },
  { number: 15, nameOnShirt: 'MEMIC', fullName: 'Amar Memić', team: 'Bosnia and Herzegovina', position: 'MF', club: 'FC Viktoria Plze ň (CZE)' },
  { number: 16, nameOnShirt: 'HADZIAHMETOVIC', fullName: 'Amir Hadžiahmetović', team: 'Bosnia and Herzegovina', position: 'MF', club: 'Hull City FC (ENG)' },
  { number: 17, nameOnShirt: 'BURNIC', fullName: 'Dženis Burnić', team: 'Bosnia and Herzegovina', position: 'MF', club: 'Karlsruher SC (GER)' },
  { number: 18, nameOnShirt: 'KATIC', fullName: 'Nikola Katić', team: 'Bosnia and Herzegovina', position: 'DF', club: 'FC Schalke 04 (GER)' },
  { number: 19, nameOnShirt: 'ALAJBEGOVIC', fullName: 'Kerim Alajbegović', team: 'Bosnia and Herzegovina', position: 'FW', club: 'FC Red Bull Salzburg (AUT)' },
  { number: 20, nameOnShirt: 'BAJRAKTAREVIC', fullName: 'Esmir Bajraktarević', team: 'Bosnia and Herzegovina', position: 'FW', club: 'PSV Eindhoven (NED)' },
  { number: 21, nameOnShirt: 'RADELJIC', fullName: 'Stjepan Radeljić', team: 'Bosnia and Herzegovina', position: 'DF', club: 'HNK Rijeka (CRO)' },
  { number: 22, nameOnShirt: 'ZLOMISLIC', fullName: 'Martin Zlomislić', team: 'Bosnia and Herzegovina', position: 'GK', club: 'HNK Rijeka (CRO)' },
  { number: 23, nameOnShirt: 'TABAKOVIC', fullName: 'Haris Tabaković', team: 'Bosnia and Herzegovina', position: 'FW', club: 'Borussia Mönchengladbach (GER)' },
  { number: 24, nameOnShirt: 'CELIK', fullName: 'CELIK', team: 'Bosnia and Herzegovina', position: 'DF', club: 'RC Lens (FRA)' },
  { number: 25, nameOnShirt: 'LUKIC', fullName: 'Jovo Lukić', team: 'Bosnia and Herzegovina', position: 'FW', club: 'Universitatea Cluj (ROU)' },
  { number: 26, nameOnShirt: 'MAHMIC', fullName: 'Ermin Mahmić', team: 'Bosnia and Herzegovina', position: 'MF', club: 'FC Slovan Liberec (CZE)' },
  { number: 1, nameOnShirt: 'TURNER', fullName: 'Matt Turner', team: 'United States', position: 'GK', club: 'New England Revolution (USA)' },
  { number: 2, nameOnShirt: 'DEST', fullName: 'Sergiño Dest', team: 'United States', position: 'DF', club: 'PSV Eindhoven (NED)' },
  { number: 3, nameOnShirt: 'RICHARDS', fullName: 'Chris Richards', team: 'United States', position: 'DF', club: 'Crystal Palace FC (ENG)' },
  { number: 4, nameOnShirt: 'ADAMS', fullName: 'Tyler Adams', team: 'United States', position: 'MF', club: 'AFC Bournemouth (ENG)' },
  { number: 5, nameOnShirt: 'A. ROBINSON', fullName: 'Antonee Robinson', team: 'United States', position: 'DF', club: 'Fulham FC (ENG)' },
  { number: 6, nameOnShirt: 'TRUSTY', fullName: 'Auston Trusty', team: 'United States', position: 'DF', club: 'Celtic FC (SCO)' },
  { number: 7, nameOnShirt: 'REYNA', fullName: 'Giovanni Reyna', team: 'United States', position: 'MF', club: 'Borussia Mönchengladbach (GER)' },
  { number: 8, nameOnShirt: 'MCKENNIE', fullName: 'Weston McKennie', team: 'United States', position: 'MF', club: 'Juventus FC (ITA)' },
  { number: 9, nameOnShirt: 'PEPI', fullName: 'Ricardo Pepi', team: 'United States', position: 'FW', club: 'PSV Eindhoven (NED)' },
  { number: 10, nameOnShirt: 'PULISIC', fullName: 'Christian Pulisic', team: 'United States', position: 'FW', club: 'AC Milan (ITA)' },
  { number: 11, nameOnShirt: 'AARONSON', fullName: 'Brenden Aaronson', team: 'United States', position: 'FW', club: 'Leeds United FC (ENG)' },
  { number: 12, nameOnShirt: 'M. ROBINSON', fullName: 'Antonee Robinson', team: 'United States', position: 'DF', club: 'FC Cincinnatti (USA)' },
  { number: 13, nameOnShirt: 'REAM', fullName: 'Tim Ream', team: 'United States', position: 'DF', club: 'Charlotte FC (USA)' },
  { number: 14, nameOnShirt: 'BERHALTER', fullName: 'Sebastian Berhalter', team: 'United States', position: 'MF', club: 'Vancouver Whitecaps FC (CAN)' },
  { number: 15, nameOnShirt: 'ROLDAN', fullName: 'Cristian Roldan', team: 'United States', position: 'MF', club: 'Seattle Sounders FC (USA)' },
  { number: 16, nameOnShirt: 'FREEMAN', fullName: 'Alex Freeman', team: 'United States', position: 'DF', club: 'Villarreal CF (ESP)' },
  { number: 17, nameOnShirt: 'TILLMAN', fullName: 'Malik Tillman', team: 'United States', position: 'MF', club: 'Bayer Leverkusen (GER)' },
  { number: 18, nameOnShirt: 'ARFSTEN', fullName: 'Max Arfsten', team: 'United States', position: 'DF', club: 'Columbus Crew (USA)' },
  { number: 19, nameOnShirt: 'WRIGHT', fullName: 'Haji Wright', team: 'United States', position: 'FW', club: 'Coventry City FC (ENG)' },
  { number: 20, nameOnShirt: 'BALOGUN', fullName: 'Folarin Balogun', team: 'United States', position: 'FW', club: 'AS Monaco (FRA)' },
  { number: 21, nameOnShirt: 'WEAH', fullName: 'Timothy Weah', team: 'United States', position: 'FW', club: 'Olympique Marseille (FRA)' },
  { number: 22, nameOnShirt: 'MCKENZIE', fullName: 'Mark McKenzie', team: 'United States', position: 'DF', club: 'Toulouse FC (FRA)' },
  { number: 23, nameOnShirt: 'SCALLY', fullName: 'Joe Scally', team: 'United States', position: 'DF', club: 'Borussia Mönchengladbach (GER)' },
  { number: 24, nameOnShirt: 'FREESE', fullName: 'Matt Freese', team: 'United States', position: 'GK', club: 'New York City FC (USA)' },
  { number: 25, nameOnShirt: 'BRADY', fullName: 'Chris Brady', team: 'United States', position: 'GK', club: 'Chicago Fire FC (USA)' },
  { number: 26, nameOnShirt: 'ZENDEJAS', fullName: 'Alejandro Zendejas', team: 'United States', position: 'FW', club: 'Club América (MEX)' },
  { number: 1, nameOnShirt: 'R. RANGEL', fullName: 'Raúl Rangel', team: 'Mexico', position: 'GK', club: 'CD Guadalajara (MEX)' },
  { number: 2, nameOnShirt: 'J. SÁNCHEZ', fullName: 'Jorge Sánchez', team: 'Mexico', position: 'DF', club: 'PAOK Saloniki (GRE)' },
  { number: 3, nameOnShirt: 'C. MONTES', fullName: 'César Montes', team: 'Mexico', position: 'DF', club: 'FC Lokomotiv Moscow (RUS)' },
  { number: 4, nameOnShirt: 'E. ÁLVAREZ', fullName: 'Edson Álvarez', team: 'Mexico', position: 'DF', club: 'Fenerbahçe SK (TUR)' },
  { number: 5, nameOnShirt: 'J. VÁSQUEZ', fullName: 'Johan Vásquez', team: 'Mexico', position: 'DF', club: 'Genoa CFC (ITA)' },
  { number: 6, nameOnShirt: 'E. LIRA', fullName: 'Érik Lira', team: 'Mexico', position: 'MF', club: 'CF Cruz Azul (MEX)' },
  { number: 7, nameOnShirt: 'L. ROMO', fullName: 'Luis Romo', team: 'Mexico', position: 'MF', club: 'CD Guadalajara (MEX)' },
  { number: 8, nameOnShirt: 'FIDALGO', fullName: 'Álvaro Fidalgo', team: 'Mexico', position: 'MF', club: 'Real Betis (ESP)' },
  { number: 9, nameOnShirt: 'RAÚL', fullName: 'Raúl Rangel', team: 'Mexico', position: 'FW', club: 'Fulham FC (ENG)' },
  { number: 10, nameOnShirt: 'A. VEGA', fullName: 'Alexis Vega', team: 'Mexico', position: 'FW', club: 'Deportivo Toluca FC (MEX)' },
  { number: 11, nameOnShirt: 'S. GIMÉNEZ', fullName: 'Santiago Giménez', team: 'Mexico', position: 'FW', club: 'AC Milan (ITA)' },
  { number: 12, nameOnShirt: 'C. ACEVEDO', fullName: 'Carlos Acevedo', team: 'Mexico', position: 'GK', club: 'Club Santos Laguna (MEX)' },
  { number: 13, nameOnShirt: 'G. OCHOA', fullName: 'Guillermo Ochoa', team: 'Mexico', position: 'GK', club: 'AEL Limassol (CYP)' },
  { number: 14, nameOnShirt: 'A. GONZÁLEZ', fullName: 'Armando González', team: 'Mexico', position: 'FW', club: 'CD Guadalajara (MEX)' },
  { number: 15, nameOnShirt: 'I. REYES', fullName: 'Israel Reyes', team: 'Mexico', position: 'DF', club: 'Club América (MEX)' },
  { number: 16, nameOnShirt: 'J. QUIÑONES', fullName: 'Julián Quiñones', team: 'Mexico', position: 'FW', club: 'Al Qadsiah FC (KSA)' },
  { number: 17, nameOnShirt: 'ORBELÍN', fullName: 'Orbelín Pineda', team: 'Mexico', position: 'MF', club: 'AEK Athens (GRE)' },
  { number: 18, nameOnShirt: 'O. VARGAS', fullName: 'Obed Vargas', team: 'Mexico', position: 'MF', club: 'Atlético De Madrid (ESP)' },
  { number: 19, nameOnShirt: 'G. MORA', fullName: 'Gilberto Mora', team: 'Mexico', position: 'MF', club: 'Club Tijuana (MEX)' },
  { number: 20, nameOnShirt: 'M. CHÁVEZ', fullName: 'Mateo Chávez', team: 'Mexico', position: 'DF', club: 'AZ Alkmaar (NED)' },
  { number: 21, nameOnShirt: 'C. HUERTA', fullName: 'César Huerta', team: 'Mexico', position: 'FW', club: 'RSC Anderlecht (BEL)' },
  { number: 22, nameOnShirt: 'G. MARTÍNEZ', fullName: 'Guillermo Martínez', team: 'Mexico', position: 'FW', club: 'Pumas UNAM (MEX)' },
  { number: 23, nameOnShirt: 'J. GALLARDO', fullName: 'Jesús Gallardo', team: 'Mexico', position: 'DF', club: 'Deportivo Toluca FC (MEX)' },
  { number: 24, nameOnShirt: 'L. CHÁVEZ', fullName: 'Mateo Chávez', team: 'Mexico', position: 'MF', club: 'FC Dynamo Moscow (RUS)' },
  { number: 25, nameOnShirt: 'R. ALVARADO', fullName: 'Roberto Alvarado', team: 'Mexico', position: 'FW', club: 'CD Guadalajara (MEX)' },
  { number: 26, nameOnShirt: 'B. GUTIÉRREZ', fullName: 'Brian Gutiérrez', team: 'Mexico', position: 'MF', club: 'CD Guadalajara (MEX)' },
  { number: 1, nameOnShirt: 'MEJÍA', fullName: 'Luis Mejía', team: 'Panama', position: 'GK', club: 'Club Nacional (URU)' },
  { number: 2, nameOnShirt: 'BLACKMAN', fullName: 'César Blackman', team: 'Panama', position: 'DF', club: 'Š K Slovan Bratislava (SVK)' },
  { number: 3, nameOnShirt: 'CORDOBA', fullName: 'José Córdoba', team: 'Panama', position: 'DF', club: 'Norwich City FC (ENG)' },
  { number: 4, nameOnShirt: 'F. ESCOBAR', fullName: 'Fidel Escobar', team: 'Panama', position: 'DF', club: 'Deportivo Saprissa (CRC)' },
  { number: 5, nameOnShirt: 'FARIÑA', fullName: 'Edgardo Fariña', team: 'Panama', position: 'DF', club: 'FC Pari Nizhny Novgorod (RUS)' },
  { number: 6, nameOnShirt: 'MARTÍNEZ', fullName: 'Cristian Martínez', team: 'Panama', position: 'MF', club: 'Hapoel Kiryat Shmona FC (ISR)' },
  { number: 7, nameOnShirt: 'J.L. RODRÍGUEZ', fullName: 'José Luis Rodríguez', team: 'Panama', position: 'MF', club: 'FC Juárez (MEX)' },
  { number: 8, nameOnShirt: 'CARRASQUILLA', fullName: 'Adalberto Carrasquilla', team: 'Panama', position: 'MF', club: 'Pumas UNAM (MEX)' },
  { number: 9, nameOnShirt: 'T. RODRÍGUEZ', fullName: 'José Luis Rodríguez', team: 'Panama', position: 'FW', club: 'Deportivo Saprissa (CRC)' },
  { number: 10, nameOnShirt: 'ISMAEL', fullName: 'Ismael Díaz', team: 'Panama', position: 'MF', club: 'Club León (MEX)' },
  { number: 11, nameOnShirt: 'BÁRCENAS', fullName: 'Yoel Bárcenas', team: 'Panama', position: 'MF', club: 'Mazatlán FC (MEX)' },
  { number: 12, nameOnShirt: 'SAMUDIO', fullName: 'César Samudio', team: 'Panama', position: 'GK', club: 'CD Marathón (HON)' },
  { number: 13, nameOnShirt: 'RAMOS', fullName: 'Jiovany Ramos', team: 'Panama', position: 'DF', club: 'Puerto Cabello CF (VEN)' },
  { number: 14, nameOnShirt: 'HARVEY', fullName: 'Carlos Harvey', team: 'Panama', position: 'DF', club: 'Minnesota United FC (USA)' },
  { number: 15, nameOnShirt: 'DAVIS', fullName: 'Eric Davis', team: 'Panama', position: 'DF', club: 'CD Plaza Amador (PAN)' },
  { number: 16, nameOnShirt: 'ANDRADE', fullName: 'Andrés Andrade', team: 'Panama', position: 'DF', club: 'LASK Linz (AUT)' },
  { number: 17, nameOnShirt: 'FAJARDO', fullName: 'José Fajardo', team: 'Panama', position: 'FW', club: 'CD Universidad Católica (ECU)' },
  { number: 18, nameOnShirt: 'WATERMAN', fullName: 'Cecilio Waterman', team: 'Panama', position: 'FW', club: 'CD Universidad De Concepción (CHI)' },
  { number: 19, nameOnShirt: 'QUINTERO', fullName: 'Alberto Quintero', team: 'Panama', position: 'MF', club: 'CD Plaza Amador (PAN)' },
  { number: 20, nameOnShirt: 'GODOY', fullName: 'Aníbal Godoy', team: 'Panama', position: 'MF', club: 'San Diego FC (USA)' },
  { number: 21, nameOnShirt: 'YANIS', fullName: 'César Yanis', team: 'Panama', position: 'MF', club: 'CD Cobresal (CHI)' },
  { number: 22, nameOnShirt: 'MOSQUERA', fullName: 'Orlando Mosquera', team: 'Panama', position: 'GK', club: 'Al Fayha FC (KSA)' },
  { number: 23, nameOnShirt: 'A. MURILLO', fullName: 'Michael Amir Murillo', team: 'Panama', position: 'DF', club: 'Be ş ikta ş  JK (TUR)' },
  { number: 24, nameOnShirt: 'LONDONO', fullName: 'Azarias Londoño', team: 'Panama', position: 'FW', club: 'CD Universidad Católica (ECU)' },
  { number: 25, nameOnShirt: 'MILLER', fullName: 'Roderick Miller', team: 'Panama', position: 'DF', club: 'Turan Tovuz (AZE)' },
  { number: 26, nameOnShirt: 'GUTIÉRREZ', fullName: 'Jorge Gutiérrez', team: 'Panama', position: 'DF', club: 'Deportivo La Guaira (VEN)' },
  { number: 1, nameOnShirt: 'ST. CLAIR', fullName: 'Dayne St. Clair', team: 'Canada', position: 'GK', club: 'Inter Miami CF (USA)' },
  { number: 2, nameOnShirt: 'JOHNSTON', fullName: 'Alistair Johnston', team: 'Canada', position: 'DF', club: 'Celtic FC (SCO)' },
  { number: 3, nameOnShirt: 'JONES', fullName: 'Alfie Jones', team: 'Canada', position: 'DF', club: 'Middlesbrough FC (ENG)' },
  { number: 4, nameOnShirt: 'DE FOUGEROLLES', fullName: 'Luc de Fougerolles', team: 'Canada', position: 'DF', club: 'FCV Dender EH (BEL)' },
  { number: 5, nameOnShirt: 'WATERMAN', fullName: 'Joel Waterman', team: 'Canada', position: 'DF', club: 'Chicago Fire FC (USA)' },
  { number: 6, nameOnShirt: 'CHOINIÈRE', fullName: 'Mathieu Choinière', team: 'Canada', position: 'MF', club: 'LAFC (USA)' },
  { number: 7, nameOnShirt: 'EUSTAQUIO', fullName: 'Stephen Eustáquio', team: 'Canada', position: 'MF', club: 'LAFC (USA)' },
  { number: 8, nameOnShirt: 'KONÉ', fullName: 'Ismaël Koné', team: 'Canada', position: 'MF', club: 'US Sassuolo (ITA)' },
  { number: 9, nameOnShirt: 'LARIN', fullName: 'Cyle Larin', team: 'Canada', position: 'FW', club: 'Southampton FC (ENG)' },
  { number: 10, nameOnShirt: 'J. DAVID', fullName: 'Jonathan David', team: 'Canada', position: 'FW', club: 'Juventus FC (ITA)' },
  { number: 11, nameOnShirt: 'MILLAR', fullName: 'Liam Millar', team: 'Canada', position: 'MF', club: 'Hull City FC (ENG)' },
  { number: 12, nameOnShirt: 'OLUWASEYI', fullName: 'Tani Oluwaseyi', team: 'Canada', position: 'FW', club: 'Villarreal CF (ESP)' },
  { number: 13, nameOnShirt: 'CORNELIUS', fullName: 'Derek Cornelius', team: 'Canada', position: 'DF', club: 'Rangers FC (SCO)' },
  { number: 14, nameOnShirt: 'SHAFFELBURG', fullName: 'Jacob Shaffelburg', team: 'Canada', position: 'MF', club: 'LAFC (USA)' },
  { number: 15, nameOnShirt: 'BOMBITO', fullName: 'Moïse Bombito', team: 'Canada', position: 'DF', club: 'OGC Nice (FRA)' },
  { number: 16, nameOnShirt: 'CREPEAU', fullName: 'Maxime Crépeau', team: 'Canada', position: 'GK', club: 'Orlando City SC (USA)' },
  { number: 17, nameOnShirt: 'BUCHANAN', fullName: 'Tajon Buchanan', team: 'Canada', position: 'FW', club: 'Villarreal CF (ESP)' },
  { number: 18, nameOnShirt: 'GOODMAN', fullName: 'Owen Goodman', team: 'Canada', position: 'GK', club: 'Barnsley (ENG)' },
  { number: 19, nameOnShirt: 'DAVIES', fullName: 'Alphonso Davies', team: 'Canada', position: 'DF', club: 'FC Bayern München (GER)' },
  { number: 20, nameOnShirt: 'AHMED', fullName: 'Ali Ahmed', team: 'Canada', position: 'FW', club: 'Norwich City FC (ENG)' },
  { number: 21, nameOnShirt: 'OSORIO', fullName: 'Jonathan Osorio', team: 'Canada', position: 'MF', club: 'Toronto FC (CAN)' },
  { number: 22, nameOnShirt: 'LARYEA', fullName: 'Richie Laryea', team: 'Canada', position: 'DF', club: 'Toronto FC (CAN)' },
  { number: 23, nameOnShirt: 'SIGUR', fullName: 'Niko Sigur', team: 'Canada', position: 'DF', club: 'HNK Hajduk Split (CRO)' },
  { number: 24, nameOnShirt: 'PROMISE', fullName: 'Promise David', team: 'Canada', position: 'FW', club: 'Royale Union Saint-Gilloise (BEL)' },
  { number: 25, nameOnShirt: 'SALIBA', fullName: 'Ali Ahmed', team: 'Canada', position: 'MF', club: 'RSC Anderlecht (BEL)' },
  { number: 26, nameOnShirt: 'MARCELO', fullName: 'MARCELO', team: 'Canada', position: 'MF', club: 'Tigres UANL (MEX)' },
  { number: 1, nameOnShirt: 'PLACIDE', fullName: 'Johny Placide', team: 'Haiti', position: 'GK', club: 'SC Bastia (FRA)' },
  { number: 2, nameOnShirt: 'ARCUS', fullName: 'Carlens Arcus', team: 'Haiti', position: 'DF', club: 'Angers SCO (FRA)' },
  { number: 3, nameOnShirt: 'THERMONCY', fullName: 'Keeto Thermoncy', team: 'Haiti', position: 'DF', club: 'BSC Young Boys (SUI)' },
  { number: 4, nameOnShirt: 'ADE', fullName: 'Ricardo Adé', team: 'Haiti', position: 'DF', club: 'LDU Quito (ECU)' },
  { number: 5, nameOnShirt: 'DELCROIX', fullName: 'Hannes Delcroix', team: 'Haiti', position: 'DF', club: 'FC Lugano (SUI)' },
  { number: 6, nameOnShirt: 'SAINTE', fullName: 'Carl Sainté', team: 'Haiti', position: 'MF', club: 'El Paso Locomotive FC (USA)' },
  { number: 7, nameOnShirt: 'ETIENNE JR', fullName: 'Derrick Etienne Jr.', team: 'Haiti', position: 'FW', club: 'Toronto FC (CAN)' },
  { number: 8, nameOnShirt: 'EXPERIENCE', fullName: 'Martin Expérience', team: 'Haiti', position: 'DF', club: 'AS Nancy (FRA)' },
  { number: 9, nameOnShirt: 'NAZON', fullName: 'Duckens Nazon', team: 'Haiti', position: 'FW', club: 'Esteghlal Tehran FC (IRN)' },
  { number: 10, nameOnShirt: 'BELLEGARDE', fullName: 'Jean-Ricner Bellegarde', team: 'Haiti', position: 'MF', club: 'Wolverhampton Wanderers FC (ENG)' },
  { number: 11, nameOnShirt: 'DEEDSON', fullName: 'Louicius Deedson', team: 'Haiti', position: 'FW', club: 'FC Dallas (USA)' },
  { number: 12, nameOnShirt: 'A. PIERRE', fullName: 'Alexandre Pierre', team: 'Haiti', position: 'GK', club: 'FC Sochaux-Montbéliard (FRA)' },
  { number: 13, nameOnShirt: 'LACROIX', fullName: 'Duke Lacroix', team: 'Haiti', position: 'DF', club: 'Colorado Springs Switchbacks FC (USA)' },
  { number: 14, nameOnShirt: 'L. PIERRE', fullName: 'Alexandre Pierre', team: 'Haiti', position: 'MF', club: 'FC Vizela (POR)' },
  { number: 15, nameOnShirt: 'PROVIDENCE', fullName: 'Ruben Providence', team: 'Haiti', position: 'FW', club: 'Almere City FC (NED)' },
  { number: 16, nameOnShirt: 'JOSEPH', fullName: 'Lenny Joseph', team: 'Haiti', position: 'FW', club: 'Ferencvárosi TC (HUN)' },
  { number: 17, nameOnShirt: 'JEAN JACQUES', fullName: 'Jean-Ricner Bellegarde', team: 'Haiti', position: 'MF', club: 'Philadelphia Union (USA)' },
  { number: 18, nameOnShirt: 'ISIDOR', fullName: 'Wilson Isidor', team: 'Haiti', position: 'FW', club: 'Sunderland AFC (ENG)' },
  { number: 19, nameOnShirt: 'FORTUNE', fullName: 'Yassin Fortuné', team: 'Haiti', position: 'FW', club: 'FC Vizela (POR)' },
  { number: 20, nameOnShirt: 'PIERROT', fullName: 'Frantzdy Pierrot', team: 'Haiti', position: 'FW', club: 'Çaykur Rizespor (TUR)' },
  { number: 21, nameOnShirt: 'CASIMIR', fullName: 'Josué Casimir', team: 'Haiti', position: 'FW', club: 'AJ Auxerre (FRA)' },
  { number: 22, nameOnShirt: 'DUVERNE', fullName: 'Jean-Kévin Duverne', team: 'Haiti', position: 'DF', club: 'KAA Gent (BEL)' },
  { number: 23, nameOnShirt: 'DUVERGER', fullName: 'Josué Duverger', team: 'Haiti', position: 'GK', club: 'FC Cosmos Koblenz (GER)' },
  { number: 24, nameOnShirt: 'PAUGIN', fullName: 'PAUGIN', team: 'Haiti', position: 'DF', club: 'SV Zulte Waregem (BEL)' },
  { number: 25, nameOnShirt: 'SIMON', fullName: 'Dominique Simon', team: 'Haiti', position: 'MF', club: 'FC Tatran Pre š ov (SVK)' },
  { number: 26, nameOnShirt: 'W. PIERRE', fullName: 'Alexandre Pierre', team: 'Haiti', position: 'MF', club: 'Violette AC (HAI)' },
  { number: 1, nameOnShirt: 'ROOM', fullName: 'ROOM', team: 'Curaçao', position: 'GK', club: 'Miami FC (USA)' },
  { number: 2, nameOnShirt: 'SAMBO', fullName: 'SAMBO', team: 'Curaçao', position: 'DF', club: 'Sparta Rotterdam (NED)' },
  { number: 3, nameOnShirt: 'GAARI', fullName: 'GAARI', team: 'Curaçao', position: 'DF', club: 'Abha Club (KSA)' },
  { number: 4, nameOnShirt: 'VAN EIJMA', fullName: 'VAN EIJMA', team: 'Curaçao', position: 'DF', club: 'RKC Waalwijk (NED)' },
  { number: 5, nameOnShirt: 'FLORANUS', fullName: 'FLORANUS', team: 'Curaçao', position: 'DF', club: 'PEC Zwolle (NED)' },
  { number: 6, nameOnShirt: 'ROEMERATOE', fullName: 'ROEMERATOE', team: 'Curaçao', position: 'MF', club: 'RKC Waalwijk (NED)' },
  { number: 7, nameOnShirt: 'J. BACUNA', fullName: 'J. BACUNA', team: 'Curaçao', position: 'MF', club: 'FC Volendam (NED)' },
  { number: 8, nameOnShirt: 'COMENENCIA', fullName: 'COMENENCIA', team: 'Curaçao', position: 'MF', club: 'FC Zürich (SUI)' },
  { number: 9, nameOnShirt: 'LOCADIA', fullName: 'LOCADIA', team: 'Curaçao', position: 'FW', club: 'Miami FC (USA)' },
  { number: 10, nameOnShirt: 'L. BACUNA', fullName: 'L. BACUNA', team: 'Curaçao', position: 'MF', club: 'I ğ dır FK (TUR)' },
  { number: 11, nameOnShirt: 'ANTONISSE', fullName: 'ANTONISSE', team: 'Curaçao', position: 'FW', club: 'AE Kisia FC (GRE)' },
  { number: 12, nameOnShirt: 'HANSEN', fullName: 'HANSEN', team: 'Curaçao', position: 'FW', club: 'Middlesbrough FC (ENG)' },
  { number: 13, nameOnShirt: 'NOSLIN', fullName: 'NOSLIN', team: 'Curaçao', position: 'FW', club: 'SC Telstar (NED)' },
  { number: 14, nameOnShirt: 'GORRE', fullName: 'GORRE', team: 'Curaçao', position: 'FW', club: 'Maccabi Haifa FC (ISR)' },
  { number: 15, nameOnShirt: 'MARTHA', fullName: 'MARTHA', team: 'Curaçao', position: 'MF', club: 'Rotherham United FC (ENG)' },
  { number: 16, nameOnShirt: 'MARGARITHA', fullName: 'MARGARITHA', team: 'Curaçao', position: 'FW', club: 'SK Beveren (BEL)' },
  { number: 17, nameOnShirt: 'KUWAS', fullName: 'KUWAS', team: 'Curaçao', position: 'FW', club: 'FC Volendam (NED)' },
  { number: 18, nameOnShirt: 'OBISPO', fullName: 'OBISPO', team: 'Curaçao', position: 'DF', club: 'PSV Eindhoven (NED)' },
  { number: 19, nameOnShirt: 'KASTANEER', fullName: 'KASTANEER', team: 'Curaçao', position: 'FW', club: 'Terengganu FC (MAS)' },
  { number: 20, nameOnShirt: 'BRENET', fullName: 'BRENET', team: 'Curaçao', position: 'DF', club: 'Kayserispor (TUR)' },
  { number: 21, nameOnShirt: 'CHONG', fullName: 'CHONG', team: 'Curaçao', position: 'MF', club: 'Sheeld United FC (ENG)' },
  { number: 22, nameOnShirt: 'FELIDA', fullName: 'FELIDA', team: 'Curaçao', position: 'MF', club: 'FC Den Bosch (NED)' },
  { number: 23, nameOnShirt: 'BAZOER', fullName: 'BAZOER', team: 'Curaçao', position: 'DF', club: 'Konyaspor (TUR)' },
  { number: 24, nameOnShirt: 'FONVILLE', fullName: 'FONVILLE', team: 'Curaçao', position: 'DF', club: 'NEC Nijmegen (NED)' },
  { number: 25, nameOnShirt: 'BODAK', fullName: 'BODAK', team: 'Curaçao', position: 'GK', club: 'SC Telstar (NED)' },
  { number: 26, nameOnShirt: 'DOORNBUSCH', fullName: 'DOORNBUSCH', team: 'Curaçao', position: 'GK', club: 'VVV Venlo (NED)' },
  { number: 1, nameOnShirt: 'MUSSO', fullName: 'Juan Musso', team: 'Argentina', position: 'GK', club: 'Atlético De Madrid (ESP)' },
  { number: 2, nameOnShirt: 'BALERDI', fullName: 'BALERDI', team: 'Argentina', position: 'DF', club: 'Olympique Marseille (FRA)' },
  { number: 3, nameOnShirt: 'TAGLIAFICO', fullName: 'Nicolás Tagliafico', team: 'Argentina', position: 'DF', club: 'Olympique Lyonnais (FRA)' },
  { number: 4, nameOnShirt: 'MONTIEL', fullName: 'Gonzalo Montiel', team: 'Argentina', position: 'DF', club: 'CA River Plate (ARG)' },
  { number: 5, nameOnShirt: 'PAREDES', fullName: 'Leandro Paredes', team: 'Argentina', position: 'MF', club: 'CA Boca Juniors (ARG)' },
  { number: 6, nameOnShirt: 'MARTÍNEZ', fullName: 'Lisandro Martínez', team: 'Argentina', position: 'DF', club: 'Manchester United FC (ENG)' },
  { number: 7, nameOnShirt: 'DE PAUL', fullName: 'Leandro Paredes', team: 'Argentina', position: 'MF', club: 'Inter Miami CF (USA)' },
  { number: 8, nameOnShirt: 'BARCO', fullName: 'Valentín Barco', team: 'Argentina', position: 'MF', club: 'RC Strasbourg (FRA)' },
  { number: 9, nameOnShirt: 'J. ALVAREZ', fullName: 'Julián Alvarez', team: 'Argentina', position: 'FW', club: 'Atlético De Madrid (ESP)' },
  { number: 10, nameOnShirt: 'MESSI', fullName: 'Lionel Messi', team: 'Argentina', position: 'FW', club: 'Inter Miami CF (USA)' },
  { number: 11, nameOnShirt: 'LO CELSO', fullName: 'Gonzalo Montiel', team: 'Argentina', position: 'MF', club: 'Real Betis (ESP)' },
  { number: 12, nameOnShirt: 'RULLI', fullName: 'Gerónimo Rulli', team: 'Argentina', position: 'GK', club: 'Olympique Marseille (FRA)' },
  { number: 13, nameOnShirt: 'ROMERO', fullName: 'Cristian Romero', team: 'Argentina', position: 'DF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 14, nameOnShirt: 'PALACIOS', fullName: 'Exequiel Palacios', team: 'Argentina', position: 'MF', club: 'Bayer Leverkusen (GER)' },
  { number: 15, nameOnShirt: 'N. GONZÁLEZ', fullName: 'Nicolás González', team: 'Argentina', position: 'MF', club: 'Atlético De Madrid (ESP)' },
  { number: 16, nameOnShirt: 'ALMADA', fullName: 'Thiago Almada', team: 'Argentina', position: 'FW', club: 'Atlético De Madrid (ESP)' },
  { number: 17, nameOnShirt: 'SIMEONE', fullName: 'Giuliano Simeone', team: 'Argentina', position: 'FW', club: 'Atlético De Madrid (ESP)' },
  { number: 18, nameOnShirt: 'NICO PAZ', fullName: 'Nicolás Tagliafico', team: 'Argentina', position: 'FW', club: 'Como (ITA)' },
  { number: 19, nameOnShirt: 'OTAMENDI', fullName: 'Nicolás Otamendi', team: 'Argentina', position: 'DF', club: 'SL Benca (POR)' },
  { number: 20, nameOnShirt: 'MAC ALLISTER', fullName: 'Alexis Mac Allister', team: 'Argentina', position: 'MF', club: 'Liverpool FC (ENG)' },
  { number: 21, nameOnShirt: 'LOPEZ', fullName: 'Giovani Lo Celso', team: 'Argentina', position: 'FW', club: 'SE Palmeiras (BRA)' },
  { number: 22, nameOnShirt: 'L. MARTÍNEZ', fullName: 'Lisandro Martínez', team: 'Argentina', position: 'FW', club: 'FC Internazionale Milano (ITA)' },
  { number: 23, nameOnShirt: 'E. MARTÍNEZ', fullName: 'Lisandro Martínez', team: 'Argentina', position: 'GK', club: 'Aston Villa FC (ENG)' },
  { number: 24, nameOnShirt: 'E. FERNÁNDEZ', fullName: 'Rodrigo De Paul', team: 'Argentina', position: 'MF', club: 'Chelsea FC (ENG)' },
  { number: 25, nameOnShirt: 'MEDINA', fullName: 'Facundo Medina', team: 'Argentina', position: 'DF', club: 'Olympique Marseille (FRA)' },
  { number: 26, nameOnShirt: 'MOLINA', fullName: 'Nahuel Molina', team: 'Argentina', position: 'DF', club: 'Atlético De Madrid (ESP)' },
  { number: 1, nameOnShirt: 'A. BECKER', fullName: 'Alisson Becker', team: 'Brazil', position: 'GK', club: 'Liverpool FC (ENG)' },
  { number: 2, nameOnShirt: 'WESLEY', fullName: 'WESLEY', team: 'Brazil', position: 'DF', club: 'AS Roma (ITA)' },
  { number: 3, nameOnShirt: 'GABRIEL', fullName: 'Gabriel Magalhães', team: 'Brazil', position: 'DF', club: 'Arsenal FC (ENG)' },
  { number: 4, nameOnShirt: 'MARQUINHOS', fullName: 'MARQUINHOS', team: 'Brazil', position: 'DF', club: 'Paris Saint-Germain (FRA)' },
  { number: 5, nameOnShirt: 'CASEMIRO', fullName: 'CASEMIRO', team: 'Brazil', position: 'MF', club: 'Manchester United FC (ENG)' },
  { number: 6, nameOnShirt: 'ALEX SANDRO', fullName: 'ALEX SANDRO', team: 'Brazil', position: 'DF', club: 'CR Flamengo (BRA)' },
  { number: 7, nameOnShirt: 'VINI JR.', fullName: 'Vinícius Júnior', team: 'Brazil', position: 'FW', club: 'Real Madrid C. F. (ESP)' },
  { number: 8, nameOnShirt: 'BRUNO G.', fullName: 'Bruno Guimarães', team: 'Brazil', position: 'MF', club: 'Newcastle United FC (ENG)' },
  { number: 9, nameOnShirt: 'CUNHA', fullName: 'Matheus Cunha', team: 'Brazil', position: 'FW', club: 'Manchester United FC (ENG)' },
  { number: 10, nameOnShirt: 'NEYMAR JR', fullName: 'Neymar', team: 'Brazil', position: 'FW', club: 'Santos FC (BRA)' },
  { number: 11, nameOnShirt: 'RAPHINHA', fullName: 'Raphinha', team: 'Brazil', position: 'FW', club: 'FC Barcelona (ESP)' },
  { number: 12, nameOnShirt: 'WEVERTON', fullName: 'WEVERTON', team: 'Brazil', position: 'GK', club: 'Grêmio FBPA (BRA)' },
  { number: 13, nameOnShirt: 'DANILO', fullName: 'DANILO', team: 'Brazil', position: 'DF', club: 'CR Flamengo (BRA)' },
  { number: 14, nameOnShirt: 'BREMER', fullName: 'Gleison Bremer', team: 'Brazil', position: 'DF', club: 'Juventus FC (ITA)' },
  { number: 15, nameOnShirt: 'LEO PEREIRA', fullName: 'Léo Pereira', team: 'Brazil', position: 'DF', club: 'CR Flamengo (BRA)' },
  { number: 16, nameOnShirt: 'DOUGLAS SANTOS', fullName: 'DOUGLAS SANTOS', team: 'Brazil', position: 'DF', club: 'FC Zenit St. Petersburg (RUS)' },
  { number: 17, nameOnShirt: 'FABINHO', fullName: 'FABINHO', team: 'Brazil', position: 'MF', club: 'Al Ittihad (KSA)' },
  { number: 18, nameOnShirt: 'DANILO S.', fullName: 'Danilo', team: 'Brazil', position: 'MF', club: 'Botafogo (BRA)' },
  { number: 19, nameOnShirt: 'ENDRICK', fullName: 'ENDRICK', team: 'Brazil', position: 'FW', club: 'Olympique Lyonnais (FRA)' },
  { number: 20, nameOnShirt: 'L. PAQUETA', fullName: 'Lucas Paquetá', team: 'Brazil', position: 'MF', club: 'CR Flamengo (BRA)' },
  { number: 21, nameOnShirt: 'L. HENRIQUE', fullName: 'Luiz Henrique', team: 'Brazil', position: 'FW', club: 'FC Zenit St. Petersburg (RUS)' },
  { number: 22, nameOnShirt: 'MARTINELLI', fullName: 'Gabriel Martinelli', team: 'Brazil', position: 'FW', club: 'Arsenal FC (ENG)' },
  { number: 23, nameOnShirt: 'EDERSON', fullName: 'EDERSON', team: 'Brazil', position: 'GK', club: 'Fenerbahçe SK (TUR)' },
  { number: 24, nameOnShirt: 'IBANEZ', fullName: 'Roger Ibañez', team: 'Brazil', position: 'DF', club: 'Al Ahli FC (KSA)' },
  { number: 25, nameOnShirt: 'THIAGO', fullName: 'Igor Thiago', team: 'Brazil', position: 'FW', club: 'Brentford FC (ENG)' },
  { number: 26, nameOnShirt: 'RAYAN', fullName: 'RAYAN', team: 'Brazil', position: 'FW', club: 'AFC Bournemouth (ENG)' },
  { number: 1, nameOnShirt: 'OSPINA', fullName: 'David Ospina', team: 'Colombia', position: 'GK', club: 'Atlético Nacional (COL)' },
  { number: 2, nameOnShirt: 'D. MUÑOZ', fullName: 'Daniel Muñoz', team: 'Colombia', position: 'DF', club: 'Crystal Palace FC (ENG)' },
  { number: 3, nameOnShirt: 'J. LUCUMI', fullName: 'Jhon Lucumí', team: 'Colombia', position: 'DF', club: 'Bologna FC (ITA)' },
  { number: 4, nameOnShirt: 'ARIAS', fullName: 'Santiago Arias', team: 'Colombia', position: 'DF', club: 'CA Independiente (ARG)' },
  { number: 5, nameOnShirt: 'K. CASTAÑO', fullName: 'Kevin Castaño', team: 'Colombia', position: 'MF', club: 'CA River Plate (ARG)' },
  { number: 6, nameOnShirt: 'RICHARD RIOS', fullName: 'Richard Ríos', team: 'Colombia', position: 'MF', club: 'SL Benca (POR)' },
  { number: 7, nameOnShirt: 'LUIS DIAZ', fullName: 'Luis Díaz', team: 'Colombia', position: 'FW', club: 'FC Bayern München (GER)' },
  { number: 8, nameOnShirt: 'CARRASCAL', fullName: 'Jorge Carrascal', team: 'Colombia', position: 'MF', club: 'CR Flamengo (BRA)' },
  { number: 9, nameOnShirt: 'CORDOBA', fullName: 'Jhon Córdoba', team: 'Colombia', position: 'FW', club: 'FC Krasnodar (RUS)' },
  { number: 10, nameOnShirt: 'JAMES', fullName: 'James Rodríguez', team: 'Colombia', position: 'MF', club: 'Minnesota United FC (USA)' },
  { number: 11, nameOnShirt: 'J. ARIAS', fullName: 'Santiago Arias', team: 'Colombia', position: 'MF', club: 'SE Palmeiras (BRA)' },
  { number: 12, nameOnShirt: 'C. VARGAS', fullName: 'Camilo Vargas', team: 'Colombia', position: 'GK', club: 'Atlas FC (MEX)' },
  { number: 13, nameOnShirt: 'Y. MINA', fullName: 'Yerry Mina', team: 'Colombia', position: 'DF', club: 'Cagliari (ITA)' },
  { number: 14, nameOnShirt: 'PUERTA', fullName: 'Gustavo Puerta', team: 'Colombia', position: 'DF', club: 'Racing Santander (ESP)' },
  { number: 15, nameOnShirt: 'PORTILLA', fullName: 'Juan Portilla', team: 'Colombia', position: 'MF', club: 'Athletico Paranaense (BRA)' },
  { number: 16, nameOnShirt: 'J. LERMA', fullName: 'Jefferson Lerma', team: 'Colombia', position: 'MF', club: 'Crystal Palace FC (ENG)' },
  { number: 17, nameOnShirt: 'J. MOJICA', fullName: 'Johan Mojica', team: 'Colombia', position: 'DF', club: 'RCD Mallorca (ESP)' },
  { number: 18, nameOnShirt: 'W. DITTA', fullName: 'Willer Ditta', team: 'Colombia', position: 'DF', club: 'CF Cruz Azul (MEX)' },
  { number: 19, nameOnShirt: 'C. HERNANDEZ', fullName: 'Cucho Hernández', team: 'Colombia', position: 'FW', club: 'Real Betis (ESP)' },
  { number: 20, nameOnShirt: 'QUINTERO', fullName: 'Juan Fernando Quintero', team: 'Colombia', position: 'MF', club: 'CA River Plate (ARG)' },
  { number: 21, nameOnShirt: 'CAMPAZ', fullName: 'Jaminton Campaz', team: 'Colombia', position: 'FW', club: 'CA Rosario Central (ARG)' },
  { number: 22, nameOnShirt: 'MACHADO', fullName: 'Deiver Machado', team: 'Colombia', position: 'DF', club: 'FC Nantes (FRA)' },
  { number: 23, nameOnShirt: 'SANCHEZ', fullName: 'Davinson Sánchez', team: 'Colombia', position: 'DF', club: 'Galatasaray SK (TUR)' },
  { number: 24, nameOnShirt: 'MONTERO', fullName: 'Álvaro Montero', team: 'Colombia', position: 'GK', club: 'CA Vélez Sarseld (ARG)' },
  { number: 25, nameOnShirt: 'SUAREZ', fullName: 'Luis Suárez', team: 'Colombia', position: 'FW', club: 'Sporting CP (POR)' },
  { number: 26, nameOnShirt: 'A. GOMEZ', fullName: 'Andrés Gómez', team: 'Colombia', position: 'FW', club: 'CR Vasco Da Gama (BRA)' },
  { number: 1, nameOnShirt: 'GALINDEZ', fullName: 'Hernán Galíndez', team: 'Ecuador', position: 'GK', club: 'CA Huracán (ARG)' },
  { number: 2, nameOnShirt: 'TORRES', fullName: 'Félix Torres', team: 'Ecuador', position: 'DF', club: 'SC Internacional (BRA)' },
  { number: 3, nameOnShirt: 'HINCAPIE', fullName: 'Piero Hincapié', team: 'Ecuador', position: 'DF', club: 'Arsenal FC (ENG)' },
  { number: 4, nameOnShirt: 'ORDOÑEZ', fullName: 'ORDOÑEZ', team: 'Ecuador', position: 'DF', club: 'Club Brugge (BEL)' },
  { number: 5, nameOnShirt: 'ALCIVAR', fullName: 'Jordy Alcívar', team: 'Ecuador', position: 'MF', club: 'Independiente Del Valle (ECU)' },
  { number: 6, nameOnShirt: 'PACHO', fullName: 'Willian Pacho', team: 'Ecuador', position: 'DF', club: 'Paris Saint-Germain (FRA)' },
  { number: 7, nameOnShirt: 'ESTUPIÑAN', fullName: 'ESTUPIÑAN', team: 'Ecuador', position: 'DF', club: 'AC Milan (ITA)' },
  { number: 8, nameOnShirt: 'A. VALENCIA', fullName: 'Anthony Valencia', team: 'Ecuador', position: 'MF', club: 'Royal Antwerp FC (BEL)' },
  { number: 9, nameOnShirt: 'YEBOAH ZAMORA', fullName: 'John Yeboah', team: 'Ecuador', position: 'FW', club: 'Venezia FC (ITA)' },
  { number: 10, nameOnShirt: 'PAEZ', fullName: 'Kendry Páez', team: 'Ecuador', position: 'MF', club: 'CA River Plate (ARG)' },
  { number: 11, nameOnShirt: 'RODRIGUEZ', fullName: 'Kevin Rodríguez', team: 'Ecuador', position: 'FW', club: 'Royale Union Saint-Gilloise (BEL)' },
  { number: 12, nameOnShirt: 'RAMIREZ', fullName: 'Moisés Ramírez', team: 'Ecuador', position: 'GK', club: 'AE Kisia FC (GRE)' },
  { number: 13, nameOnShirt: 'E. VALENCIA', fullName: 'Anthony Valencia', team: 'Ecuador', position: 'FW', club: 'CF Pachuca (MEX)' },
  { number: 14, nameOnShirt: 'MINDA', fullName: 'Alan Minda', team: 'Ecuador', position: 'MF', club: 'Atlético Mineiro (BRA)' },
  { number: 15, nameOnShirt: 'VITE', fullName: 'Pedro Vite', team: 'Ecuador', position: 'MF', club: 'Pumas UNAM (MEX)' },
  { number: 16, nameOnShirt: 'J. CAICEDO', fullName: 'Jordy Caicedo', team: 'Ecuador', position: 'FW', club: 'CA Huracán (ARG)' },
  { number: 17, nameOnShirt: 'PRECIADO', fullName: 'Ángelo Preciado', team: 'Ecuador', position: 'DF', club: 'Atlético Mineiro (BRA)' },
  { number: 18, nameOnShirt: 'CASTILLO', fullName: 'Denil Castillo', team: 'Ecuador', position: 'MF', club: 'FC Midtjylland (DEN)' },
  { number: 19, nameOnShirt: 'PLATA', fullName: 'Gonzalo Plata', team: 'Ecuador', position: 'FW', club: 'CR Flamengo (BRA)' },
  { number: 20, nameOnShirt: 'ANGULO', fullName: 'Nilson Angulo', team: 'Ecuador', position: 'FW', club: 'Sunderland AFC (ENG)' },
  { number: 21, nameOnShirt: 'FRANCO', fullName: 'Alan Franco', team: 'Ecuador', position: 'MF', club: 'Atlético Mineiro (BRA)' },
  { number: 22, nameOnShirt: 'VALLE', fullName: 'Gonzalo Valle', team: 'Ecuador', position: 'GK', club: 'LDU Quito (ECU)' },
  { number: 23, nameOnShirt: 'M. CAICEDO', fullName: 'Jordy Caicedo', team: 'Ecuador', position: 'MF', club: 'Chelsea FC (ENG)' },
  { number: 24, nameOnShirt: 'AREVALO', fullName: 'Jeremy Arévalo', team: 'Ecuador', position: 'FW', club: 'VfB Stuttgart (GER)' },
  { number: 25, nameOnShirt: 'POROZO', fullName: 'Jackson Porozo', team: 'Ecuador', position: 'DF', club: 'Club Tijuana (MEX)' },
  { number: 26, nameOnShirt: 'MEDINA', fullName: 'Yaimar Medina', team: 'Ecuador', position: 'DF', club: 'KRC Genk (BEL)' },
  { number: 1, nameOnShirt: 'FERNANDEZ', fullName: 'Gatito Fernández', team: 'Paraguay', position: 'GK', club: 'Cerro Porteño (PAR)' },
  { number: 2, nameOnShirt: 'VELÁZQUEZ', fullName: 'Gustavo Velázquez', team: 'Paraguay', position: 'DF', club: 'Cerro Porteño (PAR)' },
  { number: 3, nameOnShirt: 'ALDERETE', fullName: 'Omar Alderete', team: 'Paraguay', position: 'DF', club: 'Sunderland AFC (ENG)' },
  { number: 4, nameOnShirt: 'CÁCERES', fullName: 'Juan José Cáceres', team: 'Paraguay', position: 'DF', club: 'FC Dynamo Moscow (RUS)' },
  { number: 5, nameOnShirt: 'BALBUENA', fullName: 'Fabián Balbuena', team: 'Paraguay', position: 'DF', club: 'Grêmio FBPA (BRA)' },
  { number: 6, nameOnShirt: 'ALONSO', fullName: 'Júnior Alonso', team: 'Paraguay', position: 'DF', club: 'Atlético Mineiro (BRA)' },
  { number: 7, nameOnShirt: 'SOSA', fullName: 'Ramón Sosa', team: 'Paraguay', position: 'MF', club: 'SE Palmeiras (BRA)' },
  { number: 8, nameOnShirt: 'D. GOMEZ', fullName: 'Diego Gómez', team: 'Paraguay', position: 'MF', club: 'Brighton &amp; Hove Albion FC (ENG)' },
  { number: 9, nameOnShirt: 'SANABRIA', fullName: 'Antonio Sanabria', team: 'Paraguay', position: 'FW', club: 'US Cremonese (ITA)' },
  { number: 10, nameOnShirt: 'M. ALMIRÓN', fullName: 'Miguel Almirón', team: 'Paraguay', position: 'MF', club: 'Atlanta United FC (USA)' },
  { number: 11, nameOnShirt: 'MAURICIO', fullName: 'Maurício', team: 'Paraguay', position: 'MF', club: 'SE Palmeiras (BRA)' },
  { number: 12, nameOnShirt: 'O. GILL', fullName: 'Orlando Gill', team: 'Paraguay', position: 'GK', club: 'CA San Lorenzo (ARG)' },
  { number: 13, nameOnShirt: 'CANALE', fullName: 'José Canale', team: 'Paraguay', position: 'DF', club: 'CA Lanús (ARG)' },
  { number: 14, nameOnShirt: 'CUBAS', fullName: 'Andrés Cubas', team: 'Paraguay', position: 'MF', club: 'Vancouver Whitecaps FC (CAN)' },
  { number: 15, nameOnShirt: 'G. GOMEZ', fullName: 'Diego Gómez', team: 'Paraguay', position: 'DF', club: 'SE Palmeiras (BRA)' },
  { number: 16, nameOnShirt: 'BOBADILLA', fullName: 'Damián Bobadilla', team: 'Paraguay', position: 'MF', club: 'São Paulo FC (BRA)' },
  { number: 17, nameOnShirt: 'R. GAMARRA', fullName: 'R. GAMARRA', team: 'Paraguay', position: 'FW', club: 'Al Ain FC (UAE)' },
  { number: 18, nameOnShirt: 'ARCE', fullName: 'Álex Arce', team: 'Paraguay', position: 'FW', club: 'CS Independiente Rivadavia (ARG)' },
  { number: 19, nameOnShirt: 'ENCISO', fullName: 'Julio Enciso', team: 'Paraguay', position: 'FW', club: 'RC Strasbourg (FRA)' },
  { number: 20, nameOnShirt: 'OJEDA', fullName: 'Braian Ojeda', team: 'Paraguay', position: 'MF', club: 'Orlando City SC (USA)' },
  { number: 21, nameOnShirt: 'AVALOS', fullName: 'Gabriel Ávalos', team: 'Paraguay', position: 'FW', club: 'CA Independiente (ARG)' },
  { number: 22, nameOnShirt: 'OLIVEIRA', fullName: 'OLIVEIRA', team: 'Paraguay', position: 'GK', club: 'Club Olimpia (PAR)' },
  { number: 23, nameOnShirt: 'GALARZA', fullName: 'Matías Galarza', team: 'Paraguay', position: 'MF', club: 'Atlanta United FC (USA)' },
  { number: 24, nameOnShirt: 'CABALLERO', fullName: 'Gustavo Caballero', team: 'Paraguay', position: 'MF', club: 'Portsmouth FC (ENG)' },
  { number: 25, nameOnShirt: 'PITTA', fullName: 'Isidro Pitta', team: 'Paraguay', position: 'FW', club: 'Red Bull Bragantino (BRA)' },
  { number: 26, nameOnShirt: 'MAIDANA', fullName: 'Alexandro Maidana', team: 'Paraguay', position: 'DF', club: 'CA Talleres (ARG)' },
  { number: 1, nameOnShirt: 'S. ROCHET', fullName: 'Sergio Rochet', team: 'Uruguay', position: 'GK', club: 'SC Internacional (BRA)' },
  { number: 2, nameOnShirt: 'J.M. GIMÉNEZ', fullName: 'José María Giménez', team: 'Uruguay', position: 'DF', club: 'Atlético De Madrid (ESP)' },
  { number: 3, nameOnShirt: 'S. CÁCERES', fullName: 'Sebastián Cáceres', team: 'Uruguay', position: 'DF', club: 'Club América (MEX)' },
  { number: 4, nameOnShirt: 'R. ARAUJO', fullName: 'Ronald Araújo', team: 'Uruguay', position: 'DF', club: 'FC Barcelona (ESP)' },
  { number: 5, nameOnShirt: 'M. UGARTE', fullName: 'Manuel Ugarte', team: 'Uruguay', position: 'MF', club: 'Manchester United FC (ENG)' },
  { number: 6, nameOnShirt: 'R. BENTANCUR', fullName: 'Rodrigo Bentancur', team: 'Uruguay', position: 'MF', club: 'Tottenham Hotspur FC (ENG)' },
  { number: 7, nameOnShirt: 'N. DE LA CRUZ', fullName: 'Nicolás de la Cruz', team: 'Uruguay', position: 'MF', club: 'CR Flamengo (BRA)' },
  { number: 8, nameOnShirt: 'F. VALVERDE', fullName: 'Nicolás de la Cruz', team: 'Uruguay', position: 'MF', club: 'Real Madrid C. F. (ESP)' },
  { number: 9, nameOnShirt: 'D. NÚÑEZ', fullName: 'Darwin Núñez', team: 'Uruguay', position: 'FW', club: 'Al Hilal SC (KSA)' },
  { number: 10, nameOnShirt: 'G. DE ARRASCAETA', fullName: 'Giorgian de Arrascaeta', team: 'Uruguay', position: 'MF', club: 'CR Flamengo (BRA)' },
  { number: 11, nameOnShirt: 'F. PELLISTRI', fullName: 'Facundo Pellistri', team: 'Uruguay', position: 'FW', club: 'Panathinaikos FC (GRE)' },
  { number: 12, nameOnShirt: 'S. MELE', fullName: 'Santiago Mele', team: 'Uruguay', position: 'GK', club: 'CF Monterrey (MEX)' },
  { number: 13, nameOnShirt: 'G. VARELA', fullName: 'Nicolás de la Cruz', team: 'Uruguay', position: 'DF', club: 'CR Flamengo (BRA)' },
  { number: 14, nameOnShirt: 'A. CANOBBIO', fullName: 'Agustín Canobbio', team: 'Uruguay', position: 'MF', club: 'Fluminense FC (BRA)' },
  { number: 15, nameOnShirt: 'E. MARTÍNEZ', fullName: 'Emiliano Martínez', team: 'Uruguay', position: 'MF', club: 'SE Palmeiras (BRA)' },
  { number: 16, nameOnShirt: 'M. OLIVERA', fullName: 'Mathías Olivera', team: 'Uruguay', position: 'DF', club: 'SSC Napoli (ITA)' },
  { number: 17, nameOnShirt: 'M. VIÑA', fullName: 'Matías Viña', team: 'Uruguay', position: 'DF', club: 'CA River Plate (ARG)' },
  { number: 18, nameOnShirt: 'B. RODRÍGUEZ', fullName: 'Brian Rodríguez', team: 'Uruguay', position: 'FW', club: 'Club América (MEX)' },
  { number: 19, nameOnShirt: 'R. AGUIRRE', fullName: 'Rodrigo Aguirre', team: 'Uruguay', position: 'FW', club: 'Tigres UANL (MEX)' },
  { number: 20, nameOnShirt: 'M. ARAUJO', fullName: 'Ronald Araújo', team: 'Uruguay', position: 'MF', club: 'Sporting CP (POR)' },
  { number: 21, nameOnShirt: 'F. VIÑAS', fullName: 'Matías Viña', team: 'Uruguay', position: 'FW', club: 'Real Oviedo (ESP)' },
  { number: 22, nameOnShirt: 'J. PIQUEREZ', fullName: 'Joaquín Piquerez', team: 'Uruguay', position: 'MF', club: 'SE Palmeiras (BRA)' },
  { number: 23, nameOnShirt: 'F. MUSLERA', fullName: 'Fernando Muslera', team: 'Uruguay', position: 'GK', club: 'Estudiantes LP (ARG)' },
  { number: 24, nameOnShirt: 'S. BUENO', fullName: 'Santiago Bueno', team: 'Uruguay', position: 'DF', club: 'Wolverhampton Wanderers FC (ENG)' },
  { number: 25, nameOnShirt: 'J.M. SANABRIA', fullName: 'Juan Manuel Sanabria', team: 'Uruguay', position: 'MF', club: 'Real Salt Lake (USA)' },
  { number: 26, nameOnShirt: 'R. ZALAZAR', fullName: 'Nicolás de la Cruz', team: 'Uruguay', position: 'MF', club: 'SC Braga (POR)' },
  { number: 1, nameOnShirt: 'CROCOMBE', fullName: 'Max Crocombe', team: 'New Zealand', position: 'GK', club: 'Millwall FC (ENG)' },
  { number: 2, nameOnShirt: 'PAYNE', fullName: 'Tim Payne', team: 'New Zealand', position: 'DF', club: 'Wellington Phoenix FC (NZL)' },
  { number: 3, nameOnShirt: 'DE VRIES', fullName: 'Francis de Vries', team: 'New Zealand', position: 'DF', club: 'Auckland FC (NZL)' },
  { number: 4, nameOnShirt: 'BINDON', fullName: 'Tyler Bindon', team: 'New Zealand', position: 'DF', club: 'Sheeld United FC (ENG)' },
  { number: 5, nameOnShirt: 'BOXALL', fullName: 'Michael Boxall', team: 'New Zealand', position: 'DF', club: 'Minnesota United FC (USA)' },
  { number: 6, nameOnShirt: 'BELL', fullName: 'Joe Bell', team: 'New Zealand', position: 'MF', club: 'Viking Stavanger (NOR)' },
  { number: 7, nameOnShirt: 'GARBETT', fullName: 'GARBETT', team: 'New Zealand', position: 'MF', club: 'Peterborough United FC (ENG)' },
  { number: 8, nameOnShirt: 'STAMENIC', fullName: 'Marko Stamenić', team: 'New Zealand', position: 'MF', club: 'Swansea City AFC (WAL)' },
  { number: 9, nameOnShirt: 'WOOD', fullName: 'Chris Wood', team: 'New Zealand', position: 'FW', club: 'Nottingham Forest FC (ENG)' },
  { number: 10, nameOnShirt: 'SINGH', fullName: 'Sarpreet Singh', team: 'New Zealand', position: 'MF', club: 'Wellington Phoenix FC (NZL)' },
  { number: 11, nameOnShirt: 'JUST', fullName: 'Elijah Just', team: 'New Zealand', position: 'MF', club: 'Motherwell FC (SCO)' },
  { number: 12, nameOnShirt: 'PAULSEN', fullName: 'Alex Paulsen', team: 'New Zealand', position: 'GK', club: 'Lechia Gda ń sk (POL)' },
  { number: 13, nameOnShirt: 'CACACE', fullName: 'Liberato Cacace', team: 'New Zealand', position: 'DF', club: 'Wrexham AFC (WAL)' },
  { number: 14, nameOnShirt: 'RUFER', fullName: 'Alex Rufer', team: 'New Zealand', position: 'MF', club: 'Wellington Phoenix FC (NZL)' },
  { number: 15, nameOnShirt: 'PIJNAKER', fullName: 'Nando Pijnaker', team: 'New Zealand', position: 'DF', club: 'Auckland FC (NZL)' },
  { number: 16, nameOnShirt: 'SURMAN', fullName: 'Finn Surman', team: 'New Zealand', position: 'DF', club: 'Portland Timbers (USA)' },
  { number: 17, nameOnShirt: 'BARBAROUSES', fullName: 'Kosta Barbarouses', team: 'New Zealand', position: 'FW', club: 'WS Wanderers FC (AUS)' },
  { number: 18, nameOnShirt: 'WAINE', fullName: 'Ben Waine', team: 'New Zealand', position: 'FW', club: 'Port Vale FC (ENG)' },
  { number: 19, nameOnShirt: 'OLD', fullName: 'Ben Old', team: 'New Zealand', position: 'MF', club: 'AS Saint-Etienne (FRA)' },
  { number: 20, nameOnShirt: 'MCCOWATT', fullName: 'Callum McCowatt', team: 'New Zealand', position: 'MF', club: 'Silkeborg IF (DEN)' },
  { number: 21, nameOnShirt: 'RANDALL', fullName: 'Jesse Randall', team: 'New Zealand', position: 'FW', club: 'Auckland FC (NZL)' },
  { number: 22, nameOnShirt: 'WOUD', fullName: 'Michael Woud', team: 'New Zealand', position: 'GK', club: 'Auckland FC (NZL)' },
  { number: 23, nameOnShirt: 'THOMAS', fullName: 'Ryan Thomas', team: 'New Zealand', position: 'MF', club: 'PEC Zwolle (NED)' },
  { number: 24, nameOnShirt: 'ELLIOT', fullName: 'Callan Elliot', team: 'New Zealand', position: 'DF', club: 'Auckland FC (NZL)' },
  { number: 25, nameOnShirt: 'BAYLISS', fullName: 'Lachlan Bayliss', team: 'New Zealand', position: 'MF', club: 'Newcastle United Jets FC (AUS)' },
  { number: 26, nameOnShirt: 'SMITH', fullName: 'Tommy Smith', team: 'New Zealand', position: 'DF', club: 'Braintree Town FC (ENG)' },
  { number: 1, nameOnShirt: 'MPASI', fullName: 'Lionel Mpasi', team: 'Congo DR', position: 'GK', club: 'Le Havre AC (FRA)' },
  { number: 2, nameOnShirt: 'WAN BISSAKA', fullName: 'Aaron Wan-Bissaka', team: 'Congo DR', position: 'DF', club: 'West Ham United FC (ENG)' },
  { number: 3, nameOnShirt: 'KAPUADI', fullName: 'Steve Kapuadi', team: 'Congo DR', position: 'DF', club: 'Widzew Ł ód ź (POL)' },
  { number: 4, nameOnShirt: 'TUANZEBE', fullName: 'Axel Tuanzebe', team: 'Congo DR', position: 'DF', club: 'Burnley FC (ENG)' },
  { number: 5, nameOnShirt: 'BATUBINSIKA', fullName: 'Dylan Batubinsika', team: 'Congo DR', position: 'DF', club: 'AEL FC (GRE)' },
  { number: 6, nameOnShirt: 'MUKAU', fullName: 'Ngal\'ayel Mukau', team: 'Congo DR', position: 'MF', club: 'Lille OSC (FRA)' },
  { number: 7, nameOnShirt: 'MBUKU', fullName: 'Nathanaël Mbuku', team: 'Congo DR', position: 'MF', club: 'Montpellier HSC (FRA)' },
  { number: 8, nameOnShirt: 'MOUTOUSSAMY', fullName: 'Samuel Moutoussamy', team: 'Congo DR', position: 'MF', club: 'Atromitos FC (GRE)' },
  { number: 9, nameOnShirt: 'CIPENGA', fullName: 'Brian Cipenga', team: 'Congo DR', position: 'FW', club: 'CD Castellón (ESP)' },
  { number: 10, nameOnShirt: 'BONGONDA', fullName: 'Théo Bongonda', team: 'Congo DR', position: 'MF', club: 'FC Spartak Moscow (RUS)' },
  { number: 11, nameOnShirt: 'KAKUTA', fullName: 'Gaël Kakuta', team: 'Congo DR', position: 'FW', club: 'AEL FC (GRE)' },
  { number: 12, nameOnShirt: 'J. KAYEMBE', fullName: 'Joris Kayembe', team: 'Congo DR', position: 'DF', club: 'KRC Genk (BEL)' },
  { number: 13, nameOnShirt: 'ELIA', fullName: 'Meschak Elia', team: 'Congo DR', position: 'FW', club: 'Alanyaspor (TUR)' },
  { number: 14, nameOnShirt: 'SADIKI', fullName: 'Noah Sadiki', team: 'Congo DR', position: 'MF', club: 'Sunderland AFC (ENG)' },
  { number: 15, nameOnShirt: 'TSHIBOLA', fullName: 'Aaron Tshibola', team: 'Congo DR', position: 'MF', club: 'Kilmarnock FC (SCO)' },
  { number: 16, nameOnShirt: 'FAYULU', fullName: 'Timothy Fayulu', team: 'Congo DR', position: 'GK', club: 'FC Noah (ARM)' },
  { number: 17, nameOnShirt: 'BAKAMBU', fullName: 'Cédric Bakambu', team: 'Congo DR', position: 'FW', club: 'Real Betis (ESP)' },
  { number: 18, nameOnShirt: 'PICKEL', fullName: 'Charles Pickel', team: 'Congo DR', position: 'MF', club: 'RCD Espanyol (ESP)' },
  { number: 19, nameOnShirt: 'MAYELE', fullName: 'Fiston Mayele', team: 'Congo DR', position: 'FW', club: 'Pyramids FC (EGY)' },
  { number: 20, nameOnShirt: 'WISSA', fullName: 'Yoane Wissa', team: 'Congo DR', position: 'FW', club: 'Newcastle United FC (ENG)' },
  { number: 21, nameOnShirt: 'EPOLO', fullName: 'Matthieu Epolo', team: 'Congo DR', position: 'GK', club: 'Standard Liège (BEL)' },
  { number: 22, nameOnShirt: 'MBEMBA', fullName: 'Chancel Mbemba', team: 'Congo DR', position: 'DF', club: 'Lille OSC (FRA)' },
  { number: 23, nameOnShirt: 'BANZA', fullName: 'Simon Banza', team: 'Congo DR', position: 'FW', club: 'Al Jazira (UAE)' },
  { number: 24, nameOnShirt: 'G. KALULU', fullName: 'Gédéon Kalulu', team: 'Congo DR', position: 'DF', club: 'Aris Limassol FC (CYP)' },
  { number: 25, nameOnShirt: 'KAYEMBE', fullName: 'Joris Kayembe', team: 'Congo DR', position: 'MF', club: 'Watford FC (ENG)' },
  { number: 26, nameOnShirt: 'MASUAKU', fullName: 'Arthur Masuaku', team: 'Congo DR', position: 'DF', club: 'RC Lens (FRA)' },
];

// Fuzzy match function - calculates similarity between two strings
function fuzzyMatch(str1, str2) {
  if (!str1 || !str2) return 0;
  
  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();
  
  // Normalize - remove dots, handle initials like "Y.Ayari" -> "y ayari"
  str1 = str1.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  str2 = str2.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  
  // Exact match
  if (str1 === str2) return 1;
  
  // Check if one contains the other AND length ratio is reasonable (>= 0.5)
  const len1 = str1.length;
  const len2 = str2.length;
  const lengthRatio = Math.min(len1, len2) / Math.max(len1, len2);
  
  if ((str1.includes(str2) || str2.includes(str1)) && lengthRatio >= 0.5) {
    return 0.8 * lengthRatio; // Reduce score for large length differences
  }
  
  // Check if initials match (e.g., "K Havertz" matches "Kai Havertz")
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  // For short inputs like "y ayari", check if last name matches
  if (len1 <= 15) {
    // Short input - must have last name match
    const lastWord1 = words1[words1.length - 1];
    const lastWord2 = words2[words2.length - 1];
    const secondWord1 = words1.length > 1 ? words1[1] : '';
    
    // If last name matches exactly, check first name
    if (lastWord1 === lastWord2) {
      // Check if first name starts with same letter or is initial
      if (words1.length === 2 && words2.length >= 2) {
        const first1 = words1[0][0];
        const first2 = words2[0][0];
        if (first1 === first2) return 0.9;
      }
      return 0.7;
    }
    
    // Partial last name match
    if (lastWord2.includes(lastWord1) || lastWord1.includes(lastWord2)) {
      return 0.5 * lengthRatio;
    }
    
    return 0;
  }
  
  // Check first letter matches
  const firstMatch = words1[0][0] === words2[0][0];
  const lastMatch = words1[words1.length - 1][0] === words2[words2.length - 1][0];
  
  if (firstMatch && lastMatch) return 0.7;
  if (firstMatch || lastMatch) return 0.5;
  
  // Levenshtein distance for short names
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(len1, len2);
  const similarity = 1 - (distance / maxLen);
  
  return Math.max(0, similarity - 0.3); // Penalize non-exact matches
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Find best match from database
function findBestMatch(apiName, team = null, useFullName = false) {
  // First check explicit conversions
  if (officialSquadConversions[apiName]) {
    return officialSquadConversions[apiName];
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  // Filter by team if provided - match against the 'team' attribute in wcPlayerDatabase
  const candidates = team 
    ? wcPlayerDatabase.filter(p => p.team.toLowerCase() === team.toLowerCase())
    : wcPlayerDatabase;
  
  for (const player of candidates) {
    let score = 0;
    let matchTarget = null;
    
    if (useFullName) {
      // Match against fullName in database (primary)
      score = fuzzyMatch(apiName, player.fullName);
      matchTarget = player.fullName;
      
      // Also check against nameOnShirt as fallback
      const shirtScore = fuzzyMatch(apiName, player.nameOnShirt) * 0.95;
      if (shirtScore > score) {
        score = shirtScore;
        matchTarget = player.fullName; // Return fullName even if matched against nameOnShirt
      }
    } else {
      // Legacy mode - match against nameOnShirt
      score = fuzzyMatch(apiName, player.nameOnShirt);
      matchTarget = player.nameOnShirt;
      
      // Also check fullName
      const fullScore = fuzzyMatch(apiName, player.fullName) * 0.9;
      if (fullScore > score) {
        score = fullScore;
        matchTarget = player.fullName;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = matchTarget;
    }
  }
  
  // Only return if confidence is above threshold
  return bestScore > 0.5 ? bestMatch : apiName;
}

// Helper function to find player in database by fullName with fuzzy matching
function findPlayerByFullName(apiName, team = null) {
  // First check explicit conversions
  if (officialSquadConversions[apiName]) {
    const convertedName = officialSquadConversions[apiName];
    // Find the player by converted nameOnShirt
    const candidates = team 
      ? wcPlayerDatabase.filter(p => p.team.toLowerCase() === team.toLowerCase())
      : wcPlayerDatabase;
    return candidates.find(p => p.nameOnShirt.toUpperCase() === convertedName.toUpperCase());
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  // Normalize the API name for better matching
  const normalizeName = (name) => {
    return name
      .toUpperCase()
      .replace(/[.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizedApiName = normalizeName(apiName);
  const apiNameParts = normalizedApiName.split(' ').filter(p => p.length > 0);
  
  // Filter by team if provided
  const candidates = team 
    ? wcPlayerDatabase.filter(p => p.team.toLowerCase() === team.toLowerCase())
    : wcPlayerDatabase;
  
  for (const player of candidates) {
    const normalizedFullName = normalizeName(player.fullName);
    const normalizedShirtName = normalizeName(player.nameOnShirt);
    
    let score = 0;
    let matchPlayer = player;
    
    // Exact match bonus
    if (normalizedApiName === normalizedFullName) {
      score = 1.0;
    }
    // Contains match
    else if (normalizedFullName.includes(normalizedApiName) || normalizedApiName.includes(normalizedFullName)) {
      score = 0.8;
    }
    // Fuzzy match on fullName
    else {
      score = fuzzyMatch(normalizedApiName, normalizedFullName);
    }
    
    // Also check against nameOnShirt
    const shirtScore = fuzzyMatch(normalizedApiName, normalizedShirtName) * 0.9;
    if (shirtScore > score) {
      score = shirtScore;
      matchPlayer = player;
    }
    
    // Bonus for matching initials (e.g., "K. Mbappé" matches "Kylian Mbappé")
    const initials = apiNameParts.map(p => p[0]).join('');
    if (initials.length > 0 && normalizedFullName.startsWith(initials)) {
      score += 0.3;
    }
    
    // Bonus for partial matches on significant parts
    const parts = apiNameParts.filter(p => p.length > 1);
    for (const part of parts) {
      if (normalizedFullName.includes(part)) {
        score += 0.15;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = matchPlayer;
    }
  }
  
  return bestScore > 0.35 ? bestMatch : null;
}

function formatScorer(scorerStr, team = null) {
  if (!scorerStr) return '';
  
  // Clean the scorer string - remove all types of surrounding quotes if present
  let cleanStr = scorerStr.trim();
  // Remove curly quotes (U+201C, U+201D) and straight quotes (U+0022) from start/end
  cleanStr = cleanStr.replace(/^[\u0022\u201C\u201D]+|[\u0022\u201C\u201D]+$/g, '');
  
  // Parse the scorer string - format is like "Name 90'" or "Name 45'+5'(p)" or "Name 90+6'" (extra time)
  // Extract name and minute/penalty info
  const match = cleanStr.match(/^(.+?)\s+(\d+[']?\+?\d*'?(\(OG\))?\s*(\(p\))?)$/);
  let name;
  let minute = '';
  if (match) {
    name = match[1].trim();
    minute = match[2];
  } else {
    name = cleanStr.trim();
  }
  
  // Use the new findPlayerByFullName function for accurate database matching
  const player = findPlayerByFullName(name, team);
  
  let fullName = name;
  let displayName = name;
  let jerseyNumber = null;
  let position = null;
  let club = null;
  
  if (player) {
    // Found a match in the database - use player's data
    displayName = player.nameOnShirt;
    fullName = player.fullName;
    jerseyNumber = player.number;
    position = player.position;
    club = player.club;
  } else {
    // Fallback: capitalize the name
    fullName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  
  const isPenalty = minute.includes('(p)');
  const isOG = minute.includes('(OG)');
  
  return { name: fullName, displayName: displayName, minute, isPenalty, isOG, jerseyNumber, position, club };
}

// Helper function to check if a goal is an own goal by looking up the player in wcPlayerDatabase
// Compare: does this player's fullName match a player from the scoringForTeam?
function isOwnGoalByDatabase(fullName, scoringForTeam) {
  if (!fullName || !scoringForTeam) return false;
  
  // Find the player in wcPlayerDatabase by fullName or nameOnShirt
  const player = wcPlayerDatabase.find(p => 
    p.fullName.toUpperCase() === fullName.toUpperCase() || 
    p.nameOnShirt.toUpperCase() === fullName.toUpperCase()
  );
  
  if (player && player.team !== scoringForTeam) {
    return true; // Player belongs to a different team = own goal
  }
  return false;
}

// Helper function to build scorers HTML for a team
// scorersObjOrArray: either the full scorers object from state.apiScorers, or just the array
// sideOrIsHome: either 'home'/'away' string or boolean isHomeTeam
// teamName: optional - the project team name
function buildScorersHtml(scorersObjOrArray, sideOrIsHome, teamName = null) {
  let scorersArray;
  let isHomeTeam;
  let scorersObj = null;
  
  // Detect if first argument is scorers object or array
  if (Array.isArray(scorersObjOrArray)) {
    scorersArray = scorersObjOrArray;
    isHomeTeam = sideOrIsHome === true || sideOrIsHome === 'home';
  } else if (typeof scorersObjOrArray === 'object' && scorersObjOrArray !== null) {
    // It's a scorers object
    scorersObj = scorersObjOrArray;
    isHomeTeam = sideOrIsHome === true || sideOrIsHome === 'home';
    scorersArray = isHomeTeam ? scorersObj.home : scorersObj.away;
  } else {
    // Legacy format: scorersArray, isHomeTeam, teamName
    scorersArray = arguments[0];
    isHomeTeam = arguments[1] === true || arguments[1] === 'home';
    teamName = arguments[2] || teamName;
  }
  
  if (!scorersArray || scorersArray.length === 0) {
    return '<span class="no-scorers">-</span>';
  }
  
  // Get the database team name if available
  let dbTeamName = teamName;
  if (scorersObj) {
    dbTeamName = isHomeTeam ? scorersObj.homeTeamDbName : scorersObj.awayTeamDbName;
  }
  
  return scorersArray.map(scorerStr => {
    const parsed = formatScorer(scorerStr, dbTeamName);
    const penaltyClass = parsed.isPenalty ? ' scorer-penalty' : '';
    
    // Check if this is an own goal using isOwnGoalByDatabase
    const isOG = parsed.isOG || isOwnGoalByDatabase(parsed.name, dbTeamName);
    const ogClass = isOG ? ' scorer-og' : '';
    
    // Display: Full Name (OG) Minute
    return `<span class="scorer-item${penaltyClass}${ogClass}">${parsed.name}${isOG ? ' (OG)' : ''} <span class="scorer-minute">${parsed.minute}</span></span>`;
  }).join('');
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

// Compute top scorers from all matches
function computeTopScorers() {
  const scorerCounts = {};
  
  // Track which players appeared in which team\'s scorers (for heuristic OG detection)
  const playerTeamAppearances = {};
  
  // Helper function to parse local_date (format: "06/13/2026 21:00")
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return 0;
    // Parse format: MM/DD/YYYY HH:MM
    const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
    if (parts) {
      const [, month, day, year, hour, minute] = parts;
      return new Date(year, month - 1, day, hour, minute).getTime();
    }
    return 0;
  };
  
  // Helper function to check if a player appears in both home and away scorers (heuristic OG detection)
  const isLikelyOwnGoalByHeuristic = (playerName) => {
    const appearances = playerTeamAppearances[playerName];
    if (appearances && appearances.home && appearances.away) {
      return true; // Player appeared in both home AND away scorers across matches
    }
    return false;
  };
  
  // First pass: track player appearances in home/away scorers
  for (const matchNo in state.apiScorers) {
    const matchScorers = state.apiScorers[matchNo];
    
    // Use API team names for database matching (they match the 'team' attribute in wcPlayerDatabase)
    const homeDbTeam = matchScorers.homeTeamDbName || null;  // e.g., "Argentina"
    const awayDbTeam = matchScorers.awayTeamDbName || null;  // e.g., "Brazil"
    
    // Track home scorers - use homeDbTeam for matching against database
    for (const scorerStr of matchScorers.home || []) {
      const parsed = formatScorer(scorerStr, homeDbTeam);
      if (parsed.name) {
        if (!playerTeamAppearances[parsed.name]) {
          playerTeamAppearances[parsed.name] = { home: false, away: false };
        }
        playerTeamAppearances[parsed.name].home = true;
      }
    }
    
    // Track away scorers
    for (const scorerStr of matchScorers.away || []) {
      const parsed = formatScorer(scorerStr, awayDbTeam);
      if (parsed.name) {
        if (!playerTeamAppearances[parsed.name]) {
          playerTeamAppearances[parsed.name] = { home: false, away: false };
        }
        playerTeamAppearances[parsed.name].away = true;
      }
    }
  }
  
  // Second pass: process goals with OG detection
  for (const matchNo in state.apiScorers) {
    const matchScorers = state.apiScorers[matchNo];
    
    // Get match local_date from state.apiMatchTimes (format: "06/13/2026 21:00")
    const localDateStr = state.apiMatchTimes[matchNo];
    const matchTime = parseLocalDate(localDateStr);
    
    // Use API team names for database matching
    const homeDbTeam = matchScorers.homeTeamDbName || null;  // For formatScorer
    const awayDbTeam = matchScorers.awayTeamDbName || null;  // For formatScorer
    
    // Get project team names for display
    const match = findMatchByNo(Number(matchNo));
    const homeProjectTeam = match?.team1 || null;  // For display
    const awayProjectTeam = match?.team2 || null;  // For display
    
    // Process home team scorers
    for (const scorerStr of matchScorers.home || []) {
      const parsed = formatScorer(scorerStr, homeDbTeam);
      const name = parsed.name;
      if (name) {
        // Check if this is an own goal using database lookup
        // The player should belong to homeDbTeam in the database
        const isOG = parsed.isOG || isOwnGoalByDatabase(name, homeDbTeam);
        
        // Credit to the team that benefited (OG goes to opposing team)
        const creditedTeam = isOG ? awayProjectTeam : homeProjectTeam;
        
        // Skip counting this goal if it\'s an OG (we don\'t count OG in top scorers)
        if (isOG) {
          continue;
        }
        
        if (!scorerCounts[name]) {
          scorerCounts[name] = { 
            goals: 0, 
            country: creditedTeam, 
            latestGoalTime: 0,
            jerseyNumber: parsed.jerseyNumber,
            position: parsed.position,
            club: parsed.club
          };
        } else {
          // Update country if this scorer now scores for a different team
          scorerCounts[name].country = creditedTeam;
        }
        scorerCounts[name].goals++;
        // Update latest goal time (most recent goal from this match)
        if (matchTime > scorerCounts[name].latestGoalTime) {
          scorerCounts[name].latestGoalTime = matchTime;
        }
      }
    }
    
    // Process away team scorers
    for (const scorerStr of matchScorers.away || []) {
      const parsed = formatScorer(scorerStr, awayDbTeam);
      const name = parsed.name;
      if (name) {
        // Check if this is an own goal
        const isOG = parsed.isOG || isOwnGoalByDatabase(name, awayDbTeam);
        
        // Credit to the team that benefited
        const actualCreditedTeam = isOG ? homeProjectTeam : awayProjectTeam;
        
        // Skip counting this goal if it\'s an OG (we don\'t count OG in top scorers)
        if (isOG) {
          continue;
        }
        
        if (!scorerCounts[name]) {
          scorerCounts[name] = { 
            goals: 0, 
            country: actualCreditedTeam, 
            latestGoalTime: 0,
            jerseyNumber: parsed.jerseyNumber,
            position: parsed.position,
            club: parsed.club
          };
        } else {
          // Update country if this scorer now scores for a different team
          scorerCounts[name].country = actualCreditedTeam;
        }
        scorerCounts[name].goals++;
        // Update latest goal time (most recent goal from this match)
        if (matchTime > scorerCounts[name].latestGoalTime) {
          scorerCounts[name].latestGoalTime = matchTime;
        }
      }
    }
  }
  
  // Convert to array and sort by goal count (desc), then by latest goal time (desc - most recent first)
  const sortedScorers = Object.entries(scorerCounts)
    .map(([name, data]) => ({ 
      name, 
      goals: data.goals, 
      country: data.country, 
      latestGoalTime: data.latestGoalTime,
      jerseyNumber: data.jerseyNumber,
      position: data.position,
      club: data.club
    }))
    .sort((a, b) => {
      // First sort by goals (descending)
      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }
      // Then by latest goal time (descending - most recent first)
      return b.latestGoalTime - a.latestGoalTime;
    });
  
  return sortedScorers;
}

// Render top scorers table
function renderTopScorers() {
  const container = document.getElementById('top-scorers-table');
  if (!container) return;
  
  const topScorers = computeTopScorers();
  
  if (topScorers.length === 0) {
    container.innerHTML = '<p class="no-scorers-message">No scorer data available yet.</p>';
    return;
  }
  
  const hasMoreThanThree = topScorers.length > 3;
  
  // Build HTML table with collapsible header
  // Start collapsed (rows 4+ hidden), toggle to show all
  let html = `
    <div class="top-scorers-header">
      <h3 class="top-scorers-title">Top Scorers</h3>
      ${hasMoreThanThree ? '<button class="top-scorers-toggle" onclick="toggleTopScorers(this)">Show All (' + topScorers.length + ')</button>' : ''}
    </div>
    <div class="top-scorers-wrapper" data-collapsed="true">
    <table class="top-scorers-table">
      <thead>
        <tr>
          <th class="rank-col">#</th>
          <th class="player-col">Player</th>
          <th class="goals-col">Goals</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  let currentRank = 0;
  
  topScorers.forEach((scorer, index) => {
    // Calculate rank with ties
    // If goals same as previous, show "=", otherwise show sequential rank
    const isTied = index > 0 && scorer.goals === topScorers[index - 1].goals;
    
    if (!isTied) {
      currentRank = index + 1;
    }
    
    const rankDisplay = isTied ? '=' : currentRank;
    const rankClass = currentRank <= 3 ? `rank-${currentRank}` : '';
    
    // Get flag for country
    const flagHtml = scorer.country ? `<span class="team-flag-name">${formatFlag(scorer.country)}</span>` : '';
    
    // Split name into first and last name for styling
    const nameParts = scorer.name.split(' ');
    let firstName = '';
    let lastName = '';
    if (nameParts.length >= 2) {
      firstName = nameParts.slice(0, -1).join(' ');
      lastName = nameParts[nameParts.length - 1];
    } else {
      firstName = '';
      lastName = scorer.name;
    }
    
    // Get portrait for top 3 positions (index 0, 1, 2 = positions 1, 2, 3)
    let portraitHtml = '';
    if (index < 3) {
      // Get initials for fallback
      const initials = nameParts.length >= 2 
        ? nameParts[0][0] + nameParts[nameParts.length - 1][0] 
        : scorer.name.substring(0, 2);
      
      const portraitUrl = getPlayerPortrait(scorer.name);
      if (portraitUrl) {
        // Add error handler to show initials if image fails
        portraitHtml = `<img class="scorer-portrait" src="${portraitUrl}" alt="${scorer.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" /><span class="scorer-portrait-placeholder" style="display:none;">${initials.toUpperCase()}</span>`;
      } else {
        // No URL yet, show initials but mark for async update
        portraitHtml = `<img class="scorer-portrait" data-player="${scorer.name}" data-initials="${initials}" src="" style="display:none;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" /><span class="scorer-portrait-placeholder">${initials.toUpperCase()}</span>`;
      }
    }
    
    // Hide rows 4+ when collapsed
    const rowHidden = hasMoreThanThree && index >= 3;
    
    // Format: Flag #number POS Full Name
    let playerDisplay = scorer.name;
    if (scorer.jerseyNumber) {
      playerDisplay = `${flagHtml} #${scorer.jerseyNumber} ${scorer.position} ${scorer.name}`;
    } else {
      playerDisplay = `${flagHtml} ${scorer.name}`;
    }
    
    html += `
      <tr class="${rankClass}" ${rowHidden ? 'style="display: none;"' : ''}>
        <td class="rank-col">${rankDisplay}</td>
        <td class="player-col">${portraitHtml}${playerDisplay}</td>
        <td class="goals-col"><span class="goals-badge">${scorer.goals}</span></td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Async: Update portraits from TheSportsDB API
  updatePortraitsFromAPI();
}

// Toggle function for collapse/expand
function toggleTopScorers(button) {
  const container = button.closest('#top-scorers-table');
  const wrapper = container.querySelector('.top-scorers-wrapper');
  const allRows = wrapper.querySelectorAll('tbody tr');
  const isCollapsed = wrapper.dataset.collapsed === 'true';
  const totalCount = allRows.length;
  
  if (isCollapsed) {
    // Expand - show all rows
    wrapper.dataset.collapsed = 'false';
    allRows.forEach(row => row.style.display = '');
    button.textContent = 'Show Less';
  } else {
    // Collapse - hide rows after top 3
    wrapper.dataset.collapsed = 'true';
    allRows.forEach((row, index) => {
      row.style.display = index < 3 ? '' : 'none';
    });
    button.textContent = 'Show All (' + totalCount + ')';
  }
}

// Function to update portraits from TheSportsDB API after render
async function updatePortraitsFromAPI() {
  const portraitImages = document.querySelectorAll('.scorer-portrait[data-player]');
  
  for (const img of portraitImages) {
    const playerName = img.dataset.player;
    const placeholder = img.nextElementSibling;
    
    const portraitUrl = await getPlayerPortraitAsync(playerName);
    
    if (portraitUrl) {
      // Create a new image to preload
      const tempImg = new Image();
      tempImg.onload = function() {
        // Image loaded successfully, update the DOM
        img.src = portraitUrl;
        img.style.display = 'inline-block';
        if (placeholder && placeholder.classList.contains('scorer-portrait-placeholder')) {
          placeholder.style.display = 'none';
        }
      };
      tempImg.src = portraitUrl;
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

  // A team is tentatively qualified if it\'s in the top 8.
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

function resolveTeamPosition(position, rankings, thirdPlaceTeams, knockoutMap, requireComplete = false, matchNo = null, assignments = {}, allGroupsComplete = false) {
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
    // For 3rd place positions, only resolve to actual team when ALL groups are complete
    if (allGroupsComplete && matchNo && assignments[matchNo]) {
      const assignedTeam = assignments[matchNo];
      return { name: assignedTeam.team, note: `3rd ${assignedTeam.group}` };
    }
    // Show numbered "Best 3rd place" labels until all groups complete
    const slotMatchNos = [74, 77, 79, 80, 81, 82, 85, 87];
    const slotIndex = slotMatchNos.indexOf(matchNo);
    const label = slotIndex >= 0 ? `Best 3rd place ${'#'}${slotIndex + 1}` : 'Best 3rd place #';
    const waitLabel = allGroupsComplete ? '' : ' (Waiting all groups)';
    return { name: 'TBD', note: label + waitLabel };
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

function computeKnockoutResults(rankings, thirdPlaceTeams, assignments, allGroupsComplete = false) {
  const map = {};
  scheduleData.knockoutMatches.forEach((match) => {
    const score1 = parseScore(state.scores[match.matchNo]?.score1 || '');
    const score2 = parseScore(state.scores[match.matchNo]?.score2 || '');
    if (score1 === null || score2 === null) return;
    let name1 = match.team1;
    let name2 = match.team2;

    if (!name1) {
      const resolved = resolveTeamPosition(match.pos1, rankings, thirdPlaceTeams, map, false, match.matchNo, assignments, allGroupsComplete);
      name1 = resolved.name;
    }
    if (!name2) {
      const resolved = resolveTeamPosition(match.pos2, rankings, thirdPlaceTeams, map, false, match.matchNo, assignments, allGroupsComplete);
      name2 = resolved.name;
    }

    if (!name1 || !name2 || name1 === 'TBD' || name2 === 'TBD') return;

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
    .filter((match) => match.pos1 && (match.pos1[0] === group || match.pos2[0] === group))
    .sort((a, b) => a.matchNo - b.matchNo)
    .map((match) => {
      const { dateLabel, timeLabel, tzAbbr } = getMatchDateTimeLabel(match.matchNo, match.venue, match.date, match.time);
      const timeDisplay = tzAbbr ? `${timeLabel} ${tzAbbr}` : timeLabel;
      const score1Val = state.scores[match.matchNo]?.score1 ?? '';
      const score2Val = state.scores[match.matchNo]?.score2 ?? '';
      const isApiSourced = isApiSourcedMatch(match.matchNo);
      const isLive = isLiveMatch(match.matchNo);
      const isFinished = isFinishedMatch(match.matchNo);
      
      // Disable inputs for API-sourced, live, or finished matches
      const disabledAttr = (isApiSourced || isLive || isFinished) ? 'disabled' : '';
      
      // Show LIVE badge for live matches, Full-time for finished matches
      let statusBadge = '';
      if (isLive) {
        statusBadge = '<span class="api-badge-small live-badge"><span class="live-dot"></span>LIVE</span>';
      } else if (isApiSourced || isFinished) {
        statusBadge = '<span class="api-badge-small">Full-time</span>';
      }

      // Get scorer data for this match
      const showScorers = hasScorerData(match.matchNo);
      let scorersHtml = '';
      if (showScorers) {
        const scorers = getMatchScorers(match.matchNo);
        const homeScorersHtml = buildScorersHtml(scorers, 'home', match.team1);
        const awayScorersHtml = buildScorersHtml(scorers, 'away', match.team2);
        const totalScorers = scorers.home.length + scorers.away.length;
        scorersHtml = `
          <div class="scorers-row collapsed" data-match="${match.matchNo}">
            <div class="scorers-toggle">
              <span class="material-symbols-outlined scorers-icon">expand_more</span>
              <span class="scorers-indicator">${totalScorers} goal${totalScorers !== 1 ? 's' : ''}</span>
            </div>
            <div class="scorers-content">
              <div class="scorers-home">${homeScorersHtml}</div>
              <div class="scorers-divider"></div>
              <div class="scorers-away">${awayScorersHtml}</div>
            </div>
          </div>
        `;
      }

      
      return `
      <div class="match-card match-compact clickable" data-matchno="${match.matchNo}">
        <div class="match-top">
          <div class="team-left">
            <div class="team-flag-name">${formatFlag(match.team1)}<div class="team-name">${getTeamInitials(match.team1)}</div></div>
          </div>
          <div class="score-left">
            <input class="score-input" type="number" min="0" value="${score1Val}" data-match="${match.matchNo}" data-side="score1" ${disabledAttr} />
          </div>
          <div class="vs">vs</div>
          <div class="score-right">
            <input class="score-input" type="number" min="0" value="${score2Val}" data-match="${match.matchNo}" data-side="score2" ${disabledAttr} />
          </div>
          <div class="team-right">
            <div class="team-flag-name">${formatFlag(match.team2)}<div class="team-name">${getTeamInitials(match.team2)}</div></div>
          </div>
        </div>
        ${scorersHtml}
        <div class="match-mid">
          ${dateLabel} · ${timeDisplay} ${statusBadge}
        </div>
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

  const teamA = match.team1 ? { name: match.team1 } : resolveTeamPosition(match.pos1 || '', currentRankings, currentThirdPlacers, {}, false, match.matchNo, currentAssignments, currentAllGroupsComplete);
  const teamB = match.team2 ? { name: match.team2 } : resolveTeamPosition(match.pos2 || '', currentRankings, currentThirdPlacers, {}, false, match.matchNo, currentAssignments, currentAllGroupsComplete);

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

function buildMatchCardHtml(match, stage, rankings, thirdPlaceTeams, knockoutMap, assignments, allGroupsComplete) {
  const isR32 = stage === 'r32';
  const teamA = match.team1 ? { name: match.team1, note: '' } : resolveTeamPosition(match.pos1, rankings, thirdPlaceTeams, knockoutMap, isR32, match.matchNo, assignments, allGroupsComplete);
  const teamB = match.team2 ? { name: match.team2, note: '' } : resolveTeamPosition(match.pos2, rankings, thirdPlaceTeams, knockoutMap, isR32, match.matchNo, assignments, allGroupsComplete);
  const scoreA = state.scores[match.matchNo]?.score1 ?? '';
  const scoreB = state.scores[match.matchNo]?.score2 ?? '';
  const isTBDA = teamA.name === 'TBD' || teamA.note === 'TBD' || teamA.note.includes('Waiting');
  const isTBDB = teamB.name === 'TBD' || teamB.note === 'TBD' || teamB.note.includes('Waiting');
  const isApiSourced = isApiSourcedMatch(match.matchNo);
  const disabledAttr = isTBDA || isTBDB || isApiSourced ? 'disabled' : '';
  const apiBadge = isApiSourced ? '<span class="api-badge-bracket">Live</span>' : '';
  const { dateLabel, timeLabel, tzAbbr } = getMatchDateTimeLabel(match.matchNo, match.venue, match.date, match.time);
  const timeDisplay = tzAbbr ? `${timeLabel} ${tzAbbr}` : timeLabel;
  
  // Get scorer data for this match
  const showScorers = hasScorerData(match.matchNo);
  let scorersHtml = '';
  if (showScorers) {
    const scorers = getMatchScorers(match.matchNo);
    const homeScorersHtml = buildScorersHtml(scorers, 'home', teamA.name);
    const awayScorersHtml = buildScorersHtml(scorers, 'away', teamB.name);
    const totalScorers = scorers.home.length + scorers.away.length;
    scorersHtml = `
      <div class="scorers-row bracket-scorers collapsed" data-match="${match.matchNo}">
        <div class="scorers-toggle">
          <span class="material-symbols-outlined scorers-icon">expand_more</span>
          <span class="scorers-indicator">${totalScorers} goal${totalScorers !== 1 ? 's' : ''}</span>
        </div>
        <div class="scorers-content">
          <div class="scorers-home">${homeScorersHtml}</div>
          <div class="scorers-divider"></div>
          <div class="scorers-away">${awayScorersHtml}</div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="bracket-match-node" data-matchno="${match.matchNo}" data-stage="${stage}">
      <div class="bracket-match-inner">
        <div class="bracket-team ${isTBDA ? 'placeholder' : ''}">
          <div class="bracket-team-info">
            ${isTBDA ? '<span class="team-flag">🏳️</span>' : formatFlag(teamA.name)}
            <span class="bracket-team-name">
              ${isTBDA ? (teamA.name === 'TBD' ? (teamA.note || match.pos1) : teamA.name) : getTeamInitials(teamA.name)}
            </span>
          </div>
          <input class="score-input bracket-score" type="number" min="0" value="${scoreA}" data-match="${match.matchNo}" data-side="score1" ${disabledAttr} />
        </div>
        <div class="bracket-team ${isTBDB ? 'placeholder' : ''}">
          <div class="bracket-team-info">
            ${isTBDB ? '<span class="team-flag">🏳️</span>' : formatFlag(teamB.name)}
            <span class="bracket-team-name">
              ${isTBDB ? (teamB.name === 'TBD' ? (teamB.note || match.pos2) : teamB.name) : getTeamInitials(teamB.name)}
            </span>
          </div>
          <input class="score-input bracket-score" type="number" min="0" value="${scoreB}" data-match="${match.matchNo}" data-side="score2" ${disabledAttr} />
        </div>
      </div>
      ${scorersHtml}
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

function buildStageHtml(stage, matches, rankings, thirdPlaceTeams, knockoutMap, assignments, allGroupsComplete) {
  const matchCards = matches.map(m => buildMatchCardHtml(m, stage, rankings, thirdPlaceTeams, knockoutMap, assignments, allGroupsComplete));

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

function renderBracket(rankings, thirdPlaceTeams, assignments, allGroupsComplete) {
  const grouped = scheduleData.knockoutMatches.reduce((acc, match) => {
    acc[match.stage] = acc[match.stage] || [];
    acc[match.stage].push(match);
    return acc;
  }, {});

  const stageOrder = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];
  let html = '';
  const resultMap = computeKnockoutResults(rankings, thirdPlaceTeams, assignments, allGroupsComplete);

  stageOrder.forEach((stage) => {
    if (!grouped[stage]?.length) return;
    html += buildStageHtml(stage, grouped[stage].sort((a, b) => a.matchNo - b.matchNo), rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
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
let currentAllGroupsComplete = false;

// Get matches for today
function getTodaysMatches() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const allMatches = [...scheduleData.groupMatches, ...scheduleData.knockoutMatches];
  
  return allMatches.filter(match => {
    const matchDate = new Date(match.date);
    const matchDateStr = matchDate.toISOString().split('T')[0];
    return matchDateStr === todayStr;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Check if a match has been played (has scores entered)
function isMatchPlayed(matchNo) {
  const score = state.scores[matchNo];
  return score && (score.score1 !== '' && score.score2 !== '');
}

// Get group letter from position (e.g., "A1" -> "A")
function getGroupFromPos(pos) {
  if (!pos) return '';
  return pos.charAt(0);
}

// Build today\'s match card HTML
function buildTodaysMatchCard(match) {
  const score1Val = state.scores[match.matchNo]?.score1 ?? '';
  const score2Val = state.scores[match.matchNo]?.score2 ?? '';
  const isPlayed = isMatchPlayed(match.matchNo);
  const isApiSourced = isApiSourcedMatch(match.matchNo);
  const isLive = isLiveMatch(match.matchNo);
  const isFinished = isFinishedMatch(match.matchNo);
  
  // Get group info if it\'s a group match
  const group = getGroupFromPos(match.pos1) || getGroupFromPos(match.pos2);
  const groupBadge = group ? `<span class="todays-group-badge group-${group}">Group ${group}</span>` : '';
  
  // Get date/time
  const { dateLabel, timeLabel, tzAbbr } = getMatchDateTimeLabel(match.matchNo, match.venue, match.date, match.time);
  const timeDisplay = tzAbbr ? `${timeLabel} ${tzAbbr}` : timeLabel;
  
  // Status badge: Live badge (red with dot) takes priority over Full-time badge
  let statusBadge = '';
  if (isLive) {
    statusBadge = '<span class="todays-status-badge live"><span class="live-dot"></span>LIVE</span>';
  } else if (isFinished) {
    statusBadge = '<span class="todays-status-badge full-time">Full-time</span>';
  }
  
  // Stadium info
  const venueDisplay = getVenueDisplayName(match.venue) || '';
  
  // Show scores if match is played, live, or finished
  const showScores = isPlayed || isLive || isFinished;
  
  // Highlight class based on match status
  let statusClass = '';
  if (isLive) {
    statusClass = 'todays-match-live';
  } else if (isFinished) {
    statusClass = 'todays-match-finished';
  } else if (!showScores) {
    statusClass = 'todays-match-upcoming';
  }
  
  // Get scorer data for this match
  const showScorers = hasScorerData(match.matchNo);
  let scorersHtml = '';
  if (showScorers) {
    const scorers = getMatchScorers(match.matchNo);
    const homeScorersHtml = buildScorersHtml(scorers, 'home', match.team1);
    const awayScorersHtml = buildScorersHtml(scorers, 'away', match.team2);
    const totalScorers = scorers.home.length + scorers.away.length;
    scorersHtml = `
      <div class="scorers-row todays-scorers collapsed" data-match="${match.matchNo}">
        <div class="scorers-toggle">
          <span class="material-symbols-outlined scorers-icon">expand_more</span>
          <span class="scorers-indicator">${totalScorers} goal${totalScorers !== 1 ? 's' : ''}</span>
        </div>
        <div class="scorers-content">
          <div class="scorers-home">${homeScorersHtml}</div>
          <div class="scorers-divider"></div>
          <div class="scorers-away">${awayScorersHtml}</div>
        </div>
      </div>
    `;
  }
  
  // Build today\'s match card content
  const matchContent = `
    <div class="todays-match-header">
      ${groupBadge}
    </div>
    <div class="match-top">
      <div class="team-left">
        <div class="team-flag-name">${formatFlag(match.team1)}<div class="team-name">${getTeamInitials(match.team1)}</div></div>
      </div>
      <div class="score-left">
        ${showScores ? `<span class="todays-score-display">${score1Val}</span>` : ''}
      </div>
      <div class="vs">${showScores ? '-' : 'vs'}</div>
      <div class="score-right">
        ${showScores ? `<span class="todays-score-display">${score2Val}</span>` : ''}
      </div>
      <div class="team-right">
        <div class="team-flag-name">${formatFlag(match.team2)}<div class="team-name">${getTeamInitials(match.team2)}</div></div>
      </div>
    </div>
    ${scorersHtml}
    <div class="match-mid">
      ${dateLabel} · ${timeDisplay} ${statusBadge}
    </div>
    <div class="match-bottom">
      <div class="stadium-name">${venueDisplay}</div>
    </div>
  `;
  
  return `<div class="match-card match-compact ${statusClass}" data-matchno="${match.matchNo}">${matchContent}</div>`;
}

// Render today\'s matches section
function renderTodaysMatches() {
  if (!todaysMatchesElement) return;
  
  const todaysMatches = getTodaysMatches();
  
  if (todaysMatches.length === 0) {
    todaysMatchesElement.innerHTML = '';
    todaysMatchesElement.style.display = 'none';
    return;
  }
  
  todaysMatchesElement.style.display = 'block';
  
  const matchCardsHtml = todaysMatches.map(match => buildTodaysMatchCard(match)).join('');
  
  todaysMatchesElement.innerHTML = `
    <div class="todays-matches-grid">
      ${matchCardsHtml}
    </div>
  `;
  
  // Add click handlers to match cards
  todaysMatchesElement.querySelectorAll('.todays-match-card').forEach(card => {
    card.addEventListener('click', () => {
      const matchNo = card.dataset.matchno;
      scrollToMatch(matchNo);
    });
  });
}

// Scroll to a specific match
function scrollToMatch(matchNo) {
  const matchElement = document.querySelector(`[data-matchno="${matchNo}"]`);
  if (matchElement) {
    matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    matchElement.classList.add('match-highlight');
    setTimeout(() => matchElement.classList.remove('match-highlight'), 2000);
  }
}

function render() {
  const { rankings, thirdPlaceTeams, thirdPlaceAssignments, allGroupsComplete } = computeGroupStandings();
  currentRankings = rankings;
  currentThirdPlacers = thirdPlaceTeams;
  currentAssignments = thirdPlaceAssignments;
  currentAllGroupsComplete = allGroupsComplete;
  renderTodaysMatches();
  renderGroups(rankings, thirdPlaceTeams);
  renderBracket(rankings, thirdPlaceTeams, thirdPlaceAssignments, allGroupsComplete);
  renderTopScorers();
}

// Initialize Live API features
document.addEventListener('DOMContentLoaded', () => {
  initLiveApi();
  startAutoRefresh();
  // Initial fetch on page load
  fetchLiveScores();
  
  // Event delegation for scorers toggle
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.scorers-toggle');
    if (toggle) {
      const scorersRow = toggle.closest('.scorers-row');
      scorersRow.classList.toggle('collapsed');
    }
  });
});

render();
