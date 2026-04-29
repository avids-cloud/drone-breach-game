'use client';
import { Shield, Server, Database, Lock, Wifi, Activity, Skull } from 'lucide-react';
import type { Host, Token } from '@/lib/types';
import { HOST_IDS } from '@/lib/constants';

interface Props {
  host: Host;
  isSelected: boolean;
  onClick: () => void;
  tokens: Token[];
}

const STATE_COLOR: Record<string, string> = {
  hidden:  '#3a3f4a',
  visible: '#b0b8c4',
  scanned: '#5cd9ff',
  user:    '#ffb347',
  root:    '#6cff9c',
};

function HostIcon({ id }: { id: string }) {
  if (id === HOST_IDS.MOTHER_CORE)        return <Skull size={13} />;
  if (id === HOST_IDS.MEMORY_VAULT)       return <Database size={13} />;
  if (id === HOST_IDS.OPTIMISATION)       return <Activity size={13} />;
  if (id === HOST_IDS.CUSTODIAN_DISPATCH) return <Shield size={13} />;
  return <Wifi size={13} />;
}

function TokenBadges({ tokens, hostId }: { tokens: Token[]; hostId: string }) {
  const mine = tokens.filter(t => t.hostId === hostId);
  if (mine.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {mine.map((t, i) => {
        const color =
          t.type === 'SHIELD'      ? '#5cd9ff' :
          t.type === 'TRIPWIRE'    ? '#ff5566' :
          '#ffb347'; // SPOOF_TRAIL
        return (
          <span key={i} className="text-[9px] uppercase tracking-wider px-1 border"
            style={{ color, borderColor: color }}>
            {t.type === 'SHIELD' ? 'SHD' : t.type === 'TRIPWIRE' ? 'TRP' : 'SPF'}
          </span>
        );
      })}
    </div>
  );
}

export default function HostNode({ host, isSelected, onClick, tokens }: Props) {
  if (host.state === 'hidden') {
    return (
      <div className="relative panel-default p-2.5 opacity-40 crt-mono text-xs select-none">
        <div className="glow-grey text-sm">[ ? ]</div>
        <div className="text-gray-600 text-[9px] uppercase tracking-wider mt-0.5">UNDISCOVERED</div>
      </div>
    );
  }

  const stateColor = STATE_COLOR[host.state] ?? '#b0b8c4';

  return (
    <button
      onClick={onClick}
      className={`host-node relative p-2.5 crt-mono text-xs scanlines select-none w-full text-left ${isSelected ? 'panel-resistance' : 'panel-default'}`}
      style={{
        borderColor: isSelected ? '#ffb347' : stateColor,
        boxShadow: isSelected ? '0 0 10px rgba(255,179,71,0.35)' : `0 0 5px ${stateColor}30`,
      }}
    >
      <div className="hud-corner hud-tl" style={{ color: stateColor }} />
      <div className="hud-corner hud-tr" style={{ color: stateColor }} />
      <div className="hud-corner hud-bl" style={{ color: stateColor }} />
      <div className="hud-corner hud-br" style={{ color: stateColor }} />

      <div className="flex items-start justify-between mb-0.5">
        <span style={{ color: stateColor }}><HostIcon id={host.id} /></span>
        <span className="text-[9px] uppercase tracking-widest" style={{ color: stateColor }}>
          {host.state}
        </span>
      </div>
      <div className="crt-display text-sm leading-tight" style={{ color: stateColor }}>
        {host.name}
      </div>
      <div className="text-[9px] text-gray-600 mt-0.5">{host.ip} · {host.zone}</div>

      <TokenBadges tokens={tokens} hostId={host.id} />

      {host.hasKey && (host.state === 'scanned' || host.state === 'user') && (
        <div className="glow-amber text-[9px] mt-1 blink">[ KEY HERE ]</div>
      )}
      {host.hasKey && host.state === 'root' && (
        <div className="glow-green text-[9px] mt-1">[ KEY HELD ]</div>
      )}
      {host.hasDb && (
        <div className="glow-red text-[9px] mt-0.5 blink">[ subjects.db ]</div>
      )}
    </button>
  );
}
