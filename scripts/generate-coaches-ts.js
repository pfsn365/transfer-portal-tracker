#!/usr/bin/env node
'use strict';

/**
 * Generate data/coaching/coaches.ts from:
 *   1. public/data/coaching/derived-connections.json  (CFBD + Wikipedia scrape)
 *   2. Hardcoded historical coaches (pre-CFBD era)
 *   3. Title overlay (national championship years per coach/school)
 *
 * Usage: node scripts/generate-coaches-ts.js
 */

const fs   = require('fs');
const path = require('path');

const derived = require('../public/data/coaching/derived-connections.json');

// ── National title overlay ────────────────────────────────────────────────────
// school name must match exactly what CFBD uses
const TITLE_OVERLAY = {
  'nick-saban':       { 'LSU': [2003], 'Alabama': [2009, 2011, 2012, 2014, 2015, 2017, 2020] },
  'dabo-swinney':     { 'Clemson': [2016, 2018] },
  'kirby-smart':      { 'Georgia': [2021, 2022] },
  'mack-brown':       { 'Texas': [2005] },
  'jimbo-fisher':     { 'Florida State': [2013] },
  'les-miles':        { 'LSU': [2007] },
  'ed-orgeron':       { 'LSU': [2019] },
  'gene-chizik':      { 'Auburn': [2010] },
  'ryan-day':         { 'Ohio State': [2024] },
  'jim-harbaugh':     { 'Michigan': [2023] },
  'bob-stoops':       { 'Oklahoma': [2000] },
  'pete-carroll':     { 'USC': [2003, 2004] },
  'frank-solich':     {},
};

