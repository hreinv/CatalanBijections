# Project Research Summary

**Project:** Math380 Catalan Number Bijection Explorer
**Domain:** Interactive Canvas-based mathematical visualization (presentation tool)
**Researched:** 2026-02-23
**Confidence:** HIGH (stack and architecture), MEDIUM (features)

## Executive Summary

This project is a single-page, zero-dependency browser-based presentation tool for demonstrating bijections between 11 Catalan number structures. The consensus approach across all research areas is unambiguous: vanilla JavaScript with ES Modules, the HTML5 Canvas 2D API, and `requestAnimationFrame` — no frameworks, no build tools, no npm. This is the right call because the tool will be run live from a single laptop in a classroom; any build-time dependency creates failure risk at the podium. The mathematical domain (Catalan bijections) has rigid constraints that actually simplify design: every structure maps through a Dyck word, so the entire architecture reduces to a hub-and-spoke system around a canonical representation.

The recommended architecture is a hub pattern where the Dyck word is the universal internal representation. Each of the 11 structure modules implements exactly three functions (`toDyck`, `fromDyck`, `draw`) and knows nothing about any other structure. Eight classical bijections are hand-crafted as step-by-step animations; the remaining 47 pairs are handled by a Dyck Bridge module that composes the two converters. The Animation Engine is a separate, domain-agnostic component that consumes step sequences and drives the `requestAnimationFrame` loop. This separation means the math and the animation are independently testable.

The dominant risks are correctness and presentation-day reliability, not performance. At n <= 4, Canvas rendering is trivially fast. The real danger is subtle bijection bugs (off-by-one in Dyck encoding) that only appear at n=3 or n=4, coordinate system inconsistencies across 11 different drawing functions, and an animation state machine that accumulates impossible states from play/pause/step-back interactions. All three risks have well-known mitigations that must be built into the architecture from day one, not retrofitted.

## Key Findings

### Recommended Stack

The entire stack is native browser APIs with zero external dependencies. HTML5 Canvas 2D handles all rendering — immediate-mode drawing gives full control over the 11 distinct structure geometries. ES Modules with relative path imports (`import { toDyck } from './core/dyck.js'`) provide code organization without a build step. `requestAnimationFrame` with timestamp-based progress (0.0 to 1.0) drives animations at 60fps regardless of display refresh rate. Development requires only `python3 -m http.server 8080` (ES modules need HTTP, not `file://`). The tool works in any browser updated since 2018.

**Core technologies:**
- **HTML5 Canvas 2D** (`<canvas>` + `CanvasRenderingContext2D`): All structure rendering — provides pixel-level control for 11 distinct geometric forms, no DOM overhead during 60fps animation
- **Vanilla JavaScript (ES2022+)**: Application logic, data structures, bijection algorithms — no framework needed; avoids build-step failure risk during live presentation
- **ES Modules** (`type="module"`, relative paths only): Code organization across ~30 files — no bundler, no import maps, works in all modern browsers since 2018
- **`requestAnimationFrame`**: Animation loop — timestamp-based (not frame-counting), auto-pauses in background tabs, display-refresh-synced
- **`Path2D`**: Reusable shape definitions for hit-testing and structure drawing — define once, reuse across frames
- **CSS3 (vanilla)**: Layout and control panel — Flexbox/Grid, CSS custom properties for projector-friendly theming

**What NOT to use:** React/Vue (fights Canvas), D3.js (wrong abstraction for hand-drawn math), TypeScript (requires compile step), bundlers/npm (failure risk at podium), WebGL (2D structures need 2D rendering), `.mjs` extension (MIME type issues on some servers).

### Expected Features

The tool has three feature tiers. The P1 tier (without which the presentation fails) is large and dominated by the 11 structure renderers and bijection animations — these ARE the presentation. Supporting controls (playback, n selector, instance navigator, step descriptions) are low-complexity but essential for presenter pacing.

