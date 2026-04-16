'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts from 0 to `target` over `duration` seconds using an ease-out expo curve.
 * Only runs when `enabled` is true — hook into useInView to trigger on scroll.
 */
export function useCountUp(
  target: number,
  duration: number,
  enabled: boolean,
): number {
  const [count, setCount] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      // ease-out expo
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setCount(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, enabled]);

  return count;
}
