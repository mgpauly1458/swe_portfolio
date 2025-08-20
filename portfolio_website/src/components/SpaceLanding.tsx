"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Box, Typography } from '@mui/material';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three-stdlib';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';

export default function SpaceLanding() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appsRef = useRef<HTMLSpanElement | null>(null);
  const pipesRef = useRef<HTMLSpanElement | null>(null);
  const nameRef = useRef<HTMLSpanElement | null>(null);
  // GSAP neon glow animation for "Maxwell Pauly"
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

  useEffect(() => {
    // guard: ensure this effect only runs in a browser environment
    if (typeof window === 'undefined') return;
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

    // Postprocessing (bloom)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    const USE_BLOOM = true;
    const bloomBaseStrength = 0.6; // lower baseline to avoid massive puffs
    if (USE_BLOOM) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 1.2, 0.4, 0.9);
      bloomPass.threshold = 0.45; // higher threshold so fewer surfaces bloom
      bloomPass.strength = bloomBaseStrength; // baseline strength
      bloomPass.radius = 0.5;
      composer.addPass(bloomPass);
    }

    // Satellite 3D model
    let satellite: THREE.Group | null = null;
    let redLEDMaterial: THREE.MeshStandardMaterial | undefined;
    let greenLEDMaterial: THREE.MeshStandardMaterial | undefined;
    let redLEDMesh: THREE.Mesh | undefined;
    let greenLEDMesh: THREE.Mesh | undefined;
    let redGlowSprite: THREE.Sprite | null = null;
    let greenGlowSprite: THREE.Sprite | null = null;
    let redBaseRoughness = 0.5;
    let greenBaseRoughness = 0.5;
    let redBaseMetalness = 0;
    let greenBaseMetalness = 0;

    const loader = new GLTFLoader();
    loader.load(
      '/satellite.glb',
      (gltf) => {
        satellite = gltf.scene;
        // Move the model to the top left of the screen and keep it in place
        // responsive placement/scale based on mount width
        const clientW = (mount && mount.clientWidth) ? mount.clientWidth : window.innerWidth;
        let satScale = 400;
        let satX = -594;
        // small (mobile)
        if (clientW <= 600) {
          satScale = 300;
          satX = -175;
        } else if (clientW <= 900) {
          // medium
          satScale = 350;
          satX = -200;
        }
        satellite.position.set(satX, 288, -65);
        satellite.rotation.set(5.64, 3, 6);
        satellite.scale.set(satScale, satScale, satScale); // responsive scale

        console.log('satellite', satellite);
        for (const child of satellite.children) {
          console.log('child', child);
        }
        const redLed = satellite.children[0].children.find((child) => child.name === 'LED-Left') as THREE.Mesh;
        const greenLed = satellite.children[0].children.find((child) => child.name === 'LED-Right') as THREE.Mesh;
        redLEDMesh = redLed;
        greenLEDMesh = greenLed;
        redLEDMaterial = redLed?.material as THREE.MeshStandardMaterial;
        greenLEDMaterial = greenLed?.material as THREE.MeshStandardMaterial;

        // Ensure LED meshes use unique/cloned materials so other parts of the model don't inherit bright emissive changes
        try {
          if (redLEDMesh && redLEDMaterial) {
            redLEDMesh.material = redLEDMaterial.clone();
            redLEDMaterial = redLEDMesh.material as THREE.MeshStandardMaterial;
          }
          if (greenLEDMesh && greenLEDMaterial) {
            greenLEDMesh.material = greenLEDMaterial.clone();
            greenLEDMaterial = greenLEDMesh.material as THREE.MeshStandardMaterial;
          }
        } catch (e) {
          // cloning may fail for some material setups; ignore and proceed
        }

        // store base material properties for brief specular flash
        if (redLEDMaterial) {
          redBaseRoughness = typeof redLEDMaterial.roughness === 'number' ? redLEDMaterial.roughness : 0.5;
          redBaseMetalness = typeof redLEDMaterial.metalness === 'number' ? redLEDMaterial.metalness : 0;
        }
        if (greenLEDMaterial) {
          greenBaseRoughness = typeof greenLEDMaterial.roughness === 'number' ? greenLEDMaterial.roughness : 0.5;
          greenBaseMetalness = typeof greenLEDMaterial.metalness === 'number' ? greenLEDMaterial.metalness : 0;
        }

        // initialize emissive colors & start with zero intensity
        if (redLEDMaterial) {
          redLEDMaterial.emissive = new THREE.Color(0xff2b2b);
          (redLEDMaterial as any).emissiveIntensity = 0;
          redLEDMaterial.needsUpdate = true;
        }
        if (greenLEDMaterial) {
          greenLEDMaterial.emissive = new THREE.Color(0x2bff7a);
          (greenLEDMaterial as any).emissiveIntensity = 0;
          greenLEDMaterial.needsUpdate = true;
        }

        // helper: create additive glow sprite for an LED
        function makeGlow(colorHex = 0xffffff, size = 128) {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext('2d')!;
          const cx = size / 2;
          const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
          grad.addColorStop(0, 'rgba(255,255,255,1)');
          const r = (colorHex >> 16) & 255;
          const g = (colorHex >> 8) & 255;
          const b = colorHex & 255;
          grad.addColorStop(0.2, `rgba(${r},${g},${b},0.95)`);
          grad.addColorStop(0.6, `rgba(${r},${g},${b},0.25)`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
          const tex = new THREE.CanvasTexture(canvas);
          tex.needsUpdate = true;
          const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true });
          const sprite = new THREE.Sprite(mat);
          sprite.scale.set(0, 0, 1);
          // ensure sprite renders on top of the model
          sprite.renderOrder = 9999;
          return sprite;
        }

        // create glow sprites and add to scene
        redGlowSprite = makeGlow(0xff2b2b, 256);
        greenGlowSprite = makeGlow(0x2bff7a, 256);
        if (redGlowSprite) scene.add(redGlowSprite);
        if (greenGlowSprite) scene.add(greenGlowSprite);

        scene.add(satellite);
        // once satellite is added we can compute the initial offset between light and satellite
        try {
          dirLightOffsetX = dirLight.position.x - satellite.position.x;
        } catch (e) {
          // ignore if dirLight/satellite not available yet
        }

      },
      undefined,
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Error loading satellite.glb:', error);
      }
    );

    // Light setup
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(134, -1000, 906); // shine from above and in front
    dirLight.target.position.set(0, 0, 0); // point at the center
    dirLight.intensity = 6.5;
    scene.add(dirLight);
    scene.add(dirLight.target);

    // offset used to keep the light following satellite x while preserving original offset
    let dirLightOffsetX = 0;

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
      // adjust satellite responsively when available
      if (satellite) {
        const clientW = mount.clientWidth;
        let satScale = 400;
        let satX = -594;
        if (clientW <= 600) {
          satScale = 300;
          satX = -175;
        } else if (clientW <= 900) {
          satScale = 350;
          satX = -200;
        }
        satellite.scale.set(satScale, satScale, satScale);
        satellite.position.x = satX;
        // update light offset to preserve relative light position
        try {
          if (typeof dirLight !== 'undefined') {
            dirLightOffsetX = dirLight.position.x - satellite.position.x;
          }
        } catch (e) {
          // ignore if dirLight not available
        }
      }
    };
    window.addEventListener('resize', handleResize);


    // Animate
    const clock = new THREE.Clock();

    // LED blink scheduling and state
    const BLINK_INTERVAL = 3.0; // seconds between blinks
    const BLINK_DURATION = 0.18; // total blink duration (rise+fall)
    const BLINK_RISE = 0.05; // seconds to rise to peak
    const BLINK_PEAK_INTENSITY = 15.0; // very bright peak

    let lastScheduledBlink = -BLINK_INTERVAL; // so first scheduled at t>=0
    let nextBlinkIsGreen = false; // start with red if you want red first
    let activeBlinkStart = -1;
    let activeBlinkMaterial: THREE.MeshStandardMaterial | null = null;

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

      // Animate LED blinking
      if (redLEDMaterial && greenLEDMaterial) {
        // scheduling: trigger a blink every BLINK_INTERVAL seconds, alternating LEDs
        if (time - lastScheduledBlink >= BLINK_INTERVAL) {
          lastScheduledBlink = time;
          // flip which LED will blink next
          nextBlinkIsGreen = !nextBlinkIsGreen;
          activeBlinkStart = time;
          activeBlinkMaterial = nextBlinkIsGreen ? greenLEDMaterial : redLEDMaterial;
        }

        // ensure non-active LED is off
        if (activeBlinkMaterial !== redLEDMaterial) {
          (redLEDMaterial as any).emissiveIntensity = 0;
          // reset material physical properties
          redLEDMaterial.roughness = redBaseRoughness;
          redLEDMaterial.metalness = redBaseMetalness;
        }
        if (activeBlinkMaterial !== greenLEDMaterial) {
          (greenLEDMaterial as any).emissiveIntensity = 0;
          greenLEDMaterial.roughness = greenBaseRoughness;
          greenLEDMaterial.metalness = greenBaseMetalness;
        }

        // animate current blink (quick bright pulse)
        if (activeBlinkMaterial && activeBlinkStart >= 0) {
          const tBlink = time - activeBlinkStart;
          if (tBlink <= BLINK_DURATION) {
            let intensity = 0;
            if (tBlink < BLINK_RISE) {
              intensity = BLINK_PEAK_INTENSITY * (tBlink / BLINK_RISE);
            } else {
              intensity = BLINK_PEAK_INTENSITY * (1 - (tBlink - BLINK_RISE) / (BLINK_DURATION - BLINK_RISE));
            }
            (activeBlinkMaterial as any).emissiveIntensity = intensity;

            // normalized 0..1 for secondary effects
            const norm = Math.min(1, Math.max(0, intensity / BLINK_PEAK_INTENSITY));

            // specular pop: lower roughness and raise metalness briefly
            const targetRoughness = Math.max(0, (activeBlinkMaterial === redLEDMaterial ? redBaseRoughness : greenBaseRoughness) - 0.7 * norm);
            const targetMetalness = Math.min(1, (activeBlinkMaterial === redLEDMaterial ? redBaseMetalness : greenBaseMetalness) + 0.9 * norm);
            activeBlinkMaterial.roughness = targetRoughness;
            activeBlinkMaterial.metalness = targetMetalness;

            // glow sprite effects: position at LED and scale/opacity with intensity
            const glowScaleBase = 40; // tune this if too big/small
            if (activeBlinkMaterial === redLEDMaterial && redGlowSprite && redLEDMesh) {
              redLEDMesh.getWorldPosition(redGlowSprite.position);
              // scale the sprite relative to world scale so a huge model doesn't make the sprite massive
              const worldScale = redLEDMesh.getWorldScale(new THREE.Vector3()).x || 1;
              const spriteSize = glowScaleBase / Math.max(1, worldScale);
              (redGlowSprite.material as THREE.SpriteMaterial).opacity = norm;
              redGlowSprite.scale.set(spriteSize * (1 + norm * 3), spriteSize * (1 + norm * 3), 1);
            }
            if (activeBlinkMaterial === greenLEDMaterial && greenGlowSprite && greenLEDMesh) {
              greenLEDMesh.getWorldPosition(greenGlowSprite.position);
              const worldScale = greenLEDMesh.getWorldScale(new THREE.Vector3()).x || 1;
              const spriteSize = glowScaleBase / Math.max(1, worldScale);
              (greenGlowSprite.material as THREE.SpriteMaterial).opacity = norm;
              greenGlowSprite.scale.set(spriteSize * (1 + norm * 3), spriteSize * (1 + norm * 3), 1);
            }

            // light bloom strength pulse (subtle)
            if (bloomPass) {
              bloomPass.strength = bloomBaseStrength + norm * 1.2; // smaller pulse to avoid huge bleeds
            }
          } else {
            // blink finished
            (activeBlinkMaterial as any).emissiveIntensity = 0;
            if (activeBlinkMaterial === redLEDMaterial) {
              redLEDMaterial.roughness = redBaseRoughness;
              redLEDMaterial.metalness = redBaseMetalness;
              if (redGlowSprite) {
                (redGlowSprite.material as THREE.SpriteMaterial).opacity = 0;
                redGlowSprite.scale.set(0, 0, 1);
              }
            }
            if (activeBlinkMaterial === greenLEDMaterial) {
              greenLEDMaterial.roughness = greenBaseRoughness;
              greenLEDMaterial.metalness = greenBaseMetalness;
              if (greenGlowSprite) {
                (greenGlowSprite.material as THREE.SpriteMaterial).opacity = 0;
                greenGlowSprite.scale.set(0, 0, 1);
              }
            }

            // reset bloom
            if (bloomPass) bloomPass.strength = bloomBaseStrength;

            activeBlinkMaterial = null;
            activeBlinkStart = -1;
          }
        }
      }

      // Hold satellite in the top left for debugging
      if (satellite) {
        satellite.position.x += delta * 10;
        // make the directional light follow satellite x (preserves initial offset)
        dirLight.position.x = satellite.position.x + dirLightOffsetX;
        // Optionally, rotate for realism
        satellite.rotation.y += delta * 0.05;
        satellite.rotation.x += delta * 0.03;
      }

      // render with composer if bloom enabled
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
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

      // dispose glow sprites
      try {
        if (redGlowSprite) {
          const m = redGlowSprite.material as THREE.SpriteMaterial;
          if (m.map) m.map.dispose();
          m.dispose();
          scene.remove(redGlowSprite);
        }
        if (greenGlowSprite) {
          const m = greenGlowSprite.material as THREE.SpriteMaterial;
          if (m.map) m.map.dispose();
          m.dispose();
          scene.remove(greenGlowSprite);
        }
      } catch (e) {
        // ignore
      }

      // composer cleanup (if any)
      try {
        if (composer) {
          // no standardized dispose for composer, but remove refs
          composer = null;
          bloomPass = null;
        }
      } catch (e) {
        // ignore
      }

      // remove satellite
      if (satellite) {
        scene.remove(satellite);
      }
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
          apps.style.color = appsColors[nextA];
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
          pipes.style.color = pipesColors[nextB];
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
          textShadow: '0 0 2px #00eaff, 0 0 2px #00eaff, 0 0 4px #00eaff, 0 0 1px #fff',
          transition: 'text-shadow 0.5s',
        }}
      >
        <span ref={nameRef}>Maxwell Pauly</span>
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
