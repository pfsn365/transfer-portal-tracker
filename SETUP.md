# Quick Start Guide

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000/cfb-hq/transfer-portal-tracker/`

### 3. Build for Production
```bash
npm run build
npm start
```

## Features Implemented

### ✅ Auto-Updating Filters
All 5 filter dropdowns update the results immediately without clicking "Apply":
- Status (Entered, Committed, Expected, Withdrawn)
- School (Dynamic list from player data)
- Class (FR, SO, JR, SR, GR)
- Position (QB, RB, WR, TE, OL, EDGE, DL, LB, CB, S, etc.)
- Conference (All FBS conferences + FCS)

### ✅ Team Logos & Colors
- 130+ team logos from PFN CDN
- Official team colors for all FBS teams
- Logos displayed in player avatars and transfer paths
- Visual "From → To" transfer progression

### ✅ Responsive Design
- **Desktop**: Professional table layout with sortable columns
- **Mobile**: Card-based layout optimized for touch
- Smooth transitions and hover effects
- Optimized for all screen sizes

### ✅ Sample Data
18 realistic players including:
- Dillon Gabriel (Oklahoma → Oregon)
- Travis Hunter (Jackson State → Colorado)
- Caleb Williams (Oklahoma → USC)
- Jalen Hurts (Alabama → Oklahoma)
- And 14 more with real transfer scenarios

## Configuration

### Base Path
Currently set to: `/cfb-hq/transfer-portal-tracker/`

To change this, edit `next.config.ts`:
```typescript
basePath: '/your-new-path',
assetPrefix: '/your-new-path/',
```

### Google Analytics
Add your GA tracking ID to `.env`:
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Project Structure

```
/app/page.tsx           → Main tracker with filter logic
/components/
  - FilterBar.tsx       → 5 auto-updating filters
  - Header.tsx          → Title, player count, timestamp
  - PlayerTable.tsx     → Desktop table + mobile cards
/data/samplePlayers.ts  → 18 sample transfer players
/utils/
  - teamColors.ts       → Team colors for 130+ teams
  - teamLogos.ts        → Logo URLs for all teams
```

## Adding Real Data

### Option 1: API Endpoint
Create `/app/api/players/route.ts` and fetch from your database:
```typescript
export async function GET() {
  const players = await db.players.findAll();
  return Response.json(players);
}
```

### Option 2: Google Sheets (like NFL Draft Hub)
Install `googleapis` and create a sync script similar to your NFL Draft Hub setup.

### Option 3: Static JSON
Replace `samplePlayers.ts` with your own data file.

## Next Steps

### 136 Dynamic Team Pages
After MVP launch, create team-specific pages:
```
/app/teams/[teamSlug]/page.tsx
```

This will filter the tracker to show only transfers related to that team.

### Additional Features
- Search functionality
- Sorting by rating, date, etc.
- Export to CSV/PDF
- Email notifications for new transfers
- Historical transfer data

## Deployment

This app is ready to deploy to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Your own server with Node.js

Make sure to set environment variables in your deployment platform.

## Support

For issues or questions, contact the development team or check the main README.md file.
