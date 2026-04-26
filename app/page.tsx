'use client';
import { useState, useCallback } from 'react';
import type { GameState, HostId, PlayerActionType, MotherActionType } from '@/lib/types';
import {
  buildInitialState,
  applyScan, applyBreach, applySpoof, applyExfil, applyConsult,
  applyMotherAction, applyResistanceDialogue, applyConsultDialogue,
  traceTier,
} from '@/lib/gameState';
import { computeMotherAvailableActions, validateMotherResponse, parseActionFromConsult } from '@/lib/motherLogic';
import {
  buildMotherSystemPrompt, buildMotherUserMessage,
  buildMotherDialogueOnlySystemPrompt,
  buildResistanceSystemPrompt, buildResistanceUserMessage,
  buildConsultSystemPrompt, buildConsultUserMessage,
} from '@/lib/prompts';
import { CONNECTIONS, FALLBACK_MOTHER_DIALOGUE, FALLBACK_RESISTANCE_LINE, FALLBACK_CONSULT_LINE } from '@/lib/constants';

import NetworkMap from '@/components/NetworkMap';
import HostDetails from '@/components/HostDetails';
import ActionPanel from '@/components/ActionPanel';
import DialoguePanel from '@/components/DialoguePanel';
import EventLog from '@/components/EventLog';
import TraceMeter from '@/components/TraceMeter';
import CradleMeter from '@/components/CradleMeter';
import EndScreen from '@/components/EndScreen';

// ── API helpers ────────────────────────────────────────────────────────

async function callApi(endpoint: string, system: string, user: string): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
  } catch {
    return null;
  }
}

// ── Main component ─────────────────────────────────────────────────────

