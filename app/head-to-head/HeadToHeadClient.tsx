'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { allTeams } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import { getApiPath } from '@/utils/api';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';

// ─── Types ────────────────────────────────────────────────────────────────────

type GameType = 'regular' | 'bowl' | 'conf-championship' | 'playoff';

interface H2HGame {
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason';
  neutralSite: boolean;
  venue: string | null;
  notes?: string | null;
  homeTeamId: 'team1' | 'team2';
  team1Points: number | null;
  team2Points: number | null;
  winner: 'team1' | 'team2' | 'tie' | null;
  margin: number | null;
}

function getGameType(g: H2HGame): GameType {
  const n = (g.notes ?? '').toLowerCase();
  if (n.includes('playoff') || n.includes('national championship')) return 'playoff';
  if (n.includes('championship')) return 'conf-championship';
  if (g.seasonType === 'regular') return 'regular';
  return 'bowl';
}

function getGameLabel(g: H2HGame): string {
  const type = getGameType(g);
  if (type === 'regular') return 'Regular';
  if (type === 'playoff') {
    const n = g.notes ?? '';
    if (n.toLowerCase().includes('national championship')) return 'CFP Title';
    if (n.toLowerCase().includes('semifinal')) return 'CFP Semi';
    if (n.toLowerCase().includes('quarterfinal')) return 'CFP Qtr';
    if (n.toLowerCase().includes('first round')) return 'CFP R1';
    return 'Playoff';
  }
  if (type === 'conf-championship') {
    const n = g.notes ?? '';
    const conf = n.replace(/championship game?/i, '').replace(/championship/i, '').trim();
    return conf || 'Conf. Champ';
  }
  return g.notes ?? 'Bowl';
}

interface SplitRecord { team1W: number; team2W: number; t: number; }

