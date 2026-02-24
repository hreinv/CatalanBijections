/**
 * Non-crossing Partitions to Triangulations Bijection Module
 *
 * Implements step-by-step animation for the correspondence between
 * non-crossing partition elements and triangles in a convex polygon.
 * Both structures derive from the same Dyck word: the i-th matched pair
 * creates NCP element i (by opening position) and corresponds to
 * triangle i (by pre-order tree traversal).
 *
 * CRITICAL: NCP elements are colored individually by element index
 * (not by block) to match per-triangle correspondence colors.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as nonCrossingPartition from '../structures/non-crossing-partition.js';
import * as triangulation from '../structures/triangulation.js';
import * as binaryTree from '../structures/binary-tree.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'non-crossing-partition',
  target: 'triangulation',
  label: 'Non-crossing Partitions to Triangulations',
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
 * @param {Array} pairs - Accumulator of { triangle: [lo, apex, hi] }
 */
function collectTrianglePairs(node, lo, hi, pairs) {
  if (node === null) return;
  const leftSize = countNodes(node.left);
  const apex = lo + leftSize + 1;
  pairs.push({ triangle: [lo, apex, hi] });
  collectTrianglePairs(node.left, lo, apex, pairs);
  collectTrianglePairs(node.right, apex, hi, pairs);
}

// =============================================================================
// Correspondence Computation
// =============================================================================

/**
 * Build the correspondence map between NCP elements and triangles.
 *
 * The correspondence is: the i-th +1 in the Dyck word creates both
 * NCP element i and binary tree node i (pre-order). Pre-order traversal
 * of the binary tree determines triangle order (same as binary-triang.js).
 * So NCP element i (by opening order) corresponds to triangle i (by pre-order).
 *
 * Also builds elementToBlock map for drawing block arcs.
 *
 * @param {number[]} dyckWord
 * @param {number} n
 * @returns {{ trianglePairs: Array, elementToBlock: number[], partition: Array<Array<number>> }}
 */
function buildCorrespondence(dyckWord, n) {
  // Build the binary tree and collect triangle pairs in pre-order
  const tree = binaryTree.fromDyck(dyckWord);
  const trianglePairs = [];
  collectTrianglePairs(tree, 0, n + 1, trianglePairs);

  // Build the NCP to get block structure
  const ncpInstance = nonCrossingPartition.fromDyck(dyckWord);
  const partition = ncpInstance.partition;

  // Build elementToBlock: map element index (0-indexed) -> block index
  // NCP elements are 1-indexed in partition, so element i (0-indexed) = element i+1 (1-indexed)
  const elementToBlock = new Array(n).fill(0);
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    for (const elem of partition[bIdx]) {
      elementToBlock[elem - 1] = bIdx; // elem is 1-indexed
    }
  }

  return { trianglePairs, elementToBlock, partition };
}

// =============================================================================
// Step Generation
// =============================================================================

/**
 * Generate animation step sequence for NCP-to-triangulations bijection.
 *
 * Produces n+2 steps for a Dyck word of order n:
 *   Step 0:       Introduction -- show NCP on circle and polygon outline
 *   Steps 1..n:   One per element/triangle pair -- highlight element, reveal triangle
 *   Step n+1:     Completion -- full correspondence visible
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order
 * @param {boolean} [reversed=false] - If true, show Triangulations -> Non-crossing Partitions
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const { trianglePairs, elementToBlock, partition } = buildCorrespondence(dyckWord, n);

  // Pre-compute NCP circle points (n points evenly on circle, starting top)
  const ncpPoints = [];
  for (let k = 0; k < n; k++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * k) / n;
    ncpPoints.push({ angle });
  }

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the triangulation of the ${n + 2}-gon with ${n} triangles`
      : `Start with the non-crossing partition of {1, ..., ${n}} on a circle`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const ncpBox = reversed ? targetBox : sourceBox;
      const polyBox = reversed ? sourceBox : targetBox;

      // Draw NCP at default color on circle
      drawNCPIntro(ctx, n, ncpPoints, partition, elementToBlock, ncpBox, theme);

      // Draw (n+2)-gon outline, no diagonals or fills
      drawPolygonOutline(ctx, n, polyBox, theme);
    },
  });

  // --- Steps 1..n: One per element/triangle pair ---
  for (let i = 0; i < n; i++) {
    const tri = trianglePairs[i].triangle;

    steps.push({
      description: reversed
        ? `Triangle ${i + 1}: triangle (${tri[0]}, ${tri[1]}, ${tri[2]}) maps to partition element ${i + 1}`
        : `Element ${i + 1}: partition point maps to triangle (${tri[0]}, ${tri[1]}, ${tri[2]})`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const ncpBox = reversed ? targetBox : sourceBox;
        const polyBox = reversed ? sourceBox : targetBox;

        // Draw NCP with three visual zones
        drawNCPWithZones(ctx, n, ncpPoints, partition, elementToBlock, ncpBox, theme, colors, i);

        // Draw polygon outline then triangles with three visual zones
        drawPolygonOutline(ctx, n, polyBox, theme);
        drawTrianglesWithZones(ctx, trianglePairs, n, polyBox, theme, colors, i, progress);
      },
    });
  }

  // --- Step n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each triangle in the ${n + 2}-gon maps to one partition element`
      : `Bijection complete: each partition element maps to one triangle in the ${n + 2}-gon`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const ncpBox = reversed ? targetBox : sourceBox;
      const polyBox = reversed ? sourceBox : targetBox;

      // All NCP elements colored, all triangles filled
      drawNCPComplete(ctx, n, ncpPoints, partition, elementToBlock, ncpBox, theme, colors);
      drawPolygonOutline(ctx, n, polyBox, theme);
      drawTrianglesComplete(ctx, trianglePairs, n, polyBox, theme, colors);
    },
  });

  // Reverse step order for reversed direction
  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Non-crossing Partition (NCP)
// =============================================================================

/**
 * Compute NCP circle layout parameters within a bounding box.
 * @param {number} n - Number of elements
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @returns {{ cx: number, cy: number, radius: number, pointRadius: number }}
 */
