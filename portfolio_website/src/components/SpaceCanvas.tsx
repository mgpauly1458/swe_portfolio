"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { TextureLoader } from 'three';

export default function SpaceCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      5000
    );
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Satellite model + LED state
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
        const clientW = mount ? mount.clientWidth : window.innerWidth;
        let satScale = 400;
        let satX = -594;
        if (clientW <= 600) {
          satScale = 300;
          satX = -175;
        } else if (clientW <= 900) {
          satScale = 350;
          satX = -200;
        }
        satellite.position.set(satX, 288, -65);
        satellite.rotation.set(5.64, 3, 6);
        satellite.scale.set(satScale, satScale, satScale);

        try {
          const redLed = (satellite.children[0].children.find((child) => child.name === 'LED-Left') as THREE.Mesh) || undefined;
          const greenLed = (satellite.children[0].children.find((child) => child.name === 'LED-Right') as THREE.Mesh) || undefined;
          redLEDMesh = redLed;
          greenLEDMesh = greenLed;
          redLEDMaterial = redLed?.material as THREE.MeshStandardMaterial;
          greenLEDMaterial = greenLed?.material as THREE.MeshStandardMaterial;

          if (redLEDMesh && redLEDMaterial) {
            redLEDMesh.material = redLEDMaterial.clone();
            redLEDMaterial = redLEDMesh.material as THREE.MeshStandardMaterial;
          }
          if (greenLEDMesh && greenLEDMaterial) {
            greenLEDMesh.material = greenLEDMaterial.clone();
            greenLEDMaterial = greenLEDMesh.material as THREE.MeshStandardMaterial;
          }

          if (redLEDMaterial) {
            redBaseRoughness = typeof redLEDMaterial.roughness === 'number' ? redLEDMaterial.roughness : 0.5;
            redBaseMetalness = typeof redLEDMaterial.metalness === 'number' ? redLEDMaterial.metalness : 0;
          }
          if (greenLEDMaterial) {
            greenBaseRoughness = typeof greenLEDMaterial.roughness === 'number' ? greenLEDMaterial.roughness : 0.5;
            greenBaseMetalness = typeof greenLEDMaterial.metalness === 'number' ? greenLEDMaterial.metalness : 0;
          }

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
        } catch (e) {
          // ignore
        }

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
          sprite.renderOrder = 9999;
          return sprite;
        }

        redGlowSprite = makeGlow(0xff2b2b, 256);
        greenGlowSprite = makeGlow(0x2bff7a, 256);
        if (redGlowSprite) scene.add(redGlowSprite);
        if (greenGlowSprite) scene.add(greenGlowSprite);

        scene.add(satellite);
      },
      undefined,
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Error loading satellite.glb:', error);
      }
    );

    // Load background texture
    const textureLoader = new TextureLoader();
    let backgroundTexture: THREE.Texture | null = null;

    textureLoader.load('/space_background.jpg', (texture) => {
      scene.background = texture;
      backgroundTexture = texture;

      // Set wrapping and repeat properties to maintain aspect ratio
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(1, 1);

      updateBackgroundOffset(); // Set initial offset
    });

    const updateBackgroundOffset = () => {
      if (backgroundTexture) {
        const windowAspect = window.innerWidth / window.innerHeight;
        const textureAspect = backgroundTexture.image.width / backgroundTexture.image.height;

        const offsetX = -0.2;
        const offsetY = 0.2;

        if (windowAspect > textureAspect) {
          // Window is wider than texture
          backgroundTexture.repeat.set(1, textureAspect / windowAspect);
          backgroundTexture.offset.set(offsetX, (1 - textureAspect / windowAspect) / 2 + offsetY);
        } else {
          // Window is taller than texture
          backgroundTexture.repeat.set(windowAspect / textureAspect, 1);
          backgroundTexture.offset.set((1 - windowAspect / textureAspect) / 2 + offsetX+0.1, offsetY);
        }
      }
    };

    window.addEventListener('resize', updateBackgroundOffset);

    // Light
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(134, -1000, 906);
    dirLight.target.position.set(0, 0, 0);
    dirLight.intensity = 6.5;
    scene.add(dirLight);
    scene.add(dirLight.target);

    let dirLightOffsetX = 0;

    // Starfield
    const starCount = 1000;
    const positions: number[] = [];
    const sizes: number[] = [];
    const colors: number[] = [];

    type StarMetadata = { speed: number; phase: number; minSize: number; maxSize: number; brightness: number };
    const starData: StarMetadata[] = [];

    for (let i = 0; i < starCount; i++) {
      positions.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
      sizes.push(1 + Math.random() * 2);
      colors.push(1, 1, 1);
      starData.push({ speed: 0.5 + Math.random() * 2, phase: Math.random() * Math.PI * 2, minSize: 1, maxSize: 4, brightness: Math.random() });
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 2, transparent: true });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Shooting stars
    type ShootingStar = { sprite: THREE.Sprite; velocity: THREE.Vector3; life: number; maxLife: number };
    const shootingStars: ShootingStar[] = [];
    const createShootingStar = (dir?: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
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
      const direction = typeof dir === 'number' ? dir : (Math.random() < 0.5 ? 1 : -1);
      const startX = direction === 1 ? -1200 - Math.random() * 400 : 1200 + Math.random() * 400;
      const startY = (Math.random() - 0.5) * 1000;
      const startZ = -500 + Math.random() * 1000;
      sprite.position.set(startX, startY, startZ);
      const size = 6 + Math.random() * 6;
      sprite.scale.set(size, size, 1);
      const speed = 500 + Math.random() * 700;
      const vx = direction * speed;
      const vy = (Math.random() - 0.5) * 60;
      const vz = (Math.random() - 0.5) * 40;
      scene.add(sprite);
      const distance = 2800;
      const maxLife = distance / Math.abs(vx);
      return { sprite, velocity: new THREE.Vector3(vx, vy, vz), life: Math.random() * maxLife * 0.6, maxLife } as ShootingStar;
    };

    shootingStars.push(createShootingStar(1));
    shootingStars.push(createShootingStar(-1));

    // Resize
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
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
        try {
          dirLightOffsetX = dirLight.position.x - satellite.position.x;
        } catch (e) {
          // ignore
        }
      }
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    // LED blink scheduling
    const BLINK_INTERVAL = 3.0;
    const BLINK_DURATION = 0.18;
    const BLINK_RISE = 0.05;
    const BLINK_PEAK_INTENSITY = 15.0;

    let lastScheduledBlink = -BLINK_INTERVAL;
    let nextBlinkIsGreen = false;
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
        const twinkle = Math.abs(Math.sin(time * star.speed + star.phase));
        const blinkChance = Math.random();
        const brightness = blinkChance < 0.002 ? 1 : twinkle * 0.7 + 0.3;
        (sizeAttr.array as any)[i] = star.minSize + (star.maxSize - star.minSize) * brightness;
        (colorAttr.array as any)[i * 3 + 0] = brightness;
        (colorAttr.array as any)[i * 3 + 1] = brightness;
        (colorAttr.array as any)[i * 3 + 2] = brightness;
      }

      sizeAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      for (let i = 0; i < shootingStars.length; i++) {
        const s = shootingStars[i];
        s.life += delta;
        s.sprite.position.x += s.velocity.x * delta;
        s.sprite.position.y += s.velocity.y * delta;
        s.sprite.position.z += s.velocity.z * delta;
        s.sprite.position.y += Math.sin((s.life + i) * 12) * 0.3;
        const t = Math.min(1, s.life / (s.maxLife * 0.15));
        const tt = s.life / s.maxLife;
        const mat = s.sprite.material as THREE.SpriteMaterial;
        mat.opacity = Math.max(0, (t < 1 ? t : 1) * (1 - Math.max(0, (tt - 0.75) / 0.25)));
        if (s.life > s.maxLife || Math.abs(s.sprite.position.x) > 1600) {
          const dir = Math.sign(s.velocity.x) || 1;
          s.sprite.position.set(dir === 1 ? -1200 - Math.random() * 400 : 1200 + Math.random() * 400, (Math.random() - 0.5) * 1000, -500 + Math.random() * 1000);
          const speed = 500 + Math.random() * 700;
          s.velocity.set(dir * speed, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40);
          s.life = 0;
          s.maxLife = 2800 / Math.abs(s.velocity.x);
          mat.opacity = 0;
        }
      }

      // LED blink
      if (redLEDMaterial && greenLEDMaterial) {
        if (time - lastScheduledBlink >= BLINK_INTERVAL) {
          lastScheduledBlink = time;
          nextBlinkIsGreen = !nextBlinkIsGreen;
          activeBlinkStart = time;
          activeBlinkMaterial = nextBlinkIsGreen ? greenLEDMaterial : redLEDMaterial;
        }

        if (activeBlinkMaterial !== redLEDMaterial) {
          (redLEDMaterial as any).emissiveIntensity = 0;
          redLEDMaterial.roughness = redBaseRoughness;
          redLEDMaterial.metalness = redBaseMetalness;
        }
        if (activeBlinkMaterial !== greenLEDMaterial) {
          (greenLEDMaterial as any).emissiveIntensity = 0;
          greenLEDMaterial.roughness = greenBaseRoughness;
          greenLEDMaterial.metalness = greenBaseMetalness;
        }

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
            const norm = Math.min(1, Math.max(0, intensity / BLINK_PEAK_INTENSITY));
            const targetRoughness = Math.max(0, (activeBlinkMaterial === redLEDMaterial ? redBaseRoughness : greenBaseRoughness) - 0.7 * norm);
            const targetMetalness = Math.min(1, (activeBlinkMaterial === redLEDMaterial ? redBaseMetalness : greenBaseMetalness) + 0.9 * norm);
            activeBlinkMaterial.roughness = targetRoughness;
            activeBlinkMaterial.metalness = targetMetalness;

            const glowScaleBase = 60; // Increased base scale for more extravagant glow
            if (activeBlinkMaterial === redLEDMaterial && redGlowSprite && redLEDMesh) {
              redLEDMesh.getWorldPosition(redGlowSprite.position);
              const worldScale = redLEDMesh.getWorldScale(new THREE.Vector3()).x || 1;
              const spriteSize = glowScaleBase / Math.max(1, worldScale);
              (redGlowSprite.material as THREE.SpriteMaterial).opacity = norm * 1.5; // Increased opacity for stronger glow
              redGlowSprite.scale.set(spriteSize * (1 + norm * 5), spriteSize * (1 + norm * 5), 1); // Larger scaling effect
              (redGlowSprite.material as THREE.SpriteMaterial).color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`); // Add dynamic color pulsation
            }
            if (activeBlinkMaterial === greenLEDMaterial && greenGlowSprite && greenLEDMesh) {
              greenLEDMesh.getWorldPosition(greenGlowSprite.position);
              const worldScale = greenLEDMesh.getWorldScale(new THREE.Vector3()).x || 1;
              const spriteSize = glowScaleBase / Math.max(1, worldScale);
              (greenGlowSprite.material as THREE.SpriteMaterial).opacity = norm * 1.5; // Increased opacity for stronger glow
              greenGlowSprite.scale.set(spriteSize * (1 + norm * 5), spriteSize * (1 + norm * 5), 1); // Larger scaling effect
              (greenGlowSprite.material as THREE.SpriteMaterial).color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`); // Add dynamic color pulsation
            }
          } else {
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
            activeBlinkMaterial = null;
            activeBlinkStart = -1;
          }
        }
      }

      if (satellite) {
        satellite.position.x += delta * 10;
        dirLight.position.x = satellite.position.x + dirLightOffsetX;
        satellite.rotation.y += delta * 0.05;
        satellite.rotation.x += delta * 0.03;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      try {
        mount.removeChild(renderer.domElement);
      } catch (e) {
        // ignore
      }
      window.removeEventListener('resize', handleResize);

      shootingStars.forEach((s) => {
        try {
          const mat = s.sprite.material as THREE.SpriteMaterial;
          if (mat.map) mat.map.dispose();
          mat.dispose();
          scene.remove(s.sprite);
        } catch (e) {
          // ignore
        }
      });

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
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
