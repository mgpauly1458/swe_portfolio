import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Box, Typography } from '@mui/material';

export default function SpaceLanding() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // Scene and Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      5000
    );
    camera.position.z = 500;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Starfield
    const starCount = 1000;
    const positions = [];
    const sizes = [];
    const colors = [];

    const starData = []; // per-star twinkle metadata

    for (let i = 0; i < starCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );

      sizes.push(1 + Math.random() * 2); // initial size
      colors.push(1, 1, 1); // white

      // metadata: twinkle speed, phase, target brightness
      starData.push({
        speed: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        minSize: 1,
        maxSize: 4,
        brightness: Math.random(),
      });
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    starGeometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(sizes, 1)
    );
    starGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 2,
      transparent: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Resize handler
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animate
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      const sizeAttr = starGeometry.getAttribute('size');
      const colorAttr = starGeometry.getAttribute('color');

      for (let i = 0; i < starCount; i++) {
        const star = starData[i];
        // dramatic twinkle: sinusoidal + random triggers
        const twinkle = Math.abs(Math.sin(time * star.speed + star.phase));
        const blinkChance = Math.random();
        const brightness = blinkChance < 0.002 ? 1 : twinkle * 0.7 + 0.3; // occasional flash

        // Update size
        sizeAttr.array[i] = star.minSize + (star.maxSize - star.minSize) * brightness;

        // Update color (brightness)
        colorAttr.array[i * 3 + 0] = brightness;
        colorAttr.array[i * 3 + 1] = brightness;
        colorAttr.array[i * 3 + 2] = brightness;
      }

      sizeAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mount.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box
      ref={mountRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="h2"
        gutterBottom
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        Welcome to the Space Landing
      </Typography>
    </Box>
  );
}
