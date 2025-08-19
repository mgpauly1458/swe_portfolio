"use client";

import { ReactNode, useEffect } from 'react';
import { Box } from '@mui/material';

export default function WaveLanding({ children }: { children: ReactNode }) {

  return (
    <Box id="waveLanding" sx={{ background: 'linear-gradient(to bottom, #9de3ffff, #ffffffff)', minHeight: '100vh', p: 4, textAlign: 'center' }}>
      {children}
    </Box>
  );
}
