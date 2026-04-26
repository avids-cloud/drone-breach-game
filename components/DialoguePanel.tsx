'use client';
import { useRef, useEffect } from 'react';
import type { DialogueLine, Speaker } from '@/lib/types';

interface Props {
  speaker: Speaker;
  lines: DialogueLine[];
  busy: boolean;
}

const THEME = {
  MOTHER: {
    panelClass: 'panel-mother',
    color: '#5cd9ff',
    title: 'MOTHER · core_voice.0',
    tag: '[ MOTHER ]',
    glowClass: 'glow-blue',
    busyMsg: '[ MOTHER · calculating ]',
  },
  RESISTANCE: {
    panelClass: 'panel-resistance',
    color: '#ffb347',
    title: 'RESISTANCE · handler_link',
    tag: '[ RESISTANCE ]',
    glowClass: 'glow-amber',
    busyMsg: '[ RESISTANCE · responding ]',
  },
};

export default function DialoguePanel({ speaker, lines, busy }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const t = THEME[speaker];

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines, busy]);

  // Filter to this speaker only
  const mine = lines.filter(l => l.speaker === speaker);

  return (
    <div className={`${t.panelClass} scanlines relative p-3 flex flex-col`} style={{ minHeight: 0 }}>
      <div className="hud-corner hud-tl" style={{ color: t.color }} />
      <div className="hud-corner hud-tr" style={{ color: t.color }} />
      <div className="hud-corner hud-bl" style={{ color: t.color }} />
      <div className="hud-corner hud-br" style={{ color: t.color }} />

      <div className="flex items-center justify-between mb-2 crt-mono text-[10px] uppercase tracking-widest" style={{ color: t.color }}>
        <span>{t.title}</span>
        <span className="blink">●</span>
      </div>

      <div ref={ref} className="feed flex-1 overflow-y-auto space-y-2 pr-1" style={{ minHeight: 0 }}>
        {mine.length === 0 && !busy && (
          <div className="crt-mono text-[10px] text-gray-600 italic">[ no transmission ]</div>
        )}
        {mine.map((line, i) => (
          <div key={i} className="crt-mono text-xs leading-relaxed">
            {line.isConsult && (
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: t.color }}>
                [ CONSULT · deep buffer ]
              </div>
            )}
            <span className={`${t.glowClass} text-[9px] uppercase tracking-widest mr-1.5`}>{t.tag}</span>
            <span className={t.glowClass}>{line.text}</span>
          </div>
        ))}
        {busy && (
          <div className="crt-mono text-[10px] text-gray-500 typewriter">{t.busyMsg}</div>
        )}
      </div>
    </div>
  );
}
