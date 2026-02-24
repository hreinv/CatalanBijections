# Phase 2: Vertical Slice - Research

**Researched:** 2026-02-23
**Domain:** Structure rendering (4 structures), Dyck word conversions, animation engine, UI controls, side-by-side layout
**Confidence:** HIGH

## Summary

Phase 2 is the integration phase that proves the entire pipeline works end-to-end: four Catalan structures rendered on canvas, a Dyck word conversion layer connecting them, an animation engine with playback controls, and a UI skeleton for structure selection and instance navigation. This is the critical "vertical slice" -- once this works, Phases 3-7 are filling in more structures, bijections, and polish using the same patterns.

The four structures chosen for this phase (balanced parentheses, Dyck paths, binary trees, triangulations) represent a good spread of rendering complexity: text-based (parentheses), grid-based (Dyck paths), recursive tree layout (binary trees), and geometry-based (polygon triangulations). Each must implement `toDyck()`, `fromDyck()`, and `draw(ctx, instance, opts)` following the uniform module interface established in the architecture research. The animation engine must use `requestAnimationFrame` with timestamp-based timing (not frame counting) to support variable refresh rates. The UI uses standard HTML form controls (dropdowns, buttons, range slider) positioned outside the canvas.

The Dyck word is the universal internal representation. The `enumerate(n)` function from Phase 1 provides the word list; each structure's `fromDyck(word)` converts to its own domain representation, and `draw()` renders it to a bounding box on the canvas. Round-trip correctness (`toDyck(fromDyck(word)) === word`) must be verified for all 14 instances at n=4.

**Primary recommendation:** Build the four structure modules first (each independently testable via the browser test harness pattern from Phase 1), then wire up the UI controls and app state, then add the animation engine last. Verify round-trip Dyck conversions for all C(4)=14 instances before integrating with the UI.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRC-01 | Balanced parentheses rendered as formatted character sequences | Text rendering with monospace font from CSS theme; `fromDyck` maps +1 to '(' and -1 to ')'; see Parentheses Rendering pattern |
| STRC-02 | Dyck paths rendered as lattice paths with up/down steps on a grid | Grid drawing with `moveTo`/`lineTo` on canvas; +1 = up-right step, -1 = down-right step; see Dyck Path Rendering pattern |
| STRC-06 | Binary trees rendered with recursive node-edge layout | Simplified Reingold-Tilford layout: post-order traversal assigns x/y, centering parents over children; see Binary Tree Layout pattern |
| STRC-10 | Triangulations rendered as convex polygons with diagonals | Draw (n+2)-gon vertices on circle, connect vertices with non-crossing diagonals; see Triangulation Rendering pattern |
| STRC-12 | Each structure correctly converts to/from Dyck word representation (round-trip verified for all C(4)=14 instances) | Four `toDyck()`/`fromDyck()` implementations with recursive decomposition; verification harness checks `toDyck(fromDyck(w)) === w` for all words |
| ANIM-01 | Timestamp-based animation loop using requestAnimationFrame | `requestAnimationFrame` callback receives `DOMHighResTimeStamp`; delta-time accumulation drives progress 0.0-1.0; see Animation Engine pattern |
| ANIM-02 | Play/pause toggle for bijection animations | Boolean `playing` state controls rAF loop start/stop; `cancelAnimationFrame(id)` for clean pause |
| ANIM-03 | Step forward and step backward controls for manual progression | Increment/decrement `currentStep` index, set progress to 0.0 or 1.0, trigger single render |
| ANIM-04 | Jump to start and jump to end controls | Set `currentStep` to 0 (start) or `steps.length - 1` (end), set progress to 0.0 or 1.0 |
| ANIM-05 | Speed slider adjustable from 0.5x to 3x | HTML `<input type="range" min="0.5" max="3" step="0.1">` multiplies delta-time in animation loop |
| UICT-01 | Structure A and Structure B dropdown selectors | HTML `<select>` elements populated with structure keys; `change` event updates app state and triggers re-render |
| UICT-02 | n selector (1-4) to set the Catalan number index | HTML `<select>` or radio buttons for n=1..4; changing n re-enumerates Dyck words and resets instance index to 0 |
| UICT-03 | Instance navigator with previous/next buttons and "X of Y" indicator | Previous/next buttons cycle `instanceIndex` through `0..enumerate(n).length-1`; display element shows `"3 of 14"` format |
| UICT-05 | Side-by-side dual-panel layout with source structure left, target structure right | Canvas split into two bounding boxes; each structure's `draw()` receives its half; CSS layout for controls below canvas |
</phase_requirements>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| HTML5 Canvas 2D | Baseline | All structure rendering | Established in Phase 1; immediate-mode drawing gives pixel-level control |
| Vanilla JS (ES2022+ modules) | Current | All logic | Zero-dependency constraint; ES modules for file organization |
| CSS3 with custom properties | Current | Layout, controls styling, theme | Theme contract from Phase 1; flexbox for control panel layout |
| requestAnimationFrame | Baseline | Animation timing | Browser-native, syncs to display refresh, auto-pauses in background tabs |

