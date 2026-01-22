import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, allTeams } from '@/data/teams';
import CFBTeamPage from '../CFBTeamPage';

interface TeamTabPageProps {
  params: Promise<{ slug: string; tab: string }>;
}

const validTabs = ['overview', 'roster', 'schedule', 'stats', 'transfers'];

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
  };

  return {
    title: `${team.name} ${tabTitles[tab]} | CFB HQ`,
    description: `${team.name} ${tabTitles[tab].toLowerCase()} - View ${tabTitles[tab].toLowerCase()} information for ${team.name} of the ${team.conference}.`,
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
