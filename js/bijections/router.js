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
import { directSteps } from './bridge.js';
import { structures } from '../structures/registry.js';

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

  // No classical entry: compose through Dyck path hub
  return composeViaDyck(sourceKey, targetKey, dyckWord, n);
}

// =============================================================================
// Dyck Path Hub Composition
// =============================================================================

/**
 * Compose a 2-phase animation through the Dyck path as a universal intermediate.
 *
 * Phase 1: Source → Dyck Path (classical module if registered, else directSteps)
 * Phase 2: Dyck Path → Target (same logic)
 *
 * When both phases are present (neither endpoint is dyck-path), returns a
 * 3-element path triggering 3-panel layout in the UI. Each step's drawFrame
 * is wrapped to remap sourceBox/targetBox onto the correct panel and draw
 * the "inactive" panel (dimmed target during Phase 1, completed source
 * during Phase 2).
 *
 * @param {string} sourceKey
 * @param {string} targetKey
 * @param {number[]} dyckWord
 * @param {number} n
 * @returns {{ steps: Array, path: string[] }}
 */
function composeViaDyck(sourceKey, targetKey, dyckWord, n) {
  const steps = [];

  // Pre-compute instances for wrapper draws
  const srcModule = structures[sourceKey].module;
  const tgtModule = structures[targetKey].module;
  const srcInstance = srcModule.fromDyck(dyckWord);
  const tgtInstance = tgtModule.fromDyck(dyckWord);

  // Determine if this is a 3-panel composition (both phases present)
  const isThreePanel = sourceKey !== 'dyck-path' && targetKey !== 'dyck-path';

  // --- Phase 1: Source → Dyck Path ---
  if (sourceKey !== 'dyck-path') {
    const srcDyckKey = `${sourceKey}|dyck-path`;
    const srcDyckEntry = registry[srcDyckKey];

    let phase1Steps;

    if (srcDyckEntry) {
      phase1Steps = srcDyckEntry.module.getSteps(dyckWord, n, srcDyckEntry.reversed);
    } else {
      phase1Steps = directSteps(sourceKey, 'dyck-path', dyckWord, n);
    }

    // Wrap steps: remap boxes for 3-panel, or add labels for 2-panel
    for (const step of phase1Steps) {
      if (isThreePanel) {
        steps.push(wrapPhase1Step(step, tgtModule, tgtInstance));
      } else {
        steps.push({ ...step });
      }
    }
  }

  // --- Phase 2: Dyck Path → Target ---
  if (targetKey !== 'dyck-path') {
    const dyckTgtKey = `dyck-path|${targetKey}`;
    const dyckTgtEntry = registry[dyckTgtKey];

    let phase2Steps;

    if (dyckTgtEntry) {
      phase2Steps = dyckTgtEntry.module.getSteps(dyckWord, n, dyckTgtEntry.reversed);
    } else {
      phase2Steps = directSteps('dyck-path', targetKey, dyckWord, n);
    }

    // Wrap steps: remap boxes for 3-panel, or add labels for 2-panel
    for (const step of phase2Steps) {
      if (isThreePanel) {
        steps.push(wrapPhase2Step(step, srcModule, srcInstance));
      } else {
        steps.push({ ...step });
      }
    }
  }

  // Build path: only include endpoints that aren't dyck-path
  const path = [];
  if (sourceKey !== 'dyck-path') path.push(sourceKey);
  path.push('dyck-path');
  if (targetKey !== 'dyck-path') path.push(targetKey);

  return { steps, path };
}

// =============================================================================
// 3-Panel Step Wrappers
// =============================================================================

/**
 * Wrap a Phase 1 step for 3-panel layout.
 * - Remaps: sourceBox stays, targetBox → middleBox (Dyck draws on center)
 * - Draws: dimmed target skeleton on targetBox
 */
function wrapPhase1Step(step, tgtModule, tgtInstance) {
  return {
    description: step.description,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, middleBox, targetBox, theme, colors } = opts;

      // Phase 1 animation: source on left, Dyck on center
      step.drawFrame(ctx, progress, {
        ...opts,
        sourceBox,
        targetBox: middleBox,
      });

      // Dimmed target skeleton on right panel
      tgtModule.drawProgressive(ctx, tgtInstance, {
        ...targetBox, theme, colors, activeIndex: -1, progress: 0,
      });
    },
  };
}

/**
 * Wrap a Phase 2 step for 3-panel layout.
 * - Remaps: sourceBox → middleBox (Dyck draws on center), targetBox stays
 * - Draws: completed source on sourceBox
 */
function wrapPhase2Step(step, srcModule, srcInstance) {
  return {
    description: step.description,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, middleBox, targetBox, theme, colors } = opts;

      // Completed source on left panel
      srcModule.draw(ctx, srcInstance, { ...sourceBox, theme, colors });

      // Phase 2 animation: Dyck on center, target on right
      step.drawFrame(ctx, progress, {
        ...opts,
        sourceBox: middleBox,
        targetBox,
      });
    },
  };
}
