'use client';
import { useState, useCallback } from 'react';
import type { GameState, HostId, PlayerActionType, MotherActionType } from './types';
import {
  buildInitialState,
  applyScan, applyBreach, applySpoof, applyExfil, applyConsult,
  applyMotherAction, applyResistanceDialogue, applyConsultDialogue,
  canPerformAction, traceTier,
} from './gameState';
import { computeMotherAvailableActions, validateMotherResponse, parseActionFromConsult } from './motherLogic';
import {
  buildMotherSystemPrompt, buildMotherUserMessage,
  buildMotherDialogueOnlySystemPrompt,
  buildResistanceSystemPrompt, buildResistanceUserMessage,
  buildConsultSystemPrompt, buildConsultUserMessage,
} from './prompts';
import { FALLBACK_MOTHER_DIALOGUE, FALLBACK_RESISTANCE_LINE, FALLBACK_CONSULT_LINE, HOST_IDS } from './constants';

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
  const [selectedId, setSelectedId] = useState<HostId>(HOST_IDS.TRANSIT_RELAY);
  const [motherBusy, setMotherBusy] = useState(false);
  const [resistanceBusy, setResistanceBusy] = useState(false);

  const busy = motherBusy || resistanceBusy;
  const selectedHost = gs.hosts[selectedId] ?? null;

  const performAction = useCallback(async (action: PlayerActionType) => {
    if (gs.status !== 'playing' || busy) return;

    // ── CONSULT path ──────────────────────────────────────────────────
    if (action === 'CONSULT') {
      if (!canPerformAction(gs, selectedHost, 'CONSULT')) return;

      setMotherBusy(true);
      setResistanceBusy(true);

      const stateAfterConsult = applyConsult(gs);
      setGs(stateAfterConsult);

      const consultText = await callApi(
        '/api/consult',
        buildConsultSystemPrompt(stateAfterConsult),
        buildConsultUserMessage(),
      );

      const prediction = consultText ?? FALLBACK_CONSULT_LINE;
      const available = computeMotherAvailableActions(stateAfterConsult);
      const { action: predictedAction, target: predictedTarget } = parseActionFromConsult(prediction, available);

      const motherDialogueText = await callApi(
        '/api/mother',
        buildMotherDialogueOnlySystemPrompt(stateAfterConsult, predictedAction, predictedTarget),
        buildMotherUserMessage(
          'CONSULT', 'encrypted relay', 'operative burned their action to access Resistance buffer',
          stateAfterConsult.trace, stateAfterConsult.integrity,
        ),
      );
      const motherDialogue = motherDialogueText ?? FALLBACK_MOTHER_DIALOGUE[traceTier(stateAfterConsult.trace)];

      setGs(prev => {
        const s = applyConsultDialogue(prev, prediction);
        return applyMotherAction(s, predictedAction as MotherActionType, predictedTarget, motherDialogue);
      });
      setMotherBusy(false);
      setResistanceBusy(false);
      return;
    }

    // ── EXFIL path ────────────────────────────────────────────────────
    if (action === 'EXFIL') {
      if (!canPerformAction(gs, selectedHost, 'EXFIL')) return;

      const stateAfterAction = applyExfil(gs);
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
        const s = applyResistanceDialogue(prev, rText ?? FALLBACK_RESISTANCE_LINE);
        return { ...s, dialogue: [...s.dialogue, { speaker: 'MOTHER' as const, text: mText ?? 'subjects.db access detected. Channel integrity compromised.' }] };
      });
      setMotherBusy(false);
      setResistanceBusy(false);
      return;
    }

    // ── Standard action path (SCAN, BREACH, SPOOF) ────────────────────
    if (!canPerformAction(gs, selectedHost, action)) return;

    const hostName = selectedHost?.short ?? 'unknown';
    let stateAfterAction: GameState;
    let outcome = '';

    switch (action) {
      case 'SCAN': {
        stateAfterAction = applyScan(gs, selectedId);
        outcome = `services and CVE revealed on ${hostName}`;
        break;
      }
      case 'BREACH': {
        stateAfterAction = applyBreach(gs, selectedId);
        const newAccessState = stateAfterAction.hosts[selectedId].state;
        outcome = `${newAccessState === 'root' ? 'root' : 'user shell'} acquired on ${hostName}`;
        break;
      }
      case 'SPOOF': {
        stateAfterAction = applySpoof(gs, selectedId);
        outcome = `false trail planted on ${hostName} · trace -10`;
        break;
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
      buildMotherUserMessage(action, hostName, outcome, stateAfterAction.trace, stateAfterAction.integrity),
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
    setSelectedId(HOST_IDS.TRANSIT_RELAY);
    setMotherBusy(false);
    setResistanceBusy(false);
  }, []);

  return { gs, selectedId, setSelectedId, motherBusy, resistanceBusy, busy, performAction, reset };
}
