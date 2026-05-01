'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import {
  coaches, getCoachById, getCoachRecord, getCoachTitles, getCoachMentees,
  type Coach,
} from '@/data/coaching/coaches';
import { getTeamLogo } from '@/utils/teamLogos';

const LOGO_NAME_MAP: Record<string, string> = { 'UNC': 'North Carolina' };

function SchoolLogo({ school, size = 20 }: { school: string; size?: number }) {
  const url = getTeamLogo(LOGO_NAME_MAP[school] ?? school);
  return (
    <img
      src={url}
      alt={school}
      width={size}
      height={size}
      className="object-contain flex-shrink-0"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

// ─── Lazy-load React Flow (DOM APIs, no SSR) ──────────────────────────────────
const CoachingTreeFlow = dynamic(() => import('./CoachingTreeFlow'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-gray-400 text-sm">Loading tree…</p>
    </div>
  ),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRecord(c: Coach) {
  const r = getCoachRecord(c);
  const pct = r.wins + r.losses > 0 ? ((r.wins / (r.wins + r.losses)) * 100).toFixed(1) : '—';
  return `${r.wins}–${r.losses} (${pct}%)`;
}

// Returns the school a coach is most associated with:
// active → current school; retired → most titles, break ties by wins
function getFamousSchool(coach: Coach): string | null {
  if (coach.active && coach.currentSchool) return coach.currentSchool;
  if (coach.hcCareer.length === 0) return null;
  return coach.hcCareer.reduce((best, t) => {
    if (t.titles.length > best.titles.length) return t;
    if (t.titles.length === best.titles.length && t.wins > best.wins) return t;
    return best;
  }).school;
}

function CoachAvatar({ coach }: { coach: Coach }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const school = getFamousSchool(coach);
  const initials = coach.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  if (!school || logoFailed) {
    return (
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0050A0] to-[#003a75] flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0 p-1.5 shadow-sm">
      <img
        src={getTeamLogo(LOGO_NAME_MAP[school] ?? school)}
        alt={school}
        width={44}
        height={44}
        className="object-contain w-full h-full"
        onError={() => setLogoFailed(true)}
      />
    </div>
  );
}


// ─── Main component ───────────────────────────────────────────────────────────

export default function CoachingTreeClient({ slug }: { slug: string }) {
  const router = useRouter();
  const coach = getCoachById(slug);

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Coach not found.</p>
          <Link href="/coaching-tree" className="mt-4 inline-block text-[#0050A0] hover:underline text-sm">
            ← Back to Coaching Trees
          </Link>
        </div>
      </div>
    );
  }

  const record = getCoachRecord(coach);
  const titles = getCoachTitles(coach);
  const directMentors = coach.mentors.map(m => ({ stint: m, coach: getCoachById(m.coachId) })).filter(m => m.coach);
  const directMentees = getCoachMentees(slug);
  const pct = record.wins + record.losses > 0 ? ((record.wins / (record.wins + record.losses)) * 100).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero — same generic header as the landing page */}
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* Coach profile card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <Link href="/coaching-tree" className="text-[#0050A0] hover:underline text-sm inline-flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Coaching Trees
          </Link>
          <div className="flex items-center gap-4">
            <CoachAvatar coach={coach} />
            <div>
              <p className="text-2xl font-extrabold text-gray-900 leading-tight">{coach.name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                <span>{record.wins}–{record.losses} ({pct}%)</span>
                {titles.length > 0 && (
                  <span className="text-yellow-600 font-semibold">
                    {titles.length}× National Champion ({titles.join(', ')})
                  </span>
                )}
                {coach.active && (
                  <span className="bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-xs font-semibold">
                    Active · {coach.currentSchool}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tree visualization */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Coaching Tree</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <CoachingTreeFlow targetId={slug} onNavigate={id => router.push(`/coaching-tree/${id}`)} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Click any coach to view their tree · Scroll to zoom · Drag to pan</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Mentors */}
          {directMentors.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Mentors</h2>
              <div className="space-y-2">
                {directMentors.map(({ stint, coach: mentor }) => {
                  if (!mentor) return null;
                  const mr = getCoachRecord(mentor);
                  return (
                    <Link
                      key={mentor.id}
                      href={`/coaching-tree/${mentor.id}`}
                      className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-[#0050A0] hover:shadow-sm transition-all group"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#0050A0] transition-colors">{mentor.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <SchoolLogo school={stint.school} size={14} />
                          {stint.role} · {stint.school} · {stint.startYear}–{stint.endYear}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">{mr.wins}–{mr.losses}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Mentees */}
          {directMentees.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Head Coaches Developed</h2>
              <div className="space-y-2">
                {directMentees.map(mentee => {
                  const mr = getCoachRecord(mentee);
                  const mt = getCoachTitles(mentee);
                  const stint = mentee.mentors.find(m => m.coachId === slug)!;
                  return (
                    <Link
                      key={mentee.id}
                      href={`/coaching-tree/${mentee.id}`}
                      className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-[#0050A0] hover:shadow-sm transition-all group"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#0050A0] transition-colors">{mentee.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <SchoolLogo school={stint.school} size={14} />
                          {stint.role} · {stint.school} · {stint.startYear}–{stint.endYear}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{mr.wins}–{mr.losses}</p>
                        {mt.length > 0 && (
                          <p className="text-xs text-yellow-600 font-medium text-right">
                            {mt.length} natl. title{mt.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* HC Career */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Head Coaching Career</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">School</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Years</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">W</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">L</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pct</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Titles</th>
                </tr>
              </thead>
              <tbody>
                {coach.hcCareer.map((t, i) => {
                  const p = t.wins + t.losses > 0 ? ((t.wins / (t.wins + t.losses)) * 100).toFixed(1) : '—';
                  return (
                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <SchoolLogo school={t.school} size={22} />
                          {t.school}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{t.startYear}–{t.endYear ?? 'present'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{t.wins}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{t.losses}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{p}%</td>
                      <td className="px-4 py-3 text-center">
                        {t.titles.length > 0
                          ? <span className="text-yellow-600 font-semibold">{t.titles.join(', ')}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr className="bg-[#0050A0]/5 font-bold">
                  <td className="px-4 py-3 text-[#0050A0]">Career Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-center text-gray-900">{record.wins}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{record.losses}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{pct}%</td>
                  <td className="px-4 py-3 text-center text-yellow-600">{titles.length > 0 ? titles.length : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
