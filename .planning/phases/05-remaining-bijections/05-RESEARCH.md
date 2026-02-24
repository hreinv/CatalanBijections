# Phase 5: Remaining Bijections - Research

**Researched:** 2026-02-24
**Domain:** Five classical Catalan bijection animations: Dyck-Paths-to-Lattice-Paths, Binary-Trees-to-Rooted-Plane-Trees, Dyck-Paths-to-Mountain-Ranges, Non-crossing-Partitions-to-Triangulations, Ballot-Sequences-to-Dyck-Paths
**Confidence:** HIGH

## Summary

Phase 5 completes the eight classical bijection animations by implementing the remaining five bijection modules. The architecture, contract, and visual patterns are fully established from Phase 3 (three bijections already implemented: parens-dyck, binary-triang, parens-binary). Each new bijection module follows the identical pattern: export `META` for router registration, export `getSteps(dyckWord, n, reversed)` returning `{ description, drawFrame }` step objects. The router already supports bidirectional registration. The animation engine, easing, color correspondence, pulse/glow highlighting, and step description panel are all in place.

The five remaining bijections vary in mathematical complexity but share a common implementation strategy. Three of them (BIJC-06 Dyck-to-Mountain, BIJC-08 Ballot-to-Dyck, BIJC-04 Dyck-to-Lattice) are "visual reinterpretation" bijections where the same Dyck word data is rendered in two different visual forms step by step. The other two (BIJC-05 Binary-Trees-to-Rooted-Plane-Trees, BIJC-07 Non-crossing-Partitions-to-Triangulations) require genuinely different structural transformations. All five use the Dyck word as the shared internal representation, meaning `fromDyck()` on both source and target structure modules produces the correct instances. The challenge is designing clear, educational step sequences that visually explain WHY the bijection works, not just that it does.

The existing codebase provides all necessary building blocks: 11 structure modules with `fromDyck/toDyck/draw`, the bijection router with auto-reverse registration, the animation engine with eased progress, and proven drawing helper patterns (three-zone rendering, pulse glow, dimming). Each new bijection module is self-contained (~200-400 lines) and only needs to be imported and registered in router.js.

**Primary recommendation:** Implement the five bijections in order of increasing complexity: (1) Ballot-to-Dyck and Dyck-to-Mountain (simplest, direct symbol reinterpretation), (2) Dyck-to-Lattice (coordinate rotation), (3) Binary-Trees-to-Rooted-Plane-Trees (LCRS structural transform), (4) Non-crossing-Partitions-to-Triangulations (most complex correspondence). Register each in router.js as it is built.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BIJC-04 | Dyck Paths to Lattice Paths bijection with step-by-step animation (45-degree geometric rotation) | Dyck path +1 maps to R (right), -1 maps to U (up) in lattice path. The 45-degree rotation is a coordinate transform: Dyck point (x,y) maps to lattice point ((x+y)/2, (x-y)/2). Steps: show Dyck path, then for each step show how the direction maps to R/U on the lattice grid. Drawing helpers reuse Dyck grid and lattice grid patterns from structure modules. |
| BIJC-05 | Binary Trees to Rooted Plane Trees bijection with step-by-step animation (left-child/right-sibling rotation) | The Knuth transform (LCRS): binary tree left-child becomes plane tree first-child, binary tree right-child becomes plane tree next-sibling. Steps: show binary tree, then for each node in pre-order, show how left pointer becomes "first child" and right pointer becomes "next sibling" in the plane tree. Rooted plane tree layout uses existing width-accumulation layout from rooted-plane-tree.js. |
| BIJC-06 | Dyck Paths to Mountain Ranges bijection with step-by-step animation (visual reinterpretation) | Trivially the same data (+1=up, -1=down), just rendered differently (grid path vs filled silhouette). Steps: show Dyck path on grid, then for each step show the mountain profile growing, highlighting the correspondence between path segments and mountain slopes. |
| BIJC-07 | Non-crossing Partitions to Triangulations bijection with step-by-step animation (partition blocks to triangle fans) | Both structures go through Dyck words. The bijection composes NCP->Dyck->Triangulation. Steps: show the NCP on circle, identify each block, show corresponding triangle fan in the polygon. Use the existing fromDyck outputs for both structures on the same Dyck word to establish the correspondence. |
| BIJC-08 | Ballot Sequences to Dyck Paths bijection with step-by-step animation (A-ahead = path above axis) | Direct symbol mapping: vote A maps to +1 (up step), vote B maps to -1 (down step). "A always ahead or tied" constraint = "path never below x-axis" constraint. Steps mirror parens-dyck pattern: show ballot sequence, then for each vote draw corresponding path step. |
</phase_requirements>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| HTML5 Canvas 2D | Baseline | All bijection animation rendering | Same as Phases 1-4; immediate-mode drawing with per-frame full redraw |
| Vanilla JS (ES2022+ modules) | Current | Bijection modules following established contract | Zero-dependency constraint; identical module pattern to Phase 3 bijections |
| CORRESPONDENCE_COLORS | Phase 1 | 8 high-contrast colors for element correspondence | Already established in `core/colors.js`, used by all Phase 3 bijections |
| Animation Engine | Phase 2 | Playback state machine consuming step arrays | `createAnimationEngine` in `engine/animation.js` |
| Bijection Router | Phase 3 | Bidirectional registry mapping structure pairs to modules | `bijections/router.js` with `register()` and `getSteps()` |
| Easing | Phase 3 | `easeInOutCubic` applied in render() | `core/easing.js` |

