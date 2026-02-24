/**
 * Lattice Path Below Diagonal Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A lattice path from (0,0) to (n,n) using right (R) and up (U) steps
 * that never crosses above the diagonal y=x. The bijection maps
 * Dyck word +1 to R (right step) and -1 to U (up step).
 *
 * Instance representation: { n, steps: Array<'R'|'U'>, points: Array<{x, y}> }
 */

/**
 * Convert a Dyck word to a lattice path below the diagonal.
 * +1 maps to R (right step, increment x), -1 maps to U (up step, increment y).
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {{ n: number, steps: Array<'R'|'U'>, points: Array<{x: number, y: number}> }}
 */
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const steps = [];
  const points = [{ x: 0, y: 0 }];
  let cx = 0, cy = 0;

  for (const step of dyckWord) {
    if (step === 1) {
      steps.push('R');
      cx += 1;
    } else {
      steps.push('U');
      cy += 1;
    }
    points.push({ x: cx, y: cy });
  }

  return { n, steps, points };
}

/**
 * Convert a lattice path instance back to a Dyck word.
 * R maps to +1, U maps to -1.
 *
 * @param {{ n: number, steps: Array<'R'|'U'>, points: Array<{x: number, y: number}> }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  return instance.steps.map(s => s === 'R' ? 1 : -1);
}

/**
 * Draw the lattice path on an n x n grid within the bounding box.
 * Grid lines, diagonal boundary (dashed), path segments with correspondence colors.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, steps: Array<'R'|'U'>, points: Array<{x: number, y: number}> }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { n, steps, points } = instance;

  if (n === 0 || points.length <= 1) return;

  const padding = 20;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // Grid is n x n; scale equally in both dimensions
  const cellSize = Math.min(drawWidth / n, drawHeight / n);
  const gridWidth = cellSize * n;
  const gridHeight = cellSize * n;

  // Center the grid in the bounding box
  const offsetX = x + padding + (drawWidth - gridWidth) / 2;
  const offsetY = y + padding + (drawHeight - gridHeight) / 2;

  // Canvas y-axis inversion: grid (gx, gy) with (0,0) bottom-left, (n,n) top-right
  function toCanvasX(gx) { return offsetX + gx * cellSize; }
  function toCanvasY(gy) { return offsetY + (n - gy) * cellSize; }

  // Draw light grid lines
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

  // Draw the diagonal from (0,0) to (n,n) as a dashed colored line
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(n), toCanvasY(n));
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw each step segment with correspondence colors
  ctx.lineWidth = theme.strokeWidth || 3;
  for (let i = 0; i < steps.length; i++) {
    const from = points[i];
    const to = points[i + 1];
    ctx.strokeStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(toCanvasX(from.x), toCanvasY(from.y));
    ctx.lineTo(toCanvasX(to.x), toCanvasY(to.y));
    ctx.stroke();
  }

  // Draw vertex dots at grid intersections on the path
  const dotRadius = Math.max(3, cellSize * 0.1);
  for (let i = 0; i < points.length; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Return the number of animatable elements (2n steps).
 * @param {{ n: number, steps: Array<'R'|'U'>, points: Array<{x: number, y: number}> }} instance
 * @returns {number}
 */
export function elementCount(instance) {
  return instance.steps.length;
}

/**
 * Draw the lattice path with three-zone progressive coloring.
 * Grid and diagonal are always visible. Step segments are drawn only up to activeIndex.
 * The active segment animates from start to end using progress.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, steps: Array<'R'|'U'>, points: Array<{x: number, y: number}> }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  const { x, y, width, height, theme, colors, activeIndex, progress } = opts;
  const { n, steps, points } = instance;

  if (n === 0 || points.length <= 1) return;

  const padding = 20;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const cellSize = Math.min(drawWidth / n, drawHeight / n);
  const gridWidth = cellSize * n;
  const gridHeight = cellSize * n;

  const offsetX = x + padding + (drawWidth - gridWidth) / 2;
  const offsetY = y + padding + (drawHeight - gridHeight) / 2;

  function toCanvasX(gx) { return offsetX + gx * cellSize; }
  function toCanvasY(gy) { return offsetY + (n - gy) * cellSize; }

  // --- Always draw grid ---
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

  // --- Always draw diagonal ---
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(n), toCanvasY(n));
  ctx.stroke();
  ctx.setLineDash([]);

  // --- Draw step segments with three-zone pattern ---
  const stepCount = steps.length;
  const strokeWidth = theme.strokeWidth || 3;
  const dotRadius = Math.max(3, cellSize * 0.1);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < stepCount; i++) {
    if (i > activeIndex) break; // Unprocessed: not drawn

    const from = points[i];
    const to = points[i + 1];
    const x0 = toCanvasX(from.x);
    const y0 = toCanvasY(from.y);
    const x1 = toCanvasX(to.x);
    const y1 = toCanvasY(to.y);

    ctx.save();

    if (i < activeIndex) {
      // Processed: full opacity, correspondence color, no glow
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Vertex dot at segment start
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x0, y0, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (i === activeIndex) {
      // Active: animate from start to end using progress, with glow
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

      // Vertex dot at segment start (no glow)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x0, y0, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      // Vertex dot at animated end
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

  // Draw the starting vertex (0,0) if active
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
