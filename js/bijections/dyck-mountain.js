/**
 * Dyck Paths to Mountain Ranges Bijection Module
 *
 * Implements step-by-step animation for the bijection between
 * Dyck paths (N/E lattice path above diagonal) and mountain ranges
 * (filled silhouette with up/down slopes).
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as dyckPath from '../structures/dyck-path.js';
import * as mountainRange from '../structures/mountain-range.js';
import { drawDyckGrid, drawDyckPathIntro, drawDyckSegments, drawDyckSegmentsComplete } from './dyck-draw-helpers.js';

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

  // Separate point arrays: Dyck uses n×n coords, mountain uses 2n×n coords
  const dyckPoints = pathInstance.points;
  const mtPoints = mtInstance.points;

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

      drawDyckGrid(ctx, n, pathBox, theme);
      drawDyckPathIntro(ctx, dyckPoints, n, pathBox, theme);

      drawMountainBaseline(ctx, n, mtBox, theme);
    },
  });

  // --- Steps 1..2n: One per segment ---
  for (let i = 0; i < segmentCount; i++) {
    const direction = dyckWord[i] === 1 ? 'East' : 'North';
    const slopeType = dyckWord[i] === 1 ? 'ascending' : 'descending';

    steps.push({
      description: reversed
        ? `Step ${segmentCount - i}: ${slopeType} mountain slope maps to ${direction} path step`
        : `Step ${i + 1}: ${direction} path step becomes ${slopeType} mountain slope`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const pathBox = reversed ? targetBox : sourceBox;
        const mtBox = reversed ? sourceBox : targetBox;

        drawDyckGrid(ctx, n, pathBox, theme);
        drawDyckSegments(ctx, dyckPoints, n, pathBox, theme, colors, i, segmentCount, progress);

        drawMountainBaseline(ctx, n, mtBox, theme);
        drawMountainSegmentsWithZones(ctx, mtPoints, n, mtBox, theme, colors, i, segmentCount, progress);
      },
    });
  }

  // --- Step 2n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each mountain slope corresponds to one path step`
      : `Bijection complete: the Dyck path and mountain range encode the same walk`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const pathBox = reversed ? targetBox : sourceBox;
      const mtBox = reversed ? sourceBox : targetBox;

      drawDyckGrid(ctx, n, pathBox, theme);
      drawDyckSegmentsComplete(ctx, dyckPoints, n, pathBox, theme, colors);

      drawMountainBaseline(ctx, n, mtBox, theme);
      drawMountainComplete(ctx, mtPoints, n, mtBox, theme, colors);
    },
  });

  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Mountain Range (uses 2n × n coordinate system)
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
 * Draw mountain segments with three visual zones.
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
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(0));
    ctx.lineTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
    for (let j = 1; j <= upTo; j++) {
      if (j === upTo && j - 1 === activeIndex) {
        const p0 = points[j - 1];
        const p1 = points[j];
        const endX = p0.x + (p1.x - p0.x) * progress;
        const endY = p0.y + (p1.y - p0.y) * progress;
        ctx.lineTo(toCanvasX(endX), toCanvasY(endY));
      } else {
        ctx.lineTo(toCanvasX(points[j].x), toCanvasY(points[j].y));
      }
    }
    if (upTo === activeIndex + 1 && activeIndex < segmentCount) {
      const p0 = points[activeIndex];
      const p1 = points[activeIndex + 1];
      const endX = p0.x + (p1.x - p0.x) * progress;
      ctx.lineTo(toCanvasX(endX), toCanvasY(0));
    } else {
      ctx.lineTo(toCanvasX(points[upTo].x), toCanvasY(0));
    }
    ctx.closePath();
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
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
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
    }

    ctx.restore();
  }
}

/**
 * Draw all mountain segments at full opacity with correspondence colors (completion step).
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
