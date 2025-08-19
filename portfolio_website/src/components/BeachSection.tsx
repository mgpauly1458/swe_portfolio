"use client";

import { ReactNode, useEffect } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function BeachSection({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.to('body', {
      backgroundColor: '#fff9c4', // sandy yellow
      scrollTrigger: {
        trigger: '#beachSection',
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
    });
  }, []);

  return (
    <Box id="beachSection" sx={{ minHeight: '100vh', p: 4, textAlign: 'center' }}>
      {children}
    </Box>
  );
}
