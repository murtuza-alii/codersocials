/**
 * Sanctuary OS — Popups, Modals, Menus & Tooltips
 * Phase 7: Popup.jsx
 *
 * Requirements:
 * - Enter with short timeline: scale from 0.96, opacity (autoAlpha), clip-path reveal with expo.out / power4.out.
 * - Exit faster than enter using power2.in.
 * - Animates only transform, opacity, and clip-path.
 * - Pure black surfaces, 1px neon borders, zero gray fills.
 * - Discord density, sharp chamfered corners, hard offset shadows.
 * - Full cleanup on unmount with GSAP.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Button from './Button';
import {
  animatePopupEnter,
  animatePopupExit,
  animateMenuEnter,
  animateMenuExit,
  isReducedMotion,
  DURATIONS,
  EASES,
} from './motion';

// ============================================================================
// 1. Cyber Modal Component
// ============================================================================

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'cyan', // 'cyan' | 'magenta' | 'warning'
  maxWidth = '480px',
  showFooter = true,
}) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef(null);
  const cardRef = useRef(null);

  const isCyan = variant === 'cyan';
  const isWarning = variant === 'warning';
  const borderColor = isWarning
    ? 'var(--neon-warning)'
    : isCyan
    ? 'var(--neon-cyan)'
    : 'var(--neon-magenta)';
  const shadowColor = isWarning
    ? 'var(--shadow-hard-warning)'
    : isCyan
    ? 'var(--shadow-hard-cyan)'
    : 'var(--shadow-hard-magenta)';

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  const { contextSafe } = useGSAP({ scope: backdropRef, dependencies: [mounted] });

  // Handle Entrance
  useEffect(() => {
    if (mounted && isOpen) {
      if (backdropRef.current) {
        gsap.to(backdropRef.current, {
          autoAlpha: 1,
          duration: DURATIONS.popup,
          ease: 'power2.out',
        });
      }
      if (cardRef.current) {
        animatePopupEnter(cardRef.current);
      }
    }
  }, [mounted, isOpen]);

  // Handle Animated Exit
  const handleClose = () => {
    if (isReducedMotion()) {
      setMounted(false);
      onClose();
      return;
    }

    if (backdropRef.current) {
      gsap.to(backdropRef.current, {
        autoAlpha: 0,
        duration: DURATIONS.exit,
        ease: EASES.popupExit,
      });
    }

    if (cardRef.current) {
      animatePopupExit(cardRef.current, () => {
        setMounted(false);
        onClose();
      });
    } else {
      setMounted(false);
      onClose();
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: 0,
      }}
    >
      <div
        ref={cardRef}
        style={{
          width: '100%',
          maxWidth,
          background: 'var(--bg-pitch)',
          border: `1px solid ${borderColor}`,
          boxShadow: shadowColor,
          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div>
            {subtitle && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: borderColor,
                  letterSpacing: '0.08em',
                  marginBottom: '2px',
                }}
              >
                {subtitle}
              </div>
            )}
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-pure)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {children}
        </div>

        {/* Modal Footer Actions */}
        {showFooter && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--bg-surface)',
            }}
          >
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {cancelLabel}
            </Button>
            <Button
              variant={isWarning ? 'warning' : isCyan ? 'primary' : 'accent'}
              size="sm"
              onClick={() => {
                if (onConfirm) onConfirm();
                handleClose();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// 2. Snappy Dropdown & Context Menu
// ============================================================================

export function Menu({ isOpen, onClose, anchorRef, children, width = '180px', align = 'right' }) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useEffect(() => {
    if (mounted && isOpen && menuRef.current) {
      animateMenuEnter(menuRef.current);
    }
  }, [mounted, isOpen]);

  const handleClose = () => {
    if (isReducedMotion() || !menuRef.current) {
      setMounted(false);
      onClose();
      return;
    }
    animateMenuExit(menuRef.current, () => {
      setMounted(false);
      onClose();
    });
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '100%',
        [align]: 0,
        marginTop: '6px',
        width,
        background: 'var(--bg-pitch)',
        border: '1px solid var(--neon-cyan-border)',
        boxShadow: '2px 2px 0px var(--neon-cyan)',
        clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
        zIndex: 8000,
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      {children}
    </div>
  );
}

export function MenuItem({ icon, children, onClick, variant = 'default', danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '7px 10px',
        background: 'transparent',
        border: 'none',
        color: danger ? 'var(--neon-magenta)' : 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: '0.8rem',
        fontWeight: 500,
        textAlign: 'left',
        cursor: 'pointer',
        outline: 'none',
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.background = danger ? 'var(--neon-magenta)' : 'var(--neon-cyan)';
        e.currentTarget.style.color = '#000000';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = danger ? 'var(--neon-magenta)' : 'var(--text-primary)';
      }}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// ============================================================================
// 3. Discord-Density Tactical Tooltip
// ============================================================================

export function Tooltip({ text, children, position = 'right' }) {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef(null);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onPointerEnter={() => setVisible(true)}
      onPointerLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'absolute',
            ...(position === 'right' && {
              left: 'calc(100% + 10px)',
              top: '50%',
              transform: 'translateY(-50%)',
            }),
            ...(position === 'top' && {
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }),
            ...(position === 'bottom' && {
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }),
            background: 'var(--bg-pitch)',
            color: 'var(--neon-cyan)',
            border: '1px solid var(--neon-cyan)',
            boxShadow: '2px 2px 0px rgba(0, 240, 255, 0.4)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export default {
  Modal,
  Menu,
  MenuItem,
  Tooltip,
};
