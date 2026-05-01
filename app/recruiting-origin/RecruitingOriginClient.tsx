'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { allTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';

const StateChoroMap = dynamic(() => import('./StateChoroMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200" style={{ minHeight: 380 }}>
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    </div>
  ),
});

const STATE_ABBR_TO_NAME: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'D.C.',
};

const STATE_FULL_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR_TO_NAME).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

const VALID_ABBRS = new Set(Object.keys(STATE_ABBR_TO_NAME));

function normalizeState(raw: string): string {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  if (upper.length === 2 && VALID_ABBRS.has(upper)) return upper;
  return STATE_FULL_TO_ABBR[raw.trim().toLowerCase()] ?? '';
}

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

const FBS_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent'];

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'OC', 'OL', 'DT', 'EDGE', 'LB', 'CB', 'SAF', 'K', 'P', 'LS', 'ATH'];

// Complete home-state map for all FBS programs
const HOME_STATE_MAP: Record<string, string[]> = {
  // SEC
  alabama: ['AL'], arkansas: ['AR'], auburn: ['AL'], florida: ['FL'],
  georgia: ['GA'], kentucky: ['KY'], lsu: ['LA'], 'ole miss': ['MS'],
  'mississippi state': ['MS'], missouri: ['MO'], oklahoma: ['OK'],
  'south carolina': ['SC'], tennessee: ['TN'], texas: ['TX'],
  'texas a&m': ['TX'], vanderbilt: ['TN'],
  // Big Ten
  illinois: ['IL'], indiana: ['IN'], iowa: ['IA'], maryland: ['MD'],
  michigan: ['MI'], 'michigan state': ['MI'], minnesota: ['MN'],
  nebraska: ['NE'], northwestern: ['IL'], 'ohio state': ['OH'],
  oregon: ['OR'], 'penn state': ['PA'], purdue: ['IN'],
  rutgers: ['NJ'], ucla: ['CA'], usc: ['CA'], washington: ['WA'],
  wisconsin: ['WI'],
  // Big 12
  arizona: ['AZ'], 'arizona state': ['AZ'], baylor: ['TX'], byu: ['UT'],
  cincinnati: ['OH'], colorado: ['CO'], houston: ['TX'], 'iowa state': ['IA'],
  kansas: ['KS'], 'kansas state': ['KS'], 'oklahoma state': ['OK'],
  tcu: ['TX'], 'texas tech': ['TX'], ucf: ['FL'], utah: ['UT'],
  'west virginia': ['WV'],
  // ACC
  'boston college': ['MA'], california: ['CA'], clemson: ['SC'],
  duke: ['NC'], 'florida state': ['FL'], 'georgia tech': ['GA'],
  louisville: ['KY'], miami: ['FL'], 'north carolina': ['NC'],
  'north carolina state': ['NC'], pittsburgh: ['PA'], smu: ['TX'],
  stanford: ['CA'], syracuse: ['NY'], virginia: ['VA'],
  'virginia tech': ['VA'], 'wake forest': ['NC'],
  // American
  army: ['NY'], charlotte: ['NC'], 'east carolina': ['NC'], fau: ['FL'],
  memphis: ['TN'], navy: ['MD'], 'north texas': ['TX'], rice: ['TX'],
  usf: ['FL'], temple: ['PA'], tulane: ['LA'], tulsa: ['OK'],
  uab: ['AL'], utsa: ['TX'],
  // Pac-12 remnants
  'washington state': ['WA'], 'oregon state': ['OR'],
  // Mountain West
  'air force': ['CO'], 'boise state': ['ID'], 'colorado state': ['CO'],
  'fresno state': ['CA'], hawaii: ['HI'], nevada: ['NV'],
  'new mexico': ['NM'], 'san diego state': ['CA'], 'san jose state': ['CA'],
  unlv: ['NV'], 'utah state': ['UT'], wyoming: ['WY'],
  // Sun Belt
  'appalachian state': ['NC'], 'arkansas state': ['AR'],
  'coastal carolina': ['SC'], 'georgia southern': ['GA'],
  'georgia state': ['GA'], 'james madison': ['VA'], louisiana: ['LA'],
  'louisiana-monroe': ['LA'], marshall: ['WV'], 'old dominion': ['VA'],
  'south alabama': ['AL'], 'southern miss': ['MS'], 'texas state': ['TX'],
  troy: ['AL'],
  // Conference USA
  'missouri state': ['MO'], delaware: ['DE'], 'florida international': ['FL'],
  'jacksonville state': ['AL'], 'kennesaw state': ['GA'], liberty: ['VA'],
  'louisiana tech': ['LA'], 'middle tennessee state': ['TN'],
  'new mexico state': ['NM'], 'sam houston': ['TX'], utep: ['TX'],
  'western kentucky': ['KY'],
  // Independent
  connecticut: ['CT'], 'notre dame': ['IN'],
  // MAC
  akron: ['OH'], 'ball state': ['IN'], 'bowling green': ['OH'],
  buffalo: ['NY'], 'central michigan': ['MI'], 'eastern michigan': ['MI'],
  'kent state': ['OH'], massachusetts: ['MA'], 'miami (oh)': ['OH'],
  'northern illinois': ['IL'], ohio: ['OH'], toledo: ['OH'],
  'western michigan': ['MI'],
};