### Supporting

| API/Pattern | Purpose | When to Use |
|-------------|---------|-------------|
| `globalAlpha` | Dim inactive elements (0.25 alpha) | Three-zone rendering in every drawFrame |
| `shadowBlur` + `shadowColor` | Pulsing glow on active elements | Active element highlighting in every drawFrame |
| `Math.sin(Date.now() * 0.008 * Math.PI)` | ~2Hz pulse oscillation | Compute pulse intensity each frame |
| `ctx.save()` / `ctx.restore()` | Isolate shadow/alpha state per element | Around every element draw to prevent glow leaks |
| `setLineDash([5, 5])` | Dashed lines for lattice diagonal | Lattice path diagonal boundary |
| `quadraticCurveTo` | Curved arcs for NCP rendering | Non-crossing partition chord arcs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-bijection drawFrame drawing | Delegating to structure module draw() with highlight params | Phase 3 decision (03-02): drawFrame draws directly rather than delegating, giving full control over three-zone rendering |
| Computing LCRS transform at animation time | Pre-computing correspondence pairs like binary-triang | Pre-computation is cleaner; compute node-to-node mapping once in getSteps, reference by index in drawFrame |
| Composing NCP->Dyck->Triangulation programmatically | Direct NCP->Triangulation mathematical bijection | Both structures already have fromDyck; composition through Dyck word is simpler and guaranteed correct |

**Installation:**
```bash
# No installation. Same as all prior phases:
python3 -m http.server 8080
```

## Architecture Patterns

### Recommended Project Structure (Phase 5 additions)

```
js/
  bijections/
    router.js              # Modified: import + register 5 new modules
    parens-dyck.js         # Phase 3 (reference implementation)
    binary-triang.js       # Phase 3 (reference implementation)
    parens-binary.js       # Phase 3 (reference implementation)
    dyck-lattice.js        # NEW: BIJC-04 Dyck Paths <-> Lattice Paths
    binary-plane-tree.js   # NEW: BIJC-05 Binary Trees <-> Rooted Plane Trees
    dyck-mountain.js       # NEW: BIJC-06 Dyck Paths <-> Mountain Ranges
    ncp-triang.js          # NEW: BIJC-07 Non-crossing Partitions <-> Triangulations
    ballot-dyck.js         # NEW: BIJC-08 Ballot Sequences <-> Dyck Paths
```

### Pattern 1: Bijection Module Contract (established in Phase 3)

Every new bijection module follows this exact contract:

```javascript
// Template for every Phase 5 bijection module

import * as sourceStructure from '../structures/source.js';
import * as targetStructure from '../structures/target.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'source-key',       // Must match registry key in structures/registry.js
  target: 'target-key',       // Must match registry key in structures/registry.js
  label: 'Source to Target',  // Human-readable label
};

/**
 * Generate animation step sequence.
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order
 * @param {boolean} [reversed=false] - If true, show target -> source
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  // Pre-compute both structure instances from dyckWord
  const sourceInstance = sourceStructure.fromDyck(dyckWord);
  const targetInstance = targetStructure.fromDyck(dyckWord);

  const steps = [];

  // Step 0: Introduction
  steps.push({
    description: reversed ? '...' : '...',
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const srcBox = reversed ? targetBox : sourceBox;
      const tgtBox = reversed ? sourceBox : targetBox;
      // Draw source structure fully, target structure empty/outline
    },
  });

  // Steps 1..N: One per element correspondence
  for (let i = 0; i < elementCount; i++) {
    steps.push({
      description: reversed ? '...' : '...',
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const srcBox = reversed ? targetBox : sourceBox;
        const tgtBox = reversed ? sourceBox : targetBox;
        // Three zones: processed (colored), active (pulsing), pending (dimmed)
      },
    });
  }

  // Step N+1: Completion
  steps.push({
    description: reversed ? '...' : '...',
    drawFrame(ctx, progress, opts) {
      // All elements colored with correspondence
    },
  });

  if (reversed) steps.reverse();
  return steps;
}
```

