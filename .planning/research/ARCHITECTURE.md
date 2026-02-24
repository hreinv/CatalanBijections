# Architecture Research

**Domain:** Interactive Canvas-based math visualization (Catalan number bijections)
**Researched:** 2026-02-23
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UI Layer (HTML/CSS)                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Selector │  │ Playback │  │   Speed   │  │ Instance / n     │  │
│  │  Panel   │  │ Controls │  │  Slider   │  │  Navigator       │  │
│  └─────┬────┘  └─────┬────┘  └─────┬─────┘  └────────┬─────────┘  │
│        │             │             │                  │            │
├────────┴─────────────┴─────────────┴──────────────────┴────────────┤
│                       App Controller (main.js)                     │
│            Coordinates UI events, state, and rendering             │
├───────────────┬──────────────────┬─────────────────────────────────┤
│               │                  │                                 │
│  ┌────────────▼────────────┐  ┌──▼──────────────────────────────┐ │
│  │   Bijection Router      │  │    Animation Engine              │ │
│  │  - Classical lookup      │  │  - requestAnimationFrame loop   │ │
│  │  - Dyck bridge fallback  │  │  - Interpolation functions      │ │
│  │  - Step sequencing       │  │  - Playback state machine       │ │
│  └────────────┬────────────┘  └──┬──────────────────────────────┘ │
│               │                  │                                 │
├───────────────┴──────────────────┴─────────────────────────────────┤
│                     Structure Modules (11)                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ parens  │ │  dyck   │ │ mountain │ │ lattice  │ │staircase │ │
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ binary  │ │  plane  │ │  ballot  │ │ noncross │ │  triang  │ │
│  │  tree   │ │  tree   │ │          │ │ partition│ │          │ │
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐                                                     │
│  │ stacksort│   Each module: toDyck() / fromDyck() / draw()      │
│  └──────────┘                                                     │
├───────────────────────────────────────────────────────────────────┤
│                     Shared Layer                                   │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │  Dyck Core   │  │  Canvas Utils  │  │   Color Palette        │ │
│  │  (enumerate, │  │  (drawArrow,   │  │   (element-to-color    │ │
│  │   validate)  │  │   drawNode...) │  │    mapping)            │ │
│  └──────────────┘  └────────────────┘  └────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **App Controller** (`main.js`) | Wires UI events to state changes, orchestrates render cycle, manages global state (current structures, current n, current instance) | UI Layer, Bijection Router, Animation Engine, Structure Modules |
| **Bijection Router** (`bijections/router.js`) | Given (source, target) structure pair, returns the correct bijection module or composes a Dyck bridge chain | App Controller, Classical Bijection Modules, Dyck Bridge |
| **Animation Engine** (`engine/animation.js`) | Manages rAF loop, interpolation between keyframes, playback state (playing/paused/step), timing, easing | App Controller, Canvas |
| **Structure Modules** (11 files) | Each owns: `toDyck(instance)`, `fromDyck(dyckWord)`, `draw(ctx, instance, options)`, `enumerate(n)` | Dyck Core, Canvas Utils |
| **Classical Bijection Modules** (8 files) | Each owns: `getSteps(instance, n)` returning animation step sequence with interpolation targets | Structure Modules (source + target), Animation Engine |
| **Dyck Bridge** (`bijections/bridge.js`) | Composes A.toDyck -> B.fromDyck for any non-classical pair, generates generic animation steps | Structure Modules, Bijection Router |
| **Dyck Core** (`core/dyck.js`) | Enumerates all Dyck words for given n, validates Dyck words, provides utility transforms | Structure Modules, Dyck Bridge |
| **Canvas Utils** (`core/canvas-utils.js`) | Reusable drawing primitives: arrows, circles, lines, text labels, rounded rectangles, grid helpers | Structure Modules, Animation Engine |
| **Color Palette** (`core/colors.js`) | Maps element indices to consistent colors across structures for correspondence highlighting | Structure Modules, Bijection Modules |
| **UI Layer** (HTML + CSS) | Dropdowns for structure selection, buttons for playback, slider for speed, n selector, instance navigator, step description display | App Controller (via DOM events) |

