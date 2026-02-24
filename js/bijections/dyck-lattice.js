/**
 * Dyck Paths to Lattice Paths Bijection Module
 *
 * Implements step-by-step animation for the 45-degree rotation bijection:
 * each Dyck step +1 (up) maps to R (right) and each -1 (down) maps to U (up)
 * on the lattice path below the diagonal.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as dyckPath from '../structures/dyck-path.js';
import * as latticePath from '../structures/lattice-path.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'dyck-path',
  target: 'lattice-path',
  label: 'Dyck Paths to Lattice Paths',
};

/**
 * Generate animation step sequence for Dyck-paths-to-lattice-paths bijection.
 *
 * Produces 2n+2 steps for a Dyck word of length 2n:
 *   Step 0:       Introduction -- show Dyck path on grid and empty lattice grid with diagonal
 *   Steps 1..2n:  One per step -- highlight Dyck segment and draw corresponding lattice segment
 *   Step 2n+1:    Completion -- both paths fully colored with correspondence
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order (half-length of dyckWord)
 * @param {boolean} [reversed=false] - If true, show Lattice Paths -> Dyck Paths
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const pathInstance = dyckPath.fromDyck(dyckWord);
  const latticeInstance = latticePath.fromDyck(dyckWord);
  const segmentCount = dyckWord.length; // 2n

  // Pre-compute path vertices for drawing
  const dyckPoints = pathInstance.points;
  const latticePoints = latticeInstance.points;
  const latticeSteps = latticeInstance.steps; // Array of 'R' or 'U'

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the lattice path from (0,0) to (${n},${n}) below the diagonal`
      : `Start with the Dyck path of ${segmentCount} steps`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const dyckBox = reversed ? targetBox : sourceBox;
      const latticeBox = reversed ? sourceBox : targetBox;

      // Draw Dyck path on grid at default color
      drawDyckGrid(ctx, n, dyckBox, theme);
      drawDyckPathIntro(ctx, dyckPoints, n, dyckBox, theme);

      // Draw empty lattice grid with diagonal (no path segments)
      drawLatticeGrid(ctx, n, latticeBox, theme, colors);
    },
  });

  // --- Steps 1..2n: One per segment ---
  for (let i = 0; i < segmentCount; i++) {
    const dyckDir = dyckWord[i] === 1 ? 'up' : 'down';
    const latticeDir = latticeSteps[i]; // 'R' or 'U'
    const latticeDirFull = latticeDir === 'R' ? 'Right' : 'Up';

    steps.push({
      description: reversed
        ? `Step ${segmentCount - i}: ${latticeDirFull} lattice step maps to ${dyckDir} path step`
        : `Step ${i + 1}: ${dyckDir} path step maps to ${latticeDirFull} lattice step`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const dyckBox = reversed ? targetBox : sourceBox;
        const latticeBox = reversed ? sourceBox : targetBox;

        // Draw Dyck path with three visual zones
        drawDyckGrid(ctx, n, dyckBox, theme);
        drawDyckSegmentsWithZones(ctx, dyckPoints, n, dyckBox, theme, colors, i, segmentCount, progress);

        // Draw lattice grid then path segments with three visual zones
        drawLatticeGrid(ctx, n, latticeBox, theme, colors);
        drawLatticeSegmentsWithZones(ctx, latticePoints, n, latticeBox, theme, colors, i, segmentCount, progress);
      },
    });
  }

  // --- Step 2n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each lattice step corresponds to one Dyck path step`
      : `Bijection complete: each Dyck step maps to one lattice step (R or U)`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const dyckBox = reversed ? targetBox : sourceBox;
      const latticeBox = reversed ? sourceBox : targetBox;

      // All elements at full opacity with correspondence colors
      drawDyckGrid(ctx, n, dyckBox, theme);
      drawDyckSegmentsComplete(ctx, dyckPoints, n, dyckBox, theme, colors);

      drawLatticeGrid(ctx, n, latticeBox, theme, colors);
      drawLatticeSegmentsComplete(ctx, latticePoints, n, latticeBox, theme, colors);
    },
  });

  // Reverse step order for reversed direction
  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Dyck Path (copied from parens-dyck.js pattern, self-contained)
// =============================================================================

/**
 * Draw the Dyck path grid (gridlines + axes) without path segments.
 */
function drawDyckGrid(ctx, n, box, theme) {
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return box.x + padding + gx * scaleX; }
  function toCanvasY(gy) { return box.y + padding + (n - gy) * scaleY; }

  // Vertical gridlines
  ctx.strokeStyle = theme.gridLine || '#E0E0E0';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 2 * n; gx++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(gx), toCanvasY(n));
    ctx.lineTo(toCanvasX(gx), toCanvasY(0));
    ctx.stroke();
  }

  // Horizontal gridlines
  for (let gy = 0; gy <= n; gy++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(gy));
    ctx.lineTo(toCanvasX(2 * n), toCanvasY(gy));
    ctx.stroke();
  }

  // Emphasize x-axis (y=0)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(2 * n), toCanvasY(0));
  ctx.stroke();
}

/**
 * Draw the full Dyck path at default color for the intro step (no color correspondence).
 */
