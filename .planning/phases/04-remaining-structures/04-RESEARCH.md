# Phase 4: Remaining Structures - Research

**Researched:** 2026-02-23
**Domain:** Seven Catalan structure modules (mountain ranges, lattice paths below diagonal, staircase polygons, rooted plane trees, ballot sequences, non-crossing partitions, stack-sortable permutations) -- toDyck/fromDyck conversions + Canvas rendering
**Confidence:** HIGH

## Summary

Phase 4 adds the remaining 7 of 11 Catalan structures to the app. Each new structure follows the exact same uniform module interface established in Phase 2: `fromDyck(dyckWord)`, `toDyck(instance)`, and `draw(ctx, instance, opts)`. The registry grows from 4 entries to 11, the dropdown selectors automatically populate with all structures, and the existing test harness pattern extends to verify round-trip correctness for all new modules.

The 7 structures vary considerably in rendering complexity. Mountain ranges and ballot sequences are near-trivial reinterpretations of Dyck paths. Lattice paths below diagonal and staircase polygons are straightforward grid-based drawings. Rooted plane trees require a tree layout algorithm with the left-child/right-sibling correspondence to binary trees. Non-crossing partitions require circular arc rendering. Stack-sortable permutations require simulating Knuth's stack-sorting algorithm to establish the Dyck word correspondence, plus rendering both the permutation and a stack visualization.

