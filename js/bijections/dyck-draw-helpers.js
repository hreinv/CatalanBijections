/**
 * Shared Dyck Path Drawing Helpers
 *
 * Provides reusable drawing functions for Dyck paths on an n × n grid
 * with North (N) and East (E) steps, staying weakly above the diagonal y = x.
 *
 * Used by parens-dyck.js, ballot-dyck.js, and dyck-mountain.js bijection
 * modules to avoid code duplication.
 */

/**
 * Compute layout parameters for drawing on an n × n grid.
 * Grid is centered in the bounding box with y-inversion (0,0 at bottom-left).
 *
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @returns {{ cellSize: number, toCanvasX: Function, toCanvasY: Function }}
 */
function dyckParams(n, box) {
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const cellSize = Math.min(drawWidth / n, drawHeight / n);
  const gridWidth = cellSize * n;
  const gridHeight = cellSize * n;

  const offsetX = box.x + padding + (drawWidth - gridWidth) / 2;
  const offsetY = box.y + padding + (drawHeight - gridHeight) / 2;

  function toCanvasX(gx) { return offsetX + gx * cellSize; }
  function toCanvasY(gy) { return offsetY + (n - gy) * cellSize; }

  return { cellSize, toCanvasX, toCanvasY };
}

/**
 * Draw the n × n grid with a dashed diagonal from (0,0) to (n,n).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 */
export function drawDyckGrid(ctx, n, box, theme) {
  const { toCanvasX, toCanvasY } = dyckParams(n, box);

  // Draw grid lines
  ctx.strokeStyle = theme.gridLine || '#E0E0E0';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= n; gx++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(gx), toCanvasY(0));
    ctx.lineTo(toCanvasX(gx), toCanvasY(n));
    ctx.stroke();
  }
  for (let gy = 0; gy <= n; gy++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(gy));
    ctx.lineTo(toCanvasX(n), toCanvasY(gy));
    ctx.stroke();
  }

  // Draw diagonal y = x as a dashed line
  ctx.save();
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(n), toCanvasY(n));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draw the full Dyck path at default color for intro steps (no correspondence colors).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x: number, y: number}>} points - Path vertices
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 */
export function drawDyckPathIntro(ctx, points, n, box, theme) {
  const { cellSize, toCanvasX, toCanvasY } = dyckParams(n, box);

  const strokeWidth = theme.strokeWidth || 3;
  const dotRadius = Math.max(3, cellSize * 0.1);

  // Draw path line
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.stroke();
  ctx.restore();

  // Draw vertex dots
  for (let i = 0; i < points.length; i++) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    ctx.beginPath();
    ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draw Dyck path segments with three visual zones and animated active segment.
 *
 * - Processed (i < activeIndex): full opacity, correspondence color
 * - Active (i === activeIndex): animated with pulsing glow
 * - Unprocessed (i > activeIndex): not drawn
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x: number, y: number}>} points - Path vertices
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 * @param {string[]} colors - Correspondence colors
 * @param {number} activeIndex - Currently active segment index
 * @param {number} segCount - Total segments (2n)
 * @param {number} progress - Animation progress [0,1] for active segment
 */
export function drawDyckSegments(ctx, points, n, box, theme, colors, activeIndex, segCount, progress) {
  const { cellSize, toCanvasX, toCanvasY } = dyckParams(n, box);

  const strokeWidth = theme.strokeWidth || 3;
  const dotRadius = Math.max(3, cellSize * 0.1);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < segCount; i++) {
    if (i > activeIndex) break;

    const p0 = points[i];
    const p1 = points[i + 1];
    const x0 = toCanvasX(p0.x);
    const y0 = toCanvasY(p0.y);
    const x1 = toCanvasX(p1.x);
    const y1 = toCanvasY(p1.y);

    ctx.save();

    if (i < activeIndex) {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x0, y0, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (i === activeIndex) {
      const color = colors[i % colors.length];
      const endX = x0 + (x1 - x0) * progress;
      const endY = y0 + (y1 - y0) * progress;

      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x0, y0, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      if (progress > 0.1) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 4 + pulse * 8;
        ctx.beginPath();
        ctx.arc(endX, endY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Draw the starting vertex (0,0)
  if (activeIndex >= 0) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[0 % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(0), dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draw all Dyck path segments at full opacity with correspondence colors.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x: number, y: number}>} points - Path vertices
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 * @param {string[]} colors - Correspondence colors
 */
export function drawDyckSegmentsComplete(ctx, points, n, box, theme, colors) {
  const { cellSize, toCanvasX, toCanvasY } = dyckParams(n, box);

  const segCount = points.length - 1;
  const strokeWidth = theme.strokeWidth || 3;
  const dotRadius = Math.max(3, cellSize * 0.1);

  // Draw all segments
  for (let i = 0; i < segCount; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(p0.x), toCanvasY(p0.y));
    ctx.lineTo(toCanvasX(p1.x), toCanvasY(p1.y));
    ctx.stroke();
    ctx.restore();
  }

  // Draw vertex dots
  for (let i = 0; i <= segCount; i++) {
    const p = points[i];
    const colorIdx = Math.min(i, segCount - 1);

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[colorIdx % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x), toCanvasY(p.y), dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
