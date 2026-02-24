/**
 * Dyck Bridge Module
 *
 * Provides bijection graph construction, BFS pathfinding, and step
 * composition for non-classical structure pairs. Every pair of the 11
 * Catalan structures can be connected via this bridge -- classical pairs
 * use their direct edges while "island" structures (staircase-polygon,
 * stack-sortable-perm) route through the Dyck word hub.
 *
 * Exports: findPath, composeSteps
 */

import { structures } from '../structures/registry.js';

// =============================================================================
// Bijection Graph Construction
// =============================================================================

/**
 * 8 classical bijection edges (undirected).
 * Each entry represents a direct bijection module in js/bijections/.
 */
const CLASSICAL_EDGES = Object.freeze([
  { source: 'parentheses', target: 'dyck-path' },
  { source: 'binary-tree', target: 'triangulation' },
  { source: 'parentheses', target: 'binary-tree' },
  { source: 'ballot-sequence', target: 'dyck-path' },
  { source: 'dyck-path', target: 'mountain-range' },
  { source: 'dyck-path', target: 'lattice-path' },
  { source: 'binary-tree', target: 'rooted-plane-tree' },
  { source: 'non-crossing-partition', target: 'triangulation' },
]);

/**
 * Build the bijection graph as a frozen adjacency list (Map).
 *
 * - 11 nodes (one per Catalan structure)
 * - 8 classical edges (bidirectional, type 'classical')
 * - Bridge edges for island structures with zero classical edges,
 *   connecting them to 'dyck-path' as a hub (type 'bridge')
 * - Each node's neighbor list is sorted: classical edges first
 *
 * @returns {Map<string, Array<{to: string, type: string}>>}
 */
function buildGraph() {
  const allKeys = Object.keys(structures);
  const adj = new Map();

  // Initialize all nodes with empty neighbor lists
  for (const key of allKeys) {
    adj.set(key, []);
  }

  // Add classical edges (both directions)
  for (const { source, target } of CLASSICAL_EDGES) {
    adj.get(source).push({ to: target, type: 'classical' });
    adj.get(target).push({ to: source, type: 'classical' });
  }

  // Add bridge edges for island structures (zero classical edges)
  // These connect to 'dyck-path' as the hub node
  for (const key of allKeys) {
    if (adj.get(key).length === 0) {
      adj.get(key).push({ to: 'dyck-path', type: 'bridge' });
      adj.get('dyck-path').push({ to: key, type: 'bridge' });
    }
  }

  // Sort each node's neighbor list: classical edges first, then bridge
  for (const [, neighbors] of adj) {
    neighbors.sort((a, b) => {
      if (a.type === 'classical' && b.type !== 'classical') return -1;
      if (a.type !== 'classical' && b.type === 'classical') return 1;
      return 0;
    });
  }

  // Freeze the graph (shallow freeze of the Map values)
  for (const [key, neighbors] of adj) {
    adj.set(key, Object.freeze(neighbors));
  }

  return adj;
}

/** Frozen bijection graph built at module load time */
const graph = buildGraph();

// =============================================================================
// BFS Shortest-Path
// =============================================================================

/**
 * Find the shortest path between two structures in the bijection graph.
 *
 * Because classical edges are sorted first in each adjacency list,
 * BFS naturally prefers classical paths at equal depth.
 *
 * @param {string} source - Source structure key
 * @param {string} target - Target structure key
 * @returns {{ path: string[], edges: Array<{from: string, to: string, type: string}> } | null}
 */
export function findPath(source, target) {
  if (source === target) {
    return { path: [source], edges: [] };
  }

  const visited = new Set([source]);
  const queue = [{ node: source, path: [source], edges: [] }];

  while (queue.length > 0) {
    const { node, path, edges } = queue.shift();
    const neighbors = graph.get(node);

    if (!neighbors) continue;

    for (const neighbor of neighbors) {
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

  return null; // Should never happen with bridge edges included
}

// =============================================================================
// Step Composition
// =============================================================================

/**
 * Compose animation steps for a multi-leg bijection path.
 *
 * For classical legs: delegates to the classical getSteps callback.
 * For bridge legs: creates simple 2-step conversion sequences using
 *   the structure modules' fromDyck() and draw() functions.
 * Between multi-leg boundaries: inserts a transition step showing
 *   the intermediate structure rendered on both panels.
 *
 * @param {string[]} path - Array of structure keys [source, ..., target]
 * @param {Array<{from: string, to: string, type: string}>} edges - Edge metadata for each leg
 * @param {number[]} dyckWord - Current Dyck word as +1/-1 array
 * @param {number} n - Catalan order
 * @param {Function} classicalGetSteps - Callback: (sourceKey, targetKey, dyckWord, n) => steps[]|null
 * @returns {Array<{description: string, drawFrame: Function}>}
 */
export function composeSteps(path, edges, dyckWord, n, classicalGetSteps) {
  const allSteps = [];

  for (let i = 0; i < edges.length; i++) {
    const from = edges[i].from;
    const to = edges[i].to;
    const edgeType = edges[i].type;

    if (edgeType === 'classical') {
      // Use the existing classical bijection module
      const classicalSteps = classicalGetSteps(from, to, dyckWord, n);
      if (classicalSteps) {
        allSteps.push(...classicalSteps);
      }
    } else {
      // Bridge conversion: 2 simple steps
      const sourceLabel = structures[from].label;
      const targetLabel = structures[to].label;
      const sourceModule = structures[from].module;
      const targetModule = structures[to].module;

      // Step 1: Show source structure with full correspondence colors
      allSteps.push({
        description: `Converting ${sourceLabel} to Dyck word`,
        drawFrame(ctx, _easedProgress, opts) {
          const { sourceBox, targetBox, theme, colors } = opts;
          const instance = sourceModule.fromDyck(dyckWord);
          sourceModule.draw(ctx, instance, {
            ...sourceBox,
            theme,
            colors,
          });
          // Target box is empty (no rendering)
        },
      });

      // Step 2: Show target structure with full correspondence colors
      allSteps.push({
        description: `Building ${targetLabel} from Dyck word`,
        drawFrame(ctx, _easedProgress, opts) {
          const { sourceBox, targetBox, theme, colors } = opts;
          const instance = targetModule.fromDyck(dyckWord);
          targetModule.draw(ctx, instance, {
            ...targetBox,
            theme,
            colors,
          });
          // Source box is empty (no rendering)
        },
      });
    }

    // Insert transition step between legs (NOT between bridge steps within same leg)
    if (i < edges.length - 1) {
      const intermediateKey = to;
      const intermediateLabel = structures[intermediateKey].label;
      const intermediateModule = structures[intermediateKey].module;

      allSteps.push({
        description: `Intermediate: ${intermediateLabel}`,
        drawFrame(ctx, _easedProgress, opts) {
          const { sourceBox, targetBox, theme, colors } = opts;
          const instance = intermediateModule.fromDyck(dyckWord);
          // Render intermediate structure on both panels
          intermediateModule.draw(ctx, instance, {
            ...sourceBox,
            theme,
            colors,
          });
          intermediateModule.draw(ctx, instance, {
            ...targetBox,
            theme,
            colors,
          });
        },
      });
    }
  }

  return allSteps;
}