**Confidence:** HIGH (proven pattern from 3 working bijection modules)

### Pattern 2: Router Registration (trivial addition)

```javascript
// router.js additions -- just import and register each new module
import * as dyckLattice from './dyck-lattice.js';
import * as binaryPlaneTree from './binary-plane-tree.js';
import * as dyckMountain from './dyck-mountain.js';
import * as ncpTriang from './ncp-triang.js';
import * as ballotDyck from './ballot-dyck.js';

register(dyckLattice);
register(binaryPlaneTree);
register(dyckMountain);
register(ncpTriang);
register(ballotDyck);
```

**Confidence:** HIGH (router.register() pattern established and tested)

### Pattern 3: Three-Zone Rendering (reused from Phase 3)

Every drawFrame uses three visual zones for both source and target panels:

1. **Already processed** (index < activeIndex): full opacity, correspondence color, no glow
2. **Active** (index === activeIndex): full opacity, correspondence color, pulsing glow via `shadowBlur = 8 + pulse * 12`
3. **Not yet processed** (index > activeIndex): dimmed at `globalAlpha = 0.25`, default stroke color

This pattern is identical across all three Phase 3 bijections and will be reused verbatim.

**Confidence:** HIGH (established and visually tested in Phase 3)

### Anti-Patterns to Avoid

- **Calling structure module draw() inside drawFrame:** Phase 3 decision (03-02) established that drawFrame draws elements directly for full control over zones. Do not delegate to the structure module's draw() function.
- **Different color indexing between source and target:** The same color index `i` must refer to the same logical element in both panels. Map correspondence explicitly.
- **Forgetting reversed box assignment:** When `reversed=true`, the source/target boxes swap. Every drawFrame must compute `srcBox = reversed ? targetBox : sourceBox`.
- **Computing layout inside drawFrame:** Layout is expensive. Compute tree layouts, polygon vertices, grid parameters once in getSteps, capture in closure. drawFrame only reads pre-computed values.
- **Inconsistent step counts across bijections:** Each bijection naturally has different step counts. Parens-dyck has 2n+2 steps, binary-triang has n+2 steps. This is fine -- the animation engine handles any step count.

## Bijection-Specific Research

### BIJC-04: Dyck Paths to Lattice Paths (45-degree rotation)

**Mathematical bijection:**
- Dyck path: lattice path from (0,0) to (2n,0) using steps (+1,+1) and (+1,-1), never below x-axis
- Lattice path below diagonal: path from (0,0) to (n,n) using steps R=(+1,0) and U=(0,+1), never above y=x diagonal
- Mapping: Dyck step +1 (up) maps to R (right), Dyck step -1 (down) maps to U (up)
- Geometric interpretation: The 45-degree rotation transforms the Dyck path grid into the lattice grid. A Dyck point at (x,y) corresponds to lattice point ((x+y)/2, (x-y)/2).

**Already implemented in structure modules:**
- `dyck-path.js`: `fromDyck()` returns `{ points }` with (x,y) coordinates
- `lattice-path.js`: `fromDyck()` maps +1 to R, -1 to U, returns `{ n, steps, points }`
- Both use the same Dyck word; the correspondence is step-by-step.

**Step design (2n+2 steps):**
- Step 0: Show Dyck path on grid (left) and empty lattice grid with diagonal (right)
- Steps 1..2n: For each step i, highlight Dyck segment i (up or down) and draw corresponding lattice segment (R or U). Show the direction mapping: "Up step (+1,+1) maps to Right step (R)"
- Step 2n+1: Both paths fully colored with correspondence

**Drawing approach:**
- Left panel: Dyck path grid + segments (reuse drawing helpers from parens-dyck.js)
- Right panel: Lattice n x n grid with dashed diagonal + path segments
- Color: segment i in both panels gets `colors[i % colors.length]`

**Step count for n=4:** 2*4+2 = 10 steps (exceeds 5+ requirement)

**Confidence:** HIGH (direct step-by-step mapping identical to parens-dyck pattern)