### Supporting

| API | Purpose | When to Use |
|-----|---------|-------------|
| `DOMHighResTimeStamp` | Delta-time animation | Callback parameter from requestAnimationFrame; drives animation progress |
| `cancelAnimationFrame()` | Stop animation loop | Called on pause, structure change, or navigation to prevent orphan loops |
| `<input type="range">` | Speed slider | Native HTML range input, no custom slider needed |
| `<select>` | Structure selectors, n selector | Native dropdowns, styled with CSS to match theme |
| `Path2D` | Reusable shape paths | Cache polygon outlines for triangulation rendering |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML controls below canvas | Drawing controls on canvas | DOM controls are more accessible, get free styling, and avoid complex hit-testing |
| Simplified tree layout | Full Reingold-Tilford | For n<=4 (max 14 trees, max 4 internal nodes), a simple recursive layout suffices without contour-merging complexity |
| Pre-computed polygon vertices | Dynamic polygon computation | Pre-computing (n+2)-gon vertex positions for n=1..4 is trivial and avoids per-frame trig |

**Installation:**
```bash
# No installation. Same as Phase 1:
python3 -m http.server 8080
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
js/
  main.js                   # Evolves into App Controller with state management
  core/
    dyck.js                 # (Phase 1) Dyck word enumeration
    canvas-utils.js          # (Phase 1) HiDPI setup + new drawing helpers
    colors.js                # (Phase 1) Color palette
  structures/
    registry.js              # Map of structure key -> module, metadata (label, etc.)
    parentheses.js           # STRC-01: toDyck, fromDyck, draw
    dyck-path.js             # STRC-02: toDyck, fromDyck, draw
    binary-tree.js           # STRC-06: toDyck, fromDyck, draw
    triangulation.js         # STRC-10: toDyck, fromDyck, draw
  engine/
    animation.js             # ANIM-01..05: rAF loop, playback state machine
tests/
  test-dyck.html             # (Phase 1) existing test harness
  test-structures.html       # New: round-trip verification for all 4 structures
```

### Pattern 1: Uniform Structure Module Interface

**What:** Every structure module exports exactly three functions with identical signatures.
**When to use:** Every structure module in the project.

```javascript
// structures/parentheses.js (and every other structure module)

/**
 * Convert a Dyck word to this structure's domain representation.
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {*} Structure-specific instance object
 */
export function fromDyck(dyckWord) { /* ... */ }

/**
 * Convert a structure instance back to its Dyck word.
 * @param {*} instance - Structure-specific instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) { /* ... */ }

/**
 * Render the structure instance on a canvas within a bounding box.
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} instance - Structure-specific instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) { /* ... */ }
```

**Confidence:** HIGH (established in architecture research, follows from Catalan mathematical structure)

### Pattern 2: App State Object (Owned by Controller)

**What:** A single mutable state object in main.js controls all application state. UI events update state, state changes trigger re-render.
**When to use:** The app controller (main.js).

```javascript
// js/main.js - Application state
const state = {
  n: 3,                        // Current Catalan order (1-4)
  instanceIndex: 0,            // Index into enumerate(n) result
  sourceKey: 'parentheses',    // Left panel structure key
  targetKey: 'dyck-path',      // Right panel structure key

  // Derived (recomputed on n or key change)
  dyckWords: [],               // enumerate(n) result
  currentDyck: null,           // dyckWords[instanceIndex]

  // Animation
  animation: {
    steps: [],                 // Current step sequence (empty until bijections in Phase 3)
    currentStep: 0,
    progress: 0.0,             // 0.0 to 1.0 within current step
    playing: false,
    speed: 1.0,                // Multiplier (0.5x to 3.0x)
  }
};
```

