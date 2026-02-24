# Phase 6: Dyck Bridge - Research

**Researched:** 2026-02-24
**Domain:** Graph pathfinding, bijection composition, animation sequencing
**Confidence:** HIGH

## Summary

Phase 6 implements the "Dyck Bridge" -- a system that lets any two of the 11 Catalan structures be connected via bijection composition. Currently, the router has 8 classical bijections registered as direct edges. For the remaining non-classical pairs, the bridge system must: (1) model the bijection graph and find shortest paths, (2) compose step sequences from multiple bijection legs, and (3) show the user which intermediate structures are being traversed.

The bijection graph has 11 nodes and 8 classical edges. Nine of the 11 structures are connected by classical edges; two structures (staircase-polygon and stack-sortable-perm) have zero classical edges and can ONLY be reached through the Dyck word bridge (toDyck/fromDyck). The bridge must handle these "island" structures by converting through the Dyck word representation -- effectively routing through any Dyck-adjacent structure as a hop.

The problem is well-scoped: BFS on a small fixed graph (11 nodes, 8+11 edges), composition of existing step arrays, and a UI indicator in the step-description panel. No new libraries needed. All code stays within the zero-dependency constraint.

**Primary recommendation:** Implement BFS pathfinding over the bijection graph (classical edges + universal Dyck bridge edges), compose step sequences by concatenating per-leg getSteps() results with separator steps, and display the chain indicator in the existing step-description panel.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRDG-01 | Dyck word bridge composes bijections for non-classical structure pairs | Pathfinding + step composition architecture (see Architecture Patterns) |
| BRDG-02 | Pathfinding selects shortest route through bijection graph for any two structures | BFS on weighted bijection graph with classical-edge preference (see Architecture Patterns) |
| BRDG-03 | Bijection chain indicator shows intermediate structures when composing through bridge | Step-description panel update + chain label rendering (see Architecture Patterns) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (ES modules) | N/A | All implementation | Zero-dependency project constraint (FOUND-01) |
| Canvas 2D API | N/A | Rendering | Already used by all structure/bijection modules |

### Supporting
No additional libraries. The BFS algorithm and graph representation are trivial to implement in vanilla JS for an 11-node graph.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled BFS | graphlib/ngraph | Overkill for 11 nodes, violates zero-dependency constraint |
| Adjacency list | Adjacency matrix | Both fine at this scale; adjacency list is cleaner for sparse graph |

**Installation:**
```bash
# No installation needed -- zero dependencies
```

## Architecture Patterns

### Bijection Graph Model

**What:** A static adjacency list representing all possible bijection edges between the 11 structures. Two types of edges:

1. **Classical edges** (weight 1, preferred): The 8 existing bijection modules that produce custom step-by-step animations.
2. **Bridge edges** (weight 2, fallback): Any structure can convert to/from its Dyck word via `toDyck()`/`fromDyck()`. This creates a virtual "Dyck word" hub node, or equivalently, a universal edge from any structure to any Dyck-adjacent structure by composing through the Dyck representation.

**Graph topology (8 classical edges):**
```
ballot-sequence -- dyck-path -- parentheses -- binary-tree -- triangulation -- non-crossing-partition
                       |                            |
                   mountain-range              rooted-plane-tree
                       |
                   lattice-path

(disconnected from classical graph):
staircase-polygon
stack-sortable-perm
```

**When to use:** The graph is built once at module load time (frozen, like the structure registry).

**Key insight:** Rather than modeling a literal "Dyck word" hub node, the bridge can be modeled as: for any structure S that has no classical edge to the target T, route through a Dyck-connected structure. The simplest approach: treat every fromDyck/toDyck-capable structure as implicitly connected to every other structure through Dyck words, but with higher cost than classical edges. In practice, the BFS prefers classical edges and only falls back to Dyck bridge hops when no shorter classical path exists.

### Pattern 1: BFS Shortest-Path with Edge-Weight Preference

**What:** BFS over the bijection graph finds shortest paths. Classical edges have weight 1; bridge (Dyck) edges have weight 2. This ensures BRDG-02's requirement that classical bijections are preferred over longer bridge paths.

**Implementation approach:** Since weights are only 1 or 2, a modified BFS (or Dijkstra with a simple priority queue) works. For an 11-node graph, even naive BFS with edge sorting is instant.

