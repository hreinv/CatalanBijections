/**
 * Binary Trees to Rooted Plane Trees Bijection Module
 *
 * Implements step-by-step animation for the Knuth transform (LCRS):
 * binary tree left-child becomes first-child in the plane tree,
 * binary tree right-child becomes next-sibling in the plane tree.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as binaryTree from '../structures/binary-tree.js';
import * as rootedPlaneTree from '../structures/rooted-plane-tree.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'binary-tree',
  target: 'rooted-plane-tree',
  label: 'Binary Trees to Rooted Plane Trees',
};

// =============================================================================
// Tree Helpers (local implementations to avoid modifying structure modules)
// =============================================================================

/**
 * Assign layout coordinates to binary tree using in-order traversal for x, depth for y.
 * @param {Object|null} node
 * @param {number} depth
 * @param {{ value: number }} counter
 */
function layoutBinaryTree(node, depth, counter) {
  if (node === null) return;
  layoutBinaryTree(node.left, depth + 1, counter);
  node._layoutX = counter.value;
  node._layoutY = depth;
  counter.value++;
  layoutBinaryTree(node.right, depth + 1, counter);
}

/**
 * Collect binary tree nodes in pre-order for indexed access.
 * @param {Object|null} node
 * @param {Array} result
 */
function preOrderBinary(node, result) {
  if (node === null) return;
  result.push(node);
  preOrderBinary(node.left, result);
  preOrderBinary(node.right, result);
}

/**
 * Get maximum depth of a binary tree.
 * @param {Object|null} node
 * @returns {number}
 */
function getMaxDepthBinary(node) {
  if (node === null) return -1;
  return 1 + Math.max(getMaxDepthBinary(node.left), getMaxDepthBinary(node.right));
}

/**
 * Layout a rooted plane tree using width-accumulation.
 * Leaf nodes get width 1 and are placed at xOffset + 0.5.
 * Internal nodes are centered over first and last child.
 * @param {Object} node
 * @param {number} depth
 * @param {number} xOffset
 * @returns {number} Total subtree width
 */
function layoutPlaneTree(node, depth, xOffset) {
  if (node.children.length === 0) {
    node._layoutX = xOffset + 0.5;
    node._layoutY = depth;
    return 1;
  }

  let totalWidth = 0;
  for (const child of node.children) {
    const childWidth = layoutPlaneTree(child, depth + 1, xOffset + totalWidth);
    totalWidth += childWidth;
  }

  const firstChildX = node.children[0]._layoutX;
  const lastChildX = node.children[node.children.length - 1]._layoutX;
  node._layoutX = (firstChildX + lastChildX) / 2;
  node._layoutY = depth;

  return totalWidth;
}

/**
 * Collect plane tree nodes in pre-order.
 * @param {Object} node
 * @param {Array} result
 */
function preOrderPlane(node, result) {
  result.push(node);
  for (const child of node.children) {
    preOrderPlane(child, result);
  }
}

// =============================================================================
// Step Generation
// =============================================================================

