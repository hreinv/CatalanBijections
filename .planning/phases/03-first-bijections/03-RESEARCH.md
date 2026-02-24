# Phase 3: First Bijections - Research

**Researched:** 2026-02-23
**Domain:** Bijection animation step sequences, easing functions, color-coded element correspondence, active-step highlighting, step description UI
**Confidence:** HIGH

## Summary

Phase 3 transforms the "vertical slice" from Phase 2 into a genuine bijection demonstration tool. The animation engine infrastructure (rAF loop, playback state machine, 800ms step duration) is already built and tested with empty steps. Phase 3 fills in the steps array for three classical bijections, adds smooth easing transitions, adds a step description text panel, implements color-coded element correspondence, and adds active-step pulse/glow highlighting.

The three bijections are mathematically well-defined and each has a natural decomposition into discrete visual steps. Parentheses-to-Dyck-Paths is the simplest (direct symbol-to-step mapping). Parentheses-to-Binary-Trees uses the 1L0R recursive decomposition already implemented in the structure modules. Binary-Trees-to-Triangulations uses the existing tree-to-polygon-diagonal mapping from `triangulation.js`. The key challenge is not the math but the visual design: each step must show which elements correspond across source and target, highlight the active transformation with a pulse/glow effect, and display a human-readable explanation of what is happening.

The architecture pattern established in the architecture research (Pattern 2: Step-Sequence Animation) defines the bijection module contract: each module exports `getSteps(dyckWord, n)` returning an array of `{ description, drawFrame(ctx, progress, opts) }` objects. The animation engine consumes these generically. The bijection router (also from architecture research, Pattern 3) maps structure-pair keys to bijection modules. This phase implements the first three bijection modules and the router skeleton.

**Primary recommendation:** Build the bijection module infrastructure first (router, step contract, easing utilities), then implement the three bijections one at a time starting with the simplest (Parentheses-to-Dyck-Paths), adding the step description panel and color correspondence as part of the first bijection implementation. The pulse/glow highlighting and dimming can be added as a rendering enhancement applied uniformly across all bijections.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BIJC-01 | Parentheses to Dyck Paths bijection with step-by-step animation ('(' = up, ')' = down) | Direct symbol mapping: each parenthesis character maps to one Dyck path step. 5+ animation steps achievable by: (1) show source string, (2-N) highlight each character and draw corresponding up/down step, (N+1) show completed path. See Bijection 1 pattern below. |
| BIJC-02 | Binary Trees to Triangulations bijection with step-by-step animation (triangles correspond to internal nodes) | Binary tree nodes map to triangles via the treeToTriangulation recursive decomposition already in triangulation.js. Each internal node becomes a triangle with apex at `lo + leftSize + 1`. Steps: show tree, then reveal each triangle one-by-one corresponding to pre-order traversal of tree nodes. |
| BIJC-03 | Parentheses to Binary Trees bijection with step-by-step animation (recursive nesting defines subtrees) | Uses the 1L0R decomposition from binary-tree.js. Steps: (1) show full parenthesis string, (2) identify outermost matched pair, (3) show root node, (4) recurse on left content (between open/close), (5) recurse on right content (after close), building tree incrementally. |
| ANIM-06 | Smooth easing transitions between animation steps | Implement easeInOutCubic function (standard Robert Penner formula, simplified to single parameter `t` in [0,1]). Apply easing to the progress value before passing to drawFrame. See Easing Functions pattern below. |
| UICT-04 | Step description text panel showing current bijection step explanation | Add a DOM element below the canvas (or between canvas and controls) that displays `steps[currentStep].description`. Update on every render when steps are loaded. See Step Description Panel pattern below. |
| UICT-06 | Color-coded element correspondence (matching elements share colors across both panels) | Extend the existing `colors` array (CORRESPONDENCE_COLORS from colors.js, already 8 high-contrast colors) to bijection step rendering. Each step's drawFrame receives the color mapping. Elements in source and target that correspond share the same color index. |
| UICT-07 | Active transformation step highlighting (current step pulses/glows, others dim) | Use globalAlpha to dim non-active elements (0.2-0.3 alpha) and a sinusoidal pulse on the active element's stroke width or shadow. The pulse cycles at ~2Hz using `Math.sin(Date.now() * 0.004 * Math.PI)` for smooth oscillation. |
</phase_requirements>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| HTML5 Canvas 2D | Baseline | All bijection animation rendering | Established in Phases 1-2; immediate-mode drawing with per-frame full redraw |
| Vanilla JS (ES2022+ modules) | Current | Bijection modules, easing utilities, router | Zero-dependency constraint; same module pattern as structure modules |
| CORRESPONDENCE_COLORS | Phase 1 | Color-coded element correspondence | Already 8 high-contrast projector-safe colors in `core/colors.js` |
| Animation Engine | Phase 2 | Playback state machine consuming step arrays | `createAnimationEngine` from `engine/animation.js`; reads/writes steps via getState/setState |

