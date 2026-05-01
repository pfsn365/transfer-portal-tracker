'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow, Background, Controls,
  Handle, Position, useNodesState, useEdgesState, useReactFlow,
  type NodeProps, type Node, type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { coaches, getCoachRecord, getCoachTitles, type Coach } from '@/data/coaching/coaches';

// ─── Node data ────────────────────────────────────────────────────────────────

interface CoachNodeData extends Record<string, unknown> {
  coach: Coach;
  isTarget: boolean;
  onNavigate: (id: string) => void;
  stintLabel?: string; // role context relative to the target coach
}

function abbreviateRole(role: string) {
  return role
    .replace('Offensive Coordinator', 'OC')
    .replace('Defensive Coordinator', 'DC')
    .replace('Offensive Line Coach', 'OL Coach')
    .replace('Defensive Backs Coach', 'DB Coach')
    .replace('Wide Receivers Coach', 'WR Coach')
    .replace('Running Backs Coach', 'RB Coach')
    .replace('Quarterbacks Coach', 'QB Coach')
    .replace('QB Coach', 'QB Coach')
    .replace('Safeties Coach', 'S Coach')
    .replace('Graduate Assistant', 'GA')
    .replace('Assistant Coach', 'Asst.');
}

// ─── Custom node ──────────────────────────────────────────────────────────────

