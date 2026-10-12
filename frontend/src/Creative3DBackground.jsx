import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { isReducedMotion } from './motion';
import { Lightning, Broadcast } from '@phosphor-icons/react';

/**
 * Creative 3D Director — Master WebGL & Motion Experience
 *
 * Implements:
 * 1. Multi-layered 3D Scene:
 *    - Undulating Cybernetic Topographical Grid (Procedural Vertex Wave)
 *    - Holographic Kinetic Core (Nested Geodesic Icosahedron + Precessing Orbital Rings)
 *    - Neural Constellation (Interconnected 3D Data Nodes & Drift Lines)
 *    - Deep Ambient Particle Dust (Dynamic Depth Attenuation)
 * 2. GSAP Choreography:
 *    - Smooth Mouse Parallax Tilt via damped quickTo coordinates
 *    - Cinematic Camera Transitions on Route Changes
 *    - Energy Wave Bursts and Interactive Dynamic Modes
 * 3. Strict Performance & Lifecycle:
 *    - Clamped DPR (Math.min(window.devicePixelRatio, 2))
 *    - Auto-pause when tab is inactive (document.visibilityState)
 *    - Complete buffer & material disposal on unmount
 *    - prefers-reduced-motion compliance
 */

export default function Creative3DBackground({ currentRoute = 'feed' }) {
  const mountRef = useRef(null);
  const canvasRef = useRef(null);

  // Dynamic Scene Mode: 'reactive' | 'cinematic' | 'hyperwave' | 'minimal'
  const [motionMode, setMotionMode] = useState('reactive');
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [fpsDisplay, setFpsDisplay] = useState(60);

  // State refs for animation loop
  const stateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    coreGroup: null,
    outerIcosahedron: null,
    innerCore: null,
    ring1: null,
    ring2: null,
    satellites: null,
    satGeo: null,
    terrainMesh: null,
    particles: null,
    constellationPoints: null,
    constellationLines: null,
    constellationPositions: null,
    constellationVelocities: null,
    time: 0,
    waveSpeed: 0.8,
    waveHeight: 1.6,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    cameraBase: { x: 0, y: 3.5, z: 12, rotX: -0.22, rotY: 0, rotZ: 0 },
    animFrameId: null,
    isMounted: true,
    lastFrameTime: 0,
    frameCount: 0,
    fpsTimer: 0,
  });

  // Handle route-specific camera and scene targets
  useEffect(() => {
    const s = stateRef.current;
    if (!s.camera) return;
    const reduced = isReducedMotion();

    // Define choreographed camera perspectives per route
    const routePresets = {
      feed: {
        x: 1.2,
        y: 3.2,
        z: 11.5,
        rotX: -0.20,
        rotY: -0.08,
        coreX: 4.8,
        coreY: 0.6,
        coreScale: 1.1,
        waveSpeed: 0.75,
        waveHeight: 1.4,
      },
      discover: {
        x: -0.5,
        y: 6.2,
        z: 13.0,
        rotX: -0.42,
        rotY: 0.04,
        coreX: 3.5,
        coreY: 2.2,
        coreScale: 1.3,
        waveSpeed: 1.1,
        waveHeight: 1.9,
      },
      explore: {
        x: -0.5,
        y: 6.2,
        z: 13.0,
        rotX: -0.42,
        rotY: 0.04,
        coreX: 3.5,
        coreY: 2.2,
        coreScale: 1.3,
        waveSpeed: 1.1,
        waveHeight: 1.9,
      },
      community: {
        x: -2.8,
        y: 2.8,
        z: 10.2,
        rotX: -0.18,
        rotY: 0.16,
        coreX: -4.2,
        coreY: 0.4,
        coreScale: 1.25,
        waveSpeed: 0.9,
        waveHeight: 1.6,
      },
      channel: {
        x: 0.0,
        y: 2.0,
        z: 9.8,
        rotX: -0.14,
        rotY: 0.0,
        coreX: 4.2,
        coreY: -0.4,
        coreScale: 0.95,
        waveSpeed: 0.6,
        waveHeight: 1.2,
      },
      profile: {
        x: 0.0,
        y: 1.8,
        z: 8.8,
        rotX: -0.12,
        rotY: 0.0,
        coreX: 0.0,
        coreY: 1.2,
        coreScale: 1.35,
        waveSpeed: 0.5,
        waveHeight: 1.0,
      },
      post_detail: {
        x: 2.2,
        y: 2.6,
        z: 10.5,
        rotX: -0.16,
        rotY: -0.14,
        coreX: 5.0,
        coreY: 0.8,
        coreScale: 1.0,
        waveSpeed: 0.65,
        waveHeight: 1.3,
      },
      create_post: {
        x: 0.0,
        y: 4.0,
        z: 11.0,
        rotX: -0.28,
        rotY: 0.0,
        coreX: -3.8,
        coreY: 1.6,
        coreScale: 1.15,
        waveSpeed: 0.9,
        waveHeight: 1.7,
      },
      login: {
        x: 0.0,
        y: 2.5,
        z: 10.8,
        rotX: -0.18,
        rotY: 0.0,
        coreX: 0.0,
        coreY: 0.2,
        coreScale: 1.2,
        waveSpeed: 0.7,
        waveHeight: 1.4,
      },
      register: {
        x: 0.0,
        y: 3.2,
        z: 11.2,
        rotX: -0.22,
        rotY: 0.0,
        coreX: 0.0,
        coreY: 0.4,
        coreScale: 1.25,
        waveSpeed: 0.8,
        waveHeight: 1.5,
      },
    };

    const target = routePresets[currentRoute] || routePresets.feed;

    // Smooth GSAP choreography between camera viewpoints
    const tl = gsap.timeline({ defaults: { duration: 1.4, ease: 'power2.out' } });

    tl.to(s.cameraBase, {
      x: target.x,
      y: target.y,
      z: target.z,
      rotX: target.rotX,
      rotY: target.rotY,
    }, 0);

    if (s.coreGroup) {
      tl.to(s.coreGroup.position, {
        x: target.coreX,
        y: target.coreY,
        ease: 'power2.out',
      }, 0);

      tl.to(s.coreGroup.scale, {
        x: target.coreScale,
        y: target.coreScale,
        z: target.coreScale,
        ease: 'power2.out',
      }, 0);
    }

    tl.to(s, {
      waveSpeed: target.waveSpeed,
      waveHeight: target.waveHeight,
      ease: 'power2.out',
    }, 0);

  }, [currentRoute]);

  // Burst energy wave on demand
  const triggerPulseBurst = useCallback(() => {
    const s = stateRef.current;
    if (!s.renderer || isReducedMotion()) return;

    gsap.fromTo(
      s,
      { waveSpeed: 3.2, waveHeight: 2.8 },
      { waveSpeed: 0.8, waveHeight: 1.5, duration: 1.8, ease: 'expo.out' }
    );

    if (s.outerIcosahedron) {
      gsap.fromTo(
        s.outerIcosahedron.scale,
        { x: 1.6, y: 1.6, z: 1.6 },
        { x: 1.0, y: 1.0, z: 1.0, duration: 1.4, ease: 'elastic.out(1, 0.4)' }
      );
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const s = stateRef.current;
    s.isMounted = true;
    s.lastFrameTime = performance.now();
    s.fpsTimer = performance.now();

    // --- 1. Architectural Foundation ---
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020305, 0.038);
    s.scene = scene;

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 80);
    camera.position.set(s.cameraBase.x, s.cameraBase.y, s.cameraBase.z);
    camera.rotation.x = s.cameraBase.rotX;
    s.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    s.renderer = renderer;

    // --- 2. Lighting & Visual Atmosphere ---
    const ambientLight = new THREE.AmbientLight(0x1a2632, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xc4f36b, 2.0); // Neon Lime Accent
    keyLight.position.set(10, 12, 10);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdf7d78, 1.8); // Neon Coral/Magenta Accent
    rimLight.position.set(-10, -6, -8);
    scene.add(rimLight);

    const pointGlow = new THREE.PointLight(0x00f0ff, 2.5, 20, 1.2);
    pointGlow.position.set(0, 2, 4);
    scene.add(pointGlow);

    // --- 3. Kinetic Holographic Polyhedral Core ---
    const coreGroup = new THREE.Group();
    coreGroup.position.set(4.8, 0.6, 0);
    scene.add(coreGroup);
    s.coreGroup = coreGroup;

    // Outer Geodesic Icosahedron Wireframe
    const icoGeometry = new THREE.IcosahedronGeometry(1.6, 1);
    const icoMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4f36b,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x3d5c14,
      emissiveIntensity: 0.45,
    });
    const outerIcosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    coreGroup.add(outerIcosahedron);
    s.outerIcosahedron = outerIcosahedron;

    // Inner Glowing Core Sphere
    const sphereGeometry = new THREE.SphereGeometry(0.85, 24, 24);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x050d0a,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x86efac,
      emissiveIntensity: 0.35,
    });
    const innerCore = new THREE.Mesh(sphereGeometry, sphereMaterial);
    coreGroup.add(innerCore);
    s.innerCore = innerCore;

    // Precessing Gyro Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.022, 16, 96);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xc4f36b,
      transparent: true,
      opacity: 0.55,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);
    s.ring1 = ring1;

    const ringGeo2 = new THREE.TorusGeometry(2.45, 0.018, 16, 96);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xdf7d78,
      transparent: true,
      opacity: 0.45,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    coreGroup.add(ring2);
    s.ring2 = ring2;

    // Orbiting Telemetry Micro-Satellites
    const satGeo = new THREE.OctahedronGeometry(0.14, 0);
    const satellites = [
      { radius: 2.8, speed: 0.7, offset: 0, color: 0xc4f36b },
      { radius: 3.3, speed: -0.5, offset: Math.PI * 0.7, color: 0x00f0ff },
      { radius: 2.5, speed: 1.0, offset: Math.PI * 1.4, color: 0xdf7d78 },
    ].map((cfg) => {
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(satGeo, mat);
      coreGroup.add(mesh);
      return { ...cfg, mesh, mat };
    });
    s.satellites = satellites;
    s.satGeo = satGeo;

    // --- 4. Undulating Cybernetic Topographical Grid (Smooth Wave Matrix) ---
    const terrainWidth = 56;
    const terrainHeight = 48;
    const terrainSegmentsW = 44;
    const terrainSegmentsH = 38;
    const terrainGeometry = new THREE.PlaneGeometry(
      terrainWidth,
      terrainHeight,
      terrainSegmentsW,
      terrainSegmentsH
    );
    terrainGeometry.rotateX(-Math.PI / 2);
    terrainGeometry.translate(0, -2.6, -2);

    // Save initial plane coordinates for procedural displacement
    const posAttribute = terrainGeometry.attributes.position;
    const initialPositions = posAttribute.array.slice();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x051d18,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.25,
    });
    const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    scene.add(terrainMesh);
    s.terrainMesh = terrainMesh;

    // --- 5. Atmospheric Deep Particle Field ---
    const particleCount = 750;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorLime = new THREE.Color(0xc4f36b);
    const colorCoral = new THREE.Color(0xdf7d78);
    const colorWhite = new THREE.Color(0x94a3b8);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      particlePositions[idx] = (Math.random() - 0.5) * 44;
      particlePositions[idx + 1] = (Math.random() - 0.2) * 26;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 36;

      const pick = Math.random();
      const col = pick > 0.65 ? colorLime : pick > 0.4 ? colorCoral : colorWhite;
      particleColors[idx] = col.r;
      particleColors[idx + 1] = col.g;
      particleColors[idx + 2] = col.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    s.particles = particles;

    // --- 6. Interconnected Neural Constellation (Data Network) ---
    const nodeCount = 42;
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeVelocities = [];

    for (let i = 0; i < nodeCount; i++) {
      const idx = i * 3;
      nodePositions[idx] = (Math.random() - 0.5) * 24;
      nodePositions[idx + 1] = (Math.random() - 0.2) * 12 + 1;
      nodePositions[idx + 2] = (Math.random() - 0.5) * 16 - 2;

      nodeVelocities.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: (Math.random() - 0.5) * 0.006,
        vz: (Math.random() - 0.5) * 0.008,
      });
    }

    const constellationGeo = new THREE.BufferGeometry();
    constellationGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    const constellationMat = new THREE.PointsMaterial({
      color: 0xc4f36b,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const constellationPoints = new THREE.Points(constellationGeo, constellationMat);
    scene.add(constellationPoints);
    s.constellationPoints = constellationPoints;
    s.constellationPositions = nodePositions;
    s.constellationVelocities = nodeVelocities;

    // Dynamic Line segments connecting adjacent constellation nodes
    const maxLines = 120;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xc4f36b,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });
    const constellationLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(constellationLines);
    s.constellationLines = constellationLines;

    // --- 7. Mouse Pointer Parallax Tracking ---
    const handlePointerMove = (e) => {
      if (isReducedMotion()) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      s.mouse.targetX = nx;
      s.mouse.targetY = ny;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // --- 8. Window Resize Handler ---
    const handleResize = () => {
      if (!container || !s.renderer || !s.camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      s.camera.aspect = w / h;
      s.camera.updateProjectionMatrix();
      s.renderer.setSize(w, h);
      s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    // --- 9. Visibility / Auto-Pause (Zero GPU drain when backgrounded) ---
    let isPageVisible = true;
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // --- 10. Main Render & Animation Loop ---
    const renderLoop = () => {
      if (!s.isMounted) return;

      s.animFrameId = requestAnimationFrame(renderLoop);

      // Measure FPS for HUD display
      s.frameCount++;
      const now = performance.now();
      if (now - s.fpsTimer > 1000) {
        setFpsDisplay(Math.round((s.frameCount * 1000) / (now - s.fpsTimer)));
        s.frameCount = 0;
        s.fpsTimer = now;
      }

      if (!isPageVisible) return;

      const delta = Math.min((now - s.lastFrameTime) * 0.001, 0.1);
      s.lastFrameTime = now;
      const reduced = isReducedMotion();
      const speedMult = reduced ? 0.3 : 1.0;
      s.time += delta * s.waveSpeed * speedMult;

      // Mouse Lerp (Smooth camera damping)
      s.mouse.x += (s.mouse.targetX - s.mouse.x) * 0.05;
      s.mouse.y += (s.mouse.targetY - s.mouse.y) * 0.05;

      // Camera Parallax
      const mouseFactor = reduced ? 0.3 : 1.0;
      s.camera.position.x = s.cameraBase.x + s.mouse.x * (1.2 * mouseFactor);
      s.camera.position.y = s.cameraBase.y + s.mouse.y * (0.8 * mouseFactor);
      s.camera.position.z = s.cameraBase.z;

      s.camera.rotation.x = s.cameraBase.rotX + s.mouse.y * (0.05 * mouseFactor);
      s.camera.rotation.y = s.cameraBase.rotY - s.mouse.x * (0.07 * mouseFactor);

      // Animate Holographic Polyhedral Core
      if (s.coreGroup) {
        s.outerIcosahedron.rotation.x += 0.003 * speedMult;
        s.outerIcosahedron.rotation.y += 0.006 * speedMult;

        s.innerCore.rotation.y -= 0.004 * speedMult;

        s.ring1.rotation.z += 0.010 * speedMult;
        s.ring1.rotation.x = Math.PI / 3 + Math.sin(s.time * 0.6) * 0.15;

        s.ring2.rotation.y -= 0.012 * speedMult;
        s.ring2.rotation.z = Math.PI / 6 + Math.cos(s.time * 0.5) * 0.18;

        // Core subtle breathing float
        s.coreGroup.position.y += Math.sin(s.time * 1.2) * (0.0025 * speedMult);

        // Animate Orbiting Telemetry Micro-Satellites
        if (s.satellites) {
          s.satellites.forEach((sat) => {
            const angle = s.time * sat.speed * speedMult + sat.offset;
            sat.mesh.position.x = Math.cos(angle) * sat.radius;
            sat.mesh.position.y = Math.sin(angle * 1.4) * (sat.radius * 0.35);
            sat.mesh.position.z = Math.sin(angle) * sat.radius;
            sat.mesh.rotation.x += 0.02 * speedMult;
            sat.mesh.rotation.y += 0.03 * speedMult;
          });
        }
      }

      // Procedural Smooth Wave Displacement on Topographical Grid (with Pointer Ripple)
      if (s.terrainMesh) {
        const positions = s.terrainMesh.geometry.attributes.position;
        const pArr = positions.array;
        const count = pArr.length / 3;
        const t = s.time * 1.2;
        const wh = s.waveHeight;

        // Pointer coords projected onto terrain plane
        const mx = s.mouse.x * 16;
        const mz = -s.mouse.y * 12;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const ox = initialPositions[idx];
          const oz = initialPositions[idx + 2];

          // Harmonic smooth organic cyber-wave
          const wave1 = Math.sin(ox * 0.18 + t * 0.7) * Math.cos(oz * 0.20 + t * 0.5);
          const wave2 = Math.sin((ox + oz) * 0.10 + t * 0.35) * 0.5;

          // Tactile pointer energy ripple (attenuated with distance)
          const distSq = (ox - mx) * (ox - mx) + (oz - mz) * (oz - mz);
          const ripple = Math.exp(-distSq * 0.03) * 0.65 * Math.sin(t * 3.2 - Math.sqrt(distSq) * 1.3);

          pArr[idx + 1] = (wave1 + wave2 + ripple) * wh;
        }
        positions.needsUpdate = true;
      }

      // Drift Atmospheric Particles
      if (s.particles) {
        s.particles.rotation.y += 0.0005 * speedMult;
        s.particles.rotation.x = Math.sin(s.time * 0.2) * 0.03;
      }

      // Update Constellation Nodes & Dynamic Connecting Links
      if (s.constellationPositions && s.constellationVelocities) {
        const p = s.constellationPositions;
        const v = s.constellationVelocities;
        const n = nodeCount;

        for (let i = 0; i < n; i++) {
          const idx = i * 3;
          p[idx] += v[i].vx * speedMult;
          p[idx + 1] += v[i].vy * speedMult;
          p[idx + 2] += v[i].vz * speedMult;

          // Soft boundary bounds bounce
          if (p[idx] < -12 || p[idx] > 12) v[i].vx *= -1;
          if (p[idx + 1] < -2 || p[idx + 1] > 8) v[i].vy *= -1;
          if (p[idx + 2] < -10 || p[idx + 2] > 6) v[i].vz *= -1;
        }
        s.constellationPoints.geometry.attributes.position.needsUpdate = true;

        // Connect nearby nodes with lines
        let lineIdx = 0;
        const lp = s.constellationLines.geometry.attributes.position.array;
        const maxDistSq = 14.0;

        for (let i = 0; i < n && lineIdx < maxLines * 6; i++) {
          const i3 = i * 3;
          for (let j = i + 1; j < n && lineIdx < maxLines * 6; j++) {
            const j3 = j * 3;
            const dx = p[i3] - p[j3];
            const dy = p[i3 + 1] - p[j3 + 1];
            const dz = p[i3 + 2] - p[j3 + 2];
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < maxDistSq) {
              lp[lineIdx++] = p[i3];
              lp[lineIdx++] = p[i3 + 1];
              lp[lineIdx++] = p[i3 + 2];
              lp[lineIdx++] = p[j3];
              lp[lineIdx++] = p[j3 + 1];
              lp[lineIdx++] = p[j3 + 2];
            }
          }
        }

        // Clear remaining line coordinates
        for (let k = lineIdx; k < maxLines * 6; k++) {
          lp[k] = 0;
        }
        s.constellationLines.geometry.attributes.position.needsUpdate = true;
      }

      s.renderer.render(s.scene, s.camera);
    };

    renderLoop();

    // --- Cleanup & Memory Disposal ---
    return () => {
      s.isMounted = false;
      if (s.animFrameId) cancelAnimationFrame(s.animFrameId);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Dispose all Geometries & Materials
      [
        icoGeometry,
        sphereGeometry,
        ringGeo1,
        ringGeo2,
        s.satGeo,
        terrainGeometry,
        particleGeometry,
        constellationGeo,
        lineGeometry,
      ].forEach((g) => g && g.dispose());

      if (s.satellites) {
        s.satellites.forEach((sat) => sat.mat && sat.mat.dispose());
      }

      [
        icoMaterial,
        sphereMaterial,
        ringMat1,
        ringMat2,
        terrainMaterial,
        particleMaterial,
        constellationMat,
        lineMaterial,
      ].forEach((m) => m && m.dispose());

      if (s.renderer && !container.isConnected) {
        s.renderer.dispose();
      }
    };
  }, []);

  return (
    <>
      {/* Fixed Fullscreen WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="creative-3d-director-stage"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 20%, #061118 0%, #000000 80%)',
        }}
        aria-hidden="true"
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            opacity: motionMode === 'minimal' ? 0.35 : 0.95,
            transition: 'opacity 0.4s ease',
          }}
        />
      </div>

      {/* Interactive 3D Director HUD Overlay Control (Bottom Right) */}
      <aside
        className="creative-3d-director-hud"
        aria-label="3D Engine HUD and Motion Controls"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '18px',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          userSelect: 'none',
        }}
      >
        {/* Expandable Controls Panel */}
        {isHudOpen && (
          <div
            style={{
              background: 'rgba(5, 8, 12, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--neon-cyan)',
              padding: '12px 14px',
              borderRadius: '4px',
              color: 'var(--text-pure)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minWidth: '220px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
                // 3D MOTION ENGINE
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {fpsDisplay} FPS
              </span>
            </div>

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Live Choreography Telemetry */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                fontSize: '0.64rem',
                color: 'var(--text-secondary)',
                padding: '4px 6px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '2px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-dim)' }}>LOC: </span>
                <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{currentRoute.toUpperCase()}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>GRID: </span>
                <span style={{ color: '#c4f36b', fontWeight: 600 }}>REACTIVE</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>NODES: </span>
                <span style={{ color: '#ededed' }}>42 LINKED</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>DRONES: </span>
                <span style={{ color: '#df7d78' }}>3 ACTIVE</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>MOTION PRESET</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {[
                  { key: 'reactive', label: 'Reactive' },
                  { key: 'cinematic', label: 'Cinematic' },
                  { key: 'hyperwave', label: 'Hyperwave' },
                  { key: 'minimal', label: 'Minimal' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => {
                      setMotionMode(mode.key);
                      const s = stateRef.current;
                      if (mode.key === 'hyperwave') {
                        triggerPulseBurst();
                      } else if (mode.key === 'minimal') {
                        gsap.to(s, { waveSpeed: 0.25, waveHeight: 0.6, duration: 1.0 });
                      } else {
                        gsap.to(s, { waveSpeed: 0.8, waveHeight: 1.5, duration: 1.0 });
                      }
                    }}
                    style={{
                      background: motionMode === mode.key ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.05)',
                      color: motionMode === mode.key ? '#000000' : 'var(--text-primary)',
                      border: `1px solid ${motionMode === mode.key ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.12)'}`,
                      padding: '4px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '0.68rem',
                      fontFamily: 'inherit',
                      fontWeight: motionMode === mode.key ? 700 : 400,
                      textAlign: 'center',
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={triggerPulseBurst}
              style={{
                marginTop: '4px',
                background: 'rgba(196, 243, 107, 0.12)',
                color: 'var(--neon-cyan)',
                border: '1px solid var(--neon-cyan)',
                padding: '6px 8px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Lightning size={14} weight="bold" />
              Pulse Wave Energy
            </button>
          </div>
        )}

        {/* Minimalist Floating Trigger Badge */}
        <button
          type="button"
          onClick={() => setIsHudOpen((prev) => !prev)}
          title="Toggle 3D Engine HUD"
          aria-expanded={isHudOpen}
          style={{
            background: 'rgba(6, 10, 14, 0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(196, 243, 107, 0.35)',
            color: 'var(--neon-cyan)',
            padding: '6px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.6)',
            transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
          }}
          onPointerEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--neon-cyan)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(196, 243, 107, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--neon-cyan)',
              boxShadow: '0 0 8px var(--neon-cyan)',
              animation: 'pulseGlow 2.4s infinite ease-in-out',
            }}
          />
          <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>
            3D WEBGL // {fpsDisplay} FPS
          </span>
          <Broadcast size={13} weight="bold" />
        </button>
      </aside>
    </>
  );
}
