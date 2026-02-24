/**
 * Rooted Plane Tree Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A rooted plane tree (ordered tree) has children in a specified
 * left-to-right order. C_n counts rooted plane trees with n edges
 * (n+1 nodes).
 *
 * Bijection via DFS traversal: +1 = descend to new child, -1 = backtrack.
 *
 * Instance representation: { children: Array<TreeNode> }
 * @typedef {{ children: Array<TreeNode> }} TreeNode
 */

/**
 * Convert a Dyck word to a rooted plane tree using DFS reconstruction.
 * +1 = create new child of current node, descend.
 * -1 = backtrack to parent.
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {TreeNode} Root node
 */
export function fromDyck(dyckWord) {
  const root = { children: [] };
  let current = root;
  const stack = [];
  for (const step of dyckWord) {
    if (step === 1) {
      const child = { children: [] };
      current.children.push(child);
      stack.push(current);
      current = child;
    } else {
      current = stack.pop();
    }
  }
  return root;
}

/**
 * Convert a rooted plane tree back to a Dyck word via DFS serialization.
 * Descend to child = +1, backtrack from child = -1.
 *
 * @param {TreeNode} instance - Root node
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  const word = [];
  function dfs(node) {
    for (const child of node.children) {
      word.push(1);
      dfs(child);
      word.push(-1);
    }
  }
  dfs(instance);
  return word;
}

/**
 * Compute layout for a rooted plane tree using width-accumulation.
 * Leaf nodes get width 1 and are placed at xOffset + 0.5.
 * Internal nodes are centered over their first and last child.
 * Returns the subtree width.
 *
 * @param {TreeNode} node
 * @param {number} depth - Current depth (0 for root)
 * @param {number} xOffset - Left edge of available horizontal space
 * @returns {number} Total subtree width
 */
function layoutPlaneTree(node, depth, xOffset) {
  if (node.children.length === 0) {
    // Leaf node: place in center of unit-width slot
    node.layoutX = xOffset + 0.5;
    node.layoutY = depth;
    return 1;
  }

  let totalWidth = 0;
  for (const child of node.children) {
    const childWidth = layoutPlaneTree(child, depth + 1, xOffset + totalWidth);
    totalWidth += childWidth;
  }

  // Center parent over first and last child x-coordinates
  const firstChildX = node.children[0].layoutX;
  const lastChildX = node.children[node.children.length - 1].layoutX;
  node.layoutX = (firstChildX + lastChildX) / 2;
  node.layoutY = depth;

  return totalWidth;
}

/**
 * Collect all nodes in pre-order traversal for consistent coloring.
 * @param {TreeNode} node
 * @param {Array} result
 */
function collectNodes(node, result) {
  result.push(node);
  for (const child of node.children) {
    collectNodes(child, result);
  }
}

/**
 * Draw a rooted plane tree within the bounding box.
 * Uses width-accumulation layout to prevent node collisions.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {TreeNode} instance - Root node
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;

  // Layout the tree
  const totalTreeWidth = layoutPlaneTree(instance, 0, 0);

  // Collect all nodes for rendering
  const allNodes = [];
  collectNodes(instance, allNodes);

  if (allNodes.length === 0) return;

  // Compute max depth
  let maxDepth = 0;
  for (const node of allNodes) {
    if (node.layoutY > maxDepth) maxDepth = node.layoutY;
  }

  // Scale layout coordinates to fit bounding box with padding
  const nodeRadius = Math.max(6, Math.min(
    width / (totalTreeWidth + 1) * 0.3,
    height / (maxDepth + 2) * 0.3,
    16
  ));
  const pad = nodeRadius + 6;
  const drawWidth = width - pad * 2;
  const drawHeight = height - pad * 2;

  const xScale = totalTreeWidth > 1 ? drawWidth / totalTreeWidth : drawWidth;
  const yScale = maxDepth > 0 ? drawHeight / maxDepth : 0;

  function toCanvasX(lx) { return x + pad + lx * xScale; }
  function toCanvasY(ly) { return y + pad + ly * yScale; }

  // Draw edges from parent to children
  function drawEdges(node) {
    const nx = toCanvasX(node.layoutX);
    const ny = toCanvasY(node.layoutY);

    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = theme.strokeWidth || 3;

    for (const child of node.children) {
      const cx = toCanvasX(child.layoutX);
      const cy = toCanvasY(child.layoutY);
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      drawEdges(child);
    }
  }

  drawEdges(instance);

  // Draw nodes with correspondence colors
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const nx = toCanvasX(node.layoutX);
    const ny = toCanvasY(node.layoutY);

    // Root node is slightly larger
    const r = (i === 0) ? nodeRadius * 1.3 : nodeRadius;

    // Filled circle
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = (i === 0) ? 3 : 2;
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Return the number of nodes (n+1) in the rooted plane tree.
 * @param {TreeNode} instance - Root node
 * @returns {number}
 */
