import { Conference } from '@/types/player';

// List of FCS conferences
// When a user selects "FCS" in the filter, we want to show all players from these conferences
export const FCS_CONFERENCES = [
  'Big Sky',
  'CAA',
  'MVFC',
  'Southern',
  'Southland',
  'Patriot',
  'Pioneer',
  'Ivy League',
  'SWAC',
  'MEAC',
  'Big South-OVC',
  'Northeast',
  'OVC',
  'ASUN',
  'UAC',
  'Colonial',
  'Missouri Valley',
  'Big South',
  'Ohio Valley',
  'Atlantic Sun',
  'United Athletic',
];

/**
 * Check if a conference is an FCS conference
 * @param conference - The conference to check
 * @returns true if the conference is an FCS conference
 */
export function isFCSConference(conference: string): boolean {
  if (!conference) return false;

  // Direct match
  if (FCS_CONFERENCES.includes(conference)) return true;

  // Case-insensitive partial match for variations
  const conferenceLower = conference.toLowerCase();
  return FCS_CONFERENCES.some(fcsConf =>
    conferenceLower.includes(fcsConf.toLowerCase()) ||
    fcsConf.toLowerCase().includes(conferenceLower)
  );
}