**Confidence:** HIGH (architecture research pattern, simple and sufficient for this app's complexity)

### Pattern 3: Side-by-Side Canvas Layout

**What:** The canvas is divided into two bounding boxes. Each structure's `draw()` receives its half.
**When to use:** Every render cycle.

```javascript
function render() {
  clearCanvas(ctx, canvasWidth, canvasHeight);

  const padding = 20;
  const panelWidth = (canvasWidth - padding * 3) / 2;
  const panelHeight = canvasHeight - padding * 2;

  // Left panel: source structure
  const sourceInstance = structures[state.sourceKey].fromDyck(state.currentDyck);
  structures[state.sourceKey].draw(ctx, sourceInstance, {
    x: padding, y: padding,
    width: panelWidth, height: panelHeight,
    theme, colors: CORRESPONDENCE_COLORS,
  });

  // Right panel: target structure
  const targetInstance = structures[state.targetKey].fromDyck(state.currentDyck);
  structures[state.targetKey].draw(ctx, targetInstance, {
    x: padding * 2 + panelWidth, y: padding,
    width: panelWidth, height: panelHeight,
    theme, colors: CORRESPONDENCE_COLORS,
  });
}
```

**Confidence:** HIGH (standard Canvas pattern, verified by architecture research)

### Pattern 4: requestAnimationFrame with Timestamp-Based Timing

**What:** The animation loop uses the timestamp parameter from rAF to compute delta time, making animation speed independent of display refresh rate.
**When to use:** Animation engine.

```javascript
// engine/animation.js
// Source: MDN requestAnimationFrame documentation

let animFrameId = null;
let lastTimestamp = null;

function tick(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }
  const deltaMs = (timestamp - lastTimestamp) * state.animation.speed;
  lastTimestamp = timestamp;

  // Advance progress within current step
  const step = state.animation.steps[state.animation.currentStep];
  if (step) {
    state.animation.progress += deltaMs / step.duration;
    if (state.animation.progress >= 1.0) {
      state.animation.progress = 1.0;
      // Advance to next step or stop
      if (state.animation.currentStep < state.animation.steps.length - 1) {
        state.animation.currentStep++;
        state.animation.progress = 0.0;
      } else {
        state.animation.playing = false;
      }
    }
  }

  render();  // Redraw with updated progress

  if (state.animation.playing) {
    animFrameId = requestAnimationFrame(tick);
  }
}

export function play() {
  state.animation.playing = true;
  lastTimestamp = null;  // Reset delta tracking
  animFrameId = requestAnimationFrame(tick);
}

export function pause() {
  state.animation.playing = false;
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}
```

**Source:** [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
**Confidence:** HIGH

### Pattern 5: Structure Registry

**What:** A plain object maps string keys to module references and metadata, enabling dynamic dispatch.
**When to use:** Populating dropdowns, looking up structure modules by key.

```javascript
// structures/registry.js
import * as parentheses from './parentheses.js';
import * as dyckPath from './dyck-path.js';
import * as binaryTree from './binary-tree.js';
import * as triangulation from './triangulation.js';

export const structures = {
  'parentheses':    { module: parentheses,    label: 'Balanced Parentheses' },
  'dyck-path':      { module: dyckPath,       label: 'Dyck Paths' },
  'binary-tree':    { module: binaryTree,     label: 'Binary Trees' },
  'triangulation':  { module: triangulation,  label: 'Triangulations' },
};
```

**Confidence:** HIGH (standard pattern, avoids switch-case sprawl)

### Anti-Patterns to Avoid

- **Drawing UI controls on the canvas:** Use HTML `<select>`, `<button>`, `<input>` elements. Canvas-drawn controls require manual hit-testing, lack accessibility, and are harder to style.
- **Frame-count-based animation:** Never increment position by a fixed amount per frame. Use `deltaTime * speed` from the rAF timestamp. A 120Hz display would run 2x faster than 60Hz otherwise.
- **Storing animation state inside structure modules:** Structures must be stateless renderers. They receive an instance and a bounding box; they produce pixels. All playback state lives in the animation engine.
- **Re-enumerating Dyck words on every render:** Call `enumerate(n)` once when n changes, cache the result in state. The function is memoized but the pattern should still be cache-once-use-many.
- **Hardcoded canvas split positions:** Always compute panel widths from the canvas dimensions. The canvas may resize.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown selectors | Custom canvas-drawn dropdown | HTML `<select>` element | Native accessibility, keyboard navigation, mobile support for free |
| Speed slider | Custom canvas slider with drag handling | HTML `<input type="range">` | Native range input handles all drag/touch/keyboard interaction |
| Polygon vertex positions | Manual trig per render | Pre-computed vertex arrays for (n+2)-gon, n=1..4 | Only 4 polygon sizes ever used; compute once at module load |
| Tree node collision avoidance | Full Reingold-Tilford with contour merging | Simplified recursive layout (sufficient for max 4 internal nodes) | With n<=4, trees have at most 4 internal nodes; simple centering works without the full algorithm's complexity |
| Dyck word enumeration | Per-structure enumeration | Import `enumerate(n)` from `core/dyck.js` | Already built and verified in Phase 1; single source of truth |

**Key insight:** At n<=4, all data sets are tiny (max 14 instances, max 8-symbol words, max 4 internal tree nodes, max 6-gon). Sophisticated algorithms are unnecessary; simple recursive approaches suffice without performance concerns.

## Common Pitfalls

### Pitfall 1: Dyck Word Round-Trip Failure

**What goes wrong:** `toDyck(fromDyck(word))` produces a different word than the input for some instances. The structures appear to render correctly but are actually using inconsistent internal representations.
**Why it happens:** The `fromDyck` and `toDyck` functions use different recursive decomposition conventions. For binary trees, there are four valid mappings (`1L0R`, `1R0L`, `L1R0`, `R1L0`). If `fromDyck` uses `1L0R` but `toDyck` uses `L1R0`, the round-trip fails.
**How to avoid:** Pick one convention per structure and use it consistently. Use `1L0R` for binary trees (matches the natural left-to-right reading of the Dyck word). Write round-trip tests for ALL 14 instances at n=4 before integrating with the UI.
**Warning signs:** Two structures showing the "same" instance but rendering different objects. Instance navigator jumping unexpectedly.

### Pitfall 2: Binary Tree Layout Overlap at n=4

**What goes wrong:** For certain n=4 binary trees (especially the degenerate left-chain or right-chain), nodes overlap or extend outside the bounding box.
**Why it happens:** A naive layout that positions the left child at `(x - offset, y + levelHeight)` and the right child at `(x + offset, y + levelHeight)` with a fixed offset produces overlapping subtrees when one branch is much deeper than the other.
**How to avoid:** Use a post-order traversal that computes subtree widths before positioning. For n<=4 (max 4 internal nodes, max depth 4), a simple approach works: assign each leaf a column index (in-order traversal), then center each internal node over its children. Scale x-coordinates to fit the bounding box.
**Warning signs:** Nodes drawn on top of each other. Lines crossing through unrelated nodes.

### Pitfall 3: Triangulation Diagonal Crossing

**What goes wrong:** Diagonals of the triangulation cross each other, producing invalid visual output.
**Why it happens:** The `fromDyck` function generates the wrong set of diagonals because the vertex labeling convention doesn't match the recursive decomposition convention.
**How to avoid:** Use a consistent vertex numbering (0 through n+1 counterclockwise) and a recursive decomposition that always "roots" the triangulation at a fixed edge (e.g., the edge from vertex 0 to vertex n+1). Test all 14 instances at n=4 visually.
**Warning signs:** Lines crossing inside the polygon. Triangles that aren't actually triangles.

### Pitfall 4: Animation Engine Orphan Loops

**What goes wrong:** Changing structures or n while an animation is playing leaves a stale `requestAnimationFrame` callback running. It references old state and causes visual glitches or errors.
**Why it happens:** The code starts a new render loop without canceling the previous one.
**How to avoid:** Always call `cancelAnimationFrame(animFrameId)` before starting a new animation or when changing state that invalidates the current animation. Store the frame ID and null it on cancel.
**Warning signs:** Canvas flickering between two different states. Console errors about null references.

### Pitfall 5: Canvas Not Redrawn After UI Change

**What goes wrong:** The user selects a different structure or changes n, but the canvas still shows the old rendering.
**Why it happens:** The event handler updates state but doesn't trigger a re-render. In immediate-mode canvas rendering, nothing changes visually until you explicitly redraw.
**How to avoid:** Every state mutation function must end with a call to `render()`. Create a single `updateState(changes)` function that applies changes and triggers render.
**Warning signs:** Canvas shows stale content. Changes only appear after window resize (because resize handler triggers redraw).

### Pitfall 6: Speed Slider At 0x

**What goes wrong:** Setting speed to 0 causes the animation to freeze permanently, or causes a division-by-zero in progress calculation.
**Why it happens:** If speed multiplies deltaTime, speed=0 means progress never advances.
**How to avoid:** Set the minimum speed to 0.5x in the range input. Clamp speed in the engine: `Math.max(0.1, speed)`.
**Warning signs:** Animation appears stuck. Speed slider goes to zero.

## Code Examples

### Balanced Parentheses: fromDyck and toDyck

```javascript
// structures/parentheses.js

/**
 * Convert Dyck word to parenthesis string.
 * +1 maps to '(', -1 maps to ')'.
 * @param {number[]} dyckWord
 * @returns {string} e.g. "(()())"
 */
export function fromDyck(dyckWord) {
  return dyckWord.map(s => s === 1 ? '(' : ')').join('');
}

/**
 * Convert parenthesis string back to Dyck word.
 * @param {string} parens
 * @returns {number[]}
 */
export function toDyck(parens) {
  return [...parens].map(c => c === '(' ? 1 : -1);
}
```

**Confidence:** HIGH (direct mapping, trivially correct)

### Dyck Path: fromDyck and draw

```javascript
// structures/dyck-path.js

/**
 * Convert Dyck word to a sequence of (x, y) points for the lattice path.
 * Starting at (0, 0), +1 moves to (x+1, y+1), -1 moves to (x+1, y-1).
 * @param {number[]} dyckWord
 * @returns {{ points: Array<{x: number, y: number}> }}
 */
export function fromDyck(dyckWord) {
  const points = [{ x: 0, y: 0 }];
  let x = 0, y = 0;
  for (const step of dyckWord) {
    x += 1;
    y += step;  // +1 for up, -1 for down
    points.push({ x, y });
  }
  return { points };
}

/**
 * Draw the Dyck path on a grid within the bounding box.
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme } = opts;
  const { points } = instance;
  const n = (points.length - 1) / 2;  // Order

  // Compute scaling: x ranges 0..2n, y ranges 0..n
  const scaleX = width / (2 * n);
  const scaleY = height / (n + 1);  // +1 for padding

  // Draw grid lines
  ctx.strokeStyle = theme.gridLine || '#E0E0E0';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 2 * n; gx++) {
    ctx.beginPath();
    ctx.moveTo(x + gx * scaleX, y);
    ctx.lineTo(x + gx * scaleX, y + height);
    ctx.stroke();
  }
  for (let gy = 0; gy <= n; gy++) {
    ctx.beginPath();
    ctx.moveTo(x, y + height - gy * scaleY);
    ctx.lineTo(x + width, y + height - gy * scaleY);
    ctx.stroke();
  }

  // Draw path
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(x + points[0].x * scaleX, y + height - points[0].y * scaleY);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(x + points[i].x * scaleX, y + height - points[i].y * scaleY);
  }
  ctx.stroke();
}
```

**Confidence:** HIGH (direct geometric mapping from Dyck word steps)

### Binary Tree: fromDyck (Recursive 1L0R Decomposition)

```javascript
// structures/binary-tree.js

/**
 * Binary tree node. null represents an empty (leaf) node.
 * @typedef {{ left: TreeNode|null, right: TreeNode|null }} TreeNode
 */

/**
 * Convert Dyck word to binary tree using 1L0R decomposition.
 *
 * Decomposition: word = 1 L 0 R
 * where L is the Dyck sub-word for the left subtree,
 * and R is the Dyck sub-word for the right subtree.
 *
 * @param {number[]} dyckWord
 * @returns {TreeNode|null}
 */
export function fromDyck(dyckWord) {
  if (dyckWord.length === 0) return null;

  // Find the matching -1 for the first +1
  // This is the position where prefix sum returns to 0
  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < dyckWord.length; i++) {
    depth += dyckWord[i];
    if (depth === 0) {
      splitIdx = i;
      break;
    }
  }

  // word = [+1, ...leftWord, -1, ...rightWord]
  const leftWord = dyckWord.slice(1, splitIdx);       // Between first +1 and its matching -1
  const rightWord = dyckWord.slice(splitIdx + 1);      // Everything after

  return {
    left: fromDyck(leftWord),
    right: fromDyck(rightWord),
  };
}

/**
 * Convert binary tree back to Dyck word (1L0R).
 * @param {TreeNode|null} node
 * @returns {number[]}
 */
export function toDyck(node) {
  if (node === null) return [];
  return [1, ...toDyck(node.left), -1, ...toDyck(node.right)];
}
```

**Source:** SageMath DyckWord documentation (`1L0R` mapping)
**Confidence:** HIGH (well-established bijection, multiple references confirm)

### Binary Tree: Simplified Layout Algorithm

```javascript
/**
 * Assign (x, y) positions to tree nodes using in-order traversal for x
 * and depth for y. Sufficient for n<=4 (max 4 internal nodes).
 */
function layoutTree(node, depth = 0, counter = { value: 0 }) {
  if (node === null) return;

  layoutTree(node.left, depth + 1, counter);
  node.layoutX = counter.value;
  node.layoutY = depth;
  counter.value++;
  layoutTree(node.right, depth + 1, counter);
}

/**
 * Draw binary tree within bounding box.
 */
export function draw(ctx, instance, opts) {
  if (instance === null) return;

  const { x, y, width, height, theme } = opts;

  // Layout pass
  const counter = { value: 0 };
  layoutTree(instance, 0, counter);
  const totalLeaves = counter.value;
  const maxDepth = getMaxDepth(instance);

  // Scale to bounding box
  const nodeRadius = theme.nodeRadius || 16;
  const xScale = totalLeaves > 1 ? (width - nodeRadius * 2) / (totalLeaves - 1) : 0;
  const yScale = maxDepth > 0 ? (height - nodeRadius * 2) / maxDepth : 0;

  // Draw edges then nodes (edges behind nodes)
  drawEdges(ctx, instance, x, y, xScale, yScale, nodeRadius, theme);
  drawNodes(ctx, instance, x, y, xScale, yScale, nodeRadius, theme);
}
```

**Confidence:** HIGH (in-order traversal layout is standard for binary trees at small scale)

### Triangulation: fromDyck (via Binary Tree Intermediate)

```javascript
// structures/triangulation.js

/**
 * Convert Dyck word to a triangulation of the convex (n+2)-gon.
 *
 * Strategy: Use the binary-tree-to-triangulation bijection.
 * 1. Convert Dyck word to binary tree (1L0R)
 * 2. Map binary tree to triangulation:
 *    - Root the triangulation at edge (0, n+1)
 *    - Each internal node of the binary tree corresponds to a triangle
 *    - The triangle's apex vertex splits the polygon into left and right sub-polygons
 *
 * A triangulation is represented as an array of diagonals:
 * [{ from: vertexIndex, to: vertexIndex }, ...]
 *
 * Vertices are numbered 0 through n+1 counterclockwise.
 *
 * @param {number[]} dyckWord - Dyck word of order n
 * @returns {{ n: number, diagonals: Array<{from: number, to: number}> }}
 */
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const numVertices = n + 2;

  // Build binary tree first
  const tree = buildTree(dyckWord);

  // Map tree to diagonals
  const diagonals = [];
  treeToTriangulation(tree, 0, numVertices - 1, diagonals);

  return { n, diagonals, numVertices };
}

/**
 * Recursive: map a binary tree node to a triangle in the polygon.
 * The triangle uses edge (lo, hi) as its base and picks an apex vertex.
 *
 * @param {TreeNode|null} node
 * @param {number} lo - Lower vertex index of the current edge
 * @param {number} hi - Upper vertex index of the current edge
 * @param {Array} diagonals - Accumulator for diagonal edges
 */
function treeToTriangulation(node, lo, hi, diagonals) {
  if (node === null) return;
  // This node creates a triangle: the apex is at vertex (lo + leftSize + 1)
  const leftSize = countNodes(node.left);
  const apex = lo + leftSize + 1;

  // Add diagonals (only if they aren't polygon edges)
  if (apex - lo > 1) diagonals.push({ from: lo, to: apex });
  if (hi - apex > 1) diagonals.push({ from: apex, to: hi });

  // Recurse: left subtree gets polygon segment [lo, apex]
  //          right subtree gets polygon segment [apex, hi]
  treeToTriangulation(node.left, lo, apex, diagonals);
  treeToTriangulation(node.right, apex, hi, diagonals);
}

/**
 * Draw triangulation: regular polygon with diagonals.
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme } = opts;
  const { numVertices, diagonals } = instance;

  // Place vertices on a circle
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  const vertices = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / numVertices;
    vertices.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
    });
  }

  // Draw polygon edges
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(vertices[0].px, vertices[0].py);
  for (let i = 1; i < numVertices; i++) {
    ctx.lineTo(vertices[i].px, vertices[i].py);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw diagonals
  for (const d of diagonals) {
    ctx.beginPath();
    ctx.moveTo(vertices[d.from].px, vertices[d.from].py);
    ctx.lineTo(vertices[d.to].px, vertices[d.to].py);
    ctx.stroke();
  }

  // Draw vertex labels
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `${theme.fontSize || '14px'} ${theme.fontFamily || 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < numVertices; i++) {
    const labelAngle = -Math.PI / 2 + (2 * Math.PI * i) / numVertices;
    const lx = cx + (radius + 16) * Math.cos(labelAngle);
    const ly = cy + (radius + 16) * Math.sin(labelAngle);
    ctx.fillText(String(i), lx, ly);
  }
}
```

**Confidence:** MEDIUM (the binary-tree-to-triangulation bijection is well-established mathematically; the specific vertex indexing needs careful testing with all 14 instances at n=4)

### HTML Controls Layout

```html
<!-- Controls added to index.html, below the canvas container -->
<div id="controls">
  <div class="control-group">
    <label for="source-select">Source:</label>
    <select id="source-select"></select>
    <label for="target-select">Target:</label>
    <select id="target-select"></select>
  </div>
  <div class="control-group">
    <label for="n-select">n:</label>
    <select id="n-select">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3" selected>3</option>
      <option value="4">4</option>
    </select>
  </div>
  <div class="control-group">
    <button id="btn-prev" title="Previous instance">&lt;</button>
    <span id="instance-indicator">1 of 5</span>
    <button id="btn-next" title="Next instance">&gt;</button>
  </div>
  <div class="control-group">
    <button id="btn-start" title="Jump to start">|&lt;</button>
    <button id="btn-step-back" title="Step back">&lt;|</button>
    <button id="btn-play-pause" title="Play/Pause">Play</button>
    <button id="btn-step-fwd" title="Step forward">|&gt;</button>
    <button id="btn-end" title="Jump to end">&gt;|</button>
  </div>
  <div class="control-group">
    <label for="speed-slider">Speed:</label>
    <input type="range" id="speed-slider" min="0.5" max="3" step="0.1" value="1">
    <span id="speed-display">1.0x</span>
  </div>
</div>
```

**Confidence:** HIGH (standard HTML form elements)

### CSS for Controls

```css
/* Additional CSS for controls panel */
#controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--stroke-color);
  margin-top: 8px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

#controls select,
#controls button,
#controls input[type="range"] {
  font-family: var(--font-family);
  font-size: 14px;
}

