"use client";

import { ReactNode, useEffect } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function WaterfallSection({ children }: { children: ReactNode }) {

  return (
    <Box id="waterfallSection" sx={{ minHeight: '100vh', p: 4, textAlign: 'center', background: '#cafecfff' }}>
      {children}
    </Box>
  );
}
