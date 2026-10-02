/**
 * Shared action button with a restrained pressed state and clear variants.
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { isReducedMotion, DURATIONS, EASES } from './motion';

const VARIANT_CONFIG = {
  primary: {
    color: 'var(--neon-cyan)',
    borderColor: 'var(--neon-cyan)',
    hoverBg: 'var(--neon-cyan)',
    hoverColor: '#000000',
    shadowColor: 'var(--neon-cyan)',
  },
  accent: {
    color: 'var(--neon-magenta)',
    borderColor: 'var(--neon-magenta)',
    hoverBg: 'var(--neon-magenta)',
    hoverColor: '#000000',
    shadowColor: 'var(--neon-magenta)',
  },
  warning: {
    color: 'var(--neon-warning)',
    borderColor: 'var(--neon-warning)',
    hoverBg: 'var(--neon-warning)',
    hoverColor: '#000000',
    shadowColor: 'var(--neon-warning)',
  },
  ghost: {
    color: 'var(--text-primary)',
    borderColor: 'var(--neon-cyan-border)',
    hoverBg: 'var(--neon-cyan)',
    hoverColor: '#000000',
    shadowColor: 'var(--neon-cyan)',
  },
};

const SIZE_CONFIG = {
  sm: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    chamfer: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
  },
  md: {
    padding: '9px 18px',
    fontSize: '0.84rem',
    chamfer: 'polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)',
  },
  lg: {
    padding: '13px 26px',
    fontSize: '0.95rem',
    chamfer: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
  },
  icon: {
    padding: '8px',
    width: '38px',
    height: '38px',
    fontSize: '1rem',
    chamfer: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
  },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  chamfer = true,
  icon = null,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const btnRef = useRef(null);
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.primary;
  const sz = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  // A short, one pixel press response for pointer input.
  const { contextSafe } = useGSAP({ scope: btnRef });

  const handlePointerDown = contextSafe(() => {
    if (disabled || isReducedMotion()) return;
    gsap.to(btnRef.current, {
      x: 0,
      y: 1,
      duration: DURATIONS.instant,
      ease: EASES.mechanical,
      overwrite: 'auto',
    });
  });

  const handlePointerUp = contextSafe(() => {
    if (disabled || isReducedMotion()) return;
    gsap.to(btnRef.current, {
      x: 0,
      y: 0,
      duration: DURATIONS.press,
      ease: EASES.mechanical,
      overwrite: 'auto',
    });
  });

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`app-button ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#000000',
        color: cfg.color,
        border: `1px solid ${cfg.borderColor}`,
        borderRadius: 0,
        clipPath: chamfer ? sz.chamfer : 'none',
        padding: sz.padding,
        width: size === 'icon' ? sz.width : undefined,
        height: size === 'icon' ? sz.height : undefined,
        fontFamily: 'var(--font-display)',
        fontSize: sz.fontSize,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
        userSelect: 'none',
        transition: 'background 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...props}
    >
      <style>{`
        .app-button:hover:not(:disabled) {
          background: ${cfg.hoverBg} !important;
          color: ${cfg.hoverColor} !important;
          border-color: ${cfg.hoverBg} !important;
        }
        .app-button:active:not(:disabled) {
          box-shadow: 2px 2px 0px ${cfg.shadowColor};
        }
        .app-button:focus-visible {
          outline: 1px dashed var(--neon-cyan);
          outline-offset: 3px;
        }
      `}</style>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}
