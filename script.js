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
  // Fallback to original schedule data (stored in local venue time)
  if (fallbackDate) {
    // Parse the schedule date/time which is stored as local venue time
    // The date string format is "2026-06-14T05:00:00" (local time at venue) or "2026-06-14" (date only)
    const dateStr = fallbackDate.endsWith('Z') ? fallbackDate.slice(0, -1) : fallbackDate;
    
    // Get venue timezone for parsing the schedule data
    const venueTimezone = venueTimezones[venue] || 'America/New_York';
    
    // Get user's browser timezone for display
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
    
    // Get user's timezone abbreviation
    const userTzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      timeZoneName: 'short'
    });
    const userTzParts = userTzFormatter.formatToParts(correctUTC);
    const userTzAbbr = userTzParts.find(p => p.type === 'timeZoneName')?.value || '';
    
    // Format for display - convert UTC to user's browser timezone
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
                // Don't forget the last element
                if (current.trim()) {
                  const clean = current.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                  matches.push(clean);
                }
                return matches;
              }
            };
            
            const homeScorersRaw = parseScorers(game.home_scorers);
            const awayScorersRaw = parseScorers(game.away_scorers);
            
            state.apiScorers[targetMatch.matchNo] = {
              home: homeScorersRaw,
              away: awayScorersRaw
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

// Helper function to format a single scorer string for display
// Comprehensive player name conversion map (API names to full display names)
const scorerNameConversions = {
  // Norway
  'Arling Halnd': 'Erling Haaland',
  'Liv Avstigard': 'Oscar Bobb',
  
  // Argentina
  'Livnl Msi': 'Lionel Messi',
  
  // France
  'K. Mbappé': 'Kylian Mbappé',
  'B. Barcola': 'Bradley Barcola',
  
  // Germany
  'K. Havertz': 'Kai Havertz',
  'J. Musiala': 'Jamal Musiala',
  'N. Schlotterbeck': 'Nico Schlotterbeck',
  'N. Brown': 'Nathaniel Brown',
  'Felix Nmecha': 'Felix Nmecha',
  'D. Undav': 'Deniz Undav',
  
  // USA
  'F. Balogun': 'Folarin Balogun',
  'G. Reyna': 'Gio Reyna',
  'D. Bobadilla': 'Diego Bobadilla',
  
  // Sweden
  'Y.Ayari': 'Yasin Ayari',
  'A. Isak': 'Alexander Isak',
  'V. Gyökeres': 'Viktor Gyökeres',
  'M. Svanberg': 'Mattias Svanberg',
  
  // Mexico
  'J. Quiñones': 'Jorge Quiñones',
  'R. Jiménez': 'Raúl Jiménez',
  
  // Rep. of Korea
  'I.B. Hwang': 'Hwang In-beom',
  'H.G. Oh': 'Oh Se-hun',
  
  // Other players
  'L. Krejčí': 'Ladislav Krejčí',
  'C. Larin': 'Cyle Larin',
  'Maurício': 'Maurício',
  'B. Khoukhi': 'Bouthayna Khoukhi',
  'Breel Embolo': 'Breel Embolo',
  'V. Júnior': 'Vinícius Júnior',
  'I. Saibari': 'Ismail Azzaoui',
  'J. McGinn': 'John McGinn',
  'Nestory Irankunda': 'Nestory Irankunda',
  'C. Metcalfe': 'Connor Metcalfe',
  'Virgil van Dijk': 'Virgil van Dijk',
  'C. Summerville': 'Cryensco Summerville',
  'K. Nakamura': 'Kaoru Nakamura',
  'K. Ogawa': 'Koki Ogawa',
  'A. Diallo': 'Abdoulaye Diallo',
  'O. Rekik': 'Omar Rekik',
  'Mohamed Hany': 'Mohamed Hany',
  'Emam Ashour': 'Emam Ashour',
  'Ramin Rezaiian': 'Ramin Rezaeian',
  'Mohammad Mohebi': 'Mohammad Mohebi',
  'Elijah Just': 'Elijah Just',
  'Abdulelah Al-Amri': 'Abdulelah Al-Amri',
  'Maximiliano Araújo': 'Maximiliano Araújo',
  'I. Mbaye': 'Ibrahim Mbaye',
  'Aimn Hsin': 'Aliasghbar Regife',
  'Rvmanv Ashmid': 'Roman Aschmidt',
  'Jovo Lukić': 'Jovan Lukić'
};

// Player database: maps canonical player names to their national team
// Used to detect own goals (if a player scores for a team they don't belong to, it's an OG)
const playerTeamDatabase = {
  // Norway
  'Erling Haaland': 'Norway',
  'Martin Ødegaard': 'Norway',
  'Oscar Bobb': 'Norway',
  
  // Argentina
  'Lionel Messi': 'Argentina',
  'Julián Álvarez': 'Argentina',
  
  // France
  'Kylian Mbappé': 'France',
  'Bradley Barcola': 'France',
  'Antoine Griezmann': 'France',
  'Ousmane Dembélé': 'France',
  
  // Germany
  'Kai Havertz': 'Germany',
  'Jamal Musiala': 'Germany',
  'Florian Wirtz': 'Germany',
  'Leroy Sané': 'Germany',
  'Deniz Undav': 'Germany',
  'Felix Nmecha': 'Germany',
  'Nathaniel Brown': 'Germany',
  'Nico Schlotterbeck': 'Germany',
  
  // USA
  'Folarin Balogun': 'USA',
  'Christian Pulisic': 'USA',
  'Gio Reyna': 'USA',
  'Tyler Adams': 'USA',
  'Diego Bobadilla': 'USA',
  
  // Sweden
  'Yasin Ayari': 'Sweden',
  'Alexander Isak': 'Sweden',
  'Viktor Gyökeres': 'Sweden',
  'Dejan Kulusevski': 'Sweden',
  'Anthony Elanga': 'Sweden',
  'Mattias Svanberg': 'Sweden',
  
  // Mexico
  'Jorge Quiñones': 'Mexico',
  'Raúl Jiménez': 'Mexico',
  'Hirving Lozano': 'Mexico',
  
  // Brazil
  'Vinícius Júnior': 'Brazil',
  'Rodri': 'Brazil',
  'Raphinha': 'Brazil',
  'Neymar': 'Brazil',
  'Richarlison': 'Brazil',
  
  // England
  'Harry Kane': 'England',
  'Bukayo Saka': 'England',
  'Phil Foden': 'England',
  'Jude Bellingham': 'England',
  
  // Portugal
  'Cristiano Ronaldo': 'Portugal',
  'Bruno Fernandes': 'Portugal',
  'Bernardo Silva': 'Portugal',
  
  // Spain
  'Lamine Yamal': 'Spain',
  'Pedri': 'Spain',
  
  // Netherlands
  'Virgil van Dijk': 'Netherlands',
  'Cody Gakpo': 'Netherlands',
  'Xavi Simons': 'Netherlands',
  'Dani Olmo': 'Netherlands',
  
  // Belgium
  'Kevin De Bruyne': 'Belgium',
  'Romelu Lukaku': 'Belgium',
  'Jeremy Doku': 'Belgium',
  
  // Italy
  'Gianluigi Donnarumma': 'Italy',
  
  // Rep. of Korea
  'Hwang In-beom': 'South Korea',
  'Oh Se-hun': 'South Korea',
  'Son Heung-min': 'South Korea',
  'Kim Min-jae': 'South Korea',
  
  // Japan
  'Kaoru Nakamura': 'Japan',
  'Koki Ogawa': 'Japan',
  'Takefusa Kubo': 'Japan',
  
  // Morocco
  'Hakim Ziyech': 'Morocco',
  'Achraf Hakimi': 'Morocco',
  'Youssef En-Nesyri': 'Morocco',
  'Ismail Azzaoui': 'Morocco',
  
  // Senegal
  'Sadio Mané': 'Senegal',
  'Ismaila Sarr': 'Senegal',
  'Boulaye Dia': 'Senegal',
  'Ibrahim Mbaye': 'Senegal',
  
  // Qatar
  'Bouthayna Khoukhi': 'Qatar',
  
  // Switzerland
  'Breel Embolo': 'Switzerland',
  'Granit Xhaka': 'Switzerland',
  'Xherdan Shaqiri': 'Switzerland',
  
  // Croatia
  'Luka Modrić': 'Croatia',
  'Andrej Kramarić': 'Croatia',
  
  // Scotland
  'John McGinn': 'Scotland',
  'Andy Robertson': 'Scotland',
  
  // Australia
  'Nestory Irankunda': 'Australia',
  'Connor Metcalfe': 'Australia',
  
  // Egypt
  'Mohamed Salah': 'Egypt',
  'Omar Marmoush': 'Egypt',
  
  // Ghana
  'Mohammed Kudus': 'Ghana',
  'Inaki Williams': 'Ghana',
  
  // Poland
  'Robert Lewandowski': 'Poland',
  
  // Denmark
  'Rasmus Højlund': 'Denmark',
  'Pierre-Emile Højbjerg': 'Denmark',
  
  // Colombia
  'Luis Díaz': 'Colombia',
  'James Rodríguez': 'Colombia',
  
  // Uruguay
  'Darwin Núñez': 'Uruguay',
  'Federico Valverde': 'Uruguay',
  'Maximiliano Araújo': 'Uruguay',
  
  // Ukraine
  'Mykhailo Mudryk': 'Ukraine',
  'Oleksandr Zinchenko': 'Ukraine',
  
  // Serbia
  'Dušan Vlahović': 'Serbia',
  'Aleksandar Mitrović': 'Serbia',
  
  // Turkey
  'Arda Guler': 'Turkey',
  'Hakan Çalhanoğlu': 'Turkey',
  
  // Czech Republic
  'Ladislav Krejčí': 'Czech Republic',
  'Patrik Schick': 'Czech Republic',
  
  // Canada
  'Alphonso Davies': 'Canada',
  'Cyle Larin': 'Canada',
  'Jonathan David': 'Canada',
  
  // New Zealand
  'Elijah Just': 'New Zealand',
  'Chris Wood': 'New Zealand',
  
  // Ivory Coast
  'Maurício': 'Ivory Coast',
  
  // Iraq
  'Aymen Hussein': 'Iraq',
  'Aliasghbar Regife': 'Iraq',
  
  // Iran
  'Roman Aschmidt': 'Iran',
  
  // Serbia
  'Jovan Lukić': 'Serbia',
  
  // Other
  'Abdoulaye Diallo': 'Senegal',
  'Omar Rekik': 'Tunisia',
  'Mohamed Hany': 'Egypt',
  'Emam Ashour': 'Egypt',
  'Ramin Rezaeian': 'Iran',
  'Mohammad Mohebi': 'Iran',
  'Abdulelah Al-Amri': 'Saudi Arabia',
  'Cryensco Summerville': 'Netherlands',
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

// Comprehensive World Cup players database for fuzzy matching
const wcPlayerDatabase = [
  // Argentina
  { fullName: 'Lionel Messi', nickname: 'Messi', team: 'Argentina' },
  { fullName: 'Julian Alvarez', nickname: 'J. Alvarez', team: 'Argentina' },
  { fullName: 'Angel Di Maria', nickname: 'Di Maria', team: 'Argentina' },
  { fullName: 'Enzo Fernandez', nickname: 'E. Fernandez', team: 'Argentina' },
  
  // France
  { fullName: 'Kylian Mbappe', nickname: 'K. Mbappe', team: 'France' },
  { fullName: 'Bradley Barcola', nickname: 'B. Barcola', team: 'France' },
  { fullName: 'Ousmane Dembele', nickname: 'O. Dembele', team: 'France' },
  { fullName: 'Antoine Griezmann', nickname: 'Griezmann', team: 'France' },
  
  // Germany
  { fullName: 'Kai Havertz', nickname: 'K. Havertz', team: 'Germany' },
  { fullName: 'Jamal Musiala', nickname: 'J. Musiala', team: 'Germany' },
  { fullName: 'Florian Wirtz', nickname: 'F. Wirtz', team: 'Germany' },
  { fullName: 'Leroy Sane', nickname: 'L. Sane', team: 'Germany' },
  { fullName: 'Niklas Fullkrug', nickname: 'N. Fullkrug', team: 'Germany' },
  { fullName: 'Deniz Undav', nickname: 'D. Undav', team: 'Germany' },
  { fullName: 'Nathaniel Brown', nickname: 'N. Brown', team: 'Germany' },
  { fullName: 'Nico Schlotterbeck', nickname: 'N. Schlotterbeck', team: 'Germany' },
  { fullName: 'Felix Nmecha', nickname: 'Nmecha', team: 'Germany' },
  
  // Brazil
  { fullName: 'Vinicius Junior', nickname: 'V. Junior', team: 'Brazil' },
  { fullName: 'Rodri', nickname: 'Rodri', team: 'Brazil' },
  { fullName: 'Raphinha', nickname: 'Raphinha', team: 'Brazil' },
  { fullName: 'Neymar', nickname: 'Neymar', team: 'Brazil' },
  { fullName: 'Richarlison', nickname: 'Richarlison', team: 'Brazil' },
  
  // England
  { fullName: 'Harry Kane', nickname: 'H. Kane', team: 'England' },
  { fullName: 'Bukayo Saka', nickname: 'B. Saka', team: 'England' },
  { fullName: 'Phil Foden', nickname: 'Foden', team: 'England' },
  { fullName: 'Jude Bellingham', nickname: 'Bellingham', team: 'England' },
  
  // Portugal
  { fullName: 'Cristiano Ronaldo', nickname: 'Ronaldo', team: 'Portugal' },
  { fullName: 'Bruno Fernandes', nickname: 'B. Fernandes', team: 'Portugal' },
  { fullName: 'Bernardo Silva', nickname: 'B. Silva', team: 'Portugal' },
  
  // Spain
  { fullName: 'Lamine Yamal', nickname: 'L. Yamal', team: 'Spain' },
  { fullName: 'Pedri', nickname: 'Pedri', team: 'Spain' },
  { fullName: 'Gavi', nickname: 'Gavi', team: 'Spain' },
  { fullName: 'Rodri', nickname: 'Rodri', team: 'Spain' },
  
  // Netherlands
  { fullName: 'Virgil van Dijk', nickname: 'van Dijk', team: 'Netherlands' },
  { fullName: ' Cody Gakpo', nickname: 'Gakpo', team: 'Netherlands' },
  { fullName: 'Xavi Simons', nickname: 'X. Simons', team: 'Netherlands' },
  { fullName: 'Dani Olmo', nickname: 'D. Olmo', team: 'Netherlands' },
  
  // Belgium
  { fullName: 'Kevin De Bruyne', nickname: 'De Bruyne', team: 'Belgium' },
  { fullName: 'Romelu Lukaku', nickname: 'Lukaku', team: 'Belgium' },
  { fullName: 'Jeremy Doku', nickname: 'Doku', team: 'Belgium' },
  
  // Italy
  { fullName: 'Gianluigi Donnarumma', nickname: 'Donnarumma', team: 'Italy' },
  { fullName: 'Lorenzo Pellegrini', nickname: 'L. Pellegrini', team: 'Italy' },
  
  // Croatia
  { fullName: 'Luka Modric', nickname: 'Modric', team: 'Croatia' },
  { fullName: 'Andrej Kramaric', nickname: 'Kramaric', team: 'Croatia' },
  
  // Uruguay
  { fullName: 'Darwin Nunez', nickname: 'Nunez', team: 'Uruguay' },
  { fullName: 'Federico Valverde', nickname: 'Valverde', team: 'Uruguay' },
  { fullName: 'Maximiliano Araujo', nickname: 'Araujo', team: 'Uruguay' },
  
  // USA
  { fullName: 'Christian Pulisic', nickname: 'Pulisic', team: 'USA' },
  { fullName: 'Folarin Balogun', nickname: 'Balogun', team: 'USA' },
  { fullName: 'Gio Reyna', nickname: 'Reyna', team: 'USA' },
  { fullName: 'Tyler Adams', nickname: 'Adams', team: 'USA' },
  { fullName: 'Diego Bobadilla', nickname: 'Bobadilla', team: 'USA' },
  
  // Mexico
  { fullName: 'Santiago Munoz', nickname: 'Munoz', team: 'Mexico' },
  { fullName: 'Jorge Quinones', nickname: 'Quinones', team: 'Mexico' },
  { fullName: 'Raul Jimenez', nickname: 'Jimenez', team: 'Mexico' },
  { fullName: 'Hirving Lozano', nickname: 'Lozano', team: 'Mexico' },
  
  // Sweden
  { fullName: 'Alexander Isak', nickname: 'Isak', team: 'Sweden' },
  { fullName: 'Viktor Gyokeres', nickname: 'Gyokeres', team: 'Sweden' },
  { fullName: 'Dejan Kulusevski', nickname: 'Kulusevski', team: 'Sweden' },
  { fullName: 'Anthony Elanga', nickname: 'Elanga', team: 'Sweden' },
  { fullName: 'Yasin Ayari', nickname: 'Ayari', team: 'Sweden' },
  { fullName: 'Mattias Svanberg', nickname: 'Svanberg', team: 'Sweden' },
  
  // Norway
  { fullName: 'Erling Haaland', nickname: 'Haaland', team: 'Norway' },
  { fullName: 'Martin Odegaard', nickname: 'Odegaard', team: 'Norway' },
  { fullName: 'Jorgen Strand Larsen', nickname: 'Strand Larsen', team: 'Norway' },
  { fullName: 'Oscar Bobb', nickname: 'Bobb', team: 'Norway' },
  
  // Denmark
  { fullName: 'Rasmus Hojlund', nickname: 'Hojlund', team: 'Denmark' },
  { fullName: 'Pierre-Emile Hojbjerg', nickname: 'Hojbjerg', team: 'Denmark' },
  
  // Switzerland
  { fullName: 'Granit Xhaka', nickname: 'Xhaka', team: 'Switzerland' },
  { fullName: 'Xherdan Shaqiri', nickname: 'Shaqiri', team: 'Switzerland' },
  { fullName: 'Breel Embolo', nickname: 'Embolo', team: 'Switzerland' },
  
  // Morocco
  { fullName: 'Achraf Hakimi', nickname: 'Hakimi', team: 'Morocco' },
  { fullName: 'Hakim Ziyech', nickname: 'Ziyech', team: 'Morocco' },
  { fullName: 'Sofyan Amrabat', nickname: 'Amrabat', team: 'Morocco' },
  { fullName: 'Youssef En-Nesyri', nickname: 'En-Nesyri', team: 'Morocco' },
  { fullName: 'Ismail Azzaoui', nickname: 'Saibari', team: 'Morocco' },
  
  // Senegal
  { fullName: 'Sadio Mane', nickname: 'Mane', team: 'Senegal' },
  { fullName: 'Ismaila Sarr', nickname: 'Sarr', team: 'Senegal' },
  { fullName: 'Boulaye Dia', nickname: 'Dia', team: 'Senegal' },
  { fullName: 'Ibrahim Mbaye', nickname: 'Mbaye', team: 'Senegal' },
  
  // Ghana
  { fullName: 'Mohammed Kudus', nickname: 'Kudus', team: 'Ghana' },
  { fullName: 'Inaki Williams', nickname: 'Williams', team: 'Ghana' },
  
  // Cameroon
  { fullName: 'Vincent Aboubakar', nickname: 'Aboubakar', team: 'Cameroon' },
  { fullName: 'Andre Onana', nickname: 'Onana', team: 'Cameroon' },
  
  // Japan
  { fullName: 'Kaoru Nakamura', nickname: 'Nakamura', team: 'Japan' },
  { fullName: 'Koki Ogawa', nickname: 'Ogawa', team: 'Japan' },
  { fullName: 'Takefusa Kubo', nickname: 'Kubo', team: 'Japan' },
  { fullName: 'Daizen Maeda', nickname: 'Maeda', team: 'Japan' },
  
  // South Korea
  { fullName: 'Son Heung-min', nickname: 'Son', team: 'South Korea' },
  { fullName: 'Hwang In-beom', nickname: 'Hwang', team: 'South Korea' },
  { fullName: 'Kim Min-jae', nickname: 'Kim Min-jae', team: 'South Korea' },
  { fullName: 'Oh Se-hun', nickname: 'Oh', team: 'South Korea' },
  
  // Australia
  { fullName: 'Mitchell Duke', nickname: 'Duke', team: 'Australia' },
  { fullName: 'Awer Mabil', nickname: 'Mabil', team: 'Australia' },
  { fullName: 'Nestory Irankunda', nickname: 'Irankunda', team: 'Australia' },
  { fullName: 'Connor Metcalfe', nickname: 'Metcalfe', team: 'Australia' },
  
  // Canada
  { fullName: 'Alphonso Davies', nickname: 'Davies', team: 'Canada' },
  { fullName: 'Cyle Larin', nickname: 'Larin', team: 'Canada' },
  { fullName: 'Jonathan David', nickname: 'J. David', team: 'Canada' },
  
  // Poland
  { fullName: 'Robert Lewandowski', nickname: 'Lewandowski', team: 'Poland' },
  { fullName: 'Karim Benzema', nickname: 'Benzema', team: 'Poland' },
  
  // Czech Republic
  { fullName: 'Patrik Schick', nickname: 'Schick', team: 'Czech Republic' },
  { fullName: 'Ladislav Krejci', nickname: 'Krejci', team: 'Czech Republic' },
  
  // Ukraine
  { fullName: 'Mykhailo Mudryk', nickname: 'Mudryk', team: 'Ukraine' },
  { fullName: 'Oleksandr Zinchenko', nickname: 'Zinchenko', team: 'Ukraine' },
  
  // Serbia
  { fullName: 'Dusan Vlahovic', nickname: 'Vlahovic', team: 'Serbia' },
  { fullName: 'Aleksandar Mitrovic', nickname: 'Mitrovic', team: 'Serbia' },
  
  // Austria
  { fullName: 'Marko Arnautovic', nickname: 'Arnautovic', team: 'Austria' },
  { fullName: 'Marcel Sabitzer', nickname: 'Sabitzer', team: 'Austria' },
  { fullName: 'Roman Aschmidt', nickname: 'Aschmidt', team: 'Austria' },
  
  // Romania
  { fullName: 'Nicolae Stanciu', nickname: 'Stanciu', team: 'Romania' },
  
  // Hungary
  { fullName: 'Dominik Szoboszlai', nickname: 'Szoboszlai', team: 'Hungary' },
  
  // Scotland
  { fullName: 'John McGinn', nickname: 'McGinn', team: 'Scotland' },
  { fullName: 'Andy Robertson', nickname: 'Robertson', team: 'Scotland' },
  { fullName: 'Kieran Tierney', nickname: 'Tierney', team: 'Scotland' },
  
  // Turkey
  { fullName: 'Arda Guler', nickname: 'Guler', team: 'Turkey' },
  { fullName: 'Hakan Calhanoglu', nickname: 'Calhanoglu', team: 'Turkey' },
  { fullName: 'Kerem Akturkoglu', nickname: 'Akturkoglu', team: 'Turkey' },
  
  // New Zealand
  { fullName: 'Chris Wood', nickname: 'Wood', team: 'New Zealand' },
  { fullName: 'Elijah Just', nickname: 'Just', team: 'New Zealand' },
  { fullName: 'Ryan Thomas', nickname: 'Thomas', team: 'New Zealand' },
  
  // Saudi Arabia
  { fullName: 'Abdulelah Al-Makhi', nickname: 'Al-Makhi', team: 'Saudi Arabia' },
  { fullName: 'Feras Al Brikan', nickname: 'Al Brikan', team: 'Saudi Arabia' },
  { fullName: 'Saleh Al Shehri', nickname: 'Al Shehri', team: 'Saudi Arabia' },
  
  // Qatar
  { fullName: 'Almoez Ali', nickname: 'Almoez Ali', team: 'Qatar' },
  { fullName: 'Bouthayna Khoukhi', nickname: 'Khoukhi', team: 'Qatar' },
  { fullName: 'Akram Afif', nickname: 'Afif', team: 'Qatar' },
  
  // UAE
  { fullName: 'Ali Mabkhout', nickname: 'Mabkhout', team: 'UAE' },
  
  // Iran
  { fullName: 'Sardar Azmoun', nickname: 'Azmoun', team: 'Iran' },
  { fullName: 'Mehdi Taremi', nickname: 'Taremi', team: 'Iran' },
  { fullName: 'Jalal Hosseini', nickname: 'Hosseini', team: 'Iran' },
  { fullName: 'Ramin Rezaeian', nickname: 'Rezaeian', team: 'Iran' },
  { fullName: 'Mohammad Mohebi', nickname: 'Mohebi', team: 'Iran' },
  
  // Egypt
  { fullName: 'Mohamed Salah', nickname: 'Salah', team: 'Egypt' },
  { fullName: 'Mostafa Mohamed', nickname: 'M. Mohamed', team: 'Egypt' },
  { fullName: 'Emam Ashour', nickname: 'Ashour', team: 'Egypt' },
  { fullName: 'Omar Marmoush', nickname: 'Marmoush', team: 'Egypt' },
  
  // Tunisia
  { fullName: 'Youssef Msakni', nickname: 'Msakni', team: 'Tunisia' },
  { fullName: 'Khazri', nickname: 'Khazri', team: 'Tunisia' },
  { fullName: 'Omar Rekik', nickname: 'Rekik', team: 'Tunisia' },
  
  // Algeria
  { fullName: 'Riyad Mahrez', nickname: 'Mahrez', team: 'Algeria' },
  { fullName: 'Ismail Bennacer', nickname: 'Bennacer', team: 'Algeria' },
  
  // Ivory Coast
  { fullName: 'Sebastien Haller', nickname: 'Haller', team: 'Ivory Coast' },
  { fullName: 'Nicolas Pepe', nickname: 'Pepe', team: 'Ivory Coast' },
  { fullName: 'Abdoulaye Diallo', nickname: 'Diallo', team: 'Ivory Coast' },
  
  // Nigeria
  { fullName: 'Victor Osimhen', nickname: 'Osimhen', team: 'Nigeria' },
  { fullName: 'Ademola Lookman', nickname: 'Lookman', team: 'Nigeria' },
  
  // DR Congo
  { fullName: 'Chancel Mbemba', nickname: 'Mbemba', team: 'DR Congo' },
  { fullName: 'Erick Tshimanga', nickname: 'Tshimanga', team: 'DR Congo' },
  
  // Cameroon
  { fullName: 'Bryan Mbeumo', nickname: 'Mbeumo', team: 'Cameroon' },
  
  // Paraguay
  { fullName: 'Antonio Sanabria', nickname: 'Sanabria', team: 'Paraguay' },
  { fullName: 'Miguel Almirón', nickname: 'Almirón', team: 'Paraguay' },
  
  // Bolivia
  { fullName: 'Marcelo Martins', nickname: 'Martins', team: 'Bolivia' },
  
  // Ecuador
  { fullName: 'Enner Valencia', nickname: 'Valencia', team: 'Ecuador' },
  { fullName: 'Pervis Estupinan', nickname: 'Estupinan', team: 'Ecuador' },
  
  // Peru
  { fullName: 'Paolo Guerrero', nickname: 'Guerrero', team: 'Peru' },
  { fullName: 'Renaldo Tapia', nickname: 'Tapia', team: 'Peru' },
  
  // Chile
  { fullName: 'Alexis Sanchez', nickname: 'A. Sanchez', team: 'Chile' },
  { fullName: 'Arturo Vidal', nickname: 'Vidal', team: 'Chile' },
  
  // Colombia
  { fullName: 'James Rodriguez', nickname: 'J. Rodriguez', team: 'Colombia' },
  { fullName: 'Luis Diaz', nickname: 'L. Diaz', team: 'Colombia' },
  { fullName: 'Jhon Cordoba', nickname: 'Cordoba', team: 'Colombia' },
  
  // Venezuela
  { fullName: 'Salomon Rondon', nickname: 'Rondon', team: 'Venezuela' },
  { fullName: 'Josef Martinez', nickname: 'Martinez', team: 'Venezuela' },
  
  // Costa Rica
  { fullName: 'Keylor Navas', nickname: 'Navas', team: 'Costa Rica' },
  { fullName: 'Anthony Contreras', nickname: 'Contreras', team: 'Costa Rica' },
  
  // Panama
  { fullName: 'Ismael Diaz', nickname: 'I. Diaz', team: 'Panama' },
  { fullName: 'Alberto Yin', nickname: 'Yin', team: 'Panama' },
  
  // Jamaica
  { fullName: 'Leon Bailey', nickname: 'Bailey', team: 'Jamaica' },
  { fullName: 'Michail Antonio', nickname: 'Antonio', team: 'Jamaica' },
  
  // Honduras
  { fullName: 'Luis Lopez', nickname: 'Lopez', team: 'Honduras' },
  
  // USA
  { fullName: 'Timothy Weah', nickname: 'Weah', team: 'USA' },
  { fullName: 'Weston McKennie', nickname: 'McKennie', team: 'USA' },
  { fullName: 'Sergiño Dest', nickname: 'Dest', team: 'USA' },
  
  // Canada
  { fullName: 'Tajon Buchanan', nickname: 'Buchanan', team: 'Canada' },
  { fullName: 'Alphonso Davies', nickname: 'Davies', team: 'Canada' },
  
  // Bosnia
  { fullName: 'Edin Dzeko', nickname: 'Dzeko', team: 'Bosnia' },
  { fullName: 'Milan Djuric', nickname: 'Djuric', team: 'Bosnia' },
  { fullName: 'Jovan Lukić', nickname: 'Lukić', team: 'Bosnia' },
  
  // Iceland
  { fullName: 'Gylfi Sigurdsson', nickname: 'Sigurdsson', team: 'Iceland' },
  
  // Wales
  { fullName: 'Gareth Bale', nickname: 'Bale', team: 'Wales' },
  { fullName: 'Aaron Ramsey', nickname: 'Ramsey', team: 'Wales' },
  
  // Albania
  { fullName: 'Sokol Çiçkja', nickname: 'Çiçkja', team: 'Albania' },
  { fullName: 'Reysas Manaj', nickname: 'Manaj', team: 'Albania' },
  
  // Slovenia
  { fullName: 'Benjamin Šeško', nickname: 'Šeško', team: 'Slovenia' },
  { fullName: 'Andraž Šporar', nickname: 'Šporar', team: 'Slovenia' },
  
  // Slovakia
  { fullName: 'Milan Škriniar', nickname: 'Škriniar', team: 'Slovakia' },
  { fullName: 'Ondrej Duda', nickname: 'Duda', team: 'Slovakia' },
  
  // Lithuania
  { fullName: 'Vykintas Slivka', nickname: 'Slivka', team: 'Lithuania' },
  
  // Finland
  { fullName: 'Teemu Pukki', nickname: 'Pukki', team: 'Finland' },
  
  // Greece
  { fullName: 'Dimitris Pelkas', nickname: 'Pelkas', team: 'Greece' },
  
  // Israel
  { fullName: 'Eran Zahavi', nickname: 'Zahavi', team: 'Israel' },
  
  // Kazakhstan
  { fullName: 'Abat Aymbetov', nickname: 'Aymbetov', team: 'Kazakhstan' },
  
  // Luxembourg
  { fullName: 'Gerson Rodrigues', nickname: 'Rodrigues', team: 'Luxembourg' },
  
  // Montenegro
  { fullName: 'Stevan Jovetic', nickname: 'Jovetic', team: 'Montenegro' },
  
  // North Macedonia
  { fullName: 'Goran Pandev', nickname: 'Pandev', team: 'North Macedonia' },
  
  // Cyprus
  { fullName: 'Nicholas Ioannou', nickname: 'Ioannou', team: 'Cyprus' },
  
  // Estonia
  { fullName: ' Konstantin Vassiljev', nickname: 'Vassiljev', team: 'Estonia' },
  
  // Latvia
  { fullName: 'Roberts Uldriķis', nickname: 'Uldriķis', team: 'Latvia' },
  
  // Malta
  { fullName: 'Kyrian Nwoko', nickname: 'Nwoko', team: 'Malta' },
  
  // Andorra
  { fullName: 'Cristian Martínez', nickname: 'Martínez', team: 'Andorra' },
  
  // Liechtenstein
  { fullName: 'Dennis Yasak', nickname: 'Yasak', team: 'Liechtenstein' },
  
  // San Marino
  { fullName: 'Alessandro Golinucci', nickname: 'Golinucci', team: 'San Marino' },
  
  // Gibraltar
  { fullName: 'Toms Haverns', nickname: 'Haverns', team: 'Gibraltar' },
  
  // Faroe Islands
  { fullName: 'Jóan Símun Edmundsson', nickname: 'Edmundsson', team: 'Faroe Islands' },
  
  // Curaçao
  { fullName: 'Leuk Combé', nickname: 'Combé', team: 'Curaçao' },
  { fullName: 'Leroy Comenencia', nickname: 'Comenencia', team: 'Curaçao' },
  
  // Trinidad & Tobago
  { fullName: 'Levi Garcia', nickname: 'Garcia', team: 'Trinidad & Tobago' },
  
  // Guatemala
  { fullName: 'Carlos Fangrow', nickname: 'Fangrow', team: 'Guatemala' },
  
  // Suriname
  { fullName: ' Glearlo Sieth', nickname: 'Sieth', team: 'Suriname' },
  
  // Guyana
  { fullName: ' Nigel Boakai', nickname: 'Boakai', team: 'Guyana' },
  
  // Haiti
  { fullName: ' Duckens Nazo', nickname: 'Nazo', team: 'Haiti' },
  
  // Nicaragua
  { fullName: 'Juan Carlos Aburto', nickname: 'Aburto', team: 'Nicaragua' },
  
  // El Salvador
  { fullName: 'Joshua Camil', nickname: 'Camil', team: 'El Salvador' },
  
  // Belize
  { fullName: 'Deon Burton', nickname: 'Burton', team: 'Belize' },
  
  // Grenada
  { fullName: 'Kandy Row', nickname: 'Row', team: 'Grenada' },
  
  // Bermuda
  { fullName: 'Lejaun Simmons', nickname: 'Simmons', team: 'Bermuda' },
  
  // Barbados
  { fullName: 'Rashid', nickname: 'Rashid', team: 'Barbados' },
  
  // Bahamas
  { fullName: 'Marcel Joseph', nickname: 'Joseph', team: 'Bahamas' },
  
  // Antigua & Barbuda
  { fullName: 'Quincy', nickname: 'Quincy', team: 'Antigua & Barbuda' },
  
  // Dominica
  { fullName: 'Julius James', nickname: 'James', team: 'Dominica' },
  
  // St Kitts & Nevis
  { fullName: 'Rashid', nickname: 'Rashid', team: 'St Kitts & Nevis' },
  
  // St Lucia
  { fullName: 'Tano Smith', nickname: 'Smith', team: 'St Lucia' },
  
  // St Vincent & Grenadines
  { fullName: 'Oalex Anderson', nickname: 'Anderson', team: 'St Vincent & Grenadines' },
  
  // Dominicans
  { fullName: 'Marante', nickname: 'Marante', team: 'Dominicans' },
  
  // Puerto Rico
  { fullName: 'Marante', nickname: 'Marante', team: 'Puerto Rico' },
  
  // Guadeloupe
  { fullName: 'Ludovic Get', nickname: 'Get', team: 'Guadeloupe' },
  
  // Martinique
  { fullName: 'Kévin Fortuné', nickname: 'Fortuné', team: 'Martinique' },
  
  // French Guiana
  { fullName: 'Roy Contout', nickname: 'Contout', team: 'French Guiana' },
  
  // Aruba
  { fullName: 'Anton Jongsma', nickname: 'Jongsma', team: 'Aruba' },
  
  // Bonaire
  { fullName: 'Rowendy', nickname: 'Rowendy', team: 'Bonaire' },
  
  // Sint Maarten
  { fullName: 'Gioseph Char', nickname: 'Char', team: 'Sint Maarten' },
  
  // Curacao
  { fullName: 'Leuk Combé', nickname: 'Combé', team: 'Curaçao' },
  
  // Cayman Islands
  { fullName: 'MaCL', nickname: 'MaCL', team: 'Cayman Islands' },
  
  // British Virgin Islands
  { fullName: 'Coniah', nickname: 'Coniah', team: 'British Virgin Islands' },
  
  // US Virgin Islands
  { fullName: 'Kevin', nickname: 'Kevin', team: 'US Virgin Islands' },
  
  // Anguilla
  { fullName: 'Connor', nickname: 'Connor', team: 'Anguilla' },
  
  // Montserrat
  { fullName: 'Brun', nickname: 'Brun', team: 'Montserrat' },
  
  // Turks & Caicos
  { fullName: 'Billy', nickname: 'Billy', team: 'Turks & Caicos' },
  
  // Cuba
  { fullName: 'Carlos Santos', nickname: 'Santos', team: 'Cuba' },
  
  // Haiti
  { fullName: 'Mouchoukain', nickname: 'Mouchoukain', team: 'Haiti' },
  
  // Iraq
  { fullName: 'Aliasghbar Regife', nickname: 'Hsin', team: 'Iraq' },
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
function findBestMatch(apiName, team = null) {
  // First check explicit conversions
  if (scorerNameConversions[apiName]) {
    return scorerNameConversions[apiName];
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  // Filter by team if provided
  const candidates = team 
    ? wcPlayerDatabase.filter(p => p.team.toLowerCase() === team.toLowerCase())
    : wcPlayerDatabase;
  
  for (const player of candidates) {
    // Check against full name
    let score = fuzzyMatch(apiName, player.fullName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = player.fullName;
    }
    
    // Check against nickname
    const nickScore = fuzzyMatch(apiName, player.nickname) * 0.9;
    if (nickScore > bestScore) {
      bestScore = nickScore;
      bestMatch = player.fullName;
    }
  }
  
  // Only return if confidence is above threshold
  return bestScore > 0.5 ? bestMatch : apiName;
}

function formatScorer(scorerStr, team = null) {
  if (!scorerStr) return '';
  
  // Clean the scorer string - remove all types of surrounding quotes if present
  let cleanStr = scorerStr.trim();
  // Remove curly quotes (U+201C, U+201D) and straight quotes (U+0022) from start/end
  cleanStr = cleanStr.replace(/^[\u0022\u201C\u201D]+|[\u0022\u201C\u201D]+$/g, '');
  
  // Parse the scorer string - format is like "Name 90'" or "Name 45'+5'(p)" or "Name 90+6'" (extra time)
  // Extract name and minute/penalty info
  // Match: everything before the minute (with optional OG or penalty), then the minute
  // Handles formats: 90', 90+6', 90+5'(p), 7'(OG), etc.
  // Minute pattern: digits, optional apostrophe, optional plus, optional digits, optional apostrophe, optional (OG), optional (p)
  const match = cleanStr.match(/^(.+?)\s+(\d+[']?\+?\d*'?(\(OG\))?\s*(\(p\))?)$/);
  let name;
  let minute = '';
  if (match) {
    name = match[1].trim();
    minute = match[2];
  } else {
    name = cleanStr.trim();
  }
  
  // Apply name conversion with fuzzy matching fallback
  let displayName = scorerNameConversions[name];
  if (!displayName) {
    // Try fuzzy matching from database
    displayName = findBestMatch(name, team);
  }
  if (!displayName) {
    displayName = name;
  }
  
  const isPenalty = minute.includes('(p)');
  const isOG = minute.includes('(OG)');
  
  return { name: displayName, minute, isPenalty, isOG };
}

// Helper function to build scorers HTML for a team
function buildScorersHtml(scorers, isHomeTeam = true) {
  if (!scorers || scorers.length === 0) {
    return '<span class="no-scorers">-</span>';
  }
  
  return scorers.map(scorerStr => {
    const parsed = formatScorer(scorerStr);
    const penaltyClass = parsed.isPenalty ? ' scorer-penalty' : '';
    return `<span class="scorer-item${penaltyClass}">${parsed.name} <span class="scorer-minute">${parsed.minute}</span></span>`;
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
  
  // Track which players appeared in which team's scorers (for heuristic OG detection)
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
  
  // Helper function to check if a goal is an own goal using the player database
  const isOwnGoalByDatabase = (playerName, scoringForTeam) => {
    const playerTeam = playerTeamDatabase[playerName];
    if (playerTeam && scoringForTeam && playerTeam !== scoringForTeam) {
      return true; // Player is scoring for a team they don't belong to = own goal
    }
    return false;
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
    const match = findMatchByNo(Number(matchNo));
    const homeTeam = match?.team1 || null;
    const awayTeam = match?.team2 || null;
    
    // Track home scorers
    for (const scorerStr of matchScorers.home || []) {
      const parsed = formatScorer(scorerStr, homeTeam);
      if (parsed.name) {
        if (!playerTeamAppearances[parsed.name]) {
          playerTeamAppearances[parsed.name] = { home: false, away: false };
        }
        playerTeamAppearances[parsed.name].home = true;
      }
    }
    
    // Track away scorers
    for (const scorerStr of matchScorers.away || []) {
      const parsed = formatScorer(scorerStr, awayTeam);
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
    const match = findMatchByNo(Number(matchNo));
    
    // Get match local_date from state.apiMatchTimes (format: "06/13/2026 21:00")
    const localDateStr = state.apiMatchTimes[matchNo];
    const matchTime = parseLocalDate(localDateStr);
    
    // Get country for home and away teams
    const homeTeam = match?.team1 || null;
    const awayTeam = match?.team2 || null;
    
    // Process home team scorers
    for (const scorerStr of matchScorers.home || []) {
      const parsed = formatScorer(scorerStr, homeTeam);
      const name = parsed.name;
      if (name) {
        // Check if this is an own goal
        // If player doesn't belong to home team (according to database), it's an OG
        // Credit OG to away team (the team that benefited)
        const creditedTeam = homeTeam;
        const isOG = parsed.isOG || isOwnGoalByDatabase(name, homeTeam);
        
        // If scoring for away team or it's a likely OG, credit to away team
        const actualCreditedTeam = isOG ? awayTeam : homeTeam;
        
        // Skip counting this goal if it's an OG (we don't count OG in top scorers)
        if (isOG) {
          // Still track the OG for reference but don't add to scorer counts
          console.log(`Own goal detected: ${name} (OG credited to ${actualCreditedTeam})`);
          continue;
        }
        
        if (!scorerCounts[name]) {
          scorerCounts[name] = { goals: 0, country: actualCreditedTeam, latestGoalTime: 0 };
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
    
    // Process away team scorers
    for (const scorerStr of matchScorers.away || []) {
      const parsed = formatScorer(scorerStr, awayTeam);
      const name = parsed.name;
      if (name) {
        // Check if this is an own goal
        const isOG = parsed.isOG || isOwnGoalByDatabase(name, awayTeam);
        
        // If scoring for home team or it's a likely OG, credit to home team
        const actualCreditedTeam = isOG ? homeTeam : awayTeam;
        
        // Skip counting this goal if it's an OG (we don't count OG in top scorers)
        if (isOG) {
          console.log(`Own goal detected: ${name} (OG credited to ${actualCreditedTeam})`);
          continue;
        }
        
        if (!scorerCounts[name]) {
          scorerCounts[name] = { goals: 0, country: actualCreditedTeam, latestGoalTime: 0 };
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
    .map(([name, data]) => ({ name, goals: data.goals, country: data.country, latestGoalTime: data.latestGoalTime }))
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
  
  // Build HTML table
  let html = `
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
    
    html += `
      <tr class="${rankClass}">
        <td class="rank-col">${rankDisplay}</td>
        <td class="player-col">${portraitHtml}${flagHtml}<span class="scorer-name"><span class="scorer-first-name">${firstName}</span> <span class="scorer-last-name">${lastName}</span></span></td>
        <td class="goals-col"><span class="goals-badge">${scorer.goals}</span></td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  
  // Async: Update portraits from TheSportsDB API
  updatePortraitsFromAPI();
}

// Function to update portraits from TheSportsDB API after render
async function updatePortraitsFromAPI() {
  const portraitImages = document.querySelectorAll('.scorer-portrait[data-player]');
  console.log('updatePortraitsFromAPI called, found images:', portraitImages.length);
  
  for (const img of portraitImages) {
    const playerName = img.dataset.player;
    const placeholder = img.nextElementSibling;
    console.log('Fetching portrait for:', playerName);
    
    const portraitUrl = await getPlayerPortraitAsync(playerName);
    console.log('Got URL for', playerName, ':', portraitUrl);
    
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
      tempImg.onerror = function() {
        console.log('Failed to load image for', playerName);
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
        const homeScorersHtml = buildScorersHtml(scorers.home);
        const awayScorersHtml = buildScorersHtml(scorers.away);
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
    const homeScorersHtml = buildScorersHtml(scorers.home);
    const awayScorersHtml = buildScorersHtml(scorers.away);
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

// Define the bracket structure with home/away side assignment
// Home side (left): Groups A, C, E, F, I, L → R16: M89, M90, M91, M92
// Away side (right): Groups B, D, G, H, J, K → R16: M93, M94, M95, M96
const BRACKET_STRUCTURE = {
  r32: {
    home: [73, 75, 74, 77, 76, 78, 79, 80],  // 2A/2B, 1F/2C, 1E/3rd, 1I/3rd, 1C/2F, 2E/2I, 1A/3rd, 1L/3rd
    away: [83, 84, 81, 82, 85, 87, 86, 88]   // 2K/2L, 1H/2J, 1D/3rd, 1G/3rd, 1B/3rd, 1K/3rd, 1J/2H, 2D/2G
  },
  r16: {
    home: [90, 89, 91, 92],  // W73/W75, W74/W77, W76/W78, W79/W80
    away: [93, 94, 95, 96]   // W83/W84, W81/W82, W86/W88, W85/W87
  },
  qf: {
    home: [97, 99],  // W89/W90, W91/W92
    away: [98, 100]   // W93/W94, W95/W96
  },
  sf: {
    home: [101],  // W97/W98
    away: [102]    // W99/W100
  },
  third: [103],
  final: [104]
};

function renderBracket(rankings, thirdPlaceTeams, assignments, allGroupsComplete) {
  let html = '';
  const resultMap = computeKnockoutResults(rankings, thirdPlaceTeams, assignments, allGroupsComplete);

  // Build home and away columns
  html += `<div class="bracket-main">`;
  html += `<div class="bracket-side bracket-side-home">`;
  
  // Home side: R32 → R16 → QF → SF
  html += buildBracketSide('home', rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  
  html += `</div>`;
  
  // Center: Third Place & Final
  html += `<div class="bracket-center">`;
  html += buildCenterMatches(rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  html += `</div>`;
  
  html += `<div class="bracket-side bracket-side-away">`;
  
  // Away side: R32 → R16 → QF → SF
  html += buildBracketSide('away', rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  
  html += `</div>`;
  html += `</div>`; // End bracket-main

  bracketContainer.innerHTML = html;

  bracketContainer.querySelectorAll('.score-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const matchNo = event.target.dataset.match;
      const side = event.target.dataset.side;
      updateScore(Number(matchNo), side, event.target.value);
    });
  });
}

function buildBracketSide(side, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete) {
  let html = '';
  
  // Both sides: SF → QF → R16 → R32 in DOM order
  // Home side (left): R32 will be far left (outside), SF closest to center
  // Away side (right): SF closest to center, R32 far right (outside)
  html += buildSideStage('sf', side, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  html += buildSideStage('qf', side, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  html += buildSideStage('r16', side, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  html += buildSideStage('r32', side, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete);
  
  return html;
}

function buildSideStage(stage, side, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete) {
  const matchNos = BRACKET_STRUCTURE[stage][side];
  if (!matchNos || matchNos.length === 0) return '';
  
  const matches = matchNos.map(no => scheduleData.knockoutMatches.find(m => m.matchNo === no)).filter(Boolean);
  
  // Group matches into pairs for connectors
  let matchesHtml = '';
  for (let i = 0; i < matches.length; i += 2) {
    const pairMatches = [];
    if (i < matches.length) pairMatches.push(matches[i]);
    if (i + 1 < matches.length) pairMatches.push(matches[i + 1]);
    
    const pairHtml = pairMatches.map(m => 
      buildMatchCardHtml(m, stage, rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete)
    ).join('');
    
    matchesHtml += `<div class="bracket-pair bracket-pair-${side}">${pairHtml}</div>`;
  }
  
  const sideLabel = side === 'home' ? 'Home' : 'Away';
  
  return `
    <div class="bracket-stage bracket-stage-${stage} bracket-stage-${side}">
      <div class="bracket-stage-header">
        <span class="bracket-stage-label">${stageLabels[stage]}</span>
      </div>
      <div class="bracket-stage-matches">
        ${matchesHtml}
      </div>
    </div>
  `;
}

function buildCenterMatches(rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete) {
  let html = '';
  
  // Third place match
  const thirdMatch = scheduleData.knockoutMatches.find(m => m.matchNo === 103);
  if (thirdMatch) {
    html += `
      <div class="bracket-stage bracket-stage-third bracket-stage-center">
        <div class="bracket-stage-header">
          <span class="bracket-stage-label">${stageLabels['third']}</span>
        </div>
        <div class="bracket-stage-matches bracket-stage-matches-center">
          ${buildMatchCardHtml(thirdMatch, 'third', rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete)}
        </div>
      </div>
    `;
  }
  
  // Final match
  const finalMatch = scheduleData.knockoutMatches.find(m => m.matchNo === 104);
  if (finalMatch) {
    html += `
      <div class="bracket-stage bracket-stage-final bracket-stage-center">
        <div class="bracket-stage-header">
          <span class="bracket-stage-label">${stageLabels['final']}</span>
        </div>
        <div class="bracket-stage-matches bracket-stage-matches-center">
          ${buildMatchCardHtml(finalMatch, 'final', rankings, thirdPlaceTeams, resultMap, assignments, allGroupsComplete)}
        </div>
      </div>
    `;
  }
  
  return html;
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

// Build today's match card HTML
function buildTodaysMatchCard(match) {
  const score1Val = state.scores[match.matchNo]?.score1 ?? '';
  const score2Val = state.scores[match.matchNo]?.score2 ?? '';
  const isPlayed = isMatchPlayed(match.matchNo);
  const isApiSourced = isApiSourcedMatch(match.matchNo);
  const isLive = isLiveMatch(match.matchNo);
  const isFinished = isFinishedMatch(match.matchNo);
  
  // Get group info if it's a group match
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
    const homeScorersHtml = buildScorersHtml(scorers.home);
    const awayScorersHtml = buildScorersHtml(scorers.away);
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
  
  // Build today's match card content
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

// Render today's matches section
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