**Must have (P1 — table stakes):**
- All 11 structure renderers (parentheses, Dyck paths, mountain ranges, lattice paths, staircase polygons, binary trees, rooted plane trees, ballot sequences, non-crossing partitions, triangulations, stack-sortable permutations)
- Dyck word internal representation and all `toDyck`/`fromDyck` converters
- At least 3-4 classical bijection animations for the presentation (Parentheses-Dyck, Binary Trees-Triangulations, Parentheses-Binary Trees, Dyck-Mountain Ranges)
- Play/pause and step forward/back playback controls
- Structure pair selector and n selector (n = 1-4)
- Instance navigator (cycle through C(n) instances)
- Step description text (1-2 sentences per animation step)
- Color-coded element correspondence
- Projector-friendly design (thick strokes, large text, white background, high contrast)
- Works offline from `index.html` — no CDN links, no build step

**Should have (P2 — significant polish):**
- All 8 classical bijections animated
- Dyck Bridge for non-classical pairs (any-to-any selection)
- Keyboard shortcuts (Spacebar=play/pause, arrows=step, numbers=speed)
- Bijection chain indicator (shows intermediate Dyck word steps for bridge paths)
- Speed control slider
- Side-by-side dual-panel layout (source left, target right simultaneously)
- Highlight active transformation step (dim non-active elements)

**Defer (v2/P3):**
- Smooth interpolation animations (3Blue1Brown-quality morphing)
- All-instances gallery view (grid of all C(n) examples)
- URL hash state for pre-bookmarked demos
- Presenter notes/cheat sheet panel

**Anti-features (deliberately excluded):** User-editable structures, n > 4 support, mobile/touch, LaTeX rendering, sound effects, 3D visualization, persistence/save-load.

### Architecture Approach

The architecture is a strict hub-and-spoke pattern centered on the Dyck word as universal representation. The App Controller (main.js) owns a single flat state object and routes events to the Bijection Router or Animation Engine. Structure modules are stateless renderers — they receive a bounding box and produce pixels, never storing animation state. The Animation Engine is domain-agnostic, consuming step sequences with draw callbacks. This design means no structure ever needs to know about any other structure; all coupling routes through Dyck words. The build order mirrors the dependency chain: Core -> Structures -> Animation Engine -> First Bijection -> Remaining Structures -> Remaining Bijections -> Dyck Bridge -> Polish.

**Major components:**
1. **App Controller** (`main.js`) — owns global state, wires UI events, orchestrates render cycle; single source of truth
2. **Dyck Core** (`core/dyck.js`) — enumerates all Dyck words for n=1..4, validates words; depended on by everything
3. **Structure Modules** (11 files, `structures/`) — each exports `toDyck`, `fromDyck`, `draw`, `enumerate`; isolated and interchangeable
4. **Bijection Router** (`bijections/router.js`) — looks up classical bijection or falls back to Dyck Bridge; single entry point for the controller
5. **Classical Bijection Modules** (8 files, `bijections/`) — each exports `getSteps(dyckWord, n, reversed)` returning an array of `{description, duration, drawFrame}` step objects
6. **Dyck Bridge** (`bijections/bridge.js`) — composes `A.toDyck -> B.fromDyck` for the 47 non-classical pairs; generically produces step sequences
7. **Animation Engine** (`engine/animation.js`) — rAF loop, playback state machine (IDLE/PLAYING/PAUSED/STEPPING), easing functions, interpolation; knows nothing about structures or bijections
8. **Canvas Utils** (`core/canvas-utils.js`) — shared drawing primitives (arrows, circles, lines, text labels)
9. **Color Palette** (`core/colors.js`) — maps element indices to consistent colors for correspondence highlighting
10. **UI Layer** (HTML + CSS) — controls, selectors, step text; communicates with App Controller via DOM events

### Critical Pitfalls

