/**
 * Dyck Path Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A Dyck path is a lattice path from (0,0) to (2n,0) with steps
 * (+1,+1) for each +1 in the word and (+1,-1) for each -1.
 * The path never goes below the x-axis.
 *
 * Instance representation: { points: Array<{x, y}> }
 */

/**
 * Convert a Dyck word to a sequence of (x, y) points for the lattice path.
 * Starting at (0, 0), +1 moves to (x+1, y+1), -1 moves to (x+1, y-1).
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {{ points: Array<{x: number, y: number}> }}
 */
export function fromDyck(dyckWord) {
  const points = [{ x: 0, y: 0 }];
  let cx = 0, cy = 0;
  for (const step of dyckWord) {
    cx += 1;
    cy += step; // +1 for up, -1 for down
    points.push({ x: cx, y: cy });
  }
  return { points };
}

/**
 * Reconstruct a Dyck word from a Dyck path instance.
 * Computes y-deltas between consecutive points.
 *
 * @param {{ points: Array<{x: number, y: number}> }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  const { points } = instance;
  const word = [];
  for (let i = 1; i < points.length; i++) {
    word.push(points[i].y - points[i - 1].y);
  }
  return word;
}

/**
 * Draw the Dyck lattice path within the bounding box.
 * Draws grid lines, the x-axis, the path, and colored circles at vertices.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ points: Array<{x: number, y: number}> }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { points } = instance;

  if (points.length <= 1) return;

  const n = (points.length - 1) / 2; // Order
  const padding = 20;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // Scaling: x ranges 0..2n, y ranges 0..n
  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  // Convert grid coords to canvas coords
  // y=0 is at the bottom of the drawing area, y=n at top
  function toCanvasX(gx) { return x + padding + gx * scaleX; }
  function toCanvasY(gy) { return y + padding + (n - gy) * scaleY; }

  // Draw grid lines
  ctx.strokeStyle = theme.gridLine || '#E0E0E0';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 2 * n; gx++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(gx), toCanvasY(n));
    ctx.lineTo(toCanvasX(gx), toCanvasY(0));
    ctx.stroke();
  }
  for (let gy = 0; gy <= n; gy++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(gy));
    ctx.lineTo(toCanvasX(2 * n), toCanvasY(gy));
    ctx.stroke();
  }

  // Emphasize x-axis (y=0 line)
  ctx.strokeStyle = theme.gridLine || '#E0E0E0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(2 * n), toCanvasY(0));
  ctx.stroke();

  // Draw the path
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.stroke();

  // Draw colored circles at each point on the path
  const circleRadius = Math.max(4, Math.min(scaleX, scaleY) * 0.2);
  for (let i = 0; i < points.length; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), circleRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