## Recommended Project Structure

```
index.html                  # Single entry point, loads all modules
css/
├── style.css               # All styles (layout, controls, canvas container)
js/
├── main.js                 # App Controller — entry point, wires everything
├── core/
│   ├── dyck.js             # Dyck word enumeration, validation, utilities
│   ├── canvas-utils.js     # Shared drawing primitives
│   └── colors.js           # Color palette for element correspondence
├── structures/
│   ├── parentheses.js      # Balanced Parentheses
│   ├── dyck-path.js        # Dyck Paths
│   ├── mountain.js         # Mountain Ranges
│   ├── lattice-path.js     # Lattice Paths Below Diagonal
│   ├── staircase.js        # Staircase Polygons
│   ├── binary-tree.js      # Binary Trees
│   ├── plane-tree.js       # Rooted Plane Trees
│   ├── ballot.js           # Ballot Sequences
│   ├── noncrossing.js      # Non-crossing Partitions
│   ├── triangulation.js    # Triangulations of (n+2)-gon
│   └── stack-sort.js       # Stack-sortable Permutations
├── bijections/
│   ├── router.js           # Looks up classical bijection or falls back to bridge
│   ├── bridge.js           # Generic Dyck-word composition for non-classical pairs
│   ├── parens-dyck.js      # Parentheses <-> Dyck Paths
│   ├── binary-triang.js    # Binary Trees <-> Triangulations
│   ├── parens-binary.js    # Parentheses <-> Binary Trees
│   ├── dyck-lattice.js     # Dyck Paths <-> Lattice Paths
│   ├── binary-plane.js     # Binary Trees <-> Rooted Plane Trees
│   ├── dyck-mountain.js    # Dyck Paths <-> Mountain Ranges
│   ├── noncross-triang.js  # Non-crossing Partitions <-> Triangulations
│   └── ballot-dyck.js      # Ballot Sequences <-> Dyck Paths
└── engine/
    └── animation.js         # Animation loop, interpolation, playback controls
```

### Structure Rationale

- **`core/`:** Shared foundations with no dependencies on each other (except canvas-utils depending on colors). Built first, depended on by everything.
- **`structures/`:** One file per Catalan structure. Each is independent (depends only on `core/`). All share the same interface, making them interchangeable from the controller's perspective.
- **`bijections/`:** One file per classical bijection, plus the router and bridge. Depends on `structures/` (needs to understand source and target). The router is the single entry point for the controller.
- **`engine/`:** Animation engine depends on nothing domain-specific. Receives draw callbacks and interpolation targets; it does not know about Dyck words or structures. This separation keeps it testable and reusable.

## Data Flow

### Core Data Flow: Structure Selection to Rendering

```
User selects [Structure A] and [Structure B] from dropdowns
    │
    ▼
App Controller reads selected pair
    │
    ├──► Dyck Core: enumerate(n) → list of Dyck words
    │        │
    │        ▼
    ├──► Structure A: fromDyck(dyckWord) → instance_A
    ├──► Structure B: fromDyck(dyckWord) → instance_B
    │
    ├──► Structure A: draw(ctx, instance_A, {side: 'left'})
    ├──► Structure B: draw(ctx, instance_B, {side: 'right'})
    │
    ▼
Static rendering of both structures side-by-side on Canvas
```

### Bijection Animation Flow

