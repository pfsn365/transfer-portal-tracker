'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { allTeams } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import { getApiPath } from '@/utils/api';
import type { TransferPlayer } from '@/types/player';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';

// ─── Team colors ─────────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  alabama: '#9E1B32', arkansas: '#9D2235', auburn: '#0C2340', florida: '#0021A5',
  georgia: '#BA0C2F', kentucky: '#0033A0', lsu: '#461D7C', 'ole miss': '#CE1126',
  'mississippi state': '#660000', missouri: '#F1B82D', oklahoma: '#841617',
  'south carolina': '#73000A', tennessee: '#FF8200', texas: '#BF5700',
  'texas a&m': '#500000', vanderbilt: '#866D4B', illinois: '#E84A27',
  indiana: '#990000', iowa: '#FFCD00', maryland: '#E03A3E', michigan: '#00274C',
  'michigan state': '#18453B', minnesota: '#7A0019', nebraska: '#D00000',
  northwestern: '#4E2A84', 'ohio state': '#BB0000', oregon: '#154733',
  'penn state': '#041E42', purdue: '#CEB888', rutgers: '#CC0033',
  ucla: '#2D68C4', usc: '#990000', washington: '#4B2E83', wisconsin: '#C5050C',
  arizona: '#CC0033', 'arizona state': '#8C1D40', baylor: '#154734', byu: '#002E5D',
  cincinnati: '#E00122', colorado: '#CFB87C', houston: '#C8102E',
  'iowa state': '#C8102E', kansas: '#0051BA', 'kansas state': '#512888',
  'oklahoma state': '#FF7300', tcu: '#4D1979', 'texas tech': '#CC0000',
  ucf: '#BA9B37', utah: '#CC0000', 'west virginia': '#002855', clemson: '#F56600',
  duke: '#003087', 'florida state': '#782F40', 'georgia tech': '#B3A369',
  louisville: '#AD0000', miami: '#F47321', 'north carolina': '#7BAFD4',
  pittsburgh: '#003594', 'notre dame': '#0C2340', smu: '#CC0000',
  syracuse: '#F76900', virginia: '#232D4B', 'virginia tech': '#630031',
  'wake forest': '#9E7E38', 'boston college': '#98002E',
};

// ─── Conference display config ────────────────────────────────────────────────
const ESPN_CONF = 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500';
const CONF_DISPLAY: Record<string, { abbr: string; color: string; logoUrl?: string }> = {
  'SEC':           { abbr: 'SEC',  color: '#003087', logoUrl: `${ESPN_CONF}/8.png` },
  'Big Ten':       { abbr: 'B10',  color: '#002244', logoUrl: `${ESPN_CONF}/5.png` },
  'Big 12':        { abbr: 'B12',  color: '#00529B', logoUrl: `${ESPN_CONF}/4.png` },
  'ACC':           { abbr: 'ACC',  color: '#1B3A6B', logoUrl: `${ESPN_CONF}/1.png` },
  'American':      { abbr: 'AAC',  color: '#006633', logoUrl: `${ESPN_CONF}/151.png` },
  'Mountain West': { abbr: 'MW',   color: '#003366', logoUrl: `${ESPN_CONF}/17.png` },
  'Sun Belt':      { abbr: 'SBC',  color: '#E04E14', logoUrl: `${ESPN_CONF}/37.png` },
  'MAC':           { abbr: 'MAC',  color: '#B31B1B', logoUrl: `${ESPN_CONF}/15.png` },
  'Conference USA':{ abbr: 'CUSA', color: '#004990', logoUrl: `${ESPN_CONF}/12.png` },
  'Pac-12':        { abbr: 'P12',  color: '#003087', logoUrl: `${ESPN_CONF}/9.png` },
  'Independent':   { abbr: 'IND',  color: '#555555' },
  'FCS':           { abbr: 'FCS',  color: '#777777' },
};

const FBS_CONFERENCES = [
  'SEC', 'Big Ten', 'Big 12', 'ACC', 'American',
  'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent',
];

const DISPLAY_OVERRIDES: Record<string, string> = {
  lsu: 'LSU', byu: 'BYU', usc: 'USC', ucf: 'UCF', uab: 'UAB',
  usf: 'USF', utsa: 'UTSA', utep: 'UTEP', unlv: 'UNLV', fau: 'FAU',
  smu: 'SMU', tcu: 'TCU', ucla: 'UCLA',
};

