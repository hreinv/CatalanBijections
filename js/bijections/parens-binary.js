/**
 * Parentheses to Binary Trees Bijection Module
 *
 * Implements step-by-step animation for the 1L0R recursive decomposition:
 * find the first +1 and its matching -1, content between becomes the left
 * subtree, content after becomes the right subtree. Recurse.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as parentheses from '../structures/parentheses.js';
import * as binaryTree from '../structures/binary-tree.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'parentheses',
  target: 'binary-tree',
  label: 'Parentheses to Binary Trees',
};

// =============================================================================
// Decomposition Helpers
// =============================================================================

/**
 * Recursively decompose a Dyck word using 1L0R, recording each step.
 * Each decomposition finds the first +1 and its matching -1, then recurses
 * on the content between (left subtree) and the content after (right subtree).
 *
 * @param {number[]} word - Dyck sub-word
 * @param {number} startIdx - Absolute position in the full Dyck word
 * @param {number} depth - Current tree depth
 * @param {Array} steps - Accumulator for decomposition steps
 */
function decompose(word, startIdx, depth, steps) {
  if (word.length === 0) return;

  // Find the split: scan for where prefix sum first returns to 0
  let d = 0;
  let splitIdx = -1;
  for (let i = 0; i < word.length; i++) {
    d += word[i];
    if (d === 0) {
      splitIdx = i;
      break;
    }
  }

  const leftContent = word.slice(1, splitIdx);
  const rightContent = word.slice(splitIdx + 1);

  steps.push({
    openIdx: startIdx,
    closeIdx: startIdx + splitIdx,
    leftRange: leftContent.length > 0
      ? [startIdx + 1, startIdx + splitIdx - 1]
      : null,
    rightRange: rightContent.length > 0
      ? [startIdx + splitIdx + 1, startIdx + splitIdx + rightContent.length]
      : null,
    depth,
  });

  // Recurse on left content (between open and close)
  decompose(leftContent, startIdx + 1, depth + 1, steps);
  // Recurse on right content (after close)
  decompose(rightContent, startIdx + splitIdx + 1, depth + 1, steps);
}

// =============================================================================
// Tree Layout Helpers (local implementations)
// =============================================================================

/**
 * Assign layout coordinates using in-order traversal for x, depth for y.
 * @param {Object|null} node
 * @param {number} depth
 * @param {{ value: number }} counter
 */
function layoutTree(node, depth, counter) {
  if (node === null) return;
  layoutTree(node.left, depth + 1, counter);
  node._layoutX = counter.value;
  node._layoutY = depth;
  counter.value++;
  layoutTree(node.right, depth + 1, counter);
}

/**
 * Collect nodes in pre-order for indexed access.
 * @param {Object|null} node
 * @param {Array} result
 */
function preOrderNodes(node, result) {
  if (node === null) return;
  result.push(node);
  preOrderNodes(node.left, result);
  preOrderNodes(node.right, result);
}

/**
 * Get maximum depth of a tree.
 * @param {Object|null} node
 * @returns {number}
 */
function getMaxDepth(node) {
  if (node === null) return -1;
  return 1 + Math.max(getMaxDepth(node.left), getMaxDepth(node.right));
}

// =============================================================================
// Step Generation
// =============================================================================

