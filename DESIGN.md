# Sanctuary OS — Design System & Engineering Specification

**Document**: `DESIGN.md`  
**Phase**: Phase 1 — Palette, Typography, Geometry, and Motion Rules  
**Aesthetic Family**: Neon Cyberpunk on True Black (Industrial / Terminal High-Density)  

---

## 0. Design Read & Configuration Dials

> **Design Read**: Web-native social and community platform for engineers and tech-forward creators, with a raw neon cyberpunk aesthetic on true black, Discord-level information density without softness, sharp mechanical geometry, and GPU-accelerated GSAP motion.

### Core Configuration Dials (from `design-taste-frontend` skill)
* **`DESIGN_VARIANCE: 7`** — Asymmetric technical layout, chamfered corner accents, contrasting display vs monospace typography.
* **`MOTION_INTENSITY: 8`** — First-class mechanical physics: hard snap popups, `quickTo` cursor responsiveness, 3D blob flip cards, and interactive ASCII particle clouds.
* **`VISUAL_DENSITY: 8`** — Discord-tier compactness: slim primary icon rail, 240px channel subnav, tight metadata badges, no wasted airy whitespace.

---

## 1. Color Palette & Surface Tokens

### Core Rules
1. **Background**: Pure `#000000` (true pitch black).
2. **Surfaces**: Near-black (`#050505` to `#0A0A0A`) barely distinguishable from true black. **Zero gray fills** (`#1a1e29`, `#2b2d31`, etc. are strictly banned).
3. **Borders**: 1px borders in a dim neon tint (`rgba(0, 240, 255, 0.18)` or `rgba(255, 0, 85, 0.18)`).
4. **Highlights & Glows**: Blurry radial box-shadows are banned. Contrast comes from **brightness difference** (dim by default, fully saturated on hover/press) and **hard offset shadows** (`2px 2px 0px ...`).
5. **No Blue-Purple Gradient Slop**: Accents are strictly locked to **Acid Cyan** and **Hot Magenta**, plus a single **Warning Amber**.

### Color Tokens

```css
:root {
  /* True Black & Surfaces */
  --bg-pitch: #000000;
  --bg-surface: #040608;
  --bg-surface-elevated: #080C0E;
  --bg-overlay: rgba(0, 0, 0, 0.88);

  /* Primary Accent: Acid Cyan */
  --neon-cyan: #00F0FF;
  --neon-cyan-dim: rgba(0, 240, 255, 0.16);
  --neon-cyan-border: rgba(0, 240, 255, 0.28);
  --neon-cyan-bright: #70F7FF;

  /* Secondary Accent: Hot Magenta */
  --neon-magenta: #FF0055;
  --neon-magenta-dim: rgba(255, 0, 85, 0.16);
  --neon-magenta-border: rgba(255, 0, 85, 0.28);
  --neon-magenta-bright: #FF4785;

  /* Single Warning Color */
  --neon-warning: #FFB800;
  --neon-warning-dim: rgba(255, 184, 0, 0.16);
  --neon-warning-border: rgba(255, 184, 0, 0.35);

  /* Text & Contrast */
  --text-pure: #FFFFFF;
  --text-primary: #E6EDF3;
  --text-secondary: #8B949E;
  --text-dim: #484F58;

  /* Hard Offset Shadows (Mechanical / Tacky feel) */
  --shadow-hard-cyan: 2px 2px 0px #00F0FF;
  --shadow-hard-magenta: 2px 2px 0px #FF0055;
  --shadow-hard-warning: 2px 2px 0px #FFB800;
  --shadow-hard-dim: 2px 2px 0px rgba(0, 240, 255, 0.25);
  --shadow-hard-pressed: 0px 0px 0px transparent;
}
```

---

## 2. Typography Specification

To guarantee high visual distinction and avoid AI clichés:
* **Banned**: `Inter`, `Roboto`, system default sans (`Segoe UI`, `San Francisco`), and display serifs (`Fraunces`, `Instrument Serif`).
* **Display Font (Hard Angles / Technical Character)**: **`Space Grotesk`** (weights 600, 700). Sharp angular geometry and tight letter spacing.
* **Monospace Font (Metadata, HUD, Numbers, Code)**: **`JetBrains Mono`** (weights 400, 500, 700). High legibility, tabular figures, and terminal aesthetics.

### Typography Hierarchy

```css
/* Headlines & Titles */
.type-display-xl {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.type-display-md {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* UI Labels & Actions */
.type-ui-label {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* Metadata & HUD Elements */
.type-mono-meta {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}

.type-mono-sm {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 400;
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
}
```

### Copywriting Rules
* **Eliminate Filler Jargon**: Replace "QUANTUM RELAY", "MATRIX LINK", "DEEP SPACE MESH" with genuine, descriptive product terms: "Home Feed", "Community Spaces", "Announcement Channel", "Direct Messages".
* **Eyebrow Discipline**: The `//` token is restricted to a **maximum of two locations** in the entire application (e.g. system status indicator in the top bar). It is strictly banned from section headers, post cards, and buttons.

