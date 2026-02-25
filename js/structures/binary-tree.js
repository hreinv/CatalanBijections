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
 * Assign layout coordinates using centered parent layout.
 * Root is at cx (horizontal center), children offset by ±gap which halves each level.
 * This keeps the root visually centered at the top of the drawing area.
 *
 * @param {TreeNode|null} node
 * @param {number} cx - Horizontal center for this node
 * @param {number} depth - Current tree depth
 * @param {number} gap - Horizontal offset for children at this level
 */
function layoutCentered(node, cx, depth, gap) {
  if (node === null) return;
  node.layoutX = cx;
  node.layoutY = depth;
  const childGap = gap / 2;
  if (node.left !== null) layoutCentered(node.left, cx - gap, depth + 1, childGap);
  if (node.right !== null) layoutCentered(node.right, cx + gap, depth + 1, childGap);
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

  // Layout pass — centered: root at x=0, children branch left/right
  layoutCentered(instance, 0, 0, 1.0);
  const maxDepth = getMaxDepth(instance);

  // Collect nodes to find X extent
  const allNodes = [];
  preOrderNodes(instance, allNodes);
  let extent = 0;
  for (const n of allNodes) {
    extent = Math.max(extent, Math.abs(n.layoutX));
  }

  // Scale to bounding box with root centered horizontally
  const pad = nodeRadius + 4;
  const xScale = extent > 0 ? (width / 2 - pad) / extent : 0;
  const yScale = maxDepth > 0 ? (height - pad * 2) / maxDepth : 0;

  const originX = x + width / 2;
  const originY = y + pad;

  // Draw edges first (behind nodes)
  drawEdges(ctx, instance, originX, originY, xScale, yScale, nodeRadius, theme);

  // Draw nodes in pre-order with colors
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
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

/**
 * Return the number of progressive elements (nodes) in the binary tree.
 * Counts nodes in pre-order using the existing preOrderNodes helper.
 *
 * @param {TreeNode|null} instance
 * @returns {number}
 */
export function elementCount(instance) {
  const nodes = [];
  preOrderNodes(instance, nodes);
  return nodes.length;
}

/**
 * Draw the binary tree progressively, revealing nodes one at a time in pre-order.
 *
 * - Edges drawn only between revealed nodes (both endpoints have index <= activeIndex).
 * - Processed nodes (i < activeIndex): filled circle with color + border.
 * - Active node (i === activeIndex): filled circle with color + glow + border.
 * - Unprocessed nodes (i > activeIndex): faint outline only (alpha 0.25), no fill.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {TreeNode|null} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  if (instance === null) return;

  const { x, y, width, height, theme, colors, activeIndex, progress } = opts;
  const nodeRadius = theme.nodeRadius || 16;

  // Layout pass — centered (same as draw())
  layoutCentered(instance, 0, 0, 1.0);
  const maxDepth = getMaxDepth(instance);

  // Find X extent for scaling
  const tempNodes = [];
  preOrderNodes(instance, tempNodes);
  let extent = 0;
  for (const n of tempNodes) {
    extent = Math.max(extent, Math.abs(n.layoutX));
  }

  const pad = nodeRadius + 4;
  const xScale = extent > 0 ? (width / 2 - pad) / extent : 0;
  const yScale = maxDepth > 0 ? (height - pad * 2) / maxDepth : 0;

  const originX = x + width / 2;
  const originY = y + pad;

  // Collect nodes in pre-order (same as draw())
  const nodes = [];
  preOrderNodes(instance, nodes);

  // Build a set of revealed node indices for quick lookup
  const revealedSet = new Set();
  for (let i = 0; i <= Math.min(activeIndex, nodes.length - 1); i++) {
    revealedSet.add(nodes[i]);
  }

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw edges only between revealed nodes (both endpoints revealed)
  function drawRevealedEdges(node) {
    if (node === null) return;
    const nx = originX + node.layoutX * xScale;
    const ny = originY + node.layoutY * yScale;

    if (revealedSet.has(node)) {
      if (node.left !== null && revealedSet.has(node.left)) {
        ctx.save();
        ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
        ctx.lineWidth = theme.strokeWidth || 3;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(originX + node.left.layoutX * xScale, originY + node.left.layoutY * yScale);
        ctx.stroke();
        ctx.restore();
      }
      if (node.right !== null && revealedSet.has(node.right)) {
        ctx.save();
        ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
        ctx.lineWidth = theme.strokeWidth || 3;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(originX + node.right.layoutX * xScale, originY + node.right.layoutY * yScale);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawRevealedEdges(node.left);
    drawRevealedEdges(node.right);
  }

  drawRevealedEdges(instance);

  // Draw nodes with three-zone pattern
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nx = originX + node.layoutX * xScale;
    const ny = originY + node.layoutY * yScale;

    ctx.save();

    if (i < activeIndex) {
      // Processed: filled circle with color + border
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (i === activeIndex) {
      // Active: filled circle with color + glow + border
      ctx.globalAlpha = 1.0;
      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow for border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Unprocessed: faint outline only, no fill
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
