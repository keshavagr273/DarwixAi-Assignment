import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVoicePipeline } from '../hooks/useVoicePipeline';

describe('useVoicePipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({}) } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak: vi.fn(), cancel: vi.fn() } });
  });

  it('creates both sessions after permission, then resets deterministic call state', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ call_session_id: 'call1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ session_id: 'agent1' }) });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useVoicePipeline('id_id'));
    await act(async () => { await result.current.startCall(); });
    expect(result.current.state.status).toBe('connected');
    expect(result.current.state.callSessionId).toBe('call1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    act(() => result.current.resetCall());
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.market).toBe('id_id');
  });

  it('does not call APIs when microphone permission is denied', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('denied'));
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useVoicePipeline());
    await act(async () => { await result.current.startCall(); });
    expect(result.current.state).toMatchObject({ status: 'idle', micPermission: 'denied' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces API startup failures rather than leaving a partial session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    const { result } = renderHook(() => useVoicePipeline());
    await act(async () => { await result.current.startCall(); });
    expect(result.current.state).toMatchObject({ status: 'idle', error: 'Failed to start call session' });
  });
});
