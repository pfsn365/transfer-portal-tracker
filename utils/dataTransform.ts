import { TransferPlayer, PlayerStatus, PlayerClass, PlayerPosition, Conference } from '@/types/player';
import { TransferPortalDataRow, TransferPortalColumns } from '@/types/api';

// Map API status to our status types
function mapStatus(apiStatus: string): PlayerStatus {
  const status = apiStatus.trim();

  // Map common variations
  const statusMap: Record<string, PlayerStatus> = {
    'active': 'Entered',
    'entered': 'Entered',
    'committed': 'Committed',
    'enrolled': 'Enrolled',
    'expected': 'Enrolled',
    'withdrawn': 'Withdrawn',
  };

  return statusMap[status.toLowerCase()] || 'Entered';
}

// Map API class to our class types
function mapClass(apiClass: string): PlayerClass {
  const cls = apiClass.trim().toUpperCase();

  // Map common variations
  if (cls === 'FR' || cls === 'FRESHMAN') return 'FR';
  if (cls === 'SO' || cls === 'SOPHOMORE') return 'SO';
  if (cls === 'JR' || cls === 'JUNIOR') return 'JR';
  if (cls === 'SR' || cls === 'SENIOR') return 'SR';
  if (cls === 'GR' || cls === 'GRADUATE') return 'GR';

  return 'FR'; // Default fallback
}

// Map API position to our position types
function mapPosition(apiPosition: string): PlayerPosition {
  const pos = apiPosition.trim().toUpperCase();

  // Common positions
  const validPositions: PlayerPosition[] = [
    'QB', 'RB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C',
    'EDGE', 'DL', 'DT', 'LB', 'CB', 'S', 'DB',
    'K', 'P', 'LS', 'ATH'
  ];

  if (validPositions.includes(pos as PlayerPosition)) {
    return pos as PlayerPosition;
  }

  return 'ATH'; // Default fallback
}

// Map API conference - just pass through what comes from the Google Sheet
function mapConference(apiConference: string): Conference {
  const conf = apiConference.trim();

  // Return the conference directly from the sheet
  // Type assertion is safe here because we trust the Google Sheet data
  return conf as Conference;
}

// Transform API row to TransferPlayer object
export function transformPlayerData(row: TransferPortalDataRow, index: number): TransferPlayer {
  const playerName = row[TransferPortalColumns.PlayerName]?.trim() || `Player ${index + 1}`;
  const status = mapStatus(row[TransferPortalColumns.Status] || 'Active');
  const playerClass = mapClass(row[TransferPortalColumns.Class] || 'FR');
  const position = mapPosition(row[TransferPortalColumns.Position] || 'ATH');
  const formerSchool = row[TransferPortalColumns.FormerSchool]?.trim() || '';
  const formerConference = mapConference(row[TransferPortalColumns.FormerConference] || '');
  const newSchool = row[TransferPortalColumns.NewSchool]?.trim() || '';
  const newConference = row[TransferPortalColumns.NewConference]?.trim() || '';
  const impactGrade = parseFloat(row[TransferPortalColumns.ImpactGrade] || '0');

  // Create player object
  const player: TransferPlayer = {
    id: `${index + 1}`,
    name: playerName,
    position: position,
    class: playerClass,
    status: status,
    formerSchool: formerSchool,
    formerConference: formerConference,
    announcedDate: new Date().toISOString().split('T')[0], // Use current date as fallback
    rating: impactGrade > 0 ? impactGrade : undefined,
  };

  // Add new school if exists and is different from former school
  if (newSchool && newSchool !== formerSchool && newSchool !== '') {
    player.newSchool = newSchool;
    player.newConference = mapConference(newConference);
  }

  return player;
}

// Transform complete API response to array of TransferPlayer objects
export function transformAPIData(data: string[][]): TransferPlayer[] {
  // Skip header row (first row)
  const dataRows = data.slice(1);

  // Transform each row
  return dataRows.map((row, index) =>
    transformPlayerData(row as TransferPortalDataRow, index)
  ).filter(player => player.name && player.formerSchool); // Filter out invalid entries
}
