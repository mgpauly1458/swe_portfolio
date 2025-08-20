"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function WaveLanding({ children }: { children: ReactNode }) {
  const threeContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threeContainerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      threeContainerRef.current?.clientWidth / threeContainerRef.current?.clientHeight || 1,
      0.1,
      1000
    );
    camera.position.set(0, 1, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      threeContainerRef.current?.clientWidth || window.innerWidth,
      threeContainerRef.current?.clientHeight || window.innerHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    threeContainerRef.current?.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 0); // Set background to transparent

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load model
    const loader = new GLTFLoader();
    const animateFunctions: (() => void)[] = [];
    loader.load('/server.glb', (gltf) => {
      const model = gltf.scene;
      // console log all the object names and materials
      const assembly = model.children[0];
      for (const part of assembly.children) {
        console.log(`Part: ${part.name}`);
        if (part.name === 'ServerBox') {
          console.log('found server box');
          // change color to #79746DFF
          const newMaterial = new THREE.MeshStandardMaterial({ color: 0x79746d });
          (part as THREE.Mesh).material = newMaterial;
        }
      }
      scene.add(model);
    });

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth inertia
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      animateFunctions.forEach((fn) => fn());
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!threeContainerRef.current) return;
      camera.aspect =
        threeContainerRef.current?.clientWidth / threeContainerRef.current?.clientHeight || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(
        threeContainerRef.current?.clientWidth || window.innerWidth,
        threeContainerRef.current?.clientHeight || window.innerHeight
      );
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <Box
      id="waveLanding"
      sx={{
        background: 'linear-gradient(to bottom, #9de3ffff, #ffffffff)',
        minHeight: '100vh',
        p: 4,
        textAlign: 'center',
      }}
    >
      {children}
      <div
        ref={threeContainerRef}
        style={{ width: '100%', height: '20vh', marginTop: '20px' }}
      ></div>
    </Box>
  );
}
