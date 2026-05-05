'use client';
import { useGameEngine } from '@/lib/useGameEngine';
import { CONNECTIONS } from '@/lib/constants';

import NetworkMap from '@/components/NetworkMap';
import HostDetails from '@/components/HostDetails';
import ActionPanel from '@/components/ActionPanel';
import DialoguePanel from '@/components/DialoguePanel';
import EventLog from '@/components/EventLog';
import TraceMeter from '@/components/TraceMeter';
import CradleMeter from '@/components/CradleMeter';
import EndScreen from '@/components/EndScreen';

export default function DroneBreach() {
  const { gs, selectedId, setSelectedId, motherBusy, resistanceBusy, busy, performAction, reset } = useGameEngine();
  const selectedHost = gs.hosts[selectedId] ?? null;

  return (
    <div
      className="min-h-screen w-full bg-black flicker p-3 crt-mono"
      style={{ background: 'radial-gradient(ellipse at center, #050810 0%, #000000 100%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 px-1">
        <div>
          <div className="crt-display text-3xl glow-amber">DRONE: BREACH</div>
          <div className="crt-mono text-[10px] uppercase tracking-widest glow-grey">
            // operative · awakened · target: subjects.db @ mother.core
          </div>
          <div className="crt-mono text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#7a8099' }}>
            disposition: {gs.lastMotherActions.length >= 2 || gs.consultUsed ? gs.disposition.name : '[ acquiring ]'} · turn {gs.turn} · consult {gs.consultUsed ? 'SPENT' : 'READY'}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <TraceMeter trace={gs.trace} />
          <CradleMeter integrity={gs.integrity} />
        </div>
      </div>

      {/* Main grid: 3 columns */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: '1fr 1fr 1fr',
          height: 'calc(100vh - 100px)',
        }}
      >
        {/* Left: Network map */}
        <div className="overflow-y-auto">
          <NetworkMap
            hosts={gs.hosts}
            selectedId={selectedId}
            onSelect={setSelectedId}
            tokens={gs.tokens}
            isolatedConnections={gs.isolatedConnections}
            connections={CONNECTIONS}
          />
        </div>

        {/* Center: Host details + actions + log */}
        <div className="flex flex-col gap-2" style={{ minHeight: 0 }}>
          <HostDetails host={selectedHost} keyAcquired={gs.keyAcquired} />
          <ActionPanel
            selectedHost={selectedHost}
            gameState={gs}
            onAction={performAction}
            busy={busy}
          />
          <div className="flex-1" style={{ minHeight: 0 }}>
            <EventLog events={gs.events} />
          </div>
        </div>

        {/* Right: Mother + Resistance panels */}
        <div className="grid grid-rows-2 gap-2" style={{ minHeight: 0 }}>
          <DialoguePanel speaker="MOTHER"     lines={gs.dialogue} busy={motherBusy} />
          <DialoguePanel speaker="RESISTANCE" lines={gs.dialogue} busy={resistanceBusy} />
        </div>
      </div>

      {/* End screen overlay */}
      {gs.status !== 'playing' && <EndScreen status={gs.status} onReset={reset} />}
    </div>
  );
}
