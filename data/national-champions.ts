// National Champions data from 1869-2025
// Source: NCAA

export interface NationalChampion {
  year: number;
  champion: string;
  champions?: string[]; // For split titles
  selector: string;
  era: 'cfp' | 'bcs' | 'pre-bcs';
}

export const nationalChampions: NationalChampion[] = [
  // CFP Era (2014-present)
  { year: 2025, champion: 'Indiana', selector: 'CFP', era: 'cfp' },
  { year: 2024, champion: 'Ohio State', selector: 'CFP', era: 'cfp' },
  { year: 2023, champion: 'Michigan', selector: 'CFP', era: 'cfp' },
  { year: 2022, champion: 'Georgia', selector: 'CFP', era: 'cfp' },
  { year: 2021, champion: 'Georgia', selector: 'CFP', era: 'cfp' },
  { year: 2020, champion: 'Alabama', selector: 'CFP', era: 'cfp' },
  { year: 2019, champion: 'LSU', selector: 'CFP', era: 'cfp' },
  { year: 2018, champion: 'Clemson', selector: 'CFP', era: 'cfp' },
  { year: 2017, champion: 'Alabama', selector: 'CFP', era: 'cfp' },
  { year: 2016, champion: 'Clemson', selector: 'CFP', era: 'cfp' },
  { year: 2015, champion: 'Alabama', selector: 'CFP', era: 'cfp' },
  { year: 2014, champion: 'Ohio State', selector: 'CFP', era: 'cfp' },

  // BCS Era (1998-2013)
  { year: 2013, champion: 'Florida State', selector: 'BCS', era: 'bcs' },
  { year: 2012, champion: 'Alabama', selector: 'BCS', era: 'bcs' },
  { year: 2011, champion: 'Alabama', selector: 'BCS', era: 'bcs' },
  { year: 2010, champion: 'Auburn', selector: 'BCS', era: 'bcs' },
  { year: 2009, champion: 'Alabama', selector: 'BCS', era: 'bcs' },
  { year: 2008, champion: 'Florida', selector: 'BCS', era: 'bcs' },
  { year: 2007, champion: 'LSU', selector: 'BCS', era: 'bcs' },
  { year: 2006, champion: 'Florida', selector: 'BCS', era: 'bcs' },
  { year: 2005, champion: 'Texas', selector: 'BCS', era: 'bcs' },
  { year: 2004, champion: 'USC', selector: 'BCS', era: 'bcs' },
  { year: 2003, champions: ['LSU', 'USC'], champion: 'LSU / USC', selector: 'BCS / AP, FWAA', era: 'bcs' },
  { year: 2002, champion: 'Ohio State', selector: 'BCS', era: 'bcs' },
  { year: 2001, champion: 'Miami (FL)', selector: 'BCS', era: 'bcs' },
  { year: 2000, champion: 'Oklahoma', selector: 'BCS', era: 'bcs' },
  { year: 1999, champion: 'Florida State', selector: 'BCS', era: 'bcs' },
  { year: 1998, champion: 'Tennessee', selector: 'BCS', era: 'bcs' },

  // Pre-BCS Era (before 1998)
  { year: 1997, champions: ['Michigan', 'Nebraska'], champion: 'Michigan / Nebraska', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1996, champion: 'Florida', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1995, champion: 'Nebraska', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1994, champion: 'Nebraska', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1993, champion: 'Florida State', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1992, champion: 'Alabama', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1991, champions: ['Washington', 'Miami (FL)'], champion: 'Washington / Miami (FL)', selector: 'Coaches / AP', era: 'pre-bcs' },
  { year: 1990, champions: ['Colorado', 'Georgia Tech'], champion: 'Colorado / Georgia Tech', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1989, champion: 'Miami (FL)', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1988, champion: 'Notre Dame', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1987, champion: 'Miami (FL)', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1986, champion: 'Penn State', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1985, champion: 'Oklahoma', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1984, champion: 'BYU', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1983, champion: 'Miami (FL)', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1982, champion: 'Penn State', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1981, champion: 'Clemson', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1980, champion: 'Georgia', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1979, champion: 'Alabama', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1978, champions: ['Alabama', 'USC'], champion: 'Alabama / USC', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1977, champion: 'Notre Dame', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1976, champion: 'Pittsburgh', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1975, champion: 'Oklahoma', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1974, champions: ['USC', 'Oklahoma'], champion: 'USC / Oklahoma', selector: 'Coaches / AP', era: 'pre-bcs' },
  { year: 1973, champions: ['Notre Dame', 'Alabama'], champion: 'Notre Dame / Alabama', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1972, champion: 'USC', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1971, champion: 'Nebraska', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1970, champions: ['Nebraska', 'Texas', 'Ohio State'], champion: 'Nebraska / Texas / Ohio State', selector: 'AP / Coaches / NFF', era: 'pre-bcs' },
  { year: 1969, champion: 'Texas', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1968, champion: 'Ohio State', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1967, champion: 'USC', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1966, champions: ['Notre Dame', 'Michigan State'], champion: 'Notre Dame / Michigan State', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1965, champions: ['Michigan State', 'Alabama'], champion: 'Michigan State / Alabama', selector: 'Coaches / AP', era: 'pre-bcs' },
  { year: 1964, champions: ['Alabama', 'Arkansas', 'Notre Dame'], champion: 'Alabama / Arkansas / Notre Dame', selector: 'AP / FWAA / NFF', era: 'pre-bcs' },
  { year: 1963, champion: 'Texas', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1962, champion: 'USC', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1961, champions: ['Alabama', 'Ohio State'], champion: 'Alabama / Ohio State', selector: 'AP / FWAA', era: 'pre-bcs' },
  { year: 1960, champions: ['Minnesota', 'Ole Miss'], champion: 'Minnesota / Ole Miss', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1959, champion: 'Syracuse', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1958, champions: ['LSU', 'Iowa'], champion: 'LSU / Iowa', selector: 'AP / FWAA', era: 'pre-bcs' },
  { year: 1957, champions: ['Ohio State', 'Auburn'], champion: 'Ohio State / Auburn', selector: 'AP / Coaches', era: 'pre-bcs' },
  { year: 1956, champion: 'Oklahoma', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1955, champion: 'Oklahoma', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1954, champions: ['UCLA', 'Ohio State'], champion: 'UCLA / Ohio State', selector: 'Coaches / AP', era: 'pre-bcs' },
  { year: 1953, champion: 'Maryland', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1952, champion: 'Michigan State', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1951, champion: 'Tennessee', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1950, champion: 'Oklahoma', selector: 'AP, Coaches', era: 'pre-bcs' },
  { year: 1949, champion: 'Notre Dame', selector: 'AP', era: 'pre-bcs' },
  { year: 1948, champion: 'Michigan', selector: 'AP', era: 'pre-bcs' },
  { year: 1947, champion: 'Notre Dame', selector: 'AP', era: 'pre-bcs' },
  { year: 1946, champion: 'Notre Dame', selector: 'AP', era: 'pre-bcs' },
  { year: 1945, champion: 'Army', selector: 'AP', era: 'pre-bcs' },
  { year: 1944, champion: 'Army', selector: 'AP', era: 'pre-bcs' },
  { year: 1943, champion: 'Notre Dame', selector: 'AP', era: 'pre-bcs' },
  { year: 1942, champion: 'Ohio State', selector: 'AP', era: 'pre-bcs' },
  { year: 1941, champion: 'Minnesota', selector: 'AP', era: 'pre-bcs' },
  { year: 1940, champion: 'Minnesota', selector: 'AP', era: 'pre-bcs' },
  { year: 1939, champion: 'Texas A&M', selector: 'AP', era: 'pre-bcs' },
  { year: 1938, champion: 'TCU', selector: 'AP', era: 'pre-bcs' },
  { year: 1937, champion: 'Pittsburgh', selector: 'AP', era: 'pre-bcs' },
  { year: 1936, champion: 'Minnesota', selector: 'AP', era: 'pre-bcs' },
  { year: 1935, champion: 'Minnesota', selector: 'Various', era: 'pre-bcs' },
  { year: 1934, champion: 'Minnesota', selector: 'Various', era: 'pre-bcs' },
  { year: 1933, champion: 'Michigan', selector: 'Various', era: 'pre-bcs' },
  { year: 1932, champion: 'USC', selector: 'Various', era: 'pre-bcs' },
  { year: 1931, champion: 'USC', selector: 'Various', era: 'pre-bcs' },
  { year: 1930, champions: ['Alabama', 'Notre Dame'], champion: 'Alabama / Notre Dame', selector: 'Various', era: 'pre-bcs' },
  { year: 1929, champion: 'Notre Dame', selector: 'Various', era: 'pre-bcs' },
  { year: 1928, champion: 'Georgia Tech', selector: 'Various', era: 'pre-bcs' },
  { year: 1927, champions: ['Illinois', 'Yale'], champion: 'Illinois / Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1926, champions: ['Alabama', 'Stanford'], champion: 'Alabama / Stanford', selector: 'Various', era: 'pre-bcs' },
  { year: 1925, champion: 'Alabama', selector: 'Various', era: 'pre-bcs' },
  { year: 1924, champion: 'Notre Dame', selector: 'Various', era: 'pre-bcs' },
  { year: 1923, champions: ['Illinois', 'Michigan'], champion: 'Illinois / Michigan', selector: 'Various', era: 'pre-bcs' },
  { year: 1922, champions: ['California', 'Cornell', 'Princeton'], champion: 'California / Cornell / Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1921, champions: ['California', 'Cornell'], champion: 'California / Cornell', selector: 'Various', era: 'pre-bcs' },
  { year: 1920, champion: 'California', selector: 'Various', era: 'pre-bcs' },
  { year: 1919, champions: ['Harvard', 'Illinois', 'Notre Dame', 'Texas A&M'], champion: 'Harvard / Illinois / Notre Dame / Texas A&M', selector: 'Various', era: 'pre-bcs' },
  { year: 1918, champions: ['Michigan', 'Pittsburgh'], champion: 'Michigan / Pittsburgh', selector: 'Various', era: 'pre-bcs' },
  { year: 1917, champion: 'Georgia Tech', selector: 'Various', era: 'pre-bcs' },
  { year: 1916, champion: 'Pittsburgh', selector: 'Various', era: 'pre-bcs' },
  { year: 1915, champion: 'Cornell', selector: 'Various', era: 'pre-bcs' },
  { year: 1914, champion: 'Army', selector: 'Various', era: 'pre-bcs' },
  { year: 1913, champion: 'Harvard', selector: 'Various', era: 'pre-bcs' },
  { year: 1912, champions: ['Harvard', 'Penn State'], champion: 'Harvard / Penn State', selector: 'Various', era: 'pre-bcs' },
  { year: 1911, champions: ['Penn State', 'Princeton'], champion: 'Penn State / Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1910, champions: ['Harvard', 'Pittsburgh'], champion: 'Harvard / Pittsburgh', selector: 'Various', era: 'pre-bcs' },
  { year: 1909, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1908, champions: ['LSU', 'Penn'], champion: 'LSU / Penn', selector: 'Various', era: 'pre-bcs' },
  { year: 1907, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1906, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1905, champion: 'Chicago', selector: 'Various', era: 'pre-bcs' },
  { year: 1904, champions: ['Michigan', 'Penn'], champion: 'Michigan / Penn', selector: 'Various', era: 'pre-bcs' },
  { year: 1903, champions: ['Michigan', 'Princeton'], champion: 'Michigan / Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1902, champion: 'Michigan', selector: 'Various', era: 'pre-bcs' },
  { year: 1901, champion: 'Michigan', selector: 'Various', era: 'pre-bcs' },
  { year: 1900, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1899, champion: 'Harvard', selector: 'Various', era: 'pre-bcs' },
  { year: 1898, champion: 'Harvard', selector: 'Various', era: 'pre-bcs' },
  { year: 1897, champion: 'Penn', selector: 'Various', era: 'pre-bcs' },
  { year: 1896, champions: ['Lafayette', 'Princeton'], champion: 'Lafayette / Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1895, champion: 'Penn', selector: 'Various', era: 'pre-bcs' },
  { year: 1894, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1893, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1892, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1891, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1890, champion: 'Harvard', selector: 'Various', era: 'pre-bcs' },
  { year: 1889, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1888, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1887, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1886, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1885, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1884, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1883, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1882, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1881, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1880, champions: ['Princeton', 'Yale'], champion: 'Princeton / Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1879, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1878, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1877, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1876, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1875, champion: 'Harvard', selector: 'Various', era: 'pre-bcs' },
  { year: 1874, champion: 'Yale', selector: 'Various', era: 'pre-bcs' },
  { year: 1873, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1872, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1870, champion: 'Princeton', selector: 'Various', era: 'pre-bcs' },
  { year: 1869, champions: ['Princeton', 'Rutgers'], champion: 'Princeton / Rutgers', selector: 'Various', era: 'pre-bcs' },
];

// Calculate championship counts by school
export function getChampionshipCounts(): { school: string; count: number }[] {
  const counts: Record<string, number> = {};

  nationalChampions.forEach((entry) => {
    if (entry.champions) {
      // Split titles - each school gets credit
      entry.champions.forEach((school) => {
        const normalizedSchool = normalizeSchoolName(school);
        counts[normalizedSchool] = (counts[normalizedSchool] || 0) + 1;
      });
    } else {
      const normalizedSchool = normalizeSchoolName(entry.champion);
      counts[normalizedSchool] = (counts[normalizedSchool] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([school, count]) => ({ school, count }))
    .sort((a, b) => b.count - a.count);
}

// Normalize school names for counting
function normalizeSchoolName(name: string): string {
  const normalizations: Record<string, string> = {
    'Southern California': 'USC',
    'Miami (FL)': 'Miami (FL)',
    'Miami (Fla.)': 'Miami (FL)',
    'Florida St.': 'Florida State',
    'Penn State.': 'Penn State',
    'Penn St.': 'Penn State',
    'Georgia Tech.': 'Georgia Tech',
    'Texas Christian': 'TCU',
    'Brigham Young': 'BYU',
    'Pennsylvania': 'Penn',
    'Mississippi': 'Ole Miss',
  };

  return normalizations[name] || name;
}

// Get champions by era
export function getChampionsByEra(era: 'cfp' | 'bcs' | 'pre-bcs'): NationalChampion[] {
  return nationalChampions.filter((c) => c.era === era);
}

// FCS National Champions (I-AA / FCS Championship Game 1978-present)
export interface FCSChampion {
  year: number;
  champion: string;
  coach: string;
  score: string;
  runnerUp: string;
  site: string;
}

export const fcsChampions: FCSChampion[] = [
  { year: 2025, champion: 'Montana State', coach: 'Brent Vigen', score: '35-34 (OT)', runnerUp: 'Illinois State', site: 'Nashville, Tenn.' },
  { year: 2024, champion: 'North Dakota State', coach: 'Tim Polasek', score: '35-32', runnerUp: 'Montana State', site: 'Frisco, Texas' },
  { year: 2023, champion: 'South Dakota State', coach: 'Jimmy Rogers', score: '23-3', runnerUp: 'Montana', site: 'Frisco, Texas' },
  { year: 2022, champion: 'South Dakota State', coach: 'John Stiegelmeier', score: '45-21', runnerUp: 'North Dakota State', site: 'Frisco, Texas' },
  { year: 2021, champion: 'North Dakota State', coach: 'Matt Entz', score: '38-10', runnerUp: 'Montana State', site: 'Frisco, Texas' },
  { year: 2020, champion: 'Sam Houston', coach: 'K.C. Keeler', score: '23-21', runnerUp: 'South Dakota State', site: 'Frisco, Texas' },
  { year: 2019, champion: 'North Dakota State', coach: 'Matt Entz', score: '28-20', runnerUp: 'James Madison', site: 'Frisco, Texas' },
  { year: 2018, champion: 'North Dakota State', coach: 'Chris Klieman', score: '38-24', runnerUp: 'Eastern Washington', site: 'Frisco, Texas' },
  { year: 2017, champion: 'North Dakota State', coach: 'Chris Klieman', score: '17-13', runnerUp: 'James Madison', site: 'Frisco, Texas' },
  { year: 2016, champion: 'James Madison', coach: 'Mike Houston', score: '28-14', runnerUp: 'Youngstown State', site: 'Frisco, Texas' },
  { year: 2015, champion: 'North Dakota State', coach: 'Chris Klieman', score: '37-10', runnerUp: 'Jacksonville State', site: 'Frisco, Texas' },
  { year: 2014, champion: 'North Dakota State', coach: 'Chris Klieman', score: '29-27', runnerUp: 'Illinois State', site: 'Frisco, Texas' },
  { year: 2013, champion: 'North Dakota State', coach: 'Craig Bohl', score: '35-7', runnerUp: 'Towson', site: 'Frisco, Texas' },
  { year: 2012, champion: 'North Dakota State', coach: 'Craig Bohl', score: '39-13', runnerUp: 'Sam Houston State', site: 'Frisco, Texas' },
  { year: 2011, champion: 'North Dakota State', coach: 'Craig Bohl', score: '17-6', runnerUp: 'Sam Houston State', site: 'Frisco, Texas' },
  { year: 2010, champion: 'Eastern Washington', coach: 'Beau Baldwin', score: '20-19', runnerUp: 'Delaware', site: 'Frisco, Texas' },
  { year: 2009, champion: 'Villanova', coach: 'Andy Talley', score: '23-21', runnerUp: 'Montana', site: 'Chattanooga, Tenn.' },
  { year: 2008, champion: 'Richmond', coach: 'Mike London', score: '24-7', runnerUp: 'Montana', site: 'Chattanooga, Tenn.' },
  { year: 2007, champion: 'Appalachian State', coach: 'Jerry Moore', score: '49-21', runnerUp: 'Delaware', site: 'Chattanooga, Tenn.' },
  { year: 2006, champion: 'Appalachian State', coach: 'Jerry Moore', score: '28-17', runnerUp: 'Massachusetts', site: 'Chattanooga, Tenn.' },
  { year: 2005, champion: 'Appalachian State', coach: 'Jerry Moore', score: '21-16', runnerUp: 'Northern Iowa', site: 'Chattanooga, Tenn.' },
  { year: 2004, champion: 'James Madison', coach: 'Mickey Matthews', score: '31-21', runnerUp: 'Montana', site: 'Chattanooga, Tenn.' },
  { year: 2003, champion: 'Delaware', coach: 'K.C. Keeler', score: '40-0', runnerUp: 'Colgate', site: 'Chattanooga, Tenn.' },
  { year: 2002, champion: 'Western Kentucky', coach: 'Jack Harbaugh', score: '34-14', runnerUp: 'McNeese State', site: 'Chattanooga, Tenn.' },
  { year: 2001, champion: 'Montana', coach: 'Joe Glenn', score: '13-6', runnerUp: 'Furman', site: 'Chattanooga, Tenn.' },
  { year: 2000, champion: 'Georgia Southern', coach: 'Paul Johnson', score: '27-25', runnerUp: 'Montana', site: 'Chattanooga, Tenn.' },
  { year: 1999, champion: 'Georgia Southern', coach: 'Paul Johnson', score: '59-24', runnerUp: 'Youngstown State', site: 'Chattanooga, Tenn.' },
  { year: 1998, champion: 'Massachusetts', coach: 'Mark Whipple', score: '55-43', runnerUp: 'Georgia Southern', site: 'Chattanooga, Tenn.' },
  { year: 1997, champion: 'Youngstown State', coach: 'Jim Tressel', score: '10-9', runnerUp: 'McNeese State', site: 'Chattanooga, Tenn.' },
  { year: 1996, champion: 'Marshall', coach: 'Bob Pruett', score: '49-29', runnerUp: 'Montana', site: 'Huntington, W.Va.' },
  { year: 1995, champion: 'Montana', coach: 'Don Read', score: '22-20', runnerUp: 'Marshall', site: 'Huntington, W.Va.' },
  { year: 1994, champion: 'Youngstown State', coach: 'Jim Tressel', score: '28-14', runnerUp: 'Boise State', site: 'Huntington, W.Va.' },
  { year: 1993, champion: 'Youngstown State', coach: 'Jim Tressel', score: '17-5', runnerUp: 'Marshall', site: 'Huntington, W.Va.' },
  { year: 1992, champion: 'Marshall', coach: 'Jim Donnan', score: '31-28', runnerUp: 'Youngstown State', site: 'Huntington, W.Va.' },
  { year: 1991, champion: 'Youngstown State', coach: 'Jim Tressel', score: '25-17', runnerUp: 'Marshall', site: 'Statesboro, Ga.' },
  { year: 1990, champion: 'Georgia Southern', coach: 'Tim Stowers', score: '36-13', runnerUp: 'Nevada', site: 'Statesboro, Ga.' },
  { year: 1989, champion: 'Georgia Southern', coach: 'Erk Russell', score: '37-34', runnerUp: 'Stephen F. Austin', site: 'Statesboro, Ga.' },
  { year: 1988, champion: 'Furman', coach: 'Jimmy Satterfield', score: '17-12', runnerUp: 'Georgia Southern', site: 'Pocatello, Idaho' },
  { year: 1987, champion: 'Louisiana-Monroe', coach: 'Pat Collins', score: '43-42', runnerUp: 'Marshall', site: 'Pocatello, Idaho' },
  { year: 1986, champion: 'Georgia Southern', coach: 'Erk Russell', score: '48-21', runnerUp: 'Arkansas State', site: 'Tacoma, Wash.' },
  { year: 1985, champion: 'Georgia Southern', coach: 'Erk Russell', score: '44-42', runnerUp: 'Furman', site: 'Tacoma, Wash.' },
  { year: 1984, champion: 'Montana State', coach: 'Dave Arnold', score: '19-6', runnerUp: 'Louisiana Tech', site: 'Charleston, S.C.' },
  { year: 1983, champion: 'Southern Illinois', coach: 'Rey Dempsey', score: '43-7', runnerUp: 'Western Carolina', site: 'Charleston, S.C.' },
  { year: 1982, champion: 'Eastern Kentucky', coach: 'Roy Kidd', score: '17-14', runnerUp: 'Delaware', site: 'Wichita Falls, Texas' },
  { year: 1981, champion: 'Idaho State', coach: 'Dave Kragthorpe', score: '34-23', runnerUp: 'Eastern Kentucky', site: 'Wichita Falls, Texas' },
  { year: 1980, champion: 'Boise State', coach: 'Jim Criner', score: '31-29', runnerUp: 'Eastern Kentucky', site: 'Sacramento, Calif.' },
  { year: 1979, champion: 'Eastern Kentucky', coach: 'Roy Kidd', score: '30-7', runnerUp: 'Lehigh', site: 'Orlando, Fla.' },
  { year: 1978, champion: 'Florida A&M', coach: 'Rudy Hubbard', score: '35-28', runnerUp: 'Massachusetts', site: 'Wichita Falls, Texas' },
];

// Calculate FCS championship counts by school
export function getFCSChampionshipCounts(): { school: string; count: number }[] {
  const counts: Record<string, number> = {};

  fcsChampions.forEach((entry) => {
    counts[entry.champion] = (counts[entry.champion] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([school, count]) => ({ school, count }))
    .sort((a, b) => b.count - a.count);
}
