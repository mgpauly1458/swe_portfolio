import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Box, Typography } from '@mui/material';
import { gsap } from 'gsap';

export default function SpaceLanding() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appsRef = useRef<HTMLSpanElement | null>(null);
  const pipesRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
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

    type StarMetadata = {
      speed: number;
      phase: number;
      minSize: number;
      maxSize: number;
      brightness: number;
    };
    const starData: StarMetadata[] = []; // per-star twinkle metadata

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

    // Shooting stars: small white dot sprites that move mostly horizontally across the view
    type ShootingStar = {
      sprite: THREE.Sprite;
      velocity: THREE.Vector3;
      life: number;
      maxLife: number;
    };

    const shootingStars: ShootingStar[] = [];
    const shootingCount = 2; // a handful of small dots

    // createShootingStar accepts a direction: 1 => left-to-right, -1 => right-to-left
    const createShootingStar = (dir?: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // draw a soft circular dot with radial gradient
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(material);

      // determine horizontal direction (1 = left->right, -1 = right->left)
      const direction = typeof dir === 'number' ? dir : (Math.random() < 0.5 ? 1 : -1);

      // start X offscreen based on direction
      const startX = direction === 1 ? -1200 - Math.random() * 400 : 1200 + Math.random() * 400;
      const startY = (Math.random() - 0.5) * 1000; // spread vertically
      const startZ = -500 + Math.random() * 1000;
      sprite.position.set(startX, startY, startZ);

      // small dot size in world units
      const size = 6 + Math.random() * 6; // 6-12
      sprite.scale.set(size, size, 1);

      // mostly horizontal velocity, slight vertical jitter
      const speed = 500 + Math.random() * 700; // units/sec
      const vx = direction * speed;
      const vy = (Math.random() - 0.5) * 60; // small vertical component
      const vz = (Math.random() - 0.5) * 40;

      scene.add(sprite);

      // maxLife based on distance to cross screen at current speed (+some buffer)
      const distance = 2800; // rough distance to travel across view
      const maxLife = distance / Math.abs(vx);

      return {
        sprite,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: Math.random() * maxLife * 0.6, // staggered start
        maxLife,
      } as ShootingStar;
    };

    // Create exactly two shooting stars: one from left->right and one from right->left
    shootingStars.push(createShootingStar(1));
    shootingStars.push(createShootingStar(-1));

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

      const delta = clock.getDelta();
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
        (sizeAttr.array as any)[i] = star.minSize + (star.maxSize - star.minSize) * brightness;

        // Update color (brightness)
        (colorAttr.array as any)[i * 3 + 0] = brightness;
        (colorAttr.array as any)[i * 3 + 1] = brightness;
        (colorAttr.array as any)[i * 3 + 2] = brightness;
      }

      sizeAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Update shooting stars (small dots moving mostly horizontally)
      for (let i = 0; i < shootingStars.length; i++) {
        const s = shootingStars[i];
        s.life += delta;

        // advance position
        s.sprite.position.x += s.velocity.x * delta;
        s.sprite.position.y += s.velocity.y * delta;
        s.sprite.position.z += s.velocity.z * delta;

        // subtle vertical bob to avoid perfectly straight lines
        s.sprite.position.y += Math.sin((s.life + i) * 12) * 0.3;

        // fade in at start, fade out near end
        const t = Math.min(1, s.life / (s.maxLife * 0.15)); // fade-in portion
        const tt = s.life / s.maxLife; // overall life progress
        const mat = s.sprite.material as THREE.SpriteMaterial;
        // opacity ramps up quickly then slowly down
        mat.opacity = Math.max(0, (t < 1 ? t : 1) * (1 - Math.max(0, (tt - 0.75) / 0.25)));

        // reset if life ended or out of bounds
        if (s.life > s.maxLife || Math.abs(s.sprite.position.x) > 1600) {
          // reposition to left or right offscreen depending on original direction of travel
          const dir = Math.sign(s.velocity.x) || 1;
          s.sprite.position.set(dir === 1 ? -1200 - Math.random() * 400 : 1200 + Math.random() * 400, (Math.random() - 0.5) * 1000, -500 + Math.random() * 1000);
          const speed = 500 + Math.random() * 700;
          s.velocity.set(dir * speed, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40);
          s.life = 0;
          s.maxLife = 2800 / Math.abs(s.velocity.x);
          mat.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      // cleanup renderer & listeners
      mount.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);

      // dispose shooting star textures and materials
      shootingStars.forEach((s) => {
        try {
          const mat = s.sprite.material as THREE.SpriteMaterial;
          if (mat.map) mat.map.dispose();
          mat.dispose();
          scene.remove(s.sprite);
        } catch (e) {
          // ignore disposal errors
        }
      });
    };
  }, []);

  // GSAP-driven rotating words for the tagline (synchronized)
  useEffect(() => {
    const appsWords = ['Dashboards', 'Pipelines', 'Automation'];
    const appsColors = ['#FF6B6B', '#4D96FF', '#A28BFF', '#FF9F43', '#34D399'];

    const pipesWords = ['ML-Apps', 'CI/CD', 'CRM'];
    const pipesColors = ['#FFD166', '#06D6A0', '#118AB2', '#8ECAE6', '#EF476F'];

    const apps = appsRef.current;
    const pipes = pipesRef.current;
    if (!apps || !pipes) return;

    // initial state
    gsap.set([apps, pipes], { opacity: 1, y: 0 });
    let iA = 0;
    let iB = 0;

    apps.textContent = appsWords[0];
    apps.style.color = appsColors[0];
    pipes.textContent = pipesWords[0];
    pipes.style.color = pipesColors[0];

    const handles: any[] = [];
    const interval = 4; // seconds between synchronized rotations

    const next = () => {
      if (!apps || !pipes) return;
      const nextA = (iA + 1) % appsWords.length;
      const nextB = (iB + 1) % pipesWords.length;

      // animate both out in parallel, then swap text+color and animate in
      gsap.to(apps, {
        duration: 0.6,
        opacity: 0,
        y: -8,
        ease: 'power2.out',
        onComplete: () => {
          apps.textContent = appsWords[nextA];
          apps.style.color = appsColors[nextA % appsColors.length];
          gsap.fromTo(apps, { opacity: 0, y: 8 }, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' });
        },
      });

      gsap.to(pipes, {
        duration: 0.6,
        opacity: 0,
        y: -8,
        ease: 'power2.out',
        onComplete: () => {
          pipes.textContent = pipesWords[nextB];
          pipes.style.color = pipesColors[nextB % pipesColors.length];
          gsap.fromTo(pipes, { opacity: 0, y: 8 }, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' });
        },
      });

      iA = nextA;
      iB = nextB;

      handles.push(gsap.delayedCall(interval, next));
    };

    // start the synchronized loop
    handles.push(gsap.delayedCall(interval, next));

    return () => {
      handles.forEach((h) => h && h.kill && h.kill());
      gsap.killTweensOf(apps);
      gsap.killTweensOf(pipes);
    };
  }, []);

  return (
    <Box
      id="space"
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
            xs: 'clamp(2.2rem, 7vw, 3.2rem)', // mobile to small tablet
            sm: 'clamp(2.8rem, 6vw, 4.2rem)', // tablet
            md: 'clamp(3.2rem, 5vw, 5.2rem)', // desktop
          },
          lineHeight: 1.1,
          textShadow:
            '0 0 1px #00eaff, 0 0 2px #00eaff, 0 0 4px #00eaff, 0 0 0.5px #fff',
        }}
      >
        Maxwell Pauly
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          position: 'absolute',
          top: {
            xs: '48%',
            sm: '48.5%',
            md: '49%',
          },
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          zIndex: 1,
          textAlign: 'center',
          fontStyle: 'italic',
          fontFamily: 'Georgia, "Times New Roman", serif',
          opacity: 0.9,
          fontSize: {
            xs: 'clamp(1.1rem, 3.5vw, 1.5rem)',
            sm: 'clamp(1.2rem, 2.8vw, 1.7rem)',
            md: 'clamp(1.3rem, 2vw, 2rem)',
          },
        }}
      >
        Software Consulting
      </Typography>

      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          top: {
            xs: '60%',
            sm: '59.5%',
            md: '59%',
          },
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: { xs: '95%', sm: '90%', md: '80%' },
          px: { xs: 1, sm: 2, md: 0 },
          fontSize: {
            xs: 'clamp(1.25rem, 4vw, 1.7rem)',
            sm: 'clamp(1.35rem, 3vw, 2rem)',
            md: 'clamp(1.5rem, 2.2vw, 2.3rem)',
          },
        }}
      >
        I help businesses build and deploy software.<br />
        <span style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
          From
          <span
            ref={appsRef}
            style={{ display: 'inline-block', fontWeight: 700, margin: '0 8px', whiteSpace: 'nowrap' }}
          >
            apps
          </span>
          to
          <span
            ref={pipesRef}
            style={{ display: 'inline-block', fontWeight: 700, margin: '0 8px', whiteSpace: 'nowrap' }}
          >
            pipelines
          </span>
          .
        </span>
      </Typography>
    </Box>
  );
}


// I help businesses build and deploy software that solves real problems, from dashboards to AI-powered apps.
