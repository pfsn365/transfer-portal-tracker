import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DraftPick {
  year: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  nflTeam: string;
}

interface TeamDraftData {
  teamId: string;
  teamSlug: string;
  teamName: string;
  draftPicks: DraftPick[];
}

interface FlatPick extends DraftPick {
  schoolName: string;
  schoolSlug: string;
}

interface PipelineEntry {
  teamName: string;
  teamSlug: string;
  teamId: string;
  totalPicks: number;
  firstRoundPicks: number;
  recentPicks: number;
  picksByDecade: Record<string, number>;
  topPlayers: DraftPick[];
}

function loadAllData(): TeamDraftData[] {
  const draftDir = path.join(process.cwd(), 'data', 'draft');
  const files = fs.readdirSync(draftDir).filter((f: string) => f.endsWith('.json'));

  return files.map((file: string) => {
    const raw = fs.readFileSync(path.join(draftDir, file), 'utf-8');
    return JSON.parse(raw) as TeamDraftData;
  });
}

function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

// Position group mapping for filtering
const POSITION_GROUPS: Record<string, string[]> = {
  'QB': ['QB'],
  'RB': ['RB', 'FB'],
  'WR': ['WR', 'FL'],
  'TE': ['TE', 'E'],
  'OT': ['OT', 'T'],
  'OG': ['OG', 'G'],
  'OC': ['OC', 'C'],
  'OL': ['OT', 'OG', 'OC', 'T', 'G', 'C', 'IOL', 'OL'],
  'DT': ['DT', 'NT'],
  'EDGE': ['DE', 'EDGE'],
  'DL': ['DT', 'NT', 'DE', 'DL'],
  'LB': ['LB', 'ILB', 'OLB'],
  'CB': ['CB', 'NB'],
  'SAF': ['S', 'SS', 'FS', 'SAF'],
  'DB': ['CB', 'NB', 'S', 'SS', 'FS', 'SAF', 'DB'],
  'K/P': ['K', 'P', 'LS'],
};

function buildPipeline(data: TeamDraftData[], positionFilter?: string): PipelineEntry[] {
  const currentYear = new Date().getFullYear();
  const recentCutoff = currentYear - 10;
  const posMatches = positionFilter ? POSITION_GROUPS[positionFilter] || [positionFilter] : null;

  return data
    .map((team) => {
      const picks = posMatches
        ? team.draftPicks.filter((p) => posMatches.includes(p.position))
        : team.draftPicks;
      const firstRoundPicks = picks.filter((p) => p.round === 1);
      const picksByDecade: Record<string, number> = {};

      picks.forEach((p) => {
        const decade = getDecade(p.year);
        picksByDecade[decade] = (picksByDecade[decade] || 0) + 1;
      });

      // Show most recent picks (all rounds) so expandable rows are useful even with position filters
      const topPlayers = [...picks]
        .sort((a, b) => b.year - a.year || a.round - b.round || a.pick - b.pick)
        .slice(0, 5);

      return {
        teamName: team.teamName,
        teamSlug: team.teamSlug,
        teamId: team.teamId,
        totalPicks: picks.length,
        firstRoundPicks: firstRoundPicks.length,
        recentPicks: picks.filter((p) => p.year >= recentCutoff).length,
        picksByDecade,
        topPlayers,
      };
    })
    .sort((a, b) => b.totalPicks - a.totalPicks);
}

function buildHistory(
  data: TeamDraftData[],
  filters: {
    school?: string;
    yearMin?: number;
    yearMax?: number;
    round?: number;
    position?: string;
  }
): { picks: FlatPick[]; total: number } {
  let allPicks: FlatPick[] = [];

  data.forEach((team) => {
    if (filters.school && team.teamSlug !== filters.school) return;

    team.draftPicks.forEach((pick) => {
      if (filters.yearMin && pick.year < filters.yearMin) return;
      if (filters.yearMax && pick.year > filters.yearMax) return;
      if (filters.round && pick.round !== filters.round) return;
      if (filters.position) {
        const posMatches = POSITION_GROUPS[filters.position] || [filters.position];
        if (!posMatches.includes(pick.position)) return;
      }

      allPicks.push({
        ...pick,
        schoolName: team.teamName,
        schoolSlug: team.teamSlug,
      });
    });
  });

  // Sort by year desc, then round asc, then pick asc
  allPicks.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.round !== b.round) return a.round - b.round;
    return a.pick - b.pick;
  });

  return { picks: allPicks, total: allPicks.length };
}

export async function GET(request: NextRequest) {
  try {
    const data = loadAllData();
    const { searchParams } = request.nextUrl;
    const view = searchParams.get('view') || 'history';

    const headers = {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    };

    if (view === 'pipeline') {
      const posFilter = searchParams.get('position') || undefined;
      const pipeline = buildPipeline(data, posFilter);
      return NextResponse.json(pipeline, { headers });
    }

    // Default: history view
    const filters = {
      school: searchParams.get('school') || undefined,
      yearMin: searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin')!) : undefined,
      yearMax: searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax')!) : undefined,
      round: searchParams.get('round') ? parseInt(searchParams.get('round')!) : undefined,
      position: searchParams.get('position') || undefined,
    };

    const result = buildHistory(data, filters);
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Draft data error:', error);
    return NextResponse.json(
      { error: 'Failed to load draft data' },
      { status: 500 }
    );
  }
}
