import type {
  GameState, Host, HostId, Token, TokenType,
  DispositionName, MotherActionType, MotherActionRecord,
  EventEntry, DialogueLine, EventKind, PlayerActionType,
} from './types';
import {
  BASE_HOSTS, CONNECTIONS, DISPOSITIONS, KEY_HOST_CANDIDATES, CVE_BREACH_COST, HOST_IDS,
} from './constants';

// ── Run seeding ──────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildInitialState(): GameState {
  const dispositionName = pickRandom<DispositionName>(['DIAGNOSTIC', 'PROTOCOL', 'REMEDIATION']);
  const keyHostId = pickRandom<HostId>(KEY_HOST_CANDIDATES);
  const disposition = DISPOSITIONS[dispositionName];

  // Build hosts: transit_relay and custodian_dispatch start visible, rest hidden
  const hosts: Record<HostId, Host> = {} as Record<HostId, Host>;
  for (const [id, base] of Object.entries(BASE_HOSTS) as [HostId, typeof BASE_HOSTS[HostId]][]) {
    hosts[id] = {
      ...base,
      state: (id === HOST_IDS.TRANSIT_RELAY || id === HOST_IDS.CUSTODIAN_DISPATCH) ? 'visible' : 'hidden',
      hasKey: id === keyHostId,
    };
  }

  // Disposition starting tokens
  const tokens: Token[] = [];
  if (dispositionName === 'DIAGNOSTIC') {
    tokens.push({ type: 'TRIPWIRE', hostId: HOST_IDS.TRANSIT_RELAY });
    tokens.push({ type: 'TRIPWIRE', hostId: HOST_IDS.CUSTODIAN_DISPATCH });
  } else if (dispositionName === 'PROTOCOL') {
    tokens.push({ type: 'SHIELD', hostId: HOST_IDS.OPTIMISATION });
    tokens.push({ type: 'SHIELD', hostId: HOST_IDS.MEMORY_VAULT });
  }

  const startTrace = dispositionName === 'REMEDIATION' ? 20 : 0;

  return {
    hosts,
    trace: startTrace,
    integrity: 100,
    turn: 0,
    disposition,
    keyHostId,
    keyAcquired: false,
    tokens,
    isolatedConnections: [],
    lastMotherActions: [],
    consultUsed: false,
    status: 'playing',
    events: [
      { t: 0, kind: 'info', msg: `session opened · resistance handshake complete · disposition: ${dispositionName}` },
    ],
    dialogue: [],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

// TRIPWIRE helper: applies +20 trace penalty and consumes the token if present.
// Per DESIGN.md: "Next time player acts on this host, trace spikes +20. Token consumed on trigger."
function checkAndConsumeTripwire(
  state: GameState,
  hostId: HostId,
): { state: GameState; extraTrace: number; msg: string } {
  const hasTripwire = state.tokens.some(t => t.type === 'TRIPWIRE' && t.hostId === hostId);
  if (!hasTripwire) return { state, extraTrace: 0, msg: '' };
  const newTokens = state.tokens.filter(t => !(t.type === 'TRIPWIRE' && t.hostId === hostId));
  return {
    state: { ...state, tokens: newTokens },
    extraTrace: 20,
    msg: ' · TRIPWIRE triggered +20 trace',
  };
}

export function traceTier(trace: number): 'low' | 'medium' | 'high' {
  return trace < 30 ? 'low' : trace < 60 ? 'medium' : 'high';
}

export function traceTierLabel(trace: number): string {
  return trace < 30 ? 'system noise' : trace < 60 ? 'acknowledged' : 'hunting';
}

function addEvent(state: GameState, kind: EventKind, msg: string): GameState {
  return {
    ...state,
    events: [...state.events, { t: state.events.length, kind, msg }],
  };
}

function addDialogue(state: GameState, line: DialogueLine): GameState {
  return { ...state, dialogue: [...state.dialogue, line] };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── Player action: SCAN ──────────────────────────────────────────────

export function applyScan(state: GameState, hostId: HostId): GameState {
  const host = state.hosts[hostId];
  if (!host || host.state !== 'visible') return state;

  // Check TRIPWIRE before acting (fires on any player action per spec)
  const { state: stateAfterTripwire, extraTrace, msg: tripwireMsg } = checkAndConsumeTripwire(state, hostId);

  const newTrace = clamp(stateAfterTripwire.trace + 5 + extraTrace, 0, 100);
  const newState = {
    ...stateAfterTripwire,
    hosts: {
      ...stateAfterTripwire.hosts,
      [hostId]: { ...host, state: 'scanned' as const },
    },
    trace: newTrace,
    turn: stateAfterTripwire.turn + 1,
  };

  let s = addEvent(newState, 'info',
    `nmap -sV ${host.ip} · services mapped · ${host.cve.id} flagged [${host.cve.strength}]${tripwireMsg}`);
  s = addEvent(s, 'info', `trace +${5 + extraTrace} → ${s.trace}/100`);

  if (host.hasKey) {
    s = addEvent(s, 'info', `[ decryption key detected on ${host.short} — root required ]`);
  }

  return checkWinLose(s);
}

// ── Player action: BREACH ────────────────────────────────────────────

export function applyBreach(state: GameState, hostId: HostId): GameState {
  const host = state.hosts[hostId];
  if (!host || (host.state !== 'scanned' && host.state !== 'user')) return state;

  // Check TRIPWIRE before acting (fires on any player action per spec)
  const { state: stateAfterTripwire, extraTrace, msg: tripwireMsg } = checkAndConsumeTripwire(state, hostId);

  const isShielded = stateAfterTripwire.tokens.some(t => t.type === 'SHIELD' && t.hostId === hostId);
  let traceCost = CVE_BREACH_COST[host.cve.strength];
  if (isShielded) traceCost += 15;

  const newAccessState = host.state === 'scanned' ? 'user' as const : 'root' as const;
  const newTrace = clamp(stateAfterTripwire.trace + traceCost + extraTrace, 0, 100);

  // Remove shield if present (consumed on breach)
  let newTokens = stateAfterTripwire.tokens.filter(t => !(t.type === 'SHIELD' && t.hostId === hostId));

  let newHosts = {
    ...stateAfterTripwire.hosts,
    [hostId]: { ...host, state: newAccessState },
  };

  // On reaching root, reveal directly-connected hidden hosts
  let revealMsg = '';
  if (newAccessState === 'root') {
    const toReveal = host.connections.filter(id => newHosts[id].state === 'hidden');
    for (const id of toReveal) {
      newHosts = { ...newHosts, [id]: { ...newHosts[id], state: 'visible' as const } };
    }
    if (toReveal.length > 0) {
      revealMsg = ` · revealed: ${toReveal.join(', ')}`;
    }
  }

  let s: GameState = {
    ...stateAfterTripwire,
    hosts: newHosts,
    tokens: newTokens,
    trace: newTrace,
    turn: stateAfterTripwire.turn + 1,
  };

  const shieldMsg = isShielded ? ' (shield consumed +15)' : '';
  const accessLabel = newAccessState === 'user' ? 'user shell' : 'root';
  s = addEvent(s, 'success',
    `BREACH ${host.ip} · ${accessLabel} acquired${shieldMsg}${tripwireMsg}${revealMsg}`);
  s = addEvent(s, 'info', `trace +${traceCost + extraTrace} → ${newTrace}/100`);

  // Key acquisition on root
  if (newAccessState === 'root' && host.hasKey) {
    s = { ...s, keyAcquired: true };
    s = addEvent(s, 'success', `decryption key extracted · subjects.db will decrypt on EXFIL`);
  }

  return checkWinLose(s);
}

// ── Player action: SPOOF ─────────────────────────────────────────────

export function applySpoof(state: GameState, hostId: HostId): GameState {
  const host = state.hosts[hostId];
  if (!host || (host.state !== 'user' && host.state !== 'root')) return state;

  // Cannot double-spoof
  const alreadySpoofed = state.tokens.some(t => t.type === 'SPOOF_TRAIL' && t.hostId === hostId);
  if (alreadySpoofed) return state;

  // Check TRIPWIRE before acting (fires on any player action per spec)
  const { state: stateAfterTripwire, extraTrace, msg: tripwireMsg } = checkAndConsumeTripwire(state, hostId);

  // SPOOF consumes an existing Shield token on this host per spec:
  // "Shield consumed on successful BREACH or when player SPOOFs the host."
  const hadShield = stateAfterTripwire.tokens.some(t => t.type === 'SHIELD' && t.hostId === hostId);
  let newTokens = stateAfterTripwire.tokens.filter(t => !(t.type === 'SHIELD' && t.hostId === hostId));
  newTokens = [...newTokens, { type: 'SPOOF_TRAIL' as TokenType, hostId }];

  // SPOOF reduces trace by 10 (tripwire cost applied first if present)
  const newTrace = clamp(stateAfterTripwire.trace + extraTrace - 10, 0, 100);
  const netChange = extraTrace - 10;

  let s: GameState = {
    ...stateAfterTripwire,
    tokens: newTokens,
    trace: newTrace,
    turn: stateAfterTripwire.turn + 1,
  };

  const shieldMsg = hadShield ? ' · shield consumed' : '';
  s = addEvent(s, 'info',
    `SPOOF trail planted on ${host.short} · trace ${netChange >= 0 ? '+' : ''}${netChange} → ${newTrace}/100${tripwireMsg}${shieldMsg}`);
  s = addEvent(s, 'info', `[ spoof trail visible to Mother — host flagged for attention ]`);

  return checkWinLose(s);
}

// ── Player action: EXFIL ─────────────────────────────────────────────

export function applyExfil(state: GameState): GameState {
  const core = state.hosts[HOST_IDS.MOTHER_CORE];
  if (!core || core.state !== 'root' || !state.keyAcquired) return state;

  const newTrace = clamp(state.trace + 30, 0, 100);

  let s: GameState = {
    ...state,
    trace: newTrace,
    turn: state.turn + 1,
    status: 'won_exfil',
  };

  s = addEvent(s, 'success', `subjects.db pulled · 47,212 records extracted · Resistance AI cutting channel`);
  return s;
}

// ── Player action: CONSULT ────────────────────────────────────────────
// Sets consultUsed flag and increments turn; the actual LLM calls are handled by the UI layer

export function applyConsult(state: GameState): GameState {
  if (state.consultUsed) return state;

  let s: GameState = {
    ...state,
    consultUsed: true,
    trace: clamp(state.trace + 10, 0, 100),
    turn: state.turn + 1,
  };

  s = addEvent(s, 'info', `CONSULT invoked · deep buffer relay lit · trace +10 → ${s.trace}/100`);
  return checkWinLose(s);
}

// ── Action eligibility ───────────────────────────────────────────────

export function canPerformAction(
  gs: GameState,
  host: Host | null,
  action: PlayerActionType,
): boolean {
  switch (action) {
    case 'SCAN':
      return host !== null && host.state === 'visible';
    case 'BREACH':
      return host !== null && (host.state === 'scanned' || host.state === 'user');
    case 'SPOOF':
      return (
        host !== null &&
        (host.state === 'user' || host.state === 'root') &&
        !gs.tokens.some(t => t.type === 'SPOOF_TRAIL' && t.hostId === host.id)
      );
    case 'EXFIL':
      return (
        host !== null &&
        host.id === HOST_IDS.MOTHER_CORE &&
        host.state === 'root' &&
        gs.keyAcquired
      );
    case 'CONSULT':
      return !gs.consultUsed;
  }
}

// ── Mother action application ─────────────────────────────────────────

export function applyMotherAction(
  state: GameState,
  action: MotherActionType,
  target: number | null,
  dialogue: string,
): GameState {
  let s = addDialogue(state, { speaker: 'MOTHER', text: dialogue });

  const hostById = (numId: number): HostId | undefined =>
    (Object.values(s.hosts) as Host[]).find(h => h.numericId === numId)?.id;

  switch (action) {
    case 'REINFORCE': {
      if (target === null) break;
      const hId = hostById(target);
      if (!hId) break;
      // Only one shield per host
      if (!s.tokens.some(t => t.type === 'SHIELD' && t.hostId === hId)) {
        s = { ...s, tokens: [...s.tokens, { type: 'SHIELD', hostId: hId }] };
      }
      s = addEvent(s, 'info', `[ MOTHER ] REINFORCE · shield token placed on ${hId}`);
      break;
    }
    case 'OVERWATCH': {
      if (target === null) break;
      const hId = hostById(target);
      if (!hId) break;
      if (!s.tokens.some(t => t.type === 'TRIPWIRE' && t.hostId === hId)) {
        s = { ...s, tokens: [...s.tokens, { type: 'TRIPWIRE', hostId: hId }] };
      }
      s = addEvent(s, 'info', `[ MOTHER ] OVERWATCH · tripwire token placed on ${hId}`);
      break;
    }
    case 'TRACE_SPIKE': {
      const newTrace = clamp(s.trace + 15, 0, 100);
      s = { ...s, trace: newTrace };
      s = addEvent(s, 'fail', `[ MOTHER ] TRACE_SPIKE · +15 global trace → ${newTrace}/100`);
      break;
    }
    case 'ISOLATE': {
      if (target === null) break;
      const conn = CONNECTIONS.find(c => c.id === target);
      if (!conn || s.isolatedConnections.includes(target)) break;
      s = { ...s, isolatedConnections: [...s.isolatedConnections, target] };
      s = addEvent(s, 'fail', `[ MOTHER ] ISOLATE · connection [${target}] ${conn.from}→${conn.to} severed`);
      break;
    }
    case 'PURGE': {
      if (target === null) break;
      const hId = hostById(target);
      if (!hId) break;
      const host = s.hosts[hId];
      if (!host) break;
      const demoted = host.state === 'root' ? 'user' as const : 'visible' as const;
      s = {
        ...s,
        hosts: { ...s.hosts, [hId]: { ...host, state: demoted } },
        integrity: clamp(s.integrity - 10, 0, 100),
      };
      s = addEvent(s, 'fail',
        `[ MOTHER ] PURGE · ${hId} demoted to ${demoted} · Cradle Integrity -10 → ${s.integrity}/100`);
      break;
    }
  }

  // Record mother action for anti-repetition
  const record: MotherActionRecord = { action, target };
  s = {
    ...s,
    lastMotherActions: [...s.lastMotherActions.slice(-2), record],
  };

  return checkWinLose(s);
}

export function applyResistanceDialogue(state: GameState, text: string): GameState {
  return addDialogue(state, { speaker: 'RESISTANCE', text });
}

export function applyConsultDialogue(state: GameState, text: string): GameState {
  return addDialogue(state, { speaker: 'RESISTANCE', text, isConsult: true });
}

// ── Win / lose check ─────────────────────────────────────────────────

function checkWinLose(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  if (state.trace >= 100) {
    let s = addEvent(state, 'fail', `TRACE LOCK · Custodians converging · Resistance AI burning the channel`);
    return { ...s, status: 'lost_trace' };
  }
  if (state.integrity <= 0) {
    let s = addEvent(state, 'fail', `CRADLE INTEGRITY ZERO · Mother has walked back through the door you opened`);
    return { ...s, status: 'lost_cradle' };
  }
  return state;
}