```
User clicks "Play" (or "Step Forward")
    │
    ▼
App Controller calls Bijection Router: getAnimation(sourceKey, targetKey, instance, n)
    │
    ├──► Router checks classical bijection lookup table
    │    ├── FOUND: return classicalModule.getSteps(instance, n)
    │    └── NOT FOUND: Dyck Bridge composes chain
    │         ├── Find path: A → (intermediates) → B via Dyck words
    │         ├── For each hop: generate fromDyck/toDyck transition steps
    │         └── Return concatenated step sequence
    │
    ▼
Animation Engine receives step sequence: [{drawFrame, duration, description}, ...]
    │
    ▼
rAF Loop:
    ├── Compute interpolation progress (0.0 → 1.0) for current step
    ├── Clear canvas
    ├── Call step.drawFrame(ctx, progress, canvasUtils)
    ├── Update step description text in DOM
    ├── If progress == 1.0, advance to next step (or pause)
    └── Repeat until sequence complete or user pauses
```

### Dyck Word as Universal Representation

```
                    ┌─────────────────┐
                    │   Dyck Word     │
                    │ e.g. [+1,-1,    │
                    │  +1,+1,-1,-1]   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐       ┌────▼─────┐       ┌────▼─────┐
    │fromDyck()│       │fromDyck()│       │fromDyck()│    ... (11 total)
    │ parens   │       │ binary   │       │ lattice  │
    └────┬─────┘       └────┬─────┘       └────┬─────┘
         │                   │                   │
    ┌────▼─────┐       ┌────▼─────┐       ┌────▼─────┐
    │ "(()())" │       │   /\     │       │ path     │
    │          │       │  /  \    │       │ coords   │
    └──────────┘       └──────────┘       └──────────┘
```

Every instance of every structure is identified by its corresponding Dyck word. The Instance Navigator simply iterates the enumerated Dyck words for a given n, and both structures update simultaneously via their respective `fromDyck()` calls. This means **no structure ever needs to know about any other structure** -- they only speak Dyck.

### State Management

There is no framework state management needed. The entire app state is a simple object owned by the App Controller:

```javascript
const state = {
  n: 3,                          // Current n value (1-4)
  instanceIndex: 0,              // Index into enumerate(n) array
  sourceKey: 'parentheses',      // Structure A identifier
  targetKey: 'binary-tree',      // Structure B identifier
  dyckWords: [],                 // Cached enumerate(n) result
  currentDyck: null,             // Current Dyck word
  animation: {
    steps: [],                   // Current bijection step sequence
    currentStep: 0,              // Index into steps array
    progress: 0.0,               // Interpolation within current step
    playing: false,              // Playback state
    speed: 1.0                   // Speed multiplier
  }
};
```

State changes flow in one direction: UI event -> update state -> re-render. The canvas never stores state; it is cleared and redrawn each frame.

## Architectural Patterns

### Pattern 1: Uniform Module Interface

**What:** Every structure module exports the exact same four functions with the same signatures.
**When to use:** Whenever adding a new structure.
**Trade-offs:** Slightly constraining (every structure must express itself as a Dyck word), but this constraint is mathematically guaranteed by the Catalan number bijection property, and it eliminates 90% of integration complexity.

**Interface contract:**
```javascript
// Every structure module exports:
export function toDyck(instance)        // → Dyck word array [+1, -1, +1, +1, -1, -1]
export function fromDyck(dyckWord)      // → structure-specific instance object
export function draw(ctx, instance, opts) // → renders to canvas at given position
export function enumerate(n)            // → all Dyck words of length 2n (delegates to core)
```

The `draw` function receives an `opts` object containing at minimum `{x, y, width, height, colors}` defining the bounding box and color mapping. This keeps draw calls position-independent and allows the controller to lay out structures side-by-side without the structure knowing about layout.

### Pattern 2: Step-Sequence Animation

**What:** Every bijection (classical or bridge) produces an array of step objects. The animation engine consumes steps generically without knowing what they represent.
**When to use:** All bijection animations.
**Trade-offs:** Requires upfront decomposition of each bijection into discrete visual steps, but gains uniform playback controls (play, pause, step, reverse) for free.