**Example (pseudocode):**
```javascript
// Build adjacency list at module load time
const graph = new Map(); // key -> [{ target, weight, type }]

// Add classical edges (weight 1)
for (const [key, entry] of Object.entries(classicalRegistry)) {
  const [source, target] = key.split('|');
  addEdge(source, target, 1, 'classical');
}

// Add bridge edges (weight 2) for every pair via Dyck
for (const s of allStructureKeys) {
  for (const t of allStructureKeys) {
    if (s !== t && !hasClassicalEdge(s, t)) {
      addEdge(s, t, 2, 'bridge');
    }
  }
}

// BFS/Dijkstra returns path: ['mountain-range', 'dyck-path', 'binary-tree']
function findPath(source, target) { ... }
```

**Simpler alternative (recommended):** Since ALL structures have fromDyck/toDyck, the Dyck bridge is universal -- any structure can reach any other in at most 2 hops (source -> Dyck word -> target). Classical edges only matter when they provide a DIRECT (1-hop) connection. So the algorithm simplifies to:

1. If source === target: identity (no animation needed)
2. If classical edge exists between source and target: use it directly (1 hop)
3. If a 2-hop classical path exists (source -> intermediate -> target): use it (2 hops, both classical)
4. If a hybrid path exists (source has classical edge to X, X has classical edge to target): prefer over bridge
5. Otherwise: use bridge (source -> toDyck -> fromDyck -> target) as 1 "bridge hop"

**Actually, the optimal algorithm is just BFS on the classical graph + Dyck bridge fallback:**
1. Run BFS on the classical-edges-only graph from source to target.
2. If a path is found, use it (all classical edges, shortest by BFS).
3. If no path is found (e.g., staircase-polygon has no classical edges), use the Dyck bridge: pick the shortest classical path from a Dyck-adjacent structure to the target (or source), and compose through toDyck/fromDyck for the gap.

### Pattern 2: Step Sequence Composition

**What:** When a bijection path has multiple legs, compose the animation by concatenating step sequences from each leg, with "transition" separator steps between legs.

**How it works:**
1. For each leg of the path (e.g., mountain-range -> dyck-path, then dyck-path -> binary-tree):
   - Call the existing `getSteps(sourceKey, targetKey, dyckWord, n)` from the router
   - Collect the returned step arrays
2. Insert a brief "transition step" between legs showing the intermediate structure fully rendered
3. Concatenate all step arrays into one flat array
4. Return the composed array -- the animation engine processes it identically to a single-leg bijection

**For bridge hops (no classical bijection module):**
- When a leg has no classical bijection (e.g., staircase-polygon to dyck-path), create a simple "conversion" step sequence:
  - Step 1: "Converting Staircase Polygon to Dyck word representation"
  - Step 2: "Converting Dyck word to Dyck Path"
  - The drawFrame for these bridge steps renders the source structure statically on the left and the target structure building on the right using their standard `draw()` functions from the structure modules

**Key constraint:** The existing animation engine (`animation.js`) is step-array-agnostic -- it just iterates over `steps[]` with `currentStep` and `progress`. No changes needed to the engine.

### Pattern 3: Chain Indicator UI

**What:** When a composed bijection uses intermediate structures, show the chain in the step-description panel (BRDG-03).

**Implementation:** Update `updateStepDescription()` in `main.js` to show the path when the bridge is active. The chain can be displayed as a label above or prepended to the step description text.

**Example display:**
- Direct classical: `Step 3 of 8: Character 3 '(' maps to up step`
- Composed via bridge: `[Mountain Ranges -> Dyck Path -> Binary Tree] Step 3 of 14: ...`

**Alternative location:** A separate DOM element above the step description for the chain indicator, keeping the step text clean. This is cleaner for presentation.

### Pattern 4: Router Enhancement

**What:** Upgrade the router from a flat lookup table to a pathfinding router that falls back to composition.

**Current router contract:**
```javascript
// Returns step array or null
export function getSteps(sourceKey, targetKey, dyckWord, n) { ... }
```

**Enhanced router contract:**
```javascript
// Returns { steps: Array, path: string[], type: 'classical'|'composed'|'bridge' } or null
export function getSteps(sourceKey, targetKey, dyckWord, n) { ... }
```

**Or simpler:** Keep getSteps returning the step array (backward compatible), and add a separate `getPath(sourceKey, targetKey)` function that returns the path metadata for the chain indicator.

**Recommended approach:** Return an object `{ steps, path }` where `path` is the array of structure keys traversed (e.g., `['mountain-range', 'dyck-path', 'binary-tree']`). The caller (`main.js`) uses `steps` for animation and `path` for the chain indicator. This is a minimal API change.

