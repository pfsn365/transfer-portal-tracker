import { Metadata } from 'next';
import StatLeadersClient from './StatLeadersClient';

export const metadata: Metadata = {
  title: 'CFB Stat Leaders 2025 | College Football Statistics',
  description: 'View the top statistical leaders in college football. Browse passing, rushing, receiving, and defensive stat leaders for FBS and FCS divisions.',
  keywords: [
    'CFB Stat Leaders',
    'College Football Statistics',
    'CFB Passing Leaders',
    'CFB Rushing Leaders',
    'CFB Receiving Leaders',
    'NCAA Football Stats',
    'FBS Stat Leaders',
    'FCS Stat Leaders',
  ],
  openGraph: {
    title: 'CFB Stat Leaders 2025 | College Football Statistics',
    description: 'View the top statistical leaders in college football. Browse passing, rushing, receiving, and defensive stats for FBS and FCS.',
    url: 'https://profootballnetwork.com/cfb-hq/stat-leaders',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Stat Leaders 2025 | College Football Statistics',
    description: 'View the top statistical leaders in college football for FBS and FCS divisions.',
  },
  alternates: {
    canonical: 'https://profootballnetwork.com/cfb-hq/stat-leaders',
  },
};

export default function StatLeadersPage() {
  return <StatLeadersClient />;
}
