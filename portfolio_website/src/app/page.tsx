"use client";

import WaveLanding from '../components/Wavelanding';
import BeachSection from '../components/BeachSection';
import WaterfallSection from '../components/WatterfallSection';
import { Box, Typography, Button } from '@mui/material';

export default function Home() {
  return (
    <Box>
      <WaveLanding />
      
      <BeachSection>
        <Typography variant="h3" gutterBottom>
          Welcome to the Beach Section
        </Typography>
        <Typography variant="body1" gutterBottom>
          Smooth sandy animations and yellow theme.
        </Typography>
        <Button variant="contained" color="primary">
          Explore Projects
        </Button>
      </BeachSection>

      <WaterfallSection>
        <Typography variant="h3" gutterBottom>
          Waterfall Section
        </Typography>
        <Typography variant="body1" gutterBottom>
          Green theme, with waterfall animations and accents.
        </Typography>
        <Button variant="contained" color="secondary">
          Get in Touch
        </Button>
      </WaterfallSection>
    </Box>
  );
}