### Recommended Project Structure
```
js/
├── bijections/
│   ├── router.js           # Enhanced with pathfinding + composition
│   ├── bridge.js            # NEW: Dyck bridge graph, BFS, step composition
│   ├── parens-dyck.js       # Existing classical bijection (unchanged)
│   ├── ... (7 more)         # Existing classical bijections (unchanged)
│   └── (no new bijection files needed)
├── structures/
│   └── registry.js          # Unchanged (provides structure keys for graph)
├── engine/
│   └── animation.js         # Unchanged (step-array agnostic)
├── core/
│   └── ...                  # Unchanged
└── main.js                  # Updated: chain indicator rendering, enhanced step loading
```

### Anti-Patterns to Avoid
- **Creating 44+ individual bijection modules for non-classical pairs:** The bridge system composes existing modules and Dyck conversions. Never write individual bijection modules for composed paths.
- **Modifying the animation engine for multi-leg awareness:** The engine is step-array agnostic. Composition produces a flat step array. Don't add "leg" or "phase" concepts to the engine.
- **Hard-coding paths:** Use graph traversal, not a switch statement with all 55 pairs. The graph is small but the code should be general.
- **Modifying existing classical bijection modules:** They work. The bridge system wraps around them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shortest path in a graph | Custom path algorithm | Standard BFS (11-node graph, trivially correct) | BFS is 15 lines, Dijkstra unnecessary for unit-weight edges |
| Animation step sequences | New animation loop | Existing `createAnimationEngine` | Engine is already step-array agnostic |
| Structure rendering in bridge steps | Custom renderers | Existing `structure.draw()` and `structure.fromDyck()` | Every structure module already has draw() and fromDyck() |

**Key insight:** The entire bridge system is a thin composition layer over existing infrastructure. No new rendering, no new animation logic, no new structure modules.

## Common Pitfalls

### Pitfall 1: Forgetting the Identity Case (source === target)
**What goes wrong:** User selects the same structure for both source and target, pathfinding returns empty or errors.
**Why it happens:** BFS returns empty path when source === target.
**How to avoid:** Handle identity case before calling pathfinding. Show the structure statically without animation, or show a brief "identity" message.
**Warning signs:** Console errors or blank canvas when selecting same structure on both sides.

### Pitfall 2: Bridge Steps Missing Color Correspondence
**What goes wrong:** Bridge conversion steps (toDyck/fromDyck) show structures without color highlighting, breaking the visual consistency established by classical bijections.
**Why it happens:** Classical bijections have custom drawFrame() with per-element coloring. Bridge steps that just call `structure.draw()` don't have correspondence colors.
**How to avoid:** Bridge conversion steps should render both the source and target structures using their standard `draw()` functions with full correspondence colors applied (using the `colors` parameter that all draw() functions accept). The structures share the same Dyck word, so element-index correspondence is implicit.
**Warning signs:** Gray/black structures appearing during bridge steps while classical legs show colorful elements.

### Pitfall 3: Step Count Explosion for Long Paths
**What goes wrong:** A 3-leg composed path through classical bijections could produce 3 x (2n+2) = 30+ steps for n=4. This makes the animation tediously long for presentation.
**Why it happens:** Naive concatenation of full step sequences without compression.
**How to avoid:** For bridge conversion legs (not classical bijections), use condensed step sequences: just an intro step and a completion step (2 steps total), not per-element steps. Classical bijection legs keep their full step sequences since those are the pedagogically valuable ones. Also consider: if the path is 3+ legs, the middle legs can be abbreviated.
**Warning signs:** Users needing 20+ clicks to step through a composed bijection.

### Pitfall 4: Asymmetric Reversal with Composition
**What goes wrong:** If the user selects target -> source (reverse of a composed path), the reversal logic breaks because composed paths need leg-level reversal, not just step-level reversal.
**Why it happens:** Classical bijections handle reversal via the `reversed` flag. Composed paths need to reverse both the leg order AND each leg's direction.
**How to avoid:** When composing a reversed path, reverse the path array first, then generate each leg in the reversed direction. This is simpler than trying to reverse a composed step array after the fact.
**Warning signs:** Incorrect intermediate structures shown, or first/last steps don't match expected source/target.

