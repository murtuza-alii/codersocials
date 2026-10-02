/**
 * Shared GSAP motion helpers for buttons, menus, and dialogs.
 */

import gsap from 'gsap';

// ============================================================================
// 1. Core Easings & Micro-Durations
// ============================================================================

export const EASES = {
  // Ultra-snappy entrance for dialogs and modals
  popupEnter: 'expo.out',
  // High-velocity exit (faster than entrance)
  popupExit: 'power2.in',
  // Menu and dropdown rapid reveal
  menuEnter: 'power4.out',
  menuExit: 'power2.in',
  // Short, restrained press feedback
  mechanical: 'power2.out',
};

export const DURATIONS = {
  instant: 0.06,
  press: 0.08,
  exitFast: 0.10,
  exit: 0.12,
  menu: 0.14,
  popup: 0.18,
};

// ============================================================================
// 2. Accessibility & Reduced Motion Checker
// ============================================================================

export const isReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// ============================================================================
// 3. QuickTo Utility (Avoids allocating new tweens on rapid mouse events)
// ============================================================================

export const createQuickCoordinate = (target, property, vars = {}) => {
  if (!target) return null;
  return gsap.quickTo(target, property, {
    duration: 0.15,
    ease: EASES.mechanical,
    ...vars,
  });
};

// ============================================================================
// 4. Modal & Popup Transitions (Snappy scale + opacity + clip-path)
// ============================================================================

export const animatePopupEnter = (target, onComplete) => {
  if (!target) return null;

  if (isReducedMotion()) {
    gsap.set(target, { autoAlpha: 1, scale: 1 });
    if (onComplete) onComplete();
    return null;
  }

  return gsap.fromTo(
    target,
    {
      autoAlpha: 0,
      scale: 0.96,
      clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
    },
    {
      autoAlpha: 1,
      scale: 1,
      clipPath: 'polygon(0px 0, 100% 0, 100% 100%, 100% 100%, 0 100%, 0 0px)',
      duration: DURATIONS.popup,
      ease: EASES.popupEnter,
      clearProps: 'clipPath',
      onComplete,
    }
  );
};

export const animatePopupExit = (target, onComplete) => {
  if (!target) return null;

  if (isReducedMotion()) {
    gsap.set(target, { autoAlpha: 0 });
    if (onComplete) onComplete();
    return null;
  }

  return gsap.to(target, {
    autoAlpha: 0,
    scale: 0.96,
    duration: DURATIONS.exit,
    ease: EASES.popupExit,
    onComplete,
  });
};

// ============================================================================
// 5. Dropdown & Context Menu Transitions
// ============================================================================

export const animateMenuEnter = (target, onComplete) => {
  if (!target) return null;

  if (isReducedMotion()) {
    gsap.set(target, { autoAlpha: 1, y: 0 });
    if (onComplete) onComplete();
    return null;
  }

  return gsap.fromTo(
    target,
    {
      autoAlpha: 0,
      y: -8,
      scale: 0.98,
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: DURATIONS.menu,
      ease: EASES.menuEnter,
      onComplete,
    }
  );
};

export const animateMenuExit = (target, onComplete) => {
  if (!target) return null;

  if (isReducedMotion()) {
    gsap.set(target, { autoAlpha: 0 });
    if (onComplete) onComplete();
    return null;
  }

  return gsap.to(target, {
    autoAlpha: 0,
    y: -4,
    duration: DURATIONS.exitFast,
    ease: EASES.menuExit,
    onComplete,
  });
};

// ============================================================================
// 6. Mechanical Button Tactile Shift (Offset shadow & indent)
// ============================================================================

export const animateButtonPress = (target) => {
  if (!target || isReducedMotion()) return null;
  return gsap.to(target, {
    x: 2,
    y: 2,
    duration: DURATIONS.press,
    ease: EASES.mechanical,
    overwrite: 'auto',
  });
};

export const animateButtonRelease = (target) => {
  if (!target || isReducedMotion()) return null;
  return gsap.to(target, {
    x: 0,
    y: 0,
    duration: DURATIONS.press,
    ease: EASES.mechanical,
    overwrite: 'auto',
  });
};

export default {
  EASES,
  DURATIONS,
  isReducedMotion,
  createQuickCoordinate,
  animatePopupEnter,
  animatePopupExit,
  animateMenuEnter,
  animateMenuExit,
  animateButtonPress,
  animateButtonRelease,
};
