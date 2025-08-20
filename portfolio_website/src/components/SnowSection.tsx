import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SnowSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const flakesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerHeight = container.offsetHeight;
    const containerWidth = container.offsetWidth;

    // Generation control
    const stopDuration = 3500; // stop generating after ~3.5 seconds
    let shouldGenerate = true;
    let genIntervalId: number | null = null;
    let stopTimeoutId: number | null = null;

    const createFlake = (): HTMLDivElement => {
      const size = Math.random() * 8 + 4; // 4px - 12px
      const flake = document.createElement('div') as HTMLDivElement;
      flake.style.position = 'absolute';
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.borderRadius = '50%';
      flake.style.background = 'rgba(255,255,255,0.9)';
      flake.style.pointerEvents = 'none';
      flake.style.opacity = '0';
      flake.style.top = `${-Math.random() * 30 - size}px`; // start slightly above
      flake.style.left = `${Math.random() * containerWidth}px`;
      flake.style.boxShadow = '0 0 6px rgba(255,255,255,0.35)';

      container.appendChild(flake);
      flakesRef.current.push(flake);
      return flake;
    };

    const animateFlakeOnce = (flake: HTMLDivElement) => {
      const duration = 3 + Math.random() * 3; // 3-6s fall
      const drift = (Math.random() - 0.5) * 200; // horizontal drift
      const rotate = (Math.random() - 0.5) * 360;

      gsap.fromTo(
        flake,
        { y: 0, x: 0, opacity: 0, rotation: 0 },
        {
          y: containerHeight + 50,
          x: `+=${drift}`,
          opacity: 1,
          rotation: rotate,
          duration,
          ease: 'none',
          onComplete: () => {
            if (flake.parentElement === container) container.removeChild(flake);
            flakesRef.current = flakesRef.current.filter((f) => f !== flake);
          },
        }
      );

      // gentle sway using a separate tween (killed on cleanup by gsap.killTweensOf)
      gsap.to(flake, {
        x: `+=${(Math.random() - 0.5) * 40}`,
        duration: 1 + Math.random() * 1.5,
        yoyo: true,
        repeat: Math.floor(duration),
        ease: 'sine.inOut',
      });
    };

    const startGenerating = () => {
      // small burst
      for (let i = 0; i < 10; i++) {
        const f = createFlake();
        gsap.delayedCall(Math.random() * 0.6, () => animateFlakeOnce(f));
      }

      const intervalMs = 120;
      genIntervalId = window.setInterval(() => {
        if (!shouldGenerate) return;
        const f = createFlake();
        animateFlakeOnce(f);
      }, intervalMs) as unknown as number;

      stopTimeoutId = window.setTimeout(() => {
        shouldGenerate = false;
        if (genIntervalId !== null) {
          clearInterval(genIntervalId);
          genIntervalId = null;
        }
      }, stopDuration) as unknown as number;
    };

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 50%',
      onEnter: () => startGenerating(),
      once: true,
    });

    return () => {
      if (stopTimeoutId !== null) clearTimeout(stopTimeoutId);
      if (genIntervalId !== null) clearInterval(genIntervalId);
      trigger.kill();

      gsap.killTweensOf('*');
      if (container) {
        flakesRef.current.forEach((f) => {
          if (f.parentElement === container) container.removeChild(f);
        });
      }
    };
  }, []);

  return (
    <Box
      id="snow"
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(to bottom, #1b3b6f, #ffffffff)',
        overflow: 'hidden',
      }}
    >
      {/* Snow section content */}
    </Box>
  );
}