### Pitfall 5: Router Return Type Change Breaking main.js
**What goes wrong:** Changing `getSteps()` return type from `Array|null` to `{steps, path}|null` breaks existing callers.
**Why it happens:** main.js directly assigns `result` to `state.animation.steps`.
**How to avoid:** Update `loadBijectionSteps()` in main.js to destructure the new return type. Test that existing classical bijections still work after the change. Consider maintaining backward compatibility by checking if result is an array or object.
**Warning signs:** Animation not playing, `steps.length` throwing TypeError.

### Pitfall 6: Disconnected Structures (staircase-polygon, stack-sortable-perm)
**What goes wrong:** BFS on classical-edges-only graph finds no path to/from staircase-polygon or stack-sortable-perm, returns null.
**Why it happens:** These two structures have zero classical bijection edges.
**How to avoid:** The bridge system must always have a fallback: any structure can reach any other via toDyck/fromDyck. The graph must include Dyck bridge edges, or the pathfinding must fall back to bridge composition when BFS fails.
**Warning signs:** "No bijection available" message for pairs involving staircase-polygon or stack-sortable-perm.

## Code Examples

### BFS Pathfinding (11-node graph)
```javascript
/**
 * Find shortest path between two structures in the bijection graph.
 * Prefers classical edges (weight 1) over bridge edges (weight 2).
 *
 * @param {string} source - Source structure key
 * @param {string} target - Target structure key
 * @param {Map<string, Array<{to: string, type: string}>>} adjList - Adjacency list
 * @returns {{ path: string[], edges: Array<{from: string, to: string, type: string}> } | null}
 */
function findShortestPath(source, target, adjList) {
  if (source === target) return { path: [source], edges: [] };

  // BFS with path tracking
  const visited = new Set([source]);
  const queue = [{ node: source, path: [source], edges: [] }];

  while (queue.length > 0) {
    const { node, path, edges } = queue.shift();

    for (const neighbor of (adjList.get(node) || [])) {
      if (visited.has(neighbor.to)) continue;
      visited.add(neighbor.to);

      const newPath = [...path, neighbor.to];
      const newEdges = [...edges, { from: node, to: neighbor.to, type: neighbor.type }];

      if (neighbor.to === target) {
        return { path: newPath, edges: newEdges };
      }

      queue.push({ node: neighbor.to, path: newPath, edges: newEdges });
    }
  }

  return null; // Should never happen if bridge edges are included
}
```

### Building the Bijection Graph
```javascript
/**
 * Build the bijection graph from registered classical edges + bridge edges.
 * Classical edges come from the existing router registry.
 * Bridge edges connect every structure to 'dyck-path' (or another hub) via toDyck/fromDyck.
 */
function buildGraph(classicalEdges, allStructureKeys) {
  const adj = new Map();

  // Initialize all nodes
  for (const key of allStructureKeys) {
    adj.set(key, []);
  }

  // Add classical edges (both directions)
  for (const { source, target } of classicalEdges) {
    adj.get(source).push({ to: target, type: 'classical' });
    adj.get(target).push({ to: source, type: 'classical' });
  }

  // Add bridge edges: every structure can reach any other via Dyck word
  // Model this as: every structure connects to a virtual 'dyck-word' hub
  // OR: add direct bridge edges between all non-classically-connected pairs
  // Simpler: for structures with no classical edges, add bridge edges to
  // a well-connected node like 'dyck-path' or 'parentheses'
  for (const key of allStructureKeys) {
    if (adj.get(key).length === 0) {
      // Island structure: add bridge edges to a hub node
      adj.get(key).push({ to: 'dyck-path', type: 'bridge' });
      adj.get('dyck-path').push({ to: key, type: 'bridge' });
    }
  }

  return adj;
}
```

### Step Composition for Multi-Leg Path
```javascript
/**
 * Compose animation steps for a multi-leg bijection path.
 *
 * @param {string[]} path - Array of structure keys [source, ..., target]
 * @param {Array<{type: string}>} edges - Edge types for each leg
 * @param {number[]} dyckWord - Current Dyck word
 * @param {number} n - Catalan order
 * @returns {Array<{description: string, drawFrame: Function}>}
 */
function composeSteps(path, edges, dyckWord, n) {
  const allSteps = [];

  for (let i = 0; i < edges.length; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edgeType = edges[i].type;

    if (edgeType === 'classical') {
      // Use the existing classical bijection module
      const classicalSteps = classicalGetSteps(from, to, dyckWord, n);
      allSteps.push(...classicalSteps);
    } else {
      // Bridge conversion: create simple transition steps
      allSteps.push({
        description: `Converting ${getLabel(from)} to ${getLabel(to)} via Dyck word`,
        drawFrame(ctx, progress, opts) {
          // Render source structure (static) and target structure (building)
          // using their standard draw() functions
        },
      });
    }

    // Add transition separator between legs (except after last leg)
    if (i < edges.length - 1) {
      allSteps.push({
        description: `Intermediate: ${getLabel(to)} (continuing to ${getLabel(path[i + 2])})`,
        drawFrame(ctx, progress, opts) {
          // Render the intermediate structure fully on both panels
        },
      });
    }
  }

  return allSteps;
}
```

