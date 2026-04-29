'use client';

import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, type Geography as GeoType } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const STATE_NAME_TO_ABBR: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'District of Columbia': 'DC',
};

const ABBR_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
);

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function interpolateColor(baseHex: string, count: number, maxCount: number): string {
  if (count === 0) return '#e5e7eb';
  if (!baseHex || !baseHex.startsWith('#')) baseHex = '#0050A0';
  const t = Math.sqrt(count / Math.max(maxCount, 1));
  const { r, g, b } = hexToRgb(baseHex);
  const lr = 230, lg = 240, lb = 252;
  const nr = Math.round(lr + (r - lr) * t);
  const ng = Math.round(lg + (g - lg) * t);
  const nb = Math.round(lb + (b - lb) * t);
  return `rgb(${nr},${ng},${nb})`;
}

interface StateChoroMapProps {
  stateCounts: Record<string, number>;
  teamColor: string;
  selectedState?: string;
  onStateHover?: (abbr: string, name: string, count: number) => void;
  onStateLeave?: () => void;
  onStateClick?: (abbr: string, name: string, count: number) => void;
}

export default function StateChoroMap({ stateCounts, teamColor, selectedState, onStateHover, onStateLeave, onStateClick }: StateChoroMapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const maxCount = Math.max(1, ...Object.values(stateCounts));

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 860 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: GeoType[] }) =>
            geographies.map((geo: GeoType) => {
              const stateName: string = geo.properties?.name ?? '';
              const abbr = STATE_NAME_TO_ABBR[stateName] ?? '';
              const count = abbr ? (stateCounts[abbr] ?? 0) : 0;
              const isSelected = abbr !== '' && abbr === selectedState;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={interpolateColor(teamColor, count, maxCount)}
                  stroke={isSelected ? '#111827' : '#ffffff'}
                  strokeWidth={isSelected ? 2.5 : 0.6}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', opacity: 0.8, cursor: abbr ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    const rect = (e.currentTarget as SVGElement)
                      .closest('svg')
                      ?.getBoundingClientRect();
                    if (rect && abbr) {
                      setTooltip({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top - 12,
                        content: `${ABBR_TO_NAME[abbr] ?? abbr}: ${count} recruit${count !== 1 ? 's' : ''}`,
                      });
                      onStateHover?.(abbr, stateName, count);
                    }
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                    onStateLeave?.();
                  }}
                  onClick={() => {
                    if (abbr) onStateClick?.(abbr, stateName, count);
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