interface Recruit {
  name: string;
  position: string;
  stars: number;
  state: string;
  highSchool: string;
  nationalRank: number;
  committedTo?: string;
}

export default function RecruitingOriginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedTeam, setSelectedTeam] = useState(() => searchParams.get('team') ?? '');
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') ?? '2026');
  const [selectedConference, setSelectedConference] = useState(() => searchParams.get('conference') ?? '');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024, 2023, 2022]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState('');
  const stateRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const statePanelRef = useRef<HTMLDivElement | null>(null);

  const viewMode: 'team' | 'conference' | 'national' = selectedTeam
    ? 'team'
    : selectedConference
    ? 'conference'
    : 'national';

  // Sync URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedConference) params.set('conference', selectedConference);
    if (selectedTeam) params.set('team', selectedTeam);
    if (selectedYear !== '2026') params.set('year', selectedYear);
    const qs = params.toString();
    router.replace(`/recruiting-origin${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [selectedTeam, selectedYear, selectedConference, router]);

  const filteredTeams = useMemo(() => {
    const base = allTeams.filter(t => FBS_CONFERENCES.includes(t.conference));
    if (!selectedConference) return base.sort((a, b) => a.name.localeCompare(b.name));
    return base.filter(t => t.conference === selectedConference).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedConference]);

  const conferenceTeams = useMemo(() =>
    !selectedConference ? [] : allTeams.filter(t => t.conference === selectedConference && FBS_CONFERENCES.includes(t.conference)),
  [selectedConference]);

  // Data fetching
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setRecruits([]);

    async function fetchPaginated(baseUrl: string): Promise<Recruit[]> {
      const all: Recruit[] = [];
      let page = 1;
      while (all.length < 6000) {
        const res = await fetch(`${baseUrl}&page=${page}`, { signal: ctrl.signal });
        const data = await res.json();
        const items: Recruit[] = data.recruits ?? [];
        all.push(...items);
        if (data.availableYears?.length > 0) setAvailableYears(data.availableYears);
        if (items.length < 200) break;
        page++;
      }
      return all;
    }

    async function load() {
      if (viewMode === 'team') {
        const url = getApiPath(`api/cfb/recruits?year=${selectedYear}&team=${encodeURIComponent(selectedTeam)}&committed=committed&limit=200`);
        setRecruits(await fetchPaginated(url));
      } else if (viewMode === 'conference') {
        const results = await Promise.all(
          conferenceTeams.map(team =>
            fetch(
              getApiPath(`api/cfb/recruits?year=${selectedYear}&team=${encodeURIComponent(team.id)}&committed=committed&limit=200`),
              { signal: ctrl.signal }
            )
              .then(r => r.json())
              .then(d => (d.recruits ?? []) as Recruit[])
              .catch(() => [] as Recruit[])
          )
        );
        setRecruits(results.flat());
      } else {
        // National: fetch all committed recruits without team filter
        const url = getApiPath(`api/cfb/recruits?year=${selectedYear}&committed=committed&limit=200`);
        setRecruits(await fetchPaginated(url));
      }
    }

    load()
      .catch(e => { if (e.name !== 'AbortError') console.error(e); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [selectedTeam, selectedYear, selectedConference, viewMode, conferenceTeams]);

  const availablePositions = useMemo(() => {
    const raw = [...new Set(recruits.map(r => r.position).filter(Boolean))];
    // Drop any raw numeric codes that slipped past API normalization
    const valid = raw.filter(p => !/^\d+$/.test(p));
    return valid.sort((a, b) => {
      const ia = POSITION_ORDER.indexOf(a);
      const ib = POSITION_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [recruits]);

  const filteredRecruits = useMemo(() => {
    if (!selectedPosition) return recruits;
    return recruits.filter(r => r.position === selectedPosition);
  }, [recruits, selectedPosition]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filteredRecruits) {
      const abbr = normalizeState(r.state);
      if (abbr) counts[abbr] = (counts[abbr] ?? 0) + 1;
    }
    return counts;
  }, [filteredRecruits]);

  const sortedStates = useMemo(() =>
    Object.entries(stateCounts).sort((a, b) => b[1] - a[1]),
  [stateCounts]);

  const topState = sortedStates[0];

  const inState = useMemo(() => {
    if (viewMode !== 'team') return 0;
    const homeStates = HOME_STATE_MAP[selectedTeam.toLowerCase()] ?? [];
    return filteredRecruits.filter(r => homeStates.includes(normalizeState(r.state))).length;
  }, [filteredRecruits, selectedTeam, viewMode]);

  // Scroll to state panel when a state is clicked
  useEffect(() => {
    if (!selectedState) return;
    statePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedState]);

  const selectedStateRecruits = useMemo(() => {
    if (!selectedState) return [];
    return filteredRecruits
      .filter(r => normalizeState(r.state) === selectedState)
      .sort((a, b) => (a.nationalRank || 9999) - (b.nationalRank || 9999))
      .slice(0, 12);
  }, [filteredRecruits, selectedState]);

  const teamColor = viewMode === 'team' ? (TEAM_COLORS[selectedTeam.toLowerCase()] ?? '#0050A0') : '#0050A0';
  const selectedTeamObj = allTeams.find(t => t.id === selectedTeam);

  const subtitle = viewMode === 'national'
    ? `All FBS Committed Recruits — Class of ${selectedYear}`
    : viewMode === 'conference'
    ? `${selectedConference} Conference Recruiting — Class of ${selectedYear}`
    : selectedTeamObj
    ? `Where ${selectedTeamObj.name} recruits from — Class of ${selectedYear}`
    : 'See which states every CFB program pulls its recruiting classes from';

  function handleConferenceChange(conf: string) {
    setSelectedConference(conf);
    setSelectedTeam('');
    setSelectedState(null);
  }
  function handleTeamChange(team: string) {
    setSelectedTeam(team);
    setSelectedState(null);
  }
  function handleYearChange(year: string) {
    setSelectedYear(year);
    setSelectedState(null);
  }
  function handlePositionChange(pos: string) {
    setSelectedPosition(pos);
    setSelectedState(null);
  }
  function handleStateClick(abbr: string) {
    setSelectedState(prev => prev === abbr ? null : abbr);
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2">
            Recruiting Pipelines
          </h1>
          <p className="text-base sm:text-lg opacity-90 font-medium">{subtitle}</p>
        </div>
      </header>
      <TransferPortalBanner />

      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl space-y-5">
        <RaptiveHeaderAd />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <select
              value={selectedConference}
              onChange={e => handleConferenceChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              <option value="">All Conferences</option>
              {FBS_CONFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedTeam}
              onChange={e => handleTeamChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              <option value="">
                {selectedConference ? `All ${selectedConference} Teams` : 'All FBS Teams'}
              </option>
              {filteredTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={String(y)}>Class of {y}</option>
              ))}
            </select>

            <select
              value={selectedPosition}
              onChange={e => handlePositionChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
              disabled={loading || recruits.length === 0}
            >
              <option value="">All Positions</option>
              {availablePositions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {viewMode !== 'team' && !loading && recruits.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {viewMode === 'national'
                ? 'Showing national FBS recruiting map — select a team or conference to drill down'
                : `Showing combined ${selectedConference} recruiting footprint — select a specific team to drill down`}
            </p>
          )}
          {!loading && recruits.length > 0 && !recruits.some(r => r.stars > 0) && (
            <p className="text-xs text-amber-600 mt-2">
              ★ Star ratings are not available for this recruiting class.
            </p>
          )}
        </div>

        {/* Stats bar */}
        {!loading && filteredRecruits.length > 0 && (
          <div className={`grid gap-3 ${viewMode === 'team' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredRecruits.length}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Total Recruits</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{Object.keys(stateCounts).length}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">States</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold truncate" style={{ color: teamColor }}>
                {topState ? `${STATE_ABBR_TO_NAME[topState[0]] ?? topState[0]} (${topState[1]})` : '—'}
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Top State</div>
            </div>
            {viewMode === 'team' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {filteredRecruits.length > 0 ? `${Math.round((inState / filteredRecruits.length) * 100)}%` : '—'}
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">In-State</div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {viewMode === 'national' ? 'Loading national data…' : viewMode === 'conference' ? `Loading ${selectedConference} data…` : 'Loading recruit data…'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {filteredRecruits.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  {recruits.length === 0
                    ? 'No recruiting data found for this selection.'
                    : `No ${selectedPosition} recruits found for this selection.`}
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-2 sm:hidden text-center">Tap a state to see its recruits</p>
                  <StateChoroMap
                    stateCounts={stateCounts}
                    teamColor={teamColor}
                    selectedState={selectedState ?? undefined}
                    onStateClick={(abbr) => handleStateClick(abbr)}
                  />

                  {/* Color legend */}
                  <div className="flex items-center gap-2 mt-3 justify-center">
                    <span className="text-xs text-gray-400">Fewer</span>
                    <div className="flex rounded overflow-hidden h-3 w-36 border border-gray-200">
                      {[0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map((t) => {
                        const br = 230, bg = 240, bb = 252;
                        const { r: tr, g: tg, b: tb } = hexToRgbClient(teamColor);
                        const nr = Math.round(br + (tr - br) * Math.sqrt(t));
                        const ng = Math.round(bg + (tg - bg) * Math.sqrt(t));
                        const nb = Math.round(bb + (tb - bb) * Math.sqrt(t));
                        return <div key={t} style={{ flex: 1, background: `rgb(${nr},${ng},${nb})` }} />;
                      })}
                    </div>
                    <span className="text-xs text-gray-400">More</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* State panel — appears when a state is clicked */}
        {selectedState && selectedStateRecruits.length > 0 && (
          <div
            ref={statePanelRef}
            className="bg-white rounded-xl shadow-md p-4 border-2"
            style={{ borderColor: teamColor }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {STATE_ABBR_TO_NAME[selectedState] ?? selectedState}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {stateCounts[selectedState] ?? 0} recruit{(stateCounts[selectedState] ?? 0) !== 1 ? 's' : ''}
                  {viewMode === 'team' && selectedTeamObj ? ` committed to ${selectedTeamObj.name}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedState(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1.5">
              {selectedStateRecruits.map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-gray-400 w-4 text-right tabular-nums">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{r.name}</span>
                  <span className="text-xs font-semibold text-gray-500 w-8 text-right">{r.position}</span>
                  {r.stars > 0 && (
                    <span className="text-xs text-yellow-500 tracking-tighter">{'★'.repeat(r.stars)}</span>
                  )}
                  <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">{r.highSchool}</span>
                </div>
              ))}
              {(stateCounts[selectedState] ?? 0) > 12 && (
                <p className="text-xs text-gray-400 pt-1">
                  +{(stateCounts[selectedState] ?? 0) - 12} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* State breakdown table */}
        {!loading && sortedStates.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                Recruits by State — Class of {selectedYear}
                {selectedState && (
                  <button
                    onClick={() => setSelectedState(null)}
                    className="ml-3 text-xs font-normal text-[#0050A0] hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">State</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Recruits</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Share</th>
                    <th className="hidden sm:table-cell text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Top Players</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedStates.map(([abbr, count]) => {
                    const stateRecruits = filteredRecruits
                      .filter(r => normalizeState(r.state) === abbr)
                      .sort((a, b) => (a.nationalRank || 9999) - (b.nationalRank || 9999))
                      .slice(0, 3);
                    const pct = filteredRecruits.length > 0 ? (count / filteredRecruits.length) * 100 : 0;
                    const isSelected = selectedState === abbr;
                    return (
                      <tr
                        key={abbr}
                        ref={el => { stateRowRefs.current[abbr] = el; }}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => handleStateClick(abbr)}
                      >
                        <td className="px-5 py-3">
                          <span className="font-semibold text-gray-900">{STATE_ABBR_TO_NAME[abbr] ?? abbr}</span>
                          <span className="ml-2 text-xs text-gray-400">{abbr}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                            style={{ background: isSelected ? '#111827' : teamColor }}
                          >
                            {count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isSelected ? '#111827' : teamColor }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{Math.round(pct)}%</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-3 text-xs text-gray-600">
                          {stateRecruits.map(r => `${r.name} (${r.position}${r.stars ? ` ${r.stars}★` : ''})`).join(' · ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && recruits.length === 0 && (viewMode === 'team' || viewMode === 'conference') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-500">
            No recruiting data found for {viewMode === 'team' ? selectedTeamObj?.name : `the ${selectedConference}`} — Class of {selectedYear}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function hexToRgbClient(hex: string) {
  if (!hex || !hex.startsWith('#')) return { r: 0, g: 80, b: 160 };
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
