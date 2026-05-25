import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFadeIn } from './useFadeIn';

describe('useFadeIn Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes as false', () => {
    const { result } = renderHook(() => useFadeIn());
    expect(result.current).toBe(false);
  });

  it('turns true after the default 50ms delay', () => {
    const { result } = renderHook(() => useFadeIn());
    
    expect(result.current).toBe(false);
    
    act(() => {
      vi.advanceTimersByTime(50);
    });
    
    expect(result.current).toBe(true);
  });

  it('respects a custom delay parameter', () => {
    const { result } = renderHook(() => useFadeIn(500));
    
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe(false); // Still false at 499ms
    
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true); // Flips to true at exactly 500ms
  });

  it('clears the timeout on unmount to prevent memory leaks', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useFadeIn());
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});