interface H2HStats {
  team1Wins: number;
  team2Wins: number;
  ties: number;
  totalGames: number;
  team1WinPct: number;
  currentStreak: { team: 'team1' | 'team2'; count: number } | null;
  longestStreak1: number;
  longestStreak2: number;
  team1AvgMargin: number;
  team2AvgMargin: number;
  atTeam1: SplitRecord;
  atTeam2: SplitRecord;
  neutral: SplitRecord;
  regularSeason: SplitRecord;
  postseason: SplitRecord;
  decadeRecords: Record<string, { team1W: number; team2W: number; t: number }>;
  last5: { team1W: number; team2W: number };
  last10: { team1W: number; team2W: number };
  biggestTeam1Win: H2HGame | null;
  biggestTeam2Win: H2HGame | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS: Record<string, string> = {
  // SEC
  alabama: '#9E1B32', arkansas: '#9D2235', auburn: '#0C2340', florida: '#0021A5',
  georgia: '#BA0C2F', kentucky: '#0033A0', lsu: '#461D7C', 'ole miss': '#CE1126',
  'mississippi state': '#660000', missouri: '#F1B82D', oklahoma: '#841617',
  'south carolina': '#73000A', tennessee: '#FF8200', texas: '#BF5700',
  'texas a&m': '#500000', vanderbilt: '#866D4B',
  // Big Ten
  illinois: '#E84A27', indiana: '#990000', iowa: '#FFCD00', maryland: '#E03A3E',
  michigan: '#00274C', 'michigan state': '#18453B', minnesota: '#7A0019',
  nebraska: '#D00000', northwestern: '#4E2A84', 'ohio state': '#BB0000',
  oregon: '#154733', 'penn state': '#041E42', purdue: '#CEB888', rutgers: '#CC0033',
  ucla: '#2D68C4', usc: '#990000', washington: '#4B2E83', wisconsin: '#C5050C',
  // Big 12
  arizona: '#CC0033', 'arizona state': '#8C1D40', baylor: '#154734', byu: '#002E5D',
  cincinnati: '#E00122', colorado: '#CFB87C', houston: '#C8102E',
  'iowa state': '#C8102E', kansas: '#0051BA', 'kansas state': '#512888',
  'oklahoma state': '#FF7300', tcu: '#4D1979', 'texas tech': '#CC0000',
  ucf: '#BA9B37', utah: '#CC0000', 'west virginia': '#002855',
  // ACC
  'boston college': '#98002E', california: '#003262', clemson: '#F56600',
  duke: '#003087', 'florida state': '#782F40', 'georgia tech': '#B3A369',
  louisville: '#AD0000', miami: '#F47321', 'north carolina': '#4B9CD3',
  'north carolina state': '#CC0000', pittsburgh: '#003594', smu: '#CC0000',
  stanford: '#8C1515', syracuse: '#F76900', virginia: '#232D4B',
  'virginia tech': '#630031', 'wake forest': '#9E7E38',
  // American / AAC
  army: '#000000', 'east carolina': '#592A8A', fau: '#003366',
  memphis: '#003087', navy: '#00205B', 'north texas': '#00853E',
  usf: '#006747', temple: '#9D2235', tulane: '#006747', tulsa: '#002D72',
  uab: '#1E6B52', utsa: '#F15A22', charlotte: '#046A38', rice: '#002469',
  // Mountain West
  'air force': '#003087', 'boise state': '#0033A0', 'colorado state': '#1E4D2B',
  'fresno state': '#CC0000', hawaii: '#024731', nevada: '#003366',
  'new mexico': '#BA0C2F', 'san diego state': '#C41230', 'san jose state': '#0055A2',
  unlv: '#CF0A2C', 'utah state': '#0F2439', wyoming: '#492F24',
  // Sun Belt
  'old dominion': '#003057', 'appalachian state': '#000000',
  'arkansas state': '#CC0000', 'coastal carolina': '#006F51',
  'georgia southern': '#041E42', 'georgia state': '#0039A6',
  louisiana: '#C41230', 'louisiana-monroe': '#880000', marshall: '#009639',
  'south alabama': '#00205B', 'southern miss': '#FFC72C',
  'texas state': '#501214', troy: '#8A0000', 'james madison': '#450084',
  // Conference USA
  liberty: '#002147', 'louisiana tech': '#002F8B',
  'middle tennessee state': '#0066CC', 'new mexico state': '#861F41',
  utep: '#FF7F00', 'western kentucky': '#C60C30',
  // MAC
  akron: '#041E42', 'ball state': '#BA0C2F', 'bowling green': '#4B2C00',
  buffalo: '#005BBB', 'central michigan': '#6A0032', 'eastern michigan': '#006F51',
  'kent state': '#002664', massachusetts: '#881C1C', 'miami (oh)': '#C41230',
  'northern illinois': '#BA0C2F', ohio: '#006A4D', toledo: '#003049',
  'western michigan': '#6C4023',
  // Independent
  'notre dame': '#0C2340', connecticut: '#000E2F',
};

// ─── Color conflict detection ─────────────────────────────────────────────────
const CLASH_GRAY = '#374151';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function colorDistance(a: string, b: string): number {
  const [r1,g1,b1] = hexToRgb(a);
  const [r2,g2,b2] = hexToRgb(b);
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function getTeamColors(t1Id: string, t2Id: string): [string, string] {
  const c1 = teamColor(t1Id);
  const c2 = teamColor(t2Id);
  return colorDistance(c1, c2) < 90 ? [c1, CLASH_GRAY] : [c1, c2];
}

const DISPLAY_OVERRIDES: Record<string, string> = {
  lsu: 'LSU', byu: 'BYU', usc: 'USC', ucf: 'UCF', uab: 'UAB',
  usf: 'USF', utsa: 'UTSA', utep: 'UTEP', unlv: 'UNLV', fau: 'FAU',
  smu: 'SMU', tcu: 'TCU', ucla: 'UCLA',
};

const FBS_CONFERENCES = [
  'SEC', 'Big Ten', 'Big 12', 'ACC', 'American',
  'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortName(id: string): string {
  if (!id) return '';
  if (DISPLAY_OVERRIDES[id]) return DISPLAY_OVERRIDES[id];
  if (id === 'texas a&m') return 'Texas A&M';
  return id.replace(/\b\w/g, c => c.toUpperCase());
}

function teamColor(id: string): string {
  return TEAM_COLORS[id.toLowerCase()] ?? '#0050A0';
}

export { teamIdToSlug, slugToTeamId } from './teamSlug';
import { teamIdToSlug } from './teamSlug';

// ─── Score Margin Chart ───────────────────────────────────────────────────────

const PAD_LEFT = 36;
const PAD_RIGHT = 16;
const CHART_HALF = 100;
const PAD_TOP = 20;
const PAD_BTM = 28;
const SVG_H = PAD_TOP + CHART_HALF * 2 + PAD_BTM;
const CENTER_Y = PAD_TOP + CHART_HALF;
const MAX_PT = 56;
const PX_PER_PT = CHART_HALF / MAX_PT;

function ScoreMarginChart({ games, t1Id, t2Id }: { games: H2HGame[]; t1Id: string; t2Id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgW, setSvgW] = useState(800);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; game: H2HGame } | null>(null);
  const [c1, c2] = getTeamColors(t1Id, t2Id);

  const chartGames = useMemo(
    () => [...games].filter(g => g.winner !== null).sort((a, b) => a.season - b.season || a.week - b.week),
    [games]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    setSvgW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (!chartGames.length) return null;

  const chartW = svgW - PAD_LEFT - PAD_RIGHT;
  const minYear = chartGames[0].season;
  const maxYear = chartGames[chartGames.length - 1].season;
  const yearSpan = Math.max(maxYear - minYear, 1);
  const barW = Math.max(3, Math.min(12, (chartW / chartGames.length) * 0.55));

  // Track same-year offsets so overlapping games don't stack exactly
  const yearOffsets: number[] = [];
  const yearIdx = new Map<number, number>();
  chartGames.forEach(g => {
    const i = yearIdx.get(g.season) ?? 0;
    yearOffsets.push(i);
    yearIdx.set(g.season, i + 1);
  });

  const getBarX = (season: number, offset = 0) =>
    PAD_LEFT + ((season - minYear) / yearSpan) * chartW + offset * (barW + 1);

  const hitTest = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    let closest = -1, minDist = Infinity;
    chartGames.forEach((g, i) => {
      const bx = getBarX(g.season, yearOffsets[i]) + barW / 2;
      const d = Math.abs(x - bx);
      if (d < minDist) { minDist = d; closest = i; }
    });
    if (closest >= 0 && minDist < barW * 4) {
      setTooltip({ x, y: clientY - rect.top, game: chartGames[closest] });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => hitTest(e.clientX, e.clientY);
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const t = e.touches[0];
    hitTest(t.clientX, t.clientY);
  };

  // Decade labels: every 10 years across the full span
  const startDecade = Math.ceil(minYear / 10) * 10;
  const decadeLabels: number[] = [];
  for (let y = startDecade; y <= maxYear; y += 10) decadeLabels.push(y);

  const yTicks = [MAX_PT, MAX_PT / 2, 0, -MAX_PT / 2, -MAX_PT];

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score Margin by Game</p>
        <p className="text-xs text-gray-400 mt-0.5">Bars above = {shortName(t1Id)} wins · below = {shortName(t2Id)} wins · height = point margin</p>
      </div>
      <div ref={containerRef}>
        <svg
          ref={svgRef}
          width={svgW}
          height={SVG_H}
          style={{ display: 'block', touchAction: 'pan-y' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setTooltip(null)}
        >
          {/* Y-axis grid lines + labels */}
          {yTicks.map(pt => {
            const y = CENTER_Y - pt * PX_PER_PT;
            return (
              <g key={pt}>
                <line x1={PAD_LEFT - 4} y1={y} x2={svgW - PAD_RIGHT} y2={y}
                  stroke={pt === 0 ? '#9ca3af' : '#f3f4f6'} strokeWidth={pt === 0 ? 1 : 1}
                  strokeDasharray={pt !== 0 ? '3 3' : undefined} />
                {pt !== 0 && (
                  <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                    {Math.abs(pt)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Bars */}
          {chartGames.map((g, i) => {
            const x = getBarX(g.season, yearOffsets[i]);
            const margin = g.margin ?? 0;
            const absH = Math.min(Math.abs(margin) * PX_PER_PT, CHART_HALF - 2);
            const barH = Math.max(absH, 2);
            const isT1Win = g.winner === 'team1';
            const isTie = g.winner === 'tie';
            const barY = isTie ? CENTER_Y - 1 : isT1Win ? CENTER_Y - barH : CENTER_Y;
            const fill = isTie ? '#d1d5db' : isT1Win ? c1 : c2;
            const isHovered = tooltip?.game === g;
            const gtype = getGameType(g);
            const strokeColor = gtype === 'playoff' ? '#FBBF24' : gtype === 'conf-championship' ? '#6EE7B7' : 'none';
            const strokeW = (gtype === 'playoff' || gtype === 'conf-championship') ? 1.5 : 0;
            return (
              <rect
                key={`${g.season}-${g.week}-${i}`}
                x={x} y={barY} width={barW} height={isTie ? 2 : barH}
                fill={fill} opacity={tooltip && !isHovered ? 0.35 : 1} rx={1}
                stroke={strokeColor} strokeWidth={strokeW}
              />
            );
          })}

          {/* Decade labels */}
          {decadeLabels.map(y => (
            <text key={y} x={getBarX(y)} y={SVG_H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {y}
            </text>
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (() => {
        const g = tooltip.game;
        const t1Pts = g.team1Points ?? '?';
        const t2Pts = g.team2Points ?? '?';
        const homeLabel = g.homeTeamId === 'team1' ? shortName(t1Id) : shortName(t2Id);
        const site = g.venue ?? (g.neutralSite ? 'Neutral' : `@ ${homeLabel}`);
        const typeLabel = getGameLabel(g);
        return (
          <div
            className="pointer-events-none absolute z-10 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
          >
            <div className="font-bold">{g.season} · {typeLabel}</div>
            <div>{shortName(t1Id)} {t1Pts} – {t2Pts} {shortName(t2Id)}</div>
            <div className="text-gray-400">{site}</div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Win Pct Bar ──────────────────────────────────────────────────────────────

function WinBar({ w1, ties, w2, c1, c2 }: { w1: number; ties: number; w2: number; c1: string; c2: string }) {
  const total = w1 + ties + w2;
  if (!total) return null;
  const p1 = (w1 / total) * 100;
  const pt = (ties / total) * 100;
  const p2 = (w2 / total) * 100;
  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden">
      <div style={{ width: `${p1}%`, background: c1 }} />
      {ties > 0 && <div style={{ width: `${pt}%`, background: '#9ca3af' }} />}
      <div style={{ width: `${p2}%`, background: c2 }} />
    </div>
  );
}

// ─── Split Card ───────────────────────────────────────────────────────────────

function SplitCard({ label, rec, t1Id, t2Id }: { label: string; rec: SplitRecord; t1Id: string; t2Id: string }) {
  const [c1, c2] = getTeamColors(t1Id, t2Id);
  const total = rec.team1W + rec.team2W + rec.t;
  const leader = rec.team1W > rec.team2W ? t1Id : rec.team2W > rec.team1W ? t2Id : null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl font-bold" style={{ color: c1 }}>{rec.team1W}</span>
        {rec.t > 0 && <span className="text-sm text-gray-400">{rec.t}T</span>}
        <span className="text-xl font-bold" style={{ color: c2 }}>{rec.team2W}</span>
      </div>
      {total > 0 && <WinBar w1={rec.team1W} ties={rec.t} w2={rec.team2W} c1={c1} c2={c2} />}
      {total === 0 && <p className="text-xs text-gray-400">No games</p>}
      {leader && total > 0 && (
        <p className="text-[10px] text-gray-400 mt-1">{shortName(leader)} leads</p>
      )}
    </div>
  );
}

// ─── Decade Table ─────────────────────────────────────────────────────────────

function DecadeTable({ records, t1Id, t2Id }: { records: Record<string, { team1W: number; team2W: number; t: number }>; t1Id: string; t2Id: string }) {
  const [c1, c2] = getTeamColors(t1Id, t2Id);
  const decades = Object.keys(records).sort();
  if (!decades.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Decade Breakdown</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Decade</th>
              <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: c1 }}>{shortName(t1Id)}</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Ties</th>
              <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: c2 }}>{shortName(t2Id)}</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Leader</th>
            </tr>
          </thead>
          <tbody>
            {decades.map(d => {
              const r = records[d];
              const leader = r.team1W > r.team2W ? t1Id : r.team2W > r.team1W ? t2Id : null;
              return (
                <tr key={d} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{d}</td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: c1 }}>{r.team1W}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">{r.t}</td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: c2 }}>{r.team2W}</td>
                  <td className="px-4 py-2.5 text-center hidden sm:table-cell">
                    {leader ? (
                      <img src={getTeamLogo(leader)} alt={shortName(leader)} className="w-6 h-6 object-contain mx-auto" title={shortName(leader)} />
                    ) : (
                      <span className="text-xs text-gray-400">Even</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Game Log ─────────────────────────────────────────────────────────────────

const GAME_TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'regular', label: 'Regular' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'conf-championship', label: 'Conf. Champ' },
  { value: 'playoff', label: 'Playoff' },
] as const;

type GameFilter = typeof GAME_TYPE_FILTERS[number]['value'];

const GAME_TYPE_STYLE: Record<GameType, string> = {
  regular:             'text-gray-400',
  bowl:                'text-amber-600',
  'conf-championship': 'text-teal-600',
  playoff:             'text-yellow-600',
};

function GameLog({ games, t1Id, t2Id }: { games: H2HGame[]; t1Id: string; t2Id: string }) {
  const [filter, setFilter] = useState<GameFilter>('all');
  const [c1, c2] = getTeamColors(t1Id, t2Id);

  const completed = useMemo(() =>
    games.filter(g => g.winner !== null && (
      filter === 'all' || getGameType(g) === filter
    )),
    [games, filter]
  );

  // Only show filter buttons that have matching games
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<GameFilter, number>> = { all: games.filter(g => g.winner !== null).length };
    for (const g of games) {
      if (g.winner === null) continue;
      const t = getGameType(g);
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [games]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Full Game Log ({completed.length} games)
        </p>
        <div className="flex flex-wrap gap-1">
          {GAME_TYPE_FILTERS.filter(f => f.value === 'all' || (typeCounts[f.value] ?? 0) > 0).map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                filter === f.value ? 'bg-[#0050A0] text-white border-[#0050A0]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}{f.value !== 'all' && typeCounts[f.value] ? ` (${typeCounts[f.value]})` : ''}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Game</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Site</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: c1 }}>{shortName(t1Id)}</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: c2 }}>{shortName(t2Id)}</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Winner</th>
            </tr>
          </thead>
          <tbody>
            {completed.map((g, i) => {
              const isT1 = g.winner === 'team1';
              const isTie = g.winner === 'tie';
              const homeLabel = g.homeTeamId === 'team1' ? shortName(t1Id) : shortName(t2Id);
              const site = g.venue ?? (g.neutralSite ? 'Neutral' : `@ ${homeLabel}`);
              const gtype = getGameType(g);
              const label = getGameLabel(g);
              return (
                <tr key={`${g.season}-${g.week}-${i}`} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-700 tabular-nums">{g.season}</td>
                  <td className={`px-3 py-2 text-xs font-medium hidden sm:table-cell whitespace-nowrap ${GAME_TYPE_STYLE[gtype]}`}>
                    {label}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500 hidden md:table-cell">{site}</td>
                  <td className="px-3 py-2 text-center tabular-nums font-bold" style={{ color: isT1 ? c1 : '#6b7280' }}>
                    {g.team1Points ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums font-bold" style={{ color: !isT1 && !isTie ? c2 : '#6b7280' }}>
                    {g.team2Points ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isTie ? (
                      <span className="text-xs text-gray-400">Tie</span>
                    ) : (
                      <img src={getTeamLogo(isT1 ? t1Id : t2Id)} alt={shortName(isT1 ? t1Id : t2Id)} className="w-6 h-6 object-contain mx-auto" title={shortName(isT1 ? t1Id : t2Id)} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Recent Form Pills ────────────────────────────────────────────────────────

function RecentForm({ games, t1Id, t2Id, label }: { games: H2HGame[]; t1Id: string; t2Id: string; label: string }) {
  const [c1, c2] = getTeamColors(t1Id, t2Id);
  const [hovered, setHovered] = useState<number | null>(null);
  const recent = [...games]
    .filter(g => g.winner !== null)
    .sort((a, b) => b.season - a.season || b.week - a.week)
    .slice(0, parseInt(label));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Last {label}</p>
      <div className="flex gap-1.5 justify-center flex-wrap">
        {recent.map((g, i) => {
          const isT1 = g.winner === 'team1';
          const isTie = g.winner === 'tie';
          const winnerId = isT1 ? t1Id : t2Id;
          const loserId = isT1 ? t2Id : t1Id;
          const winPts = isT1 ? g.team1Points : g.team2Points;
          const losePts = isT1 ? g.team2Points : g.team1Points;
          return (
            <div
              key={i}
              className="relative flex items-center justify-center flex-shrink-0 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(hovered === i ? null : i)}
            >
              {isTie ? (
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-gray-300">T</span>
              ) : (
                <img src={getTeamLogo(winnerId)} alt={shortName(winnerId)} className="w-7 h-7 object-contain" />
              )}
              {hovered === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <div className="font-bold mb-0.5">{g.season}</div>
                    {isTie ? (
                      <div>{g.team1Points}–{g.team2Points} Tie</div>
                    ) : (
                      <>
                        <div className="font-semibold">{shortName(winnerId)} {winPts}</div>
                        <div className="text-gray-400">{shortName(loserId)} {losePts}</div>
                      </>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">
        {recent.filter(g => g.winner === 'team1').length}–{recent.filter(g => g.winner === 'team2').length}
        {recent.filter(g => g.winner === 'tie').length > 0 && `–${recent.filter(g => g.winner === 'tie').length}`}
      </p>
    </div>
  );
}

// ─── Team Selector ────────────────────────────────────────────────────────────

function TeamSelector({
  label, conf, team, onConf, onTeam, otherTeam,
}: {
  label: string; conf: string; team: string;
  onConf: (v: string) => void; onTeam: (v: string) => void; otherTeam: string;
}) {
  const filtered = useMemo(() => {
    const base = allTeams.filter(t => FBS_CONFERENCES.includes(t.conference));
    const by = conf ? base.filter(t => t.conference === conf) : base;
    return by.filter(t => t.id !== otherTeam).sort((a, b) => a.name.localeCompare(b.name));
  }, [conf, otherTeam]);

  const teamObj = allTeams.find(t => t.id === team);
  const color = teamObj ? teamColor(team) : '#0050A0';

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="space-y-2">
        <select
          value={conf}
          onChange={e => { onConf(e.target.value); onTeam(''); }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
        >
          <option value="">All Conferences</option>
          {FBS_CONFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={team}
          onChange={e => onTeam(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
          style={{ borderColor: team ? color : undefined, boxShadow: team ? `0 0 0 1px ${color}20` : undefined }}
        >
          <option value="">Select a team…</option>
          {filtered.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {teamObj && (
          <div className="flex items-center gap-2 mt-1">
            <img src={getTeamLogo(team)} alt="" className="w-6 h-6 object-contain" />
            <span className="text-sm font-semibold text-gray-700">{teamObj.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HeadToHeadClient({ initialTeam1 = '', initialTeam2 = '' }: { initialTeam1?: string; initialTeam2?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [team1, setTeam1] = useState(initialTeam1);
  const [team2, setTeam2] = useState(initialTeam2);
  const [conf1, setConf1] = useState('');
  const [conf2, setConf2] = useState('');
  const [data, setData] = useState<{ games: H2HGame[]; stats: H2HStats } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL sync — only navigate when the URL doesn't already match the selected teams
  useEffect(() => {
    if (team1 && team2) {
      const slug = `${teamIdToSlug(team1)}-vs-${teamIdToSlug(team2)}`;
      const target = `/head-to-head/${slug}`;
      if (pathname !== target) router.replace(target, { scroll: false });
    } else {
      if (pathname !== '/head-to-head') router.replace('/head-to-head', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team1, team2]);

  // Fetch data when both teams set
  useEffect(() => {
    if (!team1 || !team2) { setData(null); return; }

    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    fetch(getApiPath(`api/cfb/head-to-head?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`), {
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setData(null); }
        else setData(d);
      })
      .catch(e => { if (e.name !== 'AbortError') setError('Failed to load data.'); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [team1, team2]);

  const t1Obj = allTeams.find(t => t.id === team1);
  const t2Obj = allTeams.find(t => t.id === team2);
  const [c1, c2] = (team1 && team2) ? getTeamColors(team1, team2) : [team1 ? teamColor(team1) : '#0050A0', '#e5e7eb'];

  const { stats, games } = data ?? { stats: null, games: [] };


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2">Head-to-Head Records</h1>
          <p className="text-base sm:text-lg opacity-90 font-medium">All-time series records between any two FBS programs dating back to 1950.</p>
        </div>
      </header>
      <TransferPortalBanner />

      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl space-y-5">
        <RaptiveHeaderAd />

        {/* Team Selectors */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
            <TeamSelector
              label="Team 1"
              conf={conf1} team={team1}
              onConf={setConf1} onTeam={setTeam1}
              otherTeam={team2}
            />

            {/* VS badge */}
            <div className="flex sm:flex-col items-center justify-center gap-2 sm:pt-8">
              <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <span className="text-xs font-black text-gray-500">VS</span>
              </div>
              {team1 && team2 && (
                <button
                  onClick={() => { const t = team1; setTeam1(team2); setTeam2(t); }}
                  className="text-xs text-[#0050A0] hover:underline cursor-pointer sm:text-center"
                  title="Swap teams"
                >
                  ⇄ Swap
                </button>
              )}
            </div>

            <TeamSelector
              label="Team 2"
              conf={conf2} team={team2}
              onConf={setConf2} onTeam={setTeam2}
              otherTeam={team1}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading series history…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && !team1 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#0050A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Select two teams to compare their all-time series</p>
            <p className="text-sm text-gray-400 mt-1">Data from 1950 onwards · powered by College Football Data</p>
          </div>
        )}

        {/* Wait for second team */}
        {!loading && !error && team1 && !team2 && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Select a second team to load the series
          </div>
        )}

        {/* No games found */}
        {!loading && !error && stats && stats.totalGames === 0 && t1Obj && t2Obj && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
            No games found between {t1Obj.name} and {t2Obj.name} since 1950.
          </div>
        )}

        {/* ── Main content ── */}
        {!loading && !error && stats && stats.totalGames > 0 && t1Obj && t2Obj && (
          <>
            {/* Summary card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              {/* Team logos + record */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={getTeamLogo(team1)} alt={t1Obj.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-2xl sm:text-4xl tabular-nums" style={{ color: c1 }}>{stats.team1Wins}</p>
                    <p className="text-xs text-gray-500 truncate">{t1Obj.name}</p>
                  </div>
                </div>

                <div className="text-center flex-shrink-0">
                  {stats.ties > 0 && <p className="text-sm font-bold text-gray-400 mb-0.5">{stats.ties} ties</p>}
                  <p className="text-xs text-gray-400">{stats.totalGames} games</p>
                </div>

                <div className="flex items-center gap-3 min-w-0 flex-row-reverse">
                  <img src={getTeamLogo(team2)} alt={t2Obj.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0" />
                  <div className="min-w-0 text-right">
                    <p className="font-black text-2xl sm:text-4xl tabular-nums" style={{ color: c2 }}>{stats.team2Wins}</p>
                    <p className="text-xs text-gray-500 truncate">{t2Obj.name}</p>
                  </div>
                </div>
              </div>

              {/* Win% bar */}
              <WinBar w1={stats.team1Wins} ties={stats.ties} w2={stats.team2Wins} c1={c1} c2={c2} />

              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>{(stats.team1WinPct * 100).toFixed(1)}%</span>
                <span>{((1 - stats.team1WinPct) * 100).toFixed(1)}%</span>
              </div>

              {/* Current streak */}
              {stats.currentStreak && (
                <div className="mt-4 text-center">
                  <span
                    className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-bold"
                    style={{ background: stats.currentStreak.team === 'team1' ? c1 : c2 }}
                  >
                    {stats.currentStreak.count}-game win streak — {shortName(stats.currentStreak.team === 'team1' ? team1 : team2)}
                  </span>
                </div>
              )}

              {/* Biggest wins */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {stats.biggestTeam1Win && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Biggest {shortName(team1)} Win</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: c1 }}>
                      {stats.biggestTeam1Win.team1Points}–{stats.biggestTeam1Win.team2Points}
                    </p>
                    <p className="text-xs text-gray-500">{stats.biggestTeam1Win.season}</p>
                  </div>
                )}
                {stats.biggestTeam2Win && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Biggest {shortName(team2)} Win</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: c2 }}>
                      {stats.biggestTeam2Win.team2Points}–{stats.biggestTeam2Win.team1Points}
                    </p>
                    <p className="text-xs text-gray-500">{stats.biggestTeam2Win.season}</p>
                  </div>
                )}
              </div>

              {/* Longest streaks + avg margin */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: c1 }}>{stats.longestStreak1}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Longest {shortName(team1)} streak</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: c1 }}>{stats.team1AvgMargin > 0 ? `+${stats.team1AvgMargin}` : '—'}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Avg margin in wins</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: c2 }}>{stats.team2AvgMargin > 0 ? `+${stats.team2AvgMargin}` : '—'}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Avg margin in wins</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: c2 }}>{stats.longestStreak2}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Longest {shortName(team2)} streak</p>
                </div>
              </div>
            </div>

            {/* Score margin chart */}
            <ScoreMarginChart games={games} t1Id={team1} t2Id={team2} />

            {/* Splits */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <SplitCard label={`At ${shortName(team1)}`} rec={stats.atTeam1} t1Id={team1} t2Id={team2} />
              <SplitCard label="Neutral Site" rec={stats.neutral} t1Id={team1} t2Id={team2} />
              <SplitCard label={`At ${shortName(team2)}`} rec={stats.atTeam2} t1Id={team1} t2Id={team2} />
              <SplitCard label="Regular Season" rec={stats.regularSeason} t1Id={team1} t2Id={team2} />
              <SplitCard label="Bowl / Playoff" rec={stats.postseason} t1Id={team1} t2Id={team2} />
            </div>

            {/* Recent form */}
            <div className="grid grid-cols-2 gap-3">
              <RecentForm games={games} t1Id={team1} t2Id={team2} label="5" />
              <RecentForm games={games} t1Id={team1} t2Id={team2} label="10" />
            </div>

            {/* Decade table */}
            <DecadeTable records={stats.decadeRecords} t1Id={team1} t2Id={team2} />

            {/* Game log */}
            <GameLog games={games} t1Id={team1} t2Id={team2} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
