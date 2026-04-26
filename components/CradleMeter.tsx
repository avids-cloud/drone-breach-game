'use client';

interface Props {
  integrity: number;
}

export default function CradleMeter({ integrity }: Props) {
  const pct = Math.min(100, integrity);
  const color = integrity > 60 ? '#ffb347' : integrity > 25 ? '#ff8c42' : '#ff5566';

  return (
    <div className="flex items-center gap-3 crt-mono text-xs">
      <span className="glow-grey uppercase tracking-widest">CRADLE</span>
      <div
        className="relative h-3 bg-black/60 border"
        style={{ width: '10rem', borderColor: color, boxShadow: `0 0 6px ${color}40` }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="crt-display text-lg" style={{ color }}>
        {String(integrity).padStart(3, '0')}/100
      </span>
      <span className="text-[10px] uppercase tracking-widest" style={{ color }}>
        · {integrity > 60 ? 'stable' : integrity > 25 ? 'degraded' : 'critical'}
      </span>
    </div>
  );
}
