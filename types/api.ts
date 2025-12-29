// API Response Types
export interface TransferPortalAPIResponse {
  collections: Array<{
    sheetName: string;
    data: string[][];
  }>;
  updatedTime: string;
}

// Raw data row from API (after header row)
export type TransferPortalDataRow = [
  string,  // Year
  string,  // Player Name
  string,  // Status
  string,  // Class
  string,  // Position
  string,  // Former Conference
  string,  // Former School
  string,  // New Conference
  string,  // New School
  string,  // PFSN Impact Grade
  string   // Date
];

// Column indices for easy reference
export enum TransferPortalColumns {
  Year = 0,
  PlayerName = 1,
  Status = 2,
  Class = 3,
  Position = 4,
  FormerConference = 5,
  FormerSchool = 6,
  NewConference = 7,
  NewSchool = 8,
  ImpactGrade = 9,
  Date = 10
}
