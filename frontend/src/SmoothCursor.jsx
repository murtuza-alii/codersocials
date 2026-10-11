import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { isReducedMotion } from './motion';

/**
 * Creative 3D Director — High-End Smooth Kinetic Cursor
 *
 * Implements:
 * 1. Dual-Tier Lag System:
 *    - Precision Target Dot (ultra-low lag, 0.08s)
 *    - Kinetic Aura Ring (momentum damped lag, 0.38s, power3.out)
 * 2. Canvas Velocity Particle Ribbon Trail:
 *    - Emits glowing cyber particles along the cursor motion vector
 *    - Particles fade and expand with alpha dissipation
 * 3. Directional Velocity Stretch & Skew:
 *    - Calculates speed & angle of movement to organically stretch the follower
 * 4. Context-Aware States:
 *    - Hover state: expands and switches to neon lime glow over links & buttons
 *    - Click state: elastic squeeze and impulse shockwave
 *    - Hidden when pointer leaves viewport or on touch-only devices
 */

export default function SmoothCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const canvasRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // 1. Check for touch device or reduced motion
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouch || isReducedMotion()) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const canvas = canvasRef.current;
    if (!dot || !ring || !canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // GSAP quickTo setters for 60fps GPU coordinate interpolation
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.36, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.36, ease: 'power3.out' });

    const ringScale = gsap.quickTo(ring, 'scale', { duration: 0.25, ease: 'back.out(2)' });
    const ringRot = gsap.quickTo(ring, 'rotation', { duration: 0.2, ease: 'power1.out' });

    // State tracking
    let prevMouseX = -100;
    let prevMouseY = -100;
    let speed = 0;
    let angle = 0;
    let isRunning = true;
    let animId = null;

    // Particle Trail Pool
    const particles = [];
    const MAX_PARTICLES = 36;

    const addParticle = (x, y, spd) => {
      if (spd < 1.2) return; // Only emit when moving
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.min(3.5, 1.2 + spd * 0.12),
        alpha: 0.65,
        decay: 0.035,
        color: Math.random() > 0.4 ? '#c4f36b' : '#67e8f9',
      });
      if (particles.length > MAX_PARTICLES) particles.shift();
    };

    // Event handlers
    const handlePointerMove = (e) => {
      const curX = e.clientX;
      const curY = e.clientY;

      // Calculate speed and angle for velocity stretch
      const dx = curX - prevMouseX;
      const dy = curY - prevMouseY;
      speed = Math.sqrt(dx * dx + dy * dy);
      angle = Math.atan2(dy, dx) * (180 / Math.PI);

      prevMouseX = curX;
      prevMouseY = curY;

      setIsVisible(true);
      dotX(curX);
      dotY(curY);
      ringX(curX);
      ringY(curY);

      // Organic stretch based on movement speed
      const stretch = Math.min(1.45, 1 + speed * 0.012);
      gsap.to(ring, {
        scaleX: stretch,
        scaleY: 1 / stretch,
        duration: 0.16,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      ringRot(angle);

      // Emit trail particle
      addParticle(curX, curY, speed);

      // Check if hovering over interactive elements
      const target = e.target;
      if (target) {
        const isInteractive =
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.surface-card') ||
          target.closest('article');

        setIsHovered(Boolean(isInteractive));
      }
    };

    const handlePointerDown = () => {
      ringScale(0.75);
    };

    const handlePointerUp = () => {
      ringScale(isHovered ? 1.6 : 1.0);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('resize', handleResize);

    // Continuous Canvas Particle Render Loop
    const renderLoop = () => {
      if (!isRunning) return;
      animId = requestAnimationFrame(renderLoop);

      ctx.clearRect(0, 0, width, height);

      // Draw and decay trailing particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    renderLoop();

    return () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('resize', handleResize);
    };
  }, [isHovered]);

  return (
    <>
      {/* 1. Kinetic Particle Ribbon Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* 2. Micro Precision Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '5px',
          height: '5px',
          marginLeft: '-2.5px',
          marginTop: '-2.5px',
          borderRadius: '50%',
          background: isHovered ? '#ffffff' : 'var(--neon-cyan)',
          boxShadow: `0 0 8px ${isHovered ? '#ffffff' : 'var(--neon-cyan)'}`,
          pointerEvents: 'none',
          zIndex: 10000,
          opacity: isVisible ? 1 : 0,
          transform: 'translate(-100px, -100px)',
          transition: 'opacity 0.2s ease, background 0.2s ease',
          willChange: 'transform',
        }}
      />

      {/* 3. Outer Holographic Lag Ring / Follower */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: isHovered ? '42px' : '26px',
          height: isHovered ? '42px' : '26px',
          marginLeft: isHovered ? '-21px' : '-13px',
          marginTop: isHovered ? '-21px' : '-13px',
          borderRadius: '50%',
          border: `1px solid ${isHovered ? 'var(--neon-cyan)' : 'rgba(196, 243, 107, 0.45)'}`,
          background: isHovered ? 'rgba(196, 243, 107, 0.08)' : 'transparent',
          boxShadow: isHovered
            ? '0 0 16px rgba(196, 243, 107, 0.35), inset 0 0 8px rgba(196, 243, 107, 0.15)'
            : 'none',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: isVisible ? 1 : 0,
          transform: 'translate(-100px, -100px)',
          transition:
            'width 0.24s cubic-bezier(0.16, 1, 0.3, 1), height 0.24s cubic-bezier(0.16, 1, 0.3, 1), margin 0.24s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, opacity 0.25s ease',
          willChange: 'transform',
        }}
      >
        {/* Subtle Crosshair Reticle Pips when hovered */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-3px',
                width: '1px',
                height: '4px',
                background: 'var(--neon-cyan)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-3px',
                width: '1px',
                height: '4px',
                background: 'var(--neon-cyan)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '-3px',
                height: '1px',
                width: '4px',
                background: 'var(--neon-cyan)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '-3px',
                height: '1px',
                width: '4px',
                background: 'var(--neon-cyan)',
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