// ── Historical coaches (pre-2000, not in CFBD data) ──────────────────────────
const HISTORICAL = [
  {
    id: 'woody-hayes',
    name: 'Woody Hayes',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Denison', startYear: 1946, endYear: 1947, wins: 11, losses: 7, titles: [] },
      { school: 'Miami (OH)', startYear: 1949, endYear: 1950, wins: 14, losses: 5, titles: [] },
      { school: 'Ohio State', startYear: 1951, endYear: 1978, wins: 205, losses: 61, titles: [1954, 1957, 1961, 1968, 1970] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'bear-bryant',
    name: 'Bear Bryant',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Maryland', startYear: 1945, endYear: 1945, wins: 6, losses: 2, titles: [] },
      { school: 'Kentucky', startYear: 1946, endYear: 1953, wins: 60, losses: 23, titles: [] },
      { school: 'Texas A&M', startYear: 1954, endYear: 1957, wins: 25, losses: 14, titles: [] },
      { school: 'Alabama', startYear: 1958, endYear: 1982, wins: 232, losses: 46, titles: [1961, 1964, 1965, 1973, 1978, 1979] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'hayden-fry',
    name: 'Hayden Fry',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'SMU', startYear: 1962, endYear: 1972, wins: 49, losses: 45, titles: [] },
      { school: 'North Texas', startYear: 1973, endYear: 1978, wins: 40, losses: 23, titles: [] },
      { school: 'Iowa', startYear: 1979, endYear: 1998, wins: 143, losses: 89, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'bo-schembechler',
    name: 'Bo Schembechler',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Miami (OH)', startYear: 1963, endYear: 1968, wins: 40, losses: 17, titles: [] },
      { school: 'Michigan', startYear: 1969, endYear: 1989, wins: 194, losses: 48, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'earle-bruce',
    name: 'Earle Bruce',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Iowa State', startYear: 1973, endYear: 1978, wins: 36, losses: 32, titles: [] },
      { school: 'Ohio State', startYear: 1979, endYear: 1987, wins: 81, losses: 26, titles: [] },
      { school: 'Colorado State', startYear: 1989, endYear: 1992, wins: 21, losses: 23, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'lou-holtz',
    name: 'Lou Holtz',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'William & Mary', startYear: 1969, endYear: 1971, wins: 13, losses: 20, titles: [] },
      { school: 'NC State', startYear: 1972, endYear: 1975, wins: 33, losses: 12, titles: [] },
      { school: 'Arkansas', startYear: 1977, endYear: 1983, wins: 60, losses: 21, titles: [] },
      { school: 'Minnesota', startYear: 1984, endYear: 1985, wins: 10, losses: 12, titles: [] },
      { school: 'Notre Dame', startYear: 1986, endYear: 1996, wins: 100, losses: 30, titles: [1988] },
      { school: 'South Carolina', startYear: 1999, endYear: 2004, wins: 33, losses: 37, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'george-perles',
    name: 'George Perles',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Michigan State', startYear: 1983, endYear: 1994, wins: 68, losses: 67, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'pete-carroll',
    name: 'Pete Carroll',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'USC', startYear: 2001, endYear: 2009, wins: 97, losses: 19, titles: [2003, 2004] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'steve-spurrier',
    name: 'Steve Spurrier',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Duke', startYear: 1987, endYear: 1989, wins: 20, losses: 13, titles: [] },
      { school: 'Florida', startYear: 1990, endYear: 2001, wins: 122, losses: 27, titles: [1996] },
      { school: 'South Carolina', startYear: 2005, endYear: 2015, wins: 86, losses: 49, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'urban-meyer',
    name: 'Urban Meyer',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Bowling Green', startYear: 2001, endYear: 2002, wins: 17, losses: 6, titles: [] },
      { school: 'Utah', startYear: 2003, endYear: 2004, wins: 22, losses: 2, titles: [] },
      { school: 'Florida', startYear: 2005, endYear: 2010, wins: 65, losses: 15, titles: [2006, 2008] },
      { school: 'Ohio State', startYear: 2012, endYear: 2018, wins: 83, losses: 9, titles: [2014] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'jim-tressel',
    name: 'Jim Tressel',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Youngstown State', startYear: 1986, endYear: 2000, wins: 135, losses: 57, titles: [1991, 1993, 1994, 1997] },
      { school: 'Ohio State', startYear: 2001, endYear: 2010, wins: 106, losses: 22, titles: [2002] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'tommy-bowden',
    name: 'Tommy Bowden',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Tulane', startYear: 1997, endYear: 1998, wins: 12, losses: 10, titles: [] },
      { school: 'Clemson', startYear: 1999, endYear: 2008, wins: 72, losses: 45, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'frank-beamer',
    name: 'Frank Beamer',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Murray State', startYear: 1981, endYear: 1986, wins: 42, losses: 23, titles: [] },
      { school: 'Virginia Tech', startYear: 1987, endYear: 2015, wins: 238, losses: 121, titles: [] },
    ],
    active: false,
    currentSchool: null,
  },
  {
    id: 'kirk-ferentz',
    name: 'Kirk Ferentz',
    photo: null,
    mentors: [],
    hcCareer: [
      { school: 'Iowa', startYear: 1999, endYear: null, wins: 198, losses: 117, titles: [] },
    ],
    active: true,
    currentSchool: 'Iowa',
  },
];

// ── IDs already covered by HISTORICAL ────────────────────────────────────────
const HISTORICAL_IDS = new Set(HISTORICAL.map(c => c.id));

// ── Process derived coaches ───────────────────────────────────────────────────
function processDerived(coach) {
  const titleMap = TITLE_OVERLAY[coach.id] || {};

  const hcCareer = coach.hcCareer.map((tenure, i) => {
    const titles = titleMap[tenure.school] || [];
    const isCurrentTenure = coach.active && i === coach.hcCareer.length - 1;
    return {
      school:    tenure.school,
      startYear: tenure.startYear,
      endYear:   isCurrentTenure ? null : tenure.endYear,
      wins:      tenure.wins,
      losses:    tenure.losses,
      titles,
    };
  });

  return {
    id:            coach.id,
    name:          coach.name,
    photo:         null,
    mentors:       coach.mentors,
    hcCareer,
    active:        coach.active,
    currentSchool: coach.currentSchool,
  };
}

// ── Merge ─────────────────────────────────────────────────────────────────────
const derivedCoaches = derived.coaches
  .filter(c => !HISTORICAL_IDS.has(c.id))
  .map(processDerived);

// Enrich HISTORICAL coaches with any mentor connections found in derived data
const derivedById = new Map(derived.coaches.map(c => [c.id, c]));
for (const hc of HISTORICAL) {
  const dc = derivedById.get(hc.id);
  if (dc && dc.mentors.length > 0) hc.mentors = dc.mentors;
}

// ── Sort: most mentees first, then alphabetical ───────────────────────────────
const menteeCount = id => derived.coaches.filter(c => c.mentors.some(m => m.coachId === id)).length;
derivedCoaches.sort((a, b) => {
  const diff = menteeCount(b.id) - menteeCount(a.id);
  return diff !== 0 ? diff : a.name.localeCompare(b.name);
});

const allCoaches = [...derivedCoaches, ...HISTORICAL];

// ── Serialise to TypeScript ───────────────────────────────────────────────────
function ser(v, indent = 0) {
  const pad = ' '.repeat(indent);
  if (v === null) return 'null';
  if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.every(x => typeof x === 'number')) return `[${v.join(', ')}]`;
    const items = v.map(x => `\n${pad}    ${ser(x, indent + 4)},`).join('');
    return `[${items}\n${pad}  ]`;
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    const lines = keys.map(k => `${pad}    ${k}: ${ser(v[k], indent + 4)},`).join('\n');
    return `{\n${lines}\n${pad}  }`;
  }
  return String(v);
}

function coachToTs(c) {
  const mentorsTs = c.mentors.length === 0 ? '[]' :
    '[\n' + c.mentors.map(m =>
      `      { coachId: '${m.coachId}', school: '${m.school.replace(/'/g,"\\'")}', role: '${m.role.replace(/'/g,"\\'")}', startYear: ${m.startYear}, endYear: ${m.endYear} },`
    ).join('\n') + '\n    ]';

  const careerTs = c.hcCareer.length === 0 ? '[]' :
    '[\n' + c.hcCareer.map(t =>
      `      { school: '${t.school.replace(/'/g,"\\'")}', startYear: ${t.startYear}, endYear: ${t.endYear === null ? 'null' : t.endYear}, wins: ${t.wins}, losses: ${t.losses}, titles: [${t.titles.join(', ')}] },`
    ).join('\n') + '\n    ]';

  return `  {
    id: '${c.id}',
    name: '${c.name.replace(/'/g,"\\'")}',
    photo: null,
    mentors: ${mentorsTs},
    hcCareer: ${careerTs},
    active: ${c.active},
    currentSchool: ${c.currentSchool ? `'${c.currentSchool.replace(/'/g,"\\'")}` + "'" : 'null'},
  },`;
}

const out = `export interface MentorStint {
  coachId: string;
  school: string;
  role: string;
  startYear: number;
  endYear: number;
}

export interface HCTenure {
  school: string;
  startYear: number;
  endYear: number | null;
  wins: number;
  losses: number;
  titles: number[];
}

export interface Coach {
  id: string;
  name: string;
  photo: string | null;
  mentors: MentorStint[];
  hcCareer: HCTenure[];
  active: boolean;
  currentSchool: string | null;
}

// Auto-generated by scripts/generate-coaches-ts.js
// Sources: CFBD /coaches API + Wikipedia season page scrape (2000–2024)
// ${derived.totalCoaches} coaches, ${derived.totalConnections} connections derived. Generated: ${derived.generated}
export const coaches: Coach[] = [

${allCoaches.map(coachToTs).join('\n\n')}

];

export function getCoachById(id: string): Coach | undefined {
  return coaches.find(c => c.id === id);
}

export function getCoachRecord(coach: Coach): { wins: number; losses: number } {
  return coach.hcCareer.reduce(
    (acc, t) => ({ wins: acc.wins + t.wins, losses: acc.losses + t.losses }),
    { wins: 0, losses: 0 }
  );
}

export function getCoachTitles(coach: Coach): number[] {
  return coach.hcCareer.flatMap(t => t.titles).sort();
}

export function getCoachMentees(coachId: string): Coach[] {
  return coaches.filter(c => c.mentors.some(m => m.coachId === coachId));
}

export const FEATURED_COACHES = [
  'nick-saban',
  'dabo-swinney',
  'kirby-smart',
  'mack-brown',
  'lincoln-riley',
  'les-miles',
  'urban-meyer',
  'bob-stoops',
];
`;

const outPath = path.join(__dirname, '..', 'data', 'coaching', 'coaches.ts');
fs.writeFileSync(outPath, out);
console.log(`✓ Wrote ${allCoaches.length} coaches to ${outPath}`);
console.log(`  Derived: ${derivedCoaches.length}  Historical: ${HISTORICAL.length}`);
