# CFB Transfer Portal Tracker

A comprehensive, real-time college football transfer portal tracking application built with Next.js 15, React 19, and Tailwind CSS. Designed to compete with On3 and 247 Sports with a sleek, professional design featuring official team logos and colors.

## Features

- **Live Data Integration**: Fetches real transfer portal data from PFSN Google Sheets API
- **Real-time Filtering**: Auto-updating filters for Status, School, Class, Position, and Conference - no Apply button needed
- **Team Branding**: Official team logos and colors for all 130+ FBS teams
- **Responsive Design**: Optimized desktop table view and mobile card view
- **Sleek UX**: Modern, clean interface that matches/exceeds industry-leading sports tracking platforms
- **Conference Tracking**: Track player movements between conferences with visual transfer paths
- **Smart Caching**: 1-hour server-side cache for optimal performance
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Professional loading indicators

## Tech Stack

- **Framework**: Next.js 15.4.10
- **React**: 19.1.2
- **Styling**: Tailwind CSS 4
- **TypeScript**: Latest
- **Icons**: Lucide React

## Project Structure

```
transfer-portal-tracker/
├── app/
│   ├── api/
│   │   └── transfer-portal/
│   │       └── route.ts     # API endpoint for fetching data
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx             # Main tracker page (fetches from API)
│   └── globals.css          # Global styles
├── components/
│   ├── FilterBar.tsx        # Filter controls
│   ├── Header.tsx           # Page header with live timestamp
│   ├── PlayerTable.tsx      # Player data table/cards with team logos
│   ├── LoadingSpinner.tsx   # Loading state component
│   ├── ErrorMessage.tsx     # Error state component
│   └── GoogleAnalytics.js   # Analytics component
├── data/
│   └── samplePlayers.ts     # Sample data (for reference only)
├── types/
│   ├── player.ts            # Player TypeScript interfaces
│   └── api.ts               # API response interfaces
├── utils/
│   ├── teamColors.ts        # Official team colors for all CFB teams
│   ├── teamLogos.ts         # Team logo URLs from PFSN CDN
│   └── dataTransform.ts     # Transform API data to app format
└── next.config.ts           # Next.js configuration
```

## Configuration

The app is configured with:
- **Base Path**: `/cfb-hq/transfer-portal-tracker`
- **Asset Prefix**: `/cfb-hq/transfer-portal-tracker/`

These can be modified in `next.config.ts` if needed.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The development server will be available at `http://localhost:3000/cfb-hq/transfer-portal-tracker/`

## Filter Options

### Status
- All
- Entered
- Committed
- Expected
- Withdrawn

### Class
- FR (Freshman)
- SO (Sophomore)
- JR (Junior)
- SR (Senior)
- GR (Graduate)

### Position
- Offense: QB, RB, WR, TE, OL, OT, OG, C
- Defense: EDGE, DL, DT, LB, CB, S, DB
- Special Teams: K, P, LS
- ATH (Athlete)

### Conference
- Power 5: SEC, Big Ten, Big 12, ACC, Pac-12
- Group of 5: American, Mountain West, Sun Belt, MAC, C-USA
- Other: Independent, FCS

## Data Structure

Each transfer player includes:
- Personal info (name, position, class)
- Physical stats (height, weight)
- Transfer path (former school/conference, new school/conference)
- Status and rating
- Important dates
- Team logos (automatically fetched from school names)
- Team colors (for future customization)

## Team Branding

The tracker includes comprehensive team branding for 130+ FBS teams:
- **Team Logos**: Hosted on PFSN CDN for fast loading
- **Team Colors**: Official hex codes for all teams
- **Conference Coverage**: All Power 5, Group of 5, Independents, and major FCS programs
- **Visual Transfer Paths**: See team logos in transfer progression (Former School → New School)

## Future Enhancements

- 136 dynamic team pages (planned for post-MVP)
- Real-time data integration
- Advanced search and sorting
- Player comparison tools
- Historical transfer tracking

## License

Private - Pro Football Network

## Support

For issues or questions, contact the development team.