#controls button {
  min-width: 36px;
  height: 36px;
  cursor: pointer;
  border: 2px solid var(--stroke-color);
  background: var(--bg-color);
  border-radius: 4px;
  font-weight: bold;
}

#controls button:hover {
  background: #F5F5F5;
}

#instance-indicator {
  font-family: var(--mono-font);
  min-width: 60px;
  text-align: center;
}
```

**Confidence:** HIGH (standard CSS flexbox layout)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` for animation | `requestAnimationFrame` with timestamp | Recommended since 2012 | Smooth animation synced to display refresh rate; auto-pauses in background |
| Frame-count animation | Delta-time animation | Always best practice | Consistent speed across 60Hz, 120Hz, 144Hz displays |
| Canvas-drawn UI controls | HTML form controls outside canvas | Best practice | Accessibility, keyboard navigation, native styling |
| SVG for math visualization | Canvas 2D for frequent redraw | Project decision | Canvas better for animation with per-frame full redraw |

**Deprecated/outdated:**
- `webkitRequestAnimationFrame`: Unprefixed `requestAnimationFrame` has been baseline since 2012
- `canvas.toDataURL()` for screenshots: Not relevant here, but avoid for performance-sensitive code

## Open Questions

1. **Triangulation vertex labeling convention**
   - What we know: Vertices are numbered 0 through n+1 on a convex polygon. The standard convention is counterclockwise starting from the top.
   - What's unclear: Whether the "root edge" for the bijection should be (0, n+1) or (0, 1). Different references use different conventions.
   - Recommendation: Use (0, n+1) as the root edge (first and last vertex). Test all 14 instances at n=4 visually to confirm no diagonals cross. If crossings occur, try (0, 1) as the root edge.

