import { Metadata } from 'next';
import TeamPageClient from './TeamPageClient';
import { getTeamBySlug, allTeams } from '@/data/teams';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    return {
      title: 'Team Not Found | CFB Transfer Portal Tracker',
      description: 'The requested college football team page could not be found.',
    };
  }

  const title = `${team.name} Transfer Portal Tracker | ${team.conference}`;
  const description = `Track ${team.name} transfer portal activity. View incoming and outgoing transfers, roster changes, and recruiting updates for ${team.name} ${team.conference} football.`;
  const url = `https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/teams/${team.slug}`;
  const imageUrl = `https://staticd.profootballnetwork.com/skm/assets/college-football-playoff-predictor/team-logos/${team.id.toUpperCase()}.png`;

  return {
    title,
    description,
    keywords: [
      `${team.name} transfer portal`,
      `${team.name} transfers`,
      `${team.name} recruiting`,
      `${team.conference} transfers`,
      'college football transfer portal',
      'CFB transfers',
      `${team.name} roster changes`,
      'transfer portal tracker',
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: 'PFSN',
      images: [
        {
          url: imageUrl,
          width: 400,
          height: 400,
          alt: `${team.name} logo`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export async function generateStaticParams() {
  // Generate static paths for all teams
  return allTeams.map((team) => ({
    slug: team.slug,
  }));
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  return <TeamPageClient slug={slug} />;
}
