// Team History Types for the History Tab

export interface YearlyRecord {
  year: number;
  wins: number;
  losses: number;
  ties?: number;
  confWins: number;
  confLosses: number;
  confTies?: number;
  conference: string;
  apRankFinal?: number; // Final AP Poll ranking (if ranked)
  cfpRankFinal?: number; // Final CFP ranking (if ranked)
  conferenceChampion?: boolean;
  divisionChampion?: boolean;
  bowlGame?: string; // Name of bowl game if applicable
  bowlResult?: 'W' | 'L'; // Bowl game result
  headCoach: string;
}

export interface BowlGame {
  year: number; // Season year (e.g., 2024 for 2024-25 bowl season)
  bowlName: string;
  date: string; // ISO date string
  opponent: string;
  opponentConference: string;
  result: 'W' | 'L';
  score: string; // e.g., "35-28"
  location: string;
  mvp?: string; // Bowl MVP if applicable
}

export interface Coach {
  name: string;
  startYear: number;
  endYear: number | null; // null if current coach
  overallWins: number;
  overallLosses: number;
  overallTies?: number;
  confWins: number;
  confLosses: number;
  confTies?: number;
  bowlWins: number;
  bowlLosses: number;
  conferenceChampionships: number;
  nationalChampionships: number;
  previousSchool?: string;
  nextSchool?: string; // Where they went after leaving
}

export interface DraftedPlayer {
  name: string;
  year: number; // Draft year
  round: number;
  pick: number; // Overall pick number
  nflTeam: string;
  position: string;
  yearsAtSchool?: string; // e.g., "2019-2022"
}

export interface TeamHistory {
  teamId: string;
  teamName: string;
  allTimeRecord: {
    wins: number;
    losses: number;
    ties: number;
    winPct: number;
  };
  firstSeason: number;
  nationalChampionships: number[];
  conferenceChampionships: {
    year: number;
    conference: string;
  }[];
  rivalries: {
    opponent: string;
    trophyName?: string;
    allTimeRecord: string; // e.g., "54-32-4"
  }[];
  stadiumName: string;
  stadiumCapacity: number;
  yearlyRecords: YearlyRecord[];
  bowlGames: BowlGame[];
  coaches: Coach[];
  draftedPlayers: DraftedPlayer[];
}

// Summary stats computed from history
export interface TeamHistorySummary {
  totalWins: number;
  totalLosses: number;
  bowlAppearances: number;
  bowlWins: number;
  totalDraftPicks: number;
  firstRoundPicks: number;
  conferenceChampionships: number;
  nationalChampionships: number;
  currentCoach: string;
  currentCoachRecord: string;
}
