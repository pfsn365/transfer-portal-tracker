import { getTeamLogo } from '@/utils/teamLogos';

// Historical CFP Rankings - Used as fallback when ESPN API doesn't return CFP data
// Source: https://www.espn.com/college-football/story/_/id/47223665/college-football-playoff-2025-byes-bracket-final-top-25

export interface HistoricalCFPTeam {
  current: number;
  previous?: number;
  team: {
    id: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    nickname: string;
  };
  record: string;
}

export interface HistoricalCFPRankings {
  name: string;
  shortName: string;
  type: string;
  releaseDate: string;
  ranks: HistoricalCFPTeam[];
}

// Final CFP Rankings released December 7, 2025
export const cfpFinalRankings2025: HistoricalCFPRankings = {
  name: 'College Football Playoff Rankings',
  shortName: 'CFP',
  type: 'cfp',
  releaseDate: '2025-12-07',
  ranks: [
    {
      current: 1,
      previous: 2,
      team: {
        id: '84',
        displayName: 'Indiana Hoosiers',
        shortDisplayName: 'Indiana',
        logo: getTeamLogo('indiana'),
        nickname: 'Hoosiers',
      },
      record: '13-0',
    },
    {
      current: 2,
      previous: 1,
      team: {
        id: '194',
        displayName: 'Ohio State Buckeyes',
        shortDisplayName: 'Ohio State',
        logo: getTeamLogo('ohio state'),
        nickname: 'Buckeyes',
      },
      record: '12-1',
    },
    {
      current: 3,
      previous: 3,
      team: {
        id: '61',
        displayName: 'Georgia Bulldogs',
        shortDisplayName: 'Georgia',
        logo: getTeamLogo('georgia'),
        nickname: 'Bulldogs',
      },
      record: '12-1',
    },
    {
      current: 4,
      previous: 7,
      team: {
        id: '2641',
        displayName: 'Texas Tech Red Raiders',
        shortDisplayName: 'Texas Tech',
        logo: getTeamLogo('texas tech'),
        nickname: 'Red Raiders',
      },
      record: '12-1',
    },
    {
      current: 5,
      previous: 4,
      team: {
        id: '2483',
        displayName: 'Oregon Ducks',
        shortDisplayName: 'Oregon',
        logo: getTeamLogo('oregon'),
        nickname: 'Ducks',
      },
      record: '11-1',
    },
    {
      current: 6,
      previous: 5,
      team: {
        id: '145',
        displayName: 'Ole Miss Rebels',
        shortDisplayName: 'Ole Miss',
        logo: getTeamLogo('ole miss'),
        nickname: 'Rebels',
      },
      record: '11-1',
    },
    {
      current: 7,
      previous: 6,
      team: {
        id: '245',
        displayName: 'Texas A&M Aggies',
        shortDisplayName: 'Texas A&M',
        logo: getTeamLogo('texas a&m'),
        nickname: 'Aggies',
      },
      record: '11-1',
    },
    {
      current: 8,
      previous: 10,
      team: {
        id: '201',
        displayName: 'Oklahoma Sooners',
        shortDisplayName: 'Oklahoma',
        logo: getTeamLogo('oklahoma'),
        nickname: 'Sooners',
      },
      record: '10-2',
    },
    {
      current: 9,
      previous: 8,
      team: {
        id: '333',
        displayName: 'Alabama Crimson Tide',
        shortDisplayName: 'Alabama',
        logo: getTeamLogo('alabama'),
        nickname: 'Crimson Tide',
      },
      record: '10-3',
    },
    {
      current: 10,
      previous: 9,
      team: {
        id: '2390',
        displayName: 'Miami Hurricanes',
        shortDisplayName: 'Miami',
        logo: getTeamLogo('miami'),
        nickname: 'Hurricanes',
      },
      record: '10-2',
    },
    {
      current: 11,
      previous: 11,
      team: {
        id: '87',
        displayName: 'Notre Dame Fighting Irish',
        shortDisplayName: 'Notre Dame',
        logo: getTeamLogo('notre dame'),
        nickname: 'Fighting Irish',
      },
      record: '10-2',
    },
    {
      current: 12,
      previous: 12,
      team: {
        id: '252',
        displayName: 'BYU Cougars',
        shortDisplayName: 'BYU',
        logo: getTeamLogo('byu'),
        nickname: 'Cougars',
      },
      record: '11-2',
    },
    {
      current: 13,
      previous: 14,
      team: {
        id: '251',
        displayName: 'Texas Longhorns',
        shortDisplayName: 'Texas',
        logo: getTeamLogo('texas'),
        nickname: 'Longhorns',
      },
      record: '9-3',
    },
    {
      current: 14,
      previous: 16,
      team: {
        id: '238',
        displayName: 'Vanderbilt Commodores',
        shortDisplayName: 'Vanderbilt',
        logo: getTeamLogo('vanderbilt'),
        nickname: 'Commodores',
      },
      record: '10-2',
    },
    {
      current: 15,
      previous: 18,
      team: {
        id: '254',
        displayName: 'Utah Utes',
        shortDisplayName: 'Utah',
        logo: getTeamLogo('utah'),
        nickname: 'Utes',
      },
      record: '10-2',
    },
    {
      current: 16,
      previous: 15,
      team: {
        id: '30',
        displayName: 'USC Trojans',
        shortDisplayName: 'USC',
        logo: getTeamLogo('usc'),
        nickname: 'Trojans',
      },
      record: '9-3',
    },
    {
      current: 17,
      previous: 17,
      team: {
        id: '12',
        displayName: 'Arizona Wildcats',
        shortDisplayName: 'Arizona',
        logo: getTeamLogo('arizona'),
        nickname: 'Wildcats',
      },
      record: '9-3',
    },
    {
      current: 18,
      previous: 19,
      team: {
        id: '130',
        displayName: 'Michigan Wolverines',
        shortDisplayName: 'Michigan',
        logo: getTeamLogo('michigan'),
        nickname: 'Wolverines',
      },
      record: '9-3',
    },
    {
      current: 19,
      previous: 13,
      team: {
        id: '258',
        displayName: 'Virginia Cavaliers',
        shortDisplayName: 'Virginia',
        logo: getTeamLogo('virginia'),
        nickname: 'Cavaliers',
      },
      record: '10-3',
    },
    {
      current: 20,
      previous: 22,
      team: {
        id: '2655',
        displayName: 'Tulane Green Wave',
        shortDisplayName: 'Tulane',
        logo: getTeamLogo('tulane'),
        nickname: 'Green Wave',
      },
      record: '11-2',
    },
    {
      current: 21,
      previous: 24,
      team: {
        id: '248',
        displayName: 'Houston Cougars',
        shortDisplayName: 'Houston',
        logo: getTeamLogo('houston'),
        nickname: 'Cougars',
      },
      record: '9-3',
    },
    {
      current: 22,
      previous: 20,
      team: {
        id: '59',
        displayName: 'Georgia Tech Yellow Jackets',
        shortDisplayName: 'Georgia Tech',
        logo: getTeamLogo('georgia tech'),
        nickname: 'Yellow Jackets',
      },
      record: '9-3',
    },
    {
      current: 23,
      previous: 21,
      team: {
        id: '2294',
        displayName: 'Iowa Hawkeyes',
        shortDisplayName: 'Iowa',
        logo: getTeamLogo('iowa'),
        nickname: 'Hawkeyes',
      },
      record: '8-4',
    },
    {
      current: 24,
      previous: 25,
      team: {
        id: '256',
        displayName: 'James Madison Dukes',
        shortDisplayName: 'James Madison',
        logo: getTeamLogo('james madison'),
        nickname: 'Dukes',
      },
      record: '12-1',
    },
    {
      current: 25,
      previous: undefined, // New to rankings
      team: {
        id: '249',
        displayName: 'North Texas Mean Green',
        shortDisplayName: 'North Texas',
        logo: getTeamLogo('north texas'),
        nickname: 'Mean Green',
      },
      record: '11-2',
    },
  ],
};

// Function to check if CFP rankings are in the API response
export function hasCFPRankings(rankings: { name: string }[]): boolean {
  return rankings.some(
    (poll) =>
      poll.name.toLowerCase().includes('playoff') ||
      poll.name.toLowerCase().includes('cfp')
  );
}

// Function to get the historical CFP rankings as a poll object
export function getHistoricalCFPPoll() {
  return {
    name: cfpFinalRankings2025.name,
    shortName: cfpFinalRankings2025.shortName,
    type: cfpFinalRankings2025.type,
    ranks: cfpFinalRankings2025.ranks,
  };
}
