'use client';
import { traceTier, traceTierLabel } from '@/lib/gameState';

interface Props {
  trace: number;
}

export default function TraceMeter({ trace }: Props) {
  const pct = Math.min(100, trace);
  const tier = traceTier(trace);
  const color = tier === 'low' ? '#6cff9c' : tier === 'medium' ? '#ffb347' : '#ff5566';
  const label = traceTierLabel(trace);

  return (
    <div className="flex items-center gap-3 crt-mono text-xs">
      <span className="glow-grey uppercase tracking-widest">TRACE</span>
      <div
        className="relative h-3 bg-black/60 border"
        style={{ width: '10rem', borderColor: color, boxShadow: `0 0 6px ${color}40` }}
      >
        <div
          className="h-full transition-all duration-500 pulse-glow"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="crt-display text-lg" style={{ color }}>
        {String(trace).padStart(3, '0')}/100
      </span>
      <span className="text-[10px] uppercase tracking-widest" style={{ color }}>
        · {label}
      </span>
    </div>
  );
}
