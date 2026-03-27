import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { allTeams } from '@/data/teams';

interface Recruit {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  position: string;
  city: string;
  state: string;
  height: string;
  weight: number;
  highSchool: string;
  classYear: number;
  stars: number;
  rating: number;
  rating247Raw?: number;
  nationalRank: number;
  positionRank: number;
  stateRank: number;
  imageUrl: string;
  profileUrl?: string;
  committedSchoolLogo?: string;
  status: string;
  commitStatus: string;
  committedTo?: string;
  source: string;
  // Composite fields
  compositeRating?: number;
  compositeStars?: number;
  compositeRank?: number;
  avgSourceRank?: number;
  sourceCount?: number;
  ratings?: { source: string; rating: number; stars: number; rank: number }[];
}

// State name to abbreviation mapping
const STATE_ABBR: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC',
};

const US_STATE_ABBRS = new Set(Object.values(STATE_ABBR));

function normalizeState(state: string): string {
  if (!state) return '';
  const lower = state.toLowerCase().trim();
  if (STATE_ABBR[lower]) return STATE_ABBR[lower];
  const upper = state.toUpperCase().trim();
  if (US_STATE_ABBRS.has(upper)) return upper;
  // Non-US
  return 'Non-US';
}

// Position normalization
const POSITION_MAP: Record<string, string> = {
  'QB': 'QB', 'PRO': 'QB', 'DUAL': 'QB',
  'RB': 'RB', 'APB': 'RB', 'FB': 'RB', 'ALL': 'RB',
  'WR': 'WR', 'SLOT': 'WR',
  'TE': 'TE',
  'OT': 'OT', 'OL': 'OL', 'IOL': 'OL', 'OG': 'OG', 'OC': 'OC', 'C': 'OC', 'G': 'OG', 'T': 'OT',
  'DT': 'DT', 'NT': 'DT', 'DL': 'DT',
  'DE': 'EDGE', 'EDGE': 'EDGE', 'SDE': 'EDGE', 'WDE': 'EDGE', 'OLB': 'EDGE',
  'LB': 'LB', 'ILB': 'LB', 'MLB': 'LB',
  'CB': 'CB',
  'S': 'SAF', 'SAF': 'SAF', 'FS': 'SAF', 'SS': 'SAF', 'DB': 'SAF',
  'K': 'K', 'P': 'P', 'LS': 'P',
  'ATH': 'ATH', 'ATHLETE': 'ATH', 'RET': 'ATH',
  'QB-DT': 'QB', 'QB-PP': 'QB', 'TE-H': 'TE', 'TE-Y': 'TE',
  // 247Sports position ID mappings (historical data uses numeric IDs)
  '9': 'QB', '10': 'RB', '11': 'WR', '12': 'TE', '14': 'OT', '15': 'OG', '16': 'OC',
  '17': 'DT', '18': 'EDGE', '19': 'EDGE', '20': 'LB', '21': 'DT', '22': 'CB', '23': 'SAF',
  '24': 'ATH', '25': 'K', '26': 'P', '27': 'LS', '58': 'EDGE',
};

function normalizePosition(pos: string | number | undefined): string {
  if (!pos && pos !== 0) return 'ATH';
  const str = String(pos).toUpperCase();
  return POSITION_MAP[str] || str;
}

// Module-level cache
const cache: Record<string, { data: Recruit[]; timestamp: number }> = {};
const viewCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 hour

// Slug-to-team-name lookup for mapping On3 commitment slugs to display names
let slugToTeamName: Map<string, string> | null = null;
function getSlugToTeamName(): Map<string, string> {
  if (slugToTeamName) return slugToTeamName;
  slugToTeamName = new Map();
  allTeams.forEach(t => {
    slugToTeamName!.set(t.slug, t.id);
    // Also map partial slugs (e.g., "alabama-crimson-tide" -> "alabama")
    slugToTeamName!.set(t.id, t.id);
  });
  return slugToTeamName;
}

