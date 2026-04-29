'use client';
import { Eye, Zap, Radio, Download, BookOpen } from 'lucide-react';
import type { Host, GameState, PlayerActionType } from '@/lib/types';
import { CVE_BREACH_COST } from '@/lib/constants';
import { canPerformAction } from '@/lib/gameState';

interface ActionDef {
  key: PlayerActionType;
  label: string;
  icon: React.ElementType;
  traceCost: (host: Host | null) => string;
  desc: string;
}

const ACTIONS: ActionDef[] = [
  {
    key: 'SCAN',
    label: 'SCAN',
    icon: Eye,
    traceCost: () => '+5',
    desc: 'Reveals services and CVE tier. Transition: visible → scanned.',
  },
  {
    key: 'BREACH',
    label: 'BREACH',
    icon: Zap,
    traceCost: (h) => {
      if (!h || (h.state !== 'scanned' && h.state !== 'user')) return '+??';
      const base = CVE_BREACH_COST[h.cve.strength];
      return `+${base}`;
    },
    desc: 'Gain / deepen access. Always succeeds. Trace cost is the risk.',
  },
  {
    key: 'SPOOF',
    label: 'SPOOF',
    icon: Radio,
    traceCost: () => '-10',
    desc: 'Plant false trail. Reduces trace by 10. Once per run per host.',
  },
  {
    key: 'EXFIL',
    label: 'EXFIL',
    icon: Download,
    traceCost: () => '+30',
    desc: 'Extract subjects.db. Ends the run. WIN.',
  },
  {
    key: 'CONSULT',
    label: 'CONSULT',
    icon: BookOpen,
    traceCost: () => '+10',
    desc: 'One per run. Resistance AI reads Mother\'s next move from deep buffer.',
  },
];

interface Props {
  selectedHost: Host | null;
  gameState: GameState;
  onAction: (action: PlayerActionType) => void;
  busy: boolean;
}

export default function ActionPanel({ selectedHost, gameState, onAction, busy }: Props) {
  const isPlaying = gameState.status === 'playing';

  return (
    <div className="panel-default scanlines relative p-3 crt-mono text-xs">
      <div className="hud-corner hud-tl glow-grey" />
      <div className="hud-corner hud-tr glow-grey" />
      <div className="hud-corner hud-bl glow-grey" />
      <div className="hud-corner hud-br glow-grey" />

      <div className="text-[10px] uppercase tracking-widest glow-grey mb-2">Operator Actions</div>

      <div className="space-y-1">
        {ACTIONS.map(({ key, label, icon: Icon, traceCost, desc }) => {
          const valid = canPerformAction(gameState, selectedHost, key);
          const disabled = !valid || busy || !isPlaying;
          const cost = traceCost(selectedHost);
          const isNegative = cost.startsWith('-');

          return (
            <button
              key={key}
              onClick={() => !disabled && onAction(key)}
              disabled={disabled}
              className="btn-action w-full flex items-center gap-2 px-2.5 py-2 border border-gray-700 bg-black/30 text-left"
            >
              <Icon size={13} className="glow-amber flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="crt-display text-base glow-amber">{label}</span>
                  <span
                    className="text-[9px] font-mono flex-shrink-0"
                    style={{ color: isNegative ? '#6cff9c' : '#ff8c42' }}
                  >
                    {cost} trace
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 leading-tight truncate">{desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedHost && (
        <div className="mt-2 pt-2 border-t border-gray-800 text-[9px] text-gray-600 uppercase tracking-wider">
          selected: {selectedHost.short} · {selectedHost.state}
        </div>
      )}
    </div>
  );
}
