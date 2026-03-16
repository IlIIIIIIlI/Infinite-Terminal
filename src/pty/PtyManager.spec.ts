import { describe, expect, it, vi } from 'vitest';

import { PtyManager } from './PtyManager';

describe('PtyManager', () => {
  it('should report isAvailable based on node-pty load', () => {
    const mgr = new PtyManager();
    // isAvailable is a boolean getter — just verify it doesn't throw
    expect(typeof mgr.isAvailable).toBe('boolean');
    mgr.dispose();
  });

  it('should register data/exit/activity callbacks without throwing', () => {
    const mgr = new PtyManager();
    mgr.onData(vi.fn());
    mgr.onExit(vi.fn());
    mgr.onActivity(vi.fn());
    mgr.dispose();
  });

  it('should return false for spawn when node-pty is unavailable', () => {
    const mgr = new PtyManager();
    // If node-pty is available this will actually spawn — kill it after.
    // If not available it returns false immediately.
    if (!mgr.isAvailable) {
      const result = mgr.spawn('test-id', 'test', '', '/tmp', 80, 24);
      expect(result).toBe(false);
    }
    mgr.dispose();
  });
});
