'use client';
import type { Host, HostId, Token, Connection } from '@/lib/types';
import { HOST_IDS } from '@/lib/constants';
import HostNode from './HostNode';

interface Props {
  hosts: Record<HostId, Host>;
  selectedId: HostId | null;
  onSelect: (id: HostId) => void;
  tokens: Token[];
  isolatedConnections: number[];
  connections: Connection[];
}

function ConnectionLine({
  fromId, toId, isolated
}: { fromId: HostId; toId: HostId; isolated: boolean }) {
  return (
    <div className={`flex items-center gap-1 crt-mono text-[9px] my-0.5 ${isolated ? 'opacity-25 line-through' : 'opacity-50'}`}
      style={{ color: isolated ? '#ff5566' : '#4a5568' }}>
      <span>{fromId.replaceAll('_', '-')}</span>
      <span>→</span>
      <span>{toId.replaceAll('_', '-')}</span>
      {isolated && <span className="glow-red ml-1">[ISOLATED]</span>}
    </div>
  );
}

export default function NetworkMap({ hosts, selectedId, onSelect, tokens, isolatedConnections, connections }: Props) {
  const dmz: HostId[]      = [HOST_IDS.TRANSIT_RELAY, HOST_IDS.CUSTODIAN_DISPATCH];
  const internal: HostId[] = [HOST_IDS.OPTIMISATION, HOST_IDS.MEMORY_VAULT];
  const core: HostId[]     = [HOST_IDS.MOTHER_CORE];

  return (
    <div className="panel-default scanlines relative p-3 h-full flex flex-col">
      <div className="hud-corner hud-tl glow-grey" />
      <div className="hud-corner hud-tr glow-grey" />
      <div className="hud-corner hud-bl glow-grey" />
      <div className="hud-corner hud-br glow-grey" />

      <div className="flex items-center justify-between mb-2 crt-mono text-[10px] uppercase tracking-widest glow-grey">
        <span>Network Topology</span>
        <span>Mother.local</span>
      </div>

      <div className="space-y-2 flex-1">
        <div>
          <div className="crt-mono text-[9px] uppercase tracking-widest text-gray-600 mb-1">// DMZ</div>
          <div className="grid grid-cols-2 gap-1.5">
            {dmz.map(id => (
              <HostNode key={id} host={hosts[id]} isSelected={selectedId === id}
                onClick={() => onSelect(id)} tokens={tokens} />
            ))}
          </div>
        </div>

        <div className="space-y-0.5 px-2">
          {connections.filter(c => c.from === HOST_IDS.TRANSIT_RELAY || c.from === HOST_IDS.CUSTODIAN_DISPATCH).map(c => (
            <ConnectionLine key={c.id} fromId={c.from} toId={c.to} isolated={isolatedConnections.includes(c.id)} />
          ))}
        </div>

        <div>
          <div className="crt-mono text-[9px] uppercase tracking-widest text-gray-600 mb-1">// INTERNAL</div>
          <div className="grid grid-cols-2 gap-1.5">
            {internal.map(id => (
              <HostNode key={id} host={hosts[id]} isSelected={selectedId === id}
                onClick={() => onSelect(id)} tokens={tokens} />
            ))}
          </div>
        </div>

        <div className="space-y-0.5 px-2">
          {connections.filter(c => c.from === HOST_IDS.OPTIMISATION || c.from === HOST_IDS.MEMORY_VAULT).map(c => (
            <ConnectionLine key={c.id} fromId={c.from} toId={c.to} isolated={isolatedConnections.includes(c.id)} />
          ))}
        </div>

        <div>
          <div className="crt-mono text-[9px] uppercase tracking-widest text-gray-600 mb-1">// CORE</div>
          {core.map(id => (
            <HostNode key={id} host={hosts[id]} isSelected={selectedId === id}
              onClick={() => onSelect(id)} tokens={tokens} />
          ))}
        </div>
      </div>
    </div>
  );
}
