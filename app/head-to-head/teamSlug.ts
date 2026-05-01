import { allTeams } from '@/data/teams';

export function teamIdToSlug(id: string): string {
  return id.replace(/&/g, '').replace(/[()]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const slugToIdMap: Map<string, string> = new Map(
  allTeams.map(t => [teamIdToSlug(t.id), t.id])
);

export function slugToTeamId(slug: string): string | undefined {
  return slugToIdMap.get(slug);
}