1. **Coordinate system chaos across 11 draw functions** — Each structure invents its own origin and scale, making bijection interpolation impossible. Prevention: define a `DrawingContext` contract (`{x, y, width, height}` bounding box + normalized [0,1] local coordinates) before writing any `draw()` function. Must be addressed in Phase 1 before any structure is implemented.

2. **Animation state machine accumulates impossible states** — Adding play/pause/step-back/speed-change as bolt-ons creates exponential edge cases (what happens if you step back during a mid-tween?). Prevention: implement an explicit finite state machine (IDLE/PLAYING/PAUSED/STEPPING) with a single `dispatch(action)` function from the start. Must be addressed in Phase 2.

3. **Dyck word bijection correctness errors only visible at n=3/n=4** — Off-by-one in tree encoding or polygon vertex indexing passes tests at n=1..2 but fails for some of the 14 n=4 instances. Prevention: build a verification harness first; verify `fromDyck(toDyck(x)) === x` for all C(4)=14 instances of every structure before writing any bijection animation.

4. **Tree and graph layout collisions for degenerate structures** — Naive `width/2` split for binary tree children fails for fully left-leaning or right-leaning trees at n=4. Prevention: use Reingold-Tilford-style proportional subtree width allocation; visually verify all 14 instances during development.

5. **Bijection step decomposition too coarse for teaching** — Animating the full bijection in 2-3 opaque steps leaves the audience saying "magic happened." Prevention: design step sequences on paper before coding; require non-empty description strings; target 5-10 steps per bijection at n=3.

6. **Color correspondence fails on projectors** — Colors that look distinct on a high-gamut monitor become indistinguishable at n=4. Prevention: max 4-5 colors, colorblind-safe palette (Paul Tol or ColorBrewer), sequential reveal at n=4 rather than simultaneous display.

## Implications for Roadmap

Based on research, the build order is strictly dependency-driven. The Dyck word representation and drawing contract must exist before any structure can be built. One end-to-end bijection must work before it makes sense to stamp out the remaining structures and bijections. The Phase 7 bridge is technically simple once all 11 structure converters exist.

### Phase 1: Core Foundation

**Rationale:** Everything else depends on Dyck word enumeration and the drawing contract. This phase has no domain-specific dependencies and can be validated independently.
**Delivers:** `core/dyck.js` (enumerate, validate), `core/canvas-utils.js` (drawing primitives), `core/colors.js` (correspondence palette), `index.html` with canvas layout, `css/style.css` with projector-friendly design tokens
**Addresses:** Coordinate system chaos pitfall — establish `{x, y, width, height}` DrawingContext contract before any structure draws a single pixel
**Avoids:** Pitfall 1 (coordinate chaos), Pitfall 7 (colors) — define the palette and contract here, not per-structure

### Phase 2: First Two Structures + Animation Engine

**Rationale:** Build the minimum vertical slice: two structures that can be selected, rendered side-by-side, and animated. This validates the full pipeline before adding complexity. Animation Engine is built in parallel (no domain dependency).
**Delivers:** `structures/parentheses.js`, `structures/dyck-path.js`, `engine/animation.js` (IDLE/PLAYING/PAUSED/STEPPING state machine), playback controls UI, instance navigator
**Uses:** `requestAnimationFrame` timestamp loop, easing functions (`easeInOut` primary), `lerp` interpolation
**Implements:** Pattern 2 (Step-Sequence Animation), Pattern 4 (Immediate-Mode Canvas Rendering)
**Avoids:** Pitfall 2 (state machine) — build the formal state machine before connecting any bijection to it

### Phase 3: First Classical Bijection (End-to-End Integration)

**Rationale:** One complete working bijection proves the architecture. After this phase, the remaining structures and bijections are repetition of an established pattern. This is the highest-risk integration milestone.
**Delivers:** `bijections/parens-dyck.js` (simplest classical bijection), `bijections/router.js` (initially one entry), full end-to-end: select pair, play animation, step through, step back, change speed
**Addresses:** Pitfall 6 (bijection step quality) — design the step sequence for Parentheses-to-Dyck with 5+ steps and non-empty descriptions, establishing the quality bar

