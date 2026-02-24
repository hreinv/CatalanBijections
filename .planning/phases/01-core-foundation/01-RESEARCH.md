# Phase 1: Core Foundation - Research

**Researched:** 2026-02-23
**Domain:** Canvas setup, Dyck word enumeration, HiDPI rendering, visual theme
**Confidence:** HIGH

## Summary

Phase 1 establishes the three pillars everything else depends on: (1) a working HTML/Canvas shell with HiDPI support, (2) the Dyck word enumeration engine that drives all 11 structures, and (3) the visual theme contract (colors, stroke weights, font sizes) that ensures projector readability. No external dependencies. No build step. Just `index.html` served over HTTP.

The Dyck word enumerator is the mathematical core. It must produce exactly C(n) valid Dyck words for n=1..4 (1, 2, 5, 14). Every structure module in later phases depends on this enumeration being correct. The Canvas setup must handle `devicePixelRatio` scaling so content renders sharply on both the development machine and the classroom projector. The visual theme must use thick strokes (3px+), large fonts (18px+), and high-contrast colors on a white background.

**Primary recommendation:** Build and verify `core/dyck.js` first (pure logic, testable in console), then wire up the Canvas with HiDPI scaling, then apply the visual theme. Verify Catalan counts in the browser console before building any UI.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | App loads from index.html with zero dependencies (no npm, no build step) | ES Modules with `<script type="module">` and relative imports; serve via `python3 -m http.server`; no package.json needed |
| FOUND-02 | Dyck word enumeration correctly generates all C(n) instances for n=1 to 4 | Recursive generation algorithm with prefix-sum validation; verify counts [1, 2, 5, 14]; see Code Examples section |
| FOUND-03 | HiDPI canvas rendering with devicePixelRatio scaling for sharp projector display | Standard `devicePixelRatio` scaling pattern with `{ alpha: false }` optimization; see Code Examples section |
| FOUND-04 | Clean minimal visual theme (white background, high-contrast colors, thick strokes) | CSS custom properties for theme values; `lineWidth: 3`, font 18px+, white background; projector-safe color palette |
</phase_requirements>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| HTML5 Canvas (`CanvasRenderingContext2D`) | Baseline (all browsers) | All visual rendering | Native API, zero dependencies, immediate-mode drawing gives pixel-level control. No DOM overhead. |
| Vanilla JavaScript (ES2022+) | Current engines | Application logic | No framework needed. ES Modules provide code organization. No build step risk. |
| ES Modules (`type="module"`) | Baseline (all browsers) | File organization | Native `import`/`export` without bundlers. Automatic strict mode. Deferred loading. |
| CSS3 (vanilla) | Current | Layout, theming | CSS custom properties for projector-friendly theme. Flexbox for control panel. |

### Supporting

| API | Purpose | When to Use |
|-----|---------|-------------|
| `devicePixelRatio` | HiDPI/Retina scaling | Applied once at canvas setup for sharp rendering on projectors |
| `Path2D` | Reusable shape definitions | Define shapes once, reuse across frames; baseline since 2016 |
| `ctx.measureText()` | Text layout | Centering labels, positioning characters |
| `performance.now()` | Timing | Animation progress (used in later phases, but engine stub lives here) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla Canvas 2D | SVG | SVG has DOM event handling per element but is slower for frequent full-scene redraws during animation |
| Vanilla Canvas 2D | D3.js | Massive overkill (80KB+) for hand-crafted mathematical drawings with no data-binding needs |
| ES Modules (native) | Webpack/Vite | Zero dependencies means zero reason for a bundler; build step can fail during live presentation |
| Vanilla JS | TypeScript | Requires compile step; if `tsc` fails on presentation machine, app won't run |

**Installation:**
```bash
# No installation. Serve files with:
python3 -m http.server 8080
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
index.html                  # Entry point, loads main.js as module
css/
  style.css                 # Layout, theme custom properties, canvas container
js/
  main.js                   # Entry point, wires canvas setup, loads core modules
  core/
    dyck.js                 # Dyck word enumeration, validation
    canvas-utils.js         # Drawing primitives, HiDPI setup
    colors.js               # Color palette for element correspondence
```

Later phases add `structures/`, `bijections/`, `engine/`, and `ui/` directories. Phase 1 only creates the `core/` foundation and the HTML/CSS shell.

### Pattern 1: HiDPI Canvas Setup

