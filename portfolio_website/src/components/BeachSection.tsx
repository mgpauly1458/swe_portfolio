"use client";

import { ReactNode, useEffect } from 'react';
import { Box } from '@mui/material';
import { gsap } from 'gsap';


export default function BeachSection({ children }: { children: ReactNode }) {
  return (
    <Box id="beachSection" sx={{ minHeight: '100vh', background: '#fff9c4', p: 4, textAlign: 'center' }}>
      {children}
    </Box>
  );
}
