import { Metadata } from 'next';
import SpringGamesClient from './SpringGamesClient';

export const metadata: Metadata = {
  title: 'CFB Spring Game Schedule 2025 | College Football Spring Games',
  description: 'Complete 2025 college football spring game schedule. Find dates for every FBS spring game, showcase, and scrimmage by team and conference.',
  keywords: [
    'CFB Spring Games',
    'College Football Spring Game Schedule',
    'Spring Game Dates 2025',
    'SEC Spring Games',
    'Big Ten Spring Games',
    'NCAA Football Spring Games',
  ],
  openGraph: {
    title: 'CFB Spring Game Schedule 2025 | College Football Spring Games',
    description: 'Complete 2025 college football spring game schedule. Find dates for every FBS spring game, showcase, and scrimmage.',
    url: 'https://www.profootballnetwork.com/cfb-hq/spring-games',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Spring Game Schedule 2025 | College Football Spring Games',
    description: 'Complete 2025 college football spring game schedule.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/spring-games',
  },
};

export default function SpringGamesPage() {
  return <SpringGamesClient />;
}