**What:** Scale the canvas backing store by `devicePixelRatio` while keeping CSS dimensions unchanged.
**When to use:** Once at initialization, and on window resize.

```javascript
// core/canvas-utils.js
export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.scale(dpr, dpr);

  return { ctx, width: rect.width, height: rect.height, dpr };
}
```

**Why `{ alpha: false }`:** White background means no compositing needed. MDN optimization guide recommends this for opaque canvases.

**Confidence:** HIGH (MDN Canvas optimization documentation)

### Pattern 2: Dyck Word Enumeration via Recursive Generation

**What:** Generate all valid Dyck words of length 2n by recursive descent, maintaining the constraint that the running sum never goes negative.
**When to use:** Called once when `n` changes. Results are cached.

```javascript
// core/dyck.js
export function enumerate(n) {
  const results = [];

  function generate(word, opens, closes) {
    if (word.length === 2 * n) {
      results.push(word);
      return;
    }
    if (opens < n) {
      generate([...word, 1], opens + 1, closes);
    }
    if (closes < opens) {
      generate([...word, -1], opens, closes + 1);
    }
  }

  generate([], 0, 0);
  return results;
}

export function validate(word) {
  let sum = 0;
  for (const step of word) {
    sum += step;
    if (sum < 0) return false;
  }
  return sum === 0;
}
```

**Why +1/-1 representation:** Maps directly to Dyck path steps (up=+1, down=-1), parentheses ('('=+1, ')'=-1), and ballot sequences. Every structure's `fromDyck()` interprets this array.

**Confidence:** HIGH (standard combinatorics algorithm; Catalan number counts are mathematically proven)

### Pattern 3: CSS Custom Properties for Theme

**What:** Define all visual constants (colors, stroke widths, font sizes) as CSS custom properties on `:root`. Canvas drawing code reads these values once at setup.
**When to use:** All rendering code references theme constants, never hardcoded values.

```css
:root {
  --bg-color: #FFFFFF;
  --stroke-color: #1A1A1A;
  --stroke-width: 3;
  --font-size: 18px;
  --font-family: 'Segoe UI', system-ui, sans-serif;
  --node-radius: 16;
  --padding: 24px;
}
```

```javascript
// Read theme values once at startup
const styles = getComputedStyle(document.documentElement);
const THEME = {
  strokeColor: styles.getPropertyValue('--stroke-color').trim(),
  strokeWidth: parseInt(styles.getPropertyValue('--stroke-width')),
  fontSize: styles.getPropertyValue('--font-size').trim(),
  nodeRadius: parseInt(styles.getPropertyValue('--node-radius')),
};
```

**Confidence:** HIGH (standard CSS custom properties pattern)

### Pattern 4: Bounding-Box Drawing Contract

**What:** Every structure's `draw()` function receives a bounding rectangle `{x, y, width, height}` and renders within it. Structures never use raw pixel coordinates.
**When to use:** Established in Phase 1 as the contract; enforced in Phase 2+ when structure modules are built.

```javascript
// Contract that every structure module will follow:
// draw(ctx, instance, { x, y, width, height, colors, theme })
//
// - Render within the bounding box [x, y, x+width, y+height]
// - Use theme constants for stroke, font, node size
// - Use colors array for element correspondence
// - Return element positions: { elementId: { x, y } }
```

**Confidence:** HIGH (architecture research explicitly identifies coordinate chaos as the number one pitfall to prevent)

### Anti-Patterns to Avoid

- **Hardcoding canvas dimensions:** Never write `canvas.width = 800`. Always derive from container size and `devicePixelRatio`. The projector resolution may differ from the dev screen.
- **Raw pixel coordinates in draw functions:** Never write `ctx.moveTo(400, 300)` in a structure's draw code. Always work relative to the bounding box passed in `opts`.
- **Global mutable state for animation:** Even in Phase 1, do not create global variables for playback state. The app controller will own state in Phase 2.
- **Using `.mjs` file extension:** Some servers don't serve `.mjs` with correct MIME type. Use `.js` for all modules.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HiDPI scaling | Manual pixel doubling | `devicePixelRatio` + CSS dimension pattern | The standard 5-line pattern handles all edge cases including fractional DPR values |
| Dyck word validation | Ad-hoc string checks | Prefix-sum validation (running sum >= 0, final sum = 0) | Mathematically complete; any other approach misses edge cases |
| Color palette | Random hex colors | Pre-tested projector-safe palette (see colors.js) | Projector gamut compression makes arbitrary colors indistinguishable |
| Module loading | Script concatenation | Native ES Modules (`<script type="module">`) | Built into all modern browsers; automatic dependency resolution and strict mode |