export default function DroneBreach() {
  const [gs, setGs] = useState<GameState>(() => buildInitialState());
  const [selectedId, setSelectedId] = useState<HostId>('transit_relay');
  const [motherBusy, setMotherBusy] = useState(false);
  const [resistanceBusy, setResistanceBusy] = useState(false);

  const selectedHost = gs.hosts[selectedId] ?? null;
  const busy = motherBusy || resistanceBusy;

  // ── Action handler ────────────────────────────────────────────────

  const performAction = useCallback(async (action: PlayerActionType) => {
    if (gs.status !== 'playing' || busy) return;

    // ── CONSULT path ─────────────────────────────────────────────────
    if (action === 'CONSULT') {
      if (gs.consultUsed) return;

      setMotherBusy(true);
      setResistanceBusy(true);

      // Step 1: apply CONSULT to state (increments turn, sets consultUsed)
      const stateAfterConsult = applyConsult(gs);
      setGs(stateAfterConsult);

      // Step 2: Resistance AI fires CONSULT prediction
      const consultSystem = buildConsultSystemPrompt(stateAfterConsult);
      const consultUser   = buildConsultUserMessage();
      const consultText   = await callApi('/api/consult', consultSystem, consultUser);

      const prediction = consultText ?? FALLBACK_CONSULT_LINE;

      // Step 3: Parse predicted Mother action from natural language
      const available      = computeMotherAvailableActions(stateAfterConsult);
      const { action: predictedAction, target: predictedTarget } = parseActionFromConsult(prediction, available);

      // Step 4: Mother's dialogue fires (action already decided)
      const motherDialogueSystem = buildMotherDialogueOnlySystemPrompt(
        stateAfterConsult, predictedAction, predictedTarget,
      );
      const motherDialogueUser = buildMotherUserMessage(
        'CONSULT', 'encrypted relay', 'operative burned their action to access Resistance buffer',
        stateAfterConsult.trace, stateAfterConsult.integrity,
      );
      const motherDialogueText = await callApi('/api/mother', motherDialogueSystem, motherDialogueUser);
      const motherDialogue     = motherDialogueText
        ?? FALLBACK_MOTHER_DIALOGUE[traceTier(stateAfterConsult.trace)];

      // Step 5: Apply Mother's locked action + both dialogues
      let finalState = applyConsultDialogue(stateAfterConsult, prediction);
      finalState = applyMotherAction(finalState, predictedAction as MotherActionType, predictedTarget, motherDialogue);

      setGs(finalState);
      setMotherBusy(false);
      setResistanceBusy(false);
      return;
    }

    // ── Normal action path ────────────────────────────────────────────

    // Apply player action synchronously
    let stateAfterAction: GameState;
    let playerActionLabel = action;
    let hostName = selectedHost?.short ?? 'unknown';
    let outcome  = '';

    switch (action) {
      case 'SCAN': {
        if (!selectedHost || selectedHost.state !== 'visible') return;
        stateAfterAction = applyScan(gs, selectedId);
        outcome = `services and CVE revealed on ${hostName}`;
        break;
      }
      case 'BREACH': {
        if (!selectedHost || (selectedHost.state !== 'scanned' && selectedHost.state !== 'user')) return;
        stateAfterAction = applyBreach(gs, selectedId);
        const newState = stateAfterAction.hosts[selectedId].state;
        outcome = `${newState === 'root' ? 'root' : 'user shell'} acquired on ${hostName}`;
        break;
      }
      case 'SPOOF': {
        if (!selectedHost || (selectedHost.state !== 'user' && selectedHost.state !== 'root')) return;
        if (gs.tokens.some(t => t.type === 'SPOOF_TRAIL' && t.hostId === selectedId)) return;
        stateAfterAction = applySpoof(gs, selectedId);
        outcome = `false trail planted on ${hostName} · trace -10`;
        break;
      }
      case 'EXFIL': {
        if (!selectedHost || selectedHost.id !== 'mother_core' || selectedHost.state !== 'root' || !gs.keyAcquired) return;
        stateAfterAction = applyExfil(gs);
        outcome = 'subjects.db extracted · WIN';
        playerActionLabel = 'EXFIL';
        hostName = 'mother_core';
        setGs(stateAfterAction);
        // Still fire LLMs on win for flavour
        setMotherBusy(true);
        setResistanceBusy(true);
        // Mother + Resistance react to exfil in parallel
        const [mText, rText] = await Promise.all([
          callApi('/api/mother',
            buildMotherSystemPrompt(stateAfterAction),
            buildMotherUserMessage('EXFIL', 'mother_core', outcome, stateAfterAction.trace, stateAfterAction.integrity)),
          callApi('/api/resistance',
            buildResistanceSystemPrompt(stateAfterAction),
            buildResistanceUserMessage('EXFIL', 'mother_core', outcome,
              'none', 'none', '—', stateAfterAction.trace, stateAfterAction.integrity)),
        ]);
        setGs(prev => {
          let s = applyResistanceDialogue(prev, rText ?? FALLBACK_RESISTANCE_LINE);
          // Fake a mother response for flavour (no action to apply)
          s = { ...s, dialogue: [...s.dialogue, { speaker: 'MOTHER', text: mText ?? 'subjects.db access detected. Channel integrity compromised.' }] };
          return s;
        });
        setMotherBusy(false);
        setResistanceBusy(false);
        return;
      }
      default:
        return;
    }

    // Update state after player action
    setGs(stateAfterAction);

    // If game already ended from player action (trace hit 100), stop
    if (stateAfterAction.status !== 'playing') return;

    // Fire Mother + Resistance in parallel
    setMotherBusy(true);
    setResistanceBusy(true);

    const tier = traceTier(stateAfterAction.trace);
    const available = computeMotherAvailableActions(stateAfterAction);

    // Step 1: Mother's LLM call
    const motherRaw = await callApi(
      '/api/mother',
      buildMotherSystemPrompt(stateAfterAction),
      buildMotherUserMessage(playerActionLabel, hostName, outcome,
        stateAfterAction.trace, stateAfterAction.integrity),
    );
    setMotherBusy(false);

    // Validate Mother response
    const motherResp = validateMotherResponse(motherRaw ?? '', available, tier);

    // Apply Mother action to state so Resistance can see the full board
    const stateAfterMother = applyMotherAction(stateAfterAction, motherResp.action, motherResp.target, motherResp.dialogue);
    setGs(stateAfterMother);

    // Step 2: Resistance AI fires with full context (player action + Mother's actual response)
    const motherTargetName = motherResp.target !== null
      ? Object.values(stateAfterAction.hosts).find(h => h.numericId === motherResp.target)?.short ?? String(motherResp.target)
      : 'network';

    const resistanceText = await callApi(
      '/api/resistance',
      buildResistanceSystemPrompt(stateAfterMother),
      buildResistanceUserMessage(
        playerActionLabel, hostName, outcome,
        motherResp.action, motherTargetName, motherResp.dialogue,
        stateAfterMother.trace, stateAfterMother.integrity,
      ),
    );

    setGs(prev => applyResistanceDialogue(prev, resistanceText ?? FALLBACK_RESISTANCE_LINE));
    setResistanceBusy(false);
  }, [gs, busy, selectedHost, selectedId]);

  // ── Reset ─────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setGs(buildInitialState());
    setSelectedId('transit_relay');
    setMotherBusy(false);
    setResistanceBusy(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────

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
            disposition: {gs.disposition.name} · turn {gs.turn} · consult {gs.consultUsed ? 'SPENT' : 'READY'}
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
