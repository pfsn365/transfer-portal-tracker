import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, allTeams } from '@/data/teams';
import CFBTeamPage from './CFBTeamPage';

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Generate static params for all FBS teams
  const fbsConferences = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Pac-12', 'Independent'];
  const fbsTeams = allTeams.filter(team => fbsConferences.includes(team.conference));

  return fbsTeams.map((team) => ({
    slug: team.slug,
  }));
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    return {
      title: 'Team Not Found | CFB HQ',
    };
  }

  return {
    title: `${team.name} | CFB HQ`,
    description: `${team.name} football team page. View roster, schedule, stats, transfer portal activity, and standings for the ${team.conference}.`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  return <CFBTeamPage team={team} initialTab="overview" />;
}
