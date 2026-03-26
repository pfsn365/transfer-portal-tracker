import { MetadataRoute } from 'next';
import { allTeams } from '@/data/teams';

const BASE_URL = 'https://www.profootballnetwork.com/cfb-hq';

const FBS_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Pac-12', 'Independent'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/transfer-portal-tracker`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/schedule`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/standings`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/rankings`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/stat-leaders`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/postseason`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/spring-games`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/power-rankings-builder`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/players`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/articles`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/draft-history`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/recruiting`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/teams`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Team pages (FBS only)
  const fbsTeams = allTeams.filter(team => FBS_CONFERENCES.includes(team.conference));
  const teamTabs = ['roster', 'schedule', 'stats', 'transfers', 'history', 'draft'];

  const teamPages: MetadataRoute.Sitemap = fbsTeams.flatMap(team => [
    { url: `${BASE_URL}/teams/${team.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    ...teamTabs.map(tab => ({
      url: `${BASE_URL}/teams/${team.slug}/${tab}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]);

  return [...staticPages, ...teamPages];
}
