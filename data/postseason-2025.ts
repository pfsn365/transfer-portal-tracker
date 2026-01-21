// 2025-26 College Football Postseason Data

export interface PlayoffTeam {
  seed: number;
  team: string;
  record: string;
  conference: string;
  qualification: 'Conference Champion' | 'At-Large';
  result: string;
  logo?: string;
}

export interface FCSPlayoffTeam {
  seed?: number; // Only top 16 are seeded, 17-24 are unseeded
  team: string;
  record: string;
  conference: string;
  result: string;
  logo?: string;
}

export interface BowlGame {
  name: string;
  date: string;
  location: string;
  stadium: string;
  team1: string;
  team1Score: number;
  team2: string;
  team2Score: number;
  team1Rank?: number;
  team2Rank?: number;
  tv?: string;
  isCFP?: boolean;
  cfpRound?: 'First Round' | 'Quarterfinal' | 'Semifinal' | 'Championship';
}

export interface KeyDate {
  event: string;
  date: string;
  location?: string;
}

export interface ConferencePerformance {
  conference: string;
  bowlEligible: number;
  bowlWins: number;
  bowlLosses: number;
}

// 2025-26 CFP 12-Team Playoff Teams
export const playoffTeams2025: PlayoffTeam[] = [
  { seed: 1, team: 'Indiana', record: '16-0', conference: 'Big Ten', qualification: 'Conference Champion', result: 'National Champion', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/84.png' },
  { seed: 2, team: 'Ohio State', record: '12-2', conference: 'Big Ten', qualification: 'At-Large', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
  { seed: 3, team: 'Georgia', record: '12-2', conference: 'SEC', qualification: 'Conference Champion', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' },
  { seed: 4, team: 'Texas Tech', record: '12-2', conference: 'Big 12', qualification: 'Conference Champion', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png' },
  { seed: 5, team: 'Oregon', record: '13-2', conference: 'Big Ten', qualification: 'At-Large', result: 'Lost in Semifinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png' },
  { seed: 6, team: 'Ole Miss', record: '13-2', conference: 'SEC', qualification: 'At-Large', result: 'Lost in Semifinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/145.png' },
  { seed: 7, team: 'Texas A&M', record: '11-2', conference: 'SEC', qualification: 'At-Large', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png' },
  { seed: 8, team: 'Oklahoma', record: '10-3', conference: 'SEC', qualification: 'At-Large', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/201.png' },
  { seed: 9, team: 'Alabama', record: '11-3', conference: 'SEC', qualification: 'At-Large', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png' },
  { seed: 10, team: 'Miami (FL)', record: '12-3', conference: 'ACC', qualification: 'At-Large', result: 'Lost in Championship', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png' },
  { seed: 11, team: 'Tulane', record: '11-3', conference: 'American', qualification: 'Conference Champion', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2655.png' },
  { seed: 12, team: 'James Madison', record: '12-2', conference: 'Sun Belt', qualification: 'Conference Champion', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/256.png' },
];

// 2025-26 Bowl Games (including CFP games)
export const bowlGames2025: BowlGame[] = [
  // CFP National Championship
  { name: 'CFP National Championship', date: '2026-01-19', location: 'Miami Gardens, FL', stadium: 'Hard Rock Stadium', team1: 'Indiana', team1Score: 27, team1Rank: 1, team2: 'Miami (FL)', team2Score: 21, team2Rank: 10, tv: 'ESPN', isCFP: true, cfpRound: 'Championship' },

  // CFP Semifinals
  { name: 'Peach Bowl (CFP Semifinal)', date: '2026-01-09', location: 'Atlanta, GA', stadium: 'Mercedes-Benz Stadium', team1: 'Indiana', team1Score: 56, team1Rank: 1, team2: 'Oregon', team2Score: 22, team2Rank: 5, tv: 'ESPN', isCFP: true, cfpRound: 'Semifinal' },
  { name: 'Fiesta Bowl (CFP Semifinal)', date: '2026-01-09', location: 'Glendale, AZ', stadium: 'State Farm Stadium', team1: 'Miami (FL)', team1Score: 31, team1Rank: 10, team2: 'Ole Miss', team2Score: 27, team2Rank: 6, tv: 'ESPN', isCFP: true, cfpRound: 'Semifinal' },

  // CFP Quarterfinals
  { name: 'Rose Bowl (CFP Quarterfinal)', date: '2026-01-01', location: 'Pasadena, CA', stadium: 'Rose Bowl', team1: 'Indiana', team1Score: 38, team1Rank: 1, team2: 'Alabama', team2Score: 3, team2Rank: 9, tv: 'ESPN', isCFP: true, cfpRound: 'Quarterfinal' },
  { name: 'Sugar Bowl (CFP Quarterfinal)', date: '2026-01-01', location: 'New Orleans, LA', stadium: 'Caesars Superdome', team1: 'Ole Miss', team1Score: 39, team1Rank: 6, team2: 'Georgia', team2Score: 34, team2Rank: 3, tv: 'ESPN', isCFP: true, cfpRound: 'Quarterfinal' },
  { name: 'Orange Bowl (CFP Quarterfinal)', date: '2026-01-01', location: 'Miami Gardens, FL', stadium: 'Hard Rock Stadium', team1: 'Oregon', team1Score: 23, team1Rank: 5, team2: 'Texas Tech', team2Score: 0, team2Rank: 4, tv: 'ESPN', isCFP: true, cfpRound: 'Quarterfinal' },
  { name: 'Cotton Bowl (CFP Quarterfinal)', date: '2026-01-01', location: 'Arlington, TX', stadium: 'AT&T Stadium', team1: 'Miami (FL)', team1Score: 24, team1Rank: 10, team2: 'Ohio State', team2Score: 14, team2Rank: 2, tv: 'ESPN', isCFP: true, cfpRound: 'Quarterfinal' },

  // CFP First Round
  { name: 'CFP First Round', date: '2025-12-20', location: 'Norman, OK', stadium: 'Memorial Stadium', team1: 'Alabama', team1Score: 34, team1Rank: 9, team2: 'Oklahoma', team2Score: 24, team2Rank: 8, tv: 'ABC', isCFP: true, cfpRound: 'First Round' },
  { name: 'CFP First Round', date: '2025-12-20', location: 'College Station, TX', stadium: 'Kyle Field', team1: 'Miami (FL)', team1Score: 10, team1Rank: 10, team2: 'Texas A&M', team2Score: 3, team2Rank: 7, tv: 'TNT', isCFP: true, cfpRound: 'First Round' },
  { name: 'CFP First Round', date: '2025-12-21', location: 'Oxford, MS', stadium: 'Vaught-Hemingway Stadium', team1: 'Ole Miss', team1Score: 41, team1Rank: 6, team2: 'Tulane', team2Score: 10, team2Rank: 20, tv: 'ABC', isCFP: true, cfpRound: 'First Round' },
  { name: 'CFP First Round', date: '2025-12-21', location: 'Eugene, OR', stadium: 'Autzen Stadium', team1: 'Oregon', team1Score: 51, team1Rank: 5, team2: 'James Madison', team2Score: 34, team2Rank: 24, tv: 'TNT', isCFP: true, cfpRound: 'First Round' },

  // New Year's Six (non-CFP)
  { name: 'Las Vegas Bowl', date: '2026-01-01', location: 'Las Vegas, NV', stadium: 'Allegiant Stadium', team1: 'Utah', team1Score: 44, team1Rank: 15, team2: 'Nebraska', team2Score: 22, tv: 'ESPN' },
  { name: 'Citrus Bowl', date: '2026-01-01', location: 'Orlando, FL', stadium: 'Camping World Stadium', team1: 'Texas', team1Score: 41, team1Rank: 13, team2: 'Michigan', team2Score: 27, team2Rank: 18, tv: 'ABC' },
  { name: 'ReliaQuest Bowl', date: '2026-01-01', location: 'Tampa, FL', stadium: 'Raymond James Stadium', team1: 'Iowa', team1Score: 34, team1Rank: 23, team2: 'Vanderbilt', team2Score: 27, team2Rank: 14, tv: 'ESPN' },
  { name: 'Sun Bowl', date: '2026-01-01', location: 'El Paso, TX', stadium: 'Sun Bowl', team1: 'Duke', team1Score: 42, team2: 'Arizona State', team2Score: 39, tv: 'CBS' },
  { name: 'Alamo Bowl', date: '2026-01-01', location: 'San Antonio, TX', stadium: 'Alamodome', team1: 'TCU', team1Score: 30, team2: 'USC', team2Score: 27, team2Rank: 16, tv: 'ESPN' },
  { name: 'Music City Bowl', date: '2026-01-01', location: 'Nashville, TN', stadium: 'Nissan Stadium', team1: 'Illinois', team1Score: 30, team2: 'Tennessee', team2Score: 28, tv: 'ESPN' },

  // December Bowls
  { name: 'Celebration Bowl', date: '2025-12-14', location: 'Atlanta, GA', stadium: 'Mercedes-Benz Stadium', team1: 'South Carolina State', team1Score: 40, team2: 'Prairie View A&M', team2Score: 38, tv: 'ABC' },
  { name: 'LA Bowl', date: '2025-12-18', location: 'Inglewood, CA', stadium: 'SoFi Stadium', team1: 'Washington', team1Score: 38, team2: 'Boise State', team2Score: 10, tv: 'ESPN' },
  { name: 'Salute to Veterans Bowl', date: '2025-12-21', location: 'Montgomery, AL', stadium: 'Cramton Bowl', team1: 'Jacksonville State', team1Score: 17, team2: 'Troy', team2Score: 13, tv: 'ESPN' },
  { name: 'Cure Bowl', date: '2025-12-20', location: 'Orlando, FL', stadium: 'Camping World Stadium', team1: 'Old Dominion', team1Score: 24, team2: 'South Florida', team2Score: 10, tv: 'ESPN' },
  { name: '68 Ventures Bowl', date: '2025-12-26', location: 'Mobile, AL', stadium: 'Hancock Whitney Stadium', team1: 'Delaware', team1Score: 20, team2: 'Louisiana', team2Score: 13, tv: 'ESPN' },
  { name: 'Xbox Bowl', date: '2025-12-19', location: 'Frisco, TX', stadium: 'Ford Center', team1: 'Arkansas State', team1Score: 34, team2: 'Missouri State', team2Score: 28, tv: 'ESPN' },
  { name: 'Gasparilla Bowl', date: '2025-12-20', location: 'Tampa, FL', stadium: 'Raymond James Stadium', team1: 'NC State', team1Score: 31, team2: 'Memphis', team2Score: 7, tv: 'ESPN' },
  { name: 'Myrtle Beach Bowl', date: '2025-12-20', location: 'Conway, SC', stadium: 'Brooks Stadium', team1: 'Western Michigan', team1Score: 41, team2: 'Kennesaw State', team2Score: 6, tv: 'ESPN' },
  { name: 'Famous Idaho Potato Bowl', date: '2025-12-23', location: 'Boise, ID', stadium: 'Albertsons Stadium', team1: 'Washington State', team1Score: 34, team2: 'Utah State', team2Score: 21, tv: 'ESPN' },
  { name: 'Boca Raton Bowl', date: '2025-12-21', location: 'Boca Raton, FL', stadium: 'Flagler Credit Union Stadium', team1: 'Louisville', team1Score: 27, team2: 'Toledo', team2Score: 22, tv: 'ESPN' },
  { name: 'New Orleans Bowl', date: '2025-12-21', location: 'New Orleans, LA', stadium: 'Caesars Superdome', team1: 'Western Kentucky', team1Score: 27, team2: 'Southern Miss', team2Score: 16, tv: 'ESPN' },
  { name: 'Frisco Bowl', date: '2025-12-21', location: 'Frisco, TX', stadium: 'Ford Center at The Star', team1: 'Ohio', team1Score: 17, team2: 'UNLV', team2Score: 10, tv: 'ESPN' },
  { name: "Hawai'i Bowl", date: '2025-12-24', location: 'Honolulu, HI', stadium: 'Ching Complex', team1: "Hawai'i", team1Score: 35, team2: 'Cal', team2Score: 31, tv: 'ESPN' },
  { name: 'Pop-Tarts Bowl', date: '2025-12-28', location: 'Orlando, FL', stadium: 'Camping World Stadium', team1: 'BYU', team1Score: 25, team1Rank: 12, team2: 'Georgia Tech', team2Score: 21, team2Rank: 22, tv: 'ABC' },
  { name: 'Gator Bowl', date: '2026-01-02', location: 'Jacksonville, FL', stadium: 'EverBank Stadium', team1: 'Virginia', team1Score: 13, team1Rank: 19, team2: 'Missouri', team2Score: 7, tv: 'ESPN' },
  { name: 'Texas Bowl', date: '2025-12-31', location: 'Houston, TX', stadium: 'NRG Stadium', team1: 'Houston', team1Score: 38, team1Rank: 21, team2: 'LSU', team2Score: 35, tv: 'ESPN' },
  { name: "Duke's Mayo Bowl", date: '2025-12-27', location: 'Charlotte, NC', stadium: 'Bank of America Stadium', team1: 'Wake Forest', team1Score: 43, team2: 'Mississippi State', team2Score: 29, tv: 'ESPN' },
  { name: 'Liberty Bowl', date: '2025-12-27', location: 'Memphis, TN', stadium: 'Simmons Bank Liberty Stadium', team1: 'Navy', team1Score: 35, team2: 'Cincinnati', team2Score: 13, tv: 'ESPN' },
  { name: 'Armed Forces Bowl', date: '2025-12-27', location: 'Fort Worth, TX', stadium: 'Amon G. Carter Stadium', team1: 'Texas State', team1Score: 41, team2: 'Rice', team2Score: 10, tv: 'ESPN' },
  { name: 'Holiday Bowl', date: '2025-12-27', location: 'San Diego, CA', stadium: 'Snapdragon Stadium', team1: 'SMU', team1Score: 24, team2: 'Arizona', team2Score: 19, team2Rank: 17, tv: 'FOX' },
  { name: 'New Mexico Bowl', date: '2025-12-28', location: 'Albuquerque, NM', stadium: 'University Stadium', team1: 'North Texas', team1Score: 49, team1Rank: 25, team2: 'San Diego State', team2Score: 47, tv: 'ESPN' },
  { name: 'GameAbove Sports Bowl', date: '2025-12-26', location: 'Detroit, MI', stadium: 'Ford Field', team1: 'Northwestern', team1Score: 34, team2: 'Central Michigan', team2Score: 7, tv: 'ESPN' },
  { name: 'First Responder Bowl', date: '2025-12-26', location: 'Dallas, TX', stadium: 'Gerald J. Ford Stadium', team1: 'UTSA', team1Score: 57, team2: 'Florida International', team2Score: 20, tv: 'ESPN' },
  { name: 'Military Bowl', date: '2025-12-27', location: 'Annapolis, MD', stadium: 'Navy-Marine Corps Memorial Stadium', team1: 'East Carolina', team1Score: 23, team2: 'Pittsburgh', team2Score: 17, tv: 'ESPN' },
  { name: 'Pinstripe Bowl', date: '2025-12-27', location: 'Bronx, NY', stadium: 'Yankee Stadium', team1: 'Penn State', team1Score: 22, team2: 'Clemson', team2Score: 10, tv: 'ESPN' },
  { name: 'Fenway Bowl', date: '2025-12-28', location: 'Boston, MA', stadium: 'Fenway Park', team1: 'Army', team1Score: 41, team2: 'UConn', team2Score: 16, tv: 'ESPN' },
  { name: 'Arizona Bowl', date: '2025-12-28', location: 'Tucson, AZ', stadium: 'Arizona Stadium', team1: 'Fresno State', team1Score: 18, team2: 'Miami (OH)', team2Score: 3, tv: 'ESPN' },
  { name: 'Birmingham Bowl', date: '2025-12-28', location: 'Birmingham, AL', stadium: 'Protective Stadium', team1: 'Georgia Southern', team1Score: 29, team2: 'Appalachian State', team2Score: 10, tv: 'ESPN' },
  { name: 'Rate Bowl', date: '2025-12-28', location: 'Phoenix, AZ', stadium: 'Chase Field', team1: 'Minnesota', team1Score: 20, team2: 'New Mexico', team2Score: 17, tv: 'ESPN' },
  { name: 'Independence Bowl', date: '2025-12-28', location: 'Shreveport, LA', stadium: 'Independence Stadium', team1: 'Louisiana Tech', team1Score: 23, team2: 'Coastal Carolina', team2Score: 14, tv: 'ESPN' },
];

// Key Postseason Dates
export const keyDates2025: KeyDate[] = [
  { event: 'Conference Championship Weekend', date: 'Dec 5-6', location: 'Various Locations' },
  { event: 'CFP Selection Sunday', date: 'Dec 7', location: 'ESPN' },
  { event: 'College Football Awards Show', date: 'Dec 12', location: 'ESPN' },
  { event: 'Heisman Trophy Ceremony', date: 'Dec 13', location: 'New York City (ABC)' },
  { event: 'Bowl Season Kickoff (Celebration Bowl)', date: 'Dec 13', location: 'Atlanta, GA' },
  { event: 'Army-Navy Game', date: 'Dec 13', location: 'M&T Bank Stadium, Baltimore, MD' },
  { event: 'CFP First Round', date: 'Dec 20-21', location: 'Campus Sites' },
  { event: 'CFP Quarterfinals (NY6 Bowls)', date: 'Jan 1', location: 'Rose, Sugar, Orange, Cotton Bowls' },
  { event: 'FCS National Championship', date: 'Jan 6', location: 'Nissan Stadium, Nashville, TN' },
  { event: 'CFP Semifinals', date: 'Jan 9', location: 'Peach Bowl (Atlanta), Fiesta Bowl (Glendale)' },
  { event: 'CFP National Championship', date: 'Jan 19', location: 'Hard Rock Stadium, Miami Gardens, FL' },
];

// Conference Bowl Performance 2025-26
export const conferencePerformance2025: ConferencePerformance[] = [
  { conference: 'SEC', bowlEligible: 12, bowlWins: 6, bowlLosses: 6 },
  { conference: 'Big Ten', bowlEligible: 10, bowlWins: 7, bowlLosses: 3 },
  { conference: 'Big 12', bowlEligible: 9, bowlWins: 5, bowlLosses: 4 },
  { conference: 'ACC', bowlEligible: 8, bowlWins: 5, bowlLosses: 3 },
  { conference: 'American', bowlEligible: 6, bowlWins: 3, bowlLosses: 3 },
  { conference: 'Mountain West', bowlEligible: 5, bowlWins: 2, bowlLosses: 3 },
  { conference: 'Sun Belt', bowlEligible: 5, bowlWins: 3, bowlLosses: 2 },
  { conference: 'MAC', bowlEligible: 4, bowlWins: 2, bowlLosses: 2 },
  { conference: 'Conference USA', bowlEligible: 4, bowlWins: 2, bowlLosses: 2 },
  { conference: 'Independent', bowlEligible: 2, bowlWins: 2, bowlLosses: 0 },
];

// CFP Records by Seed - 12-Team Playoff Era
export const cfpSeedRecords12Team = [
  { seed: 1, firstRound: '--', quarterfinal: '1-1', semifinal: '1-0', championship: '1-0' },
  { seed: 2, firstRound: '--', quarterfinal: '0-2', semifinal: '--', championship: '--' },
  { seed: 3, firstRound: '--', quarterfinal: '0-2', semifinal: '--', championship: '--' },
  { seed: 4, firstRound: '--', quarterfinal: '0-2', semifinal: '--', championship: '--' },
  { seed: 5, firstRound: '2-0', quarterfinal: '2-0', semifinal: '0-2', championship: '--' },
  { seed: 6, firstRound: '2-0', quarterfinal: '2-0', semifinal: '0-2', championship: '--' },
  { seed: 7, firstRound: '1-1', quarterfinal: '1-0', semifinal: '1-0', championship: '0-1' },
  { seed: 8, firstRound: '1-1', quarterfinal: '1-0', semifinal: '1-0', championship: '1-0' },
  { seed: 9, firstRound: '1-1', quarterfinal: '0-1', semifinal: '--', championship: '--' },
  { seed: 10, firstRound: '1-1', quarterfinal: '1-0', semifinal: '1-0', championship: '0-1' },
  { seed: 11, firstRound: '0-2', quarterfinal: '--', semifinal: '--', championship: '--' },
  { seed: 12, firstRound: '0-2', quarterfinal: '--', semifinal: '--', championship: '--' },
];

// CFP Records by Seed - 4-Team Playoff Era (2014-2023)
export const cfpSeedRecords4Team = [
  { seed: 1, semifinal: '8-2', championship: '4-4' },
  { seed: 2, semifinal: '5-5', championship: '3-2' },
  { seed: 3, semifinal: '5-5', championship: '1-4' },
  { seed: 4, semifinal: '2-8', championship: '2-0' },
];

// 2025-26 FCS Playoff Teams (24-team bracket)
export const fcsPlayoffTeams2025: FCSPlayoffTeam[] = [
  // Top 8 seeds (first-round byes)
  { seed: 1, team: 'North Dakota State', record: '12-0', conference: 'Missouri Valley', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2449.png' },
  { seed: 2, team: 'Montana State', record: '10-2', conference: 'Big Sky', result: 'National Champion', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/147.png' },
  { seed: 3, team: 'Montana', record: '11-1', conference: 'Big Sky', result: 'Lost in Semifinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/149.png' },
  { seed: 4, team: 'Tarleton State', record: '11-1', conference: 'WAC', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2627.png' },
  { seed: 5, team: 'Lehigh', record: '12-0', conference: 'Patriot', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2329.png' },
  { seed: 6, team: 'Mercer', record: '9-2', conference: 'SoCon', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2382.png' },
  { seed: 7, team: 'Stephen F. Austin', record: '10-2', conference: 'Southland', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2617.png' },
  { seed: 8, team: 'UC Davis', record: '8-3', conference: 'Big Sky', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/302.png' },
  // Seeds 9-16
  { seed: 9, team: 'Rhode Island', record: '10-2', conference: 'CAA', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/227.png' },
  { seed: 10, team: 'Abilene Christian', record: '8-4', conference: 'WAC', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2000.png' },
  { seed: 11, team: 'South Dakota', record: '8-4', conference: 'Missouri Valley', result: 'Lost in Quarterfinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/233.png' },
  { seed: 12, team: 'Villanova', record: '9-2', conference: 'CAA', result: 'Lost in Semifinal', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/222.png' },
  { seed: 13, team: 'Tennessee Tech', record: '11-1', conference: 'Big South-OVC', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2635.png' },
  { seed: 14, team: 'South Dakota State', record: '8-4', conference: 'Missouri Valley', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2571.png' },
  { seed: 15, team: 'Youngstown State', record: '8-4', conference: 'Missouri Valley', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2754.png' },
  { seed: 16, team: 'Southeastern Louisiana', record: '9-3', conference: 'Southland', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2545.png' },
  // Unseeded teams (paired geographically with seeds 9-16)
  { team: 'Central Connecticut State', record: '9-3', conference: 'NEC', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2115.png' },
  { team: 'Lamar', record: '8-4', conference: 'Southland', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2320.png' },
  { team: 'Drake', record: '9-2', conference: 'Pioneer', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2181.png' },
  { team: 'Harvard', record: '9-1', conference: 'Ivy', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/108.png' },
  { team: 'North Dakota', record: '8-4', conference: 'Missouri Valley', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/155.png' },
  { team: 'New Hampshire', record: '8-4', conference: 'CAA', result: 'Lost in First Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/160.png' },
  { team: 'Yale', record: '9-1', conference: 'Ivy', result: 'Lost in Second Round', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/43.png' },
  { team: 'Illinois State', record: '8-4', conference: 'Missouri Valley', result: 'Lost in Championship', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2287.png' },
];

// FCS Championship Game Results
export const fcsChampionshipGame2025 = {
  date: '2026-01-06',
  location: 'Nashville, TN',
  stadium: 'Nissan Stadium',
  team1: 'Montana State',
  team1Seed: 1,
  team1Score: 35,
  team2: 'Illinois State',
  team2Seed: 13,
  team2Score: 34,
  overtime: true,
};

// Team name to ESPN ID mapping for bowl game logos
export const teamEspnIds: Record<string, number> = {
  // SEC
  'Alabama': 333,
  'Arkansas': 8,
  'Auburn': 2,
  'Florida': 57,
  'Georgia': 61,
  'Kentucky': 96,
  'LSU': 99,
  'Ole Miss': 145,
  'Mississippi State': 344,
  'Missouri': 142,
  'Oklahoma': 201,
  'South Carolina': 2579,
  'Tennessee': 2633,
  'Texas': 251,
  'Texas A&M': 245,
  'Vanderbilt': 238,
  // Big Ten
  'Illinois': 356,
  'Indiana': 84,
  'Iowa': 2294,
  'Maryland': 120,
  'Michigan': 130,
  'Michigan State': 127,
  'Minnesota': 135,
  'Nebraska': 158,
  'Northwestern': 77,
  'Ohio State': 194,
  'Oregon': 2483,
  'Penn State': 213,
  'Purdue': 2509,
  'Rutgers': 164,
  'UCLA': 26,
  'USC': 30,
  'Washington': 264,
  'Wisconsin': 275,
  // Big 12
  'Arizona': 12,
  'Arizona State': 9,
  'Baylor': 239,
  'BYU': 252,
  'UCF': 2116,
  'Cincinnati': 2132,
  'Colorado': 38,
  'Houston': 248,
  'Iowa State': 66,
  'Kansas': 2305,
  'Kansas State': 2306,
  'Oklahoma State': 197,
  'TCU': 2628,
  'Texas Tech': 2641,
  'Utah': 254,
  'West Virginia': 277,
  // ACC
  'Boston College': 103,
  'Cal': 25,
  'Clemson': 228,
  'Duke': 150,
  'Florida State': 52,
  'Georgia Tech': 59,
  'Louisville': 97,
  'Miami (FL)': 2390,
  'NC State': 152,
  'North Carolina': 153,
  'Pittsburgh': 221,
  'SMU': 2567,
  'Stanford': 24,
  'Syracuse': 183,
  'Virginia': 258,
  'Virginia Tech': 259,
  'Wake Forest': 154,
  // American
  'Army': 349,
  'Charlotte': 2429,
  'East Carolina': 151,
  'FAU': 2226,
  'Memphis': 235,
  'Navy': 2426,
  'North Texas': 249,
  'Rice': 242,
  'South Florida': 58,
  'Temple': 218,
  'Tulane': 2655,
  'Tulsa': 202,
  'UAB': 5,
  'UTSA': 2636,
  // Mountain West
  'Air Force': 2005,
  'Boise State': 68,
  'Colorado State': 36,
  'Fresno State': 278,
  'Hawai\'i': 62,
  'Nevada': 2440,
  'New Mexico': 167,
  'San Diego State': 21,
  'San Jose State': 23,
  'UNLV': 2439,
  'Utah State': 328,
  'Wyoming': 2704,
  // Sun Belt
  'Appalachian State': 2026,
  'Arkansas State': 2032,
  'Coastal Carolina': 324,
  'Georgia Southern': 290,
  'Georgia State': 2247,
  'James Madison': 256,
  'Louisiana': 309,
  'Marshall': 276,
  'Old Dominion': 295,
  'South Alabama': 6,
  'Southern Miss': 2572,
  'Texas State': 326,
  'Troy': 2653,
  'UL Monroe': 2433,
  // MAC
  'Akron': 2006,
  'Ball State': 2050,
  'Bowling Green': 189,
  'Buffalo': 2084,
  'Central Michigan': 2117,
  'Eastern Michigan': 2199,
  'Kent State': 2309,
  'Miami (OH)': 193,
  'Northern Illinois': 2459,
  'Ohio': 195,
  'Toledo': 2649,
  'Western Michigan': 2711,
  // Conference USA
  'FIU': 2229,
  'Florida International': 2229,
  'Jacksonville State': 55,
  'Kennesaw State': 338,
  'Liberty': 2335,
  'Louisiana Tech': 2348,
  'Middle Tennessee': 2393,
  'New Mexico State': 166,
  'Sam Houston': 2534,
  'UTEP': 2638,
  'Western Kentucky': 98,
  // Independents
  'Notre Dame': 87,
  'UConn': 41,
  'UMass': 113,
  // FCS / Other
  'Delaware': 48,
  'Missouri State': 2623,
  'South Carolina State': 2569,
  'Prairie View A&M': 2504,
  'Washington State': 265,
};

// Helper function to get team logo URL
export function getTeamLogo(teamName: string): string | undefined {
  const espnId = teamEspnIds[teamName];
  if (espnId) {
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`;
  }
  return undefined;
}
