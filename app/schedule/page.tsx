import { Metadata } from 'next';
import ScheduleClient from './ScheduleClient';

export const metadata: Metadata = {
  title: 'CFB Schedule 2025 | College Football Games & Scores',
  description: 'View the complete 2025 college football schedule. Browse FBS and FCS games by week, check scores, TV broadcasts, and game times for all conferences.',
  keywords: [
    'CFB Schedule',
    'College Football Schedule',
    'CFB Games',
    'College Football Scores',
    'FBS Schedule',
    'FCS Schedule',
    'NCAA Football Schedule',
  ],
  openGraph: {
    title: 'CFB Schedule 2025 | College Football Games & Scores',
    description: 'View the complete 2025 college football schedule. Browse FBS and FCS games by week, check scores, TV broadcasts, and game times.',
    url: 'https://www.profootballnetwork.com/cfb-hq/schedule',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Schedule 2025 | College Football Games & Scores',
    description: 'View the complete 2025 college football schedule. Browse FBS and FCS games by week, check scores, and game times.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/schedule',
  },
};

export default function SchedulePage() {
  return <ScheduleClient />;
}