### BIJC-05: Binary Trees to Rooted Plane Trees (LCRS rotation)

**Mathematical bijection (Knuth transform / LCRS):**
- Binary tree: each node has left child and right child (possibly null)
- Rooted plane tree: each node has an ordered list of children
- Mapping (binary -> plane tree):
  - Binary tree root becomes plane tree root
  - Binary tree left child becomes first child in plane tree
  - Binary tree right child becomes next sibling in plane tree
  - Apply recursively

**Algorithm to compute correspondence:**
Given a binary tree node B and its corresponding plane tree node P:
1. If B.left exists, P gets a first child corresponding to B.left
2. If B.right exists, the parent of P (in the plane tree) gets a next child (sibling of P) corresponding to B.right
3. Recurse on all children

More precisely, the correspondence pairs can be collected by walking the binary tree:
- Collect pairs as (binaryNode, planeTreeNode) by DFS
- The binary tree root maps to the first child of the plane tree root
- For each binary node's left child: becomes the first child of the corresponding plane tree node
- For each binary node's right child: becomes the next sibling of the corresponding plane tree node

**Step design (n+2 steps):**
- Step 0: Show binary tree (left) and empty plane tree root (right)
- Steps 1..n: For each binary tree node (pre-order), show: "Binary node i's left child becomes plane tree child; right child becomes sibling." Highlight the node in binary tree and its corresponding node in the plane tree.
- Step n+1: Both trees fully colored with correspondence

**Drawing approach:**
- Left panel: Binary tree with in-order x layout, depth y layout (reuse treeDrawParams pattern from binary-triang.js)
- Right panel: Rooted plane tree with width-accumulation layout (from rooted-plane-tree.js, computed locally)
- Color: node i in pre-order gets same color in both panels

**Key implementation detail:** The binary tree `fromDyck()` and rooted plane tree `fromDyck()` both operate on the same Dyck word, producing the mathematically correct correspondence. The challenge is computing which binary tree node corresponds to which plane tree node. This is deterministic from the Dyck word structure:
- Walk the Dyck word: +1 = "descend to left child" (binary) / "descend to new child" (plane tree), -1 = "backtrack". Both trees are built by the same walk, just interpreted differently.
- Pre-order traversal of the binary tree produces nodes in the same order as pre-order traversal of the plane tree (excluding the plane tree root, which has no binary tree counterpart since plane tree has n+1 nodes, binary tree has n nodes).

**Step count for n=4:** 4+2 = 6 steps (exceeds 5+ requirement)

**Confidence:** HIGH (LCRS is well-documented; both fromDyck use the same Dyck word ensuring correspondence)

### BIJC-06: Dyck Paths to Mountain Ranges (visual reinterpretation)

**Mathematical bijection:**
This is the simplest bijection -- Dyck paths and mountain ranges ARE the same mathematical object, just rendered differently:
- Dyck path: lattice path on a grid with dots at vertices, grid lines visible
- Mountain range: filled silhouette with no grid, peaks highlighted

The bijection is the identity on the underlying data. The visual interest comes from showing how the same walk looks as a precise geometric path versus a terrain silhouette.

**Step design (2n+2 steps):**
- Step 0: Show Dyck path on grid (left) and empty mountain baseline (right)
- Steps 1..2n: For each step i, highlight Dyck segment i and draw the corresponding mountain slope segment. Show: "Up step becomes ascending slope" or "Down step becomes descending slope"
- Step 2n+1: Both views fully colored

**Drawing approach:**
- Left panel: Dyck path grid + segments (reuse from parens-dyck.js drawing helpers)
- Right panel: Mountain silhouette building incrementally with filled area under the profile
- Color: segment i gets same color in both panels. Peaks in mountain correspond to local maxima in Dyck path.

**Step count for n=4:** 10 steps

**Confidence:** HIGH (identity bijection, trivially correct)

### BIJC-07: Non-crossing Partitions to Triangulations

**Mathematical bijection:**
This bijection is the most complex of the five. Non-crossing partitions of {1,...,n} and triangulations of the (n+2)-gon are both counted by C_n. The bijection goes through the Dyck word:
- NCP -> Dyck word (via `non-crossing-partition.js toDyck()` which returns stored copy)
- Dyck word -> Triangulation (via `triangulation.js fromDyck()`)

Since both structures derive from the same Dyck word, the correspondence is implicit. The educational value is in showing HOW the partition blocks relate to the triangulation structure.