**Step contract:**
```javascript
// Bijection modules return:
function getSteps(dyckWord, n) {
  return [
    {
      description: "Match opening '(' with closing ')'",
      duration: 800,  // milliseconds at speed=1.0
      drawFrame(ctx, progress, opts) {
        // progress: 0.0 to 1.0
        // Draw interpolated state for this step
        // e.g., morphing parenthesis brackets into tree edges
      }
    },
    // ... more steps
  ];
}
```

### Pattern 3: Registry Pattern for Structure/Bijection Lookup

**What:** A central registry maps string keys to module references, enabling dynamic dispatch without giant switch statements.
**When to use:** The Bijection Router and structure instantiation.
**Trade-offs:** Requires a registration step at startup but eliminates coupling between the controller and individual modules.

**Example:**
```javascript
// structures/registry.js (or inline in main.js)
const structures = {
  'parentheses':   parenthesesModule,
  'dyck-path':     dyckPathModule,
  'binary-tree':   binaryTreeModule,
  // ... all 11
};

// bijections/router.js
const classicalBijections = {
  'parentheses|dyck-path':   parensDyckModule,
  'binary-tree|triangulation': binaryTriangModule,
  // ... all 8 (stored both directions: A|B and B|A)
};

function getAnimation(sourceKey, targetKey, dyckWord, n) {
  const key = [sourceKey, targetKey].sort().join('|');
  if (classicalBijections[key]) {
    const reversed = sourceKey > targetKey;
    return classicalBijections[key].getSteps(dyckWord, n, reversed);
  }
  return bridge.getSteps(sourceKey, targetKey, dyckWord, n, structures);
}
```

### Pattern 4: Immediate-Mode Canvas Rendering

**What:** Every frame clears the entire canvas and redraws from scratch. No retained scene graph.
**When to use:** Always in this application. Performance is not a concern at n <= 4.
**Trade-offs:** Simpler mental model (no dirty tracking), slightly wasteful in static frames, but with n <= 4 the draw calls are trivially fast (< 1ms per frame).

```javascript
function renderFrame(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw source structure (left half)
  structures[state.sourceKey].draw(ctx, sourceInstance, {
    x: 0, y: 0, width: canvas.width / 2, height: canvas.height,
    colors: colorMap
  });

  // Draw target structure (right half)
  structures[state.targetKey].draw(ctx, targetInstance, {
    x: canvas.width / 2, y: 0, width: canvas.width / 2, height: canvas.height,
    colors: colorMap
  });

  // Draw animation overlay if active
  if (state.animation.playing || state.animation.progress > 0) {
    const step = state.animation.steps[state.animation.currentStep];
    step.drawFrame(ctx, state.animation.progress, {
      left: { x: 0, y: 0, width: canvas.width / 2, height: canvas.height },
      right: { x: canvas.width / 2, y: 0, width: canvas.width / 2, height: canvas.height },
      colors: colorMap
    });
  }

  requestAnimationFrame(renderFrame);
}
```

## Canvas Rendering Pipeline

### Frame Lifecycle

```
requestAnimationFrame(renderFrame)
    │
    ▼
1. Compute delta time, update animation progress
    │
    ▼
2. ctx.clearRect(0, 0, width, height)
    │
    ▼
3. Draw static source structure (left panel)
    │
    ▼
4. Draw static target structure (right panel)
    │
    ▼
5. Draw animation overlay (if animating)
    │   └── Current step's drawFrame(ctx, progress, opts)
    │       └── Uses interpolation: lerp(startVal, endVal, progress)
    │
    ▼
6. Draw UI overlays (step counter, chain indicator)
    │
    ▼
7. Schedule next frame (if animating) or stop loop (if static)
```

### Canvas Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │                     │    │                         │    │
│  │   Source Structure  │ -> │   Target Structure      │    │
│  │      (draw)         │    │      (draw)             │    │
│  │                     │    │                         │    │
│  └─────────────────────┘    └─────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step description text                               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chain indicator: Parens -> Dyck -> Binary Tree      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