function ncpCircleParams(n, box) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const radius = Math.min(box.width, box.height) / 2 - 30;
  const pointRadius = 6;
  return { cx, cy, radius, pointRadius };
}

/**
 * Get canvas position for NCP point k (0-indexed).
 */
function ncpPointPos(k, n, cx, cy, radius) {
  const angle = -Math.PI / 2 + (2 * Math.PI * k) / n;
  return {
    px: cx + radius * Math.cos(angle),
    py: cy + radius * Math.sin(angle),
    angle,
  };
}

/**
 * Draw block arcs between elements of the same block.
 * Arcs are quadratic curves bowed toward center (matching non-crossing-partition.js).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<number>>} partition - Blocks of 1-indexed elements
 * @param {number} n
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {string} color - Stroke color for the arcs
 * @param {number} alpha - Global alpha for arcs
 */
function drawBlockArcs(ctx, partition, blockIdx, n, cx, cy, radius, color, alpha) {
  const block = partition[blockIdx];
  if (block.length < 2) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  // Draw arcs between all pairs of elements in the block
  for (let j = 0; j < block.length; j++) {
    for (let k = j + 1; k < block.length; k++) {
      const p1 = ncpPointPos(block[j] - 1, n, cx, cy, radius); // 1-indexed -> 0-indexed
      const p2 = ncpPointPos(block[k] - 1, n, cx, cy, radius);

      // Control point: midpoint bowed 30% toward center
      const midX = (p1.px + p2.px) / 2;
      const midY = (p1.py + p2.py) / 2;
      const controlX = midX + (cx - midX) * 0.3;
      const controlY = midY + (cy - midY) * 0.3;

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.quadraticCurveTo(controlX, controlY, p2.px, p2.py);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draw NCP at intro step: all elements default color, full opacity.
 */
function drawNCPIntro(ctx, n, ncpPoints, partition, elementToBlock, box, theme) {
  if (n === 0) return;

  const { cx, cy, radius, pointRadius } = ncpCircleParams(n, box);
  const fontFamily = theme.fontFamily || 'sans-serif';

  // Draw block arcs in default color
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    drawBlockArcs(ctx, partition, bIdx, n, cx, cy, radius, theme.strokeColor || '#1A1A1A', 1.0);
  }

  // Draw filled circles at each point
  for (let k = 0; k < n; k++) {
    const pos = ncpPointPos(k, n, cx, cy, radius);

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, pointRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, pointRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Draw labels outside the circle
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < n; k++) {
    const pos = ncpPointPos(k, n, cx, cy, radius);
    const lx = cx + (radius + 18) * Math.cos(pos.angle);
    const ly = cy + (radius + 18) * Math.sin(pos.angle);
    ctx.fillText(String(k + 1), lx, ly);
  }
}

/**
 * Draw NCP with three visual zones based on active element index.
 *
 * CRITICAL (Pitfall 5): Colors NCP elements INDIVIDUALLY by element index
 * (not by block) to match triangle correspondence.
 *
 * - Already processed (elemIdx < activeIndex): full opacity, correspondence color
 * - Active (elemIdx === activeIndex): full opacity, pulsing glow
 * - Not yet processed (elemIdx > activeIndex): dimmed, default color
 *
 * Block arcs colored by the most recently processed element in the block,
 * or dimmed if no element in the block is processed yet.
 */
function drawNCPWithZones(ctx, n, ncpPoints, partition, elementToBlock, box, theme, colors, activeIndex) {
  if (n === 0) return;

  const { cx, cy, radius, pointRadius } = ncpCircleParams(n, box);
  const fontFamily = theme.fontFamily || 'sans-serif';
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw block arcs: color by most recently processed element in the block
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    const block = partition[bIdx];
    // Find the most recently processed element in this block
    let mostRecentProcessed = -1;
    for (const elem of block) {
      const elemIdx = elem - 1; // 1-indexed -> 0-indexed
      if (elemIdx <= activeIndex) {
        mostRecentProcessed = elemIdx;
      }
    }

    if (mostRecentProcessed >= 0) {
      drawBlockArcs(ctx, partition, bIdx, n, cx, cy, radius, colors[mostRecentProcessed % colors.length], 1.0);
    } else {
      drawBlockArcs(ctx, partition, bIdx, n, cx, cy, radius, theme.strokeColor || '#1A1A1A', 0.25);
    }
  }

  // Draw NCP points with three zones
  for (let k = 0; k < n; k++) {
    const pos = ncpPointPos(k, n, cx, cy, radius);

    ctx.save();

    if (k < activeIndex) {
      // Already processed: full color
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[k % colors.length];
    } else if (k === activeIndex) {
      // Active: full color, pulsing glow
      ctx.globalAlpha = 1.0;
      const color = colors[k % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
    } else {
      // Not yet processed: dimmed
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }

    ctx.beginPath();
    ctx.arc(pos.px, pos.py, pointRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Point border
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, pointRadius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  // Draw labels outside the circle
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < n; k++) {
    const pos = ncpPointPos(k, n, cx, cy, radius);
    const lx = cx + (radius + 18) * Math.cos(pos.angle);
    const ly = cy + (radius + 18) * Math.sin(pos.angle);
    ctx.fillText(String(k + 1), lx, ly);
  }
}

/**
 * Draw NCP with all elements at full opacity with correspondence colors (completion step).
 */
function drawNCPComplete(ctx, n, ncpPoints, partition, elementToBlock, box, theme, colors) {
  if (n === 0) return;

  const { cx, cy, radius, pointRadius } = ncpCircleParams(n, box);
  const fontFamily = theme.fontFamily || 'sans-serif';

  // Draw block arcs: color by last element in the block
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    const block = partition[bIdx];
    const lastElem = block[block.length - 1] - 1; // 0-indexed
    drawBlockArcs(ctx, partition, bIdx, n, cx, cy, radius, colors[lastElem % colors.length], 1.0);
  }

  // Draw all points at full opacity with correspondence colors
  for (let k = 0; k < n; k++) {
    const pos = ncpPointPos(k, n, cx, cy, radius);

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[k % colors.length];
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, pointRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, pointRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Draw labels outside the circle
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < n; k++) {
    const pos = ncpPointPos(k, n, cx, cy, radius);
    const lx = cx + (radius + 18) * Math.cos(pos.angle);
    const ly = cy + (radius + 18) * Math.sin(pos.angle);
    ctx.fillText(String(k + 1), lx, ly);
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
 * Draw triangles with three visual zones based on active index.
 * - Already processed (j < activeIndex): filled + diagonals with correspondence color
 * - Active (j === activeIndex): filled + glowing diagonals
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
      // Already processed: semi-transparent fill + diagonals
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(v0.px, v0.py);
      ctx.lineTo(v1.px, v1.py);
      ctx.lineTo(v2.px, v2.py);
      ctx.closePath();
      ctx.fill();

      // Draw diagonals (non-edge only)
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
      drawDiagonals(ctx, tri, vertices, n);
    } else if (j === activeIndex) {
      // Active: animated fill and glowing diagonals
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;
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

    // Fill triangle with semi-transparent color
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(v0.px, v0.py);
    ctx.lineTo(v1.px, v1.py);
    ctx.lineTo(v2.px, v2.py);
    ctx.closePath();
    ctx.fill();

    // Draw diagonals
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
    drawDiagonals(ctx, tri, vertices, n);

    ctx.restore();
  }
}
