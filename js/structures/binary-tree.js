/**
 * Binary Tree Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * Uses 1L0R recursive decomposition:
 *   Dyck word = [+1, ...leftWord, -1, ...rightWord]
 *   +1 opens a node, left subtree is between +1 and its matching -1,
 *   right subtree is everything after the matching -1.
 *
 * Instance representation: { left: TreeNode|null, right: TreeNode|null } or null (empty tree)
 * @typedef {{ left: TreeNode|null, right: TreeNode|null }} TreeNode
 */

/**
 * Convert a Dyck word to a binary tree using 1L0R decomposition.
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {TreeNode|null} Root node or null for empty word
 */
export function fromDyck(dyckWord) {
  if (dyckWord.length === 0) return null;

  // Find the matching -1 for the first +1 (prefix sum returns to 0)
  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < dyckWord.length; i++) {
    depth += dyckWord[i];
    if (depth === 0) {
      splitIdx = i;
      break;
    }
  }

  // word = [+1, ...leftWord, -1, ...rightWord]
  const leftWord = dyckWord.slice(1, splitIdx);
  const rightWord = dyckWord.slice(splitIdx + 1);

  return {
    left: fromDyck(leftWord),
    right: fromDyck(rightWord),
  };
}

/**
 * Convert a binary tree back to a Dyck word (1L0R serialization).
 *
 * @param {TreeNode|null} node
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(node) {
  if (node === null) return [];
  return [1, ...toDyck(node.left), -1, ...toDyck(node.right)];
}

/**
 * Compute the maximum depth of a binary tree.
 * @param {TreeNode|null} node
 * @returns {number}
 */
function getMaxDepth(node) {
  if (node === null) return -1;
  return 1 + Math.max(getMaxDepth(node.left), getMaxDepth(node.right));
}

/**
 * Assign layout coordinates using in-order traversal for x, depth for y.
 * Sufficient for n<=4 (max 4 internal nodes).
 *
 * @param {TreeNode|null} node
 * @param {number} depth
 * @param {{ value: number }} counter - Shared in-order counter
 */
function layoutTree(node, depth, counter) {
  if (node === null) return;
  layoutTree(node.left, depth + 1, counter);
  node.layoutX = counter.value;
  node.layoutY = depth;
  counter.value++;
  layoutTree(node.right, depth + 1, counter);
}

/**
 * Collect nodes in pre-order traversal for coloring.
 * @param {TreeNode|null} node
 * @param {Array} result
 */
function preOrderNodes(node, result) {
  if (node === null) return;
  result.push(node);
  preOrderNodes(node.left, result);
  preOrderNodes(node.right, result);
}

/**
 * Draw edges from parent to children recursively.
 */
function drawEdges(ctx, node, originX, originY, xScale, yScale, nodeRadius, theme) {
  if (node === null) return;

  const nx = originX + node.layoutX * xScale;
  const ny = originY + node.layoutY * yScale;

  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;

  if (node.left !== null) {
    const lx = originX + node.left.layoutX * xScale;
    const ly = originY + node.left.layoutY * yScale;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(lx, ly);
    ctx.stroke();
  }
  if (node.right !== null) {
    const rx = originX + node.right.layoutX * xScale;
    const ry = originY + node.right.layoutY * yScale;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }

  drawEdges(ctx, node.left, originX, originY, xScale, yScale, nodeRadius, theme);
  drawEdges(ctx, node.right, originX, originY, xScale, yScale, nodeRadius, theme);
}

/**
 * Render binary tree within bounding box using simplified in-order layout.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {TreeNode|null} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  if (instance === null) return;

  const { x, y, width, height, theme, colors } = opts;
  const nodeRadius = theme.nodeRadius || 16;

  // Layout pass
  const counter = { value: 0 };
  layoutTree(instance, 0, counter);
  const totalNodes = counter.value;
  const maxDepth = getMaxDepth(instance);

  // Scale to bounding box with padding for node circles
  const pad = nodeRadius + 4;
  const xScale = totalNodes > 1 ? (width - pad * 2) / (totalNodes - 1) : 0;
  const yScale = maxDepth > 0 ? (height - pad * 2) / maxDepth : 0;

  const originX = x + pad;
  const originY = y + pad;

  // Draw edges first (behind nodes)
  drawEdges(ctx, instance, originX, originY, xScale, yScale, nodeRadius, theme);

  // Draw nodes in pre-order with colors
  const nodes = [];
  preOrderNodes(instance, nodes);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nx = originX + node.layoutX * xScale;
    const ny = originY + node.layoutY * yScale;

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw node border
    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
