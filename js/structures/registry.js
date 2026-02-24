/**
 * Structure Registry
 *
 * Maps string keys to structure module references and labels.
 * Enables dynamic dispatch for structure selection in the UI.
 */

import * as parentheses from './parentheses.js';
import * as dyckPath from './dyck-path.js';
import * as binaryTree from './binary-tree.js';
import * as triangulation from './triangulation.js';
import * as mountainRange from './mountain-range.js';
import * as latticePath from './lattice-path.js';
import * as ballotSequence from './ballot-sequence.js';
import * as staircasePolygon from './staircase-polygon.js';
import * as rootedPlaneTree from './rooted-plane-tree.js';

/**
 * Registry of all Catalan structure modules.
 * Each entry maps a string key to { module, label }.
 * Frozen to prevent accidental mutation.
 *
 * @type {Object.<string, { module: { fromDyck: Function, toDyck: Function, draw: Function }, label: string }>}
 */
export const structures = Object.freeze({
  'parentheses':    { module: parentheses,    label: 'Balanced Parentheses' },
  'dyck-path':      { module: dyckPath,       label: 'Dyck Paths' },
  'binary-tree':    { module: binaryTree,     label: 'Binary Trees' },
  'triangulation':  { module: triangulation,  label: 'Triangulations' },
  'mountain-range':   { module: mountainRange,   label: 'Mountain Ranges' },
  'lattice-path':     { module: latticePath,     label: 'Lattice Paths' },
  'ballot-sequence':    { module: ballotSequence,    label: 'Ballot Sequences' },
  'staircase-polygon':  { module: staircasePolygon,  label: 'Staircase Polygons' },
  'rooted-plane-tree':  { module: rootedPlaneTree,   label: 'Rooted Plane Trees' },
});