**Correspondence structure:**
For a given Dyck word:
1. The NCP has k blocks (some may be singletons)
2. The triangulation has n triangles
3. The correspondence maps through the Dyck word: each matched pair in the Dyck word corresponds to one element in the NCP and one triangle in the triangulation

**Step design (n+2 steps):**
- Step 0: Show NCP on circle (left) and polygon outline (right)
- Steps 1..n: For each matched pair in the Dyck word (which determines both a partition element and a triangle):
  - Highlight the corresponding element(s) in the NCP
  - Reveal the corresponding triangle in the triangulation
  - Description: "Element i in block B maps to triangle (v0, v1, v2)"
- Step n+1: All elements colored, all triangles filled

**Drawing approach:**
- Left panel: Circle with n points, arcs for blocks (reuse NCP drawing patterns from non-crossing-partition.js)
- Right panel: (n+2)-gon with triangles (reuse polygon/triangle drawing from binary-triang.js)
- The color mapping uses pre-order correspondence: element i in the NCP (by opening order) gets the same color as triangle i (by pre-order tree traversal)

**Implementation strategy:** Build the binary tree from the Dyck word, collect node-triangle pairs via pre-order (same as binary-triang.js), then map each node to the NCP element that corresponds to its matched pair in the Dyck word. The mapping is: binary tree node i (pre-order) corresponds to the i-th matched pair, which corresponds to NCP element i (by opening position).

**Step count for n=4:** 6 steps

**Confidence:** MEDIUM (the through-Dyck-word composition is correct but the visual correspondence between NCP blocks and triangles is less direct than other bijections; careful color indexing needed)

### BIJC-08: Ballot Sequences to Dyck Paths

**Mathematical bijection:**
Direct symbol mapping, nearly identical to parens-dyck:
- Vote A maps to +1 (up step): candidate A gaining a vote = path going up
- Vote B maps to -1 (down step): candidate B gaining a vote = path going down
- "A always ahead or tied" constraint = "path never below x-axis" (Dyck path condition)

**Step design (2n+2 steps):**
- Step 0: Show ballot sequence (left) and empty Dyck path grid (right)
- Steps 1..2n: For each vote i, highlight the vote letter and draw the corresponding path segment. Show: "Vote A: path goes up (+1,+1)" or "Vote B: path goes down (+1,-1)"
- Step 2n+1: Both fully colored

**Drawing approach:**
- Left panel: Ballot sequence vote letters with tallies (reuse ballot drawing patterns from ballot-sequence.js)
- Right panel: Dyck path grid + segments (reuse from parens-dyck.js helpers)
- Color: vote/segment i gets `colors[i % colors.length]`

**Step count for n=4:** 10 steps

**Confidence:** HIGH (identical pattern to parens-dyck, just different source structure rendering)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dyck path grid drawing | New grid rendering code | Copy/adapt `drawDyckGrid` and `drawDyckSegments` from parens-dyck.js | Proven correct, handles all edge cases (scaling, vertex circles, segment animation) |
| Lattice path grid drawing | New grid rendering code | Adapt patterns from lattice-path.js draw() | Proven correct n x n grid with diagonal |
| Binary tree layout | New layout algorithm | Copy `layoutTree`, `preOrderNodes`, `getMaxDepth` from binary-triang.js | Proven correct in-order x layout, already used for bijection animation |
| Polygon vertex computation | New polygon math | Copy `polygonParams` from binary-triang.js | Proven correct (n+2)-gon placement |
| NCP circle layout | New circle point placement | Adapt from non-crossing-partition.js draw() | Proven correct point placement |
| Mountain silhouette rendering | New mountain drawing code | Adapt from mountain-range.js draw() | Proven correct filled area and peak detection |
| Pulse oscillation | Custom timing | `0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI)` | Standard pattern from Phase 3 |
| Correspondence color management | Custom color mapping | `colors[i % colors.length]` from CORRESPONDENCE_COLORS | Standard pattern from Phase 3 |

**Key insight:** Each new bijection module can be built by combining drawing helpers adapted from structure modules and established Phase 3 bijection patterns. The actual new code is the step sequence logic (which elements correspond, in what order to reveal them, what descriptions to show).

## Common Pitfalls

### Pitfall 1: LCRS Correspondence Off-by-One (BIJC-05)