### Phase 4: Remaining Structure Renderers

**Rationale:** With the pipeline proven, stamp out the remaining 9 structures. Each depends only on `core/` and follows the established interface contract. These are independent and can be developed in parallel.
**Delivers:** All 11 structure renderers complete and verified: `mountain.js`, `lattice-path.js`, `staircase.js`, `binary-tree.js`, `plane-tree.js`, `ballot.js`, `noncrossing.js`, `triangulation.js`, `stack-sort.js`
**Avoids:** Pitfall 3 (Dyck correctness) — verification harness runs `fromDyck(toDyck(x)) === x` for all C(4)=14 instances of every structure before the phase is done; Pitfall 5 (tree layout) — verify all 14 binary tree shapes visually before moving on

### Phase 5: Remaining Classical Bijections

**Rationale:** Depends on all structure renderers (Phase 4). All 8 classical bijections follow the same pattern established in Phase 3. Prioritize bijections most likely to be demonstrated in the presentation.
**Delivers:** All 8 classical bijections animated: `binary-triang.js`, `parens-binary.js`, `dyck-lattice.js`, `binary-plane.js`, `dyck-mountain.js`, `noncross-triang.js`, `ballot-dyck.js`, plus reversals
**Addresses:** P1 feature — animated bijection between any two selected structures (via classical path)
**Avoids:** Pitfall 6 (step quality) — every bijection requires 5+ steps with descriptions; cross-check each direct bijection against the Dyck bridge to catch Dyck correctness errors

### Phase 6: Dyck Bridge + Full Pair Coverage

**Rationale:** Once all 11 `toDyck`/`fromDyck` converters are verified, the bridge is technically simple — it composes existing functions. This phase unlocks the "any pair" selector.
**Delivers:** `bijections/bridge.js`, bijection chain indicator UI (shows intermediate Dyck word steps), full 55-pair selector becomes functional
**Addresses:** P2 feature — Dyck bridge for non-classical pairs; bijection chain visualization

### Phase 7: Polish and Presentation Hardening

**Rationale:** With all features functional, focus on presentation reliability and audience experience. This phase directly addresses UX pitfalls and projector failure modes.
**Delivers:** Keyboard shortcuts (Space/arrows/numbers), speed control slider, step counter ("Step 3 of 7"), projector color verification, window resize handling, visual testing on target hardware
**Addresses:** UX pitfalls (animation too fast, no step indicator, no keyboard shortcuts), Pitfall 7 (color correspondence on projector)
**Verification:** Run the "Looks Done But Isn't" checklist from PITFALLS.md in full

### Phase Ordering Rationale

