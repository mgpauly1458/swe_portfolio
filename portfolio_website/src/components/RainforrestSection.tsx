"use client";

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function RainforestSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftLeavesRef = useRef<HTMLDivElement[]>([]);
  const rightLeavesRef = useRef<HTMLDivElement[]>([]);

  const NUM_LEAVES = 30; // per side
  const ANIMATION_DURATION = 4; // seconds for leaves to fall

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    const container = containerRef.current;
    if (!container) return; // guard against missing ref at mount

    // Debug: ensure we have a real DOM node and its size
    console.log('Rainforest container:', container);
    const containerHeight = container.offsetHeight || container.getBoundingClientRect().height;
    const containerWidth = container.offsetWidth || container.getBoundingClientRect().width;
    const columnWidth = containerWidth * 0.25; // 25% width per side

    const createLeaves = (side: 'left' | 'right') => {
      const leavesArray: HTMLDivElement[] = [];
      for (let i = 0; i < NUM_LEAVES; i++) {
        const width = Math.random() * 20 + 20; // 20px - 40px wide
        const height = width * (0.5 + Math.random() * 0.5); // rectangular-ish
        const leaf = document.createElement('div');
        leaf.style.position = 'absolute';
        leaf.style.width = `${width}px`;
        leaf.style.height = `${height}px`;
        leaf.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%'; // organic leaf shape
        leaf.style.background = 'linear-gradient(to bottom right, #228B22, #006400)';
        leaf.style.pointerEvents = 'none';
        // start visible; we'll animate opacity to 0 as they fall
        leaf.style.opacity = '1';
        // start slightly above the top
        leaf.style.top = `-${Math.random() * 50 + height}px`;
        leaf.style.left =
          side === 'left'
            ? `${Math.random() * columnWidth}px`
            : `${containerWidth - columnWidth + Math.random() * columnWidth}px`;
        // do NOT set an inline transform rotate here; gsap will manage transforms to avoid overwrite

        // make the element GPU-accelerated for smoother transforms
        leaf.style.willChange = 'transform, opacity';

        container.appendChild(leaf);
        // use gsap.set to set initial rotation (avoids clobbering transform when gsap animates translateY)
        gsap.set(leaf, { rotation: Math.random() * 360, transformOrigin: '50% 50%' });

        leavesArray.push(leaf);
      }
      return leavesArray;
    };

    leftLeavesRef.current = createLeaves('left');
    rightLeavesRef.current = createLeaves('right');

    const animateLeavesOnce = (leaves: HTMLDivElement[]) => {
      const timeline = gsap.timeline();
      leaves.forEach((leaf) => {
        const drift = (Math.random() - 0.5) * 200; // allow more drift
        const spin = Math.random() * 360;
        const duration = ANIMATION_DURATION + Math.random() * 2;

        // animate using gsap.to (leaf already has rotation set), animate rotation further and opacity down
        timeline.to(
          leaf,
          {
            y: containerHeight + 200, // fall below bottom
            x: `+=${drift}`, // drift sideways
            rotation: `+=${spin}`, // spin a bit more
            opacity: 0,
            duration,
            ease: 'power1.inOut',
          },
          0
        );
      });
      return timeline;
    };

    // ScrollTrigger: animate leaves when section ~50% in view
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 50%',
      onEnter: () => {
        console.log('Rainforest section entered viewport — starting leaf animation');
        animateLeavesOnce(leftLeavesRef.current);
        animateLeavesOnce(rightLeavesRef.current);
      },
      once: true,
      // debug markers to see trigger positions while developing
      markers: false,
    });

    // in some cases ScrollTrigger needs a refresh after elements added
    ScrollTrigger.refresh();

    return () => {
      if (trigger && typeof (trigger as any).kill === 'function') (trigger as any).kill();

      // kill any leaf tweens
      try {
        gsap.killTweensOf([...leftLeavesRef.current, ...rightLeavesRef.current]);
      } catch (e) {
        // ignore if nothing to kill
      }

      // remove leaves safely
      if (container) {
        [...leftLeavesRef.current, ...rightLeavesRef.current].forEach((l) => {
          if (l && l.parentElement === container) container.removeChild(l);
        });
      }

      // clear refs
      leftLeavesRef.current = [];
      rightLeavesRef.current = [];
    };
  }, []);

  return (
    <Box
      id="rainforest"
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: 'url(/rainforrestBackground.png)', // Set the background image
        backgroundSize: 'var(--background-zoom, cover)', // Allow zoom customization
        backgroundPosition: 'var(--background-offset-x, center) var(--background-offset-y, center)', // Allow offset customization
        backgroundRepeat: 'no-repeat',
      }}
      >
      {/* Rainforest content goes here */}
    </Box>
  );
}

// for reference
//background: 'linear-gradient(to bottom, #013220, #116530)', // rainforest greens