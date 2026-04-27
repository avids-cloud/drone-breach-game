'use client';
import { useRef, useEffect } from 'react';
import type { EventEntry } from '@/lib/types';

interface Props {
  events: EventEntry[];
}

export default function EventLog({ events }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events]);

  return (
    <div className="panel-default scanlines relative p-3 flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="hud-corner hud-tl glow-grey" />
      <div className="hud-corner hud-tr glow-grey" />
      <div className="hud-corner hud-bl glow-grey" />
      <div className="hud-corner hud-br glow-grey" />

      <div className="text-[10px] uppercase tracking-widest glow-grey mb-1.5">// console</div>

      <div ref={ref} className="feed flex-1 overflow-y-auto space-y-0.5 pr-1" style={{ minHeight: 0 }}>
        {events.map((e) => (
          <div
            key={e.t}
            className={`crt-mono text-[10px] leading-relaxed ${
              e.kind === 'success' ? 'glow-green' :
              e.kind === 'fail'    ? 'glow-red'   :
              e.kind === 'info'    ? 'glow-blue'  :
              'glow-grey'
            }`}
          >
            <span className="text-gray-600">[{String(e.t).padStart(2, '0')}] </span>
            {e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
