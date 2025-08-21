"use client";

import React, { useRef, useEffect } from 'react';
import { Typography } from '@mui/material';
import { gsap } from 'gsap';

export default function NeonName() {
  const nameRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!nameRef.current) return;
    const el = nameRef.current;
    const glow1 = '0 0 2px #00eaff, 0 0 2px #00eaff, 0 0 4px #00eaff, 0 0 1px #fff';
    const glow2 = '0 0 3px #00eaff, 0 0 3px #00eaff, 0 0 6px #00eaff, 0 0 1.5px #fff';
    gsap.set(el, { textShadow: glow1 });
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(el, {
      duration: 1.2,
      textShadow: glow2,
      ease: 'power1.inOut',
    }).to(el, {
      duration: 1.2,
      textShadow: glow1,
      ease: 'power1.inOut',
    });
    return () => {
      tl.kill();
      gsap.set(el, { textShadow: glow1 });
    };
  }, []);

  return (
    <Typography
      variant="h3"
      gutterBottom
      sx={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#A8F6FF',
        zIndex: 1,
        textAlign: 'center',
        fontWeight: 700,
        letterSpacing: '0.5px',
        fontSize: {
          xs: 'clamp(2.2rem, 7vw, 3.2rem)',
          sm: 'clamp(2.8rem, 6vw, 4.2rem)',
          md: 'clamp(3.2rem, 5vw, 5.2rem)',
        },
        lineHeight: 1.1,
        textShadow: '0 0 2px #00eaff, 0 0 2px #00eaff, 0 0 4px #00eaff, 0 0 1px #fff',
        transition: 'text-shadow 0.5s',
      }}
    >
      <span ref={nameRef}>Maxwell Pauly</span>
    </Typography>
  );
}
