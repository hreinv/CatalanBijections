/**
 * Bijection Router
 *
 * Maps structure pair keys to bijection modules that produce
 * animation step sequences. Bijection modules are imported and
 * registered at module load time.
 *
 * Lookup is bidirectional: registering a module for source|target
 * also registers it for target|source with a reversed flag.
 */

import * as parensDyck from './parens-dyck.js';
import * as binaryTriang from './binary-triang.js';
import * as parensBinary from './parens-binary.js';

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

/**
 * Look up and generate animation steps for a structure pair.
 *
 * @param {string} sourceKey - Source structure key (e.g. 'parentheses')
 * @param {string} targetKey - Target structure key (e.g. 'dyck-path')
 * @param {number[]} dyckWord - Current Dyck word as +1/-1 array
 * @param {number} n - Number of pairs
 * @returns {Array|null} Array of step objects, or null if no bijection registered
 */
export function getSteps(sourceKey, targetKey, dyckWord, n) {
  const key = `${sourceKey}|${targetKey}`;
  const entry = registry[key];

  if (!entry) return null;

  return entry.module.getSteps(dyckWord, n, entry.reversed);
}