**Key insight:** Phase 1 has almost nothing to hand-roll because it uses only native browser APIs. The risk is in getting the contracts right (bounding box, Dyck word format, theme values) so later phases don't need rework.

## Common Pitfalls

### Pitfall 1: Canvas Blurry on Retina/HiDPI Displays

**What goes wrong:** Canvas renders at 1x resolution on a 2x display. Everything looks fuzzy, especially text and thin lines. This is immediately visible on the classroom projector if the laptop has a HiDPI screen.
**Why it happens:** The canvas backing store defaults to CSS pixel dimensions, not device pixels. Without `devicePixelRatio` scaling, a 800x600 CSS canvas only has 800x600 actual pixels even on a 2x display.
**How to avoid:** Apply the HiDPI setup pattern (Pattern 1 above) before any drawing. Also handle window resize events to reapply scaling.
**Warning signs:** Text looks pixelated. Lines look thicker than expected. Circles look jagged.

### Pitfall 2: Dyck Word Enumeration Off-by-One

**What goes wrong:** The enumerator produces the wrong count for some n value. Often n=1 returns 2 instead of 1 (including the empty word), or n=4 returns 13 or 15 instead of 14.
**Why it happens:** Base case handling. The empty word (n=0) is a valid Dyck word but is not a useful Catalan instance. The recursive generator may allow an extra close before an open in certain edge cases.
**How to avoid:** Verify counts immediately: `enumerate(1).length === 1`, `enumerate(2).length === 2`, `enumerate(3).length === 5`, `enumerate(4).length === 14`. Also verify every generated word passes `validate()`. Add these as console assertions during development.
**Warning signs:** Any Catalan count mismatch. Any word with negative prefix sum.

### Pitfall 3: ES Modules Fail Over file:// Protocol

**What goes wrong:** Opening `index.html` directly by double-clicking the file shows a blank page. The browser console shows CORS errors for module imports.
**Why it happens:** ES Modules require HTTP(S) due to CORS policy. The `file://` protocol does not set CORS headers, so `import` statements fail silently or with opaque errors.
**How to avoid:** Always serve via HTTP: `python3 -m http.server 8080`. Document this as a comment in `index.html`. Add a `<noscript>` fallback message.
**Warning signs:** Blank page with no visible errors (unless DevTools console is open).

### Pitfall 4: Canvas Context Lost After Resize

**What goes wrong:** After a window resize, the canvas goes blank or renders at the wrong scale. Previous drawings disappear.
**Why it happens:** Setting `canvas.width` or `canvas.height` resets the entire canvas state (clears content, resets transforms, resets styles). If resize logic sets dimensions without re-applying the DPR scale and redrawing, the canvas shows nothing.
**How to avoid:** The resize handler must: (1) recompute dimensions with DPR, (2) re-apply `ctx.scale(dpr, dpr)`, (3) trigger a full redraw. Debounce the resize handler (200ms) to avoid thrashing during drag-resize.
**Warning signs:** Canvas goes blank after resizing. Drawing appears at wrong scale after resize.

### Pitfall 5: White Background Not Actually Set

**What goes wrong:** The canvas background appears as transparent (showing the page background) or as black in some browsers. Screenshots and screen shares show unexpected background colors.
**Why it happens:** With `{ alpha: false }`, the initial canvas state is opaque black in some implementations. Without an explicit `fillRect` to set the white background, the result depends on the browser.
**How to avoid:** Always fill with white at the start of every render cycle: `ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height);`. Do this instead of `clearRect` when using `{ alpha: false }`.
**Warning signs:** Canvas appears black before first draw. Screenshots show black background.

## Code Examples

### Complete HiDPI Canvas Setup

```javascript
// core/canvas-utils.js
export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.scale(dpr, dpr);

  return { ctx, width: rect.width, height: rect.height, dpr };
}

export function clearCanvas(ctx, width, height) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
}
```

**Source:** MDN Canvas optimization guide + devicePixelRatio documentation

### Complete Dyck Word Enumerator with Validation

