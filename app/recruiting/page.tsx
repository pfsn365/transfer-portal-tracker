import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import RecruitingClient from './RecruitingClient';

export const metadata: Metadata = {
  title: 'Recruiting Hub - CFB Recruit Rankings & Database | CFB HQ',
  description:
    'Browse college football recruit rankings from 247Sports, ESPN, and On3. Search and filter recruits by position, star rating, state, and commitment status. Composite rankings from 2000 to 2028.',
  keywords: [
    'College Football Recruiting',
    'CFB Recruiting Rankings',
    '247Sports Rankings',
    'ESPN Recruiting',
    'On3 Recruiting',
    'College Football Recruits',
    'CFB Recruit Database',
    'High School Football Recruits',
    'College Football Commits',
    '5 Star Recruits',
    'Recruiting Class Rankings',
  ],
  openGraph: {
    title: 'Recruiting Hub - CFB Recruit Rankings & Database | CFB HQ',
    description:
      'Browse college football recruit rankings from 247Sports, ESPN, and On3. Composite rankings, filters by position, stars, state, and commitment status.',
    url: 'https://www.profootballnetwork.com/cfb-hq/recruiting',
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recruiting Hub - CFB Recruit Rankings & Database | CFB HQ',
    description:
      'Browse college football recruit rankings from 247Sports, ESPN, and On3. Composite rankings from 2000 to 2028.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/recruiting',
  },
};

export default function RecruitingPage() {
  return <RecruitingClient />;
}
