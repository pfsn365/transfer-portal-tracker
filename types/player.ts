export type PlayerStatus = 'Entered' | 'Committed' | 'Withdrawn' | 'Expected';

export type PlayerClass = 'FR' | 'SO' | 'JR' | 'SR' | 'GR';

export type PlayerPosition =
  | 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'OT' | 'OG' | 'C'
  | 'EDGE' | 'DL' | 'DT' | 'LB' | 'CB' | 'S' | 'DB'
  | 'K' | 'P' | 'LS' | 'ATH';

export type Conference =
  | 'SEC' | 'Big Ten' | 'Big 12' | 'ACC' | 'Pac-12'
  | 'American' | 'Mountain West' | 'Sun Belt' | 'MAC' | 'C-USA'
  | 'Independent' | 'FCS';

export interface TransferPlayer {
  id: string;
  name: string;
  position: PlayerPosition;
  class: PlayerClass;
  status: PlayerStatus;
  formerSchool: string;
  formerConference: Conference;
  newSchool?: string;
  newConference?: Conference;
  height?: string;
  weight?: number;
  rating?: number;
  imageUrl?: string;
  announcedDate: string;
  commitDate?: string;
}