### Supporting

| API/Pattern | Purpose | When to Use |
|-------------|---------|-------------|
| `globalAlpha` | Dim inactive elements during animation | Set before drawing dimmed elements, restore to 1.0 after |
| `shadowBlur` + `shadowColor` | Glow effect on active elements | Set before drawing active/pulsing elements, clear after |
| `Math.sin()` oscillation | Smooth pulse timing for active highlights | Compute pulse intensity each frame: `0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI)` |
| Robert Penner easing | Smooth ease-in-out transitions between animation states | Apply to progress `t` before interpolation: `easeInOutCubic(t)` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `globalAlpha` for dimming | Drawing dimmed elements with reduced stroke opacity via hex alpha suffix | `globalAlpha` is simpler and affects fills+strokes uniformly; hex alpha only works on individual style settings |
| `shadowBlur` for glow | Drawing a larger semi-transparent circle behind the active element | `shadowBlur` is built-in and automatic; manual glow circles require extra draw calls and careful sizing |
| DOM element for step description | Drawing text on canvas | DOM text is crisper, resizable, accessible, and can use CSS styling; canvas text requires manual layout and doesn't reflow |
| Single easeInOutCubic | Multiple easing options (elastic, bounce, etc.) | Cubic ease-in-out is the most natural and professional-looking for educational animations; exotic easings are distracting |

**Installation:**
```bash
# No installation. Same as Phases 1-2:
python3 -m http.server 8080
```

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)

```
js/
  bijections/
    router.js              # BIJC-01,02,03: Maps structure pairs to bijection modules
    parens-dyck.js         # BIJC-01: Parentheses <-> Dyck Paths step sequence
    binary-triang.js       # BIJC-02: Binary Trees <-> Triangulations step sequence
    parens-binary.js       # BIJC-03: Parentheses <-> Binary Trees step sequence
  core/
    easing.js              # ANIM-06: Easing functions (easeInOutCubic + helpers)
  engine/
    animation.js           # (Phase 2, modified) Apply easing to progress before drawFrame
  main.js                  # (Phase 2, modified) Wire router, step description panel, load steps on structure change
index.html                 # (Phase 2, modified) Add step description panel element
css/
  style.css                # (Phase 2, modified) Style step description panel
```

### Pattern 1: Bijection Module Contract (getSteps)

**What:** Every bijection module exports `getSteps(dyckWord, n)` returning an array of step objects. Each step has a `description` string and a `drawFrame(ctx, progress, opts)` function. The animation engine consumes steps generically.
**When to use:** Every bijection module.

```javascript
// bijections/parens-dyck.js (and every other bijection module)

/**
 * Generate animation step sequence for this bijection.
 *
 * @param {number[]} dyckWord - The Dyck word being transformed
 * @param {number} n - The Catalan order
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n) {
  // Pre-compute source and target instances
  const sourceInstance = sourceModule.fromDyck(dyckWord);
  const targetInstance = targetModule.fromDyck(dyckWord);

  return [
    {
      description: "Step 1: Show the balanced parenthesis string",
      drawFrame(ctx, progress, opts) {
        // progress: 0.0 to 1.0 (already eased by engine)
        // opts: { sourceBox, targetBox, theme, colors, activeStep, totalSteps }
        // Draw source with full opacity, target empty or faded
      },
    },
    // ... more steps
  ];
}

/** Metadata for the router */
export const META = {
  source: 'parentheses',
  target: 'dyck-path',
  label: 'Parentheses to Dyck Paths',
};
```

