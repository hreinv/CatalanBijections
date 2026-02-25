/**
 * Binary Trees to Triangulations Bijection Module
 *
 * Implements step-by-step animation for the correspondence between
 * binary tree internal nodes and triangles in a convex polygon.
 * Each internal node maps to exactly one triangle in the (n+2)-gon.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as binaryTree from '../structures/binary-tree.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'binary-tree',
  target: 'triangulation',
  label: 'Binary Trees to Triangulations',
};

// =============================================================================
// Tree Helpers (local implementations to avoid modifying structure modules)
// =============================================================================

/**
 * Count the number of internal nodes in a binary tree.
 * @param {Object|null} node
 * @returns {number}
 */
function countNodes(node) {
  if (node === null) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

/**
 * Collect (node, triangle) correspondence pairs via pre-order traversal.
 * Each internal node corresponds to the triangle [lo, apex, hi] where
 * apex = lo + leftSize + 1.
 *
 * @param {Object|null} node
 * @param {number} lo - Lower vertex index
 * @param {number} hi - Upper vertex index
 * @param {number} depth - Current tree depth
 * @param {Array} pairs - Accumulator
 */
function collectPairs(node, lo, hi, depth, pairs) {
  if (node === null) return;
  const leftSize = countNodes(node.left);
  const apex = lo + leftSize + 1;
  pairs.push({ node, triangle: [lo, apex, hi], depth });
  collectPairs(node.left, lo, apex, depth + 1, pairs);
  collectPairs(node.right, apex, hi, depth + 1, pairs);
}

/**
 * Assign layout coordinates using centered parent layout.
 * Root is at cx (horizontal center), children offset by ±gap which halves each level.
 * @param {Object|null} node
 * @param {number} cx - Horizontal center for this node
 * @param {number} depth - Current tree depth
 * @param {number} gap - Horizontal offset for children at this level
 */
function layoutCentered(node, cx, depth, gap) {
  if (node === null) return;
  node._layoutX = cx;
  node._layoutY = depth;
  const childGap = gap / 2;
  if (node.left !== null) layoutCentered(node.left, cx - gap, depth + 1, childGap);
  if (node.right !== null) layoutCentered(node.right, cx + gap, depth + 1, childGap);
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
 * Generate animation step sequence for binary-trees-to-triangulations bijection.
 *
 * Produces n+2 steps for a Dyck word of order n:
 *   Step 0:       Introduction -- show tree and polygon outline
 *   Steps 1..n:   One per node (pre-order) -- highlight node, reveal triangle
 *   Step n+1:     Completion -- full correspondence visible
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order
 * @param {boolean} [reversed=false] - If true, show Triangulations -> Binary Trees
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const tree = binaryTree.fromDyck(dyckWord);

  // Compute layout once — centered: root at x=0, children branch left/right
  layoutCentered(tree, 0, 0, 1.0);
  const maxDepth = getMaxDepth(tree);

  // Collect pre-order nodes for indexed coloring
  const nodes = [];
  preOrderNodes(tree, nodes);

  // Collect (node, triangle) correspondence pairs
  const pairs = [];
  collectPairs(tree, 0, n + 1, 0, pairs);

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the triangulation of the ${n + 2}-gon with ${n} triangles`
      : `Show the binary tree with ${n} internal nodes and the ${n + 2}-gon outline`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const treeBox = reversed ? targetBox : sourceBox;
      const polyBox = reversed ? sourceBox : targetBox;

      // Draw full binary tree at full opacity, default colors
      drawTreeIntro(ctx, tree, nodes, maxDepth, treeBox, theme);

      // Draw (n+2)-gon outline, no diagonals or fills
      drawPolygonOutline(ctx, n, polyBox, theme);
    },
  });

  // --- Steps 1..n: One per node/triangle pair ---
  for (let i = 0; i < pairs.length; i++) {
    const { triangle } = pairs[i];

    steps.push({
      description: reversed
        ? `Triangle ${i + 1}: triangle (${triangle[0]}, ${triangle[1]}, ${triangle[2]}) maps to internal node ${i + 1}`
        : `Node ${i + 1}: internal node maps to triangle (${triangle[0]}, ${triangle[1]}, ${triangle[2]})`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const treeBox = reversed ? targetBox : sourceBox;
        const polyBox = reversed ? sourceBox : targetBox;

        // Draw tree with three visual zones
        drawTreeWithZones(ctx, tree, nodes, maxDepth, treeBox, theme, colors, i);

        // Draw polygon outline then triangles with three visual zones
        drawPolygonOutline(ctx, n, polyBox, theme);
        drawTrianglesWithZones(ctx, pairs, n, polyBox, theme, colors, i, progress);
      },
    });
  }

  // --- Step n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each triangle in the ${n + 2}-gon maps to one internal node`
      : `Bijection complete: each internal node maps to one triangle in the ${n + 2}-gon`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const treeBox = reversed ? targetBox : sourceBox;
      const polyBox = reversed ? sourceBox : targetBox;

      // All nodes colored, all triangles filled
      drawTreeComplete(ctx, tree, nodes, maxDepth, treeBox, theme, colors);
      drawPolygonOutline(ctx, n, polyBox, theme);
      drawTrianglesComplete(ctx, pairs, n, polyBox, theme, colors);
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
 * Compute drawing parameters for the tree within a bounding box.
 * Uses centered layout coordinates where root is at x=0.
 */
function treeDrawParams(nodes, maxDepth, box, theme) {
  const nodeRadius = theme.nodeRadius || 16;
  const pad = nodeRadius + 4;

  // Find X extent from centered layout coordinates
  let extent = 0;
  for (const n of nodes) {
    extent = Math.max(extent, Math.abs(n._layoutX));
  }

  const xScale = extent > 0 ? (box.width / 2 - pad) / extent : 0;
  const yScale = maxDepth > 0 ? (box.height - pad * 2) / maxDepth : 0;
  const originX = box.x + box.width / 2;
  const originY = box.y + pad;
  return { nodeRadius, pad, xScale, yScale, originX, originY };
}

/**
 * Draw edges of the tree recursively.
 */
function drawEdges(ctx, node, params, theme) {
  if (node === null) return;

  const { originX, originY, xScale, yScale } = params;
  const nx = originX + node._layoutX * xScale;
  const ny = originY + node._layoutY * yScale;

  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;

  if (node.left !== null) {
    const lx = originX + node.left._layoutX * xScale;
    const ly = originY + node.left._layoutY * yScale;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(lx, ly);
    ctx.stroke();
  }
  if (node.right !== null) {
    const rx = originX + node.right._layoutX * xScale;
    const ry = originY + node.right._layoutY * yScale;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }

  drawEdges(ctx, node.left, params, theme);
  drawEdges(ctx, node.right, params, theme);
}

/**
 * Draw the full tree at intro step: all nodes in default color, full opacity.
 */
function drawTreeIntro(ctx, tree, nodes, maxDepth, box, theme) {
  if (tree === null) return;
  const params = treeDrawParams(nodes, maxDepth, box, theme);

  // Draw edges
  drawEdges(ctx, tree, params, theme);

  // Draw nodes in default color
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
 * Draw the tree with three visual zones based on active index.
 * - Already processed (j < activeIndex): full opacity, correspondence color
 * - Active (j === activeIndex): full opacity, correspondence color, pulsing glow
 * - Not yet processed (j > activeIndex): dimmed, default color
 */
function drawTreeWithZones(ctx, tree, nodes, maxDepth, box, theme, colors, activeIndex) {
  if (tree === null) return;
  const params = treeDrawParams(nodes, maxDepth, box, theme);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw edges first (behind nodes)
  // Edges for processed/active nodes get their color; pending edges are dimmed
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
      if (j <= activeIndex) {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = colors[j % colors.length];
      } else {
        ctx.globalAlpha = 0.25;
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
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j];
    const nx = params.originX + node._layoutX * params.xScale;
    const ny = params.originY + node._layoutY * params.yScale;

    ctx.save();

    if (j < activeIndex) {
      // Already processed: full color, no glow
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[j % colors.length];
    } else if (j === activeIndex) {
      // Active: full color, pulsing glow
      ctx.globalAlpha = 1.0;
      const color = colors[j % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
    } else {
      // Not yet processed: dimmed
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
 * Draw the tree with all nodes at full opacity with correspondence colors (completion step).
 */
function drawTreeComplete(ctx, tree, nodes, maxDepth, box, theme, colors) {
  if (tree === null) return;
  const params = treeDrawParams(nodes, maxDepth, box, theme);

  // Draw colored edges
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

  // Draw colored nodes
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
// Drawing Helpers: Polygon / Triangulation
// =============================================================================

/**
 * Compute polygon vertex positions for (n+2)-gon centered in a box.
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @returns {{ vertices: Array<{px: number, py: number}>, cx: number, cy: number, radius: number }}
 */
function polygonParams(n, box) {
  const numVertices = n + 2;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const radius = Math.min(box.width, box.height) / 2 - 30;

  const vertices = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / numVertices;
    vertices.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
    });
  }
  return { vertices, cx, cy, radius };
}

/**
 * Draw the (n+2)-gon outline with vertex labels. No diagonals or fills.
 */
function drawPolygonOutline(ctx, n, box, theme) {
  const { vertices, cx, cy, radius } = polygonParams(n, box);
  const numVertices = n + 2;
  const fontFamily = theme.fontFamily || 'sans-serif';

  // Draw polygon edges
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(vertices[0].px, vertices[0].py);
  for (let i = 1; i < numVertices; i++) {
    ctx.lineTo(vertices[i].px, vertices[i].py);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw vertex labels outside the polygon
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < numVertices; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / numVertices;
    const lx = cx + (radius + 18) * Math.cos(angle);
    const ly = cy + (radius + 18) * Math.sin(angle);
    ctx.fillText(String(i), lx, ly);
  }
}

/**
 * Draw triangles with three visual zones based on active index.
 * - Already processed (j < activeIndex): full color fill + diagonals
 * - Active (j === activeIndex): animated fill (progress-based opacity), glowing diagonals
 * - Not yet processed (j > activeIndex): not drawn
 */
function drawTrianglesWithZones(ctx, pairs, n, box, theme, colors, activeIndex, progress) {
  const { vertices } = polygonParams(n, box);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let j = 0; j <= activeIndex && j < pairs.length; j++) {
    const tri = pairs[j].triangle;
    const v0 = vertices[tri[0]];
    const v1 = vertices[tri[1]]; // apex
    const v2 = vertices[tri[2]];
    const color = colors[j % colors.length];

    ctx.save();

    if (j < activeIndex) {
      // Already processed: full opacity fill + diagonals
      ctx.globalAlpha = 1.0;

      // Fill triangle with semi-transparent color
      ctx.fillStyle = color + '40';
      ctx.beginPath();
      ctx.moveTo(v0.px, v0.py);
      ctx.lineTo(v1.px, v1.py);
      ctx.lineTo(v2.px, v2.py);
      ctx.closePath();
      ctx.fill();

      // Draw diagonals (only non-edge diagonals)
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
      drawDiagonals(ctx, tri, vertices, n);
    } else if (j === activeIndex) {
      // Active: animate fill and glow diagonals
      ctx.globalAlpha = progress;

      // Fill with animated opacity
      ctx.fillStyle = color + '40';
      ctx.beginPath();
      ctx.moveTo(v0.px, v0.py);
      ctx.lineTo(v1.px, v1.py);
      ctx.lineTo(v2.px, v2.py);
      ctx.closePath();
      ctx.fill();

      // Glowing diagonals
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
      drawDiagonals(ctx, tri, vertices, n);
    }

    ctx.restore();
  }
}

/**
 * Draw the diagonals of a triangle (skip polygon edges -- adjacent vertices).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number[]} tri - [lo, apex, hi]
 * @param {Array<{px: number, py: number}>} vertices
 * @param {number} n - Catalan order
 */
function drawDiagonals(ctx, tri, vertices, n) {
  const numVertices = n + 2;
  const pairs = [
    [tri[0], tri[1]],
    [tri[1], tri[2]],
  ];

  for (const [a, b] of pairs) {
    // Only draw if not an adjacent polygon edge
    const diff = Math.abs(a - b);
    const isEdge = diff === 1 || diff === numVertices - 1;
    if (!isEdge) {
      ctx.beginPath();
      ctx.moveTo(vertices[a].px, vertices[a].py);
      ctx.lineTo(vertices[b].px, vertices[b].py);
      ctx.stroke();
    }
  }
}

/**
 * Draw all triangles at full opacity with correspondence colors (completion step).
 */
function drawTrianglesComplete(ctx, pairs, n, box, theme, colors) {
  const { vertices } = polygonParams(n, box);

  for (let j = 0; j < pairs.length; j++) {
    const tri = pairs[j].triangle;
    const v0 = vertices[tri[0]];
    const v1 = vertices[tri[1]];
    const v2 = vertices[tri[2]];
    const color = colors[j % colors.length];

    ctx.save();
    ctx.globalAlpha = 1.0;

    // Fill triangle
    ctx.fillStyle = color + '40';
    ctx.beginPath();
    ctx.moveTo(v0.px, v0.py);
    ctx.lineTo(v1.px, v1.py);
    ctx.lineTo(v2.px, v2.py);
    ctx.closePath();
    ctx.fill();

    // Draw diagonals
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
    drawDiagonals(ctx, tri, vertices, n);

    ctx.restore();
  }
}
