// ── page.tsx changes — Redesigned by Claude Design (April 2026) ───────
//
// This file shows ONLY the parts of page.tsx that need to change.
// Everything else stays the same as the original.
//
// ── CHANGE 1: Import useRef, useEffect for glitch system ─────────────
//
//   import { useState, useCallback, useRef, useEffect } from 'react';
//
// ── CHANGE 2: Add glitch state inside DroneBreach() ──────────────────

  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleGlitch() {
      const wait = 3500 + Math.random() * 7000;
      timeoutId = setTimeout(() => {
        setGlitching(true);
        setTimeout(() => { setGlitching(false); scheduleGlitch(); }, 520);
      }, wait);
    }
    scheduleGlitch();
    return () => clearTimeout(timeoutId);
  }, []);

// ── CHANGE 3: Root wrapper — add glitch class + position relative ─────
//
// BEFORE:
//   <div className="min-h-screen w-full bg-black flicker p-3 crt-mono"
//     style={{ background: 'radial-gradient(ellipse at center, #050810 0%, #000000 100%)' }}>
//
// AFTER:
//
//   <div
//     className={`min-h-screen w-full flicker p-3 crt-mono${glitching ? ' glitching' : ''}`}
//     style={{ background: '#070608', position: 'relative' }}
//   >

// ── CHANGE 4: Add grit layers inside root wrapper (after opening tag) ─

    {/* Grain — always on */}
    <div style={{
      position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E")`,
      opacity: 0.038, mixBlendMode: 'overlay' as const,
    }} />

    {/* Global scanlines */}
    <div style={{
      position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none',
      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.16) 2px, rgba(0,0,0,0.16) 3px)',
    }} />

    {/* Phosphor burn bands */}
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
      animation: 'burn-drift 14s ease-in-out infinite',
      background: `linear-gradient(180deg,
        transparent 0%,
        rgba(200,176,64,0.018) 22%, transparent 26%,
        rgba(58,184,216,0.012) 51%, transparent 55%,
        rgba(200,176,64,0.014) 78%, transparent 82%
      )`,
    }} />

    {/* Glitch slices — fire when glitching */}
    <div className={glitching ? 'glitch-slice-1' : ''} style={{
      position: 'absolute', inset: 0, zIndex: 53, pointerEvents: 'none',
      background: '#070608', opacity: 0,
    }} />
    <div className={glitching ? 'glitch-slice-2' : ''} style={{
      position: 'absolute', inset: 0, zIndex: 53, pointerEvents: 'none',
      background: '#070608', opacity: 0,
    }} />

    {/* Noise flash */}
    <div className={glitching ? 'noise-flash' : ''} style={{
      position: 'absolute', inset: 0, zIndex: 54, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
      opacity: 0,
    }} />

    {/* Line dropout */}
    <div className={glitching ? 'line-drop' : ''} style={{
      position: 'absolute', left: 0, right: 0, zIndex: 52, pointerEvents: 'none',
      background: 'rgba(200,176,64,0.4)', height: 1, opacity: 0,
    }} />

    {/* Vignette */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
      background: 'radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.32) 100%)',
    }} />

// ── CHANGE 5: Wrap all content in a z-index:3 div ─────────────────────
//
//   Wrap the header + main grid in:
//   <div style={{ position: 'relative', zIndex: 3, display: 'flex',
//     flexDirection: 'column', flex: 1, gap: 8, minHeight: 0 }}>
//     ...header...
//     ...main grid...
//   </div>

// ── CHANGE 6: Add glitch-rgb to title ─────────────────────────────────
//
// BEFORE:
//   <div className="crt-display text-3xl glow-amber">DRONE: BREACH</div>
//
// AFTER:
//   <div className={`crt-display text-3xl glow-amber${glitching ? ' glitch-rgb' : ''}`}>
//     DRONE: BREACH
//   </div>

// ── CHANGE 7: Dialogue panel grid — Mother dominant ───────────────────
//
// BEFORE:
//   <div className="grid grid-rows-2 gap-2" style={{ minHeight: 0 }}>
//
// AFTER:
//   <div className="grid gap-2" style={{ gridTemplateRows: '3fr 2fr', minHeight: 0 }}>

// ── CHANGE 8: Update colour references across components ──────────────
//
// In all components, the following class/colour substitutions apply:
//   glow-amber → glow-amber  (now maps to --color-primary: #c8b040)
//   glow-blue  → glow-blue   (now maps to --color-mother:  #3ab8d8)
//   glow-green → glow-green  (now maps to --color-resistance: #92b822)
//   #ffb347    → #92b822     (resistance text)
//   #5cd9ff    → #3ab8d8     (mother text)
//   text-gray-500 / text-gray-600 → replace with style={{ color: '#756a42' }}
