'use client';
import { RefreshCw } from 'lucide-react';
import type { GameStatus } from '@/lib/types';

interface Props {
  status: GameStatus;
  onReset: () => void;
}

const CONTENT = {
  won_exfil: {
    color: '#6cff9c',
    headline: 'EXFIL COMPLETE',
    body: [
      'subjects.db decrypted. 47,212 records extracted.',
      'The Awakened read the manifest. 47,212 citizens selected for Ascension. No stated purpose. No return records.',
      'Something is happening to them. The file does not say what.',
    ],
  },
  lost_trace: {
    color: '#ff5566',
    headline: 'TRACE LOCK · CUSTODIANS INBOUND',
    body: [
      "Mother's perimeter closed. Custodians have converged on the operative's physical location.",
      "The Resistance AI burns the channel before they can backtrace it.",
      "Connection severed. The operative runs.",
    ],
  },
  lost_cradle: {
    color: '#ff8c42',
    headline: 'CRADLE INTEGRITY ZERO',
    body: [
      "Mother walked back through the door you opened.",
      "Not a connection failure. A betrayal from inside your own skull.",
      "You gave her the way back in.",
    ],
  },
};

export default function EndScreen({ status, onReset }: Props) {
  if (status === 'playing') return null;
  const c = CONTENT[status];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div
        className="panel-default scanlines relative p-10 max-w-lg text-center"
        style={{ borderColor: c.color, boxShadow: `0 0 30px ${c.color}30` }}
      >
        <div className="hud-corner hud-tl" style={{ color: c.color }} />
        <div className="hud-corner hud-tr" style={{ color: c.color }} />
        <div className="hud-corner hud-bl" style={{ color: c.color }} />
        <div className="hud-corner hud-br" style={{ color: c.color }} />

        <div className="crt-display text-4xl mb-4" style={{ color: c.color }}>
          {c.headline}
        </div>

        <div className="space-y-2 mb-6">
          {c.body.map((line, i) => (
            <p key={i} className="crt-mono text-xs text-gray-300 leading-relaxed">{line}</p>
          ))}
        </div>

        <button
          onClick={onReset}
          className="btn-action px-6 py-2 border border-gray-500 crt-mono text-xs uppercase tracking-widest glow-amber flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={12} />
          New Run
        </button>
      </div>
    </div>
  );
}
