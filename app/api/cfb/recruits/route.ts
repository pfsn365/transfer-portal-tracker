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
};

function normalizePosition(pos: string): string {
  if (!pos) return 'ATH';
  return POSITION_MAP[pos.toUpperCase()] || pos.toUpperCase();
}

// Module-level cache
const cache: Record<string, { data: Recruit[]; timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 hour

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
    const raw_recruits: Recruit[] = parsed.recruits || parsed;
    // Normalize positions only — keep original state for display
    const recruits = raw_recruits.map(r => ({
      ...r,
      position: normalizePosition(r.position),
    }));

    cache[cacheKey] = { data: recruits, timestamp: now };
    return recruits;
  } catch {
    return [];
  }
}

// Normalize a recruit name for matching across sources
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

// Build composite rankings by merging recruits across all 3 sources
function buildComposite(year: number): Recruit[] {
  const cacheKey = `composite-${year}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  const sources247 = loadRecruits(year, '247');
  const sourcesEspn = loadRecruits(year, 'espn');
  const sourcesOn3 = loadRecruits(year, 'on3');

  // Use 247 as the base (largest dataset at 1500 recruits)
  const nameMap = new Map<string, {
    base: Recruit;
    ratings: { source: string; rating: number; stars: number; rank: number }[];
  }>();

  // Index 247 recruits
  for (const r of sources247) {
    const key = normalizeName(r.name);
    nameMap.set(key, {
      base: r,
      ratings: [{
        source: '247',
        rating: r.rating247Raw || (r.rating * 100),
        stars: r.stars || 0,
        rank: r.nationalRank || 0,
      }],
    });
  }

  // Match ESPN recruits
  for (const r of sourcesEspn) {
    const key = normalizeName(r.name);
    const existing = nameMap.get(key);
    const ratingVal = r.rating247Raw || (r.rating ? r.rating * 100 : 0);
    if (existing) {
      existing.ratings.push({
        source: 'espn',
        rating: ratingVal,
        stars: r.stars || 0,
        rank: r.nationalRank || 0,
      });
    } else {
      nameMap.set(key, {
        base: r,
        ratings: [{
          source: 'espn',
          rating: ratingVal,
          stars: r.stars,
          rank: r.nationalRank,
        }],
      });
    }
  }

  // Match On3 recruits
  for (const r of sourcesOn3) {
    const key = normalizeName(r.name);
    const existing = nameMap.get(key);
    const ratingVal = r.rating247Raw || (r.rating ? r.rating * 100 : 0);
    if (existing) {
      existing.ratings.push({
        source: 'on3',
        rating: ratingVal,
        stars: r.stars || 0,
        rank: r.nationalRank || 0,
      });
    } else {
      nameMap.set(key, {
        base: r,
        ratings: [{
          source: 'on3',
          rating: ratingVal,
          stars: r.stars,
          rank: r.nationalRank,
        }],
      });
    }
  }

  // Build composite array
  const composite: Recruit[] = [];
  for (const { base, ratings } of nameMap.values()) {
    const validRatings = ratings.filter(r => r.rating > 0);
    const avgRating = validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length
      : 0;
    const validStars = validRatings.filter(r => r.stars != null && r.stars > 0);
    const avgStars = validStars.length > 0
      ? Math.round(validStars.reduce((sum, r) => sum + r.stars, 0) / validStars.length)
      : (base.stars || 0);

    composite.push({
      ...base,
      source: 'composite',
      compositeRating: Math.round(avgRating * 10) / 10,
      compositeStars: avgStars,
      stars: avgStars,
      rating247Raw: Math.round(avgRating * 10) / 10,
      ratings,
    });
  }

  // Sort by composite rating descending
  composite.sort((a, b) => (b.compositeRating || 0) - (a.compositeRating || 0));

  // Assign composite ranks
  composite.forEach((r, i) => {
    r.compositeRank = i + 1;
    r.nationalRank = i + 1;
  });

  cache[cacheKey] = { data: composite, timestamp: now };
  return composite;
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

// Cache filter options per year/source
const filterOptionsCache: Record<string, { states: string[]; positions: string[]; timestamp: number }> = {};

function getFilterOptions(year: number, source: string): { states: string[]; positions: string[] } {
  const cacheKey = `opts-${source}-${year}`;
  const now = Date.now();

  if (filterOptionsCache[cacheKey] && now - filterOptionsCache[cacheKey].timestamp < CACHE_TTL) {
    return filterOptionsCache[cacheKey];
  }

  const allRecruits = source === 'composite' ? buildComposite(year) : loadRecruits(year, source);
  const stateSet = new Set(allRecruits.map(r => normalizeState(r.state)).filter(Boolean));
  const usStates = [...stateSet].filter(s => s !== 'Non-US').sort();
  if (stateSet.has('Non-US')) usStates.push('Non-US');
  const positions = [...new Set(allRecruits.map(r => r.position).filter(Boolean))].sort();

  const result = { states: usStates, positions, timestamp: now };
  filterOptionsCache[cacheKey] = result;
  return result;
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
      // Always use CFBD data for team rankings — it has committedTo as text
      // and covers all star tiers including 2-star and below
      const baseRecruits = loadCfbdRecruits(year);

      // FBS school name matching — build comprehensive lookup
      const FBS_CONFERENCES = new Set(['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent']);
      const fbsSchoolNames = new Set<string>();
      allTeams.filter(t => FBS_CONFERENCES.has(t.conference)).forEach(t => {
        fbsSchoolNames.add(t.id.toLowerCase());
        const nameBase = t.name.split(' ').slice(0, -1).join(' ').toLowerCase();
        if (nameBase) fbsSchoolNames.add(nameBase);
        // Also add the full name
        fbsSchoolNames.add(t.name.toLowerCase());
      });
      // CFBD uses short names that don't always match — add known aliases
      const CFBD_ALIASES: Record<string, boolean> = {
        'app state': true, 'appalachian state': true,
        'hawai\'i': true, 'hawaii': true,
        'san josé state': true, 'san jose state': true,
        'florida atlantic': true, 'fau': true,
        'middle tennessee': true, 'mtsu': true,
        'uconn': true, 'connecticut': true,
        'ul monroe': true, 'louisiana-monroe': true,
        'south florida': true, 'usf': true,
        'umass': true, 'massachusetts': true,
      };
      Object.keys(CFBD_ALIASES).forEach(k => fbsSchoolNames.add(k));

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

        // Filter to FBS only — normalize and match against known FBS school names
        const schoolLower = school.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, '');
        if (!fbsSchoolNames.has(schoolLower)) continue;
        const entry = teamMap.get(school) || { school, commits: [] as Recruit[], totalStars: 0, fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStars: 0, zeroStars: 0, totalRating: 0 };
        entry.commits.push(r);
        entry.totalStars += (r.stars || 0);
        if (r.stars === 5) entry.fiveStars++;
        else if (r.stars === 4) entry.fourStars++;
        else if (r.stars === 3) entry.threeStars++;
        else if (r.stars === 2) entry.twoStars++;
        else if (r.stars === 1) entry.oneStars++;
        else entry.zeroStars++;
        // CFB HQ Score: weighted star system
        const CFB_HQ_POINTS: Record<number, number> = { 5: 160, 4: 70, 3: 30, 2: 12, 1: 4, 0: 1 };
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
          topRecruit: t.commits.sort((a, b) => (b.stars || 0) - (a.stars || 0))[0]?.name || '',
        }))
        .sort((a, b) => b.compositePoints - a.compositePoints)
        .map((t, i) => ({ ...t, rank: i + 1 }));

      const availableYears = getAvailableYears();
      return NextResponse.json({
        teamRankings,
        total: teamRankings.length,
        availableYears,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
      });
    }

    // Load recruits — use CFBD data for team filtering (has committedTo field)
    // or for historical years without scraped data
    let recruits: Recruit[];
    if (teamFilter) {
      // Always use CFBD for team filtering since it has committedTo as text
      recruits = loadCfbdRecruits(year);
    } else if (source === 'composite') {
      recruits = buildComposite(year);
      if (recruits.length === 0) recruits = loadCfbdRecruits(year);
    } else {
      recruits = loadRecruits(year, source);
      if (recruits.length === 0) recruits = loadCfbdRecruits(year);
    }

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
      recruits = recruits.filter(r => r.status === 'Enrolled' || r.status === 'Signed');
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
    const { states, positions } = getFilterOptions(year, source);

    return NextResponse.json({
      recruits: paged,
      total,
      page,
      limit,
      starDistribution: starDist,
      positionDistribution: posDist,
      totalPages: Math.ceil(total / limit),
      availableYears,
      states,
      positions,
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
