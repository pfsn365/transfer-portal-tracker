'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapRecruit {
  name: string;
  position: string;
  stars: number;
  city: string;
  state: string;
  highSchool: string;
  committedTo?: string;
  commitStatus: string;
  lat: number;
  lng: number;
  nationalRank: number;
  imageUrl: string;
}

interface LeafletMapProps {
  recruits: MapRecruit[];
  getTeamColor: (teamId: string) => string;
  getTeamLogo: (teamId: string) => string;
}

function starIcons(stars: number): string {
  return Array.from({ length: 5 }, (_, i) =>
    `<svg style="width:10px;height:10px;display:inline" viewBox="0 0 20 20" fill="${i < stars ? '#facc15' : '#d1d5db'}"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`
  ).join('');
}

const isTouchDevice = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function LeafletMap({ recruits, getTeamColor, getTeamLogo }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [39.0, -96.0],
      zoom: 4,
      minZoom: 3,
      maxZoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true,
      maxBounds: [[-85, -Infinity], [85, Infinity]],
      maxBoundsViscosity: 0.8,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Compute marker size based on zoom level
  const getMarkerSize = (zoom: number, stars: number) => {
    // Scale factor: at zoom 4 (US view) = 1x, zoom 8 = 2x, zoom 12 = 3.5x
    const scale = 0.5 + (zoom - 3) * 0.3;
    const base = stars >= 5 ? 20 : stars >= 4 ? 16 : 13;
    return Math.round(base * scale);
  };

  const getCircleRadius = (zoom: number, stars: number) => {
    const scale = 0.5 + (zoom - 3) * 0.25;
    const base = stars >= 5 ? 5 : stars >= 4 ? 4 : 3;
    return Math.round(base * scale * 10) / 10;
  };

  // Build a single DivIcon for a committed recruit at a given size
  const buildLogoIcon = (r: MapRecruit, size: number) => {
    const borderColor = r.stars >= 5 ? '#f59e0b' : getTeamColor(r.committedTo!);
    const borderWidth = r.stars >= 5 ? 2.5 : 1.5;

    return L.divIcon({
      className: 'recruit-logo-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2)],
      html: `<div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        border:${borderWidth}px solid ${borderColor};
        background:#fff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 1px 3px rgba(0,0,0,0.25);
        overflow:hidden;
      "><img src="${getTeamLogo(r.committedTo!)}" style="
        width:${Math.max(size - borderWidth * 2 - 2, 6)}px;
        height:${Math.max(size - borderWidth * 2 - 2, 6)}px;
        object-fit:contain;
      " /></div>`,
    });
  };

  // Update markers when recruits change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layer group and zoom listener
    if (layerGroupRef.current) {
      map.removeLayer(layerGroupRef.current);
      layerGroupRef.current = null;
    }

    const layerGroup = L.layerGroup();

    // Sort: uncommitted first (behind), lower stars first (higher stars on top)
    const sorted = [...recruits].sort((a, b) => {
      if (a.commitStatus === 'committed' && b.commitStatus !== 'committed') return 1;
      if (a.commitStatus !== 'committed' && b.commitStatus === 'committed') return -1;
      return (a.stars || 0) - (b.stars || 0);
    });

    const isTouch = isTouchDevice();
    const divMarkers: { marker: L.Marker; recruit: MapRecruit }[] = [];
    const circleMarkers: { marker: L.CircleMarker; recruit: MapRecruit }[] = [];

    for (const r of sorted) {
      const isCommitted = r.commitStatus === 'committed' && r.committedTo;
      let marker: L.Marker | L.CircleMarker;
      const zoom = map.getZoom();

      if (isCommitted) {
        const size = getMarkerSize(zoom, r.stars);
        const icon = buildLogoIcon(r, size);
        const m = L.marker([r.lat, r.lng], { icon });
        divMarkers.push({ marker: m, recruit: r });
        marker = m;
      } else {
        const radius = getCircleRadius(zoom, r.stars);
        const m = L.circleMarker([r.lat, r.lng], {
          radius,
          fillColor: '#9ca3af',
          fillOpacity: 0.4,
          color: '#9ca3af',
          weight: 1,
          opacity: 0.6,
        });
        circleMarkers.push({ marker: m, recruit: r });
        marker = m;
      }

      // Popup
      const logoHtml = r.committedTo
        ? `<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding-top:4px;border-top:1px solid #e5e7eb">
             <img src="${getTeamLogo(r.committedTo)}" style="width:16px;height:16px;object-fit:contain" />
             <span style="font-size:11px;font-weight:500;color:#374151">${r.committedTo}</span>
           </div>`
        : '<div style="font-size:11px;color:#dc2626;margin-top:4px">Uncommitted</div>';

      const popupContent = `
        <div style="font-family:system-ui;min-width:160px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-weight:700;font-size:13px;color:#111827">${r.name}</span>
            ${r.nationalRank > 0 ? `<span style="font-size:11px;color:#9ca3af">#${r.nationalRank}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-size:11px;color:#6b7280;font-weight:500">${r.position}</span>
            <span>${starIcons(r.stars)}</span>
          </div>
          <div style="font-size:11px;color:#6b7280">${r.highSchool}${r.state ? `, ${r.state}` : ''}</div>
          ${logoHtml}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -2],
        className: 'recruit-popup',
      });

      if (!isTouch) {
        marker.on('mouseover', () => { marker.openPopup(); });
        marker.on('mouseout', () => { marker.closePopup(); });
      }
      marker.on('click', () => { marker.openPopup(); });

      layerGroup.addLayer(marker);
    }

    // Resize markers on zoom
    const onZoom = () => {
      const z = map.getZoom();
      for (const { marker, recruit } of divMarkers) {
        const size = getMarkerSize(z, recruit.stars);
        marker.setIcon(buildLogoIcon(recruit, size));
      }
      for (const { marker, recruit } of circleMarkers) {
        marker.setRadius(getCircleRadius(z, recruit.stars));
      }
    };

    map.on('zoomend', onZoom);
    layerGroup.addTo(map);
    layerGroupRef.current = layerGroup;

    return () => {
      map.off('zoomend', onZoom);
    };
  }, [recruits, getTeamColor, getTeamLogo]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div
        ref={containerRef}
        style={{ height: 500, width: '100%' }}
      />
    </div>
  );
}