function CoachNode({ data }: NodeProps) {
  const d = data as CoachNodeData;
  const { coach, isTarget, onNavigate, stintLabel } = d;
  const record = getCoachRecord(coach);
  const titles = getCoachTitles(coach);
  const pct = record.wins + record.losses > 0
    ? ((record.wins / (record.wins + record.losses)) * 100).toFixed(1)
    : '—';
  const lastSchool = coach.hcCareer.at(-1)?.school ?? '';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2 !border-0" />
      <div
        onClick={() => !isTarget && onNavigate(coach.id)}
        className={[
          'rounded-xl border-2 bg-white shadow-md transition-all select-none',
          isTarget
            ? 'border-[#0050A0] shadow-[#0050A0]/20 shadow-lg cursor-default w-[220px]'
            : 'border-gray-200 hover:border-[#0050A0] hover:shadow-lg cursor-pointer w-[200px]',
        ].join(' ')}
        style={{ padding: isTarget ? '12px 14px' : '10px 12px' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
            style={{
              width: isTarget ? 36 : 30,
              height: isTarget ? 36 : 30,
              background: isTarget ? '#0050A0' : '#64748b',
            }}
          >
            {coach.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className={`font-bold truncate leading-tight ${isTarget ? 'text-[#0050A0] text-sm' : 'text-gray-800 text-xs'}`}>
              {coach.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {coach.active ? `${coach.currentSchool} ✦` : lastSchool}
            </p>
          </div>
        </div>
        {stintLabel && (
          <p className="mt-1.5 text-[10px] font-medium text-[#0050A0] truncate">{stintLabel}</p>
        )}
        <div className={`mt-1.5 flex items-center gap-2 ${isTarget ? 'text-xs' : 'text-[11px]'} text-gray-600`}>
          <span className="font-semibold text-gray-800">{record.wins}–{record.losses}</span>
          <span className="text-gray-300">·</span>
          <span>{pct}%</span>
          {titles.length > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-yellow-600 font-bold">🏆{titles.length}</span>
            </>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2 !border-0" />
    </>
  );
}

const nodeTypes = { coachNode: CoachNode };

function FitViewOnInit() {
  const { fitView } = useReactFlow();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    setTimeout(() => fitView({ padding: 0.2, maxZoom: 0.9, duration: 300 }), 50);
  }, [fitView]);
  return null;
}

// ─── Layout algorithm ─────────────────────────────────────────────────────────

const NODE_W = 210;
const NODE_H = 115;
const H_GAP = 50;
const V_GAP = 80;

function buildLayout(targetId: string, onNavigate: (id: string) => void) {
  const coachMap = new Map(coaches.map(c => [c.id, c]));

  // Build mentee map (coachId → list of coaches mentored by them)
  const menteeMap = new Map<string, string[]>();
  for (const c of coaches) {
    for (const m of c.mentors) {
      if (!menteeMap.has(m.coachId)) menteeMap.set(m.coachId, []);
      menteeMap.get(m.coachId)!.push(c.id);
    }
  }

  // Collect visible node IDs and their levels (target = 0, ancestors < 0, descendants > 0)
  const levels = new Map<string, number>();
  levels.set(targetId, 0);

  // Walk ancestors up (max 4 levels)
  const walkUp = (id: string, level: number) => {
    if (level < -4) return;
    const c = coachMap.get(id);
    if (!c) return;
    for (const m of c.mentors) {
      const existingLevel = levels.get(m.coachId);
      if (existingLevel === undefined || existingLevel > level - 1) {
        levels.set(m.coachId, level - 1);
        walkUp(m.coachId, level - 1);
      }
    }
  };
  walkUp(targetId, 0);

  // Walk descendants down (max 3 levels)
  const walkDown = (id: string, level: number) => {
    if (level > 3) return;
    for (const menteeId of menteeMap.get(id) ?? []) {
      if (menteeId === targetId) continue;
      const existingLevel = levels.get(menteeId);
      if (existingLevel === undefined || existingLevel < level + 1) {
        levels.set(menteeId, level + 1);
        walkDown(menteeId, level + 1);
      }
    }
  };
  walkDown(targetId, 0);

  // Group IDs by level
  const byLevel = new Map<number, string[]>();
  for (const [id, lvl] of levels) {
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(id);
  }

  // Assign (x, y) positions
  const positions = new Map<string, { x: number; y: number }>();
  for (const [lvl, ids] of byLevel) {
    const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP;
    const startX = -totalW / 2;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: startX + i * (NODE_W + H_GAP),
        y: lvl * (NODE_H + V_GAP),
      });
    });
  }

  // Compute stintLabels for direct connections to/from target
  const stintLabels = new Map<string, string>();
  const targetCoach = coachMap.get(targetId);
  if (targetCoach) {
    // Nodes that MENTORED the target: show what role target had under them
    for (const m of targetCoach.mentors) {
      if (levels.has(m.coachId)) {
        stintLabels.set(m.coachId, `${abbreviateRole(m.role)} · ${m.school} · ${m.startYear}–${m.endYear}`);
      }
    }
    // Nodes that the target MENTORED: show role they had under target
    for (const c of coaches) {
      if (c.id === targetId) continue;
      const stint = c.mentors.find(m => m.coachId === targetId);
      if (stint && levels.has(c.id)) {
        stintLabels.set(c.id, `${abbreviateRole(stint.role)} · ${stint.school} · ${stint.startYear}–${stint.endYear}`);
      }
    }
  }

  // Build React Flow nodes
  const nodes: Node[] = [];
  for (const [id, pos] of positions) {
    const coach = coachMap.get(id);
    if (!coach) continue;
    nodes.push({
      id,
      type: 'coachNode',
      position: pos,
      data: { coach, isTarget: id === targetId, onNavigate, stintLabel: stintLabels.get(id) } as CoachNodeData,
    });
  }

  // Build React Flow edges (no labels — role info lives in the nodes)
  const edges: Edge[] = [];
  for (const [id] of levels) {
    const coach = coachMap.get(id);
    if (!coach) continue;
    for (const m of coach.mentors) {
      if (!levels.has(m.coachId)) continue;
      const isDirect = id === targetId || m.coachId === targetId;
      edges.push({
        id: `${m.coachId}->${id}`,
        source: m.coachId,
        target: id,
        style: { stroke: isDirect ? '#0050A0' : '#d1d5db', strokeWidth: isDirect ? 2 : 1.5 },
        animated: isDirect,
      });
    }
  }

  return { nodes, edges };
}

// ─── Flow component ───────────────────────────────────────────────────────────

export default function CoachingTreeFlow({ targetId, onNavigate }: { targetId: string; onNavigate: (id: string) => void }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildLayout(targetId, onNavigate),
    [targetId, onNavigate]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: 600 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <FitViewOnInit />
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls showInteractive={false} className="!shadow-md !rounded-lg !border-gray-200" />
      </ReactFlow>
    </div>
  );
}
