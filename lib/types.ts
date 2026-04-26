// ── Host ────────────────────────────────────────────────────────────
export type HostId =
  | 'transit_relay'
  | 'custodian_dispatch'
  | 'optimisation'
  | 'memory_vault'
  | 'mother_core';

export type HostState = 'hidden' | 'visible' | 'scanned' | 'user' | 'root';
export type Zone = 'DMZ' | 'INTERNAL' | 'CORE';
export type CVEStrength = 'soft' | 'medium' | 'hard';

export interface CVE {
  id: string;
  summary: string;
  strength: CVEStrength;
}

export interface ServiceEntry {
  port: number;
  name: string;
  version: string;
}

export interface Host {
  id: HostId;
  numericId: number;
  name: string;
  short: string;
  zone: Zone;
  ip: string;
  services: ServiceEntry[];
  cve: CVE;
  state: HostState;
  notes: string;
  connections: HostId[];
  hasKey: boolean;
  hasDb: boolean;
}

// ── Tokens ──────────────────────────────────────────────────────────
export type TokenType = 'SHIELD' | 'TRIPWIRE' | 'SPOOF_TRAIL';

export interface Token {
  type: TokenType;
  hostId: HostId;
}

// ── Connections ─────────────────────────────────────────────────────
export interface Connection {
  id: number;
  from: HostId;
  to: HostId;
}

// ── Disposition ─────────────────────────────────────────────────────
export type DispositionName = 'DIAGNOSTIC' | 'PROTOCOL' | 'REMEDIATION';

export interface Disposition {
  name: DispositionName;
  description: string;
}

// ── Mother actions ──────────────────────────────────────────────────
export type MotherActionType = 'REINFORCE' | 'OVERWATCH' | 'TRACE_SPIKE' | 'ISOLATE' | 'PURGE';

export interface MotherActionRecord {
  action: MotherActionType;
  target: number | null; // numeric host or connection id, null for TRACE_SPIKE
}

export interface MotherResponse {
  action: MotherActionType;
  target: number | null;
  dialogue: string;
}

export interface AvailableMotherAction {
  action: MotherActionType;
  targets: (number | null)[];
}

// ── Player actions ───────────────────────────────────────────────────
export type PlayerActionType = 'SCAN' | 'BREACH' | 'SPOOF' | 'EXFIL' | 'CONSULT';

// ── Event log ───────────────────────────────────────────────────────
export type EventKind = 'info' | 'success' | 'fail';

export interface EventEntry {
  t: number;
  kind: EventKind;
  msg: string;
}

// ── Dialogue ────────────────────────────────────────────────────────
export type Speaker = 'MOTHER' | 'RESISTANCE';

export interface DialogueLine {
  speaker: Speaker;
  text: string;
  isConsult?: boolean;
}

// ── Game status ──────────────────────────────────────────────────────
export type GameStatus = 'playing' | 'won_exfil' | 'lost_trace' | 'lost_cradle';

// ── Full game state ──────────────────────────────────────────────────
export interface GameState {
  hosts: Record<HostId, Host>;
  trace: number;
  integrity: number;
  turn: number;
  disposition: Disposition;
  keyHostId: HostId; // which host holds the decryption key
  keyAcquired: boolean;
  tokens: Token[];
  isolatedConnections: number[]; // connection ids
  lastMotherActions: MotherActionRecord[];
  consultUsed: boolean;
  status: GameStatus;
  events: EventEntry[];
  dialogue: DialogueLine[];
  busy: boolean; // LLM calls in flight
}
