/**
 * Dyck Paths to Mountain Ranges Bijection Module
 *
 * Implements step-by-step animation for the identity bijection between
 * Dyck paths and mountain ranges. Both are the same lattice path data,
 * but rendered in two different visual forms: a grid path vs. a filled silhouette.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as dyckPath from '../structures/dyck-path.js';
import * as mountainRange from '../structures/mountain-range.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'dyck-path',
  target: 'mountain-range',
  label: 'Dyck Paths to Mountain Ranges',
};

/**
 * Generate animation step sequence for Dyck-paths-to-mountain-ranges bijection.
 *
 * Produces 2n+2 steps for a Dyck word of length 2n:
 *   Step 0:       Introduction -- show Dyck path on grid and empty mountain baseline
 *   Steps 1..2n:  One per segment -- highlight Dyck segment and draw mountain slope
 *   Step 2n+1:    Completion -- both structures fully colored
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order (half-length of dyckWord)
 * @param {boolean} [reversed=false] - If true, show Mountain Ranges -> Dyck Paths
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const pathInstance = dyckPath.fromDyck(dyckWord);
  const mtInstance = mountainRange.fromDyck(dyckWord);
  const segmentCount = dyckWord.length; // 2n

  // Pre-compute path vertices (same points for both structures)
  const points = pathInstance.points;

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the mountain range of ${segmentCount} slopes`
      : `Start with the Dyck path of ${segmentCount} steps`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const pathBox = reversed ? targetBox : sourceBox;
      const mtBox = reversed ? sourceBox : targetBox;

      // Draw full Dyck path at default color on grid
      drawDyckGrid(ctx, n, pathBox, theme);
      drawDyckPathIntro(ctx, points, n, pathBox, theme);

      // Draw empty mountain baseline
      drawMountainBaseline(ctx, n, mtBox, theme);
    },
  });

  // --- Steps 1..2n: One per segment ---
  for (let i = 0; i < segmentCount; i++) {
    const direction = dyckWord[i] === 1 ? 'up' : 'down';
    const slopeType = dyckWord[i] === 1 ? 'ascending' : 'descending';

    steps.push({
      description: reversed
        ? `Step ${segmentCount - i}: ${slopeType} mountain slope maps to ${direction} path step`
        : `Step ${i + 1}: ${direction} path step becomes ${slopeType} mountain slope`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const pathBox = reversed ? targetBox : sourceBox;
        const mtBox = reversed ? sourceBox : targetBox;

        // Draw Dyck path with three visual zones
        drawDyckGrid(ctx, n, pathBox, theme);
        drawDyckSegmentsWithZones(ctx, points, n, pathBox, theme, colors, i, segmentCount, progress);

        // Draw mountain with three visual zones
        drawMountainBaseline(ctx, n, mtBox, theme);
        drawMountainSegmentsWithZones(ctx, points, n, mtBox, theme, colors, i, segmentCount, progress);
      },
    });
  }

  // --- Step 2n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each mountain slope corresponds to one path step`
      : `Bijection complete: the Dyck path and mountain range are the same walk`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const pathBox = reversed ? targetBox : sourceBox;
      const mtBox = reversed ? sourceBox : targetBox;

      // All elements at full opacity with correspondence colors
      drawDyckGrid(ctx, n, pathBox, theme);
      drawDyckSegmentsComplete(ctx, points, n, pathBox, theme, colors);

      drawMountainBaseline(ctx, n, mtBox, theme);
      drawMountainComplete(ctx, points, n, mtBox, theme, colors);
    },
  });

  // Reverse step order for reversed direction
  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Dyck Path (copied from parens-dyck.js, self-contained)
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
// Drawing Helpers: Mountain Range
// =============================================================================

/**
 * Compute mountain drawing parameters.
 */
function mountainParams(n, box) {
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return box.x + padding + gx * scaleX; }
  function toCanvasY(gy) { return box.y + padding + (n - gy) * scaleY; }

  return { padding, scaleX, scaleY, toCanvasX, toCanvasY };
}

/**
 * Draw the mountain baseline (thin line at y=0).
 */
function drawMountainBaseline(ctx, n, box, theme) {
  const { toCanvasX, toCanvasY } = mountainParams(n, box);

  ctx.save();
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(2 * n), toCanvasY(0));
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw mountain segments with three visual zones:
 * - Already processed: full opacity, colored segment stroke + filled area
 * - Active: animated segment with pulsing glow
 * - Not yet processed: not drawn
 *
 * Colors segments by segment index (NOT by peak index per Pitfall 2 in RESEARCH.md).
 */
function drawMountainSegmentsWithZones(ctx, points, n, box, theme, colors, activeIndex, segmentCount, progress) {
  const { toCanvasX, toCanvasY } = mountainParams(n, box);
  const strokeWidth = theme.strokeWidth || 3;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw filled area under processed + active segments
  const upTo = Math.min(activeIndex + 1, segmentCount);
  if (upTo > 0) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(0)); // baseline start
    ctx.lineTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
    for (let j = 1; j <= upTo; j++) {
      if (j === upTo && j - 1 === activeIndex) {
        // Active segment: partial fill based on progress
        const p0 = points[j - 1];
        const p1 = points[j];
        const endX = p0.x + (p1.x - p0.x) * progress;
        const endY = p0.y + (p1.y - p0.y) * progress;
        ctx.lineTo(toCanvasX(endX), toCanvasY(endY));
      } else {
        ctx.lineTo(toCanvasX(points[j].x), toCanvasY(points[j].y));
      }
    }
    // Close back to baseline
    if (upTo === activeIndex + 1 && activeIndex < segmentCount) {
      const p0 = points[activeIndex];
      const p1 = points[activeIndex + 1];
      const endX = p0.x + (p1.x - p0.x) * progress;
      ctx.lineTo(toCanvasX(endX), toCanvasY(0));
    } else {
      ctx.lineTo(toCanvasX(points[upTo].x), toCanvasY(0));
    }
    ctx.closePath();
    // Use a blended fill from first segment color
    ctx.fillStyle = colors[0 % colors.length];
    ctx.fill();
    ctx.restore();
  }

  // Draw individual segment strokes with zones
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
      // Already processed: full opacity, correspondence color
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    } else if (i === activeIndex) {
      // Active: animated segment with pulsing glow
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
    }

    ctx.restore();
  }
}

/**
 * Draw all mountain segments at full opacity with correspondence colors (completion step).
 * Includes filled area under the full profile and colored segment strokes.
 */
function drawMountainComplete(ctx, points, n, box, theme, colors) {
  const { toCanvasX, toCanvasY } = mountainParams(n, box);
  const segmentCount = points.length - 1;
  const strokeWidth = theme.strokeWidth || 3;

  // Draw filled area under the complete profile
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = colors[0 % colors.length];
  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(0));
  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.lineTo(toCanvasX(points[points.length - 1].x), toCanvasY(0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw colored segment strokes
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
}
