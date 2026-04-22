'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import Image from 'next/image';
import useSWR from 'swr';
import { Team } from '@/data/teams';
import { fetcher } from '@/utils/swr';
import LoadingSpinner from '@/components/LoadingSpinner';

const measuringConfig = { droppable: { strategy: MeasuringStrategy.Always } };

// ── Types ─────────────────────────────────────────────────────────────────────

interface DepthChartPlayer {
  name: string;
  slug: string;
  depth: number;
  injuryStatus?: string;
  isCustom?: boolean;
}

interface DepthChartPosition {
  name: string;
  abbreviation: string;
  players: DepthChartPlayer[];
}

interface DepthChartData {
  offense: DepthChartPosition[];
  defense: DepthChartPosition[];
  specialTeams: DepthChartPosition[];
}

interface DepthChartResponse {
  positions: DepthChartData;
  season: number;
  lastUpdated?: string;
  source?: 'cfbd';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SWAP_GROUPS: Set<string>[] = [
  new Set(['LT', 'LG', 'C', 'RG', 'RT']),
  new Set(['LDE', 'RDE', 'DE', 'NT', 'DT', 'LDT', 'RDT']),
  new Set(['WLB', 'LILB', 'RILB', 'SLB', 'LOLB', 'ROLB', 'MLB', 'LLB', 'RLB']),
  new Set(['LCB', 'RCB', 'NB', 'FS', 'SS']),
];

function canSwapPositions(pos1: string, pos2: string) {
  if (pos1 === pos2) return true;
  return SWAP_GROUPS.some(g => g.has(pos1) && g.has(pos2));
}

const DEPTH_LABELS = ['Starter', '2nd', '3rd', '4th'];
function getDepthLabel(d: number) { return DEPTH_LABELS[d - 1] ?? `${d}th`; }

const INJURY_STYLES: Record<string, { bg: string; text: string }> = {
  Q:  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  O:  { bg: 'bg-red-100',    text: 'text-red-600'    },
  IR: { bg: 'bg-red-200',    text: 'text-red-800'    },
};

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#ffffff';
}

function deepClone(data: DepthChartData): DepthChartData {
  return {
    offense:      data.offense.map(p      => ({ ...p, players: p.players.map(pl => ({ ...pl })) })),
    defense:      data.defense.map(p      => ({ ...p, players: p.players.map(pl => ({ ...pl })) })),
    specialTeams: data.specialTeams.map(p => ({ ...p, players: p.players.map(pl => ({ ...pl })) })),
  };
}

function findPosition(data: DepthChartData, abbr: string): DepthChartPosition | null {
  for (const section of [data.offense, data.defense, data.specialTeams]) {
    const pos = section.find(p => p.abbreviation === abbr);
    if (pos) return pos;
  }
  return null;
}

const STORAGE_KEY = (slug: string) => `cfbhq-depth-chart-v1-${slug}`;

// ── PlayerCard ────────────────────────────────────────────────────────────────

