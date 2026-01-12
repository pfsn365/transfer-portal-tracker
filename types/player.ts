export type PlayerStatus = 'Entered' | 'Committed';

export type PlayerClass = 'FR' | 'SO' | 'JR' | 'SR' | 'GR' | 'RS-FR' | 'RS-SO' | 'RS-JR' | 'RS-SR' | 'RS-GR';

export type PlayerPosition =
  | 'QB' | 'RB' | 'WR' | 'TE' | 'OT' | 'IOL'
  | 'EDGE' | 'DL' | 'LB' | 'CB' | 'S'
  | 'K' | 'P' | 'LS' | 'ATH';

export type Conference =
  | 'SEC' | 'Big Ten' | 'Big 12' | 'ACC' | 'Pac-12'
  | 'American' | 'Mountain West' | 'Sun Belt' | 'MAC' | 'Conference USA'
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