// Map an ESPN school name (e.g. "Maryland Terrapins") to our team ID (e.g. "maryland")
function espnSchoolToTeamId(schoolName: string): string {
  if (!schoolName) return '';
  const lower = schoolName.toLowerCase();
  const match = allTeams.find(t =>
    t.name.toLowerCase() === lower ||
    lower.startsWith(t.id.toLowerCase())
  );
  return match?.id || schoolName;
}

// Normalize an ESPN raw recruit to the Recruit interface
// ESPN grades: 90+ = 5★, 80-89 = 4★, 70-79 = 3★, <70 = unranked
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEspnRecruit(r: any, idx: number): Recruit {
  const school = r.committedSchool;
  const schoolName = typeof school === 'object' && school?.name
    ? school.name
    : (typeof school === 'string' ? school : '');
  return {
    id: r.espnId ? parseInt(r.espnId) : idx,
    name: r.name || '',
    position: normalizePosition(r.position || ''),
    city: r.city || r.highSchoolCity || '',
    state: r.state || '',
    height: r.height || '',
    weight: r.weight || 0,
    highSchool: r.highSchool || '',
    classYear: r.classYear || 0,
    stars: r.grade >= 90 ? 5 : r.grade >= 80 ? 4 : r.grade >= 70 ? 3 : 0,
    rating: r.grade ? r.grade / 100 : 0,
    nationalRank: r.rank || idx + 1,
    positionRank: 0,
    stateRank: 0,
    imageUrl: '',
    committedSchoolLogo: '',
    status: (typeof school === 'object' ? school?.status : '') || r.status?.description || '',
    commitStatus: schoolName ? 'committed' : '',
    committedTo: espnSchoolToTeamId(schoolName),
    source: 'espn',
  };
}

// Normalize an On3 raw recruit to the Recruit interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOn3Recruit(r: any, year: number): Recruit {
  const compositeRating = r.ratings?.composite;
  const on3Rating = r.ratings?.on3;
  const best = compositeRating || on3Rating || {};
  const slugMap = getSlugToTeamName();
  const commitSlug = r.commitment?.school || '';
  return {
    id: r.overallRank || 0,
    name: r.name || '',
    position: normalizePosition(r.position || ''),
    city: r.city?.split(',')[0]?.trim() || '',
    state: r.state || r.city?.split(',')[1]?.trim() || '',
    height: r.height || '',
    weight: r.weight || 0,
    highSchool: r.highSchool || '',
    classYear: r.classYear || year,
    stars: best.stars || 0,
    rating: best.rating ? best.rating / 100 : 0,
    nationalRank: r.overallRank || 0,
    positionRank: r.positionRank || 0,
    stateRank: r.stateRank || 0,
    imageUrl: r.imageUrl || '',
    committedSchoolLogo: '',
    status: r.commitment?.enrolled ? 'Enrolled' : r.commitment?.signed ? 'Signed' : commitSlug ? 'HardCommit' : '',
    commitStatus: commitSlug ? 'committed' : 'uncommitted',
    committedTo: commitSlug ? (slugMap.get(commitSlug) || '') : '',
    source: 'on3',
  };
}

