import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePlaybackOptions {
  initialSpeed?: number; // steps per second
  onTick?: (tick: number) => void;
  maxTicks?: number;
}

export interface UsePlaybackReturn {
  isPlaying: boolean;
  tickCount: number;
  speed: number;
  setSpeed: (speed: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  step: () => void;
  reset: () => void;
}

export function usePlayback(options: UsePlaybackOptions = {}): UsePlaybackReturn {
  const { initialSpeed = 2, onTick, maxTicks } = options;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tickCount, setTickCount] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(initialSpeed);

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const maxTicksRef = useRef(maxTicks);
  maxTicksRef.current = maxTicks;

  const lastTickTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const step = useCallback((): void => {
    setTickCount((prev) => {
      const next = prev + 1;
      if (maxTicksRef.current !== undefined && next >= maxTicksRef.current) {
        setIsPlaying(false);
      }
      onTickRef.current?.(next);
      return next;
    });
  }, []);

  const reset = useCallback((): void => {
    setIsPlaying(false);
    setTickCount(0);
    onTickRef.current?.(0);
  }, []);

  const play = useCallback((): void => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback((): void => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback((): void => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    lastTickTimeRef.current = performance.now();

    const loop = (currentTime: number): void => {
      const interval = 1000 / speed;
      const elapsed = currentTime - lastTickTimeRef.current;

      if (elapsed >= interval) {
        lastTickTimeRef.current = currentTime - (elapsed % interval);
        step();
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, speed, step]);

  return {
    isPlaying,
    tickCount,
    speed,
    setSpeed,
    play,
    pause,
    togglePlay,
    step,
    reset,
  };
}
