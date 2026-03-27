# CollegeFootballData.com API — Opportunities for Our Site

API Docs: https://collegefootballdata.com
Rate Limit: 1,000 requests/month (free tier)

---

## High-Value New Pages

### 1. Recruiting (`/recruiting/players`, `/recruiting/teams`, `/recruiting/groups`)
Our site has zero recruiting data. This is one of the most popular topics in CFB. We could build:
- A **Recruiting Rankings** page with team class rankings by year
- Top recruit lists filterable by position, state, star rating
- A **Recruiting tab** on each team page showing their class breakdown by position group

### 2. Team Ratings / Power Rankings (`/ratings/sp`, `/ratings/elo`, `/ratings/fpi`, `/ratings/srs`)
We have a manual drag-and-drop power rankings builder, but no data-driven ratings. We could add a page showing SP+, Elo, FPI, and SRS side-by-side — lets users compare different ranking systems.

### 3. Head-to-Head Matchup Tool (`/teams/matchup`)
A new interactive page where users pick two teams and see their all-time series history — wins, losses, biggest blowouts, recent trends. Very engaging.

---

## Bolster Existing Pages

### 4. Transfer Portal (`/player/transfers`)
Current source is a PFSN static JSON. CFBD's transfer endpoint could supplement or cross-reference this with additional data points (origin/destination, eligibility, etc.).

### 5. Team Pages — New Tabs/Data
- **Returning Production** (`/players/returns/production`) — show what % of offensive production returns. Huge for offseason hype.
- **Talent Composite** (`/talent`) — 247 team talent ratings on the Overview tab
- **Coaches** (`/coaches`) — enrich the History tab with full coaching records (currently from local JSON)
- **Venues** (`/venues`) — stadium info, capacity, surface type on Overview

### 6. Schedule Page (`/games/weather`, `/betting`, `/games/media`)
- **Betting lines** — spreads and over/unders alongside games
- **Weather** — game-day conditions (outdoor stadiums)
- **Broadcast info** — we may already have this from ESPN, but CFBD can fill gaps

### 7. Player Profiles (`/player/usage/season`, PPA endpoints)
- **Usage rates** — snap percentages, involvement metrics
- **PPA (Predicted Points Added)** — advanced efficiency metrics per player
- These would differentiate player pages from basic ESPN stat mirrors

### 8. Advanced Stats (`/stats/season/advanced`, `/wepa/*`)
- Add advanced metrics to stat-leaders page: success rate, explosiveness, havoc rate
- Opponent-adjusted stats (WEPA) are a big differentiator over ESPN

---

## Priority Ranking

| Priority | Feature | Effort | Why |
|----------|---------|--------|-----|
| 1 | **Recruiting page + team tab** | Medium | Massive fan interest, zero coverage currently |
| 2 | **Team Ratings page** (SP+/Elo/FPI/SRS) | Low | Easy to build, very popular analytics content |
| 3 | **Head-to-Head Matchup tool** | Medium | Highly interactive, shareable, unique |
| 4 | **Returning Production on team pages** | Low | Great offseason content, quick win |
| 5 | **Advanced stats on stat-leaders** | Medium | Differentiates from ESPN |
| 6 | **Betting lines on schedule** | Low | Huge engagement driver |
| 7 | **Transfer portal cross-reference** | Low | Bolsters our core feature |
| 8 | **Player PPA/usage on profiles** | Medium | Makes player pages deeper |

---

## Full CFBD API Endpoint Reference

### Adjusted Metrics
- `GET /wepa/team/season` — Opponent-adjusted team season statistics
- `GET /wepa/players/passing` — Opponent-adjusted player passing stats
- `GET /wepa/players/rushing` — Opponent-adjusted player rushing stats
- `GET /wepa/players/kicking` — Kicker PAAR ratings

### Teams
- `GET /teams` — General team info and historical conference data
- `GET /teams/fbs` — FBS division teams only
- `GET /teams/matchup` — Historical matchup details between two teams
- `GET /teams/ats` — Against-the-spread summaries by team
- `GET /roster` — Historical roster player data
- `GET /talent` — 247 Team Talent Composite ratings

### Conferences
- `GET /conferences` — Conference listings

### Venues
- `GET /venues` — Stadium and venue information

### Statistics
- `GET /stats/player/season` — Aggregated player season statistics
- `GET /stats/season` — Aggregated team season statistics
- `GET /stats/categories` — Available team statistical categories
- `GET /stats/season/advanced` — Advanced offensive and defensive metrics
- `GET /stats/game/advanced` — Advanced per-game statistics
- `GET /stats/game/havoc` — Havoc stats by game

### Recruiting
- `GET /recruiting/players` — Player recruiting rankings
- `GET /recruiting/teams` — Team recruiting rankings
- `GET /recruiting/groups` — Aggregated recruiting by position group

### Ratings
- `GET /ratings/sp` — SP+ power ratings
- `GET /ratings/sp/conferences` — Conference-level SP+ data
- `GET /ratings/srs` — Simple Rating System ratings
- `GET /ratings/elo` — Historical Elo ratings
- `GET /ratings/fpi` — Football Power Index ratings

### Rankings & Polls
- `GET /rankings` — Historical poll rankings data

### Plays
- `GET /plays` — Historical play-by-play data
- `GET /plays/types` — Play type classifications
- `GET /plays/stats` — Player-play associations with statistics

### Players
- `GET /player/search` — Player search
- `GET /player/{playerId}/ppa/season` — Player season PPA metrics
- `GET /player/{playerId}/ppa/game` — Player game-level PPA
- `GET /player/usage/season` — Player snap usage percentages
- `GET /players/returns/production` — Returning offensive production metrics
- `GET /player/transfers` — Player transfer portal data

### Predicted Points & EPA
- `GET /ppa/predicted` — Yard line expected points values
- `GET /ppa/season` — Team season PPA summaries
- `GET /ppa/game` — Team game-level PPA
- `GET /ppa/player/season` — Player season PPA summaries
- `GET /ppa/player/game` — Player game-level PPA

### Win Probability
- `GET /wp/pregame` — Pre-game win probability projections
- `GET /wp/play` — Play-by-play win probability

### Field Goal
- `GET /fg/ep` — Field goal expected points by distance

### Games
- `GET /games` — Game records with scores and details
- `GET /games/media` — Game broadcast information
- `GET /games/weather` — Game weather conditions
- `GET /games/scoreboard` — Live scoreboard data
- `GET /games/teams/stats` — Team-level game statistics
- `GET /games/players/stats` — Player-level game statistics

### Drives
- `GET /drives` — Drive-by-drive results and details

### Advanced Analytics
- `GET /live` — Real-time live game data
- `GET /betting` — Betting lines and projections
- `GET /box/advanced` — Advanced box score analytics

### Draft
- `GET /draft/picks` — NFL draft selections with college info

### Coaches
- `GET /coaches` — Coaching records and history

### Calendar
- `GET /calendar` — Season calendar with week dates
