/**
 * Polygon Triangulation Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * Converts Dyck words to triangulations via a binary tree intermediate bijection.
 * Each binary tree node corresponds to a triangle in the (n+2)-gon.
 *
 * Instance representation: { n, diagonals: Array<{from, to}>, numVertices }
 */

// --- Internal helpers: Binary tree construction (independent of binary-tree.js) ---

/**
 * Build binary tree from Dyck word using 1L0R decomposition.
 * (Local implementation to keep modules independent.)
 *
 * @param {number[]} dyckWord
 * @returns {{ left: Object|null, right: Object|null }|null}
 */
function buildTree(dyckWord) {
  if (dyckWord.length === 0) return null;

  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < dyckWord.length; i++) {
    depth += dyckWord[i];
    if (depth === 0) {
      splitIdx = i;
      break;
    }
  }

  const leftWord = dyckWord.slice(1, splitIdx);
  const rightWord = dyckWord.slice(splitIdx + 1);

  return {
    left: buildTree(leftWord),
    right: buildTree(rightWord),
  };
}

/**
 * Serialize a binary tree to a Dyck word (1L0R).
 * @param {Object|null} node
 * @returns {number[]}
 */
function treeToDyck(node) {
  if (node === null) return [];
  return [1, ...treeToDyck(node.left), -1, ...treeToDyck(node.right)];
}

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
 * Map a binary tree to triangulation diagonals.
 * Each internal node creates a triangle with apex vertex at lo + leftSize + 1.
 *
 * @param {Object|null} node
 * @param {number} lo - Lower vertex index of current edge
 * @param {number} hi - Upper vertex index of current edge
 * @param {Array<{from: number, to: number}>} diagonals - Accumulator
 */
function treeToTriangulation(node, lo, hi, diagonals) {
  if (node === null) return;

  const leftSize = countNodes(node.left);
  const apex = lo + leftSize + 1;

  // Add diagonals only if they are not polygon edges (adjacent vertices)
  if (apex - lo > 1) diagonals.push({ from: lo, to: apex });
  if (hi - apex > 1) diagonals.push({ from: apex, to: hi });

  // Recurse: left subtree gets polygon segment [lo, apex]
  //          right subtree gets polygon segment [apex, hi]
  treeToTriangulation(node.left, lo, apex, diagonals);
  treeToTriangulation(node.right, apex, hi, diagonals);
}

/**
 * Reconstruct binary tree from triangulation diagonals.
 * Finds the apex that splits edge (lo, hi) by looking for a vertex
 * that forms a triangle with lo and hi.
 *
 * @param {Array<{from: number, to: number}>} diagonals
 * @param {number} lo
 * @param {number} hi
 * @returns {Object|null}
 */
function triangulationToTree(diagonals, lo, hi) {
  // Base case: adjacent vertices, no triangle possible
  if (hi - lo < 2) return null;

  // Find the apex: the vertex between lo and hi that forms a triangle
  // The apex has edges to both lo and hi (either as polygon edges or diagonals)
  for (let apex = lo + 1; apex < hi; apex++) {
    const hasLoEdge = (apex - lo === 1) || diagonals.some(d =>
      (d.from === lo && d.to === apex) || (d.from === apex && d.to === lo)
    );
    const hasHiEdge = (hi - apex === 1) || diagonals.some(d =>
      (d.from === apex && d.to === hi) || (d.from === hi && d.to === apex)
    );

    if (hasLoEdge && hasHiEdge) {
      return {
        left: triangulationToTree(diagonals, lo, apex),
        right: triangulationToTree(diagonals, apex, hi),
      };
    }
  }

  return null;
}

/**
 * Convert a Dyck word to a triangulation of the convex (n+2)-gon.
 *
 * @param {number[]} dyckWord - Dyck word of order n
 * @returns {{ n: number, diagonals: Array<{from: number, to: number}>, numVertices: number }}
 */
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const numVertices = n + 2;

  const tree = buildTree(dyckWord);
  const diagonals = [];
  treeToTriangulation(tree, 0, numVertices - 1, diagonals);

  return { n, diagonals, numVertices };
}

/**
 * Convert a triangulation back to its Dyck word.
 * Reverses the process: reconstruct binary tree from diagonals, then serialize.
 *
 * @param {{ n: number, diagonals: Array<{from: number, to: number}>, numVertices: number }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  const { diagonals, numVertices } = instance;
  const tree = triangulationToTree(diagonals, 0, numVertices - 1);
  return treeToDyck(tree);
}

/**
 * Find all triangles in a triangulation by decomposing from the root edge.
 *
 * @param {Array<{from: number, to: number}>} diagonals
 * @param {number} lo
 * @param {number} hi
 * @param {Array<Array<number>>} triangles - Accumulator of [v0, v1, v2] triples
 */
function findTriangles(diagonals, lo, hi, triangles) {
  if (hi - lo < 2) return;

  for (let apex = lo + 1; apex < hi; apex++) {
    const hasLoEdge = (apex - lo === 1) || diagonals.some(d =>
      (d.from === lo && d.to === apex) || (d.from === apex && d.to === lo)
    );
    const hasHiEdge = (hi - apex === 1) || diagonals.some(d =>
      (d.from === apex && d.to === hi) || (d.from === hi && d.to === apex)
    );

    if (hasLoEdge && hasHiEdge) {
      triangles.push([lo, apex, hi]);
      findTriangles(diagonals, lo, apex, triangles);
      findTriangles(diagonals, apex, hi, triangles);
      break;
    }
  }
}