2. **Animation steps for Phase 2 vs Phase 3**
   - What we know: Phase 2 needs the animation engine infrastructure (rAF loop, playback controls), but the actual bijection animations come in Phase 3 (ANIM-06 is Phase 3).
   - What's unclear: What does the animation engine animate in Phase 2 before bijection steps exist?
   - Recommendation: In Phase 2, the animation engine is wired up but has no steps to play. The playback controls exist and respond (play starts an empty loop that immediately stops, step does nothing). Phase 3 adds the first bijection step sequences. The controls should be enabled/disabled based on whether steps exist.

3. **Panel labels and structure titles**
   - What we know: Each panel shows a structure rendering. Users need to know which structure they're looking at.
   - What's unclear: Whether to draw labels on the canvas or use DOM elements above/below the canvas.
   - Recommendation: Draw structure labels directly on the canvas at the top of each panel bounding box. This keeps the layout self-contained and avoids CSS positioning complexity.

## Sources

### Primary (HIGH confidence)
- MDN requestAnimationFrame - https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame (API signature, timestamp parameter, cancelAnimationFrame)
- MDN Canvas drawing shapes - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes (moveTo, lineTo, arc, beginPath/stroke patterns)
- SageMath DyckWord documentation - https://doc.sagemath.org/html/en/reference/combinat/sage/combinat/dyck_word.html (1L0R decomposition for Dyck word to binary tree conversion)
- Project architecture research - `.planning/research/ARCHITECTURE.md` (uniform module interface, state management, rendering pipeline, registry pattern)
- Phase 1 research - `.planning/phases/01-core-foundation/01-RESEARCH.md` (HiDPI pattern, theme contract, bounding-box drawing contract)