**What goes wrong:** Binary tree node 3 is highlighted but plane tree node 4 glows, or the wrong node entirely.
**Why it happens:** The binary tree has n internal nodes; the rooted plane tree has n+1 nodes (including root). The plane tree root has no corresponding binary tree node. Pre-order traversal indexing must account for this offset.
**How to avoid:** Build the correspondence explicitly by walking the Dyck word once and recording which binary tree node maps to which plane tree node. The binary tree's i-th +1 (0-indexed) creates node i, and in the plane tree, the same +1 creates node i+1 (since index 0 is the root). So binary node i corresponds to plane tree node i+1 in pre-order.
**Warning signs:** At n=1, the single binary tree node should correspond to the single child of the plane tree root, not the root itself.

### Pitfall 2: Mountain Range Peak Colors Not Matching Dyck Path Vertices (BIJC-06)

**What goes wrong:** Mountain peaks have different colors than the corresponding high points on the Dyck path.
**Why it happens:** Mountain range rendering in draw() colors only peaks (local maxima) with correspondence colors, using a separate peak counter. Dyck path rendering colors every vertex. If the bijection drawFrame uses the peak-only coloring scheme for the mountain side but segment-index coloring for the Dyck side, colors won't match.
**How to avoid:** In the bijection drawFrame, color mountain segments by segment index (same as Dyck segments), not by peak index. Each segment i in both panels gets `colors[i]`. Don't use the peak-only coloring from the static draw() function.
**Warning signs:** Mountain has fewer colored elements than the Dyck path.

### Pitfall 3: Lattice Path Direction Confusion (BIJC-04)

**What goes wrong:** The lattice path appears to cross above the diagonal, or the R/U steps go in the wrong direction.
**Why it happens:** Confusion between canvas coordinates (y increases downward) and mathematical coordinates (y increases upward). The lattice path draw() handles this with `toCanvasY(gy) = offsetY + (n - gy) * cellSize`, but a hand-rolled drawFrame might forget the inversion.
**How to avoid:** Copy the coordinate transform functions from lattice-path.js draw() verbatim. Test with n=1 (only one path: R then U, going right then up, staying below diagonal).
**Warning signs:** For the single n=1 Dyck word [+1, -1], the lattice path should go right then up, ending at (1,1).

### Pitfall 4: NCP-Triangulation Color Mismatch (BIJC-07)

**What goes wrong:** NCP block colors don't match the corresponding triangle colors. The viewer can't see the correspondence.
**Why it happens:** NCP elements are numbered 1..n by opening position in the Dyck word. Triangles are enumerated by pre-order traversal of the implicit binary tree. If these orderings don't match, colors diverge.
**How to avoid:** Both orderings ARE the same: the i-th +1 in the Dyck word creates both NCP element i and binary tree node i (pre-order). So use the same color index for NCP element i and triangle i. Verify at n=2 where there are exactly 2 elements and 2 triangles.
**Warning signs:** At n=2, element 1 should have the same color as triangle 1, and element 2 should have the same color as triangle 2, for all C(2)=2 instances.

### Pitfall 5: NCP Block Arcs vs Individual Elements (BIJC-07)

**What goes wrong:** The NCP side colors entire blocks uniformly, but the triangulation side colors individual triangles. Visual correspondence is unclear when a block has multiple elements.
**Why it happens:** NCP structure uses block-level coloring (all elements in block B share one color). But the triangulation has n individual triangles, each needing its own color.
**How to avoid:** For the bijection animation, color NCP elements individually (by element index, not block index). Each element gets its own color matching its corresponding triangle. This differs from the static NCP draw() which colors by block. The drawFrame renders NCP elements with per-element coloring.
**Warning signs:** A 3-element block shows all three elements in the same color, but three triangles show three different colors.

### Pitfall 6: Reversed Bijection Box Swap Forgotten

**What goes wrong:** Playing "Lattice Paths to Dyck Paths" still shows lattice paths on the right panel and Dyck paths on the left.
**Why it happens:** The drawFrame computes `srcBox` and `tgtBox` but forgets to use `reversed` to swap them.
**How to avoid:** Every drawFrame must start with:
```javascript
const srcBox = reversed ? targetBox : sourceBox;
const tgtBox = reversed ? sourceBox : targetBox;
```
This is a per-drawFrame computation captured in the closure, not a per-step computation. The `reversed` flag is captured when `getSteps` is called.
**Warning signs:** Structure labels say "Source: Lattice Paths" but the lattice path draws on the right.

## Code Examples

### BIJC-08: Ballot Sequences to Dyck Paths (simplest new bijection)

