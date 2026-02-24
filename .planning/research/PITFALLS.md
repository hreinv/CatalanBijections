# Pitfalls Research

**Domain:** Interactive Canvas-based math visualization (Catalan number bijection explorer)
**Researched:** 2026-02-23
**Confidence:** HIGH (Canvas API, animation patterns, and math visualization are stable, well-documented domains)

## Critical Pitfalls

### Pitfall 1: Canvas Coordinate Chaos Across 11 Drawing Functions

**What goes wrong:**
Each of the 11 structure `draw()` functions ends up with its own ad-hoc coordinate system. Binary trees assume origin at top-center, triangulations assume a centered polygon, Dyck paths assume origin at bottom-left. When animating a bijection between two structures, the animation engine cannot smoothly interpolate elements because the two structures occupy incompatible coordinate spaces. The result is elements teleporting, overlapping, or flying off-canvas during transitions.

**Why it happens:**
It feels natural to write each `draw()` function to "just fill the canvas" using whatever origin makes sense for that structure. With 11 structures, nobody designs a shared coordinate contract upfront because the structures feel too different (a tree vs. a polygon vs. a lattice path).

**How to avoid:**
Define a `DrawingContext` contract before writing any `draw()` function. Every structure receives a bounding rectangle `{x, y, width, height}` and must render within it. The animation engine handles canvas transforms (`translate`, `scale`) to position structures side-by-side or overlaid. Each `draw()` function works in a normalized local coordinate system (e.g., [0, 1] x [0, 1]) and returns a map of element positions `{elementId: {x, y}}` so the animation engine can interpolate between source and target positions.

**Warning signs:**
- A `draw()` function uses raw canvas pixel values (e.g., `ctx.moveTo(400, 300)`)
- Two structures render at different sizes when placed side-by-side
- Animation interpolation requires per-bijection position hacks

**Phase to address:**
Phase 1 (Core Infrastructure) -- establish the drawing contract before any structure is implemented.

---

### Pitfall 2: Animation State Machine Becomes Ungovernable

**What goes wrong:**
The playback system (play/pause/step forward/step back/jump to start/jump to end/speed slider) accumulates impossible state combinations. Pressing "step back" during a mid-tween animation leaves the system in a partially-interpolated frame. Changing speed mid-animation causes timing discontinuities. Switching bijections while an animation is running corrupts the step list. The result is visual glitches, frozen UI, or animations that complete out of order.

**Why it happens:**
Developers start with a simple `requestAnimationFrame` loop and a `currentStep` counter, then bolt on features one at a time. Each feature (pause, step-back, speed change) adds special cases. Without a formal state machine, the interaction between features creates exponential edge cases.

**How to avoid:**
Model playback as an explicit finite state machine with exactly these states: `IDLE`, `PLAYING`, `PAUSED`, `STEPPING`. All transitions go through a single `dispatch(action)` function. The animation loop only advances when state is `PLAYING`. Step forward/back are synchronous state jumps that always land on a clean keyframe (never mid-tween). Speed changes only take effect on the next step boundary. Bijection switching always resets to `IDLE` first. Enforce: "every frame is either a keyframe or a deterministic interpolation between two keyframes."

**Warning signs:**
- Playback code has nested `if (isPlaying && !isPaused && !isStepping)` conditions
- Step-back produces visually different results than step-forward through the same point
- Speed slider causes jerky motion when adjusted during playback

**Phase to address:**
Phase 2 (Animation Engine) -- build the state machine before connecting it to any bijection.

---

### Pitfall 3: Dyck Word Bijection Correctness Errors

**What goes wrong:**
The `toDyck()` or `fromDyck()` conversion for one structure has a subtle off-by-one or ordering error. It appears to work for small n (n=1, n=2) because there are only 1-2 instances. At n=3 or n=4, the composed bijection (Structure A -> Dyck -> Structure B) maps to the wrong instance. Since there are 14 instances at n=4, the error may only affect a few of them and go unnoticed until the presentation.

**Why it happens:**
Catalan structure bijections are mathematically precise but surprisingly easy to get wrong in code. Common errors: (1) confusing left-child vs. right-child in binary tree encoding, (2) off-by-one in polygon vertex indexing for triangulations, (3) mishandling the empty tree / base case, (4) non-crossing partition blocks ordered differently than expected. Testing with n=1 or n=2 is nearly useless because most instances are trivially symmetric.

**How to avoid:**
Build a verification harness before implementing bijections. For each structure: (1) hardcode all C(3)=5 and C(4)=14 instances as test fixtures, (2) verify that `fromDyck(toDyck(instance))` is the identity for every instance, (3) verify that `toDyck()` produces exactly the set of all Dyck words of length 2n (no duplicates, no missing). Run this harness on every structure before writing any bijection animation. Additionally, for the 8 classical bijections, verify the direct bijection matches the composed Dyck bridge path for every instance at n=3 and n=4.

