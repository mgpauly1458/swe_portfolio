"use client";

import React, { useRef, useEffect } from 'react';
import { Typography } from '@mui/material';
import { gsap } from 'gsap';

export default function TaglineRotator() {
  const appsRef = useRef<HTMLSpanElement | null>(null);
  const pipesRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const appsWords = ['Dashboards', 'Pipelines', 'Automation'];
    const appsColors = ['#FF6B6B', '#4D96FF', '#A28BFF', '#FF9F43', '#34D399'];

    const pipesWords = ['ML-Apps', 'CI/CD', 'CRM'];
    const pipesColors = ['#FFD166', '#06D6A0', '#118AB2', '#8ECAE6', '#EF476F'];

    const apps = appsRef.current;
    const pipes = pipesRef.current;
    if (!apps || !pipes) return;

    gsap.set([apps, pipes], { opacity: 1, y: 0 });
    let iA = 0;
    let iB = 0;

    apps.textContent = appsWords[0];
    apps.style.color = appsColors[0];
    pipes.textContent = pipesWords[0];
    pipes.style.color = pipesColors[0];

    const handles: any[] = [];
    const interval = 4;

    const next = () => {
      if (!apps || !pipes) return;
      const nextA = (iA + 1) % appsWords.length;
      const nextB = (iB + 1) % pipesWords.length;

      gsap.to(apps, {
        duration: 0.6,
        opacity: 0,
        y: -8,
        ease: 'power2.out',
        onComplete: () => {
          apps.textContent = appsWords[nextA];
          apps.style.color = appsColors[nextA];
          gsap.fromTo(apps, { opacity: 0, y: 8 }, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' });
        },
      });

      gsap.to(pipes, {
        duration: 0.6,
        opacity: 0,
        y: -8,
        ease: 'power2.out',
        onComplete: () => {
          pipes.textContent = pipesWords[nextB];
          pipes.style.color = pipesColors[nextB];
          gsap.fromTo(pipes, { opacity: 0, y: 8 }, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' });
        },
      });

      iA = nextA;
      iB = nextB;

      handles.push(gsap.delayedCall(interval, next));
    };

    handles.push(gsap.delayedCall(interval, next));

    return () => {
      handles.forEach((h) => h && h.kill && h.kill());
      gsap.killTweensOf(apps);
      gsap.killTweensOf(pipes);
    };
  }, []);

  return (
    <>
      <Typography
        variant="subtitle1"
        sx={{
          position: 'absolute',
          top: {
            xs: '48%',
            sm: '48.5%',
            md: '49%',
          },
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          zIndex: 1,
          textAlign: 'center',
          fontStyle: 'italic',
          fontFamily: 'Georgia, "Times New Roman", serif',
          opacity: 0.9,
          fontSize: {
            xs: 'clamp(1.1rem, 3.5vw, 1.5rem)',
            sm: 'clamp(1.2rem, 2.8vw, 1.7rem)',
            md: 'clamp(1.3rem, 2vw, 2rem)',
          },
        }}
      >
        Software Consulting
      </Typography>

      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          top: {
            xs: '60%',
            sm: '59.5%',
            md: '59%',
          },
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: { xs: '95%', sm: '90%', md: '80%' },
          px: { xs: 1, sm: 2, md: 0 },
          fontSize: {
            xs: 'clamp(1.25rem, 4vw, 1.7rem)',
            sm: 'clamp(1.35rem, 3vw, 2rem)',
            md: 'clamp(1.5rem, 2.2vw, 2.3rem)',
          },
        }}
      >
        I help businesses build and deploy software.<br />
        <span style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
          From
          <span
            ref={appsRef}
            style={{ display: 'inline-block', fontWeight: 700, margin: '0 8px', whiteSpace: 'nowrap' }}
          >
            apps
          </span>
          to
          <span
            ref={pipesRef}
            style={{ display: 'inline-block', fontWeight: 700, margin: '0 8px', whiteSpace: 'nowrap' }}
          >
            pipelines
          </span>
          .
        </span>
      </Typography>
    </>
  );
}