const POSITION_GROUPS: Record<string, string[]> = {
  QB: ['QB'],
  RB: ['RB', 'FB', 'APB'],
  WR: ['WR', 'SLOT'],
  TE: ['TE'],
  OL: ['OT', 'OG', 'OC', 'OL', 'IOL', 'C', 'G', 'T'],
  DL: ['DT', 'NT', 'DL'],
  EDGE: ['DE', 'EDGE', 'SDE', 'WDE'],
  LB: ['LB', 'ILB', 'OLB', 'MLB'],
  DB: ['CB', 'S', 'SAF', 'FS', 'SS', 'DB'],
  'K/P': ['K', 'P', 'LS'],
};

// ─── SVG layout constants ─────────────────────────────────────────────────────
const SVG_W = 880;
const PAD = 40;
const SCHOOL_W = 170;
const TEAM_W = 140;
const TEAM_X = (SVG_W - TEAM_W) / 2;
const LEFT_RIGHT = SCHOOL_W;
const RIGHT_LEFT = SVG_W - SCHOOL_W;
const TEAM_LEFT = TEAM_X;
const TEAM_RIGHT = TEAM_X + TEAM_W;
const LCP = (LEFT_RIGHT + TEAM_LEFT) / 2;
const RCP = (TEAM_RIGHT + RIGHT_LEFT) / 2;
const BOX_GAP = 10;
const MIN_BOX_H = 36;
const PX_PER_PLAYER = 10;
const MAX_BOX_H = 60;
const MAX_SCHOOLS = 50;

function titleCase(s: string) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function displayName(id: string): string {
  const lower = id.toLowerCase();
  if (DISPLAY_OVERRIDES[lower]) return DISPLAY_OVERRIDES[lower];
  const team = allTeams.find(t => t.id.toLowerCase() === lower);
  if (!team) return titleCase(id);
  return titleCase(team.id);
}

function ratingToStars(rating: number | undefined): number {
  if (!rating) return 0;
  if (rating >= 0.98) return 5;
  if (rating >= 0.89) return 4;
  if (rating >= 0.80) return 3;
  return 0;
}

function StarRating({ rating, stars }: { rating?: number; stars?: number }) {
  if (stars && stars > 0) {
    return <span className="text-yellow-500 tracking-tighter text-xs">{'★'.repeat(stars)}</span>;
  }
  if (rating && rating > 0) {
    return <span className="text-xs text-gray-400 tabular-nums">{rating.toFixed(1)}</span>;
  }
  return null;
}

function boxH(count: number) {
  return Math.min(MAX_BOX_H, MIN_BOX_H + (count - 1) * PX_PER_PLAYER);
}

function sideHeight(schools: Array<[string, TransferPlayer[]]>) {
  if (schools.length === 0) return 0;
  return schools.reduce((s, [, p]) => s + boxH(p.length), 0) + BOX_GAP * (schools.length - 1);
}

function ribbonPath(sx: number, sy1: number, sy2: number, tx: number, ty1: number, ty2: number, cpX: number): string {
  return [`M ${sx} ${sy1}`, `C ${cpX} ${sy1}, ${cpX} ${ty1}, ${tx} ${ty1}`, `L ${tx} ${ty2}`, `C ${cpX} ${ty2}, ${cpX} ${sy2}, ${sx} ${sy2}`, 'Z'].join(' ');
}

interface SchoolPos { school: string; players: TransferPlayer[]; y: number; h: number; }
interface RibbonSlot { school: string; y: number; h: number; }

