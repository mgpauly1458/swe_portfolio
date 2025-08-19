"use client";

import React, { useEffect, useRef } from 'react';
import WaveLanding from '../components/Wavelanding';
import BeachSection from '../components/BeachSection';
import WaterfallSection from '../components/WatterfallSection';
import { Box, Typography, Button } from '@mui/material';
import { gsap } from 'gsap';

export default function Home() {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const subHeaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Animate 'Welcome'
    if (headerRef.current) {
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -50,
        duration: 1,
        delay: 1, // Start 1 second after page load
      });
    }

    // Animate h5 text word by word
    if (subHeaderRef.current) {
      const subHeaderWords = subHeaderRef.current.innerHTML.split(' ');
      subHeaderRef.current.innerHTML = subHeaderWords
        .map((word: string) => `<span style="opacity: 0; display: inline-block;">${word}</span>`)
        .join(' ');

      const spans = subHeaderRef.current.querySelectorAll('span');
      spans.forEach((span: HTMLElement, i: number) => {
        gsap.to(span, {
          opacity: 1,
          duration: 0.3,
          delay: 2 + i * 0.1, // Start 1 second after 'Welcome' finishes, with 0.5s delay between words
        });
      });
    }
  }, []);

  const headerMarginTop = 20; // vh
  const ctaMarginTopAndBottom = 10; // px

  return (
    <Box>
      <WaveLanding>
        <Typography
          ref={headerRef}
          variant="h2"
          gutterBottom
          sx={{ color: 'black', margin: '5px 5px 5px 5px', marginTop: `${headerMarginTop}vh` }}
        >
          Welcome!
        </Typography>
        <Typography
          ref={subHeaderRef}
          variant="h5"
          sx={{ color: 'black' }}
        >
          I help businesses build and deploy software that solves real problems, from dashboards to AI-powered apps.
        </Typography>
      </WaveLanding>

      <BeachSection>
        <Typography variant="h2" gutterBottom sx={{ marginTop: `${headerMarginTop}vh` }}>
          Welcome to the Beach Section
        </Typography>
        <Typography variant="h5" gutterBottom>
          Smooth sandy animations and yellow theme.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ marginTop: `${ctaMarginTopAndBottom}px`, marginBottom: `${ctaMarginTopAndBottom}px` }}
        >
          Explore Projects
        </Button>
      </BeachSection>

      <WaterfallSection>
        <Typography variant="h2" gutterBottom sx={{ marginTop: `${headerMarginTop}vh` }}>
          Waterfall Section
        </Typography>
        <Typography variant="h5" gutterBottom>
          Green theme, with waterfall animations and accents.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          sx={{ marginTop: `${ctaMarginTopAndBottom}px`, marginBottom: `${ctaMarginTopAndBottom}px` }}
        >
          Get in Touch
        </Button>
      </WaterfallSection>
    </Box>
  );
}
