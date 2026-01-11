# API Integration Guide

## Overview

The CFB Transfer Portal Tracker now fetches live data from:
```
https://staticj.profootballnetwork.com/assets/sheets/tools/cfb-transfer-portal-tracker/transferPortalTrackerData.json
```

## Data Flow

1. **External API** → PFSN JSON endpoint with Google Sheets data
2. **Next.js API Route** (`/api/transfer-portal`) → Fetches and transforms data
3. **Client Component** → Displays with filters and team branding
4. **Caching** → 1-hour cache for optimal performance

## API Response Structure

### External API Format
```json
{
  "collections": [{
    "sheetName": "sheet1",
    "data": [
      ["Year", "Player Name", "Status", "Class", "Position", "Former Conference", "Former School", "New Conference", "New School", "PFSN Impact Grade"],
      ["2026", "John Doe", "Active", "FR", "QB", "Big Ten", "Oregon", "SEC", "Alabama", "90.0"]
    ]
  }],
  "updatedTime": "2025-12-24T14:02:08Z"
}
```

### Internal API Response
```json
{
  "players": [
    {
      "id": "1",
      "name": "John Doe",
      "position": "QB",
      "class": "FR",
      "status": "Entered",
      "formerSchool": "oregon",
      "formerConference": "Big Ten",
      "newSchool": "alabama",
      "newConference": "SEC",
      "rating": 90,
      "announcedDate": "2025-12-24"
    }
  ],
  "updatedTime": "2025-12-24T14:02:08Z",
  "totalPlayers": 146
}
```

## Data Transformation

The API route transforms the external data:

### Status Mapping
- `"Active"` → `"Entered"`
- `"Committed"` → `"Committed"`
- `"Expected"` → `"Expected"`
- `"Withdrawn"` → `"Withdrawn"`

### Class Mapping
- `"FR"` or `"FRESHMAN"` → `"FR"`
- `"SO"` or `"SOPHOMORE"` → `"SO"`
- `"JR"` or `"JUNIOR"` → `"JR"`
- `"SR"` or `"SENIOR"` → `"SR"`
- `"GR"` or `"GRADUATE"` → `"GR"`

### Position Validation
All positions are validated against valid CFB positions:
- Offense: QB, RB, WR, TE, OL, OT, OG, C
- Defense: EDGE, DL, DT, LB, CB, S, DB
- Special Teams: K, P, LS
- Other: ATH

### School Names
School names are converted to lowercase for consistent logo/color matching:
- `"Oregon"` → `"oregon"`
- `"Alabama"` → `"alabama"`

## Caching Strategy

- **Server-side**: 1-hour cache (`revalidate: 3600`)
- **Client-side**: Data fetched on component mount
- **Dynamic Route**: API route is server-rendered on demand

## Error Handling

The app handles errors gracefully:

1. **Network Errors**: Shows error message with retry button
2. **Invalid Data**: Filters out invalid entries
3. **Missing Data**: Shows empty state
4. **Loading States**: Displays loading spinner

## Files Involved

### API Layer
- `/app/api/transfer-portal/route.ts` - API route handler
- `/types/api.ts` - API type definitions
- `/utils/dataTransform.ts` - Data transformation logic

### UI Components
- `/app/page.tsx` - Main page with data fetching
- `/components/LoadingSpinner.tsx` - Loading state
- `/components/ErrorMessage.tsx` - Error state
- `/components/Header.tsx` - Updated timestamp display

## Performance Optimizations

1. **Data Caching**: 1-hour server cache
2. **Memoization**: Filter results memoized with `useMemo`
3. **Image Optimization**: Next.js Image component
4. **Code Splitting**: Dynamic imports where possible

## Updating the Data Source

To use a different data source, update the `API_URL` in:
```typescript
// /app/api/transfer-portal/route.ts
const API_URL = 'YOUR_NEW_URL_HERE';
```

Make sure the data format matches or update the transformation logic in `/utils/dataTransform.ts`.

## Testing the API

### Local Development
```bash
npm run dev
```

Visit: `http://localhost:3000/cfb-hq/transfer-portal-tracker/api/transfer-portal`

### Production Build
```bash
npm run build
npm start
```

## Monitoring

The API route logs errors to the console:
```typescript
console.error('Error fetching transfer portal data:', error);
```

In production, connect your logging service (e.g., Sentry, LogRocket) to track errors.

## Future Enhancements

1. **Real-time Updates**: WebSocket connection for live updates
2. **Manual Refresh**: Button to force data refresh
3. **Offline Support**: Service worker for offline access
4. **Analytics**: Track most viewed players/schools
5. **Search**: Server-side search endpoint
