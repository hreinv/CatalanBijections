# Stack Research

**Domain:** Interactive mathematical visualization (Catalan number bijection explorer)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| HTML5 Canvas (`<canvas>` + `CanvasRenderingContext2D`) | Baseline (all browsers since 2015) | All visual rendering of combinatorial structures and bijection animations | Native browser API, zero dependencies, immediate-mode drawing gives full pixel-level control over mathematical shapes (trees, paths, polygons, arcs). No DOM overhead for rendering 11 different structure types. | HIGH |
| Vanilla JavaScript (ES2022+) | Current engines | Application logic, data structures, animation control | No framework needed for a single-page presentation tool. ES2022+ features (private fields, `at()`, `structuredClone()`) are universally supported. Avoids build-step risk during a live presentation. | HIGH |
| ES Modules (`type="module"`) | Baseline (all browsers) | Code organization into structure modules, bijection modules, animation engine | Native `import`/`export` with `<script type="module">` provides clean file separation without bundlers. Automatic strict mode. Deferred loading by default. | HIGH |
| CSS3 (vanilla, no preprocessor) | Current | Layout of controls, panels, step descriptions | Flexbox/Grid for the control panel layout. CSS custom properties for theming (projector-friendly colors). No preprocessor needed for a single-page app. | HIGH |

### Supporting APIs (Built into the Browser)

| API | Purpose | When to Use | Confidence |
|-----|---------|-------------|------------|
| `requestAnimationFrame()` | Bijection animation loop | Every animated transition between structures. Provides 60fps sync with display, auto-pauses in background tabs. | HIGH |
| `Path2D` | Reusable shape definitions | Define each combinatorial structure's visual shape once, reuse across frames. Cleaner than rebuilding paths every frame. Baseline since August 2016. | HIGH |
| `isPointInPath(path, x, y)` | Click/hover detection on canvas shapes | Instance selection, node clicking in tree structures, polygon vertex interaction. Works directly with `Path2D` objects. Baseline since July 2015. | HIGH |
| `ctx.save()` / `ctx.restore()` | Transformation state management | Every structure's `draw()` method should save/restore to isolate transformations. Critical when drawing recursive structures (binary trees, plane trees). | HIGH |
| `ctx.measureText()` | Text layout calculations | Centering labels on nodes, positioning parenthesis strings, aligning step descriptions. Returns `TextMetrics` with width and bounding box data. | HIGH |
| `performance.now()` | High-resolution timing | Animation progress calculation. Use the `DOMHighResTimeStamp` passed to `requestAnimationFrame` callback, not `Date.now()`. | HIGH |
| `devicePixelRatio` | HiDPI/Retina display support | Scale canvas buffer for sharp rendering on projectors and high-DPI laptop screens. Apply once at setup. | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Python `http.server` or `npx http-server` | Local dev server | ES modules require HTTP (not `file://`) due to CORS. Run `python3 -m http.server 8080` in project root. Zero config. |
| Browser DevTools (Chrome/Firefox) | Debugging, Canvas inspector | Chrome's "Rendering" tab shows FPS counter. Firefox has a dedicated Canvas debugger. |
| No linter/formatter required | Simplicity | For a presentation tool with a single developer, linting overhead is not worth it. Code style consistency through convention. |

## Architecture-Defining Patterns

### 1. Canvas Animation Loop (prescriptive pattern)

Use a timestamp-based animation loop, NOT a frame-counting loop. This ensures consistent speed across 60Hz, 120Hz, and 144Hz displays.

```javascript
// animation-engine.js
export class AnimationEngine {
  #startTime = null;
  #duration = 0;
  #rafId = null;
  #onFrame = null;

  play(duration, onFrame, onComplete) {
    this.#duration = duration;
    this.#onFrame = onFrame;
    this.#startTime = null;

    const tick = (timestamp) => {
      if (this.#startTime === null) this.#startTime = timestamp;
      const elapsed = timestamp - this.#startTime;
      const t = Math.min(elapsed / this.#duration, 1.0); // progress 0..1

      onFrame(t); // pass normalized progress

      if (t < 1.0) {
        this.#rafId = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    this.#rafId = requestAnimationFrame(tick);
  }

  pause() {
    if (this.#rafId) cancelAnimationFrame(this.#rafId);
  }
}
```

