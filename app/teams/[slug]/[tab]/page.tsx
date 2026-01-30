import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, allTeams } from '@/data/teams';
import CFBTeamPage from '../CFBTeamPage';

interface TeamTabPageProps {
  params: Promise<{ slug: string; tab: string }>;
}

const validTabs = ['overview', 'roster', 'schedule', 'stats', 'transfers', 'history', 'draft'];

export async function generateStaticParams() {
  const fbsConferences = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Pac-12', 'Independent'];
  const fbsTeams = allTeams.filter(team => fbsConferences.includes(team.conference));

  const params: { slug: string; tab: string }[] = [];

  for (const team of fbsTeams) {
    for (const tab of validTabs) {
      if (tab !== 'overview') {
        params.push({ slug: team.slug, tab });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: TeamTabPageProps): Promise<Metadata> {
  const { slug, tab } = await params;
  const team = getTeamBySlug(slug);

  if (!team || !validTabs.includes(tab)) {
    return {
      title: 'Page Not Found | CFB HQ',
    };
  }

  const tabTitles: Record<string, string> = {
    overview: 'Overview',
    roster: 'Roster',
    schedule: 'Schedule',
    stats: 'Stats',
    transfers: 'Transfer Portal',
    history: 'Record by Year',
    draft: 'NFL Draft History',
  };

  const tabDescriptions: Record<string, string> = {
    overview: `team overview including record, standings, and key stats`,
    roster: `complete roster with player positions, heights, weights, and hometowns`,
    schedule: `full schedule with game results, scores, and upcoming matchups`,
    stats: `offensive and defensive statistics for the season`,
    transfers: `transfer portal activity including incoming and outgoing players`,
    history: `program history since 2000 including yearly records, bowl games, AP rankings, and coaching history`,
    draft: `NFL Draft history since 2000 including all drafted players, rounds, and NFL teams`,
  };

  const title = `${team.name} ${tabTitles[tab]} | CFB HQ`;
  const description = `${team.name} ${tabDescriptions[tab]} for the ${team.conference}.`;
  const url = `https://www.profootballnetwork.com/cfb-hq/teams/${slug}/${tab}`;

  return {
    title,
    description,
    keywords: [team.name, team.conference, 'College Football', 'CFB', `${team.name} ${tabTitles[tab]}`],
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function TeamTabPage({ params }: TeamTabPageProps) {
  const { slug, tab } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  if (!validTabs.includes(tab)) {
    notFound();
  }

  return <CFBTeamPage team={team} initialTab={tab} />;
}