```javascript
// bijections/ballot-dyck.js

import * as ballotSequence from '../structures/ballot-sequence.js';
import * as dyckPath from '../structures/dyck-path.js';

export const META = {
  source: 'ballot-sequence',
  target: 'dyck-path',
  label: 'Ballot Sequences to Dyck Paths',
};

export function getSteps(dyckWord, n, reversed = false) {
  const ballot = ballotSequence.fromDyck(dyckWord);
  const path = dyckPath.fromDyck(dyckWord);
  const voteCount = ballot.votes.length; // 2n

  const steps = [];

  // Step 0: Introduction
  steps.push({
    description: reversed
      ? `Start with the Dyck path of ${voteCount} steps`
      : `Start with the ballot sequence: ${ballot.votes.join('')}`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const ballotBox = reversed ? targetBox : sourceBox;
      const pathBox = reversed ? sourceBox : targetBox;
      // Draw full ballot at default color, empty Dyck grid
      drawBallotIntro(ctx, ballot, ballotBox, theme);
      drawDyckGrid(ctx, n, pathBox, theme);
    },
  });

  // Steps 1..2n: One per vote
  for (let i = 0; i < voteCount; i++) {
    const vote = ballot.votes[i];
    const direction = vote === 'A' ? 'up' : 'down';
    steps.push({
      description: reversed
        ? `Step ${voteCount - i}: '${direction}' path step maps to vote '${vote}'`
        : `Vote ${i + 1}: '${vote}' maps to ${direction} step`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const ballotBox = reversed ? targetBox : sourceBox;
        const pathBox = reversed ? sourceBox : targetBox;
        // Three-zone rendering for both panels
        drawBallotWithZones(ctx, ballot, ballotBox, theme, colors, i);
        drawDyckGrid(ctx, n, pathBox, theme);
        drawDyckSegments(ctx, path.points, n, pathBox, theme, colors, i, voteCount, progress);
      },
    });
  }

  // Final step
  steps.push({
    description: reversed
      ? 'Bijection complete: each path step maps to one vote'
      : 'Bijection complete: A-ahead constraint equals path-above-axis constraint',
    drawFrame(ctx, progress, opts) {
      // All elements colored with correspondence
    },
  });

  if (reversed) steps.reverse();
  return steps;
}
```

**Confidence:** HIGH (follows parens-dyck pattern exactly, just different source structure drawing)

### BIJC-05: Binary Trees to Rooted Plane Trees (LCRS correspondence)

```javascript
// bijections/binary-plane-tree.js - Correspondence computation

/**
 * Build correspondence pairs between binary tree nodes and plane tree nodes.
 * Walk the Dyck word simultaneously building both trees, recording
 * which binary node maps to which plane tree node.
 *
 * Binary tree node i (0-indexed, by opening order) corresponds to
 * plane tree node i+1 (0-indexed, root is 0, first child is 1).
 */
function buildCorrespondence(dyckWord) {
  // Walk Dyck word, building both trees in parallel
  // Binary tree: +1 = open node (push), -1 = close node (pop)
  //   First +1 opens root, content inside = left subtree, after matching -1 = right subtree
  // Plane tree: +1 = descend to new child, -1 = backtrack to parent
  //   Root exists before any +1

  // Pre-order collect binary tree nodes
  const binaryNodes = [];
  function collectBinary(node) {
    if (node === null) return;
    binaryNodes.push(node);
    collectBinary(node.left);
    collectBinary(node.right);
  }

  // Pre-order collect plane tree nodes (excluding root)
  const planeNodes = [];
  function collectPlane(node) {
    planeNodes.push(node);
    for (const child of node.children) {
      collectPlane(child);
    }
  }

  return { binaryNodes, planeNodes };
  // binaryNodes[i] corresponds to planeNodes[i+1]
  // (planeNodes[0] is the plane tree root, which has no binary counterpart)
}
```

**Confidence:** HIGH (both trees derive from same Dyck word; pre-order traversal produces matching indices)

### BIJC-04: Dyck Paths to Lattice Paths (coordinate rotation)

```javascript
// bijections/dyck-lattice.js - Key drawing concept

/**
 * The 45-degree rotation correspondence:
 * - Dyck step +1 (up, direction (+1,+1)) maps to Lattice step R (right, direction (+1,0))
 * - Dyck step -1 (down, direction (+1,-1)) maps to Lattice step U (up, direction (0,+1))
 *
 * Geometrically: rotate the Dyck path 45 degrees clockwise and scale.
 * Dyck point (x, y) maps to lattice point ((x+y)/2, (x-y)/2).
 *
 * The animation shows this step by step: each Dyck segment maps to
 * one lattice segment, building both paths simultaneously.
 */

// Step drawing: left panel shows Dyck grid + path segments,
// right panel shows lattice n x n grid + diagonal + path segments.
// Both use segment-index correspondence colors.
```

