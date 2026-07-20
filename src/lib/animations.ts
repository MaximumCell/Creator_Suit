/**
 * Cinematic animation primitives for the landing page. All hooks are
 * SSR-safe (they guard against missing window/IntersectionObserver).
 *
 * - `useReveal`  — fades + lifts a node into view when it scrolls in
 * - `useMouseTilt` — 3D perspective tilt that follows the cursor
 * - `useMouseGlow` — radial-gradient glow that follows the cursor
 * - `useCountUp` — animated number counter triggered on reveal
 */
'use client';

import { useEffect, useRef, useState } from 'react';

/** Fade + lift a node into view once when it scrolls into the viewport. */
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('fade-up');
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/** Set --x / --y CSS vars on the element so a radial-gradient can follow. */
export function useMouseGlow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - r.left}px`);
      el.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);
  return ref;
}

/** 3D perspective tilt that follows the cursor (subtle, like a parallax card). */
export function useMouseTilt<T extends HTMLElement>(strength = 6) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1400px) rotateX(${-y * strength}deg) rotateY(${x * (strength + 2)}deg) translateZ(0)`;
      });
    };
    const onLeave = () => {
      el.style.transform = 'perspective(1400px) rotateX(0) rotateY(0)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

/** Animated number counter, eased in over ~1.6s once the element scrolls in. */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  end: number,
  { duration = 1600, threshold = 0.4 }: { duration?: number; threshold?: number } = {},
) {
  const [n, setN] = useState(0);
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(end * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration, threshold]);
  return { n, ref };
}

/** Format helper for CountUp displays (1.2M / 184K / 96 / etc). */
export function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}