**Warning signs:**
- A `toDyck()` function was only tested on 1-2 examples
- Two different Catalan instances produce the same Dyck word (duplicate mapping)
- The round-trip test passes for n <= 2 but nobody checked n=3 or n=4
- The direct bijection and the Dyck bridge give different results for the same input

**Phase to address:**
Phase 3 (Structure Implementations) -- verification harness must exist before structures are considered "done." Revisit in Phase 4 (Bijection Animations) to cross-check direct vs. composed bijections.

---

### Pitfall 4: Canvas Redraw Performance Death Spiral

**What goes wrong:**
Each animation frame clears the entire canvas and redraws both structures from scratch plus all annotations, labels, highlights, and correspondence lines. At n=4 with complex structures (triangulations, non-crossing partitions), a single frame involves hundreds of path operations. The animation stutters or drops frames, especially on the classroom laptop/projector which may be a lower-powered machine.

**Why it happens:**
Canvas has no scene graph -- there is no automatic dirty-region tracking. The naive approach (clear everything, redraw everything) works fine for simple demos but scales poorly with visual complexity. Developers don't notice on their high-end development machine.

**How to avoid:**
Use a layered canvas approach: stack 2-3 `<canvas>` elements via CSS `position: absolute`. Layer 1 (bottom): static structure outlines that only redraw when the step changes. Layer 2: animated elements (the things that actually move/morph during interpolation). Layer 3 (top): UI overlays like highlight rings and correspondence lines. During tween animation, only Layer 2 needs per-frame redraws. Additionally, test on the actual presentation hardware (or throttle CPU in DevTools) early.

**Warning signs:**
- `requestAnimationFrame` callback takes >16ms (check with `performance.now()`)
- Animation looks smooth on dev machine but stutters on the presentation laptop
- Adding correspondence color lines causes visible frame drops

**Phase to address:**
Phase 2 (Animation Engine) -- establish the layered canvas architecture. Validate performance in Phase 5 (Integration) by testing on target hardware.

---

### Pitfall 5: Tree and Graph Layout Collisions

**What goes wrong:**
Binary trees at n=4 have up to 14 distinct shapes, some deeply unbalanced (e.g., a left-spine tree with 4 left children). A naive recursive layout algorithm allocates equal horizontal space to left and right subtrees, causing nodes to overlap in degenerate cases. Similarly, rooted plane trees with high branching factor overflow their allocated width. Triangulation vertex labels overlap edges. Non-crossing partition arcs clip through each other in dense configurations.

**Why it happens:**
Layout algorithms are tested on balanced or small examples. Degenerate cases (completely left-leaning tree, partition with many small blocks) only appear at n=3 and n=4, and developers often test with the "pretty" instances first.

**How to avoid:**
For binary trees, use a Reingold-Tilford-style layout or a simpler variant: recursively compute the width of each subtree, then allocate horizontal space proportionally. For rooted plane trees, compute subtree widths bottom-up. For all structures: enumerate all C(4)=14 instances during development and visually verify that none have overlaps. Build an instance gallery view early (a grid showing all 14 instances at once) as a visual regression tool.

**Warning signs:**
- Tree nodes overlap when the tree is heavily unbalanced
- Layout code uses `width / 2` to split space between subtrees (assumes balance)
- Only 2-3 "nice-looking" instances were visually checked

**Phase to address:**
Phase 3 (Structure Implementations) -- each structure's `draw()` must be verified against all 14 instances at n=4 before moving on.

---

### Pitfall 6: Bijection Step Decomposition Is Too Coarse or Incoherent

**What goes wrong:**
The animated bijection jumps from one structure to another in 2-3 large steps that are too fast and abstract for the audience to follow. Or worse, the intermediate steps don't correspond to any meaningful mathematical operation -- they are just visual morphs that look cool but don't teach anything. The presenter ends up saying "and then... magic happens... and we get this" which defeats the entire purpose.

**Why it happens:**
Implementing fine-grained animation steps is much harder than implementing the bijection itself. The bijection algorithm may be a single recursive function in code, but the visual explanation requires breaking it into 5-10 discrete steps with meaningful intermediate states. Developers take the shortcut of animating the output appearing all at once.

**How to avoid:**
For each bijection, write out the step decomposition on paper before coding. Each step should: (1) highlight the input element(s) being processed, (2) show the intermediate state, (3) place the output element(s) with correspondence coloring. Use a `Step` data structure: `{description: string, highlights: ElementId[], action: 'map' | 'create' | 'transform', sourceElements: ..., targetElements: ...}`. The description text must be something a math student can follow, e.g., "The left subtree of the root maps to the triangle adjacent to the base edge." Require that every step has a non-empty description string.