**Confidence:** HIGH (follows Pattern 2 from architecture research; contract matches animation engine's existing step consumption pattern)

### Pattern 2: Bijection Router

**What:** A lookup table mapping `sourceKey|targetKey` pairs to bijection modules. Both orderings (`A|B` and `B|A`) are registered. The router returns step sequences for any known classical pair.
**When to use:** When the user selects a structure pair for which a classical bijection exists.

```javascript
// bijections/router.js

import * as parensDyck from './parens-dyck.js';
import * as binaryTriang from './binary-triang.js';
import * as parensBinary from './parens-binary.js';

const registry = {};

function register(mod) {
  const { source, target } = mod.META;
  const fwdKey = `${source}|${target}`;
  const revKey = `${target}|${source}`;
  registry[fwdKey] = { module: mod, reversed: false };
  registry[revKey] = { module: mod, reversed: true };
}

register(parensDyck);
register(binaryTriang);
register(parensBinary);

/**
 * Look up steps for a structure pair.
 * @param {string} sourceKey
 * @param {string} targetKey
 * @param {number[]} dyckWord
 * @param {number} n
 * @returns {Array|null} Step array or null if no bijection registered
 */
export function getSteps(sourceKey, targetKey, dyckWord, n) {
  const key = `${sourceKey}|${targetKey}`;
  const entry = registry[key];
  if (!entry) return null;
  return entry.module.getSteps(dyckWord, n, entry.reversed);
}
```

**Confidence:** HIGH (follows Pattern 3 from architecture research; simple lookup pattern)

### Pattern 3: Easing Function Application

**What:** A pure utility function that transforms a linear progress value (0.0 to 1.0) into a smoothly eased value using cubic ease-in-out.
**When to use:** In the animation engine's tick function, applied to progress before calling drawFrame.

```javascript
// core/easing.js

/**
 * Cubic ease-in-out.
 * Standard Robert Penner formula simplified to normalized [0,1] input/output.
 *
 * @param {number} t - Linear progress in [0, 1]
 * @returns {number} Eased progress in [0, 1]
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

**Source:** Robert Penner's easing equations, simplified form. Verified against [easings.net](https://easings.net/) reference implementations.
**Confidence:** HIGH (well-established mathematical formula; used in CSS transitions, web animation frameworks)

### Pattern 4: Active Step Highlighting (Pulse + Dim)

**What:** During animation, the currently active element pulses/glows while non-active elements are dimmed to 20-30% opacity.
**When to use:** In every bijection's `drawFrame` function.

```javascript
// Inside a drawFrame function:

function drawFrame(ctx, progress, opts) {
  const { colors, activeElementIndex } = opts;

  // Compute pulse intensity (cycles at ~2Hz)
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < elements.length; i++) {
    if (i === activeElementIndex) {
      // Active element: full color + glow
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 8 + pulse * 12;  // Pulses between 8 and 20
      drawElement(ctx, elements[i], colors[i]);
      ctx.shadowBlur = 0;
    } else if (i < activeElementIndex) {
      // Already-processed element: full color, no glow
      ctx.globalAlpha = 1.0;
      drawElement(ctx, elements[i], colors[i]);
    } else {
      // Not-yet-processed element: dimmed
      ctx.globalAlpha = 0.25;
      drawElement(ctx, elements[i], colors[i]);
    }
  }
  ctx.globalAlpha = 1.0;  // Always restore
}
```

**Confidence:** HIGH (globalAlpha and shadowBlur are baseline Canvas 2D features; pulse pattern is standard)

### Pattern 5: Step Description Panel (DOM element)

**What:** A DOM element (not canvas-drawn) below the canvas that displays the current step's text description. Updated by the render function whenever animation state changes.
**When to use:** Every render cycle when steps are loaded.

```html
<!-- Added to index.html between canvas and controls -->
<div id="step-description" class="step-description">
  Select two structures and press Play to see the bijection.
