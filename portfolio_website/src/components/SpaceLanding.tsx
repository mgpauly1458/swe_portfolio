"use client";

import React from 'react';
import { Box } from '@mui/material';
import SpaceCanvas from './SpaceCanvas';
import NeonName from './NeonName';
import TaglineRotator from './TaglineRotator';

export default function SpaceLanding() {
  return (
    <Box
      id="space"
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <NeonName />
      <TaglineRotator />
      <SpaceCanvas />
    </Box>
  );
}


// I help businesses build and deploy software that solves real problems, from dashboards to AI-powered apps.
