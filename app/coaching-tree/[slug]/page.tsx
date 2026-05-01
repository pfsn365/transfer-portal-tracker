import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import { coaches, getCoachById, getCoachRecord, getCoachTitles } from '@/data/coaching/coaches';
import CoachingTreeClient from './CoachingTreeClient';

const BASE = 'https://www.profootballnetwork.com/cfb-hq';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const coach = getCoachById(slug);
  if (!coach) return {};
  const record = getCoachRecord(coach);
  const titles = getCoachTitles(coach);
  const schools = coach.hcCareer.map(t => t.school).join(', ');
  const titleStr = titles.length > 0 ? ` · ${titles.length}× National Champion` : '';
  const desc = `Explore ${coach.name}'s full coaching tree. Career record ${record.wins}–${record.losses}${titleStr}. Programs: ${schools}. See who mentored ${coach.name.split(' ')[1]} and which head coaches came from their tree.`;

  return {
    title: `${coach.name} Coaching Tree | CFB HQ`,
    description: desc,
    openGraph: {
      title: `${coach.name} Coaching Tree | CFB HQ`,
      description: desc,
      url: `${BASE}/coaching-tree/${slug}`,
      type: 'website',
      siteName: 'CFB HQ - Pro Football Network',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${coach.name} Coaching Tree | CFB HQ`,
      description: desc,
      creator: '@PFSN365',
      site: '@PFSN365',
    },
    alternates: { canonical: `${BASE}/coaching-tree/${slug}` },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export function generateStaticParams() {
  const menteeCount = (id: string) => coaches.filter(c => c.mentors.some(m => m.coachId === id)).length;
  return coaches.filter(c => menteeCount(c.id) >= 2).map(c => ({ slug: c.id }));
}

export default async function CoachingTreeSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coach = getCoachById(slug);
  if (!coach) notFound();

  return (
    <React.Suspense>
      <CoachingTreeClient slug={slug} />
    </React.Suspense>
  );
}