</div>
```

```javascript
// In main.js render function:
function updateStepDescription() {
  const { steps, currentStep } = state.animation;
  if (steps.length > 0 && steps[currentStep]) {
    dom.stepDescription.textContent = steps[currentStep].description;
  } else {
    dom.stepDescription.textContent = 'Select two structures and press Play to see the bijection.';
  }
}
```

**Confidence:** HIGH (simple DOM text update; architecture research recommends DOM for text over canvas)

### Anti-Patterns to Avoid

- **Putting easing inside drawFrame:** The easing function should be applied once in the engine's tick, not inside each bijection's drawFrame. Each drawFrame receives already-eased progress. This avoids double-easing and keeps bijection modules simple.
- **Hardcoding step count per bijection:** Step count depends on n (number of elements). For parentheses-to-Dyck-paths, there are 2n+2 steps (intro + one per character + completion). Let the step array size vary dynamically.
- **Drawing both structures from scratch in drawFrame:** The bijection drawFrame should take over the entire canvas during animation. It draws both source and target with correspondence highlighting. The normal "static" render path is bypassed during animation.
- **Animating without correspondence colors:** Every drawFrame must use the same color for corresponding elements in source and target. Never use the default theme stroke color during bijection animation; always use CORRESPONDENCE_COLORS[elementIndex].
- **Using requestAnimationFrame for pulse timing:** The pulse oscillation uses `Date.now()` inside drawFrame, not a separate rAF loop. It piggybacks on the existing animation tick.
- **Modifying structure module draw() signatures:** Do NOT change the existing structure module draw() functions. Bijection drawFrame functions call structure draw() with additional opts (like highlight indices) or draw elements directly. The existing structure modules remain backward-compatible.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Easing curves | Custom interpolation math | Standard easeInOutCubic from Robert Penner | Well-tested formula, matches CSS transition behavior, single function |
| Pulse oscillation | Manual frame counter or setTimeout | `Math.sin(Date.now() * frequency)` | Smooth, framerate-independent, trivially simple |
| Element dimming | Per-element opacity calculation | `ctx.globalAlpha = 0.25` | Canvas built-in, applies to all subsequent draws uniformly |
| Glow effect | Manual radial gradient circles | `ctx.shadowBlur` + `ctx.shadowColor` | Canvas built-in shadow, hardware-accelerated on most browsers |
| Step description UI | Canvas-drawn text with manual wrapping | DOM `<div>` with textContent | Crisper text, automatic reflow, accessible, CSS-styleable |
| Bijection direction (reverse) | Separate reverse step arrays | `reversed` flag passed to getSteps, which reverses array order | Same bijection logic, just presented in reverse order |

**Key insight:** The bijection animations are fundamentally about visual storytelling, not algorithmic complexity. Each step "reveals" one more piece of the correspondence. The math is already implemented in the structure modules (fromDyck, toDyck). The bijection modules only need to decompose that math into visible increments and color them consistently.

## Common Pitfalls

### Pitfall 1: Color Mismatch Between Source and Target

**What goes wrong:** Element 3 in the source structure is blue, but its corresponding element in the target structure is green. The visual correspondence is broken.
**Why it happens:** The source and target use different indexing schemes (e.g., source iterates left-to-right, target iterates in pre-order), so the same color index maps to different elements.
**How to avoid:** Define the color mapping in the bijection module, not the structure module. The bijection knows which source element corresponds to which target element. Pass explicit `colorMap: { sourceIndex: colorIndex, targetIndex: colorIndex }` pairs to drawFrame, not just a flat colors array.
**Warning signs:** Look at n=3 (5 instances). If any instance shows mismatched colors between panels, the indexing is wrong.

### Pitfall 2: Easing Applied Twice

**What goes wrong:** Animations feel "sluggish" or have a strange acceleration profile. Elements barely move in the middle of the step and jump at the edges.
**Why it happens:** Easing is applied both in the animation engine (modifying progress before passing to drawFrame) AND inside drawFrame itself (applying easing to the already-eased progress).
**How to avoid:** Apply easing exactly once, in the engine's tick function. drawFrame receives eased progress and uses it linearly. Document this clearly in the step contract.
**Warning signs:** Progress of 0.5 input produces a visual result that is not at the 50% point of the transition.

### Pitfall 3: Orphan Glow After Step Completes

**What goes wrong:** After an animation step finishes (progress=1.0) and the next step starts, the glow from the previous step's active element persists for one frame.
**Why it happens:** `shadowBlur` is set but never cleared before drawing the next step's elements. Canvas shadow state persists across draw calls.
**How to avoid:** Always reset `ctx.shadowBlur = 0` and `ctx.shadowColor = 'transparent'` after drawing any glowing element. Use a `ctx.save()` / `ctx.restore()` pattern around each element draw.
**Warning signs:** Fleeting glow artifact visible when stepping quickly between steps.

### Pitfall 4: Step Description Not Updating on Step Change

**What goes wrong:** The step description text shows "Step 1" even when the animation has advanced to Step 3.
**Why it happens:** The step description is only updated on play/pause, not on every render tick. Or the description element is updated before the state has been advanced.
**How to avoid:** Update the step description inside the `render()` function (which is called on every tick via `onRender`), reading from `state.animation.currentStep`. This ensures the description is always in sync.
**Warning signs:** Description and visual animation are out of sync, especially when stepping manually.

### Pitfall 5: Reversed Bijection Steps Look Wrong

**What goes wrong:** Playing "Dyck Paths to Parentheses" (the reverse of BIJC-01) shows the parentheses building up on the left and the path on the right, which is backwards from what the user expects.
**Why it happens:** The router sets `reversed: true` but the bijection module just reverses the step array without swapping which structure renders on which side.
**How to avoid:** When `reversed` is true, the bijection module must: (1) reverse the step order, (2) swap source/target assignments in each step's drawFrame, (3) adjust descriptions to read in reverse (e.g., "Read the Dyck path step..." instead of "Write the parenthesis character..."). Keep the source structure on the left panel and target on the right, as selected by the user.
**Warning signs:** Structure labels say "Dyck Paths" (source, left) but the animation draws the Dyck path on the right.

### Pitfall 6: Binary-Tree-to-Triangulation Step Ordering

**What goes wrong:** The triangles appear in a confusing order that doesn't match the tree traversal, making it hard to see the correspondence.
**Why it happens:** The triangles are generated by the recursive treeToTriangulation function, which processes them in a specific order (left subtree first, then right). If the animation steps don't follow the same traversal order, the colors don't match.
**How to avoid:** Use pre-order traversal of the binary tree to determine the order in which triangles are revealed. Pre-order visits the root first (which corresponds to the triangle at the root edge), then left subtree triangles, then right subtree triangles. This matches the natural reading of the tree.
**Warning signs:** Triangle #2 corresponds to tree node #4 instead of tree node #2.

## Code Examples

### Bijection 1: Parentheses to Dyck Paths (BIJC-01)

The simplest bijection. Each parenthesis character maps directly to one Dyck path step: '(' = up step (+1,+1), ')' = down step (+1,-1).

```javascript
// bijections/parens-dyck.js

