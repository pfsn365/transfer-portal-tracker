import type { Metadata } from 'next';
import CFBHomePageContent from '@/components/CFBHomePageContent';

export const metadata: Metadata = {
  title: 'College Football HQ - CFB Tools, Playoff Bracket & Transfer Portal',
  description: 'Your destination for college football tools and data at PFSN. Whether it is the latest schedule or indepth analytics, we have you covered.',
  keywords: [
    'College Football',
    'CFB',
    'CFB Playoff Bracket',
    'College Football Playoff',
    'College Football Tools',
    'CFB Standings',
    'CFB Schedule',
    'CFB Stat Leaders',
    'Transfer Portal',
  ],
  openGraph: {
    title: 'College Football HQ - CFB Tools, Playoff Bracket & Transfer Portal',
    description: 'Your destination for college football tools and data at PFSN. Whether it is the latest schedule or indepth analytics, we have you covered.',
    url: 'https://www.profootballnetwork.com/cfb-hq',
  },
  twitter: {
    title: 'College Football HQ - CFB Tools, Playoff Bracket & Transfer Portal',
    description: 'Your destination for college football tools and data at PFSN. Whether it is the latest schedule or indepth analytics, we have you covered.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq',
  },
};

export default function CFBHQPage() {
  return <CFBHomePageContent />;
}