```javascript
// core/dyck.js

// Catalan numbers for verification
const CATALAN = [1, 1, 2, 5, 14];

export function enumerate(n) {
  if (n < 1 || n > 4) throw new RangeError('n must be 1-4, got ' + n);

  const results = [];

  function generate(word, opens, closes) {
    if (word.length === 2 * n) {
      results.push(word);
      return;
    }
    if (opens < n) {
      generate([...word, 1], opens + 1, closes);
    }
    if (closes < opens) {
      generate([...word, -1], opens, closes + 1);
    }
  }

  generate([], 0, 0);

  // Self-verification
  console.assert(
    results.length === CATALAN[n],
    'enumerate(' + n + ') produced ' + results.length + ', expected ' + CATALAN[n]
  );

  return results;
}

export function validate(word) {
  let sum = 0;
  for (const step of word) {
    sum += step;
    if (sum < 0) return false;
  }
  return sum === 0;
}
```

**Source:** Standard recursive Catalan enumeration algorithm (combinatorics textbooks)

### Minimal index.html Shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catalan Number Bijection Explorer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>Catalan Bijection Explorer</h1>
    </header>
    <main>
      <div id="canvas-container">
        <canvas id="main-canvas"></canvas>
      </div>
    </main>
    <noscript>This app requires JavaScript and must be served over HTTP.</noscript>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

### Projector-Safe Color Palette

```javascript
// core/colors.js
// High-contrast on white background, projector-safe, colorblind-friendly pairs
export const CORRESPONDENCE_COLORS = [
  '#2196F3', // blue
  '#F44336', // red
  '#4CAF50', // green
  '#FF9800', // orange
  '#9C27B0', // purple
  '#00BCD4', // cyan
  '#795548', // brown
  '#607D8B', // blue-grey
];

export const THEME_COLORS = {
  background: '#FFFFFF',
  stroke: '#1A1A1A',
  gridLine: '#E0E0E0',
  highlight: '#FFC107',
  text: '#212121',
};
```

### Resize Handler with Debounce

```javascript
// In main.js
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const { ctx, width, height } = setupCanvas(canvas);
    clearCanvas(ctx, width, height);
    // Trigger redraw of current state
  }, 200);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `canvas.width = N` (fixed pixels) | `devicePixelRatio` scaling | Always needed on HiDPI (mainstream since ~2014) | Sharp rendering on all modern displays |
| `<script>` with IIFE modules | `<script type="module">` with ES imports | Baseline since 2018 (Chrome 61, Firefox 60) | Clean file separation without bundlers |
| `setInterval` for animation | `requestAnimationFrame` | Recommended since 2012 | Synced to display refresh, auto-pauses in background |
| CSS pixel values everywhere | CSS custom properties for theming | Widespread since ~2017 | Single source of truth for visual constants |

**Deprecated/outdated:**
- Using `CanvasRenderingContext2D.mozDash` or `-webkit-` prefixes: replaced by standard `setLineDash()`

## Open Questions

1. **Canvas container sizing strategy**
   - What we know: The canvas must fill a significant portion of the viewport for projector visibility
   - What's unclear: Exact aspect ratio and whether to use `vw/vh` units or fixed breakpoints
   - Recommendation: Use `100vw` width minus padding, maintain 16:9 aspect ratio (matches most projectors), allow CSS to handle it. Test on actual projector in Phase 7.

2. **Monospace font for text-based structures**
   - What we know: Parentheses and ballot sequences need character-aligned rendering
   - What's unclear: Whether the system monospace font renders well on all target machines
   - Recommendation: Use `'Consolas', 'Courier New', monospace` font stack. These are installed on Windows, macOS, and Linux. No web font dependency needed.

## Sources

### Primary (HIGH confidence)
- MDN Canvas API reference -- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- MDN Canvas optimization guide -- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- MDN devicePixelRatio -- https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
- MDN JavaScript Modules Guide -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- MDN requestAnimationFrame -- https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame

### Secondary (MEDIUM confidence)
- Project's own STACK.md research (verified against MDN patterns)
- Project's own ARCHITECTURE.md research (verified against MDN patterns)
- Project's own PITFALLS.md research (based on established domain knowledge)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native browser APIs, no third-party dependencies, verified against MDN
- Architecture: HIGH - File structure and module patterns from project's architecture research, verified against MDN ES Modules guide
- Pitfalls: HIGH - Canvas HiDPI, CORS, and Dyck enumeration pitfalls are well-documented in established references

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable domain, native browser APIs, no version churn)