/**
 * Generate animation step sequence for parentheses-to-binary-trees bijection.
 *
 * Produces n+2 steps for a Dyck word of order n:
 *   Step 0:       Introduction -- show parentheses string and empty tree space
 *   Steps 1..n:   One per decomposition -- highlight matched pair, reveal node
 *   Step n+1:     Completion -- full correspondence visible
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order
 * @param {boolean} [reversed=false] - If true, show Binary Trees -> Parentheses
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const parenStr = parentheses.fromDyck(dyckWord);
  const tree = binaryTree.fromDyck(dyckWord);
  const charCount = parenStr.length; // 2n

  // Layout the tree once
  const counter = { value: 0 };
  layoutTree(tree, 0, counter);
  const totalNodes = counter.value;
  const maxDepth = getMaxDepth(tree);

  // Collect pre-order nodes for indexed coloring
  const nodes = [];
  preOrderNodes(tree, nodes);

  // Collect decomposition steps
  const decompSteps = [];
  decompose(dyckWord, 0, 0, decompSteps);

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the binary tree with ${n} internal nodes`
      : `Start with the balanced parentheses: "${parenStr}"`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const parenBox = reversed ? targetBox : sourceBox;
      const treeBox = reversed ? sourceBox : targetBox;

      // Draw all parentheses at full opacity, default color
      drawParenthesesIntro(ctx, parenStr, parenBox, theme);

      // Draw empty tree space (nothing to show yet)
    },
  });

  // --- Steps 1..n: One per decomposition ---
  for (let i = 0; i < decompSteps.length; i++) {
    const ds = decompSteps[i];

    steps.push({
      description: reversed
        ? `Node ${i + 1}: tree node at depth ${ds.depth} maps to matched pair at positions ${ds.openIdx + 1},${ds.closeIdx + 1}`
        : `Decomposition ${i + 1}: matched pair at positions ${ds.openIdx + 1},${ds.closeIdx + 1} creates node at depth ${ds.depth}`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const parenBox = reversed ? targetBox : sourceBox;
        const treeBox = reversed ? sourceBox : targetBox;

        // Draw parentheses with three visual zones
        drawParenthesesWithZones(ctx, parenStr, decompSteps, parenBox, theme, colors, i);

        // Draw tree with three visual zones
        drawTreeWithZones(ctx, tree, nodes, totalNodes, maxDepth, decompSteps, treeBox, theme, colors, i, progress);
      },
    });
  }

  // --- Step n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: binary tree structure defines the nested parentheses`
      : `Bijection complete: nested parentheses define the binary tree structure`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const parenBox = reversed ? targetBox : sourceBox;
      const treeBox = reversed ? sourceBox : targetBox;

      // All parentheses colored, full tree colored
      drawParenthesesComplete(ctx, parenStr, decompSteps, parenBox, theme, colors);
      drawTreeComplete(ctx, tree, nodes, totalNodes, maxDepth, treeBox, theme, colors);
    },
  });

  // Reverse step order for reversed direction
  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Parentheses
// =============================================================================

/**
 * Compute parentheses drawing parameters.
 */
function parenDrawParams(parenStr, box, theme) {
  const charCount = parenStr.length;
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const fontSize = Math.min(box.height * 0.3, 48, box.width / (charCount * 0.7));
  return { charCount, monoFont, fontSize };
}

/**
 * Draw parentheses at intro step: all characters at full opacity, default color.
 */
function drawParenthesesIntro(ctx, parenStr, box, theme) {
  const { charCount, monoFont, fontSize } = parenDrawParams(parenStr, box, theme);

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const charWidth = ctx.measureText('(').width;
  const totalWidth = charWidth * charCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const centerY = box.y + box.height / 2;

  for (let i = 0; i < charCount; i++) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    ctx.fillText(parenStr[i], startX + i * charWidth, centerY);
    ctx.restore();
  }
}

/**
 * Build a mapping from character position to (decomposition index, role).
 * Each decomposition step has an openIdx and closeIdx.
 * Returns an array indexed by character position -> { decompIndex, role: 'open'|'close' }
 */
function buildCharMap(decompSteps, charCount) {
  const map = new Array(charCount).fill(null);
  for (let d = 0; d < decompSteps.length; d++) {
    const ds = decompSteps[d];
    map[ds.openIdx] = { decompIndex: d, role: 'open' };
    map[ds.closeIdx] = { decompIndex: d, role: 'close' };
  }
  return map;
}

/**
 * Draw parentheses with three visual zones.
 * - Characters belonging to already processed decompositions: full color
 * - Characters belonging to active decomposition: full color, pulsing glow
 * - Characters not yet assigned: dimmed
 */
function drawParenthesesWithZones(ctx, parenStr, decompSteps, box, theme, colors, activeIndex) {
  const { charCount, monoFont, fontSize } = parenDrawParams(parenStr, box, theme);
  const charMap = buildCharMap(decompSteps, charCount);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const charWidth = ctx.measureText('(').width;
  const totalWidth = charWidth * charCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const centerY = box.y + box.height / 2;

  // Draw subtree range indicators for active decomposition
  const activeDs = decompSteps[activeIndex];
  if (activeDs) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    const underlineY = centerY + fontSize * 0.45;
    const barHeight = 3;

    if (activeDs.leftRange) {
      const lStart = startX + activeDs.leftRange[0] * charWidth;
      const lWidth = (activeDs.leftRange[1] - activeDs.leftRange[0] + 1) * charWidth;
      ctx.fillStyle = colors[activeIndex % colors.length];
      ctx.fillRect(lStart, underlineY, lWidth, barHeight);
    }
    if (activeDs.rightRange) {
      const rStart = startX + activeDs.rightRange[0] * charWidth;
      const rWidth = (activeDs.rightRange[1] - activeDs.rightRange[0] + 1) * charWidth;
      ctx.fillStyle = colors[activeIndex % colors.length];
      ctx.fillRect(rStart, underlineY + barHeight + 2, rWidth, barHeight);
    }
    ctx.restore();
  }

  // Draw characters
  for (let i = 0; i < charCount; i++) {
    ctx.save();

    const mapping = charMap[i];

    if (mapping !== null && mapping.decompIndex < activeIndex) {
      // Already processed: full color
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[mapping.decompIndex % colors.length];
    } else if (mapping !== null && mapping.decompIndex === activeIndex) {
      // Active: full color, pulsing glow
      ctx.globalAlpha = 1.0;
      const color = colors[mapping.decompIndex % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
    } else {
      // Not yet processed or unassigned: dimmed
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }

    ctx.fillText(parenStr[i], startX + i * charWidth, centerY);
    ctx.restore();
  }
}