import * as parentheses from '../structures/parentheses.js';
import * as dyckPath from '../structures/dyck-path.js';

export const META = {
  source: 'parentheses',
  target: 'dyck-path',
  label: 'Parentheses to Dyck Paths',
};

/**
 * Generate step-by-step animation for parentheses to Dyck paths bijection.
 *
 * Step structure for a word of length 2n:
 *   Step 0: Show source parentheses string, show empty grid
 *   Steps 1..2n: For each character, highlight it and draw corresponding path segment
 *   Step 2n+1: Show completed bijection (both structures fully colored)
 *
 * @param {number[]} dyckWord
 * @param {number} n
 * @param {boolean} reversed - If true, show Dyck Paths -> Parentheses
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const parenStr = parentheses.fromDyck(dyckWord);
  const pathInstance = dyckPath.fromDyck(dyckWord);
  const charCount = parenStr.length; // 2n

  const steps = [];

  // Step 0: Introduction
  steps.push({
    description: `Start with the balanced parentheses: "${parenStr}"`,
    drawFrame(ctx, progress, opts) {
      // Draw full parentheses on left, empty grid on right
      // All parens at full opacity, grid visible but no path
    },
  });

  // Steps 1..2n: Process each character
  for (let i = 0; i < charCount; i++) {
    const char = parenStr[i];
    const direction = char === '(' ? 'up' : 'down';
    steps.push({
      description: `Character ${i + 1}: '${char}' maps to ${direction} step (${char === '(' ? '+1,+1' : '+1,-1'})`,
      drawFrame(ctx, progress, opts) {
        // Left panel: parentheses with chars 0..i-1 colored, char i pulsing
        // Right panel: path segments 0..i-1 colored, segment i animating in
        // progress interpolates the current segment from start to end position
      },
    });
  }

  // Final step: Complete
  steps.push({
    description: `Bijection complete: each parenthesis maps to one path step`,
    drawFrame(ctx, progress, opts) {
      // Both panels fully colored with correspondence
    },
  });

  if (reversed) {
    steps.reverse();
    // Also swap descriptions for reverse direction
  }

  return steps;
}
```

**Confidence:** HIGH (direct 1-to-1 mapping, trivially correct, produces 2n+2 steps which exceeds the 5+ requirement for any n >= 2)

### Bijection 2: Binary Trees to Triangulations (BIJC-02)

Each internal node of the binary tree corresponds to exactly one triangle in the (n+2)-gon triangulation. The bijection reveals triangles in pre-order traversal order.

```javascript
// bijections/binary-triang.js - Conceptual structure

/**
 * Pre-order traversal collects (node, triangle) correspondence pairs.
 * For a tree of n internal nodes, produces n correspondence pairs.
 *
 * Step structure:
 *   Step 0: Show binary tree (left) and polygon outline (right)
 *   Steps 1..n: Highlight tree node i, reveal triangle i
 *   Step n+1: Show completed correspondence
 */