export function elementCount(instance) {
  const nodes = [];
  collectNodes(instance, nodes);
  return nodes.length;
}

/**
 * Draw a rooted plane tree progressively with three-zone highlighting.
 * Edges are only drawn between revealed nodes. Nodes use three-zone pattern.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {TreeNode} instance - Root node
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  const { x, y, width, height, theme, colors, activeIndex, progress } = opts;

  // Layout the tree
  const totalTreeWidth = layoutPlaneTree(instance, 0, 0);

  // Collect all nodes in pre-order
  const allNodes = [];
  collectNodes(instance, allNodes);

  if (allNodes.length === 0) return;

  // Compute max depth
  let maxDepth = 0;
  for (const node of allNodes) {
    if (node.layoutY > maxDepth) maxDepth = node.layoutY;
  }

  // Scale layout coordinates to fit bounding box with padding
  const nodeRadius = Math.max(6, Math.min(
    width / (totalTreeWidth + 1) * 0.3,
    height / (maxDepth + 2) * 0.3,
    16
  ));
  const pad = nodeRadius + 6;
  const drawWidth = width - pad * 2;
  const drawHeight = height - pad * 2;

  const xScale = totalTreeWidth > 1 ? drawWidth / totalTreeWidth : drawWidth;
  const yScale = maxDepth > 0 ? drawHeight / maxDepth : 0;

  function toCanvasX(lx) { return x + pad + lx * xScale; }
  function toCanvasY(ly) { return y + pad + ly * yScale; }

  // Build a map from node to pre-order index
  const nodeIndexMap = new Map();
  for (let i = 0; i < allNodes.length; i++) {
    nodeIndexMap.set(allNodes[i], i);
  }

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw edges only between revealed nodes (both parent and child index <= activeIndex)
  function drawRevealedEdges(node) {
    const parentIdx = nodeIndexMap.get(node);
    const nx = toCanvasX(node.layoutX);
    const ny = toCanvasY(node.layoutY);

    for (const child of node.children) {
      const childIdx = nodeIndexMap.get(child);
      if (parentIdx <= activeIndex && childIdx <= activeIndex) {
        ctx.save();
        ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
        ctx.lineWidth = theme.strokeWidth || 3;
        const childX = toCanvasX(child.layoutX);
        const childY = toCanvasY(child.layoutY);
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(childX, childY);
        ctx.stroke();
        ctx.restore();
      }
      drawRevealedEdges(child);
    }
  }

  drawRevealedEdges(instance);

  // Draw nodes with three-zone pattern
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const nx = toCanvasX(node.layoutX);
    const ny = toCanvasY(node.layoutY);
    const r = (i === 0) ? nodeRadius * 1.3 : nodeRadius;

    ctx.save();

    if (i < activeIndex) {
      // Processed: filled circle + border
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = (i === 0) ? 3 : 2;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (i === activeIndex) {
      // Active: filled circle + glow + border
      ctx.globalAlpha = 1.0;
      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = (i === 0) ? 3 : 2;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Unprocessed: faint outline only
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = (i === 0) ? 3 : 2;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