### Secondary (MEDIUM confidence)
- Rachel Lim's tree drawing algorithm - https://rachel53461.wordpress.com/2014/04/20/algorithm-for-drawing-trees/ (simplified Reingold-Tilford with mod values; validated as applicable to small trees)
- Open Math Books Catalan Numbers - https://discrete.openmathbooks.org/more/mdm/sec_basic-catalan.html (bijection between binary trees and polygon triangulations via recursive decomposition)
- Tom Davis Catalan Numbers - https://mathcircle.berkeley.edu/sites/default/files/BMC6/pdf0607/catalan.pdf (Catalan structure bijection descriptions)

### Tertiary (LOW confidence)
- WebSearch results for canvas grid drawing patterns (general patterns, not project-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native browser APIs, same as Phase 1, verified against MDN
- Architecture: HIGH - Directly follows architecture research patterns; uniform module interface, registry, state management all pre-designed
- Structure rendering: HIGH for parentheses/Dyck paths (trivial), MEDIUM for binary trees (layout tested only conceptually), MEDIUM for triangulations (vertex convention needs visual verification)
- Animation engine: HIGH - requestAnimationFrame API is stable and well-documented
- Dyck conversions: HIGH for parentheses (trivial), HIGH for Dyck paths (identity), HIGH for binary trees (1L0R well-established), MEDIUM for triangulations (via binary tree intermediate; needs round-trip testing)
- Pitfalls: HIGH - Based on established Canvas and animation patterns

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable domain, native browser APIs, mathematical algorithms don't change)
