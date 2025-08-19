"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function WaveLanding() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Plane geometry with BufferGeometry
    const geometry = new THREE.PlaneGeometry(10, 10, 50, 50);
    const material = new THREE.MeshStandardMaterial({ color: 0x1e88e5, wireframe: true });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);

    // Animate wave
    const positions = geometry.attributes.position.array;

    const animate = () => {
      requestAnimationFrame(animate);

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        positions[i + 2] = Math.sin(Date.now() * 0.001 + x + y) * 0.2; // z-value
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current!.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}
