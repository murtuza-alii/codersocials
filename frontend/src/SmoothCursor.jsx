import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { isReducedMotion } from './motion';

/**
 * Creative 3D Director — Universal Smooth Kinetic Cursor
 *
 * Implements:
 * 1. Dual-Tier Lag System:
 *    - Precision Target Dot (ultra-low lag, 0.08s)
 *    - Kinetic Aura Ring (momentum damped lag, 0.36s, power3.out)
 * 2. Velocity Directional Stretch:
 *    - Dynamically elongates ring based on motion velocity vector
 * 3. Context-Aware Magnetic Reticle:
 *    - Expands over buttons, links, inputs, cards
 *    - Squash & rebound on click
 * 4. Universal & Zero-Vanishing:
 *    - Mounts once (empty dependency array) — never tears down listeners
 *    - Uses refs and direct GSAP tweens for instant 60fps response
 *    - Extreme z-index (9999999) and pointer-events: none
 */

export default function SmoothCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Check for touch device or reduced motion
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouch || isReducedMotion()) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // GSAP quickTo setters for 60fps GPU coordinate interpolation
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.07, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.07, ease: 'power2.out' });

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.34, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.34, ease: 'power3.out' });

    const ringScale = gsap.quickTo(ring, 'scale', { duration: 0.22, ease: 'back.out(1.8)' });
    const ringRot = gsap.quickTo(ring, 'rotation', { duration: 0.18, ease: 'power1.out' });

    // State tracking
    let prevMouseX = -100;
    let prevMouseY = -100;
    let isHovered = false;
    let isVisible = false;

    const setCursorVisible = (visible) => {
      if (isVisible === visible) return;
      isVisible = visible;
      gsap.to([dot, ring], {
        opacity: visible ? 1 : 0,
        duration: 0.2,
        overwrite: 'auto',
      });
    };

    const setHoverState = (hovered) => {
      if (isHovered === hovered) return;
      isHovered = hovered;

      if (hovered) {
        ringScale(1.55);
        gsap.to(ring, {
          borderColor: 'var(--neon-cyan)',
          backgroundColor: 'rgba(196, 243, 107, 0.08)',
          boxShadow: '0 0 16px rgba(196, 243, 107, 0.35)',
          duration: 0.2,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          backgroundColor: '#ffffff',
          boxShadow: '0 0 10px #ffffff',
          duration: 0.2,
          overwrite: 'auto',
        });
      } else {
        ringScale(1.0);
        gsap.to(ring, {
          borderColor: 'rgba(196, 243, 107, 0.5)',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          duration: 0.2,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          backgroundColor: 'var(--neon-cyan)',
          boxShadow: '0 0 8px var(--neon-cyan)',
          duration: 0.2,
          overwrite: 'auto',
        });
      }
    };

    // Global pointer move listener
    const handlePointerMove = (e) => {
      const curX = e.clientX;
      const curY = e.clientY;

      setCursorVisible(true);

      const dx = curX - prevMouseX;
      const dy = curY - prevMouseY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      prevMouseX = curX;
      prevMouseY = curY;

      dotX(curX);
      dotY(curY);
      ringX(curX);
      ringY(curY);

      // Organic directional stretch on high-velocity movement
      if (!isHovered) {
        const stretch = Math.min(1.4, 1 + speed * 0.01);
        gsap.to(ring, {
          scaleX: stretch,
          scaleY: 1 / stretch,
          duration: 0.14,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        ringRot(angle);
      }

      // Check if hovering over any interactive elements
      const target = e.target;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.surface-card') ||
          target.closest('article') ||
          target.closest('.rail-btn') ||
          target.closest('.cyber-btn')
        );
        setHoverState(isInteractive);
      }
    };

    const handlePointerDown = () => {
      ringScale(0.75);
    };

    const handlePointerUp = () => {
      ringScale(isHovered ? 1.55 : 1.0);
    };

    const handleMouseLeave = () => {
      setCursorVisible(false);
    };

    const handleMouseEnter = () => {
      setCursorVisible(true);
    };

    // Attach to window so it captures across all frames, scrollbars, and stage containers
    window.addEventListener('pointermove', handlePointerMove, { passive: true, capture: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <>
      {/* 1. Micro Precision Dot */}
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
          background: 'var(--neon-cyan)',
          boxShadow: '0 0 8px var(--neon-cyan)',
          pointerEvents: 'none',
          zIndex: 9999999,
          opacity: 0,
          transform: 'translate(-100px, -100px)',
          willChange: 'transform',
        }}
      />

      {/* 2. Outer Holographic Lag Ring / Follower */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '28px',
          height: '28px',
          marginLeft: '-14px',
          marginTop: '-14px',
          borderRadius: '50%',
          border: '1px solid rgba(196, 243, 107, 0.5)',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 9999998,
          opacity: 0,
          transform: 'translate(-100px, -100px)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