- **Core before structures:** The drawing contract and Dyck enumeration are zero-dependency foundations. Reversing this order means retrofitting a coordinate system into existing draw functions — recovery cost is HIGH.
- **Animation Engine parallel to structures:** The engine is domain-agnostic and has no dependency on structure modules. Building it alongside the first two structures allows integration testing in Phase 3.
- **One bijection before all structures:** Validating the full pipeline early (Phase 3) catches architectural errors before they multiply across 9 additional structures.
- **Classical bijections before bridge:** The bridge depends on all `toDyck`/`fromDyck` converters being correct. The correctness verification naturally happens when classical bijections are cross-checked against composed Dyck paths.
- **Polish last:** Keyboard shortcuts and speed controls are low-effort but should not distract from getting the core math right.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Structure Renderers):** Triangulation of the (n+2)-gon and non-crossing partition arc drawing both have non-trivial geometry. The Reingold-Tilford tree layout may need reference. Consider targeted research into specific drawing algorithms before implementation.
- **Phase 5 (Classical Bijections):** The mathematical definitions of each bijection need to be translated into step sequences. Stanley's Catalan Numbers (Exercise 6.19 bijection catalog) is the primary reference. Each bijection should be mapped to steps on paper before coding.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core Foundation):** Canvas setup, Dyck word enumeration, and color palette are fully documented standard patterns. STACK.md contains complete prescriptive code snippets.
- **Phase 2 (Animation Engine):** `requestAnimationFrame` timestamp loop and explicit state machine are textbook patterns. STACK.md and PITFALLS.md contain prescriptive implementations.
- **Phase 3 (First Bijection):** Parentheses-to-Dyck path bijection is the simplest and most documented classical Catalan bijection. Well-established pattern.
- **Phase 6 (Dyck Bridge):** Technically simple composition of existing functions once all converters exist. No novel algorithms required.
- **Phase 7 (Polish):** Keyboard shortcuts, step counters, and speed sliders are standard UI patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations backed by MDN official documentation. Zero-dependency approach eliminates version compatibility uncertainty. APIs used are Baseline Widely Available since 2016. |
| Features | MEDIUM | No live source verification possible (WebSearch unavailable during research). Feature set derived from comparable tool analysis (Manim, GeoGebra, VisuAlgo) using training data knowledge. Core P1 features are unambiguous from project requirements; P2/P3 prioritization is best-effort. |
| Architecture | HIGH | Hub-and-spoke Dyck word pattern is mathematically guaranteed by the Catalan bijection property. Component boundaries are clean and well-precedented in Canvas application design. Build order is dependency-determined, not speculative. |
| Pitfalls | HIGH | Canvas coordinate systems, animation state machines, and tree layout are stable, well-documented domains. Catalan bijection math is established (Stanley's "Enumerative Combinatorics"). Projector display limitations are well-known in presentation design. |

**Overall confidence:** HIGH

### Gaps to Address

- **Projector testing:** The actual classroom projector may have specific color reproduction characteristics. The tool must be tested on the presentation hardware before the talk. Flag for Phase 7 verification.
- **Bijection step counts:** The right number of steps per bijection (for audience comprehension vs. pacing) cannot be determined without a dry run. Default to 5-8 steps per bijection; adjust after a practice presentation.
- **n=4 visual complexity:** At n=4, some structures (14 instances of triangulations, non-crossing partitions) may be visually dense. The actual rendering quality at projector resolution is unknown until tested. If n=4 is illegible, fall back to n=3 as the demonstration maximum.
- **Feature confidence gap:** P2/P3 feature prioritization is based on judgment, not validated user research. If development time is short, default to completing all P1 features plus keyboard shortcuts and keyboard shortcuts before any P2 features.

## Sources

### Primary (HIGH confidence)
- MDN Canvas API reference — Canvas 2D context, Path2D, isPointInPath, measureText, ctx.save/restore
- MDN requestAnimationFrame — timestamp-based animation loop pattern
- MDN JavaScript Modules Guide — ES module import/export, relative paths, browser compatibility
- MDN Canvas Optimization Guide — HiDPI scaling, `{ alpha: false }`, layered canvas pattern
- Stanley, R.P. "Enumerative Combinatorics, Vol. 2" (Exercise 6.19) — Catalan bijection catalog, 11 structure definitions
- Stanley, R.P. "Catalan Numbers" — structure enumeration, bijection correctness properties

### Secondary (MEDIUM confidence)
- Manim Community documentation — animation step decomposition patterns (training data knowledge)
- GeoGebra, VisuAlgo, Desmos feature sets — comparable tool feature analysis (training data knowledge)
- Reingold-Tilford tree layout algorithm — standard in graph drawing literature
- Paul Tol's color schemes — colorblind-safe qualitative palettes for scientific visualization
- ColorBrewer qualitative color sets — projector-safe color palettes
- Robert Penner easing equations — cubic easing function math

### Tertiary (LOW confidence)
- Projector color rendering behavior — based on general presentation design literature; actual behavior depends on specific classroom hardware
- Optimal bijection step counts for classroom audience comprehension — no empirical data; based on general instructional design principles

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