function drawDyckPathIntro(ctx, points, n, box, theme) {
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return box.x + padding + gx * scaleX; }
  function toCanvasY(gy) { return box.y + padding + (n - gy) * scaleY; }

  const strokeWidth = theme.strokeWidth || 3;
  const circleRadius = Math.max(4, Math.min(scaleX, scaleY) * 0.15);

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

  // Draw vertex circles
  for (let i = 0; i < points.length; i++) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    ctx.beginPath();
    ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draw Dyck path segments with three visual zones and animated active segment.
 */
function drawDyckSegmentsWithZones(ctx, points, n, box, theme, colors, activeIndex, segmentCount, progress) {
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return box.x + padding + gx * scaleX; }
  function toCanvasY(gy) { return box.y + padding + (n - gy) * scaleY; }

  const strokeWidth = theme.strokeWidth || 3;
  const circleRadius = Math.max(4, Math.min(scaleX, scaleY) * 0.15);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < segmentCount; i++) {
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
      ctx.arc(x0, y0, circleRadius, 0, Math.PI * 2);
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
      ctx.arc(x0, y0, circleRadius, 0, Math.PI * 2);
      ctx.fill();

      if (progress > 0.1) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 4 + pulse * 8;
        ctx.beginPath();
        ctx.arc(endX, endY, circleRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Starting vertex
  if (activeIndex >= 0) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[0 % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(0), circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draw all Dyck path segments at full opacity with correspondence colors (completion step).
 */
function drawDyckSegmentsComplete(ctx, points, n, box, theme, colors) {
  const charCount = points.length - 1;
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return box.x + padding + gx * scaleX; }
  function toCanvasY(gy) { return box.y + padding + (n - gy) * scaleY; }

  const strokeWidth = theme.strokeWidth || 3;
  const circleRadius = Math.max(4, Math.min(scaleX, scaleY) * 0.15);

  for (let i = 0; i < charCount; i++) {
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

  for (let i = 0; i <= charCount; i++) {
    const p = points[i];
    const colorIdx = Math.min(i, charCount - 1);

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[colorIdx % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x), toCanvasY(p.y), circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// =============================================================================
// Drawing Helpers: Lattice Path
// =============================================================================

/**
 * Compute lattice grid drawing parameters.
 * Uses y-inversion so U steps visually go upward on canvas
 * (CRITICAL: Pitfall 3 from RESEARCH.md).
 */
function latticeParams(n, box) {
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const cellSize = Math.min(drawWidth / n, drawHeight / n);
  const gridWidth = cellSize * n;
  const gridHeight = cellSize * n;

  // Center the grid in the bounding box
  const offsetX = box.x + padding + (drawWidth - gridWidth) / 2;
  const offsetY = box.y + padding + (drawHeight - gridHeight) / 2;

  // Canvas y-axis inversion: grid (gx, gy) with (0,0) bottom-left, (n,n) top-right
  function toCanvasX(gx) { return offsetX + gx * cellSize; }
  function toCanvasY(gy) { return offsetY + (n - gy) * cellSize; }

  return { padding, cellSize, gridWidth, gridHeight, offsetX, offsetY, toCanvasX, toCanvasY };
}

/**
 * Draw the lattice n x n grid with dashed diagonal (y=x line).
 * No path segments drawn.
 */
function drawLatticeGrid(ctx, n, box, theme, colors) {
  const { cellSize, toCanvasX, toCanvasY } = latticeParams(n, box);

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

  // Draw the diagonal from (0,0) to (n,n) as a dashed line
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
 * Draw lattice path segments with three visual zones and animated active segment.
 */
function drawLatticeSegmentsWithZones(ctx, points, n, box, theme, colors, activeIndex, segmentCount, progress) {
  const { cellSize, toCanvasX, toCanvasY } = latticeParams(n, box);
  const strokeWidth = theme.strokeWidth || 3;
  const dotRadius = Math.max(3, cellSize * 0.1);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < segmentCount; i++) {
    if (i > activeIndex) break;

    const p0 = points[i];
    const p1 = points[i + 1];
    const x0 = toCanvasX(p0.x);
    const y0 = toCanvasY(p0.y);
    const x1 = toCanvasX(p1.x);
    const y1 = toCanvasY(p1.y);

    ctx.save();

    if (i < activeIndex) {
      // Already processed: full opacity, correspondence color, no glow
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
      // Active: animate segment from start to end, pulsing glow
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

      // Vertex dot at segment start
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

  // Starting vertex (0,0) dot
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
 * Draw all lattice path segments at full opacity with correspondence colors (completion step).
 */
function drawLatticeSegmentsComplete(ctx, points, n, box, theme, colors) {
  const { cellSize, toCanvasX, toCanvasY } = latticeParams(n, box);
  const segmentCount = points.length - 1;
  const strokeWidth = theme.strokeWidth || 3;
  const dotRadius = Math.max(3, cellSize * 0.1);

  // Draw all segments with correspondence colors
  for (let i = 0; i < segmentCount; i++) {
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

  // Draw vertex dots at all grid intersections on the path
  for (let i = 0; i < points.length; i++) {
    const colorIdx = Math.min(i, segmentCount - 1);

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[colorIdx % colors.length];
    ctx.beginPath();
    ctx.arc(toCanvasX(points[i].x), toCanvasY(points[i].y), dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