### Chain Indicator in Step Description
```javascript
/**
 * Format the bijection chain for display in the step-description panel.
 * @param {string[]} path - Array of structure keys
 * @returns {string} Formatted chain string
 */
function formatChain(path) {
  if (path.length <= 2) return ''; // Direct bijection, no chain needed
  return path.map(key => structures[key].label).join(' -> ');
}

// Usage in updateStepDescription():
if (currentPath && currentPath.length > 2) {
  dom.stepDescription.textContent =
    `[${formatChain(currentPath)}] ${stepText}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual bijection modules per pair (55 files) | Composition through Dyck bridge (1 bridge module) | This phase | Reduces code from 55 files to 1 bridge + 8 classical |
| Flat router lookup (null for unknown pairs) | Pathfinding router with bridge fallback | This phase | Every pair returns steps, never null (except identity) |
| Step description only | Step description + chain indicator | This phase | User sees the composition path |

**No deprecated/outdated patterns to worry about** -- the codebase is new and all patterns are current.

## Open Questions

1. **Chain indicator placement: inline text vs separate DOM element?**
   - What we know: The step-description panel currently shows step text. A chain indicator could be prepended to the text, or a new DOM element could be added above it.
   - What's unclear: Which looks better in presentation context. Inline is simpler; separate element allows distinct styling.
   - Recommendation: Start with inline `[Chain -> Path] Step text` format. If it's too cluttered, extract to a separate element. This can be decided during implementation.

2. **Bridge step animation: static snap vs smooth transition?**
   - What we know: Classical bijections have rich per-element animations. Bridge steps (toDyck/fromDyck) don't have custom animations.
   - What's unclear: Should bridge steps show a simple cross-fade or static snap between structures?
   - Recommendation: Use a simple two-step sequence per bridge leg: (1) show source structure fully colored, (2) show target structure fully colored. Progress interpolation can fade opacity between them. This is visually clean without requiring custom per-element animation logic.

3. **How to handle same-structure selection?**
   - What we know: Current behavior shows both panels with the same structure and says "No bijection available."
   - What's unclear: Should the bridge explicitly handle identity as "no transformation needed" with a message, or should it show a trivial identity animation?
   - Recommendation: Show both structures statically with a message like "Same structure selected -- no transformation needed." No animation steps. This is the current behavior and is fine.

4. **Should the graph be truly weighted (Dijkstra) or just use BFS with edge priority?**
   - What we know: The graph has 11 nodes and at most ~20 edges. Performance is irrelevant.
   - What's unclear: Whether simple BFS (exploring classical edges first) gives the same result as weighted Dijkstra.
   - Recommendation: Use BFS with classical edges sorted first in the adjacency list. For this graph size and weight structure (1 vs 2), BFS with classical-first ordering produces optimal paths. Dijkstra is unnecessary complexity.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `js/bijections/router.js` -- current router architecture and registration pattern
- Existing codebase analysis: `js/structures/registry.js` -- all 11 structure keys and modules
- Existing codebase analysis: `js/bijections/*.js` -- all 8 classical bijection META declarations and getSteps() contracts
- Existing codebase analysis: `js/main.js` -- loadBijectionSteps(), updateStepDescription(), render() integration points
- Existing codebase analysis: `js/engine/animation.js` -- step-array-agnostic engine confirming no changes needed

### Secondary (MEDIUM confidence)
- BFS shortest path algorithm: standard computer science (textbook algorithm, trivially correct for unweighted/unit-weight graphs)
- Graph composition approach: standard pattern for composing transformations through a common intermediate representation

### Tertiary (LOW confidence)
- None. All findings are based on direct codebase analysis and well-established CS algorithms.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero-dependency constraint is fixed, all code is vanilla JS
- Architecture: HIGH - based on direct analysis of existing router, structure registry, and animation engine
- Pitfalls: HIGH - identified through analysis of existing code contracts and composition patterns

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependencies to change)
