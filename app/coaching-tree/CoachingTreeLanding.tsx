'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import { coaches, getCoachRecord, getCoachTitles, FEATURED_COACHES, type Coach } from '@/data/coaching/coaches';
import { getTeamLogo } from '@/utils/teamLogos';

const LOGO_NAME_MAP: Record<string, string> = { 'UNC': 'North Carolina' };

function SchoolLogo({ school }: { school: string }) {
  const url = getTeamLogo(LOGO_NAME_MAP[school] ?? school);
  return (
    <img
      src={url}
      alt={school}
      width={18}
      height={18}
      className="object-contain flex-shrink-0 inline-block"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

const SCHOOL_CONF: Record<string, string> = {
  'Alabama': 'SEC', 'Georgia': 'SEC', 'LSU': 'SEC', 'Florida': 'SEC',
  'South Carolina': 'SEC', 'Kentucky': 'SEC', 'Mississippi State': 'SEC',
  'Ole Miss': 'SEC', 'Texas': 'SEC', 'Oklahoma': 'SEC', 'Tennessee': 'SEC',
  'Arkansas': 'SEC', 'Auburn': 'SEC', 'Vanderbilt': 'SEC', 'Missouri': 'SEC',
  'Texas A&M': 'SEC', 'Mississippi': 'SEC',
  'Ohio State': 'Big Ten', 'Michigan': 'Big Ten', 'Iowa': 'Big Ten',
  'Michigan State': 'Big Ten', 'Wisconsin': 'Big Ten', 'Maryland': 'Big Ten',
  'USC': 'Big Ten', 'Minnesota': 'Big Ten', 'Indiana': 'Big Ten',
  'Nebraska': 'Big Ten', 'Penn State': 'Big Ten', 'Purdue': 'Big Ten',
  'Illinois': 'Big Ten', 'Rutgers': 'Big Ten', 'Northwestern': 'Big Ten',
  'Washington': 'Big Ten', 'UCLA': 'Big Ten', 'Oregon': 'Big Ten',
  'Clemson': 'ACC', 'Virginia Tech': 'ACC', 'UNC': 'ACC', 'Duke': 'ACC',
  'NC State': 'ACC', 'Florida State': 'ACC', 'Miami': 'ACC', 'Pittsburgh': 'ACC',
  'Georgia Tech': 'ACC', 'Louisville': 'ACC', 'Syracuse': 'ACC', 'SMU': 'ACC',
  'Houston': 'Big 12', 'TCU': 'Big 12', 'Baylor': 'Big 12', 'Kansas State': 'Big 12',
  'Iowa State': 'Big 12', 'Kansas': 'Big 12', 'Colorado': 'Big 12',
  'Utah': 'Big 12', 'Arizona': 'Big 12', 'Arizona State': 'Big 12',
  'Notre Dame': 'Independent', 'Army': 'Independent', 'Navy': 'Independent',
  'Colorado State': 'Mountain West', 'Bowling Green': 'MAC', 'Toledo': 'MAC',
  'Miami (OH)': 'MAC', 'FAU': 'American', 'Tulane': 'American',
  'Louisiana': 'Sun Belt',
};

function getCoachConference(coach: Coach): string {
  const school = coach.active ? coach.currentSchool : coach.hcCareer.at(-1)?.school;
  return (school && SCHOOL_CONF[school]) ?? 'Other';
}


function CoachCard({ coachId }: { coachId: string }) {
  const coach = coaches.find(c => c.id === coachId);
  if (!coach) return null;
  const record = getCoachRecord(coach);
  const titles = getCoachTitles(coach);
  const menteeCount = coaches.filter(c => c.mentors.some(m => m.coachId === coachId)).length;
  const pct = record.wins + record.losses > 0
    ? ((record.wins / (record.wins + record.losses)) * 100).toFixed(1)
    : '—';

  return (
    <Link
      href={`/coaching-tree/${coachId}`}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0050A0] hover:shadow-md transition-all cursor-pointer block"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0050A0] to-[#003a75] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {coach.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors truncate">{coach.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {coach.active ? (
              <span className="text-green-600 font-medium flex items-center gap-1.5">
                <SchoolLogo school={coach.currentSchool!} />
                {coach.currentSchool} · Active
              </span>
            ) : (() => {
              const s = coach.hcCareer[coach.hcCareer.length - 1]?.school;
              return s ? <span className="flex items-center gap-1.5"><SchoolLogo school={s} />{s}</span> : null;
            })()}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">{record.wins}–{record.losses}</span>
        <span className="text-gray-400">·</span>
        <span>{pct}%</span>
        {titles.length > 0 && (
          <>
            <span className="text-gray-400">·</span>
            <span className="text-yellow-600 font-medium whitespace-nowrap">
              {titles.length} natl. title{titles.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>
      {menteeCount > 0 && (
        <p className="mt-2 text-xs text-[#0050A0] font-medium">{menteeCount} HC{menteeCount !== 1 ? 's' : ''} in tree</p>
      )}
    </Link>
  );
}

const ALL_CONFERENCES = ['SEC', 'Big Ten', 'ACC', 'Big 12', 'Independent', 'Mountain West', 'American', 'MAC', 'Sun Belt', 'Other'];

export default function CoachingTreeLanding() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [conference, setConference] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const menteeCount = (id: string) => coaches.filter(c => c.mentors.some(m => m.coachId === id)).length;
    return coaches
      .filter(c => menteeCount(c.id) >= 2 && c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query]);

  const filteredCoaches = useMemo(() => {
    const menteeCount = (id: string) => coaches.filter(c => c.mentors.some(m => m.coachId === id)).length;
    return coaches
      .filter(c => !FEATURED_COACHES.includes(c.id))
      .filter(c => menteeCount(c.id) >= 2)
      .filter(c => !activeOnly || c.active)
      .filter(c => !conference || getCoachConference(c) === conference)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [conference, activeOnly]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">CFB Coaching Trees</h1>
          <p className="text-lg opacity-90 font-medium">Follow the mentors and disciples behind college football's biggest dynasties.</p>
        </div>
      </header>
      <TransferPortalBanner />
      <RaptiveHeaderAd />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Search + Filters */}
        <div className="relative mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <svg className="w-5 h-5 ml-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search any coach…"
                  className="flex-1 px-3 py-3 text-gray-900 text-sm outline-none bg-transparent"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && suggestions.length > 0) {
                      router.push(`/coaching-tree/${suggestions[0].id}`);
                      setQuery('');
                    }
                  }}
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  {suggestions.map(c => {
                    const rec = getCoachRecord(c);
                    return (
                      <button
                        key={c.id}
                        onClick={() => { router.push(`/coaching-tree/${c.id}`); setQuery(''); }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 text-left transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                        <span className="text-xs text-gray-500">{rec.wins}–{rec.losses} · {c.active ? c.currentSchool : c.hcCareer.at(-1)?.school}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Conference filter */}
            <select
              value={conference}
              onChange={e => setConference(e.target.value)}
              className="h-[46px] pl-3 pr-8 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236B7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="">All Conferences</option>
              {ALL_CONFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Active toggle */}
            <button
              onClick={() => setActiveOnly(v => !v)}
              className={`h-[46px] px-4 text-sm rounded-xl border font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeOnly
                  ? 'bg-[#0050A0] text-white border-[#0050A0]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#0050A0] hover:text-[#0050A0]'
              }`}
            >
              Active only
            </button>

            {(conference || activeOnly) && (
              <button
                onClick={() => { setConference(''); setActiveOnly(false); }}
                className="h-[46px] px-3 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">Featured Trees</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_COACHES.map(id => <CoachCard key={id} coachId={id} />)}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mt-10 mb-4">
          All Coaches
          {(conference || activeOnly) && (
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredCoaches.length} result{filteredCoaches.length !== 1 ? 's' : ''})</span>
          )}
        </h2>
        {filteredCoaches.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No coaches match the current filters.</p>
            <button onClick={() => { setConference(''); setActiveOnly(false); }} className="mt-2 text-sm text-[#0050A0] hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCoaches.map(c => <CoachCard key={c.id} coachId={c.id} />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