/**
 * Draw all parentheses at full opacity with correspondence colors (completion step).
 */
function drawParenthesesComplete(ctx, parenStr, decompSteps, box, theme, colors) {
  const { charCount, monoFont, fontSize } = parenDrawParams(parenStr, box, theme);
  const charMap = buildCharMap(decompSteps, charCount);

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const charWidth = ctx.measureText('(').width;
  const totalWidth = charWidth * charCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const centerY = box.y + box.height / 2;

  for (let i = 0; i < charCount; i++) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    const mapping = charMap[i];
    if (mapping !== null) {
      ctx.fillStyle = colors[mapping.decompIndex % colors.length];
    } else {
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }
    ctx.fillText(parenStr[i], startX + i * charWidth, centerY);
    ctx.restore();
  }
}

// =============================================================================
// Drawing Helpers: Binary Tree
// =============================================================================

/**
 * Compute tree drawing parameters within a bounding box.
 */
function treeDrawParams(totalNodes, maxDepth, box, theme) {
  const nodeRadius = theme.nodeRadius || 16;
  const pad = nodeRadius + 4;
  const xScale = totalNodes > 1 ? (box.width - pad * 2) / (totalNodes - 1) : 0;
  const yScale = maxDepth > 0 ? (box.height - pad * 2) / maxDepth : 0;
  const originX = box.x + pad;
  const originY = box.y + pad;
  return { nodeRadius, pad, xScale, yScale, originX, originY };
}

/**
 * Draw the tree with three visual zones.
 * - Nodes in already processed decompositions: full color
 * - Active node: full color, pulsing glow, fades in with progress
 * - Not yet processed: not drawn
 */
function drawTreeWithZones(ctx, tree, nodes, totalNodes, maxDepth, decompSteps, box, theme, colors, activeIndex, progress) {
  if (tree === null) return;
  const params = treeDrawParams(totalNodes, maxDepth, box, theme);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw edges for revealed nodes
  for (let j = 0; j <= activeIndex && j < nodes.length; j++) {
    const node = nodes[j];
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    const children = [];
    if (node.left !== null) children.push(node.left);
    if (node.right !== null) children.push(node.right);

    for (const child of children) {
      // Only draw edge if the child has been revealed
      const childIdx = nodes.indexOf(child);
      if (childIdx > activeIndex) continue;

      const cx = params.originX + child._layoutX * params.xScale;
      const cy = params.originY + child._layoutY * params.yScale;

      ctx.save();
      if (childIdx === activeIndex) {
        // Edge to active child: animate with progress
        ctx.globalAlpha = progress;
        ctx.strokeStyle = colors[activeIndex % colors.length];
        ctx.shadowColor = colors[activeIndex % colors.length];
        ctx.shadowBlur = 4 + pulse * 8;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      }
      ctx.lineWidth = theme.strokeWidth || 3;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw nodes with three visual zones
  for (let j = 0; j <= activeIndex && j < nodes.length; j++) {
    const node = nodes[j];
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    ctx.save();

    if (j < activeIndex) {
      // Already processed: full color
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[j % colors.length];
    } else if (j === activeIndex) {
      // Active: animate in with progress, pulsing glow
      ctx.globalAlpha = progress;
      const color = colors[j % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
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
 * Draw the complete tree with all nodes colored (completion step).
 */
function drawTreeComplete(ctx, tree, nodes, totalNodes, maxDepth, box, theme, colors) {
  if (tree === null) return;
  const params = treeDrawParams(totalNodes, maxDepth, box, theme);

  // Draw all edges
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    const children = [];
    if (node.left !== null) children.push(node.left);
    if (node.right !== null) children.push(node.right);

    for (const child of children) {
      const cx = params.originX + child._layoutX * params.xScale;
      const cy = params.originY + child._layoutY * params.yScale;

      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colors[j % colors.length];
      ctx.lineWidth = theme.strokeWidth || 3;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw all nodes colored
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
