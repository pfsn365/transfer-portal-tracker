import { Metadata } from 'next';
import PostseasonClient from './PostseasonClient';

export const metadata: Metadata = {
  title: 'CFB Postseason Hub 2025-26 | Playoff, Bowl Games & National Champions',
  description: 'Complete coverage of the 2025-26 college football postseason. College Football Playoff bracket, all bowl game results, conference performance, and national champions history.',
  keywords: [
    'CFB Postseason',
    'College Football Playoff',
    'CFP Bracket',
    'Bowl Games',
    'Bowl Game Results',
    'National Champions',
    'College Football Bowl Season',
    'CFP Rankings',
  ],
  openGraph: {
    title: 'CFB Postseason Hub 2025-26 | Playoff, Bowl Games & National Champions',
    description: 'Complete coverage of the 2025-26 college football postseason including playoff bracket, bowl games, and national champions history.',
    url: 'https://www.profootballnetwork.com/cfb-hq/postseason',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Postseason Hub 2025-26 | Playoff, Bowl Games & National Champions',
    description: 'Complete coverage of the 2025-26 college football postseason.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/postseason',
  },
};

export default function PostseasonPage() {
  return <PostseasonClient />;
}