function PlayerCard({ player, teamColor }: { player: DepthChartPlayer; teamColor: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const injuryStyle = player.injuryStatus ? INJURY_STYLES[player.injuryStatus] : null;
  const headshotUrl = `https://a.espncdn.com/i/headshots/college-football/players/full/${player.slug.replace('custom-', '')}.png`;
  const isCustom = player.isCustom || player.slug.startsWith('custom-');

  return (
    <div className="flex items-center gap-2 min-w-0">
      {!isCustom && !imgError ? (
        <Image
          src={headshotUrl}
          alt={player.name}
          width={32}
          height={32}
          className="rounded-full object-cover bg-gray-100 flex-shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: teamColor }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1 leading-tight">
          <span className="font-medium text-sm truncate" style={{ color: teamColor }}>
            {player.name}
          </span>
          {isCustom && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" title="Manually added" />
          )}
        </div>
        {injuryStyle && (
          <span className={`text-[11px] font-bold px-1 py-px rounded leading-tight ${injuryStyle.bg} ${injuryStyle.text}`}>
            {player.injuryStatus}
          </span>
        )}
      </div>
    </div>
  );
}

// ── DndCell ───────────────────────────────────────────────────────────────────

function DndCell({
  cellId, positionAbbr, depth, player, teamColor, activeId, selectedCellId,
  onCellClick, onRemovePlayer,
}: {
  cellId: string; positionAbbr: string; depth: number;
  player: DepthChartPlayer | undefined; teamColor: string;
  activeId: string | null; selectedCellId: string | null;
  onCellClick: (cellId: string, posAbbr: string, depth: number, hasPlayer: boolean) => void;
  onRemovePlayer?: (posAbbr: string, depth: number) => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging, transform } = useDraggable({ id: cellId, disabled: !player });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cellId });
  const setRef = useCallback((node: HTMLTableCellElement | null) => { setDragRef(node); setDropRef(node); }, [setDragRef, setDropRef]);

  const isSelf        = cellId === (activeId ?? selectedCellId);
  const isDragMode    = !!activeId;
  const isClickMode   = !!selectedCellId && !activeId;
  const isSelected    = selectedCellId === cellId && isClickMode;
  const activeSource  = activeId ?? selectedCellId;
  const isValidTarget = activeSource && !isSelf ? canSwapPositions(activeSource.split('__')[0], positionAbbr) : false;

  const cellStyle: React.CSSProperties = {};
  if (isDragging && transform) {
    Object.assign(cellStyle, { transform: `translate3d(${Math.round(transform.x)}px,${Math.round(transform.y)}px,0)`, zIndex: 9999, opacity: 0.95, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', background: 'white', borderRadius: 8, cursor: 'grabbing' });
  } else if (isSelected) {
    cellStyle.outline = `2px solid ${teamColor}`; cellStyle.outlineOffset = '-2px'; cellStyle.backgroundColor = `${teamColor}15`;
  } else if (isDragMode) {
    if (isOver && isValidTarget) { cellStyle.outline = `2px solid ${teamColor}`; cellStyle.outlineOffset = '-2px'; cellStyle.backgroundColor = `${teamColor}12`; }
    else if (isValidTarget) { cellStyle.backgroundColor = `${teamColor}08`; }
  } else if (isClickMode && isValidTarget) {
    cellStyle.outline = `2px dashed ${teamColor}`; cellStyle.outlineOffset = '-2px'; cellStyle.backgroundColor = `${teamColor}0A`;
  }

  let opacityClass = '';
  if      (isDragMode  && !isDragging  && !isValidTarget && !isSelf) opacityClass = 'opacity-40';
  else if (isClickMode && !isValidTarget && !isSelected)              opacityClass = 'opacity-40';

  return (
    <td ref={setRef} className={`p-2 transition-colors duration-100 ${opacityClass} ${player ? 'cursor-pointer' : ''}`} style={cellStyle}
        onClick={() => onCellClick(cellId, positionAbbr, depth, !!player)}>
      {player ? (
        <div className="flex items-center gap-1 group">
          <button className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-gray-300 hover:text-gray-500 transition-colors rounded hidden sm:flex"
                  {...listeners} {...attributes} tabIndex={-1} onClick={e => e.stopPropagation()} aria-label={`Drag ${player.name}`}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
              <circle cx="2.5" cy="2"  r="1.5"/><circle cx="7.5" cy="2"  r="1.5"/>
              <circle cx="2.5" cy="7"  r="1.5"/><circle cx="7.5" cy="7"  r="1.5"/>
              <circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/>
            </svg>
          </button>
          <button className="flex-shrink-0 touch-none sm:hidden p-1 -ml-1 text-gray-300 cursor-grab active:cursor-grabbing"
                  {...listeners} {...attributes} tabIndex={-1} onClick={e => e.stopPropagation()} aria-label={`Drag ${player.name}`}>
            <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor" aria-hidden>
              <rect x="0" y="0" width="12" height="1.5" rx="0.75"/><rect x="0" y="4" width="12" height="1.5" rx="0.75"/>
              <rect x="0" y="8" width="12" height="1.5" rx="0.75"/>
            </svg>
          </button>
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            <PlayerCard player={player} teamColor={teamColor} />
            {player.isCustom && onRemovePlayer && (
              <button className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                      onClick={e => { e.stopPropagation(); onRemovePlayer(positionAbbr, depth); }} tabIndex={-1} aria-label={`Remove ${player.name}`}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                  <path d="M2 2l8 8M10 2L2 10"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      ) : (
        <span className={`text-sm pl-1 transition-colors ${isClickMode && isValidTarget ? 'text-gray-400' : depth >= 4 ? 'text-gray-100' : 'text-gray-300'}`}>
          {isClickMode && isValidTarget ? '+ place here' : '—'}
        </span>
      )}
    </td>
  );
}

// ── Section table ─────────────────────────────────────────────────────────────

function SectionTable({ title, positions, editedPositions, teamColor, onSwap, onAddPlayer, onRemovePlayer }: {
  title: string; positions: DepthChartPosition[]; editedPositions: Set<string>; teamColor: string;
  onSwap: (fromPos: string, fromDepth: number, toPos: string, toDepth: number) => void;
  onAddPlayer: (posAbbr: string, name: string) => void;
  onRemovePlayer: (posAbbr: string, depth: number) => void;
}) {
  const [activeId,         setActiveId]         = useState<string | null>(null);
  const [selectedCellId,   setSelectedCellId]   = useState<string | null>(null);
  const [addingToPosition, setAddingToPosition] = useState<string | null>(null);
  const [newPlayerName,    setNewPlayerName]    = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const textColor = getContrastColor(teamColor);

  const maxDepth = Math.max(4, ...positions.flatMap(p => p.players.map(pl => pl.depth)));
  const depthRange = Array.from({ length: maxDepth }, (_, i) => i + 1);

  const selectedPlayer = selectedCellId
    ? (() => { const [posAbbr, d] = selectedCellId.split('__'); return positions.find(p => p.abbreviation === posAbbr)?.players.find(p => p.depth === parseInt(d)); })()
    : null;

  function handleDragStart({ active }: DragStartEvent) { setActiveId(active.id as string); setSelectedCellId(null); }
  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const [fromPos, fromD] = (active.id as string).split('__');
    const [toPos,   toD]   = (over.id   as string).split('__');
    if (canSwapPositions(fromPos, toPos)) onSwap(fromPos, parseInt(fromD), toPos, parseInt(toD));
  }
  function handleCellClick(cellId: string, posAbbr: string, depth: number, hasPlayer: boolean) {
    if (activeId) return;
    if (selectedCellId === cellId) { setSelectedCellId(null); return; }
    if (!selectedCellId) { if (hasPlayer) setSelectedCellId(cellId); return; }
    const [fromPos, fromD] = selectedCellId.split('__');
    if (canSwapPositions(fromPos, posAbbr)) { onSwap(fromPos, parseInt(fromD), posAbbr, depth); setSelectedCellId(null); }
    else { setSelectedCellId(hasPlayer ? cellId : null); }
  }

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
      <DndContext sensors={sensors} measuring={measuringConfig} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {selectedPlayer && (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 mb-2 border text-sm"
               style={{ backgroundColor: `${teamColor}10`, borderColor: `${teamColor}40` }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate" style={{ color: teamColor }}>{selectedPlayer.name}</span>
              <span className="text-gray-500 whitespace-nowrap">— tap a highlighted slot to place</span>
            </div>
            <button onClick={() => setSelectedCellId(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded" aria-label="Cancel">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden><path d="M2 2l10 10M12 2L2 12"/></svg>
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: teamColor, color: textColor }}>
                <th className="text-left py-2 px-2 sm:px-3 text-xs font-semibold w-16">Pos</th>
                {depthRange.map(d => (
                  <th key={d} className="text-left py-2 px-2 sm:px-3 text-xs font-semibold min-w-[200px]">{getDepthLabel(d)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((position, rowIndex) => (
                <Fragment key={position.abbreviation}>
                  <tr className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 font-medium text-gray-900 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1">
                        <span>{position.abbreviation}</span>
                        {editedPositions.has(position.abbreviation) && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} title="Edited" />
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setAddingToPosition(addingToPosition === position.abbreviation ? null : position.abbreviation); setNewPlayerName(''); }}
                          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-white transition-colors text-xs font-bold leading-none cursor-pointer"
                          style={addingToPosition === position.abbreviation ? { backgroundColor: teamColor, color: 'white' } : undefined}
                          title={`Add player to ${position.abbreviation}`} tabIndex={-1}
                        >+</button>
                      </div>
                    </td>
                    {depthRange.map(depth => (
                      <DndCell key={depth} cellId={`${position.abbreviation}__${depth}`} positionAbbr={position.abbreviation}
                               depth={depth} player={position.players.find(p => p.depth === depth)} teamColor={teamColor}
                               activeId={activeId} selectedCellId={selectedCellId}
                               onCellClick={handleCellClick} onRemovePlayer={onRemovePlayer} />
                    ))}
                  </tr>
                  {addingToPosition === position.abbreviation && (
                    <tr className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td colSpan={depthRange.length + 1} className="px-2 pb-2.5 pt-0">
                        <form onSubmit={e => { e.preventDefault(); const name = newPlayerName.trim(); if (!name) return; onAddPlayer(position.abbreviation, name); setAddingToPosition(null); setNewPlayerName(''); }} className="flex items-center gap-2 pl-0.5">
                          <input autoFocus type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)}
                                 placeholder={`Add player to ${position.abbreviation}...`}
                                 className="flex-1 max-w-xs text-sm px-2.5 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                                 onKeyDown={e => { if (e.key === 'Escape') { setAddingToPosition(null); setNewPlayerName(''); } }} />
                          <button type="submit" disabled={!newPlayerName.trim()} className="px-3 py-1 text-xs font-semibold rounded-md text-white transition-opacity disabled:opacity-40" style={{ backgroundColor: teamColor }}>Add</button>
                          <button type="button" onClick={() => { setAddingToPosition(null); setNewPlayerName(''); }} className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">Cancel</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </DndContext>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DepthChartTabProps {
  team: Team;
  teamColor: string;
}

export default function DepthChartTab({ team, teamColor }: DepthChartTabProps) {
  const { data, error, isLoading, mutate } = useSWR<DepthChartResponse>(
    `/cfb-hq/api/cfb/teams/depth-chart/${team.slug}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 }
  );

  const [localData,       setLocalData]       = useState<DepthChartData | null>(null);
  const [editedPositions, setEditedPositions] = useState<Set<string>>(new Set());
  const isDirty = editedPositions.size > 0;

  useEffect(() => {
    if (!data?.positions) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(team.slug));
      if (saved) {
        const { editedData, edited } = JSON.parse(saved);
        setLocalData(editedData);
        setEditedPositions(new Set(edited as string[]));
        return;
      }
    } catch {}
    setLocalData(deepClone(data.positions));
    setEditedPositions(new Set());
  }, [data, team.slug]);

  useEffect(() => {
    if (!localData || !isDirty) return;
    try { localStorage.setItem(STORAGE_KEY(team.slug), JSON.stringify({ editedData: localData, edited: [...editedPositions] })); } catch {}
  }, [localData, editedPositions, isDirty, team.slug]);

  function handleSwap(fromPos: string, fromDepth: number, toPos: string, toDepth: number) {
    setLocalData(prev => {
      if (!prev) return prev;
      const next = deepClone(prev);
      const fromPosition = findPosition(next, fromPos);
      const toPosition   = findPosition(next, toPos);
      if (!fromPosition || !toPosition) return prev;
      const fromPlayer = fromPosition.players.find(p => p.depth === fromDepth);
      const toPlayer   = toPosition.players.find(p => p.depth === toDepth);
      if (!fromPlayer) return prev;
      if (fromPos === toPos) {
        fromPlayer.depth = toDepth;
        if (toPlayer) toPlayer.depth = fromDepth;
      } else {
        fromPosition.players = fromPosition.players.filter(p => p.depth !== fromDepth);
        toPosition.players   = toPosition.players.filter(p => p.depth !== toDepth);
        if (toPlayer) { toPlayer.depth = fromDepth; fromPosition.players.push(toPlayer); }
        fromPlayer.depth = toDepth;
        toPosition.players.push(fromPlayer);
      }
      return next;
    });
    setEditedPositions(prev => new Set([...prev, fromPos, toPos]));
  }

  function handleReset() {
    if (!data?.positions) return;
    try { localStorage.removeItem(STORAGE_KEY(team.slug)); } catch {}
    setLocalData(deepClone(data.positions));
    setEditedPositions(new Set());
  }

  function handleAddPlayer(posAbbr: string, name: string) {
    setLocalData(prev => {
      if (!prev) return prev;
      const next = deepClone(prev);
      const position = findPosition(next, posAbbr);
      if (!position) return prev;
      const usedDepths = new Set(position.players.map(p => p.depth));
      let targetDepth = 1;
      while (usedDepths.has(targetDepth)) targetDepth++;
      const normalized = name.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      position.players.push({ name: normalized, slug: `custom-${normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, depth: targetDepth, isCustom: true });
      return next;
    });
    setEditedPositions(prev => new Set([...prev, posAbbr]));
  }

  function handleRemovePlayer(posAbbr: string, depth: number) {
    if (!localData) return;
    const next = deepClone(localData);
    const position = findPosition(next, posAbbr);
    if (!position) return;
    position.players = position.players.filter(p => p.depth !== depth);
    position.players.sort((a, b) => a.depth - b.depth);
    position.players.forEach((p, i) => { p.depth = i + 1; });
    setLocalData(next);
    setEditedPositions(prev => new Set([...prev, posAbbr]));
  }

  const header = isDirty || data?.season ? (
    <div className="flex items-center justify-end gap-3 mb-5">
      {isDirty && (
        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4.582 14.993A8 8 0 0020 12M19.418 9A8 8 0 004 12"/>
          </svg>
          Reset
        </button>
      )}
      {data?.season && <span className="text-sm text-gray-500">{data.season} Season</span>}
    </div>
  ) : null;

  if (isLoading) return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6" style={{ minHeight: 600 }}>
      <div className="flex justify-center py-16"><LoadingSpinner /></div>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6" style={{ minHeight: 600 }}>
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Failed to load depth chart</p>
        <button onClick={() => mutate()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors cursor-pointer">Try Again</button>
      </div>
    </div>
  );

  if (!localData || (!localData.offense.length && !localData.defense.length && !localData.specialTeams.length)) return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg font-medium mb-1">Depth chart not available</p>
        <p className="text-gray-400 text-sm">A depth chart for {team.name} hasn&apos;t been published yet. Check back closer to the season.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6" style={{ minHeight: 600 }}>
      {header}

      <div className={`mb-5 rounded-lg px-4 py-2.5 flex items-start gap-2.5 text-sm ${isDirty ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
        {isDirty
          ? 'Custom depth chart active — drag or tap to reorder, + to add players, × to remove added players. Positions with a dot have been edited. Saved in your browser.'
          : 'Tap any player to select them, then tap a slot to move them. On desktop, drag the ⠿ handles. Use + next to any position to add players.'}
      </div>

      {Object.values(INJURY_STYLES).some(() => true) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Injury:</span>
          <span className="text-yellow-700 font-semibold">Q = Questionable</span>
          <span className="text-red-600 font-semibold">O = Out</span>
          <span className="text-red-800 font-semibold">IR = Injured Reserve</span>
        </div>
      )}

      {localData.offense.length > 0 && (
        <SectionTable title="Offense" positions={localData.offense} editedPositions={editedPositions}
                      teamColor={teamColor} onSwap={handleSwap} onAddPlayer={handleAddPlayer} onRemovePlayer={handleRemovePlayer} />
      )}
      {localData.defense.length > 0 && (
        <SectionTable title="Defense" positions={localData.defense} editedPositions={editedPositions}
                      teamColor={teamColor} onSwap={handleSwap} onAddPlayer={handleAddPlayer} onRemovePlayer={handleRemovePlayer} />
      )}
      {localData.specialTeams.length > 0 && (
        <SectionTable title="Special Teams" positions={localData.specialTeams} editedPositions={editedPositions}
                      teamColor={teamColor} onSwap={handleSwap} onAddPlayer={handleAddPlayer} onRemovePlayer={handleRemovePlayer} />
      )}

      <p className="text-xs text-gray-400 text-right mt-2">
        {data?.source === 'cfbd'
          ? `Showing final ${data.season} depth chart · Will update when ESPN publishes ${data.season + 1} data`
          : 'Source: ESPN · Updates when ESPN publishes'}
      </p>
    </div>
  );
}