The mathematical bijections between Dyck words and each structure are well-established in combinatorics literature (Stanley's Enumerative Combinatorics, Exercise 6.19). For n<=4 (max 14 instances, max 8-symbol Dyck words), all algorithms are trivially fast and require no optimization. The primary challenge is getting the bijection conventions right so round-trips pass for all 14 instances at n=4, and ensuring visual renderings are clear on a projector.

**Primary recommendation:** Implement structures in three waves grouped by complexity: (1) near-trivial reinterpretations (mountain ranges, ballot sequences), (2) grid-based structures (lattice paths below diagonal, staircase polygons), and (3) complex structures requiring new algorithms or rendering techniques (rooted plane trees, non-crossing partitions, stack-sortable permutations). Update the registry and test harness incrementally after each wave.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRC-03 | Mountain ranges rendered as mountain-profile curves | Near-identical to Dyck path rendering but drawn as filled mountain silhouette instead of grid path; fromDyck/toDyck are same as Dyck path (identity bijection); see Mountain Ranges section |
| STRC-04 | Lattice paths below diagonal rendered on n x n grid | Monotonic paths on n x n grid using right/up steps; bijection is 45-degree rotation of Dyck path; see Lattice Paths Below Diagonal section |
| STRC-05 | Staircase polygons rendered as staircase-bounded shapes | Staircase outline formed by Dyck path peaks/valleys on grid; same fromDyck data as Dyck path, rendered as filled staircase polygon; see Staircase Polygons section |
| STRC-07 | Rooted plane trees rendered with ordered children layout | Left-child/right-sibling bijection from binary trees; needs multi-child tree layout algorithm; see Rooted Plane Trees section |
| STRC-08 | Ballot sequences rendered as labeled vote sequences | Direct reinterpretation: +1 = vote for A, -1 = vote for B; render as labeled sequence with running tallies; see Ballot Sequences section |
| STRC-09 | Non-crossing partitions rendered on a circle with arcs | Bijection via nesting structure of Dyck word matching pairs; render points on circle with colored arcs connecting partition blocks; see Non-Crossing Partitions section |
| STRC-11 | Stack-sortable permutations rendered with stack visualization | Knuth's stack-sort algorithm maps push/pop sequence to Dyck word; render permutation plus stack state diagram; see Stack-Sortable Permutations section |
</phase_requirements>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| HTML5 Canvas 2D | Baseline | All structure rendering | Same as Phase 2; immediate-mode drawing; `ctx.arc()` for circle arcs, `ctx.fill()` for mountain silhouettes |
| Vanilla JS (ES2022+ modules) | Current | All logic | Zero-dependency constraint; same module pattern as existing structures |
| CSS3 with custom properties | Current | Theme values | Theme contract unchanged from Phase 1 |

### Supporting

| API | Purpose | When to Use |
|-----|---------|-------------|
| `ctx.arc()` | Drawing circular arcs for non-crossing partitions | Arcs connecting partition block members on a circle |
| `ctx.quadraticCurveTo()` | Smooth mountain range curves | Alternative to straight-line mountain profiles for visual polish |
| `ctx.fill()` + `ctx.clip()` | Filled regions for mountains and staircase polygons | Filled silhouettes instead of outlines |
| `ctx.setLineDash()` | Dashed grid lines | Distinguishing grid from structure lines (established pattern) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Straight-line mountain segments | Bezier curves for smooth mountains | Straight lines are mathematically precise and simpler; curves are prettier but obscure the lattice structure. Use straight lines. |
| Circular arc rendering for non-crossing partitions | SVG overlays for arcs | Canvas-only approach maintains zero-dependency constraint and keeps all rendering in one pipeline |
| Full Reingold-Tilford for plane trees | Simple recursive layout with width accumulation | At n<=4 (max 5 nodes for rooted plane trees of order n, since C_n counts trees with n+1 nodes), simple recursive layout suffices |

**Installation:**
```bash
# No installation. Same as Phase 1:
python3 -m http.server 8080
```

## Architecture Patterns

### Recommended Project Structure (Phase 4 additions)

```
js/structures/
  mountain-range.js       # STRC-03: mountain profile curves
  lattice-path.js         # STRC-04: monotonic paths below diagonal
  staircase-polygon.js    # STRC-05: staircase-bounded shapes
  rooted-plane-tree.js    # STRC-07: ordered children tree layout
  ballot-sequence.js      # STRC-08: labeled vote sequences
  non-crossing-partition.js # STRC-09: circular arc partitions
  stack-sortable-perm.js  # STRC-11: stack visualization
  registry.js             # Updated: 4 -> 11 entries
tests/
  test-structures.html    # Updated: verify all 11 structures
```

### Pattern 1: Uniform Structure Module Interface (Unchanged)

**What:** Every structure module exports exactly `{ fromDyck, toDyck, draw }`.
**When to use:** Every new structure module.

```javascript
/**
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {*} Structure-specific instance object
 */
export function fromDyck(dyckWord) { /* ... */ }

/**
 * @param {*} instance - Structure-specific instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) { /* ... */ }

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) { /* ... */ }
```

**Confidence:** HIGH (proven pattern from Phase 2; 4 modules already implement it)

### Pattern 2: Registry Extension

**What:** Import new modules and add entries to the frozen registry object.
**When to use:** After each wave of new structure modules is complete.

```javascript
// registry.js -- Phase 4 additions
import * as mountainRange from './mountain-range.js';
import * as latticePath from './lattice-path.js';
import * as staircasePolygon from './staircase-polygon.js';
import * as rootedPlaneTree from './rooted-plane-tree.js';
import * as ballotSequence from './ballot-sequence.js';
import * as nonCrossingPartition from './non-crossing-partition.js';
import * as stackSortablePerm from './stack-sortable-perm.js';

export const structures = Object.freeze({
  // Existing 4 structures (unchanged)
  'parentheses':            { module: parentheses,          label: 'Balanced Parentheses' },
  'dyck-path':              { module: dyckPath,             label: 'Dyck Paths' },
  'binary-tree':            { module: binaryTree,           label: 'Binary Trees' },
  'triangulation':          { module: triangulation,        label: 'Triangulations' },
  // 7 new structures
  'mountain-range':         { module: mountainRange,        label: 'Mountain Ranges' },
  'lattice-path':           { module: latticePath,          label: 'Lattice Paths' },
  'staircase-polygon':      { module: staircasePolygon,     label: 'Staircase Polygons' },
  'rooted-plane-tree':      { module: rootedPlaneTree,      label: 'Rooted Plane Trees' },
  'ballot-sequence':        { module: ballotSequence,       label: 'Ballot Sequences' },
  'non-crossing-partition': { module: nonCrossingPartition, label: 'Non-crossing Partitions' },
  'stack-sortable-perm':    { module: stackSortablePerm,    label: 'Stack-sortable Permutations' },
});
```

**Confidence:** HIGH (direct extension of existing pattern)

### Pattern 3: Test Harness Extension

**What:** Add new modules to the existing `test-structures.html` round-trip verification.
**When to use:** After adding each wave of structures to the registry.

The test harness already iterates over a `structureModules` array and tests `toDyck(fromDyck(word))` for all `enumerate(n)` words at n=1..4. Adding new structures means extending that array. Total round-trips will increase from 88 (4 x 22) to 242 (11 x 22).

**Confidence:** HIGH (existing pattern, just more entries)

### Anti-Patterns to Avoid

- **Importing between structure modules:** Structure modules must remain independent (no `import from './binary-tree.js'`). If rooted-plane-tree.js needs a tree builder from a Dyck word, implement it locally (same pattern as triangulation.js which has its own `buildTree` function).
- **Inconsistent Dyck word conventions:** All modules must use the same +1/-1 convention. Mountain ranges and ballot sequences are trivial reinterpretations, but the bijection direction must match: `fromDyck` takes +1/-1 arrays, `toDyck` returns +1/-1 arrays.
- **Overcomplicating rendering for n<=4:** At maximum n=4, structures have at most 14 instances and contain at most 8 elements. Simple algorithms suffice. Do not implement sophisticated layout optimizations.
- **Circular dependency through registry:** New modules must not import from `registry.js`. The registry imports modules, never the reverse.

## Structure-Specific Research

### STRC-03: Mountain Ranges

**Mathematical definition:** Mountain ranges are visually identical to Dyck paths -- a sequence of upstrokes and downstrokes that never go below the baseline. The difference is purely visual: Dyck paths are drawn as lattice paths on a grid, while mountain ranges are drawn as a filled mountain silhouette profile.

**Bijection to Dyck words:** Identity. The Dyck word IS the mountain range. +1 = upstroke, -1 = downstroke.

**Instance representation:** `{ points: Array<{x, y}> }` -- identical to Dyck path.

**fromDyck / toDyck:** Identical to `dyck-path.js`. The difference is entirely in `draw()`.

**Rendering approach:**
- Compute the same (x, y) point sequence as Dyck path
- Draw the path as a line, then close the path back to the baseline and fill with semi-transparent color
- No grid lines (this is a mountain silhouette, not a lattice)
- Color individual mountain "peaks" (local maxima) with correspondence colors
- Draw the baseline (y=0) as a thin line

**Confidence:** HIGH (trivial reinterpretation of Dyck path)

### STRC-04: Lattice Paths Below Diagonal

**Mathematical definition:** C_n counts the number of monotonic lattice paths from (0,0) to (n,n) on an n x n grid that do not pass above the diagonal y = x. Each path consists of exactly n right steps (R) and n up steps (U), and at every point on the path, the number of right steps taken so far is >= the number of up steps taken so far.

**Bijection to Dyck words:** The bijection is a 45-degree rotation/reinterpretation. In a Dyck word of length 2n: +1 maps to a right step (R), -1 maps to an up step (U). The constraint that prefix sums stay >= 0 ensures the path never crosses above the diagonal. This is the standard bijection between Dyck paths and monotonic lattice paths.

**Instance representation:** `{ n: number, steps: Array<'R'|'U'>, points: Array<{x, y}> }`

**fromDyck:**
```javascript
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const steps = dyckWord.map(s => s === 1 ? 'R' : 'U');
  const points = [{ x: 0, y: 0 }];
  let cx = 0, cy = 0;
  for (const s of steps) {
    if (s === 'R') cx++; else cy++;
    points.push({ x: cx, y: cy });
  }
  return { n, steps, points };
}
```

**toDyck:**
```javascript
export function toDyck(instance) {
  return instance.steps.map(s => s === 'R' ? 1 : -1);
}
```

**Rendering approach:**
- Draw n x n grid with light grid lines
- Draw the diagonal y = x as a dashed or colored line (the "boundary")
- Draw the monotonic path from (0,0) to (n,n) with thick strokes
- Color each step segment with correspondence colors
- Draw vertex dots at grid intersections on the path

**Confidence:** HIGH (standard bijection, well-documented in multiple sources)

### STRC-05: Staircase Polygons

**Mathematical definition:** A staircase polygon (also called a "staircase shape" or "parallelogram polyomino") associated with a Dyck path is the region bounded by the path on top and the x-axis on the bottom, forming a staircase-like shape. For a Dyck word of order n, the polygon is formed by the columns under each peak of the Dyck path.

**Bijection to Dyck words:** Identity (same underlying data as the Dyck path). The staircase polygon is the area under the Dyck path curve, visualized as a filled region of unit squares.

**Instance representation:** `{ n: number, columns: Array<{x, height}> }` where each column represents the stack of unit squares at position x.

**fromDyck:**
```javascript
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  // Compute height at each x position (prefix sums)
  const heights = [];
  let h = 0;
  for (let i = 0; i < dyckWord.length; i++) {
    if (dyckWord[i] === 1) h++;
    heights.push(h);
    if (dyckWord[i] === -1) h--;
  }
  // Build columns: at each x-position (0..2n-1), the column height
  // is the minimum of the heights at position x and x+1
  // Actually: the staircase polygon has a column at each step,
  // with height equal to the running Dyck path height after that step
  const columns = [];
  let currentH = 0;
  for (let i = 0; i < dyckWord.length; i++) {
    currentH += dyckWord[i];
    columns.push({ x: i, height: currentH });
  }
  return { n, columns, dyckWord: [...dyckWord] };
}
```

**toDyck:**
```javascript
export function toDyck(instance) {
  return [...instance.dyckWord];
}
```

**Rendering approach:**
- Draw on a grid similar to the Dyck path
- For each column position, fill the unit squares from y=0 up to the Dyck path height at that position
- Use semi-transparent fill colors for the columns
- Draw the staircase outline with thick strokes
- The top boundary of the filled region traces the Dyck path

**Note on round-trip:** Since the instance stores the dyckWord directly, the round-trip is trivially correct. This is the same approach used by parentheses (which stores the string directly).

**Confidence:** MEDIUM -- the exact definition of "staircase polygon" varies across sources. The Delest-Viennot definition uses peak/valley heights. The simpler interpretation (area under Dyck path as unit squares) is more visually clear for a presentation. Use the simpler interpretation.

### STRC-07: Rooted Plane Trees

**Mathematical definition:** A rooted plane tree (also called an ordered tree or planted plane tree) is a rooted tree where the children of each node have a specified left-to-right order. C_n counts the number of rooted plane trees with n+1 nodes (equivalently, n edges).

**Bijection to Dyck words (via DFS traversal):** Walk the tree in depth-first order. When you descend to a child, write +1. When you backtrack to the parent, write -1. This produces a Dyck word of length 2n for a tree with n edges (n+1 nodes). The reverse: read the Dyck word left to right, starting at the root. For each +1, create a new child of the current node and move to it. For each -1, move back to the parent.

**Alternative bijection (via binary trees):** The left-child/right-sibling (LCRS) correspondence maps rooted plane trees to binary trees bijectively. Given a rooted plane tree, the first child of a node becomes its left child in the binary tree, and the next sibling becomes its right child. This is the bijection described in BIJC-05 (Phase 5), but for Phase 4 we use the direct DFS bijection since it is simpler and avoids coupling to the binary tree module.

**Instance representation:** `{ children: Array<TreeNode> }` where each TreeNode is `{ children: Array<TreeNode> }`. The root is the instance itself.

**fromDyck:**
```javascript
export function fromDyck(dyckWord) {
  // DFS reconstruction: read Dyck word left to right
  // +1 = create child and descend, -1 = ascend to parent
  const root = { children: [] };
  let current = root;
  const stack = []; // parent stack for backtracking
  for (const step of dyckWord) {
    if (step === 1) {
      const child = { children: [] };
      current.children.push(child);
      stack.push(current);
      current = child;
    } else {
      current = stack.pop();
    }
  }
  return root;
}
```

**toDyck:**
```javascript
export function toDyck(instance) {
  // DFS serialization: descend = +1, backtrack = -1
  const word = [];
  function dfs(node) {
    for (const child of node.children) {
      word.push(1);
      dfs(child);
      word.push(-1);
    }
  }
  dfs(instance);
  return word;
}
```

**Rendering approach:**
- Use a recursive layout algorithm:
  - Leaf nodes get width 1
  - Internal nodes get width = sum of children widths
  - Each node is centered horizontally over its children
  - Depth determines y-position
- Draw edges from parent to children
- Draw nodes as filled circles with correspondence colors
- Handle degenerate cases (linear chain = all nodes have 1 child) by ensuring spacing

**Key concern (from success criteria #4):** "Tree layouts (rooted plane trees) avoid node collisions for all 14 instances at n=4, including degenerate linear chains." At n=4, the Dyck word has length 8, so there are 4 edges and 5 nodes. The degenerate linear chain has depth 4 and width 1. The widest tree (root with 4 children) has depth 1 and width 4. The layout must handle both extremes without collisions.

**Layout algorithm:**
```javascript
function layoutPlaneTree(node, depth, xOffset) {
  // Compute subtree width
  if (node.children.length === 0) {
    node.layoutX = xOffset;
    node.layoutY = depth;
    return 1; // leaf width
  }
  let totalWidth = 0;
  for (const child of node.children) {
    const childWidth = layoutPlaneTree(child, depth + 1, xOffset + totalWidth);
    totalWidth += childWidth;
  }
  // Center parent over children
  const firstChildX = node.children[0].layoutX;
  const lastChildX = node.children[node.children.length - 1].layoutX;
  node.layoutX = (firstChildX + lastChildX) / 2;
  node.layoutY = depth;
  return totalWidth;
}
```

**Confidence:** HIGH (DFS bijection is well-established; layout algorithm is simple recursive centering)

### STRC-08: Ballot Sequences

**Mathematical definition:** A ballot sequence of length 2n records a sequence of votes between two candidates A and B, where candidate A always has at least as many votes as B at every prefix. There are exactly n votes for A and n for B. C_n counts the number of such sequences.

**Bijection to Dyck words:** Direct mapping. +1 = vote for A, -1 = vote for B. The Dyck word constraint (prefix sums >= 0) is exactly the ballot constraint (A always ahead or tied).

**Instance representation:** `{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }`

**fromDyck:**
```javascript
export function fromDyck(dyckWord) {
  const votes = dyckWord.map(s => s === 1 ? 'A' : 'B');
  const tallies = [];
  let a = 0, b = 0;
  for (const v of votes) {
    if (v === 'A') a++; else b++;
    tallies.push({ a, b });
  }
  return { votes, tallies };
}
```

**toDyck:**
```javascript
export function toDyck(instance) {
  return instance.votes.map(v => v === 'A' ? 1 : -1);
}
```

**Rendering approach:**
- Display the vote sequence as a row of labeled boxes: "A", "B", "A", "A", "B", "B"
- Below or beside each box, show the running tally: "A:1 B:0", "A:1 B:1", etc.
- Color each vote with correspondence colors
- Optionally draw a small bar chart showing the running A vs B count
- Font-based rendering similar to parentheses module

**Confidence:** HIGH (trivial reinterpretation of Dyck word, rendering is straightforward text/box layout)

### STRC-09: Non-Crossing Partitions

**Mathematical definition:** A non-crossing partition of the set {1, 2, ..., n} is a partition of that set into blocks such that if a < b < c < d and a, c are in the same block and b, d are in the same block, then those two blocks must be the same block. Visually: place points 1..n around a circle; connect members of the same block with arcs; no arcs cross. C_n counts the non-crossing partitions of {1, ..., n}.

**IMPORTANT NOTE on indexing:** C_n counts non-crossing partitions of {1, ..., n}, but a Dyck word of order n has length 2n. This means from a Dyck word of order n, we produce a non-crossing partition of {1, ..., n}. Each matched pair in the Dyck word corresponds to one element in the partition. Elements in the same block are those whose matching pairs are nested.

**Bijection to Dyck words:** The standard bijection uses the matching-parenthesis structure:

1. In a Dyck word of length 2n, find all n matched pairs: pair i is the i-th opening +1 and its matching -1 (by nesting depth).
2. Number the pairs 1..n in order of their opening position (left to right).
3. Two elements i and j are in the same block if their corresponding pairs are directly nested (one immediately contains the other with no intervening pairs).

More precisely, the algorithm from SageMath documentation:
- Parse the Dyck word left to right, tracking position
- Use a stack to match opening/closing positions
- Number matched pairs by opening order
- Build partition blocks based on nesting adjacency

**fromDyck (matching-pair algorithm):**
```javascript
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  // Step 1: Find matched pairs using a stack
  // pairs[i] = { open: position, close: position } for the i-th pair
  const stack = [];
  const pairs = [];
  const positionToPair = {};
  for (let i = 0; i < dyckWord.length; i++) {
    if (dyckWord[i] === 1) {
      stack.push(i);
    } else {
      const openPos = stack.pop();
      const pairIndex = pairs.length;
      pairs.push({ open: openPos, close: i });
      positionToPair[openPos] = pairIndex;
      positionToPair[i] = pairIndex;
    }
  }
  // Step 2: Sort pairs by opening position (they naturally are in order)
  // pairs[k] corresponds to element k+1 in the partition

  // Step 3: Build blocks based on nesting
  // Two elements are in the same block if one pair immediately contains the other
  // "Immediately contains" means no other pair boundary between them
  const blocks = [];
  const elementToBlock = new Array(n).fill(-1);
  // Use a stack-based approach: track which block is "current"
  const blockStack = [];
  let pairIdx = 0;
  for (let i = 0; i < dyckWord.length; i++) {
    if (dyckWord[i] === 1) {
      // Opening: this pair's element starts
      const elem = pairIdx; // 0-indexed element
      if (blockStack.length > 0) {
        // Nested inside current block's pair - same block
        const parentBlock = blockStack[blockStack.length - 1];
        blocks[parentBlock].push(elem);
        elementToBlock[elem] = parentBlock;
      } else {
        // New top-level block
        const newBlock = blocks.length;
        blocks.push([elem]);
        elementToBlock[elem] = newBlock;
      }
      blockStack.push(elementToBlock[elem]);
      pairIdx++;
    } else {
      // Closing: pop from block stack
      blockStack.pop();
    }
  }
  // Convert to 1-indexed blocks
  const partition = blocks.map(b => b.map(e => e + 1));
  return { n, partition };
}
```

**IMPORTANT CORRECTION:** The above algorithm needs careful testing. The standard non-crossing partition bijection from Dyck words is: elements that are "siblings" at the same nesting depth belong to the same block, NOT elements that are nested. Let me provide the correct algorithm:

**Correct fromDyck (Kreweras-style bijection):**
```javascript
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  // Track nesting using a stack of block IDs
  // When we see +1: assign this element to the same block as the
  //   previous +1 at the same depth (if any), or start a new block
  // When we see -1: pop depth
  const partition = [];
  const depthToBlock = {}; // depth -> current block index at this depth
  const blockStack = []; // stack tracking current depth's block
  let elemIndex = 0;

  for (let i = 0; i < dyckWord.length; i++) {
    if (dyckWord[i] === 1) {
      const depth = blockStack.length;
      if (depth in depthToBlock) {
        // Same depth as a previous element -> same block
        partition[depthToBlock[depth]].push(elemIndex + 1);
      } else {
        // New depth -> new block
        depthToBlock[depth] = partition.length;
        partition.push([elemIndex + 1]);
      }
      blockStack.push(depth);
      elemIndex++;
    } else {
      const depth = blockStack.pop();
      // When we close a depth, remove its mapping so the next
      // element at this depth starts a new block
      // (Actually, we should NOT delete -- elements at the same
      // depth in sequence should be in the same block)
      // This depends on the exact bijection convention
    }
  }
  return { n, partition };
}
```

**RESEARCH NOTE:** The exact non-crossing partition bijection from Dyck words has multiple valid conventions (Kreweras, Biane, Simion-Ullman). The correct one for this project needs to be determined during implementation by testing all 14 instances at n=4 against known non-crossing partition counts. The key verification: `fromDyck` must produce exactly the right number of distinct partitions, and `toDyck(fromDyck(w))` must round-trip for all words.

**Recommended implementation approach:** Use the "matching pairs as partition elements, nesting determines blocks" convention:
1. Find all n matched pairs in the Dyck word (using a stack)
2. Number them 1..n by order of their opening position
3. Two elements i, j are in the same block if and only if their matched pairs are "siblings" -- they are at the same nesting depth within the same enclosing pair (or both at the top level)

**toDyck (from partition):**
```javascript
export function toDyck(instance) {
  // Reconstruct Dyck word from non-crossing partition
  // Sort blocks, then build word by opening/closing pairs
  // according to block nesting structure
  const { n, partition } = instance;
  // Build tree of blocks based on nesting
  // Then DFS to produce Dyck word
  // ... (implementation depends on chosen convention)
}
```

**Rendering approach:**
- Draw n points evenly spaced around a circle (numbered 1..n)
- For each partition block, draw arcs connecting the elements in that block
- Color each block with a different correspondence color
- Draw point labels outside the circle
- Arcs should be drawn inside the circle (chords or curved arcs)

**Confidence:** MEDIUM -- the bijection algorithm has multiple valid conventions and needs careful implementation/testing. The rendering is straightforward once the partition is computed.

### STRC-11: Stack-Sortable Permutations

**Mathematical definition:** A stack-sortable permutation of {1, ..., n} is a permutation that can be sorted using a single stack (Knuth, 1968). These are exactly the 231-avoiding permutations. C_n counts them.

**Bijection to Dyck words (Knuth's algorithm):** Simulate the stack-sorting process on the permutation. Record each push as +1 and each pop as -1. The resulting sequence is a Dyck word.

**Algorithm (permutation to Dyck word):**
```
Input: permutation p of {1, ..., n}
Output: Dyck word of length 2n

Initialize: empty stack S, next_output = 1, word = []
For each element x in p (left to right):
  word.push(+1)      // push x onto stack
  Push x onto S
  While S is non-empty and top(S) == next_output:
    Pop S
    word.push(-1)     // pop from stack
    next_output++
// After processing all input, pop remaining elements
While S is non-empty:
  Pop S
  word.push(-1)
  next_output++
Return word
```

**Algorithm (Dyck word to permutation):**
```
Input: Dyck word of length 2n
Output: permutation of {1, ..., n}

Initialize: input_index = 1, output = [], stack S = []
For each step in dyckWord:
  If step == +1:
    Push input_index onto S
    input_index++
  If step == -1:
    Pop top of S and append to output
Return output
```

**Instance representation:** `{ perm: number[], n: number }`

**fromDyck:**
```javascript
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const perm = [];
  const stack = [];
  let inputIdx = 1;
  for (const step of dyckWord) {
    if (step === 1) {
      stack.push(inputIdx);
      inputIdx++;
    } else {
      perm.push(stack.pop());
    }
  }
  return { perm, n };
}
```

**toDyck:**
```javascript
export function toDyck(instance) {
  const { perm, n } = instance;
  const word = [];
  const stack = [];
  let nextOutput = 1;
  let permIdx = 0;
  // Simulate stack sort
  while (permIdx < n || stack.length > 0) {
    // Pop if stack top matches next expected output
    if (stack.length > 0 && stack[stack.length - 1] === nextOutput) {
      stack.pop();
      word.push(-1);
      nextOutput++;
    } else if (permIdx < n) {
      // Push next input element
      stack.push(perm[permIdx]);
      word.push(1);
      permIdx++;
    } else {
      // Remaining pops
      stack.pop();
      word.push(-1);
      nextOutput++;
    }
  }
  return word;
}
```

**Rendering approach:**
- Display the permutation as a row of numbered boxes: [2, 1, 3, 4]
- Below, show a visual stack (vertical column of boxes) with current state
- Optionally show the input/output queues alongside the stack
- Color each element with correspondence colors
- For static display (no animation), just show the permutation sequence
- Stack visualization is a bonus that makes the structure more interesting

**IMPORTANT for round-trip testing:** The `toDyck` function must simulate the exact same stack-sorting process that the `fromDyck` reverses. The push/pop sequence must be deterministic: always pop when possible (greedy popping), only push when pop is not possible.

**Confidence:** HIGH (Knuth's algorithm is well-defined and deterministic; the bijection is standard)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tree layout for rooted plane trees | Full Reingold-Tilford algorithm | Simple recursive width-accumulation layout | Max 5 nodes at n=4; simple centering works |
| Circular point placement for non-crossing partitions | Manual angle calculations | Same `cos/sin` circle formula as triangulation.js | Already proven in triangulation rendering |
| Stack-sorting simulation | Optimize for large n | Naive O(n^2) simulation with array-as-stack | n <= 4 means max 4 elements; performance is irrelevant |
| Arc drawing for non-crossing partitions | Custom Bezier computation | `ctx.arc()` with computed center and angles, or simple quadraticCurveTo chords | Canvas arc primitives handle the geometry |
| Mountain range fill | Custom polygon clipping | `ctx.lineTo` to trace path, then `ctx.lineTo` back along baseline, `ctx.fill()` | Standard Canvas fill-under-curve technique |

**Key insight:** At n<=4, all data structures contain at most 8 elements, 5 tree nodes, or 4 stack operations. Every algorithm is trivially fast. Correctness matters far more than performance.

## Common Pitfalls

### Pitfall 1: Non-Crossing Partition Bijection Convention Mismatch

**What goes wrong:** `toDyck(fromDyck(word))` fails for some Dyck words because `fromDyck` and `toDyck` use different conventions for mapping matched pairs to partition elements.
**Why it happens:** Multiple valid bijections exist between Dyck words and non-crossing partitions (Kreweras, Biane, Simion-Ullman). Mixing conventions breaks round-trips.
**How to avoid:** Pick ONE convention, implement both directions using the same convention, and test all 14 instances at n=4 before moving on. The simplest convention: matched pairs numbered by opening position, siblings at same depth form blocks.
**Warning signs:** Round-trip failures only for certain Dyck words. Partition block counts not matching expected values.

### Pitfall 2: Stack-Sortable Permutation Pop Timing

**What goes wrong:** `toDyck` produces an incorrect Dyck word because pops happen at the wrong time in the simulation.
**Why it happens:** The stack-sorting algorithm must use "greedy popping" -- pop whenever the stack top equals the next expected output value. If the algorithm only tries to pop once per input element (instead of in a while loop), it misses consecutive pops.
**How to avoid:** Use a `while` loop for popping, not an `if`. After each push AND at the end of input, check repeatedly if the stack top matches `nextOutput`.
**Warning signs:** `toDyck` produces a word of wrong length. Round-trip fails for permutations with consecutive values.

### Pitfall 3: Rooted Plane Tree Node Collisions

**What goes wrong:** Nodes overlap for degenerate tree shapes (linear chains, star graphs).
**Why it happens:** A naive layout assigns fixed spacing between children without accounting for subtree widths.
**How to avoid:** Use the width-accumulation layout: each subtree computes its total width (leaf = 1), children are placed side by side using accumulated widths, parent centers over children. Scale final coordinates to fit bounding box.
**Warning signs:** Two nodes at the same (x, y) position. Edges crossing through unrelated nodes.

### Pitfall 4: Staircase Polygon Definition Ambiguity

**What goes wrong:** The staircase polygon rendering looks wrong because the definition used doesn't match what the presenter expects.
**Why it happens:** "Staircase polygon" has multiple definitions in combinatorics literature. The Delest-Viennot definition uses column heights from peaks/valleys. A simpler definition treats it as the filled area under the Dyck path.
**How to avoid:** Use the simple definition: the staircase polygon is the region of unit squares under the Dyck path. Each column at x-position i has height equal to the Dyck path height at that position. This is visually clear and matches the intuitive notion of a "staircase shape."
**Warning signs:** The rendering doesn't look like a staircase. Verify against hand-drawn examples for the 5 instances at n=3.

### Pitfall 5: Lattice Path Axis Convention

**What goes wrong:** The lattice path goes above the diagonal instead of below it, or the diagonal is drawn incorrectly.
**Why it happens:** Confusion between "path below diagonal" (right/up steps, path stays below y=x) and "path above diagonal." Also, Canvas y-axis is inverted (y increases downward) which flips the visual.
**How to avoid:** Use the convention: +1 = right step (x+1, y), -1 = up step (x, y+1). The path stays in the region where x >= y at all points. Draw the diagonal from (0,0) to (n,n) in Canvas coordinates, remembering to flip y.
**Warning signs:** The path crosses the diagonal line. Verify with the trivial case n=1: the only path is R, U which goes right then up, staying on or below y=x.

### Pitfall 6: Mountain Range Fill Clipping

**What goes wrong:** The mountain range fill extends below the baseline or above the mountains, creating visual artifacts.
**Why it happens:** The fill path is not properly closed. After tracing the mountain profile, the path must return along the baseline to create a closed region.
**How to avoid:** After drawing the mountain profile with `lineTo`, add `lineTo(endX, baselineY)` and `lineTo(startX, baselineY)`, then `closePath()` and `fill()`. Draw the outline stroke separately from the fill.
**Warning signs:** Color bleeding outside the mountain silhouette. Gaps between mountains and baseline.

## Code Examples

### Mountain Range: draw() with filled silhouette

```javascript
// Source: Canvas fill-under-curve pattern
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { points } = instance;
  if (points.length <= 1) return;

  const n = (points.length - 1) / 2;
  const padding = 20;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;
  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return x + padding + gx * scaleX; }
  function toCanvasY(gy) { return y + padding + (n - gy) * scaleY; }
  const baseY = toCanvasY(0);

  // Fill mountain silhouette
  ctx.fillStyle = colors[0] + '30'; // Semi-transparent
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.lineTo(toCanvasX(points[points.length - 1].x), baseY);
  ctx.lineTo(toCanvasX(points[0].x), baseY);
  ctx.closePath();
  ctx.fill();

  // Draw mountain outline
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.stroke();

  // Baseline
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), baseY);
  ctx.lineTo(toCanvasX(2 * n), baseY);
  ctx.stroke();

  // Color peaks
  for (let i = 1; i < points.length - 1; i++) {
    if (points[i].y > points[i-1].y && points[i].y > points[i+1].y) {
      ctx.fillStyle = colors[(i - 1) % colors.length];
      ctx.beginPath();
      ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

### Non-Crossing Partition: Circular arc rendering

```javascript
// Source: Canvas arc API (MDN)
function drawPartitionArcs(ctx, cx, cy, radius, partition, n, colors) {
  // Place n points evenly around circle
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    points.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
    });
  }

  // Draw arcs for each block
  for (let b = 0; b < partition.length; b++) {
    const block = partition[b];
    if (block.length < 2) continue;

    ctx.strokeStyle = colors[b % colors.length];
    ctx.lineWidth = 3;

    // Connect consecutive pairs within the block with arcs
    for (let i = 0; i < block.length; i++) {
      for (let j = i + 1; j < block.length; j++) {
        const p1 = points[block[i] - 1]; // 1-indexed to 0-indexed
        const p2 = points[block[j] - 1];
        // Draw chord (straight line inside circle)
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        // Use quadratic curve for visual appeal
        ctx.quadraticCurveTo(cx, cy, p2.px, p2.py);
        ctx.stroke();
      }
    }
  }

  // Draw points and labels
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(points[i].px, points[i].py, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

### Stack-Sortable Permutation: fromDyck and toDyck (complete)

```javascript
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const perm = [];
  const stack = [];
  let inputIdx = 1;
  for (const step of dyckWord) {
    if (step === 1) {
      stack.push(inputIdx);
      inputIdx++;
    } else {
      perm.push(stack.pop());
    }
  }
  return { perm, n };
}

export function toDyck(instance) {
  const { perm, n } = instance;
  const word = [];
  const stack = [];
  let nextOutput = 1;
  let permIdx = 0;
  while (permIdx < n || stack.length > 0) {
    if (stack.length > 0 && stack[stack.length - 1] === nextOutput) {
      stack.pop();
      word.push(-1);
      nextOutput++;
    } else if (permIdx < n) {
      stack.push(perm[permIdx]);
      word.push(1);
      permIdx++;
    } else {
      stack.pop();
      word.push(-1);
      nextOutput++;
    }
  }
  return word;
}
```

### Rooted Plane Tree: Width-accumulation layout

```javascript
function layoutPlaneTree(node, depth, xOffset) {
  if (node.children.length === 0) {
    node.layoutX = xOffset + 0.5; // center in unit width
    node.layoutY = depth;
    return 1; // leaf occupies 1 unit of width
  }
  let totalWidth = 0;
  for (const child of node.children) {
    const w = layoutPlaneTree(child, depth + 1, xOffset + totalWidth);
    totalWidth += w;
  }
  // Center over children
  const first = node.children[0].layoutX;
  const last = node.children[node.children.length - 1].layoutX;
  node.layoutX = (first + last) / 2;
  node.layoutY = depth;
  return totalWidth;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Complex bijection algorithms for large n | Simple recursive algorithms for n<=4 | Project constraint | No need for optimized algorithms; clarity > performance |
| Multiple bijection conventions | Single convention per structure | Project decision | Pick one, verify round-trips, document choice |
| SVG for circular visualizations | Canvas 2D with arc primitives | Phase 1 decision | Consistent rendering pipeline |

**Deprecated/outdated:**
- None specific to this phase. All Canvas 2D APIs used are baseline (stable since 2012+).

## Open Questions

1. **Non-crossing partition bijection convention**
   - What we know: Multiple valid bijections exist (Kreweras, Biane, Simion-Ullman). SageMath implements at least one.
   - What's unclear: Which convention produces the most visually intuitive partitions for the presentation.
   - Recommendation: Implement using the "matched pairs as elements, nesting determines blocks" approach. Test all 14 instances at n=4. If the visual results are confusing, try an alternative convention. The round-trip test is the ultimate arbiter of correctness.

2. **Staircase polygon visual interpretation**
   - What we know: The term "staircase polygon" has multiple definitions in combinatorics literature.
   - What's unclear: Whether the presenter expects the Delest-Viennot column-height interpretation or the simpler "filled area under Dyck path" interpretation.
   - Recommendation: Use the "filled area under Dyck path" interpretation as the default. This is more visually intuitive and directly relates to the Dyck path structure. The rendering should clearly show a staircase outline.

3. **Stack-sortable permutation rendering: permutation only vs. full stack diagram**
   - What we know: STRC-11 says "rendered with stack visualization."
   - What's unclear: How detailed the stack visualization should be in static mode (no animation). A full step-by-step stack trace would be complex to render in a single static frame.
   - Recommendation: Render the permutation prominently (row of numbered boxes) with a small icon/label indicating it's stack-sortable. The full stack visualization is better suited for the bijection animation in Phase 5. For Phase 4, focus on clear permutation rendering with correct fromDyck/toDyck.

## Sources

### Primary (HIGH confidence)
- SageMath Dyck Word documentation - https://doc.sagemath.org/html/en/reference/combinat/sage/combinat/dyck_word.html (bijection algorithms, non-crossing partition API, binary tree mappings)
- MDN Canvas 2D API - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D (arc, quadraticCurveTo, fill, lineTo methods)
- Existing codebase `js/structures/*.js` - (uniform module interface, rendering patterns, Dyck word conventions)
- Existing `tests/test-structures.html` - (round-trip verification harness pattern)

### Secondary (MEDIUM confidence)
- Robert Dickau, Non-crossing Partitions - https://www.robertdickau.com/noncrossingpartitions.html (definition, Catalan number connection, visual representation)
- HandWiki, Stack-sortable permutation - https://handwiki.org/wiki/Stack-sortable_permutation (Knuth's algorithm, push/pop to Dyck word mapping)
- Whitman College, Catalan Numbers - https://www.whitman.edu/mathematics/cgt_online/book/section03.05.html (left-child/right-sibling bijection for rooted plane trees)
- Tom Davis, Catalan Numbers - https://mathcircle.berkeley.edu/sites/default/files/BMC6/pdf0607/catalan.pdf (overview of Catalan structure bijections)
- Cornell, Catalan Numbers - https://pi.math.cornell.edu/~karola/dimex/catalan.pdf (staircase polygon definition via Delest-Viennot)

### Tertiary (LOW confidence)
- WebSearch results for "staircase polygon Catalan number" (definition varies across sources, needs validation during implementation)
- WebSearch results for "non-crossing partition Dyck word bijection algorithm" (multiple conventions exist, implementation must be tested)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Same Canvas 2D APIs and module patterns as Phase 2, no new dependencies
- Architecture: HIGH - Direct extension of proven patterns (uniform interface, registry, test harness)
- Mountain ranges: HIGH - Trivial reinterpretation of Dyck path
- Lattice paths below diagonal: HIGH - Standard bijection, well-documented
- Staircase polygons: MEDIUM - Definition ambiguity, but simple implementation either way
- Rooted plane trees: HIGH - DFS bijection well-established, layout algorithm simple for n<=4
- Ballot sequences: HIGH - Trivial reinterpretation of Dyck word
- Non-crossing partitions: MEDIUM - Bijection convention needs careful implementation and testing
- Stack-sortable permutations: HIGH - Knuth's algorithm is deterministic and well-defined
- Pitfalls: HIGH - Based on mathematical properties and established Canvas patterns

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable mathematical domain, Canvas APIs don't change)
