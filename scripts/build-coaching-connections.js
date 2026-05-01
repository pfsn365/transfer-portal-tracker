#!/usr/bin/env node
'use strict';

/**
 * Build coaching tree connections from scraped Wikipedia staff data + CFBD HC records.
 *
 * Logic:
 *  1. Load all wiki-staffs JSON files → who was on staff at each team/year
 *  2. Fetch CFBD /coaches → who was HEAD COACH at each team/year
 *  3. For each staff member who is NOT the HC:
 *       record  staff_member → worked under → HC  at  school  year
 *  4. For each person who appears as both an assistant AND later as an HC:
 *       emit a mentor connection:  HC_at_time → mentored → assistant
 *  5. Output:
 *       public/data/coaching/derived-connections.json  (review before using)
 *
 * Usage:
 *   node scripts/build-coaching-connections.js
 *   node scripts/build-coaching-connections.js --min-years=2   (min seasons under an HC to count)
 *   node scripts/build-coaching-connections.js --hc-only       (only emit connections for people who became HCs)
 */

const fs   = require('fs');
const path = require('path');

const arg  = k => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const flag = k => process.argv.includes(`--${k}`);

const MIN_YEARS  = parseInt(arg('min-years') ?? '1');
const HC_ONLY    = flag('hc-only');
const CFBD_KEY   = process.env.CFBD_API_KEY ?? '';

const STAFFS_DIR = path.join(__dirname, '..', 'public', 'data', 'coaching', 'wiki-staffs');
const OUT_FILE   = path.join(__dirname, '..', 'public', 'data', 'coaching', 'derived-connections.json');

// ── Name normalization ─────────────────────────────────────────────────────────

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\bjr\.?$|\bsr\.?$|\biii?$|\biv$/i, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toId(name) {
  return normalizeName(name).replace(/\s+/g, '-');
}

// ── CFBD: fetch all head coaches ───────────────────────────────────────────────

async function fetchCfbdCoaches() {
  if (!CFBD_KEY) {
    console.warn('⚠  No CFBD_API_KEY set — skipping CFBD fetch, using wiki HC detection only');
    return [];
  }
  const res = await fetch('https://api.collegefootballdata.com/coaches', {
    headers: { Authorization: `Bearer ${CFBD_KEY}` },
  });
  if (!res.ok) throw new Error(`CFBD error ${res.status}`);
  return res.json(); // Array of { firstName, lastName, seasons: [{school, year, wins, losses}] }
}

// ── Load wiki-staffs ───────────────────────────────────────────────────────────

function loadAllStaffs() {
  // Returns: Map<"team|year", { hc: string|null, staff: {name,role}[] }>
  const result = new Map();

  if (!fs.existsSync(STAFFS_DIR)) {
    console.error(`✗ ${STAFFS_DIR} not found — run scrape-wiki-staffs.js first`);
    process.exit(1);
  }

  for (const teamDir of fs.readdirSync(STAFFS_DIR)) {
    const teamPath = path.join(STAFFS_DIR, teamDir);
    if (!fs.statSync(teamPath).isDirectory()) continue;

    for (const file of fs.readdirSync(teamPath)) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(teamPath, file), 'utf-8'));
        if (!data.found || !data.staff?.length) continue;
        result.set(`${data.team}|${data.year}`, data);
      } catch { /* skip bad files */ }
    }
  }

  return result;
}

// ── Detect HC from staff list ──────────────────────────────────────────────────

