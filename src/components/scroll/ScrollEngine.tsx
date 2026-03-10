'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eraStore } from '@/store/eraStore';
import { computeEraProgress } from '@/lib/scrollMath';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollEngine() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,       // CRITICAL: GSAP ticker owns the RAF loop
      lerp: 0.08,
      duration: 1.2,
    });
    lenisRef.current = lenis;

    // Lenis scroll events update ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // GSAP ticker drives Lenis — single unified RAF loop
    function update(time: number) {
      lenis.raf(time * 1000); // GSAP time is seconds; Lenis expects ms
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Global ScrollTrigger to produce normalized 0-1 progress
    const trigger = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const { currentEra, eraProgress } = computeEraProgress(self.progress);
        eraStore.setState({
          globalProgress: self.progress,
          currentEra,
          eraProgress,
        });
      },
    });

    // Debounced resize handler to refresh ScrollTrigger measurements
    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      gsap.ticker.remove(update);
      trigger.kill();
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null; // purely behavioral component
}
