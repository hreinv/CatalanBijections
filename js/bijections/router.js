/**
 * Bijection Router
 *
 * Maps structure pair keys to bijection modules that produce
 * animation step sequences. Bijection modules are imported and
 * registered at module load time.
 *
 * Lookup is bidirectional: registering a module for source|target
 * also registers it for target|source with a reversed flag.
 *
 * Enhanced with Dyck bridge fallback: when no classical bijection
 * is registered for a pair, the router uses BFS pathfinding to
 * confirm connectivity and shows a direct source-to-target animation.
 */

import * as parensDyck from './parens-dyck.js';
import * as binaryTriang from './binary-triang.js';
import * as parensBinary from './parens-binary.js';
import * as ballotDyck from './ballot-dyck.js';
import * as dyckMountain from './dyck-mountain.js';
import * as dyckLattice from './dyck-lattice.js';
import * as binaryPlaneTree from './binary-plane-tree.js';
import * as ncpTriang from './ncp-triang.js';
import { findPath, directSteps } from './bridge.js';

/** @type {Object.<string, { module: Object, reversed: boolean }>} */
const registry = {};

/**
 * Register a bijection module for its declared source/target pair.
 * Also registers the reverse direction automatically.
 *
 * The module must expose META.source and META.target keys matching
 * structure registry keys (e.g. 'parentheses', 'dyck-path').
 *
 * @param {Object} mod - Bijection module with META and getSteps exports
 * @param {Object} mod.META - Metadata with source and target keys
 * @param {string} mod.META.source - Source structure key
 * @param {string} mod.META.target - Target structure key
 * @param {Function} mod.getSteps - Step sequence generator
 */
export function register(mod) {
  const { source, target } = mod.META;
  const forwardKey = `${source}|${target}`;
  const reverseKey = `${target}|${source}`;

  registry[forwardKey] = { module: mod, reversed: false };
  registry[reverseKey] = { module: mod, reversed: true };
}

// --- Register bijection modules ---
register(parensDyck);
register(binaryTriang);
register(parensBinary);
register(ballotDyck);
register(dyckMountain);
register(dyckLattice);
register(binaryPlaneTree);
register(ncpTriang);

// =============================================================================
// Public API
// =============================================================================

/**
 * Look up and generate animation steps for a structure pair.
 *
 * Returns an object { steps, path } for non-identity pairs:
 *   - Classical pairs: steps from the direct bijection module, 2-element path
 *   - Non-classical pairs: direct source-to-target steps via bridge, 2-element path
 *   - Identity (source === target): returns null
 *
 * @param {string} sourceKey - Source structure key (e.g. 'parentheses')
 * @param {string} targetKey - Target structure key (e.g. 'dyck-path')
 * @param {number[]} dyckWord - Current Dyck word as +1/-1 array
 * @param {number} n - Number of pairs
 * @returns {{ steps: Array<{description: string, drawFrame: Function}>, path: string[] } | null}
 */
export function getSteps(sourceKey, targetKey, dyckWord, n) {
  // Identity: no animation
  if (sourceKey === targetKey) return null;

  // Try classical registry first
  const key = `${sourceKey}|${targetKey}`;
  const entry = registry[key];

  if (entry) {
    return {
      steps: entry.module.getSteps(dyckWord, n, entry.reversed),
      path: [sourceKey, targetKey],
    };
  }

  // No classical entry: confirm connectivity, then show direct correspondence
  const pathResult = findPath(sourceKey, targetKey);

  if (!pathResult || pathResult.edges.length === 0) return null;

  return {
    steps: directSteps(sourceKey, targetKey, dyckWord),
    path: [sourceKey, targetKey],
  };
}
