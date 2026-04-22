import { NextRequest, NextResponse } from 'next/server';
import { getTeamBySlug } from '@/data/teams';
import { getEspnIdFromSlug } from '@/utils/espnTeamIds';

// ── ESPN API types ────────────────────────────────────────────────────────────

interface ESPNAthlete {
  id: string;
  displayName: string;
  links?: { href: string; rel: string[] }[];
  injuries?: { status: string }[];
}

interface ESPNPositionEntry {
  position: {
    name: string;
    displayName: string;
    abbreviation: string;
  };
  athletes: ESPNAthlete[];
}

interface ESPNFormation {
  id: string;
  name: string;
  positions: Record<string, ESPNPositionEntry>;
}

interface ESPNDepthChartResponse {
  timestamp: string;
  season?: { year: number };
  depthchart: ESPNFormation[];
}

// ── CFBD API types ────────────────────────────────────────────────────────────

interface CFBDDepthChartEntry {
  season: number;
  team: string;
  formationType: string;
  position: string;
  athleteId: number;
  athleteFirstName: string;
  athleteLastName: string;
  depthOrder: number;
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface DepthChartPlayer {
  name: string;
  slug: string;
  depth: number;
  injuryStatus?: string;
}

export interface DepthChartPosition {
  name: string;
  abbreviation: string;
  players: DepthChartPlayer[];
}

export interface DepthChartData {
  offense: DepthChartPosition[];
  defense: DepthChartPosition[];
  specialTeams: DepthChartPosition[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseInjuryStatus(athlete: ESPNAthlete): string | undefined {
  const status = athlete.injuries?.[0]?.status?.toLowerCase();
  if (!status) return undefined;
  if (status.includes('questionable')) return 'Q';
  if (status.includes('injured reserve') || status === 'ir') return 'IR';
  if (status.includes('out')) return 'O';
  return undefined;
}

function extractSlug(athlete: ESPNAthlete): string {
  const href = athlete.links?.[0]?.href ?? '';
  const match = href.match(/\/id\/\d+\/(.+)$/);
  if (match) return match[1];
  return athlete.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function classifyFormation(name: string): 'offense' | 'defense' | 'specialTeams' {
  const lower = name.toLowerCase();
  if (lower.includes('special')) return 'specialTeams';
  if (lower.includes('offense') || lower.includes('shotgun') || lower.includes('pistol') ||
      lower.includes('i-form') || lower.includes('singleback') || lower.includes('wr') ||
      lower.includes('te') || lower.includes('rb')) return 'offense';
  return 'defense';
}

function classifyCFBDFormation(formationType: string): 'offense' | 'defense' | 'specialTeams' {
  const lower = formationType.toLowerCase();
  if (lower.includes('special')) return 'specialTeams';
  if (lower.includes('offense')) return 'offense';
  return 'defense';
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeAbbreviation(key: string, posEntry: ESPNPositionEntry): string {
  const abbr = posEntry.position.abbreviation;
  const keyUpper = key.toUpperCase();
  if (/^WR\d$/i.test(key)) return keyUpper;
  if (keyUpper === 'PK') return 'K';
  return abbr || keyUpper;
}

const offenseOrder  = ['QB', 'RB', 'FB', 'WR1', 'WR2', 'WR3', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
const defenseOrder  = ['LDE', 'NT', 'RDE', 'LDT', 'RDT', 'DT', 'DE', 'WLB', 'LILB', 'RILB', 'SLB', 'LOLB', 'ROLB', 'MLB', 'LLB', 'RLB', 'LCB', 'RCB', 'NB', 'FS', 'SS'];
const specialOrder  = ['K', 'P', 'LS', 'H', 'KR', 'PR'];

function sortByOrder(positions: DepthChartPosition[], order: string[]) {
  return [...positions].sort((a, b) => {
    const ai = order.indexOf(a.abbreviation);
    const bi = order.indexOf(b.abbreviation);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function isEmptyChart(data: DepthChartData): boolean {
  return data.offense.length === 0 && data.defense.length === 0 && data.specialTeams.length === 0;
}

// ── CFBD fallback ─────────────────────────────────────────────────────────────

async function fetchCFBDDepthChart(teamId: string): Promise<{ positions: DepthChartData; season: number } | null> {
  const apiKey = process.env.CFBD_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.collegefootballdata.com/depth-charts?team=${encodeURIComponent(teamId)}&year=2025&seasonType=regular`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;

  const entries: CFBDDepthChartEntry[] = await response.json();
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const grouped: DepthChartData = { offense: [], defense: [], specialTeams: [] };
  const posMap: Record<string, DepthChartPlayer[]> = {};
  const categoryMap: Record<string, 'offense' | 'defense' | 'specialTeams'> = {};

  for (const entry of entries) {
    const pos = entry.position;
    const category = classifyCFBDFormation(entry.formationType);
    if (!posMap[pos]) {
      posMap[pos] = [];
      categoryMap[pos] = category;
    }
    const name = `${entry.athleteFirstName} ${entry.athleteLastName}`.trim();
    posMap[pos].push({
      name,
      slug: nameToSlug(name),
      depth: entry.depthOrder,
    });
  }

  for (const [pos, players] of Object.entries(posMap)) {
    players.sort((a, b) => a.depth - b.depth);
    const category = categoryMap[pos];
    grouped[category].push({ name: pos, abbreviation: pos, players });
  }

  const positions: DepthChartData = {
    offense:      sortByOrder(grouped.offense,      offenseOrder).slice(0, 12),
    defense:      sortByOrder(grouped.defense,      defenseOrder).slice(0, 12),
    specialTeams: sortByOrder(grouped.specialTeams, specialOrder),
  };

  const season = entries[0]?.season ?? 2025;
  return { positions, season };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const team = getTeamBySlug(slug);
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  const espnId = getEspnIdFromSlug(slug);
  const empty = { positions: { offense: [], defense: [], specialTeams: [] }, season: 2025 };

  // ── ESPN fetch ──────────────────────────────────────────────────────────────
  let espnPositions: DepthChartData | null = null;
  let season = 2025;

  if (espnId) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnId}/depthcharts`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)' },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const espnData: ESPNDepthChartResponse = await response.json();
        const formations = espnData.depthchart;

        if (formations?.length) {
          season = espnData.season?.year ?? 2025;
          const grouped: DepthChartData = { offense: [], defense: [], specialTeams: [] };

          for (const formation of formations) {
            const category = classifyFormation(formation.name);
            for (const [key, posEntry] of Object.entries(formation.positions)) {
              const abbreviation = normalizeAbbreviation(key, posEntry);
              const players: DepthChartPlayer[] = posEntry.athletes.map((athlete, i) => ({
                name: athlete.displayName,
                slug: extractSlug(athlete),
                depth: i + 1,
                injuryStatus: parseInjuryStatus(athlete),
              }));
              if (players.length > 0) {
                grouped[category].push({ name: posEntry.position.displayName, abbreviation, players });
              }
            }
          }

          espnPositions = {
            offense:      sortByOrder(grouped.offense,      offenseOrder).slice(0, 12),
            defense:      sortByOrder(grouped.defense,      defenseOrder).slice(0, 12),
            specialTeams: sortByOrder(grouped.specialTeams, specialOrder),
          };
        }
      }
    } catch {
      // fall through to CFBD
    }
  }

  // ── CFBD fallback ───────────────────────────────────────────────────────────
  if (!espnPositions || isEmptyChart(espnPositions)) {
    const cfbd = await fetchCFBDDepthChart(team.id).catch(() => null);
    if (cfbd && !isEmptyChart(cfbd.positions)) {
      return NextResponse.json({
        positions: cfbd.positions,
        season: cfbd.season,
        lastUpdated: new Date().toISOString(),
        source: 'cfbd',
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
      });
    }
    return NextResponse.json({ ...empty, season });
  }

  return NextResponse.json({
    positions: espnPositions,
    season,
    lastUpdated: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
  });
}