/**
 * Generate animation step sequence for binary-trees-to-rooted-plane-trees bijection.
 *
 * Produces n+2 steps for a Dyck word of order n:
 *   Step 0:       Introduction -- show binary tree and plane tree root node only
 *   Steps 1..n:   One per binary tree node (pre-order) -- highlight node and corresponding plane tree node
 *   Step n+1:     Completion -- both trees fully colored with node correspondence
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order
 * @param {boolean} [reversed=false] - If true, show Rooted Plane Trees -> Binary Trees
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const tree = binaryTree.fromDyck(dyckWord);
  const planeTree = rootedPlaneTree.fromDyck(dyckWord);

  // Layout binary tree
  const bCounter = { value: 0 };
  layoutBinaryTree(tree, 0, bCounter);
  const totalBinaryNodes = bCounter.value; // should equal n
  const maxBinaryDepth = getMaxDepthBinary(tree);

  // Collect binary tree nodes in pre-order
  const binaryNodes = [];
  preOrderBinary(tree, binaryNodes);

  // Layout plane tree
  const totalPlaneWidth = layoutPlaneTree(planeTree, 0, 0);

  // Collect plane tree nodes in pre-order
  const planeNodes = [];
  preOrderPlane(planeTree, planeNodes);

  // Compute max plane tree depth
  let maxPlaneDepth = 0;
  for (const node of planeNodes) {
    if (node._layoutY > maxPlaneDepth) maxPlaneDepth = node._layoutY;
  }

  // Pre-compute drawing parameters for both trees
  const binaryDrawInfo = {
    nodes: binaryNodes,
    totalNodes: totalBinaryNodes,
    maxDepth: maxBinaryDepth,
  };

  const planeDrawInfo = {
    root: planeTree,
    nodes: planeNodes,
    totalWidth: totalPlaneWidth,
    maxDepth: maxPlaneDepth,
  };

  // Correspondence:
  // Binary tree node i (0-indexed, pre-order) corresponds to plane tree node i+1
  // (plane tree node 0 is the root, which has no binary tree counterpart)

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the rooted plane tree with ${n + 1} nodes`
      : `Show the binary tree with ${n} internal nodes and the plane tree root`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const treeBox = reversed ? targetBox : sourceBox;
      const planeBox = reversed ? sourceBox : targetBox;

      // Draw full binary tree at default color
      drawBinaryTreeIntro(ctx, binaryDrawInfo, treeBox, theme);

      // Draw plane tree root node only
      drawPlaneTreeIntro(ctx, planeDrawInfo, planeBox, theme);
    },
  });

  // --- Steps 1..n: One per binary tree node (pre-order) ---
  for (let i = 0; i < n; i++) {
    steps.push({
      description: reversed
        ? `Node ${i + 1}: plane tree child maps to binary tree node (first child = left, sibling = right)`
        : `Node ${i + 1}: left child becomes first child, right child becomes next sibling`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const treeBox = reversed ? targetBox : sourceBox;
        const planeBox = reversed ? sourceBox : targetBox;

        // Draw binary tree with three visual zones
        drawBinaryTreeWithZones(ctx, binaryDrawInfo, treeBox, theme, colors, i);

        // Draw plane tree with three visual zones
        // Plane tree node i+1 corresponds to binary node i
        drawPlaneTreeWithZones(ctx, planeDrawInfo, planeBox, theme, colors, i, n);
      },
    });
  }

  // --- Step n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each plane tree node maps to one binary tree node (LCRS reverse)`
      : `Bijection complete: left-child/right-sibling transform maps each binary node to a plane tree node`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const treeBox = reversed ? targetBox : sourceBox;
      const planeBox = reversed ? sourceBox : targetBox;

      // All nodes colored with correspondence
      drawBinaryTreeComplete(ctx, binaryDrawInfo, treeBox, theme, colors);
      drawPlaneTreeComplete(ctx, planeDrawInfo, planeBox, theme, colors, n);
    },
  });

  // Reverse step order for reversed direction
  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Binary Tree
// =============================================================================

/**
 * Compute drawing parameters for the binary tree within a bounding box.
 */
function binaryTreeDrawParams(drawInfo, box, theme) {
  const nodeRadius = theme.nodeRadius || 16;
  const pad = nodeRadius + 4;
  const { totalNodes, maxDepth } = drawInfo;
  const xScale = totalNodes > 1 ? (box.width - pad * 2) / (totalNodes - 1) : 0;
  const yScale = maxDepth > 0 ? (box.height - pad * 2) / maxDepth : 0;
  const originX = box.x + pad;
  const originY = box.y + pad;
  return { nodeRadius, pad, xScale, yScale, originX, originY };
}

/**
 * Draw binary tree edges.
 */
