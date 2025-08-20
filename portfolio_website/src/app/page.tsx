"use client";

import React, { useEffect, useRef } from 'react';
import SpaceLanding from '@/components/SpaceLanding';
import UnderwaterSection
 from '@/components/UnderwaterSection';
import RainforrestSection from '@/components/RainforrestSection';
import ScrollController from '@/components/ScrollController';
export default function Home() {

  return (
    <>
      <ScrollController />
      <SpaceLanding />
      <UnderwaterSection />
      <RainforrestSection />
    </>
  );
}
