/**
 * Sanctuary OS — Universal Three.js WebGL Background Engine
 * Choreographed cybernetic topography, kinetic core, and neural particle network.
 */
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('sanctuary-3d-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020305, 0.038);

  const width = window.innerWidth;
  const height = window.innerHeight;

  const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 80);
  camera.position.set(0, 3.5, 12);
  camera.rotation.x = -0.22;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.warn('WebGL initialization fallback:', err);
    return;
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- Lighting ---
  const ambientLight = new THREE.AmbientLight(0x1a2632, 1.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xc4f36b, 2.0);
  keyLight.position.set(10, 12, 10);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xdf7d78, 1.8);
  rimLight.position.set(-10, -6, -8);
  scene.add(rimLight);

  const pointGlow = new THREE.PointLight(0x00f0ff, 2.5, 20, 1.2);
  pointGlow.position.set(0, 2, 4);
  scene.add(pointGlow);

  // --- Kinetic Holographic Core Group ---
  const coreGroup = new THREE.Group();
  coreGroup.position.set(4.8, 0.6, 0);
  scene.add(coreGroup);

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

  const ringGeo1 = new THREE.TorusGeometry(2.1, 0.022, 16, 96);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0xc4f36b,
    transparent: true,
    opacity: 0.55,
  });
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 3;
  coreGroup.add(ring1);

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

  // Orbiting Telemetry Micro-Satellites
  const satGeo = new THREE.OctahedronGeometry(0.14, 0);
  const satellites = [
    { radius: 2.8, speed: 0.7, offset: 0, color: 0xc4f36b },
    { radius: 3.3, speed: -0.5, offset: Math.PI * 0.7, color: 0x00f0ff },
    { radius: 2.5, speed: 1.0, offset: Math.PI * 1.4, color: 0xdf7d78 },
  ].map(function (cfg) {
    const mat = new THREE.MeshBasicMaterial({ color: cfg.color, wireframe: true });
    const mesh = new THREE.Mesh(satGeo, mat);
    coreGroup.add(mesh);
    return { mesh: mesh, radius: cfg.radius, speed: cfg.speed, offset: cfg.offset };
  });

  // --- Undulating Topographical Wave Matrix ---
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

  // --- Atmospheric Ambient Particles ---
  const particleCount = 600;
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

  // --- Constellation Nodes ---
  const nodeCount = 36;
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

  const maxLines = 80;
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

  // --- Mouse Parallax Tracking ---
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('pointermove', function (e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.addEventListener('resize', function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // --- Render Loop ---
  let isVisible = true;
  document.addEventListener('visibilitychange', function () {
    isVisible = !document.hidden;
  });

  let time = 0;
  let lastTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const now = performance.now();
    const delta = Math.min((now - lastTime) * 0.001, 0.1);
    lastTime = now;
    time += delta * 0.8;

    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    camera.position.x = mouse.x * 1.2;
    camera.position.y = 3.5 + mouse.y * 0.8;
    camera.rotation.x = -0.22 + mouse.y * 0.05;
    camera.rotation.y = -mouse.x * 0.07;

    outerIcosahedron.rotation.x += 0.003;
    outerIcosahedron.rotation.y += 0.006;
    innerCore.rotation.y -= 0.004;

    ring1.rotation.z += 0.010;
    ring1.rotation.x = Math.PI / 3 + Math.sin(time * 0.6) * 0.15;

    ring2.rotation.y -= 0.012;
    ring2.rotation.z = Math.PI / 6 + Math.cos(time * 0.5) * 0.18;

    coreGroup.position.y = 0.6 + Math.sin(time * 1.2) * 0.15;

    // Orbiting satellites
    satellites.forEach(function (sat) {
      const angle = time * sat.speed + sat.offset;
      sat.mesh.position.x = Math.cos(angle) * sat.radius;
      sat.mesh.position.y = Math.sin(angle * 1.4) * (sat.radius * 0.35);
      sat.mesh.position.z = Math.sin(angle) * sat.radius;
      sat.mesh.rotation.x += 0.02;
      sat.mesh.rotation.y += 0.03;
    });

    // Procedural wave displacement with pointer energy ripple
    const positions = terrainMesh.geometry.attributes.position;
    const pArr = positions.array;
    const count = pArr.length / 3;
    const t = time * 1.2;

    const mx = mouse.x * 16;
    const mz = -mouse.y * 12;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const ox = initialPositions[idx];
      const oz = initialPositions[idx + 2];
      const wave1 = Math.sin(ox * 0.18 + t * 0.7) * Math.cos(oz * 0.20 + t * 0.5);
      const wave2 = Math.sin((ox + oz) * 0.10 + t * 0.35) * 0.5;

      const distSq = (ox - mx) * (ox - mx) + (oz - mz) * (oz - mz);
      const ripple = Math.exp(-distSq * 0.03) * 0.65 * Math.sin(t * 3.2 - Math.sqrt(distSq) * 1.3);

      pArr[idx + 1] = (wave1 + wave2 + ripple) * 1.5;
    }
    positions.needsUpdate = true;

    particles.rotation.y += 0.0005;
    particles.rotation.x = Math.sin(time * 0.2) * 0.03;

    // Constellation updates
    const p = nodePositions;
    for (let i = 0; i < nodeCount; i++) {
      const idx = i * 3;
      p[idx] += nodeVelocities[i].vx;
      p[idx + 1] += nodeVelocities[i].vy;
      p[idx + 2] += nodeVelocities[i].vz;

      if (p[idx] < -12 || p[idx] > 12) nodeVelocities[i].vx *= -1;
      if (p[idx + 1] < -2 || p[idx + 1] > 8) nodeVelocities[i].vy *= -1;
      if (p[idx + 2] < -10 || p[idx + 2] > 6) nodeVelocities[i].vz *= -1;
    }
    constellationPoints.geometry.attributes.position.needsUpdate = true;

    let lineIdx = 0;
    const lp = lineGeometry.attributes.position.array;
    const maxDistSq = 14.0;
    for (let i = 0; i < nodeCount && lineIdx < maxLines * 6; i++) {
      const i3 = i * 3;
      for (let j = i + 1; j < nodeCount && lineIdx < maxLines * 6; j++) {
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
    for (let k = lineIdx; k < maxLines * 6; k++) {
      lp[k] = 0;
    }
    constellationLines.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();
})();