**Why this pattern:** The `t` parameter (0 to 1) decouples animation progress from frame rate. Each structure's draw method receives `t` and interpolates positions. This is the standard pattern recommended by MDN.

**Confidence:** HIGH (MDN official documentation explicitly recommends timestamp-based animation)

### 2. Easing Functions (prescriptive set)

Implement easing as pure functions that transform `t` (0..1) to a curved `t`. Do NOT use a library.

```javascript
// easing.js
export const easing = {
  linear: (t) => t,
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  easeOut: (t) => 1 - (1 - t) ** 3,
  easeIn: (t) => t ** 3,
};
```

**Why these four:** `easeInOut` is the primary easing for bijection transitions (smooth start and stop). `linear` for step-through scrubbing. `easeOut` for snapping to position. `easeIn` is rarely needed but completes the set. Cubic (power of 3) provides visually smooth curves without being sluggish.

**Confidence:** HIGH (standard easing math, Robert Penner's equations simplified)

### 3. ES Module File Organization (prescriptive structure)

```
index.html
css/
  style.css
js/
  main.js                     # Entry point, wires up UI
  animation-engine.js          # requestAnimationFrame loop, playback controls
  easing.js                    # Easing functions
  renderer.js                  # Canvas setup, HiDPI scaling, clear/redraw
  structures/
    base.js                    # Shared interface: toDyck(), fromDyck(), draw()
    parentheses.js
    dyck-paths.js
    mountain-ranges.js
    lattice-paths.js
    staircase-polygons.js
    binary-trees.js
    rooted-plane-trees.js
    ballot-sequences.js
    noncrossing-partitions.js
    triangulations.js
    stack-sortable-permutations.js
  bijections/
    base.js                    # Shared interface: getSteps()
    parentheses-dyck.js
    binary-trees-triangulations.js
    parentheses-binary-trees.js
    dyck-lattice.js
    binary-trees-plane-trees.js
    dyck-mountain.js
    noncrossing-triangulations.js
    ballot-dyck.js
    bridge.js                  # Dyck word composition for non-classical pairs
  ui/
    controls.js                # Play/pause/step buttons, speed slider
    selector.js                # Structure picker dropdowns
    instance-nav.js            # Cycle through C(n) instances
    step-display.js            # Step description text panel
```

**Why this layout:**
- One module per structure keeps the 11 renderers isolated and testable.
- One module per bijection keeps animation step logic separate from drawing.
- `js/` prefix avoids MIME type issues (some servers misconfigure `.mjs`).
- All `.js` extensions (not `.mjs`) because `.js` has universal MIME support.
- No import maps needed -- relative paths (`./structures/binary-trees.js`) are sufficient for ~30 files. Import maps add complexity without benefit at this scale.

**Confidence:** HIGH (MDN ES modules documentation confirms this pattern works without build tools)

### 4. HiDPI Canvas Setup (prescriptive snippet)

```javascript
// renderer.js
export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.scale(dpr, dpr);

  return ctx;
}
```

**Why `{ alpha: false }`:** The app uses a white background (projector-friendly). Disabling the alpha channel gives a measurable performance boost by skipping compositing with the page background. MDN optimization guide explicitly recommends this.

**Confidence:** HIGH (MDN Canvas optimization documentation)

### 5. Canvas Drawing Patterns for Mathematical Structures

**For tree structures (binary trees, plane trees):**
Use recursive `save()/translate()/restore()` to position nodes. This avoids manual coordinate arithmetic for each node.

```javascript
function drawTree(ctx, node, x, y, spread) {
  ctx.save();
  ctx.translate(x, y);

  // Draw node circle
  ctx.beginPath();
  ctx.arc(0, 0, NODE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Recurse to children with translated coordinates
  if (node.left) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-spread, LEVEL_HEIGHT);
    ctx.stroke();
    drawTree(ctx, node.left, -spread, LEVEL_HEIGHT, spread / 2);
  }

  ctx.restore();
}
```

**For path/grid structures (Dyck paths, lattice paths, mountain ranges):**
Use `moveTo()`/`lineTo()` with coordinate mapping functions. Define a `mapToCanvas(gridX, gridY)` utility that converts grid coordinates to pixel coordinates with padding.

**For polygon structures (triangulations, staircase polygons):**
Use `Path2D` objects to define the convex polygon vertices, then draw diagonals as separate paths. Store `Path2D` references for `isPointInPath()` hit testing.

**For text-based structures (parentheses, ballot sequences):**
Use `ctx.measureText()` to compute widths, then position characters with `ctx.fillText()`. Use monospace font (`'Consolas', 'Courier New', monospace`) for character-aligned rendering.

**For circular structures (non-crossing partitions):**
Use `ctx.arc()` for the outer circle, compute point positions with `Math.cos()/Math.sin()` at regular angle intervals, and draw partition arcs with `ctx.quadraticCurveTo()` or `ctx.bezierCurveTo()`.

**Confidence:** HIGH (standard Canvas 2D API usage patterns from MDN documentation)

### 6. Interpolation Pattern for Bijection Animations

```javascript
// Lerp between two positions based on animation progress t
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Interpolate between two complete structure states
function interpolateState(fromState, toState, t) {
  return {
    x: lerp(fromState.x, toState.x, t),
    y: lerp(fromState.y, toState.y, t),
    opacity: lerp(fromState.opacity, toState.opacity, t),
    scale: lerp(fromState.scale, toState.scale, t),
  };
}
```

**Why linear interpolation as the base:** Each bijection step defines its own `fromState` and `toState`. The easing function transforms `t` before passing it to `lerp`. This separation means bijection authors only think about keyframes, not timing curves.

**Confidence:** HIGH (fundamental animation math)

### 7. Color Correspondence System

Use a fixed palette of 8 distinct, projector-friendly colors for element correspondence. Assign colors to elements in the source structure; the bijection maps them to corresponding elements in the target.

```javascript
// colors.js
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
```

**Why these:** High contrast on white background, distinguishable for common color vision deficiencies (blue/orange and purple/green pairings), and sufficient for n<=4 (max 8 elements in a Dyck word of length 8).

**Confidence:** MEDIUM (color choices are subjective; these are standard Material Design colors with good contrast ratios, but projector color reproduction varies)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vanilla Canvas 2D | SVG DOM manipulation | If you needed built-in DOM event handling per element (click handlers on individual shapes). Not this project -- Canvas is faster for frequent full-scene redraws during animation. |
| Vanilla Canvas 2D | D3.js | If you were building a data dashboard with axes, scales, and CSV parsing. Massive overkill for hand-crafted mathematical drawings. Adds 80KB+ dependency. |
| Vanilla Canvas 2D | p5.js | If you were prototyping creative coding sketches. Good for exploration but adds a global-state paradigm and 800KB+ dependency. Wrong abstraction for a structured app. |
| ES Modules (native) | Single concatenated file | If targeting pre-2018 browsers. No reason to do this in 2025/2026. |
| ES Modules (native) | Webpack/Vite bundler | If you had npm dependencies or needed tree-shaking. This project has zero dependencies. A bundler adds a build step that can fail during a live presentation. |
| Relative imports | Import maps | If you had 100+ modules or CDN dependencies. With ~30 local files, relative paths are clearer and have zero configuration. |
| `requestAnimationFrame` | CSS Animations/Transitions | If animating DOM elements. Canvas content cannot be animated with CSS -- only the canvas element itself. |
| `requestAnimationFrame` | Web Animations API | If animating DOM elements with JavaScript control. Same limitation -- does not apply to canvas-drawn content. |
| Hand-coded easing | GreenSock (GSAP) | If you needed complex timeline orchestration with 50+ simultaneous tweens. Overkill for step-by-step bijection playback. Adds dependency. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React / Vue / any framework | Adds build step, dependency risk, and DOM abstraction that fights Canvas. Frameworks manage DOM -- this app's visuals are 100% Canvas. | Vanilla JS with ES Modules |
| D3.js | Designed for data-driven SVG/DOM manipulation. Its scale/axis abstractions are irrelevant for hand-drawn mathematical structures. 80KB+ for unused features. | Direct Canvas 2D API calls |
| p5.js | Global-state paradigm (`setup()`/`draw()`) conflicts with the app's need for explicit animation control (play/pause/step). Also 800KB+. | `requestAnimationFrame` loop |
| TypeScript | Requires a compile step. If `tsc` fails or is not installed on the presentation machine, the app will not run. Types are valuable but not worth the risk for a presentation tool. | JSDoc type annotations (optional, zero build cost) |
| npm / node_modules | No dependencies to install. Adding `package.json` invites `npm install` failures on air-gapped or misconfigured machines. | Direct `<script type="module">` imports |
| WebGL / Three.js | 2D mathematical structures do not need 3D rendering. WebGL's shader pipeline adds enormous complexity for zero visual benefit. | Canvas 2D context |
| `setInterval()` / `setTimeout()` for animation | Not synced to display refresh rate. Causes janky animations, especially on variable-refresh displays. Does not auto-pause in background tabs. | `requestAnimationFrame()` |
| Canvas `getImageData()` / `putImageData()` | Pixel manipulation is not needed. All structures are drawn with vector primitives (paths, arcs, text). Pixel operations are orders of magnitude slower. | Path-based drawing with `stroke()`/`fill()` |
| `.mjs` file extension | Some web servers do not serve `.mjs` with the correct MIME type (`text/javascript`). This can cause silent module loading failures. | `.js` extension for all modules |

## Stack Patterns by Variant

**If the projector resolution is low (1024x768):**
- Use larger node radii (20px+), thicker lines (`lineWidth: 3`), and 18px+ font sizes.
- Test with `canvas.style.width = '1024px'` during development.

**If adding a new Catalan structure later:**
- Create `js/structures/new-structure.js` implementing `toDyck()`, `fromDyck()`, `draw()`.
- Register it in the structure registry. No other files change.

**If adding a new classical bijection later:**
- Create `js/bijections/new-bijection.js` implementing `getSteps()`.
- Register source/target pair in the bijection registry. The bridge module handles everything else.

**If you need to serve from GitHub Pages:**
- Works out of the box. GitHub Pages serves `.js` files with correct MIME types.
- ES Modules work over HTTPS without any configuration.

## Version Compatibility

Not applicable -- this project has zero external dependencies. All APIs used are Baseline Widely Available (supported in all browsers since at least August 2016). The oldest API relied upon is Canvas 2D (July 2015). The newest is `import maps` (March 2023), which is NOT used in this project to maximize compatibility.

**Minimum browser requirements:**
- Chrome 61+ (ES Modules, September 2017)
- Firefox 60+ (ES Modules, May 2018)
- Safari 11+ (ES Modules, September 2017)
- Edge 16+ (ES Modules, October 2017)

Any browser updated in the last 8 years will run this app.

## Local Development Setup

```bash
# No installation. Just serve the files:
cd /path/to/project
python3 -m http.server 8080
# Open http://localhost:8080 in browser

# Alternative if Python is unavailable:
npx http-server -p 8080
```

No `npm install`. No `package.json`. No build step. No configuration files.

## Sources

- MDN Canvas API reference -- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API (HIGH confidence, official documentation)
- MDN Canvas Tutorial (12 modules) -- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial (HIGH confidence, official tutorial)
- MDN Canvas Optimization Guide -- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas (HIGH confidence, official performance guide)
- MDN requestAnimationFrame -- https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame (HIGH confidence, official API reference)
- MDN Path2D -- https://developer.mozilla.org/en-US/docs/Web/API/Path2D (HIGH confidence, official API reference)
- MDN isPointInPath -- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/isPointInPath (HIGH confidence, official API reference)
- MDN JavaScript Modules Guide -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules (HIGH confidence, official guide)
- MDN Import Maps -- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap (HIGH confidence, official specification reference)
- MDN Canvas Transformations -- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations (HIGH confidence, official tutorial)
- MDN measureText -- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText (HIGH confidence, official API reference)

---
*Stack research for: Catalan Number Bijection Explorer*
*Researched: 2026-02-23*
