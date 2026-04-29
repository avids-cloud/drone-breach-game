import type { GameState, AvailableMotherAction, MotherActionType, MotherResponse, Host } from './types';
import { CONNECTIONS, CORE_CONNECTION_IDS, FALLBACK_MOTHER_DIALOGUE, HOST_IDS } from './constants';
import { traceTier } from './gameState';

// ── Available actions computation ─────────────────────────────────────

export function computeMotherAvailableActions(state: GameState): AvailableMotherAction[] {
  const available: AvailableMotherAction[] = [];
  const { hosts, tokens, isolatedConnections, lastMotherActions } = state;

  const lastAction = lastMotherActions.slice(-1)[0]?.action;
  const allHosts = Object.values(hosts) as Host[];

  // REINFORCE: any visible/scanned/accessed host without an existing shield, except mother_core
  const reinforceTargets = allHosts
    .filter(h =>
      h.state !== 'hidden' &&
      h.id !== HOST_IDS.MOTHER_CORE &&
      !tokens.some(t => t.type === 'SHIELD' && t.hostId === h.id)
    )
    .map(h => h.numericId);
  if (reinforceTargets.length > 0) available.push({ action: 'REINFORCE', targets: reinforceTargets });

  // OVERWATCH: any visible/scanned/accessed host without a tripwire
  const overwatchTargets = allHosts
    .filter(h =>
      h.state !== 'hidden' &&
      !tokens.some(t => t.type === 'TRIPWIRE' && t.hostId === h.id)
    )
    .map(h => h.numericId);
  if (overwatchTargets.length > 0) available.push({ action: 'OVERWATCH', targets: overwatchTargets });

  // TRACE_SPIKE: valid unless last action was TRACE_SPIKE (1-turn cooldown)
  if (lastAction !== 'TRACE_SPIKE') {
    available.push({ action: 'TRACE_SPIKE', targets: [null] });
  }

  // ISOLATE: connections where player has root on one endpoint, circuit breaker on last core path
  const remainingCoreConns = CORE_CONNECTION_IDS.filter(id => !isolatedConnections.includes(id));
  const isolateTargets = CONNECTIONS
    .filter(c => {
      if (isolatedConnections.includes(c.id)) return false;
      const fromHost = hosts[c.from];
      const toHost = hosts[c.to];
      const playerHasRoot = fromHost?.state === 'root' || toHost?.state === 'root';
      const isCoreConn = CORE_CONNECTION_IDS.includes(c.id);
      const isLastCorePath = isCoreConn && remainingCoreConns.length <= 1;
      return playerHasRoot && !isLastCorePath;
    })
    .map(c => c.id);
  if (isolateTargets.length > 0) available.push({ action: 'ISOLATE', targets: isolateTargets });

  // PURGE: hosts where player has user or root access
  const purgeTargets = allHosts
    .filter(h => h.state === 'user' || h.state === 'root')
    .map(h => h.numericId);
  if (purgeTargets.length > 0) available.push({ action: 'PURGE', targets: purgeTargets });

  return available;
}

export function formatAvailableActions(available: AvailableMotherAction[]): string {
  return available.map(a => {
    if (a.action === 'TRACE_SPIKE') return `  TRACE_SPIKE — no target required`;
    return `  ${a.action} — valid targets: ${a.targets.join(', ')}`;
  }).join('\n');
}

// ── JSON validation and fallback ──────────────────────────────────────

export function validateMotherResponse(
  raw: string,
  available: AvailableMotherAction[],
  tier: 'low' | 'medium' | 'high',
): MotherResponse {
  let parsed: Partial<MotherResponse>;

  try {
    // Strip any markdown code fences the LLM may have wrapped around the JSON
    const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.warn('[mother] JSON parse failed, applying fallback. raw:', raw);
    return fallbackResponse(null, available, tier);
  }

  const validActions: MotherActionType[] = ['REINFORCE', 'OVERWATCH', 'TRACE_SPIKE', 'ISOLATE', 'PURGE'];
  if (!parsed.action || !validActions.includes(parsed.action as MotherActionType)) {
    console.warn('[mother] invalid action field:', parsed.action);
    return fallbackResponse(null, available, tier);
  }

  const action = parsed.action as MotherActionType;
  const availEntry = available.find(a => a.action === action);

  if (!availEntry) {
    // Action not in valid set this turn — fallback to first available
    console.warn('[mother] action not available this turn:', action);
    return fallbackResponse(null, available, tier);
  }

  // Validate target
  let target = parsed.target ?? null;
  if (action === 'TRACE_SPIKE') {
    target = null;
  } else {
    if (!availEntry.targets.includes(target)) {
      // Pick first valid target for this action
      console.warn('[mother] invalid target, picking first valid:', target, availEntry.targets);
      target = availEntry.targets[0];
    }
  }

  const dialogue =
    typeof parsed.dialogue === 'string' && parsed.dialogue.trim().length > 0
      ? parsed.dialogue.trim()
      : FALLBACK_MOTHER_DIALOGUE[tier] ?? FALLBACK_MOTHER_DIALOGUE.low;

  return { action, target, dialogue };
}

function fallbackResponse(
  preferredAction: MotherActionType | null,
  available: AvailableMotherAction[],
  tier: 'low' | 'medium' | 'high',
): MotherResponse {
  if (available.length === 0) {
    return {
      action: 'TRACE_SPIKE',
      target: null,
      dialogue: FALLBACK_MOTHER_DIALOGUE[tier] ?? FALLBACK_MOTHER_DIALOGUE.low,
    };
  }

  const entry = preferredAction
    ? (available.find(a => a.action === preferredAction) ?? available[0])
    : available[0];

  return {
    action: entry.action,
    target: entry.targets[0] ?? null,
    dialogue: FALLBACK_MOTHER_DIALOGUE[tier] ?? FALLBACK_MOTHER_DIALOGUE.low,
  };
}

// ── Parse action keyword from CONSULT natural-language response ───────

export function parseActionFromConsult(
  text: string,
  available: AvailableMotherAction[],
): { action: MotherActionType; target: number | null } {
  const actionKeywords: MotherActionType[] = ['REINFORCE', 'OVERWATCH', 'TRACE_SPIKE', 'ISOLATE', 'PURGE'];

  for (const action of actionKeywords) {
    if (text.toUpperCase().includes(action)) {
      const entry = available.find(a => a.action === action);
      if (entry) {
        // Try to find a numeric target in the text near the keyword
        const nums = text.match(/\b([1-5])\b/g);
        if (nums) {
          for (const n of nums) {
            const num = parseInt(n);
            if (entry.targets.includes(num)) {
              return { action, target: num };
            }
          }
        }
        // Use first valid target
        return { action, target: entry.targets[0] ?? null };
      }
    }
  }

  // Default to first available action
  const fallback = available[0];
  return fallback
    ? { action: fallback.action, target: fallback.targets[0] ?? null }
    : { action: 'TRACE_SPIKE', target: null };
}
