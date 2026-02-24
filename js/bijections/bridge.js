/**
 * Dyck Bridge Module
 *
 * Provides bijection graph construction, BFS pathfinding, and step
 * composition for non-classical structure pairs. Every pair of the 11
 * Catalan structures can be connected via this bridge -- classical pairs
 * use their direct edges while "island" structures (staircase-polygon,
 * stack-sortable-perm) route through the Dyck word hub.
 *
 * Exports: findPath, directSteps
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
// Direct Steps (non-classical bijections)
// =============================================================================

/**
 * Generate a simple 3-step animation showing source and target structures
 * directly, without exposing intermediate Dyck word conversions.
 *
 * The Dyck word conversion happens internally — the viewer only sees
 * the one-to-one correspondence between source and target.
 *
 * @param {string} sourceKey - Source structure key
 * @param {string} targetKey - Target structure key
 * @param {number[]} dyckWord - Current Dyck word as +1/-1 array
 * @returns {Array<{description: string, drawFrame: Function}>}
 */
export function directSteps(sourceKey, targetKey, dyckWord) {
  const sourceLabel = structures[sourceKey].label;
  const targetLabel = structures[targetKey].label;
  const sourceModule = structures[sourceKey].module;
  const targetModule = structures[targetKey].module;

  return [
    // Step 1: Introduction — show source structure, target panel empty
    {
      description: `Start with ${sourceLabel}`,
      drawFrame(ctx, _progress, opts) {
        const { sourceBox, theme, colors } = opts;
        const instance = sourceModule.fromDyck(dyckWord);
        sourceModule.draw(ctx, instance, { ...sourceBox, theme, colors });
      },
    },
    // Step 2: Reveal — fade in the target alongside the source
    {
      description: `Mapping ${sourceLabel} to ${targetLabel}`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;

        const srcInstance = sourceModule.fromDyck(dyckWord);
        sourceModule.draw(ctx, srcInstance, { ...sourceBox, theme, colors });

        ctx.save();
        ctx.globalAlpha = progress;
        const tgtInstance = targetModule.fromDyck(dyckWord);
        targetModule.draw(ctx, tgtInstance, { ...targetBox, theme, colors });
        ctx.restore();
      },
    },
    // Step 3: Complete — both structures at full opacity
    {
      description: `Bijection complete: ${sourceLabel} corresponds to ${targetLabel}`,
      drawFrame(ctx, _progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;

        const srcInstance = sourceModule.fromDyck(dyckWord);
        sourceModule.draw(ctx, srcInstance, { ...sourceBox, theme, colors });

        const tgtInstance = targetModule.fromDyck(dyckWord);
        targetModule.draw(ctx, tgtInstance, { ...targetBox, theme, colors });
      },
    },
  ];
}
