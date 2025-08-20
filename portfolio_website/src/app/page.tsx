"use client";

import React, { useEffect, useRef } from 'react';
import SpaceLanding from '@/components/SpaceLanding';
import UnderwaterSection
 from '@/components/UnderwaterSection';
export default function Home() {

  return (
    <>
      <SpaceLanding />
      <UnderwaterSection />
    </>
  );
}