export function getSteps(dyckWord, n, reversed = false) {
  const tree = binaryTree.fromDyck(dyckWord);
  const triang = triangulation.fromDyck(dyckWord);

  // Collect node-triangle pairs via pre-order traversal
  const pairs = [];
  function collectPairs(node, lo, hi) {
    if (node === null) return;
    const leftSize = countNodes(node.left);
    const apex = lo + leftSize + 1;
    pairs.push({ node, triangle: [lo, apex, hi] });
    collectPairs(node.left, lo, apex);
    collectPairs(node.right, apex, hi);
  }
  collectPairs(tree, 0, n + 1);

  // Build steps from pairs...
}
```

**Confidence:** HIGH (the tree-to-triangulation mapping is already implemented in triangulation.js; pre-order traversal ordering is standard)

### Bijection 3: Parentheses to Binary Trees (BIJC-03)

Uses the 1L0R recursive decomposition. The animation shows how nested parentheses define the tree structure: the outermost matched pair defines the root, the content between them becomes the left subtree, and the content after becomes the right subtree.

```javascript
// bijections/parens-binary.js - Conceptual structure

/**
 * Recursive decomposition generates steps that build the tree incrementally.
 *
 * For each recursive call:
 *   1. Highlight the matched pair boundaries in the parenthesis string
 *   2. Show the new node being added to the tree
 *   3. Indicate which substring becomes the left subtree
 *   4. Indicate which substring becomes the right subtree
 *
 * Step structure:
 *   Step 0: Show parentheses string and empty tree space
 *   Steps 1..n: For each node (in 1L0R decomposition order):
 *     - Highlight the +1/-1 pair in the parentheses
 *     - Add the corresponding node to the tree
 *   Step n+1: Show completed correspondence
 */
