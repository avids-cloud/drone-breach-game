'use client';
// ── DialoguePanel.tsx — Redesigned by Claude Design (April 2026) ──────
// Changes from original:
//   - Mother panel: dominant presence (use with grid-rows-[3fr_2fr] in parent)
//   - Mother: stronger border glow, HUD corners, separator line, larger text (text-xs → text-[11px])
//   - Mother header: "MOTHER · CORE VOICE" + "[ ACTIVE · MONITORING ]" sublabel
//   - Resistance: dashed border class (panel-resistance updated in globals.css)
//   - Resistance header: "RESISTANCE · LINK ε-7" + "[ CHANNEL: DEGRADED ]" sublabel
//   - Resistance: smaller status dot, dimmer text (80% opacity), "SIG" indicator
// ──────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import type { DialogueLine, Speaker } from '@/lib/types';

interface Props {
  speaker: Speaker;
  lines: DialogueLine[];
  busy: boolean;
}

const THEME = {
  MOTHER: {
    panelClass: 'panel-mother scanlines',
    color: '#3ab8d8',           // steel blue (was cyan #5cd9ff)
    glowClass: 'glow-blue',
    busyMsg: '[ MOTHER · calculating ]',
    dominant: true,
  },
  RESISTANCE: {
    panelClass: 'panel-resistance',
    color: '#92b822',           // dirty olive (was amber #ffb347)
    glowClass: 'glow-green',
    busyMsg: '[ RESISTANCE · responding ]',
    dominant: false,
  },
};

export default function DialoguePanel({ speaker, lines, busy }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const t = THEME[speaker];
  const isMother = speaker === 'MOTHER';

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines, busy]);

  const mine = lines.filter(l => l.speaker === speaker);

  return (
    <div
      className={`${t.panelClass} relative p-3 flex flex-col`}
      style={{ minHeight: 0 }}
    >
      {/* HUD corners — Mother only */}
      {isMother && (
        <>
          <div className="hud-corner hud-tl" style={{ color: t.color }} />
          <div className="hud-corner hud-tr" style={{ color: t.color }} />
          <div className="hud-corner hud-bl" style={{ color: t.color }} />
          <div className="hud-corner hud-br" style={{ color: t.color }} />
        </>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <div
            className="crt-mono uppercase tracking-widest"
            style={{ fontSize: isMother ? 10 : 8, color: t.color, opacity: isMother ? 1 : 0.7 }}
          >
            {isMother ? 'MOTHER · CORE VOICE' : 'RESISTANCE · LINK ε-7'}
          </div>
          <div
            className="crt-mono uppercase tracking-widest"
            style={{ fontSize: 7, color: t.color, opacity: isMother ? 0.5 : 0.4 }}
          >
            {isMother ? '[ ACTIVE · MONITORING ]' : '[ CHANNEL: DEGRADED ]'}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {!isMother && (
            <span className="crt-mono uppercase" style={{ fontSize: 7, color: t.color, opacity: 0.6 }}>
              SIG
            </span>
          )}
          <div
            className="rounded-full blink"
            style={{
              width: isMother ? 7 : 5,
              height: isMother ? 7 : 5,
              background: t.color,
              opacity: isMother ? 0.9 : 0.55,
              boxShadow: isMother ? `0 0 8px ${t.color}` : 'none',
            }}
          />
        </div>
      </div>

      {/* Mother separator line */}
      {isMother && (
        <div
          className="flex-shrink-0 mb-2"
          style={{
            height: 1,
            background: `linear-gradient(90deg, ${t.color}70, transparent)`,
          }}
        />
      )}

      {/* Dialogue feed */}
      <div
        ref={ref}
        className="feed flex-1 overflow-y-auto space-y-2 pr-1"
        style={{ minHeight: 0 }}
      >
        {mine.length === 0 && !busy && (
          <div className="crt-mono italic" style={{ fontSize: 9, color: '#756a42' }}>
            [ no transmission ]
          </div>
        )}

        {mine.map((line, i) => (
          <div
            key={i}
            className="crt-mono leading-relaxed"
            style={{
              fontSize: isMother ? 11 : 10,
              lineHeight: isMother ? 1.7 : 1.55,
              color: t.color,
              opacity: isMother ? 1 : 0.8,
            }}
          >
            {line.isConsult && (
              <div
                className="uppercase tracking-widest mb-0.5"
                style={{ fontSize: 8, color: t.color, opacity: 0.7 }}
              >
                [ CONSULT · deep buffer ]
              </div>
            )}
            <span
              className={`${t.glowClass} uppercase tracking-widest mr-1.5`}
              style={{ fontSize: 8, opacity: isMother ? 0.55 : 0.45 }}
            >
              [{speaker}]
            </span>
            {line.text}
          </div>
        ))}

        {busy && (
          <div
            className="crt-mono typewriter"
            style={{ fontSize: 9, color: '#756a42' }}
          >
            {t.busyMsg}
          </div>
        )}
      </div>
    </div>
  );
}
