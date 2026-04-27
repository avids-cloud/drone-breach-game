'use client';
import { useState, useCallback } from 'react';
import type { GameState, HostId, PlayerActionType, MotherActionType } from './types';
import {
  buildInitialState,
  applyScan, applyBreach, applySpoof, applyExfil, applyConsult,
  applyMotherAction, applyResistanceDialogue, applyConsultDialogue,
  traceTier,
} from './gameState';
import { computeMotherAvailableActions, validateMotherResponse, parseActionFromConsult } from './motherLogic';
import {
  buildMotherSystemPrompt, buildMotherUserMessage,
  buildMotherDialogueOnlySystemPrompt,
  buildResistanceSystemPrompt, buildResistanceUserMessage,
  buildConsultSystemPrompt, buildConsultUserMessage,
} from './prompts';
import { FALLBACK_MOTHER_DIALOGUE, FALLBACK_RESISTANCE_LINE, FALLBACK_CONSULT_LINE } from './constants';

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

export interface GameEngine {
  gs: GameState;
  selectedId: HostId;
  setSelectedId: (id: HostId) => void;
  motherBusy: boolean;
  resistanceBusy: boolean;
  busy: boolean;
  performAction: (action: PlayerActionType) => Promise<void>;
  reset: () => void;
}

export function useGameEngine(): GameEngine {
  const [gs, setGs] = useState<GameState>(() => buildInitialState());
  const [selectedId, setSelectedId] = useState<HostId>('transit_relay');
  const [motherBusy, setMotherBusy] = useState(false);
  const [resistanceBusy, setResistanceBusy] = useState(false);

  const busy = motherBusy || resistanceBusy;
  const selectedHost = gs.hosts[selectedId] ?? null;

  const performAction = useCallback(async (action: PlayerActionType) => {
    if (gs.status !== 'playing' || busy) return;

    // ── CONSULT path ──────────────────────────────────────────────────
    if (action === 'CONSULT') {
      if (gs.consultUsed) return;

      setMotherBusy(true);
      setResistanceBusy(true);

      const stateAfterConsult = applyConsult(gs);
      setGs(stateAfterConsult);

      const consultSystem = buildConsultSystemPrompt(stateAfterConsult);
      const consultUser   = buildConsultUserMessage();
      const consultText   = await callApi('/api/consult', consultSystem, consultUser);

      const prediction = consultText ?? FALLBACK_CONSULT_LINE;

      const available = computeMotherAvailableActions(stateAfterConsult);
      const { action: predictedAction, target: predictedTarget } = parseActionFromConsult(prediction, available);

      const motherDialogueSystem = buildMotherDialogueOnlySystemPrompt(
        stateAfterConsult, predictedAction, predictedTarget,
      );
      const motherDialogueUser = buildMotherUserMessage(
        'CONSULT', 'encrypted relay', 'operative burned their action to access Resistance buffer',
        stateAfterConsult.trace, stateAfterConsult.integrity,
      );
      const motherDialogueText = await callApi('/api/mother', motherDialogueSystem, motherDialogueUser);
      const motherDialogue = motherDialogueText
        ?? FALLBACK_MOTHER_DIALOGUE[traceTier(stateAfterConsult.trace)];

      let finalState = applyConsultDialogue(stateAfterConsult, prediction);
      finalState = applyMotherAction(finalState, predictedAction as MotherActionType, predictedTarget, motherDialogue);

      setGs(finalState);
      setMotherBusy(false);
      setResistanceBusy(false);
      return;
    }

    // ── Normal action path ────────────────────────────────────────────

    let stateAfterAction: GameState;
    const hostName = selectedHost?.short ?? 'unknown';
    let outcome = '';

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
        const newAccessState = stateAfterAction.hosts[selectedId].state;
        outcome = `${newAccessState === 'root' ? 'root' : 'user shell'} acquired on ${hostName}`;
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
        setGs(stateAfterAction);
        setMotherBusy(true);
        setResistanceBusy(true);
        const exfilOutcome = 'subjects.db extracted · WIN';
        const [mText, rText] = await Promise.all([
          callApi('/api/mother',
            buildMotherSystemPrompt(stateAfterAction),
            buildMotherUserMessage('EXFIL', 'mother_core', exfilOutcome, stateAfterAction.trace, stateAfterAction.integrity)),
          callApi('/api/resistance',
            buildResistanceSystemPrompt(stateAfterAction),
            buildResistanceUserMessage('EXFIL', 'mother_core', exfilOutcome,
              'none', 'none', '—', stateAfterAction.trace, stateAfterAction.integrity)),
        ]);
        setGs(prev => {
          let s = applyResistanceDialogue(prev, rText ?? FALLBACK_RESISTANCE_LINE);
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

    setGs(stateAfterAction);

    if (stateAfterAction.status !== 'playing') return;

    setMotherBusy(true);
    setResistanceBusy(true);

    const tier = traceTier(stateAfterAction.trace);
    const available = computeMotherAvailableActions(stateAfterAction);

    const motherRaw = await callApi(
      '/api/mother',
      buildMotherSystemPrompt(stateAfterAction),
      buildMotherUserMessage(action, hostName, outcome,
        stateAfterAction.trace, stateAfterAction.integrity),
    );
    setMotherBusy(false);

    const motherResp = validateMotherResponse(motherRaw ?? '', available, tier);
    const stateAfterMother = applyMotherAction(stateAfterAction, motherResp.action, motherResp.target, motherResp.dialogue);
    setGs(stateAfterMother);

    const motherTargetName = motherResp.target !== null
      ? Object.values(stateAfterAction.hosts).find(h => h.numericId === motherResp.target)?.short ?? String(motherResp.target)
      : 'network';

    const resistanceText = await callApi(
      '/api/resistance',
      buildResistanceSystemPrompt(stateAfterMother),
      buildResistanceUserMessage(
        action, hostName, outcome,
        motherResp.action, motherTargetName, motherResp.dialogue,
        stateAfterMother.trace, stateAfterMother.integrity,
      ),
    );

    setGs(prev => applyResistanceDialogue(prev, resistanceText ?? FALLBACK_RESISTANCE_LINE));
    setResistanceBusy(false);
  }, [gs, busy, selectedHost, selectedId]);

  const reset = useCallback(() => {
    setGs(buildInitialState());
    setSelectedId('transit_relay');
    setMotherBusy(false);
    setResistanceBusy(false);
  }, []);

  return { gs, selectedId, setSelectedId, motherBusy, resistanceBusy, busy, performAction, reset };
}