---

## 3. Geometry & Mechanical Edge Rules

1. **Zero Border Radius**: All standard containers, input fields, and panels have `border-radius: 0px`. Rounded pill cards and `border-radius: 12px` are abolished.
2. **Chamfered Corners via Clip-Path**: High-priority interactive elements (primary buttons, active tabs, modal headers) use crisp 45-degree chamfered corners:
   ```css
   clip-path: polygon(
     6px 0, 
     100% 0, 
     100% calc(100% - 6px), 
     calc(100% - 6px) 100%, 
     0 100%, 
     0 6px
   );
   ```
3. **Button Interaction States**:
   * **Resting**: Pure black background (`#000000`), 1px solid dim border (`var(--neon-cyan-border)`), neon text.
   * **Hover**: **Inverts** to solid neon fill (`#00F0FF`) with pure black text (`#000000`). Zero delay.
   * **Active / Press**: Shifts position by `translate(2px, 2px)` and applies a hard offset shadow (`var(--shadow-hard-cyan)`) to yield a tactile, mechanical click feeling.
4. **Information Architecture & Density**:
   * Follow Discord's 4-tier density:
     * **Primary Rail**: 64px width, slim square icons with chamfered active states.
     * **Channels / Subnav**: 240px width, sharp text hierarchy.
     * **Top Bar**: 52px height, pinned header.
     * **Main Stage**: Max-width clamped (`680px` for feed, `100%` for chat), with explicit `overflow-x: hidden` and `min-width: 0` to cure the horizontal scroll bug.

---

## 4. Motion Specification (GSAP Core Rules)

### Core Directives
* **GSAP Core**: Standardize on `gsap` and `@gsap/react` (`useGSAP`). Clean up all tweens on component unmount via context.
* **Allowed Animatable Properties**: `transform` (`x`, `y`, `scale`, `rotation`), `opacity` (`autoAlpha`), and `clip-path`. Never animate `width`, `height`, `top`, or `left`.
* **Zero Fighting**: CSS transitions and GSAP tweens must **never** target the same CSS property.
* **Hover Performance**: Use `gsap.quickTo()` for pointer coordinates and reused timelines for hover states to prevent jank when skimming rapidly across lists.
* **Reduced Motion**: When `(prefers-reduced-motion: reduce)` matches, flip animations and cursor effects are completely disabled, and tween durations snap to 0.

### Curve & Timing Specs

| Interaction | GSAP Ease | Enter Duration | Exit Duration | Description |
|---|---|---|---|---|
| **Popup / Modal Reveal** | `expo.out` | `0.18s` | `0.12s` (`power2.in`) | Fast scale `0.96 -> 1.0`, `autoAlpha: 1`, chamfered clip-path expand. |
| **Menu / Dropdown** | `power4.out` | `0.14s` | `0.10s` (`power2.in`) | Quick vertical reveal (`y: -8 -> 0`), snappy dismissal. |
| **Blob Flip Card** | `back.out(1.4)` | `0.45s` | `0.35s` (`power3.out`) | 3D Y-axis flip (`rotationY: 180deg`) with perspective `1000px`. |
| **Cursor Cloud** | `none` (rAF) | continuous | continuous | Particle drift and alpha decay driven in single rAF loop. |
| **Mechanical Button Snap** | `power2.out` | `0.08s` | `0.06s` | Instant tactile indentation on press. |

---

## 5. Signature Effects Specification

### A. ASCII Cursor Cloud (`AsciiCursor.jsx`)
* **Technology**: A single, fixed, full-screen `<canvas>` with `pointer-events: none` and `z-index: 999`.
* **Logic**:
  * Tracks cursor position `(mouseX, mouseY)`.
  * Maintains an array of ~40 lightweight particle objects.
  * Characters: `0`, `1`, `+`, `//`, `[ ]`, `#`, `*`, `~`, `X`, `%`.
  * Particles spawn near the cursor, drifting with a small random velocity.
  * Opacity is highest (`1.0`) at the center, decaying with radial distance and age.
  * Run in a single `requestAnimationFrame` loop.
  * Auto-disabled on touch devices (`window.matchMedia('(pointer: coarse)').matches`) and reduced-motion settings.

### B. Morphing Blob Flip Cards (`BlobFlipCard.jsx`)
* **Surfaces**: Applied exclusively to Discover space cards, server rail icons, and featured highlight cards.
* **Structure**: 3D card flipping container with `perspective: 1000px` and `transform-style: preserve-3d`.
* **Front Face**: High-contrast geometric metadata, badges, and space title.
* **Back Face**: Dynamic SVG and layered radial gradient blobs in Acid Cyan and Hot Magenta that morph and expand on hover, replacing flat stock image pop-ins, overlaid with a technical HUD readout.
