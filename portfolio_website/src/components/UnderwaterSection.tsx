"use client";

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function UnderwaterSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftBubblesRef = useRef<HTMLDivElement[]>([]);
  const rightBubblesRef = useRef<HTMLDivElement[]>([]);

  const NUM_BUBBLES = 30; // per side

  useEffect(() => {
    // ensure only runs in browser
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const containerHeight = container.offsetHeight;
    const containerWidth = container.offsetWidth;
    const columnWidth = containerWidth * 0.25; // 25% width for left/right columns

    // Generation control
    const stopDuration = 3000; // stop generating after 3 seconds
    let shouldGenerate = true;
    let genIntervalId: number | null = null;
    let stopTimeoutId: number | null = null;

    // Helper: create a single bubble DOM element for a side
    const createBubble = (side: 'left' | 'right'): HTMLDivElement => {
      const size = Math.random() * 20 + 20; // 20px - 40px
      const bubble = document.createElement('div') as HTMLDivElement;
      bubble.style.position = 'absolute';
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.borderRadius = '50%';
      bubble.style.background = 'rgba(255,255,255,0.7)';
      bubble.style.pointerEvents = 'none';
      bubble.style.opacity = '0'; // start hidden until animated
      bubble.style.bottom = `-${Math.random() * 50 + size}px`; // start below bottom
      bubble.style.left =
        side === 'left'
          ? `${Math.random() * columnWidth}px`
          : `${containerWidth - columnWidth + Math.random() * columnWidth}px`;

      container.appendChild(bubble);

      // track for possible debugging/cleanup
      if (side === 'left') leftBubblesRef.current.push(bubble);
      else rightBubblesRef.current.push(bubble);

      return bubble;
    };

    // Animate a single bubble once and remove it when finished
    const animateBubbleOnce = (bubble: HTMLDivElement) => {
      const duration = 1 + Math.random() * 1.5; // 1-2.5s
      // position transform: use translateY so we don't conflict with bottom style on reset
      gsap.fromTo(
        bubble,
        { y: 0, opacity: 1 },
        {
          y: -containerHeight - 50,
          opacity: 0,
          duration,
          ease: 'power1.out',
          onComplete: () => {
            // remove bubble from DOM when its one-shot animation finishes
            if (bubble.parentElement === container) {
              container.removeChild(bubble);
            }
            // also remove from refs arrays
            leftBubblesRef.current = leftBubblesRef.current.filter((b) => b !== bubble);
            rightBubblesRef.current = rightBubblesRef.current.filter((b) => b !== bubble);
          },
        }
      );
    };

    // Function to start generating bubbles at a steady rate
    const startGenerating = () => {
      // immediate small burst so the effect isn't empty on enter
      for (let i = 0; i < 6; i++) {
        const bL = createBubble('left');
        const bR = createBubble('right');
        // stagger start slightly for the burst
        gsap.delayedCall(Math.random() * 0.6, () => animateBubbleOnce(bL));
        gsap.delayedCall(Math.random() * 0.6, () => animateBubbleOnce(bR));
      }

      // then generate continuously until stopped
      const intervalMs = 150; // how often to spawn new bubbles per side
      genIntervalId = window.setInterval(() => {
        if (!shouldGenerate) return;
        const bL = createBubble('left');
        const bR = createBubble('right');
        animateBubbleOnce(bL);
        animateBubbleOnce(bR);
      }, intervalMs) as unknown as number;

      // stop generating after configured duration (let existing animations finish)
      stopTimeoutId = window.setTimeout(() => {
        shouldGenerate = false;
        if (genIntervalId !== null) {
          clearInterval(genIntervalId);
          genIntervalId = null;
        }
      }, stopDuration) as unknown as number;
    };

    // Create a ScrollTrigger to start the bubble generation when the section is visible
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 50%',
      onEnter: () => {
        startGenerating();
      },
      once: true,
    });

    return () => {
      // cleanup timers and ScrollTrigger
      if (stopTimeoutId !== null) clearTimeout(stopTimeoutId);
      if (genIntervalId !== null) clearInterval(genIntervalId);
      trigger.kill();

      // on unmount remove any remaining bubbles and kill any tweens
      gsap.killTweensOf('*');
      if (container) {
        [...leftBubblesRef.current, ...rightBubblesRef.current].forEach((b) => {
          if (b.parentElement === container) container.removeChild(b);
        });
      }
    };
  }, []);

  return (
    <Box
      id="underwater"
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(to bottom, #001f3f, #0074d9)',
        overflow: 'hidden',
      }}
    >
      {/* Underwater content goes here */}
    </Box>
  );
}
