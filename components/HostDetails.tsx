'use client';
import type { Host } from '@/lib/types';

interface Props {
  host: Host | null;
  keyAcquired: boolean;
}

export default function HostDetails({ host, keyAcquired }: Props) {
  if (!host || host.state === 'hidden') {
    return (
      <div className="panel-default p-3 crt-mono text-xs glow-grey">
        Select a discovered host to inspect.
      </div>
    );
  }

  const stateColor =
    host.state === 'root'    ? '#6cff9c' :
    host.state === 'user'    ? '#ffb347' :
    host.state === 'scanned' ? '#5cd9ff' : '#b0b8c4';

  return (
    <div className="panel-default scanlines relative p-3 crt-mono text-xs">
      <div className="hud-corner hud-tl glow-grey" />
      <div className="hud-corner hud-tr glow-grey" />
      <div className="hud-corner hud-bl glow-grey" />
      <div className="hud-corner hud-br glow-grey" />

      <div className="flex items-center justify-between mb-1.5">
        <span className="crt-display text-lg glow-blue">{host.name}</span>
        <span className="text-[10px] glow-grey">{host.ip}</span>
      </div>

      <div className="text-gray-400 mb-2 text-[10px] leading-relaxed">{host.notes}</div>

      <div className="space-y-1.5">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">Services</div>
          {host.state === 'visible' ? (
            <div className="text-gray-600 italic text-[10px]">[ unknown — SCAN required ]</div>
          ) : (
            <div className="space-y-0.5">
              {host.services.map(s => (
                <div key={s.port} className="glow-blue text-[10px]">
                  :{s.port}/tcp {s.name} <span className="text-gray-500">{s.version}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">Vulnerability</div>
          {host.state === 'visible' ? (
            <div className="text-gray-600 italic text-[10px]">[ unknown ]</div>
          ) : (
            <div className="text-[10px]">
              <span className="glow-amber">{host.cve.id}</span>
              <span className="text-gray-400"> · {host.cve.summary}</span>
              <span className="text-gray-500"> · {host.cve.strength}</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">Access</div>
          <div className="text-[10px]" style={{ color: stateColor }}>
            {host.state === 'visible' && '○ no access'}
            {host.state === 'scanned' && '○ no access (recon complete)'}
            {host.state === 'user'    && '◐ user shell'}
            {host.state === 'root'    && '● root'}
          </div>
        </div>

        {host.id === 'mother_core' && host.state === 'root' && (
          <div className={`text-[10px] mt-1 ${keyAcquired ? 'glow-green' : 'glow-red blink'}`}>
            {keyAcquired ? '[ KEY READY · EXFIL UNLOCKED ]' : '[ NO KEY · subjects.db ENCRYPTED ]'}
          </div>
        )}
      </div>
    </div>
  );
}