// ─── Mobile card list ─────────────────────────────────────────────────────────
function SchoolCards({
  schools, side, onPivot, confMode = false,
}: {
  schools: Array<[string, TransferPlayer[]]>;
  side: 'in' | 'out';
  onPivot: (id: string) => void;
  confMode?: boolean;
}) {
  const isIn = side === 'in';
  return (
    <div className="space-y-2">
      {schools.map(([school, ps]) => {
        const knownTeam = confMode ? null : allTeams.find(t => t.id.toLowerCase() === school.toLowerCase());
        const conf = CONF_DISPLAY[school];
        return (
          <div
            key={school}
            className={`flex items-center gap-3 p-3 rounded-lg border bg-gray-50 transition-all ${knownTeam ? `cursor-pointer ${isIn ? 'hover:bg-green-50 hover:border-green-300 active:scale-[0.98]' : 'hover:bg-red-50 hover:border-red-300 active:scale-[0.98]'}` : 'border-gray-200'}`}
            onClick={() => knownTeam && onPivot(knownTeam.id)}
          >
            {confMode ? (
              conf?.logoUrl ? (
                <img
                  src={conf.logoUrl}
                  alt={school}
                  className="w-9 h-9 object-contain flex-shrink-0"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                  style={{ background: conf?.color ?? '#888' }}
                >
                  {conf?.abbr ?? school.slice(0, 3).toUpperCase()}
                </div>
              )
            ) : (
              <img
                src={getTeamLogo(school)}
                alt={displayName(school)}
                className="w-9 h-9 object-contain flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">
                {confMode ? school : displayName(school)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-sm font-bold tabular-nums ${isIn ? 'text-green-600' : 'text-red-500'}`}>
                {isIn ? '+' : '−'}{ps.length}
              </span>
              {knownTeam && (
                <svg className={`w-3.5 h-3.5 ${isIn ? 'text-green-500' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isIn ? 'M14 5l7 7m0 0l-7 7m7-7H3' : 'M10 19l-7-7m0 0l7-7m-7 7h18'} />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TransferFlowClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedTeam, setSelectedTeam] = useState(() => searchParams.get('team') ?? '');
  const [selectedConference, setSelectedConference] = useState(() => searchParams.get('conference') ?? '');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [viewMode, setViewMode] = useState<'school' | 'conference'>('school');
  const [players, setPlayers] = useState<TransferPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredSchool, setHoveredSchool] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; lines: string[] } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isConfMode = viewMode === 'conference';

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedConference) params.set('conference', selectedConference);
    if (selectedTeam) params.set('team', selectedTeam);
    const qs = params.toString();
    router.replace(`/transfer-flow${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [selectedTeam, selectedConference, router]);

  const filteredTeams = useMemo(() => {
    const base = allTeams.filter(t => FBS_CONFERENCES.includes(t.conference));
    if (!selectedConference) return base.sort((a, b) => a.name.localeCompare(b.name));
    return base.filter(t => t.conference === selectedConference).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedConference]);

  useEffect(() => {
    if (!selectedTeam) { setPlayers([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(getApiPath(`api/transfer-portal?team=${encodeURIComponent(selectedTeam)}`), { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setPlayers(d.players ?? []))
      .catch(e => { if (e.name !== 'AbortError') console.error(e); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [selectedTeam]);

  const activePositionGroups = useMemo(() => {
    const posSet = new Set(players.map(p => p.position as string));
    return Object.entries(POSITION_GROUPS)
      .filter(([, positions]) => positions.some(pos => posSet.has(pos)))
      .map(([group]) => group);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    if (selectedPosition === 'All') return players;
    const allowed = new Set(POSITION_GROUPS[selectedPosition] ?? []);
    return players.filter(p => allowed.has(p.position as string));
  }, [players, selectedPosition]);

  const teamIdLower = selectedTeam.toLowerCase();

  const incoming = useMemo(() =>
    filteredPlayers.filter(p => (p.newSchool ?? '').toLowerCase() === teamIdLower),
  [filteredPlayers, teamIdLower]);

  const outgoing = useMemo(() =>
    filteredPlayers.filter(p => p.formerSchool.toLowerCase() === teamIdLower),
  [filteredPlayers, teamIdLower]);

  const outgoingDecided = useMemo(() =>
    outgoing.filter(p => p.newSchool && p.newSchool.trim() !== ''),
  [outgoing]);

  const undecidedCount = outgoing.length - outgoingDecided.length;

  // ── School groupings ──────────────────────────────────────────────────────
  const incomingBySchool = useMemo(() => {
    const map: Record<string, TransferPlayer[]> = {};
    for (const p of incoming) {
      const k = p.formerSchool.toLowerCase();
      if (!map[k]) map[k] = [];
      map[k].push(p);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length).slice(0, MAX_SCHOOLS);
  }, [incoming]);

  const outgoingBySchool = useMemo(() => {
    const map: Record<string, TransferPlayer[]> = {};
    for (const p of outgoingDecided) {
      const k = p.newSchool!.toLowerCase();
      if (!map[k]) map[k] = [];
      map[k].push(p);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length).slice(0, MAX_SCHOOLS);
  }, [outgoingDecided]);

  // ── Conference groupings ──────────────────────────────────────────────────
  const incomingByConf = useMemo(() => {
    const map: Record<string, TransferPlayer[]> = {};
    for (const p of incoming) {
      const k = p.formerConference || 'Independent';
      if (!map[k]) map[k] = [];
      map[k].push(p);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [incoming]);

  const outgoingByConf = useMemo(() => {
    const map: Record<string, TransferPlayer[]> = {};
    for (const p of outgoingDecided) {
      const k = p.newConference || 'Independent';
      if (!map[k]) map[k] = [];
      map[k].push(p);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [outgoingDecided]);

  // Active groupings based on view mode
  const activeIncoming = isConfMode ? incomingByConf : incomingBySchool;
  const activeOutgoing = isConfMode ? outgoingByConf : outgoingBySchool;

  // ── SVG layout ─────────────────────────────────────────────────────────────
  const leftH = sideHeight(activeIncoming);
  const rightH = sideHeight(activeOutgoing);
  const teamBoxH = Math.max(leftH, rightH, 80);
  const svgH = teamBoxH + PAD * 2;

  function layoutSide(schools: Array<[string, TransferPlayer[]]>, totalH: number): SchoolPos[] {
    const sh = sideHeight(schools);
    let y = PAD + (totalH - sh) / 2;
    return schools.map(([school, ps]) => {
      const h = boxH(ps.length);
      const pos: SchoolPos = { school, players: ps, y, h };
      y += h + BOX_GAP;
      return pos;
    });
  }

  function ribbonSlots(layout: SchoolPos[], total: number, bh: number): RibbonSlot[] {
    let y = PAD;
    return layout.map(({ school, players: ps }) => {
      const h = total > 0 ? (ps.length / total) * bh : 0;
      const slot: RibbonSlot = { school, y, h };
      y += h;
      return slot;
    });
  }

  const incomingLayout = layoutSide(activeIncoming, teamBoxH);
  const outgoingLayout = layoutSide(activeOutgoing, teamBoxH);
  const inSlots  = ribbonSlots(incomingLayout, incoming.length, teamBoxH);
  const outSlots = ribbonSlots(outgoingLayout, outgoingDecided.length, teamBoxH);

  const teamColor = TEAM_COLORS[teamIdLower] ?? '#0050A0';
  const selectedTeamObj = allTeams.find(t => t.id === selectedTeam);
  const net = incoming.length - outgoing.length;

  function handleTeamPivot(newTeamId: string) {
    setSelectedTeam(newTeamId);
    setSelectedConference('');
    setSelectedPosition('All');
  }

  function handleRibbonHover(e: React.MouseEvent<SVGElement>, school: string, ps: TransferPlayer[]) {
    setHoveredSchool(school);
    const container = svgRef.current?.closest('.svg-container') as HTMLElement | null;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const lines = ps.slice(0, 8).map(p => {
      const stars = ratingToStars(p.rating);
      const ratingStr = stars > 0 ? ` · ${'★'.repeat(stars)}` : p.rating ? ` · ${p.rating.toFixed(2)}` : '';
      return `${p.name} (${p.position}${ratingStr})`;
    });
    if (ps.length > 8) lines.push(`+${ps.length - 8} more`);
    setTooltip({
      x: e.clientX - rect.left + container.scrollLeft,
      y: e.clientY - rect.top + container.scrollTop - 8,
      lines,
    });
  }

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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2">Team Transfer Streams</h1>
          <p className="text-base sm:text-lg opacity-90 font-medium">
            {selectedTeamObj
              ? `${selectedTeamObj.name} — 2026 Transfer Portal`
              : "Visualize where any CFB team's 2026 transfers came from and went to"}
          </p>
        </div>
      </header>
      <TransferPortalBanner />

      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl space-y-5">
        <RaptiveHeaderAd />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedConference}
              onChange={e => { setSelectedConference(e.target.value); setSelectedTeam(''); setSelectedPosition('All'); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              <option value="">All Conferences</option>
              {FBS_CONFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedTeam}
              onChange={e => { setSelectedTeam(e.target.value); setSelectedPosition('All'); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              <option value="">Select a Team</option>
              {filteredTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Counts + Portal Grade */}
        {selectedTeam && !loading && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-green-600">+{incoming.length}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Incoming</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <div className={`text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {net >= 0 ? '+' : ''}{net}
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Net</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-red-600">−{outgoing.length}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Outgoing</div>
              </div>
            </div>
          </>
        )}

        {/* Position filter pills */}
        {selectedTeam && !loading && activePositionGroups.length > 1 && (incoming.length > 0 || outgoing.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {['All', ...activePositionGroups].map(group => (
              <button
                key={group}
                onClick={() => setSelectedPosition(group)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedPosition === group
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
                style={selectedPosition === group ? { background: teamColor, borderColor: teamColor } : {}}
              >
                {group}
              </button>
            ))}
          </div>
        )}

        {/* Flow Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {!selectedTeam ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-[#0050A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Select a team above to see their transfer flow chart</p>
              <p className="text-sm text-gray-400 mt-1">Ribbons show where incoming transfers came from and where outgoing transfers went</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : incoming.length === 0 && outgoing.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No transfer portal data found for {selectedTeamObj?.name}
              {selectedPosition !== 'All' ? ` at ${selectedPosition}` : ''}.
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Column headers + view toggle */}
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Incoming ({incoming.length})
                  </span>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('school')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      !isConfMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    By School
                  </button>
                  <button
                    onClick={() => setViewMode('conference')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      isConfMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    By Conference
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Outgoing ({outgoing.length})
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                </div>
              </div>

              {/* ── Mobile card view (< sm) ── */}
              <div className="sm:hidden space-y-4">
                {activeIncoming.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      From {activeIncoming.length} {isConfMode ? 'conference' : 'school'}{activeIncoming.length !== 1 ? 's' : ''}{!isConfMode ? ' — tap to explore' : ''}
                    </p>
                    <SchoolCards schools={activeIncoming} side="in" onPivot={handleTeamPivot} confMode={isConfMode} />
                  </div>
                )}
                {activeOutgoing.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      To {activeOutgoing.length} {isConfMode ? 'conference' : 'school'}{activeOutgoing.length !== 1 ? 's' : ''}{!isConfMode ? ' — tap to explore' : ''}
                    </p>
                    <SchoolCards schools={activeOutgoing} side="out" onPivot={handleTeamPivot} confMode={isConfMode} />
                  </div>
                )}
                {undecidedCount > 0 && (
                  <p className="text-xs text-gray-400 text-center">+{undecidedCount} outgoing player{undecidedCount !== 1 ? 's' : ''} still deciding</p>
                )}
              </div>

              {/* ── Desktop SVG Sankey (≥ sm) ── */}
              <div className="hidden sm:block">
                <div className="svg-container relative overflow-x-auto">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_W} ${svgH}`}
                    className="w-full"
                    style={{ minHeight: 200, minWidth: 520 }}
                    onMouseLeave={() => { setHoveredSchool(null); setTooltip(null); }}
                  >
                    {/* Incoming ribbons */}
                    {incomingLayout.map((sp, i) => {
                      const slot = inSlots[i];
                      if (!slot) return null;
                      const active = hoveredSchool === null || hoveredSchool === sp.school;
                      return (
                        <path
                          key={`in-ribbon-${sp.school}`}
                          d={ribbonPath(LEFT_RIGHT, sp.y, sp.y + sp.h, TEAM_LEFT, slot.y, slot.y + slot.h, LCP)}
                          fill="#22c55e"
                          opacity={active ? 0.28 : 0.07}
                          className="cursor-pointer transition-opacity duration-150"
                          onMouseEnter={e => handleRibbonHover(e as React.MouseEvent<SVGElement>, sp.school, sp.players)}
                          onMouseLeave={() => { setHoveredSchool(null); setTooltip(null); }}
                        />
                      );
                    })}

                    {/* Outgoing ribbons */}
                    {outgoingLayout.map((sp, i) => {
                      const slot = outSlots[i];
                      if (!slot) return null;
                      const active = hoveredSchool === null || hoveredSchool === sp.school;
                      return (
                        <path
                          key={`out-ribbon-${sp.school}`}
                          d={ribbonPath(TEAM_RIGHT, slot.y, slot.y + slot.h, RIGHT_LEFT, sp.y, sp.y + sp.h, RCP)}
                          fill="#ef4444"
                          opacity={active ? 0.28 : 0.07}
                          className="cursor-pointer transition-opacity duration-150"
                          onMouseEnter={e => handleRibbonHover(e as React.MouseEvent<SVGElement>, sp.school, sp.players)}
                          onMouseLeave={() => { setHoveredSchool(null); setTooltip(null); }}
                        />
                      );
                    })}

                    {/* Team center box */}
                    <defs>
                      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="3" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <rect x={TEAM_X} y={PAD} width={TEAM_W} height={teamBoxH} rx={8} fill="white" stroke={teamColor} strokeWidth={2} filter="url(#shadow)" />
                    <image href={getTeamLogo(selectedTeam)} x={TEAM_X + TEAM_W / 2 - 22} y={PAD + teamBoxH / 2 - 28} width={44} height={44} preserveAspectRatio="xMidYMid meet" />
                    <text x={TEAM_X + TEAM_W / 2} y={PAD + teamBoxH / 2 + 26} textAnchor="middle" fontSize={11} fontWeight={700} fill={teamColor} fontFamily="system-ui, sans-serif">
                      {selectedTeam.toUpperCase()}
                    </text>

                    {/* Left boxes (incoming) */}
                    {incomingLayout.map(({ school, players: ps, y, h }) => {
                      const isHovered = hoveredSchool === school;
                      const knownTeam = isConfMode ? null : allTeams.find(t => t.id.toLowerCase() === school.toLowerCase());
                      const label = isConfMode ? school : displayName(school);
                      const conf = isConfMode ? CONF_DISPLAY[school] : null;
                      return (
                        <g
                          key={`in-box-${school}`}
                          className={knownTeam ? 'cursor-pointer' : 'cursor-default'}
                          onMouseEnter={e => handleRibbonHover(e as React.MouseEvent<SVGElement>, school, ps)}
                          onMouseLeave={() => { setHoveredSchool(null); setTooltip(null); }}
                          onClick={() => knownTeam && handleTeamPivot(knownTeam.id)}
                        >
                          <rect x={0} y={y} width={SCHOOL_W} height={h} rx={6}
                            fill={isHovered ? '#f0fdf4' : 'white'}
                            stroke={isHovered ? '#22c55e' : '#e5e7eb'}
                            strokeWidth={isHovered ? 1.5 : 1}
                          />
                          {isConfMode ? (
                            conf?.logoUrl ? (
                              <image href={conf.logoUrl} x={6} y={y + h / 2 - 11} width={22} height={22} preserveAspectRatio="xMidYMid meet" />
                            ) : (
                              <>
                                <rect x={6} y={y + h / 2 - 11} width={22} height={22} rx={4} fill={conf?.color ?? '#888'} />
                                <text x={17} y={y + h / 2 + 4} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="system-ui, sans-serif">
                                  {conf?.abbr ?? school.slice(0, 3).toUpperCase()}
                                </text>
                              </>
                            )
                          ) : (
                            <image href={getTeamLogo(school)} x={7} y={y + h / 2 - 11} width={22} height={22} preserveAspectRatio="xMidYMid meet" />
                          )}
                          <text x={35} y={y + h / 2 + 4} fontSize={10} fontWeight={600} fill="#111827" fontFamily="system-ui, sans-serif">
                            {label.length > 17 ? label.slice(0, 16) + '…' : label}
                          </text>
                          <rect x={SCHOOL_W - 24} y={y + h / 2 - 9} width={18} height={18} rx={9} fill="#22c55e" />
                          <text x={SCHOOL_W - 15} y={y + h / 2 + 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="white" fontFamily="system-ui, sans-serif">
                            {ps.length}
                          </text>
                        </g>
                      );
                    })}

                    {/* Right boxes (outgoing) */}
                    {outgoingLayout.map(({ school, players: ps, y, h }) => {
                      const isHovered = hoveredSchool === school;
                      const knownTeam = isConfMode ? null : allTeams.find(t => t.id.toLowerCase() === school.toLowerCase());
                      const label = isConfMode ? school : displayName(school);
                      const conf = isConfMode ? CONF_DISPLAY[school] : null;
                      return (
                        <g
                          key={`out-box-${school}`}
                          className={knownTeam ? 'cursor-pointer' : 'cursor-default'}
                          onMouseEnter={e => handleRibbonHover(e as React.MouseEvent<SVGElement>, school, ps)}
                          onMouseLeave={() => { setHoveredSchool(null); setTooltip(null); }}
                          onClick={() => knownTeam && handleTeamPivot(knownTeam.id)}
                        >
                          <rect x={RIGHT_LEFT} y={y} width={SCHOOL_W} height={h} rx={6}
                            fill={isHovered ? '#fef2f2' : 'white'}
                            stroke={isHovered ? '#ef4444' : '#e5e7eb'}
                            strokeWidth={isHovered ? 1.5 : 1}
                          />
                          {isConfMode ? (
                            conf?.logoUrl ? (
                              <image href={conf.logoUrl} x={RIGHT_LEFT + 6} y={y + h / 2 - 11} width={22} height={22} preserveAspectRatio="xMidYMid meet" />
                            ) : (
                              <>
                                <rect x={RIGHT_LEFT + 6} y={y + h / 2 - 11} width={22} height={22} rx={4} fill={conf?.color ?? '#888'} />
                                <text x={RIGHT_LEFT + 17} y={y + h / 2 + 4} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="system-ui, sans-serif">
                                  {conf?.abbr ?? school.slice(0, 3).toUpperCase()}
                                </text>
                              </>
                            )
                          ) : (
                            <image href={getTeamLogo(school)} x={RIGHT_LEFT + 7} y={y + h / 2 - 11} width={22} height={22} preserveAspectRatio="xMidYMid meet" />
                          )}
                          <text x={RIGHT_LEFT + 35} y={y + h / 2 + 4} fontSize={10} fontWeight={600} fill="#111827" fontFamily="system-ui, sans-serif">
                            {label.length > 17 ? label.slice(0, 16) + '…' : label}
                          </text>
                          <rect x={SVG_W - 22} y={y + h / 2 - 9} width={18} height={18} rx={9} fill="#ef4444" />
                          <text x={SVG_W - 13} y={y + h / 2 + 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="white" fontFamily="system-ui, sans-serif">
                            {ps.length}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Hover tooltip */}
                  {tooltip && (
                    <div
                      className="pointer-events-none absolute z-20 bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 max-w-[300px]"
                      style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                    >
                      {tooltip.lines.map((l, i) => (
                        <div key={i} className={i === 0 ? 'font-semibold' : 'text-gray-300 mt-0.5'}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer notes */}
                {(() => {
                  const inShown  = activeIncoming.reduce((s, [, ps]) => s + ps.length, 0);
                  const outShown = activeOutgoing.reduce((s, [, ps]) => s + ps.length, 0);
                  const inHidden  = incoming.length - inShown;
                  const outHidden = outgoingDecided.length - outShown;
                  const notes: string[] = [];
                  if (inHidden > 0)
                    notes.push(`Showing ${inShown} of ${incoming.length} incoming (${activeIncoming.length} schools · ${inHidden} more to other schools)`);
                  if (outHidden > 0)
                    notes.push(`Showing ${outShown} of ${outgoingDecided.length} committed outgoing (${activeOutgoing.length} schools · ${outHidden} more to other schools)`);
                  if (undecidedCount > 0)
                    notes.push(`${undecidedCount} outgoing still deciding`);
                  if (notes.length === 0) return null;
                  return (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                      {notes.map((n, i) => <p key={i} className="text-xs text-gray-400">{n}</p>)}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Player lists */}
        {selectedTeam && !loading && (incoming.length > 0 || outgoing.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <h3 className="font-bold text-gray-900 text-sm">Incoming Transfers ({incoming.length})</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {incoming.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">None</p>
                ) : incoming.map((p, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50">
                    <span className="text-xs font-bold text-green-600 w-8 text-right flex-shrink-0">{p.position}</span>
                    <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{p.name}</span>
                    <span className="text-xs text-gray-400 truncate max-w-[80px] sm:max-w-[120px] flex-shrink-0">{titleCase(p.formerSchool)}</span>
                    <span className="flex-shrink-0"><StarRating rating={p.rating} stars={p.stars} /></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <h3 className="font-bold text-gray-900 text-sm">Outgoing Transfers ({outgoing.length})</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {outgoing.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">None</p>
                ) : outgoing.map((p, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50">
                    <span className="text-xs font-bold text-red-500 w-8 text-right flex-shrink-0">{p.position}</span>
                    <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{p.name}</span>
                    <span className="text-xs text-gray-400 truncate max-w-[80px] sm:max-w-[120px] flex-shrink-0">
                      {p.newSchool ? titleCase(p.newSchool) : <span className="italic text-gray-300">Undecided</span>}
                    </span>
                    <span className="flex-shrink-0"><StarRating rating={p.rating} stars={p.stars} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
