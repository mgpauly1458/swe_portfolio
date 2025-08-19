"use client";

import { ReactNode, useEffect } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function WaterfallSection({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.to('body', {
      backgroundColor: '#c8e6c9', // green waterfall
      scrollTrigger: {
        trigger: '#waterfallSection',
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
    });
  }, []);

  return (
    <Box id="waterfallSection" sx={{ minHeight: '100vh', p: 4, textAlign: 'center' }}>
      {children}
    </Box>
  );
}