export function getSteps(dyckWord, n, reversed = false) {
  const parenStr = parentheses.fromDyck(dyckWord);
  const tree = binaryTree.fromDyck(dyckWord);

  // Collect decomposition steps recursively
  const decompositionSteps = [];
  function decompose(word, startIdx, depth) {
    if (word.length === 0) return;
    // Find matching close for first open
    let d = 0, splitIdx = -1;
    for (let i = 0; i < word.length; i++) {
      d += word[i];
      if (d === 0) { splitIdx = i; break; }
    }
    // Record this decomposition step
    decompositionSteps.push({
      openIdx: startIdx,          // Position of '(' in full string
      closeIdx: startIdx + splitIdx, // Position of matching ')'
      leftRange: [startIdx + 1, startIdx + splitIdx - 1],
      rightRange: [startIdx + splitIdx + 1, startIdx + splitIdx + word.length - splitIdx - 1],
      depth,
    });
    // Recurse on left and right subwords
    decompose(word.slice(1, splitIdx), startIdx + 1, depth + 1);
    decompose(word.slice(splitIdx + 1), startIdx + splitIdx + 1, depth + 1);
  }
  decompose(dyckWord, 0, 0);

  // Build animation steps from decompositionSteps...
}
```

**Confidence:** HIGH (1L0R decomposition is already implemented and tested in binary-tree.js; recursive step generation mirrors the same algorithm)

### Easing Utility: easeInOutCubic

```javascript
// core/easing.js