function drawBinaryEdges(ctx, nodes, params, theme, colors, activeIndex, mode) {
  const { originX, originY, xScale, yScale } = params;

  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const nx = originX + node._layoutX * xScale;
    const ny = originY + node._layoutY * yScale;

    const children = [];
    if (node.left !== null) children.push(node.left);
    if (node.right !== null) children.push(node.right);

    for (const child of children) {
      const cx = originX + child._layoutX * xScale;
      const cy = originY + child._layoutY * yScale;

      ctx.save();
      if (mode === 'intro') {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      } else if (mode === 'complete') {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = colors[j % colors.length];
      } else {
        // zones mode
        if (j <= activeIndex) {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = colors[j % colors.length];
        } else {
          ctx.globalAlpha = 0.25;
          ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
        }
      }
      ctx.lineWidth = theme.strokeWidth || 3;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Draw the full binary tree at intro step: all nodes in default color, full opacity.
 */
function drawBinaryTreeIntro(ctx, drawInfo, box, theme) {
  if (drawInfo.totalNodes === 0) return;
  const params = binaryTreeDrawParams(drawInfo, box, theme);
  const { nodes } = drawInfo;

  // Draw edges
  drawBinaryEdges(ctx, nodes, params, theme, null, -1, 'intro');

  // Draw nodes
  for (const node of nodes) {
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    ctx.beginPath();
    ctx.arc(nx, ny, params.nodeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nx, ny, params.nodeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draw binary tree with three visual zones based on active index.
 */
function drawBinaryTreeWithZones(ctx, drawInfo, box, theme, colors, activeIndex) {
  if (drawInfo.totalNodes === 0) return;
  const params = binaryTreeDrawParams(drawInfo, box, theme);
  const { nodes } = drawInfo;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw edges with zones
  drawBinaryEdges(ctx, nodes, params, theme, colors, activeIndex, 'zones');

  // Draw nodes with zones
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    ctx.save();

    if (j < activeIndex) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[j % colors.length];
    } else if (j === activeIndex) {
      ctx.globalAlpha = 1.0;
      const color = colors[j % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
    } else {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }

    ctx.beginPath();
    ctx.arc(nx, ny, params.nodeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Node border
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nx, ny, params.nodeRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Draw binary tree with all nodes colored (completion step).
 */
function drawBinaryTreeComplete(ctx, drawInfo, box, theme, colors) {
  if (drawInfo.totalNodes === 0) return;
  const params = binaryTreeDrawParams(drawInfo, box, theme);
  const { nodes } = drawInfo;

  // Draw edges
  drawBinaryEdges(ctx, nodes, params, theme, colors, -1, 'complete');

  // Draw nodes
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[j % colors.length];
    ctx.beginPath();
    ctx.arc(nx, ny, params.nodeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nx, ny, params.nodeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// =============================================================================
// Drawing Helpers: Rooted Plane Tree
// =============================================================================

/**
 * Compute drawing parameters for the plane tree within a bounding box.
 */
function planeTreeDrawParams(drawInfo, box, theme) {
  const { totalWidth, maxDepth, nodes } = drawInfo;
  const nodeRadius = Math.max(6, Math.min(
    box.width / (totalWidth + 1) * 0.3,
    box.height / (maxDepth + 2) * 0.3,
    16
  ));
  const pad = nodeRadius + 6;
  const drawWidth = box.width - pad * 2;
  const drawHeight = box.height - pad * 2;

  const xScale = totalWidth > 1 ? drawWidth / totalWidth : drawWidth;
  const yScale = maxDepth > 0 ? drawHeight / maxDepth : 0;

  function toCanvasX(lx) { return box.x + pad + lx * xScale; }
  function toCanvasY(ly) { return box.y + pad + ly * yScale; }

  return { nodeRadius, pad, xScale, yScale, toCanvasX, toCanvasY };
}

/**
 * Draw plane tree edges for given nodes.
 */
function drawPlaneEdges(ctx, root, params, theme, colors, activeIndex, n, mode) {
  const { toCanvasX, toCanvasY } = params;

  function drawEdgesRecursive(node) {
    const nx = toCanvasX(node._layoutX);
    const ny = toCanvasY(node._layoutY);

    ctx.lineWidth = theme.strokeWidth || 3;

    for (const child of node.children) {
      const cx = toCanvasX(child._layoutX);
      const cy = toCanvasY(child._layoutY);

      ctx.save();
      if (mode === 'intro') {
        // Only draw edge to root (no children shown yet)
        ctx.restore();
        continue;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      }
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();

      drawEdgesRecursive(child);
    }
  }

  if (mode !== 'intro') {
    drawEdgesRecursive(root);
  }
}

/**
 * Draw plane tree intro: only the root node visible.
 */
function drawPlaneTreeIntro(ctx, drawInfo, box, theme) {
  const params = planeTreeDrawParams(drawInfo, box, theme);
  const root = drawInfo.root;
  const { toCanvasX, toCanvasY, nodeRadius } = params;

  // Draw root node at default color
  const rx = toCanvasX(root._layoutX);
  const ry = toCanvasY(root._layoutY);

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.beginPath();
  ctx.arc(rx, ry, nodeRadius * 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(rx, ry, nodeRadius * 1.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw plane tree with three visual zones.
 * Root (index 0) is always drawn at default color (no binary tree counterpart).
 * Plane tree node i+1 corresponds to binary node i.
 * activeIndex is the binary tree node index (0-based).
 */
function drawPlaneTreeWithZones(ctx, drawInfo, box, theme, colors, activeIndex, n) {
  const params = planeTreeDrawParams(drawInfo, box, theme);
  const { toCanvasX, toCanvasY, nodeRadius } = params;
  const { root, nodes } = drawInfo;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw edges for revealed nodes
  // A plane node at index j is revealed if j === 0 (root, always) or j-1 <= activeIndex
  function drawEdgesWithZones(node) {
    const nx = toCanvasX(node._layoutX);
    const ny = toCanvasY(node._layoutY);

    for (const child of node.children) {
      // Find the plane tree index of this child
      const childPlaneIdx = nodes.indexOf(child);
      const childBinaryIdx = childPlaneIdx - 1; // corresponding binary node index

      if (childBinaryIdx <= activeIndex) {
        // This edge is revealed
        ctx.save();
        if (childBinaryIdx <= activeIndex) {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = colors[childBinaryIdx % colors.length];
        }
        ctx.lineWidth = theme.strokeWidth || 3;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(toCanvasX(child._layoutX), toCanvasY(child._layoutY));
        ctx.stroke();
        ctx.restore();

        drawEdgesWithZones(child);
      }
    }
  }

  drawEdgesWithZones(root);

  // Draw nodes
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const bIdx = j - 1; // binary tree correspondence index (-1 for root)
    const nx = toCanvasX(node._layoutX);
    const ny = toCanvasY(node._layoutY);

    // Root is always visible at default color
    if (j === 0) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    // Non-root nodes: three zones based on bIdx relative to activeIndex
    if (bIdx > activeIndex) {
      // Not yet processed: dimmed
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (bIdx === activeIndex) {
      // Active: pulsing glow
      ctx.save();
      ctx.globalAlpha = 1.0;
      const color = colors[bIdx % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Already processed: full color, no glow
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[bIdx % colors.length];
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Draw plane tree with all nodes fully colored (completion step).
 * Root stays default color; all other nodes get correspondence colors.
 */
function drawPlaneTreeComplete(ctx, drawInfo, box, theme, colors, n) {
  const params = planeTreeDrawParams(drawInfo, box, theme);
  const { toCanvasX, toCanvasY, nodeRadius } = params;
  const { root, nodes } = drawInfo;

  // Draw all edges colored by their child's correspondence
  function drawEdgesColored(node) {
    const nx = toCanvasX(node._layoutX);
    const ny = toCanvasY(node._layoutY);

    for (const child of node.children) {
      const childPlaneIdx = nodes.indexOf(child);
      const childBinaryIdx = childPlaneIdx - 1;

      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colors[childBinaryIdx % colors.length];
      ctx.lineWidth = theme.strokeWidth || 3;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(toCanvasX(child._layoutX), toCanvasY(child._layoutY));
      ctx.stroke();
      ctx.restore();

      drawEdgesColored(child);
    }
  }

  drawEdgesColored(root);

  // Draw all nodes
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const nx = toCanvasX(node._layoutX);
    const ny = toCanvasY(node._layoutY);

    ctx.save();
    ctx.globalAlpha = 1.0;

    if (j === 0) {
      // Root: default color, slightly larger
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const bIdx = j - 1;
      ctx.fillStyle = colors[bIdx % colors.length];
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