function loadRecruits(year: number, source: string): Recruit[] {
  const cacheKey = `${source}-${year}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  const filePath = path.join(process.cwd(), 'public', 'data', 'scraped', `${source}-recruits-${year}.json`);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const rawList = parsed.recruits || parsed;

    let recruits: Recruit[];
    if (source === 'espn') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recruits = rawList.map((r: any, i: number) => normalizeEspnRecruit(r, i));
    } else if (source === 'on3') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recruits = rawList.map((r: any) => normalizeOn3Recruit(r, year));
    } else {
      // 247 and others — already matches Recruit interface
      recruits = rawList.map((r: Recruit) => ({
        ...r,
        position: normalizePosition(r.position),
      }));
    }

    cache[cacheKey] = { data: recruits, timestamp: now };
    return recruits;
  } catch (err) {
    console.error(`[loadRecruits] Error for ${source}-${year}:`, err);
    return [];
  }
}

// Normalize a recruit name for matching across sources
// Strip suffixes (Jr., III, II, IV) and special chars for better cross-source matching
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '')
    .replace(/[^a-z]/g, '');
}

// Secondary dedup fingerprint: last name + high school + position
// Catches cases where sources use different first names (DJ vs David, AJ vs Aroson, etc.)
function dedupeFingerprint(name: string, highSchool: string, position: string): string {
  const lastName = name.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const hs = (highSchool || '').toLowerCase()
    .replace(/\b(high school|hs|school|academy|prep|preparatory)\b/g, '')
    .replace(/[^a-z]/g, '');
  return `${lastName}|${hs}|${normalizePosition(position)}`;
}

// Build PFSN Recruiting Composite
// Strategy: Use On3 as primary (has 247/ESPN/On3 ratings embedded per recruit),
// then merge in 247-only recruits not in On3 for fuller coverage.
// Rating = average of all available source ratings (247, ESPN, On3).
// Stars = rounded average of all available source stars.
function buildComposite(year: number): Recruit[] {
  const cacheKey = `composite-${year}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  // Load raw source files (not our normalized versions — we need the original schemas)
  const on3Raw = loadRawJson(`scraped/on3-recruits-${year}.json`);
  const data247 = loadRecruits(year, '247');

  const composite: Recruit[] = [];
  const seenNames = new Set<string>();
  const seenFingerprints = new Set<string>();

  // Phase 1: Process On3 recruits (primary source — has multi-service ratings)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const on3Recruits: any[] = (on3Raw as any)?.recruits || [];
  for (const r of on3Recruits) {
    if (!r?.name) continue;
    const nameKey = normalizeName(String(r.name));
    seenNames.add(nameKey);
    const fp = dedupeFingerprint(r.name, r.highSchool || '', r.position || '');
    if (fp.split('|')[0] && fp.split('|')[1]) seenFingerprints.add(fp);

    // Extract per-source ratings from On3's nested ratings object
    const sourceRatings: { source: string; rating: number; stars: number; rank: number }[] = [];

    const r247 = r.ratings?.['247'];
    if (r247?.stars > 0) sourceRatings.push({ source: '247', rating: r247.rating || 0, stars: r247.stars, rank: r247.rank || 0 });

    const rEspn = r.ratings?.espn;
    if (rEspn?.stars > 0) sourceRatings.push({ source: 'espn', rating: rEspn.rating || 0, stars: rEspn.stars, rank: rEspn.rank || 0 });

    const rOn3 = r.ratings?.on3;
    if (rOn3?.stars > 0) sourceRatings.push({ source: 'on3', rating: rOn3.rating || 0, stars: rOn3.stars, rank: rOn3.rank || 0 });

    const rRivals = r.ratings?.rivals;
    if (rRivals?.stars > 0) sourceRatings.push({ source: 'rivals', rating: rRivals.rating || 0, stars: rRivals.stars, rank: rRivals.rank || 0 });

    // Calculate PFSN composite
    // Use rank-based averaging to normalize across different rating scales
    // Lower average rank = better player. Exclude rank 0 (unranked by that source)
    const validRanks = sourceRatings.filter(sr => sr.rank > 0);
    const avgRank = validRanks.length > 0
      ? validRanks.reduce((sum, sr) => sum + sr.rank, 0) / validRanks.length
      : 9999;
    // Track how many sources actually ranked this player (not just rated)
    const rankedByCount = validRanks.length;
    // Also compute average rating for display (but not for sorting)
    const validRatings = sourceRatings.filter(sr => sr.rating > 0);
    const avgRating = validRatings.length > 0
      ? validRatings.reduce((sum, sr) => sum + sr.rating, 0) / validRatings.length
      : 0;
    const validStars = sourceRatings.filter(sr => sr.stars > 0);
    const avgStars = validStars.length > 0
      ? Math.round(validStars.reduce((sum, sr) => sum + sr.stars, 0) / validStars.length)
      : 0;

    // Resolve commitment — use On3's slug to look up team name
    const commitment = r.commitment || {};
    const isCommitted = !!commitment.school;
    const commitSchoolSlug = commitment.school || '';
    const slugMap = getSlugToTeamName();
    const committedToFromOn3 = commitSchoolSlug ? (slugMap.get(commitSchoolSlug) || '') : '';

    composite.push({
      id: r.overallRank || 0,
      name: r.name,
      position: normalizePosition(r.position || ''),
      city: r.city?.split(',')[0]?.trim() || '',
      state: r.state || r.city?.split(',')[1]?.trim() || '',
      height: r.height || '',
      weight: r.weight || 0,
      highSchool: r.highSchool || '',
      classYear: r.classYear || year,
      stars: avgStars,
      rating: avgRating / 100,
      rating247Raw: Math.round(avgRating * 10) / 10,
      nationalRank: r.overallRank || 0,
      positionRank: r.positionRank || 0,
      stateRank: r.stateRank || 0,
      imageUrl: r.imageUrl || '',
      committedSchoolLogo: '',
      status: commitment.enrolled ? 'Enrolled' : commitment.signed ? 'Signed' : isCommitted ? 'HardCommit' : '',
      commitStatus: isCommitted ? 'committed' : 'uncommitted',
      committedTo: committedToFromOn3, // From On3 slug, enriched by CFBD below
      source: 'composite',
      compositeRating: Math.round(avgRating * 10) / 10,
      compositeStars: avgStars,
      compositeRank: 0,
      avgSourceRank: Math.round(avgRank * 10) / 10,
      sourceCount: sourceRatings.length,
      ratings: sourceRatings,
    });
  }

  // Phase 2: Add 247-only recruits not in On3 (for fuller coverage)
  // Check both name and fingerprint (last name + high school + position) to catch
  // nickname variants like "DJ Jacobs" vs "David Jacobs" at the same school
  for (const r of data247) {
    const nameKey = normalizeName(r.name);
    if (seenNames.has(nameKey)) continue;
    const fp = dedupeFingerprint(r.name, r.highSchool || '', r.position || '');
    if (fp.split('|')[0] && fp.split('|')[1] && seenFingerprints.has(fp)) continue;
    seenNames.add(nameKey);
    if (fp.split('|')[0] && fp.split('|')[1]) seenFingerprints.add(fp);

    const rating = r.rating247Raw || (r.rating ? r.rating * 100 : 0);
    composite.push({
      ...r,
      source: 'composite',
      compositeRating: Math.round(rating * 10) / 10,
      compositeStars: r.stars || 0,
      stars: r.stars || 0,
      rating247Raw: Math.round(rating * 10) / 10,
      avgSourceRank: r.nationalRank || 9999,
      sourceCount: 1,
      ratings: [{ source: '247', rating, stars: r.stars || 0, rank: r.nationalRank || 0 }],
    });
  }

  // Enrich with committedTo from CFBD and committedSchoolLogo from 247
  const cfbdData = loadCfbdRecruits(year);
  const cfbdByName = new Map<string, string>();
  cfbdData.forEach(r => { if (r.committedTo) cfbdByName.set(normalizeName(r.name), r.committedTo); });

  const logoByName = new Map<string, string>();
  data247.forEach(r => { if (r.committedSchoolLogo) logoByName.set(normalizeName(r.name), r.committedSchoolLogo); });

  composite.forEach(r => {
    if (!r.committedTo) {
      r.committedTo = cfbdByName.get(normalizeName(r.name)) || '';
    }
    if (!r.committedSchoolLogo) {
      r.committedSchoolLogo = logoByName.get(normalizeName(r.name)) || '';
    }
  });

  // Sort by average source rank (lower = better)
  // Tiebreaker 1: more sources ranked = more reliable
  // Tiebreaker 2: higher composite rating
  composite.sort((a, b) => {
    const rankDiff = (a.avgSourceRank || 9999) - (b.avgSourceRank || 9999);
    if (rankDiff !== 0) return rankDiff;
    const srcDiff = (b.sourceCount || 0) - (a.sourceCount || 0);
    if (srcDiff !== 0) return srcDiff;
    return (b.compositeRating || 0) - (a.compositeRating || 0);
  });

  // Assign PFSN composite ranks
  composite.forEach((r, i) => {
    r.compositeRank = i + 1;
    r.nationalRank = i + 1;
  });

  cache[cacheKey] = { data: composite, timestamp: now };
  return composite;
}

