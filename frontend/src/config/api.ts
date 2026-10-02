// Central API & WebSocket configuration for local dev and cloud deployment
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const SERVER_ROOT = rawApiBase.replace(/\/api\/v1$/, '');
export const API_BASE = rawApiBase.endsWith('/api/v1') ? rawApiBase : `${rawApiBase}/api/v1`;
export const WS_BASE = SERVER_ROOT.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