**Warning signs:**
- A bijection animation has fewer than 4 steps for n >= 3
- Step descriptions are vague ("transform structure") or missing
- The presenter cannot narrate what is happening at each step without looking at the code

**Phase to address:**
Phase 4 (Bijection Animations) -- step design is the core deliverable of this phase, not an afterthought.

---

### Pitfall 7: Element Correspondence Colors Become Unusable

**What goes wrong:**
Color-coded correspondence (showing which element in structure A maps to which element in structure B) fails because: (1) too many elements at n=4 (up to 4 pairs of parentheses = 8 symbols, 4 internal nodes, 4 edges, etc.) exhaust distinguishable colors, (2) colors that look distinct on a developer's monitor become indistinguishable on a projector, (3) colorblind audience members cannot follow the mapping.

**Why it happens:**
Developers pick colors in their IDE/browser that look great on a high-gamut display. Projectors wash out colors and compress the gamut. At n=4, you need up to 8 distinguishable colors (for 4 matched pairs, each pair has a source and target element), which is near the limit of what humans can reliably distinguish.

**How to avoid:**
Use a maximum of 4-5 colors, supplemented by other visual channels: shape (circle vs. square markers on elements), numbered labels, sequential highlighting (flash each pair one at a time during animation). Use a colorblind-safe palette (e.g., Paul Tol's qualitative palette or ColorBrewer qualitative sets). Test on a projector or with a projector simulation (reduce contrast and saturation in CSS/Canvas). For n=4, use sequential reveal: highlight pair 1, then dim it and highlight pair 2, rather than showing all pairs simultaneously.

**Warning signs:**
- More than 5 colors in the palette
- Colors chosen by hex code without testing on low-contrast display
- All correspondence pairs shown simultaneously at n=4
- No non-color visual distinction between elements (shape, label, animation order)

**Phase to address:**
Phase 3 (Structure Implementations) for the palette definition; Phase 4 (Bijection Animations) for the sequential reveal strategy.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding canvas dimensions (e.g., 800x600) | Quick setup, no layout math | Breaks on different screens, presenter laptop resolution may differ from dev machine | Never -- use `canvas.width = container.clientWidth` from the start |
| One monolithic `draw()` per structure | Faster initial implementation | Cannot animate sub-elements, cannot highlight individual parts, forces full redraw | Never -- need element-level drawing for correspondence highlighting |
| Storing animation state in global variables | Quick prototyping | Multiple simultaneous animations or fast bijection switches corrupt state | Only in throwaway prototype, refactor before Phase 2 |
| Copy-pasting bijection code for reverse direction | Avoid designing reversible steps | Bugs in forward vs. backward are different; step-back breaks | Never -- design steps to be reversible from the start |
| Skipping the Dyck bridge for "obvious" pairs | Saves implementing composed path | Inconsistency when bridge path disagrees with direct bijection; confuses debugging | Acceptable only if direct bijection has verified correctness against the Dyck bridge |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Redrawing all text labels every frame | Text rendering is expensive on Canvas; animation frame time spikes above 16ms | Only redraw labels on step change, not during tween interpolation | Noticeable at n=4 with 2 structures + labels + correspondence markers |
| Creating new `Path2D` objects every frame | GC pressure causes intermittent stutters every ~1-2 seconds | Cache `Path2D` objects and reuse them; only recreate on step change | Noticeable when animating complex structures (triangulations, non-crossing partitions) |
| Using `ctx.font = ...` and `ctx.measureText()` per frame | Font parsing is slow; `measureText` forces layout | Measure text once, cache dimensions, reuse | Noticeable when many labels are drawn (instance navigator with 14 items) |
| Excessive `ctx.save()`/`ctx.restore()` nesting | Each save/restore allocates state on a stack; deep nesting is slow | Manually set/reset only the properties you change | Unlikely to be critical at this scale, but poor practice |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Bijection animation plays too fast by default | Audience cannot follow the transformation; defeats the educational purpose | Default to slow speed (1 step per 2 seconds); let presenter speed up. Err on the side of too slow. |
| No visual indication of which step you are on | Presenter loses track during narration; cannot recover after a pause | Show step counter "Step 3 of 7" and a progress bar beneath the canvas |
| Structure picker uses dropdown menus | Presenter has to click, scroll, find; awkward during live presentation | Use a visual grid of 11 structure thumbnails, always visible; click to select source/target |
| Canvas does not indicate clickable/interactive elements | Presenter cannot tell what is interactive vs. decorative | Use cursor changes and hover states for interactive elements (even though this is Canvas, you can track mouse position and redraw with highlights) |
| Step description text is too small or positioned off-screen | Audience on projector cannot read the narration text | Large font (20px+), high contrast, positioned directly below the canvas, not in a sidebar |
| No keyboard shortcuts for playback | Presenter must click tiny buttons while talking and gesturing | Space=play/pause, Left/Right=step, Home/End=jump, up/down=speed. Document with a help overlay. |

## "Looks Done But Isn't" Checklist

- [ ] **Binary tree layout:** Verified with all 14 shapes at n=4, including the fully left-degenerate and fully right-degenerate trees
- [ ] **Triangulation drawing:** Verified that edge labels don't overlap for all 14 triangulations of the hexagon (n=4, 6-gon)
- [ ] **Non-crossing partition arcs:** Verified that arcs don't cross or overlap for all 14 partitions at n=4
- [ ] **Bijection round-trips:** `fromDyck(toDyck(x)) === x` verified for all 14 instances of every structure at n=4
- [ ] **Step-back consistency:** Stepping forward 3 then backward 3 returns to the exact same visual state for every bijection
- [ ] **Speed slider:** Changing speed mid-animation doesn't cause stuttering or skipped steps
- [ ] **Instance navigator:** Cycling through all 14 instances at n=4 doesn't leave visual artifacts from the previous instance
- [ ] **Projector test:** Ran the app on the actual presentation laptop+projector; colors are distinguishable, text is readable, animation is smooth
- [ ] **Window resize:** Canvas re-renders correctly if the browser window is resized or the projector has a different resolution than the dev screen
- [ ] **Dyck bridge composition:** For non-classical bijection pairs, the intermediate structure(s) are shown in the chain indicator, and the user understands this is a composed path

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Coordinate system chaos across structures | HIGH | Retrofit a normalized coordinate system into every `draw()` function; will break all existing rendering; essentially rewrite the drawing layer |
| Animation state machine bugs | MEDIUM | Extract all state into a single object; write the state machine from scratch; connect to existing rendering via a clean interface |
| Dyck word conversion errors | LOW-MEDIUM | Fix the specific `toDyck()`/`fromDyck()` bug; run verification harness to confirm all 14 instances pass; downstream bijection animations may need step recalculation |
| Canvas performance problems | MEDIUM | Introduce layered canvases retroactively; requires refactoring draw calls to target specific layers |
| Tree layout overlaps | LOW | Replace the layout algorithm in the single structure module; other code is unaffected |
| Incoherent bijection steps | HIGH | Requires redesigning the step sequence for the affected bijection; animation code, descriptions, and highlighting all change |
| Color correspondence failure | LOW | Swap palette and add sequential reveal; mostly CSS/config changes plus a small animation logic change |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Coordinate system chaos | Phase 1 (Core Infrastructure) | All 11 structures render correctly within arbitrary bounding rectangles; side-by-side placement works |
| Animation state machine | Phase 2 (Animation Engine) | Exhaustive test of all state transitions: play, pause at each step, step forward, step back, speed change, bijection switch |
| Dyck word correctness | Phase 3 (Structure Implementations) | Automated harness: round-trip identity for all C(n) instances at n=1..4 for every structure; no duplicate Dyck words |
| Canvas performance | Phase 2 (Animation Engine) | Frame time < 16ms measured with `performance.now()` on target hardware; test with n=4 triangulations (most complex drawing) |
| Tree/graph layout | Phase 3 (Structure Implementations) | Visual gallery of all 14 instances for each structure; human review for overlaps |
| Bijection step quality | Phase 4 (Bijection Animations) | Every step has a non-empty description; presenter can narrate the transformation without looking at code |
| Color correspondence | Phase 3 (palette) + Phase 4 (reveal strategy) | Projector simulation test: reduce monitor contrast 50%, verify all pairs distinguishable |

## Sources

- Canvas API specification and best practices (stable, well-documented -- MDN Web Docs)
- Reingold-Tilford tree layout algorithm (standard in graph drawing literature)
- Paul Tol's color schemes for scientific visualization (established colorblind-safe palettes)
- Catalan number bijection literature (Stanley's "Catalan Numbers" and "Enumerative Combinatorics" Vol. 2, Exercise 6.19)
- Animation state machine patterns (common in game development and interactive media)
- Projector display limitations (low contrast ratio, washed-out colors) are well-known in presentation design

**Note:** WebSearch was unavailable during this research. All findings are based on established domain knowledge in Canvas programming, mathematical visualization, animation engineering, and Catalan combinatorics. These are mature, stable domains where the pitfalls are well-known and unlikely to have changed recently. **Confidence: HIGH.**

---
*Pitfalls research for: Interactive Canvas-based Catalan number bijection visualization*
*Researched: 2026-02-23*
