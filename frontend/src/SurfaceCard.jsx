import React, { useRef, useState, useCallback } from 'react';
import { isReducedMotion } from './motion';

/**
 * Creative 3D Director — SurfaceCard
 *
 * Implements:
 * 1. Hardware-accelerated 3D parallax micro-tilt (clamped to max 5 deg)
 * 2. Dynamic specular lighting sheen tracking pointer coordinates
 * 3. Strict containment: zero button overflow, zero layout shifts, zero click interference
 * 4. Full accessibility and prefers-reduced-motion compliance
 */
export default function SurfaceCard({
  frontContent,
  children,
  height = 'auto',
  minHeight,
  width = '100%',
  accent = 'cyan', // 'cyan' | 'magenta' | 'lime' | 'neutral'
  className = '',
  style = {},
  onClick,
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glowX: 50, glowY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Accent-specific colors matching the cybernetic palette
  const accentBorderHover =
    accent === 'magenta'
      ? 'rgba(223, 125, 120, 0.65)'
      : accent === 'lime'
      ? 'rgba(196, 243, 107, 0.65)'
      : accent === 'neutral'
      ? 'rgba(255, 255, 255, 0.22)'
      : 'rgba(0, 240, 255, 0.55)';

  const accentSheenColor =
    accent === 'magenta'
      ? 'rgba(223, 125, 120, 0.12)'
      : accent === 'lime'
      ? 'rgba(196, 243, 107, 0.12)'
      : accent === 'neutral'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 240, 255, 0.14)';

  const handlePointerMove = useCallback((e) => {
    if (isReducedMotion() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Normalized coordinates (-1 to 1) from card center
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;

    // Clamped subtle rotation (max 4.5 degrees) for sleek tactile feel
    setTilt({
      rx: -ny * 4.5,
      ry: nx * 4.5,
      glowX: Math.round(x * 100),
      glowY: Math.round(y * 100),
    });
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0, glowX: 50, glowY: 50 });
  }, []);

  const effectiveMinHeight = minHeight || height;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      className={`surface-card ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick(event);
              }
            }
          : undefined
      }
      style={{
        width,
        minHeight: effectiveMinHeight,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(6, 8, 12, 0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${isHovered ? accentBorderHover : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: 4,
        padding: '0',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transform:
          isHovered && !isReducedMotion()
            ? `perspective(1000px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-2px)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
        boxShadow:
          isHovered
            ? `0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px ${accentSheenColor}`
            : '0 4px 18px rgba(0, 0, 0, 0.4)',
        transition: isHovered
          ? 'border-color 0.2s ease, box-shadow 0.25s ease, transform 0.08s ease-out'
          : 'border-color 0.25s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
        ...style,
      }}
    >
      {/* 3D Specular Lighting Sheen Overlay */}
      {isHovered && !isReducedMotion() && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle 320px at ${tilt.glowX}% ${tilt.glowY}%, ${accentSheenColor}, transparent 75%)`,
            zIndex: 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Relative Content Container with isolated zIndex to ensure buttons stay clickable */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {frontContent || children}
      </div>
    </div>
  );
}