function detectHcFromStaff(staff) {
  const hcEntry = staff.find(s => /^head\s+coach$/i.test(s.role.trim()));
  return hcEntry ? normalizeName(hcEntry.name) : null;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading scraped staff files…');
  const staffMap = loadAllStaffs();
  console.log(`  Loaded ${staffMap.size} team-year files with staff data`);

  // Fetch CFBD HC records
  console.log('\nFetching CFBD head coach records…');
  const cfbdCoaches = await fetchCfbdCoaches();
  console.log(`  ${cfbdCoaches.length} coaches from CFBD`);

  // Build HC lookup: "team_slug|year" → normalized HC name
  // from CFBD
  const hcLookup = new Map(); // key: "team|year" → normalized name
  for (const coach of cfbdCoaches) {
    const fullName = normalizeName(`${coach.firstName} ${coach.lastName}`);
    for (const s of (coach.seasons ?? [])) {
      const key = `${s.school.toLowerCase()}|${s.year}`;
      hcLookup.set(key, fullName);
    }
  }

  // Also infer HCs from the wiki staff "Head coach" row
  for (const [key, data] of staffMap) {
    if (!hcLookup.has(key)) {
      const wikiHc = detectHcFromStaff(data.staff);
      if (wikiHc) hcLookup.set(key, wikiHc);
    }
  }

  // ── Build assistant work history ─────────────────────────────────────────────
  // assistantHistory[normalizedName] = [{hcName, school, year, role}]
  const assistantHistory = new Map();

  for (const [key, data] of staffMap) {
    const [team, yearStr] = key.split('|');
    const year = parseInt(yearStr);
    const hcNorm = hcLookup.get(key) ?? detectHcFromStaff(data.staff);
    if (!hcNorm) continue;

    for (const entry of data.staff) {
      const norm = normalizeName(entry.name);
      if (!norm || norm === hcNorm) continue; // skip the HC themselves
      if (norm.split(' ').length < 2) continue; // skip single-word entries

      if (!assistantHistory.has(norm)) assistantHistory.set(norm, []);
      assistantHistory.get(norm).push({ hcName: hcNorm, school: team, year, role: entry.role });
    }
  }

  // ── Build HC career map from CFBD ─────────────────────────────────────────────
  // hcCareerMap[normalizedName] = [{school, years:[], wins, losses}]
  const hcCareerMap = new Map();
  for (const coach of cfbdCoaches) {
    const norm = normalizeName(`${coach.firstName} ${coach.lastName}`);
    const grouped = new Map();
    for (const s of (coach.seasons ?? [])) {
      const k = s.school;
      if (!grouped.has(k)) grouped.set(k, { school: s.school, wins: 0, losses: 0, years: [] });
      const g = grouped.get(k);
      g.wins   += s.wins   ?? 0;
      g.losses += s.losses ?? 0;
      g.years.push(s.year);
    }
    if (grouped.size > 0) {
      hcCareerMap.set(norm, [...grouped.values()].map(g => ({
        school:    g.school,
        startYear: Math.min(...g.years),
        endYear:   Math.max(...g.years),
        wins:      g.wins,
        losses:    g.losses,
        titles:    [],
      })));
    }
  }

  // ── Derive connections ────────────────────────────────────────────────────────
  // For each person in assistantHistory who also appears in hcCareerMap:
  //   they are a mentee of whoever was HC when they were an assistant

  const connections = []; // { mentee, mentor, school, startYear, endYear, role }

  // Deduplicate: group assistant stints by (norm_mentee, norm_hc, school)
  const stintMap = new Map(); // key: "mentee|hc|school" → {years[], roles[]}

  for (const [assistNorm, stints] of assistantHistory) {
    // Only track if they became an HC themselves (--hc-only) or always
    if (HC_ONLY && !hcCareerMap.has(assistNorm)) continue;
    if (!hcCareerMap.has(assistNorm)) continue; // always require them to have become an HC

    for (const stint of stints) {
      const stintKey = `${assistNorm}|${stint.hcName}|${stint.school}`;
      if (!stintMap.has(stintKey)) {
        stintMap.set(stintKey, { menteeNorm: assistNorm, mentorNorm: stint.hcName, school: stint.school, years: [], roles: [] });
      }
      const s = stintMap.get(stintKey);
      s.years.push(stint.year);
      if (!s.roles.includes(stint.role)) s.roles.push(stint.role);
    }
  }

  // Filter by MIN_YEARS and emit connections
  for (const [, s] of stintMap) {
    if (s.years.length < MIN_YEARS) continue;
    connections.push({
      mentee:    s.menteeNorm,
      mentor:    s.mentorNorm,
      school:    s.school,
      startYear: Math.min(...s.years),
      endYear:   Math.max(...s.years),
      roles:     s.roles,
    });
  }

  // ── Build output ──────────────────────────────────────────────────────────────

  // Collect all unique persons (HCs with connections)
  const allNames = new Set([
    ...connections.map(c => c.mentee),
    ...connections.map(c => c.mentor),
  ]);

  // Map norm → display name (best guess from CFBD)
  const displayNames = new Map();
  for (const coach of cfbdCoaches) {
    const norm = normalizeName(`${coach.firstName} ${coach.lastName}`);
    displayNames.set(norm, `${coach.firstName} ${coach.lastName}`);
  }
  // Also try to find display names from assistant history entries
  for (const [, stints] of assistantHistory) {
    for (const s of stints) {
      const norm = normalizeName(s.hcName);
      if (!displayNames.has(norm)) displayNames.set(norm, s.hcName);
    }
  }

  const coaches = [];
  for (const norm of allNames) {
    const displayName = displayNames.get(norm)
      ?? norm.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    const hcCareer = hcCareerMap.get(norm) ?? [];
    const mentors  = connections
      .filter(c => c.mentee === norm)
      .map(c => ({
        coachId:   toId(c.mentor),
        school:    c.school,
        role:      c.roles[0] ?? 'Assistant Coach',
        startYear: c.startYear,
        endYear:   c.endYear,
      }));

    coaches.push({
      id:            toId(norm),
      name:          displayName,
      normName:      norm,
      active:        hcCareer.some(t => t.endYear >= 2024),
      currentSchool: hcCareer.find(t => t.endYear >= 2024)?.school ?? null,
      hcCareer,
      mentors,
    });
  }

  // Sort: most mentee connections first (biggest trees at top)
  const menteeCount = name => connections.filter(c => c.mentor === name).length;
  coaches.sort((a, b) => menteeCount(b.normName) - menteeCount(a.normName));

  const output = {
    generated:   new Date().toISOString(),
    totalCoaches: coaches.length,
    totalConnections: connections.length,
    coaches,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n✓ ${coaches.length} coaches, ${connections.length} connections → ${OUT_FILE}`);
  console.log('\nTop 20 coaches by mentee count:');
  coaches.slice(0, 20).forEach((c, i) => {
    const mc = menteeCount(c.normName);
    if (mc > 0) console.log(`  ${String(i+1).padStart(2)}. ${c.name.padEnd(30)} ${mc} mentees`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