/**
 * Cubic ease-in-out (Robert Penner, simplified).
 * Maps linear progress [0,1] to eased progress [0,1].
 * Slow start -> fast middle -> slow end.
 *
 * @param {number} t - Linear progress in [0, 1]
 * @returns {number} Eased progress in [0, 1]
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Progress in [0, 1]
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
```

**Source:** Robert Penner's easing equations, standard simplified form used across the web animation community.
**Confidence:** HIGH (mathematical formula, deterministic, well-tested across decades of use)

### Applying Easing in the Animation Engine

```javascript
// engine/animation.js - Modification to tick()

import { easeInOutCubic } from '../core/easing.js';

// Inside tick(), before calling onRender():
// The engine stores raw linear progress in state.
// Before drawFrame is called (inside render), apply easing:

// Option A: Apply in engine tick before setting state
// let newProgress = state.progress + deltaMs / STEP_DURATION_MS;
// (store raw progress, let drawFrame apply easing)

// Option B (recommended): Store raw progress, expose eased progress
// The render function applies easing when reading progress:
// const easedProgress = easeInOutCubic(state.animation.progress);
```

**Note:** The cleaner approach is to apply easing in the render function rather than in the engine tick. The engine stores raw linear progress (for accurate timing and step transitions). The render function transforms it via easeInOutCubic before passing to drawFrame. This avoids easing artifacts at step boundaries (progress=0.0 and progress=1.0 map to 0.0 and 1.0 regardless of easing function).

**Confidence:** HIGH

### Render Function Integration

```javascript
// main.js render() - Modified for Phase 3

import { easeInOutCubic } from './core/easing.js';

function render() {
  clearCanvas(ctx, canvasWidth, canvasHeight);
  if (!state.currentDyck) return;

  const { steps, currentStep, progress } = state.animation;

  if (steps.length > 0 && steps[currentStep]) {
    // Animation mode: bijection drawFrame takes over rendering
    const easedProgress = easeInOutCubic(progress);
    const step = steps[currentStep];

    step.drawFrame(ctx, easedProgress, {
      sourceBox: { x: padding, y: padding + labelHeight, width: panelWidth, height: panelHeight - labelHeight },
      targetBox: { x: padding * 2 + panelWidth, y: padding + labelHeight, width: panelWidth, height: panelHeight - labelHeight },
      theme,
      colors: CORRESPONDENCE_COLORS,
      currentStep,
      totalSteps: steps.length,
    });

    // Update step description
    updateStepDescription();
  } else {
    // Static mode: standard side-by-side rendering (existing Phase 2 code)
    renderStaticPanels();
  }

  // Always draw panel labels and divider
  drawPanelLabels();
}
```

**Confidence:** HIGH

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed-step animations (jump between discrete states) | Smooth eased interpolation between states | Standard since CSS transitions (2009) | Natural-feeling animations that don't jar the viewer |
| White-flash highlights | Shadow glow + alpha dimming | Best practice in educational visualization | Gentler on eyes, more professional look |
| Single panel showing transformation | Side-by-side with color correspondence | Standard in modern math visualization tools | Both structures visible simultaneously, correspondence obvious |

**Deprecated/outdated:**
- None relevant. Canvas 2D API is stable. Easing functions have been unchanged for decades.

## Open Questions

1. **drawFrame responsibility boundary**
   - What we know: drawFrame renders both source and target panels during animation. The normal static render path is bypassed.
   - What's unclear: Should drawFrame also draw panel labels, dividers, and the step counter? Or should those be drawn by the main render function around drawFrame?
   - Recommendation: drawFrame draws only the structure-specific content within the source/target bounding boxes. Panel labels, divider, and step counter are drawn by the main render function wrapper. This keeps bijection modules focused on their domain.

2. **Reversed bijection step descriptions**
   - What we know: When playing "Dyck Paths -> Parentheses" (reverse of BIJC-01), the steps should describe the transformation from the user's perspective.
   - What's unclear: Should reversed descriptions be hand-written or algorithmically derived?
   - Recommendation: For Phase 3 (only 3 bijections), write reversed descriptions by hand as part of the step generation. The forward and reverse descriptions are sufficiently different to warrant explicit authoring for clarity.

3. **How the render function knows whether to use static or animation mode**
   - What we know: `state.animation.steps.length > 0` indicates animation mode.
   - What's unclear: When the user changes structures, should steps be auto-computed or should the user press Play first?
   - Recommendation: Compute steps automatically when both structures have a registered bijection. Populate `state.animation.steps` in the structure-change handler. The presence of steps enables animation controls; absence falls back to static rendering. This makes the bijection feel "built-in" rather than requiring an extra user action.

## Sources

### Primary (HIGH confidence)
- Project codebase: `js/engine/animation.js` - Existing animation engine with rAF loop, timestamp delta timing, 800ms STEP_DURATION_MS
- Project codebase: `js/structures/*.js` - Existing structure modules with fromDyck, toDyck, draw implementations
- Project codebase: `js/core/colors.js` - Existing CORRESPONDENCE_COLORS with 8 high-contrast projector-safe colors
- `.planning/research/ARCHITECTURE.md` - Pattern 2 (Step-Sequence Animation), Pattern 3 (Registry for bijection lookup), bijection data flow
- `.planning/phases/02-vertical-slice/02-RESEARCH.md` - Structure module interface, animation engine pattern, app state structure
- MDN Canvas 2D API: `globalAlpha`, `shadowBlur`, `shadowColor` - [MDN CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)

### Secondary (MEDIUM confidence)
- Robert Penner easing equations - [Easing Functions Cheat Sheet (easings.net)](https://easings.net/) - Standard cubic ease-in-out formula
- [Spicy Yoghurt Easing Functions Tool](https://spicyyoghurt.com/tools/easing-functions) - Interactive verification of easing function implementations
- [CSS-Tricks: Easing Animations in Canvas](https://css-tricks.com/easing-animations-in-canvas/) - Pattern for applying Penner easing to Canvas animations
- [Tom Davis: Catalan Numbers](https://mathcircle.berkeley.edu/sites/default/files/BMC6/pdf0607/catalan.pdf) - Bijection descriptions between Catalan structures
- [Open Math Books: Catalan Numbers](https://discrete.openmathbooks.org/more/mdm/sec_basic-catalan.html) - Visual bijection between binary trees and triangulations
- [Cornell: Catalan Numbers](https://pi.math.cornell.edu/~karola/dimex/catalan.pdf) - Comprehensive Catalan structure bijection reference

### Tertiary (LOW confidence)
- None. All findings verified against codebase or multiple established sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native Canvas 2D APIs, same patterns as Phases 1-2, no new dependencies
- Architecture: HIGH - Bijection module contract, router pattern, and step-sequence animation all pre-designed in architecture research
- Bijection math: HIGH - All three bijections use algorithms already implemented in the structure modules (1L0R decomposition, tree-to-triangulation mapping, direct symbol mapping)
- Easing: HIGH - Standard Robert Penner formula, verified against multiple references
- Visual effects (pulse/glow/dim): HIGH - Canvas globalAlpha, shadowBlur are baseline features; Math.sin oscillation is trivial
- Pitfalls: HIGH - Based on direct analysis of existing codebase patterns and animation engine behavior

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable domain, native browser APIs, established mathematical bijections)