// Load raw JSON file (not normalized — for reading On3's native schema)
function loadRawJson(relativePath: string): Record<string, unknown> | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', relativePath);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function loadCfbdRecruits(year: number): Recruit[] {
  const cacheKey = `cfbd-${year}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  const filePath = path.join(process.cwd(), 'public', 'data', 'cfbd', `recruits-${year}.json`);

  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed : [];

    // Map CFBD schema to our Recruit interface
    const recruits: Recruit[] = data.map((r: Record<string, unknown>, i: number) => ({
      id: typeof r.id === 'string' ? parseInt(String(r.id).replace('cfbd_', '')) || i : (r.id as number) || i,
      name: (r.name as string) || '',
      position: normalizePosition((r.position as string) || ''),
      city: (r.hometown as string) || '',
      state: (r.state as string) || '',
      height: (r.height as string) || '',
      weight: (r.weight as number) || 0,
      highSchool: (r.school as string) || '',
      classYear: (r.classYear as number) || year,
      stars: (r.stars as number) || 0,
      rating: (r.rating as number) || 0,
      nationalRank: (r.ranking as number) || i + 1,
      positionRank: 0,
      stateRank: 0,
      imageUrl: '',
      status: (r.status as string) || '',
      commitStatus: r.committedTo ? 'committed' : '',
      committedTo: (r.committedTo as string) || '',
      committedSchoolLogo: '',
      source: 'cfbd',
    }));

    cache[cacheKey] = { data: recruits, timestamp: now };
    return recruits;
  } catch {
    return [];
  }
}

// Cached FBS school name set (static, computed once)
let cachedFbsSchoolNames: Set<string> | null = null;
const CFB_HQ_POINTS: Record<number, number> = { 5: 160, 4: 70, 3: 30, 2: 12, 1: 4, 0: 1 };

function getFbsSchoolNames(): Set<string> {
  if (cachedFbsSchoolNames) return cachedFbsSchoolNames;

  const FBS_CONFERENCES = new Set(['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent']);
  const names = new Set<string>();
  allTeams.filter(t => FBS_CONFERENCES.has(t.conference)).forEach(t => {
    names.add(t.id.toLowerCase());
    const nameBase = t.name.split(' ').slice(0, -1).join(' ').toLowerCase();
    if (nameBase) names.add(nameBase);
    names.add(t.name.toLowerCase());
  });
  // CFBD uses short names — add known aliases
  ['app state', 'appalachian state', 'hawai\'i', 'hawaii', 'san josé state', 'san jose state',
   'florida atlantic', 'fau', 'middle tennessee', 'mtsu', 'uconn', 'connecticut',
   'ul monroe', 'louisiana-monroe', 'south florida', 'usf', 'umass', 'massachusetts',
  ].forEach(k => names.add(k));

  cachedFbsSchoolNames = names;
  return names;
}

function isFbsSchool(school: string): boolean {
  const schoolLower = school.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, '');
  return getFbsSchoolNames().has(schoolLower);
}

// Cache available years (filesystem doesn't change at runtime)
let cachedYears: number[] | null = null;

function getAvailableYears(): number[] {
  if (cachedYears) return cachedYears;

  const years = new Set<number>();

  const scrapedDir = path.join(process.cwd(), 'public', 'data', 'scraped');
  if (fs.existsSync(scrapedDir)) {
    fs.readdirSync(scrapedDir).forEach(f => {
      const match = f.match(/247-recruits-(\d{4})\.json/);
      if (match) years.add(parseInt(match[1]));
    });
  }

  const cfbdDir = path.join(process.cwd(), 'public', 'data', 'cfbd');
  if (fs.existsSync(cfbdDir)) {
    fs.readdirSync(cfbdDir).forEach(f => {
      const match = f.match(/recruits-(\d{4})\.json/);
      if (match) years.add(parseInt(match[1]));
    });
  }

  cachedYears = [...years].sort((a, b) => b - a);
  return cachedYears;
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = parseInt(searchParams.get('year') || '2026');
    const source = searchParams.get('source') || 'composite'; // composite, 247, espn, on3
    const position = searchParams.get('position') || '';
    const stars = searchParams.get('stars') || '';
    const state = searchParams.get('state') || '';
    const search = searchParams.get('search') || '';
    const committed = searchParams.get('committed') || '';
    const teamFilter = searchParams.get('team') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // View: team-rankings — handle early with CFBD data (has committedTo)
    const view = searchParams.get('view') || '';
    if (view === 'team-rankings') {
      // Check viewCache first
      const teamRankCacheKey = `team-rankings-${year}`;
      if (viewCache[teamRankCacheKey] && Date.now() - viewCache[teamRankCacheKey].timestamp < CACHE_TTL) {
        return NextResponse.json(viewCache[teamRankCacheKey].data, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
        });
      }

      // Use CFBD data for team rankings — it has committedTo as text
      // and covers all star tiers including 2-star and below
      const baseRecruits = loadCfbdRecruits(year);

      const committed_recruits = baseRecruits.filter(r =>
        r.committedTo && r.commitStatus === 'committed'
      );

      // No cross-reference needed — CFBD data already has committedTo

      const teamMap = new Map<string, {
        school: string;
        commits: Recruit[];
        totalStars: number;
        fiveStars: number;
        fourStars: number;
        threeStars: number;
        twoStars: number;
        oneStars: number;
        zeroStars: number;
        totalRating: number;
      }>();

      for (const r of committed_recruits) {
        const school = r.committedTo || '';
        if (!school) continue;

        if (!isFbsSchool(school)) continue;
        const entry = teamMap.get(school) || { school, commits: [] as Recruit[], totalStars: 0, fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStars: 0, zeroStars: 0, totalRating: 0 };
        entry.commits.push(r);
        entry.totalStars += (r.stars || 0);
        if (r.stars === 5) entry.fiveStars++;
        else if (r.stars === 4) entry.fourStars++;
        else if (r.stars === 3) entry.threeStars++;
        else if (r.stars === 2) entry.twoStars++;
        else if (r.stars === 1) entry.oneStars++;
        else entry.zeroStars++;
        entry.totalRating += CFB_HQ_POINTS[r.stars || 0] || 1;
        teamMap.set(school, entry);
      }

      const teamRankings = [...teamMap.values()]
        .map(t => ({
          school: t.school,
          totalCommits: t.commits.length,
          avgStars: t.commits.length > 0 ? Math.round((t.totalStars / t.commits.length) * 10) / 10 : 0,
          fiveStars: t.fiveStars,
          fourStars: t.fourStars,
          threeStars: t.threeStars,
          twoStars: t.twoStars,
          oneStars: t.oneStars,
          zeroStars: t.zeroStars,
          compositePoints: Math.round(t.totalRating * 10) / 10,
          topRecruit: (() => {
            const top = t.commits.sort((a, b) => (b.stars || 0) - (a.stars || 0))[0];
            if (!top) return '';
            return `${top.name}, ${top.position}, ${top.stars || 0}★`;
          })(),
        }))
        .sort((a, b) => b.compositePoints - a.compositePoints)
        .map((t, i) => ({ ...t, rank: i + 1 }));

      const availableYears = getAvailableYears();
      const teamRankResult = {
        teamRankings,
        total: teamRankings.length,
        availableYears,
      };
      viewCache[teamRankCacheKey] = { data: teamRankResult, timestamp: Date.now() };
      return NextResponse.json(teamRankResult, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
      });
    }

    // View: pipeline — multi-year aggregate of recruiting by school
    if (view === 'pipeline') {
      const yearMin = parseInt(searchParams.get('yearMin') || '2000');
      const yearMax = parseInt(searchParams.get('yearMax') || '2026');
      const posFilter = searchParams.get('position') || '';
      const availableYears = getAvailableYears();

      // Check pipeline cache
      const pipelineCacheKey = `pipeline-${yearMin}-${yearMax}-${posFilter}`;
      if (viewCache[pipelineCacheKey] && Date.now() - viewCache[pipelineCacheKey].timestamp < CACHE_TTL) {
        return NextResponse.json(viewCache[pipelineCacheKey].data, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
        });
      }

      interface PipelineSchool {
        school: string;
        totalRecruits: number;
        totalScore: number;
        fiveStars: number;
        fourStars: number;
        threeStars: number;
        totalStars: number;
        yearCount: number;
        bestYear: number;
        bestYearScore: number;
        classByYear: Record<number, { recruits: number; score: number; fiveStars: number; avgStars: number }>;
      }

      const schoolMap = new Map<string, PipelineSchool>();
      const allPositions = new Set<string>();

      for (let y = yearMin; y <= yearMax; y++) {
        const recruits = loadCfbdRecruits(y);
        const committed = recruits.filter(r => r.committedTo && r.commitStatus === 'committed');

        for (const r of committed) {
          if (!isFbsSchool(r.committedTo!)) continue;
          if (r.position) allPositions.add(r.position);
          if (posFilter && r.position !== posFilter) continue;

          const school = r.committedTo!;
          const entry = schoolMap.get(school) || {
            school, totalRecruits: 0, totalScore: 0, fiveStars: 0, fourStars: 0,
            threeStars: 0, totalStars: 0, yearCount: 0, bestYear: 0, bestYearScore: 0,
            classByYear: {},
          };

          entry.totalRecruits++;
          entry.totalScore += CFB_HQ_POINTS[r.stars || 0] || 1;
          entry.totalStars += (r.stars || 0);
          if (r.stars === 5) entry.fiveStars++;
          else if (r.stars === 4) entry.fourStars++;
          else if (r.stars === 3) entry.threeStars++;

          if (!entry.classByYear[y]) {
            entry.classByYear[y] = { recruits: 0, score: 0, fiveStars: 0, avgStars: 0 };
            entry.yearCount++;
          }
          entry.classByYear[y].recruits++;
          entry.classByYear[y].score += CFB_HQ_POINTS[r.stars || 0] || 1;
          if (r.stars === 5) entry.classByYear[y].fiveStars++;

          schoolMap.set(school, entry);
        }
      }

      // Calculate best year and avg stars per year
      const pipeline = [...schoolMap.values()].map(s => {
        let bestYear = 0, bestYearScore = 0;
        for (const [yr, cls] of Object.entries(s.classByYear)) {
          cls.avgStars = cls.recruits > 0 ? Math.round((cls.score / cls.recruits) * 10) / 10 : 0;
          if (cls.score > bestYearScore) { bestYearScore = cls.score; bestYear = parseInt(yr); }
        }
        return {
          school: s.school,
          totalRecruits: s.totalRecruits,
          totalScore: s.totalScore,
          fiveStars: s.fiveStars,
          fourStars: s.fourStars,
          threeStars: s.threeStars,
          avgStars: s.totalRecruits > 0 ? Math.round((s.totalStars / s.totalRecruits) * 10) / 10 : 0,
          avgClassScore: s.yearCount > 0 ? Math.round(s.totalScore / s.yearCount) : 0,
          bestYear,
          bestYearScore,
          classByYear: s.classByYear,
        };
      })
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((s, i) => ({ ...s, rank: i + 1 }));

      const pipelineResult = {
        pipeline,
        total: pipeline.length,
        availableYears,
        positions: [...allPositions].sort(),
      };

      // Cache the pipeline result
      viewCache[pipelineCacheKey] = { data: pipelineResult, timestamp: Date.now() };

      return NextResponse.json(pipelineResult, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
      });
    }

    // Load recruits — composite enriches committedTo from On3 slugs + CFBD,
    // so team filtering works with all sources consistently
    let recruits: Recruit[];
    if (source === 'composite') {
      recruits = buildComposite(year);
      if (recruits.length === 0) recruits = loadCfbdRecruits(year);
    } else {
      recruits = loadRecruits(year, source);
      if (recruits.length === 0) recruits = loadCfbdRecruits(year);
    }

    // Extract filter options from the full dataset BEFORE applying filters
    // (avoids the double-load that getFilterOptions would cause)
    const stateSet = new Set(recruits.map(r => normalizeState(r.state)).filter(Boolean));
    const usStates = [...stateSet].filter(s => s !== 'Non-US').sort();
    if (stateSet.has('Non-US')) usStates.push('Non-US');
    const allPositionOptions = [...new Set(recruits.map(r => r.position).filter(Boolean))].sort();

    // Apply filters (support comma-separated multi-select values)
    if (position) {
      const posSet = new Set(position.split(','));
      recruits = recruits.filter(r => posSet.has(r.position));
    }
    if (stars) {
      const starSet = new Set(stars.split(',').map(Number));
      recruits = recruits.filter(r => starSet.has(r.stars || 0));
    }
    if (state) {
      const stateSet = new Set(state.split(','));
      recruits = recruits.filter(r => stateSet.has(normalizeState(r.state)));
    }
    if (search) {
      const q = search.toLowerCase();
      recruits = recruits.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.highSchool?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q)
      );
    }
    // Team filter: match by team ID against committedTo or school logo URL
    if (teamFilter) {
      const teamLower = teamFilter.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      // Also try without spaces for matching
      const teamCompact = teamLower.replace(/\s/g, '');
      recruits = recruits.filter(r => {
        try {
          // Match CFBD committedTo field (e.g., "Alabama", "Ohio State")
          if (r.committedTo) {
            const committedLower = r.committedTo.toLowerCase().replace(/[^a-z\s]/g, '').trim();
            const committedCompact = committedLower.replace(/\s/g, '');
            if (committedLower === teamLower || committedCompact === teamCompact) return true;
          }
          // Match 247 committed school logo URL (often contains school abbreviation)
          if (r.committedSchoolLogo) {
            const logoLower = r.committedSchoolLogo.toLowerCase();
            if (logoLower.includes(teamCompact)) return true;
          }
          return false;
        } catch {
          return false;
        }
      });
    }
    if (committed === 'enrolled') {
      recruits = recruits.filter(r => r.status === 'Enrolled');
    } else if (committed === 'signed') {
      recruits = recruits.filter(r => r.status === 'Signed');
    } else if (committed === 'committed') {
      recruits = recruits.filter(r =>
        r.commitStatus === 'committed' || r.status === 'Enrolled' || r.status === 'Signed' || r.status === 'HardCommit'
      );
    } else if (committed === 'uncommitted') {
      recruits = recruits.filter(r =>
        r.commitStatus !== 'committed' && r.status !== 'Enrolled' && r.status !== 'Signed' && r.status !== 'HardCommit'
      );
    }

    // Summary stats for the current filtered set
    const starDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    const posDist: Record<string, number> = {};
    for (const r of recruits) {
      starDist[r.stars || 0] = (starDist[r.stars || 0] || 0) + 1;
      posDist[r.position] = (posDist[r.position] || 0) + 1;
    }

    const total = recruits.length;
    const start = (page - 1) * limit;
    const paged = recruits.slice(start, start + limit);

    const availableYears = getAvailableYears();

    return NextResponse.json({
      recruits: paged,
      total,
      page,
      limit,
      starDistribution: starDist,
      positionDistribution: posDist,
      totalPages: Math.ceil(total / limit),
      availableYears,
      states: usStates,
      positions: allPositionOptions,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Recruits API error:', error);
    return NextResponse.json({ error: 'Failed to load recruit data' }, { status: 500 });
  }
}