**Confidence:** HIGH

### Router Registration (router.js modification)

```javascript
// bijections/router.js - Add imports and registrations

import * as dyckLattice from './dyck-lattice.js';
import * as binaryPlaneTree from './binary-plane-tree.js';
import * as dyckMountain from './dyck-mountain.js';
import * as ncpTriang from './ncp-triang.js';
import * as ballotDyck from './ballot-dyck.js';

// After existing registrations:
register(dyckLattice);
register(binaryPlaneTree);
register(dyckMountain);
register(ncpTriang);
register(ballotDyck);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom bijection implementations | Composition through Dyck words | Project design decision | All bijections correct by construction if fromDyck/toDyck are correct |
| Per-bijection drawing infrastructure | Shared pattern (three-zone, pulse, dim) from Phase 3 | Phase 3 implementation | New bijections reuse proven visual patterns |
| Hardcoded bijection pairs | Router with dynamic registration | Phase 3 router.js | Adding a bijection = one import + one register() call |

**Deprecated/outdated:**
- None. All patterns from Phase 3 are current and working.

## Open Questions

1. **NCP-to-Triangulation visual clarity**
   - What we know: The bijection composes through Dyck words. The correspondence is mathematically correct.
   - What's unclear: Whether per-element coloring of NCP (instead of per-block) will look visually clear, since NCP is naturally understood in terms of blocks.
   - Recommendation: Use per-element coloring for the bijection animation (matching triangles), but add block boundary indicators (subtle background shading or bracket notation) so the viewer can still see the block structure. If this proves too cluttered at n=4 (up to 4 elements, up to 4 blocks), simplify to just per-element coloring.

2. **LCRS step descriptions wording**
   - What we know: The LCRS transform has a specific vocabulary: "left child becomes first child, right child becomes next sibling."
   - What's unclear: Whether math students will understand "left-child right-sibling" terminology without prior context.
   - Recommendation: Use plain language in step descriptions: "Node X's left child in the binary tree becomes the first child in the plane tree. Node X's right child becomes a sibling." Include both the formal name and plain explanation.

## Sources

### Primary (HIGH confidence)
- Project codebase: `js/bijections/parens-dyck.js`, `binary-triang.js`, `parens-binary.js` - Three working reference implementations of the bijection module contract
- Project codebase: `js/bijections/router.js` - Bidirectional registration pattern
- Project codebase: `js/structures/*.js` - All 11 structure modules with fromDyck/toDyck/draw
- Project codebase: `js/core/colors.js`, `js/core/easing.js` - Shared utilities
- [Cornell: Catalan Numbers](https://pi.math.cornell.edu/~karola/dimex/catalan.pdf) - Comprehensive Catalan bijection reference
- [Open Math Books: Catalan Numbers](https://discrete.openmathbooks.org/more/mdm/sec_basic-catalan.html) - Visual bijection descriptions

### Secondary (MEDIUM confidence)
- [Wikipedia: Left-child right-sibling binary tree](https://en.wikipedia.org/wiki/Left-child_right-sibling_binary_tree) - LCRS transform description
- [Wikipedia: Noncrossing partition](https://en.wikipedia.org/wiki/Noncrossing_partition) - NCP structure properties
- [Wikipedia: Catalan number](https://en.wikipedia.org/wiki/Catalan_number) - Bijection overview
- [Grokipedia: LCRS Binary Tree](https://grokipedia.com/page/Left-child_right-sibling_binary_tree) - Knuth transform algorithm
- [Berkeley Math Circle: Bijective Proofs and Catalan Numbers](https://mathcircle.berkeley.edu/sites/default/files/handouts/2020/Bijective%20Proofs%20and%20Catalan%20Numbers.pdf) - Educational bijection descriptions

### Tertiary (LOW confidence)
- None. All findings verified against codebase and multiple sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Identical to Phase 3, no new dependencies or APIs
- Architecture: HIGH - All five bijections follow the exact same module contract and router pattern established in Phase 3
- Bijection math: HIGH for BIJC-04, BIJC-06, BIJC-08 (trivial mappings); HIGH for BIJC-05 (well-documented LCRS); MEDIUM for BIJC-07 (composition through Dyck word is correct but visual design needs care)
- Drawing patterns: HIGH - All reuse established three-zone rendering, pulse/glow, dimming from Phase 3
- Pitfalls: HIGH - Based on direct analysis of Phase 3 implementations and known indexing issues

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable domain, native browser APIs, established mathematical bijections)