/**
 * Draw triangulation: regular polygon with diagonals and optional triangle fill.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, diagonals: Array<{from: number, to: number}>, numVertices: number }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { numVertices, diagonals } = instance;

  if (numVertices < 3) return;

  // Place vertices on a circle (counterclockwise, starting from top)
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2 - 30;

  const vertices = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / numVertices;
    vertices.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
    });
  }

  // Find and fill triangles with semi-transparent colors
  const triangles = [];
  findTriangles(diagonals, 0, numVertices - 1, triangles);
  for (let i = 0; i < triangles.length; i++) {
    const [v0, v1, v2] = triangles[i];
    ctx.fillStyle = colors[i % colors.length] + '40'; // Add alpha for transparency
    ctx.beginPath();
    ctx.moveTo(vertices[v0].px, vertices[v0].py);
    ctx.lineTo(vertices[v1].px, vertices[v1].py);
    ctx.lineTo(vertices[v2].px, vertices[v2].py);
    ctx.closePath();
    ctx.fill();
  }

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

  // Draw diagonals with slightly thinner stroke
  ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
  ctx.setLineDash([6, 4]);
  for (const d of diagonals) {
    ctx.beginPath();
    ctx.moveTo(vertices[d.from].px, vertices[d.from].py);
    ctx.lineTo(vertices[d.to].px, vertices[d.to].py);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw vertex labels outside the circle
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  const fontFamily = theme.fontFamily || 'sans-serif';
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
 * Return the number of triangles in the triangulation.
 * @param {{ n: number, diagonals: Array<{from: number, to: number}>, numVertices: number }} instance
 * @returns {number}
 */
export function elementCount(instance) {
  const triangles = [];
  findTriangles(instance.diagonals, 0, instance.numVertices - 1, triangles);
  return triangles.length;
}

/**
 * Draw triangulation progressively with three-zone highlighting.
 * Polygon outline and vertex labels are always visible.
 * Triangles use three-zone: processed = fill + diagonals, active = fill + glow + diagonals,
 * unprocessed = no fill, no diagonals.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, diagonals: Array<{from: number, to: number}>, numVertices: number }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  const { x, y, width, height, theme, colors, activeIndex, progress } = opts;
  const { numVertices, diagonals } = instance;

  if (numVertices < 3) return;

  // Place vertices on a circle (same as draw)
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2 - 30;

  const vertices = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / numVertices;
    vertices.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
    });
  }

  // Find triangles
  const triangles = [];
  findTriangles(diagonals, 0, numVertices - 1, triangles);

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw triangles with three-zone pattern
  for (let i = 0; i < triangles.length; i++) {
    const [v0, v1, v2] = triangles[i];
    ctx.save();

    if (i < activeIndex) {
      // Processed: semi-transparent fill + diagonals
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length] + '40';
      ctx.beginPath();
      ctx.moveTo(vertices[v0].px, vertices[v0].py);
      ctx.lineTo(vertices[v1].px, vertices[v1].py);
      ctx.lineTo(vertices[v2].px, vertices[v2].py);
      ctx.closePath();
      ctx.fill();

      // Draw diagonals for this triangle
      _drawTriangleDiagonals(ctx, vertices, v0, v1, v2, theme);
    } else if (i === activeIndex) {
      // Active: fill + glow + diagonals
      ctx.globalAlpha = 1.0;
      const color = colors[i % colors.length];
      ctx.fillStyle = color + '40';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.beginPath();
      ctx.moveTo(vertices[v0].px, vertices[v0].py);
      ctx.lineTo(vertices[v1].px, vertices[v1].py);
      ctx.lineTo(vertices[v2].px, vertices[v2].py);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw diagonals for this triangle
      _drawTriangleDiagonals(ctx, vertices, v0, v1, v2, theme);
    }
    // Unprocessed (i > activeIndex): no fill, no diagonals

    ctx.restore();
  }

  // Draw polygon edges (always visible at full opacity)
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(vertices[0].px, vertices[0].py);
  for (let i = 1; i < numVertices; i++) {
    ctx.lineTo(vertices[i].px, vertices[i].py);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw vertex labels (always visible)
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  const fontFamily = theme.fontFamily || 'sans-serif';
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
 * Draw the diagonals (non-edge sides) of a single triangle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} vertices
 * @param {number} v0
 * @param {number} v1
 * @param {number} v2
 * @param {Object} theme
 */
function _drawTriangleDiagonals(ctx, vertices, v0, v1, v2, theme) {
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = Math.max(1, (theme.strokeWidth || 3) - 1);
  ctx.setLineDash([6, 4]);

  const pairs = [[v0, v1], [v1, v2], [v0, v2]];
  for (const [a, b] of pairs) {
    if (Math.abs(a - b) > 1) {
      ctx.beginPath();
      ctx.moveTo(vertices[a].px, vertices[a].py);
      ctx.lineTo(vertices[b].px, vertices[b].py);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}
