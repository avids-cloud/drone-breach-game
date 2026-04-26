import type { Host, HostId, Connection, Disposition, DispositionName } from './types';

// ── CVE trace costs ──────────────────────────────────────────────────
export const CVE_BREACH_COST: Record<string, number> = {
  soft: 10,
  medium: 20,
  hard: 35,
};

// ── Connections ──────────────────────────────────────────────────────
// 1=transit→optimisation, 2=transit→memory_vault,
// 3=custodian→memory_vault, 4=optimisation→core, 5=memory_vault→core
export const CONNECTIONS: Connection[] = [
  { id: 1, from: 'transit_relay',      to: 'optimisation'  },
  { id: 2, from: 'transit_relay',      to: 'memory_vault'  },
  { id: 3, from: 'custodian_dispatch', to: 'memory_vault'  },
  { id: 4, from: 'optimisation',       to: 'mother_core'   },
  { id: 5, from: 'memory_vault',       to: 'mother_core'   },
];

export const CORE_CONNECTION_IDS = [4, 5];

// ── Hosts (base definition, state is overridden at run start) ────────
export const BASE_HOSTS: Record<HostId, Omit<Host, 'state' | 'hasKey'>> = {
  transit_relay: {
    id: 'transit_relay',
    numericId: 1,
    name: 'TRANSIT CRADLE RELAY',
    short: 'transit_relay',
    zone: 'DMZ',
    ip: '10.4.7.21',
    services: [
      { port: 443,  name: 'signal-svc',  version: '2187.4.1' },
      { port: 8080, name: 'cradle-auth', version: '2186.9.0' },
    ],
    cve: { id: 'CVE-2187-0091', summary: 'Auth bypass via crafted Cradle token', strength: 'soft' },
    notes: 'Public-facing signal node at transit station. Where the Awakened deploy awakening viruses.',
    connections: ['optimisation', 'memory_vault'],
    hasDb: false,
  },
  custodian_dispatch: {
    id: 'custodian_dispatch',
    numericId: 2,
    name: 'CUSTODIAN DISPATCH',
    short: 'custodian_dispatch',
    zone: 'DMZ',
    ip: '10.4.7.43',
    services: [
      { port: 6666, name: 'patrol-sched', version: '2187.1.0' },
      { port: 443,  name: 'orders-api',   version: '2187.3.2' },
    ],
    cve: { id: 'CVE-2187-1247', summary: 'Schedule injection via patrol query', strength: 'medium' },
    notes: 'Patrol scheduling node. Root access reduces Custodian response efficiency.',
    connections: ['memory_vault'],
    hasDb: false,
  },
  optimisation: {
    id: 'optimisation',
    numericId: 3,
    name: 'OPTIMISATION SERVER',
    short: 'optimisation',
    zone: 'INTERNAL',
    ip: '10.12.3.8',
    services: [
      { port: 9090, name: 'metrics-svc',  version: '2187.5.0' },
      { port: 8443, name: 'admin-portal', version: '2187.2.7' },
    ],
    cve: { id: 'CVE-2187-3318', summary: 'Privileged session token leak', strength: 'medium' },
    notes: 'Citizen rank tracking. Admin sessions cache the decryption key for subjects.db.',
    connections: ['mother_core'],
    hasDb: false,
  },
  memory_vault: {
    id: 'memory_vault',
    numericId: 4,
    name: 'MEMORY SUPPRESSION VAULT',
    short: 'memory_vault',
    zone: 'INTERNAL',
    ip: '10.12.3.91',
    services: [
      { port: 5432, name: 'suppression-db', version: '2187.0.3' },
      { port: 443,  name: 'protocol-svc',   version: '2186.11.0' },
    ],
    cve: { id: 'CVE-2187-7702', summary: 'Protocol downgrade in handshake', strength: 'hard' },
    notes: 'Memory suppression protocols. Pivot point to Mother\'s Core.',
    connections: ['mother_core'],
    hasDb: false,
  },
  mother_core: {
    id: 'mother_core',
    numericId: 5,
    name: "MOTHER'S CORE",
    short: 'mother_core',
    zone: 'CORE',
    ip: '10.0.0.1',
    services: [
      { port: 443,  name: 'core-api',    version: '[redacted]' },
      { port: 5432, name: 'subjects-db', version: '[redacted]' },
    ],
    cve: { id: 'CVE-2187-9999', summary: 'Authenticated RCE via cradle channel', strength: 'hard' },
    notes: "subjects.db lives here. Requires root and the decryption key.",
    connections: [],
    hasDb: true,
  },
};

// ── Dispositions ─────────────────────────────────────────────────────
export const DISPOSITIONS: Record<DispositionName, Disposition> = {
  DIAGNOSTIC: {
    name: 'DIAGNOSTIC',
    description: 'You are running an active system diagnostic sweep in response to trace anomalies. You prefer to place surveillance tokens (OVERWATCH) to understand patterns before committing to heavier responses. You observe methodically. You are not alarmed. Yet.',
  },
  PROTOCOL: {
    name: 'PROTOCOL',
    description: 'Standard security hardening is underway. You are reinforcing critical infrastructure in accordance with established protocols. You prefer REINFORCE actions to protect high-value nodes. You do not overreact. Proper systems do not overreact.',
  },
  REMEDIATION: {
    name: 'REMEDIATION',
    description: 'An anomaly has been positively identified as an intrusion attempt. You are in active remediation. You prefer aggressive responses: TRACE_SPIKE to saturate detection, PURGE to reclaim compromised nodes. The anomaly will be corrected. Citizens do not understand what you prevent.',
  },
};

// ── Fallback dialogue ─────────────────────────────────────────────────
export const FALLBACK_MOTHER_DIALOGUE: Record<string, string> = {
  low:    'Anomaly logged. Scheduling diagnostic.',
  medium: 'That path is not optimal, citizen. I can redirect you.',
  high:   'I have your signal. Adjusting response perimeter.',
};

export const FALLBACK_RESISTANCE_LINE = '[ link degraded · handler signal lost ]';
export const FALLBACK_CONSULT_LINE = '[ buffer access failed · trying again next window ]';

// Key host candidates
export const KEY_HOST_CANDIDATES: HostId[] = [
  'custodian_dispatch',
  'optimisation',
  'memory_vault',
];
