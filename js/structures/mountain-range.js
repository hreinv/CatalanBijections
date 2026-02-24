/**
 * Mountain Range Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A mountain range is the same lattice path as a Dyck path, but rendered
 * as a filled mountain silhouette (no grid lines, filled area under curve,
 * peaks marked with colored dots).
 *
 * Instance representation: { points: Array<{x, y}> }
 */

/**
 * Convert a Dyck word to a sequence of (x, y) points for the mountain range.
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
 * Reconstruct a Dyck word from a mountain range instance.
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
 * Draw the mountain range as a filled silhouette within the bounding box.
 * No grid lines. Filled area under the profile, thick outline, peak markers.
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

  const baseY = toCanvasY(0);
  const startX = toCanvasX(points[0].x);
  const endX = toCanvasX(points[points.length - 1].x);

  // Fill the area under the mountain profile
  ctx.fillStyle = colors[0] + '30';
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  // Close to baseline
  ctx.lineTo(endX, baseY);
  ctx.lineTo(startX, baseY);
  ctx.closePath();
  ctx.fill();

  // Draw the mountain outline with thick strokes
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.stroke();

  // Draw a thin baseline at y=0
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, baseY);
  ctx.lineTo(endX, baseY);
  ctx.stroke();

  // Mark peaks (local maxima) with colored dots
  const peakRadius = Math.max(5, Math.min(scaleX, scaleY) * 0.25);
  let colorIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    if (points[i].y > points[i - 1].y && points[i].y > points[i + 1].y) {
      ctx.fillStyle = colors[colorIdx % colors.length];
      ctx.beginPath();
      ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), peakRadius, 0, Math.PI * 2);
      ctx.fill();
      colorIdx++;
    }
  }
}