The canvas is divided into two panels. Each structure's `draw()` receives a bounding box and renders within it. The animation overlay draws on top of both panels (e.g., arrows showing element correspondence, morphing shapes between representations). The step description and chain indicator are DOM elements below the canvas, not drawn on the canvas itself, because text in DOM is crisper and more accessible.

### Optimization: Static vs Animated Rendering

When no animation is playing, there is no need for a continuous rAF loop. The render pipeline should be:

- **Static mode:** Render once on state change (structure selection, instance change, n change). No rAF loop.
- **Animated mode:** Start rAF loop when animation begins, stop it when animation completes or is paused at a step boundary.

This avoids burning CPU/battery when the presenter is talking and not interacting.

## Anti-Patterns

### Anti-Pattern 1: God Canvas

**What people do:** Put all drawing logic in one giant render function with 11 switch cases.
**Why it's wrong:** Unmanageable, hard to develop incrementally, impossible to test a single structure in isolation.
**Do this instead:** Each structure module owns its own `draw()` function. The controller calls them polymorphically via the registry.

### Anti-Pattern 2: Structure-to-Structure Coupling

**What people do:** Write direct conversion functions between every pair of structures (55 converters for 11 structures).
**Why it's wrong:** Quadratic growth in code. Impossible to maintain. Most conversions would be nearly identical (through Dyck words anyway).
**Do this instead:** The Dyck word hub architecture. Each structure only knows how to convert to/from Dyck words. The bridge module composes these for any pair.

### Anti-Pattern 3: Animation State in Structure Modules

**What people do:** Give each structure module mutable animation state (current position, current frame, etc.).
**Why it's wrong:** Makes structures non-reentrant. Breaks when you need to draw source and target simultaneously. Creates hidden coupling between animation engine and structures.
**Do this instead:** Structures are stateless renderers. They receive instance data and a bounding box; they produce pixels. All animation state lives in the animation engine and is passed as `progress` to step draw functions.

### Anti-Pattern 4: ES Module Import Maps Without Fallback

**What people do:** Use bare specifier `import x from 'x'` expecting import maps, then discover the presenter's browser does not support them.
**Why it's wrong:** Import maps have good but not universal support. Presentation-day failure is catastrophic.
**Do this instead:** Use relative path imports exclusively (`import { toDyck } from './core/dyck.js'`). Relative imports work in all browsers that support ES modules (all modern browsers since 2018). Alternatively, use `<script>` tags with a global namespace if any import concern remains.

## Module Loading Strategy

Use native ES modules with `<script type="module">`. Every `.js` file uses `export` and `import` with **relative paths only**. The HTML entry point loads only `main.js`:

```html
<script type="module" src="js/main.js"></script>
```

`main.js` imports the registry, engine, and router. The registry imports all 11 structure modules. The router imports all 8 bijection modules plus the bridge.

**Fallback consideration:** If there is any concern about the presentation machine, a single concatenated `bundle.js` can be produced with a trivial shell script (`cat js/core/*.js js/structures/*.js js/bijections/*.js js/engine/*.js js/main.js > bundle.js`) and loaded as a classic script. Design the modules so they also work when concatenated by attaching to a global namespace object.

## Build Order (Dependency Chain)

The following build order respects inter-component dependencies. Each phase can be developed and visually tested before proceeding:

```
Phase 1: Foundation (no dependencies)
    ├── core/dyck.js           — Enumerate, validate Dyck words
    ├── core/colors.js         — Color palette mapping
    ├── core/canvas-utils.js   — Drawing primitives
    └── index.html + css/      — Layout with empty canvas

Phase 2: First Two Structures (depends on Phase 1)
    ├── structures/parentheses.js   — Simplest structure
    ├── structures/dyck-path.js     — Second simplest
    ├── js/main.js skeleton         — Renders both side by side
    └── Instance navigator          — Cycle through Dyck words

Phase 3: Animation Engine (depends on Phase 1)
    ├── engine/animation.js    — rAF loop, playback controls
    └── Playback UI            — Play/pause, step, speed slider

Phase 4: First Bijection (depends on Phases 2 + 3)
    ├── bijections/parens-dyck.js   — Simplest classical bijection
    ├── bijections/router.js        — Initially just one entry
    └── End-to-end: select pair, play animation, step through

Phase 5: Remaining Structures (depends on Phase 1, parallel)
    ├── structures/mountain.js
    ├── structures/lattice-path.js
    ├── structures/staircase.js
    ├── structures/binary-tree.js
    ├── structures/plane-tree.js
    ├── structures/ballot.js
    ├── structures/noncrossing.js
    ├── structures/triangulation.js
    └── structures/stack-sort.js

Phase 6: Remaining Bijections (depends on Phase 5)
    ├── bijections/binary-triang.js
    ├── bijections/parens-binary.js
    ├── bijections/dyck-lattice.js
    ├── bijections/binary-plane.js
    ├── bijections/dyck-mountain.js
    ├── bijections/noncross-triang.js
    └── bijections/ballot-dyck.js

Phase 7: Dyck Bridge (depends on Phases 5 + 3)
    └── bijections/bridge.js   — Generic composition for remaining 47 pairs

Phase 8: Polish (depends on all above)
    ├── Chain indicator UI
    ├── Color correspondence highlighting
    ├── Step description text
    └── Projector-friendly visual refinements
```

**Key dependency insight:** Phases 5 and 3 are independent and can be developed in parallel. Phase 4 is the critical integration test -- once one bijection works end-to-end, the remaining structures and bijections are stamping out the same pattern. The bridge (Phase 7) is technically simple once all structure modules exist, because it just composes `toDyck` and `fromDyck` calls.

## Internal Boundaries Summary

| Boundary | Communication Pattern | Contract |
|----------|----------------------|----------|
| UI Layer <-> App Controller | DOM events (addEventListener) / DOM mutations (textContent, classList) | Event names and DOM element IDs |
| App Controller <-> Structure Modules | Function calls via registry lookup | `{ toDyck, fromDyck, draw, enumerate }` |
| App Controller <-> Bijection Router | `router.getAnimation(src, tgt, dyck, n)` returns step array | Step array contract: `[{description, duration, drawFrame}]` |
| App Controller <-> Animation Engine | `engine.play(steps, speed)`, `engine.pause()`, `engine.step(+1/-1)`, `engine.onFrame(callback)` | Engine calls back with `(stepIndex, progress)` each frame |
| Bijection Router <-> Classical Modules | `module.getSteps(dyckWord, n, reversed)` | Same step array contract |
| Bijection Router <-> Dyck Bridge | `bridge.getSteps(srcKey, tgtKey, dyck, n, registry)` | Same step array contract |
| Structure Modules <-> Dyck Core | `dyck.enumerate(n)`, `dyck.validate(word)` | Dyck word = array of +1/-1 |
| Structure Modules <-> Canvas Utils | `utils.drawCircle(ctx, ...)`, `utils.drawLine(ctx, ...)`, etc. | Standard Canvas 2D drawing helpers |

## Sources

- HTML5 Canvas 2D rendering context API (MDN, HIGH confidence -- mature, stable API since 2011)
- ES modules in browsers (MDN, HIGH confidence -- supported in all modern browsers since ~2018)
- requestAnimationFrame timing patterns (MDN, HIGH confidence -- standard animation loop pattern)
- Catalan number bijection mathematics (Stanley's "Enumerative Combinatorics Vol. 2", HIGH confidence -- established mathematics)

---
*Architecture research for: Catalan Number Bijection Explorer*
*Researched: 2026-02-23*
