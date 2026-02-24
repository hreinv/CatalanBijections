/**
 * Parentheses to Dyck Paths Bijection Module
 *
 * Implements step-by-step animation for the simplest Catalan bijection:
 * each '(' maps to an up step (+1,+1) and each ')' maps to a down step (+1,-1).
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as parentheses from '../structures/parentheses.js';
import * as dyckPath from '../structures/dyck-path.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'parentheses',
  target: 'dyck-path',
  label: 'Parentheses to Dyck Paths',
};

/**
 * Generate animation step sequence for parentheses-to-Dyck-paths bijection.
 *
 * Produces 2n+2 steps for a Dyck word of length 2n:
 *   Step 0:       Introduction -- show source string and empty grid
 *   Steps 1..2n:  One per character -- highlight active, draw corresponding segment
 *   Step 2n+1:    Completion -- both structures fully colored
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order (half-length of dyckWord)
 * @param {boolean} [reversed=false] - If true, show Dyck Paths -> Parentheses
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const parenStr = parentheses.fromDyck(dyckWord);
  const pathInstance = dyckPath.fromDyck(dyckWord);
  const charCount = parenStr.length; // 2n

  // Pre-compute path vertices for drawing
  const points = pathInstance.points;

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the Dyck path of ${charCount} steps`
      : `Start with the balanced parentheses: "${parenStr}"`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const parenBox = reversed ? targetBox : sourceBox;
      const pathBox = reversed ? sourceBox : targetBox;

      // Draw all parentheses at full opacity, no correspondence colors yet
      drawParentheses(ctx, parenStr, parenBox, theme, null, -1, charCount);

      // Draw empty grid on path panel (no path segments)
      drawDyckGrid(ctx, n, pathBox, theme);
    },
  });

  // --- Steps 1..2n: One per character ---
  for (let i = 0; i < charCount; i++) {
    const char = parenStr[i];
    const direction = char === '(' ? 'up' : 'down';
    const stepCoord = char === '(' ? '+1,+1' : '+1,-1';

    steps.push({
      description: reversed
        ? `Step ${charCount - i}: '${direction}' path step maps to '${char}' (${stepCoord})`
        : `Character ${i + 1}: '${char}' maps to ${direction} step (${stepCoord})`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const parenBox = reversed ? targetBox : sourceBox;
        const pathBox = reversed ? sourceBox : targetBox;

        // Draw parentheses with three visual zones
        drawParentheses(ctx, parenStr, parenBox, theme, colors, i, charCount);

        // Draw grid then path segments with three visual zones
        drawDyckGrid(ctx, n, pathBox, theme);
        drawDyckSegments(ctx, points, n, pathBox, theme, colors, i, charCount, progress);
      },
    });
  }

  // --- Step 2n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each path step maps to one parenthesis`
      : `Bijection complete: each parenthesis maps to one path step`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const parenBox = reversed ? targetBox : sourceBox;
      const pathBox = reversed ? sourceBox : targetBox;

      // All elements at full opacity with correspondence colors, no glow
      drawParenthesesComplete(ctx, parenStr, parenBox, theme, colors);

      drawDyckGrid(ctx, n, pathBox, theme);
      drawDyckSegmentsComplete(ctx, points, n, pathBox, theme, colors);
    },
  });

  // Reverse step order for reversed direction
  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers
// =============================================================================

/**
 * Draw parentheses characters with three visual zones:
 * - Already processed (index < activeIndex): full opacity, correspondence color, no glow
 * - Active (index === activeIndex): full opacity, correspondence color, pulsing glow
 * - Not yet processed (index > activeIndex): dimmed, default stroke color
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} parenStr - The balanced parenthesis string
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 * @param {string[]|null} colors - CORRESPONDENCE_COLORS or null for intro step
 * @param {number} activeIndex - Index of the active character (-1 for intro)
 * @param {number} charCount - Total number of characters
 */
function drawParentheses(ctx, parenStr, box, theme, colors, activeIndex, charCount) {
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const fontSize = Math.min(box.height * 0.3, 48, box.width / (charCount * 0.7));

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const charWidth = ctx.measureText('(').width;
  const totalWidth = charWidth * charCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const centerY = box.y + box.height / 2;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < charCount; i++) {
    ctx.save();

    if (colors === null || activeIndex < 0) {
      // Introduction step: all characters at full opacity, default color
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    } else if (i < activeIndex) {
      // Already processed: full opacity, correspondence color, no glow
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length];
    } else if (i === activeIndex) {
      // Active: full opacity, correspondence color, pulsing glow
      ctx.globalAlpha = 1.0;
      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
    } else {
      // Not yet processed: dimmed, default stroke color
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }

    ctx.fillText(parenStr[i], startX + i * charWidth, centerY);
    ctx.restore();
  }
}

/**
 * Draw all parentheses at full opacity with correspondence colors (completion step).
 */
function drawParenthesesComplete(ctx, parenStr, box, theme, colors) {
  const charCount = parenStr.length;
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const fontSize = Math.min(box.height * 0.3, 48, box.width / (charCount * 0.7));

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const charWidth = ctx.measureText('(').width;
  const totalWidth = charWidth * charCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const centerY = box.y + box.height / 2;

  for (let i = 0; i < charCount; i++) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillText(parenStr[i], startX + i * charWidth, centerY);
    ctx.restore();
  }
}

/**
 * Draw the Dyck path grid (gridlines + axes) without path segments.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
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
 * Draw Dyck path segments with three visual zones and animated active segment.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x: number, y: number}>} points - Path vertices
 * @param {number} n - Catalan order
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 * @param {string[]} colors - CORRESPONDENCE_COLORS
 * @param {number} activeIndex - Currently active segment index (0-based)
 * @param {number} charCount - Total segments (2n)
 * @param {number} progress - Animation progress [0,1] for active segment
 */
function drawDyckSegments(ctx, points, n, box, theme, colors, activeIndex, charCount, progress) {
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

  // Draw segments (each segment i connects points[i] to points[i+1])
  for (let i = 0; i < charCount; i++) {
    if (i > activeIndex) break; // Not yet processed: don't draw

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

      // Vertex circle at segment start
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x0, y0, circleRadius, 0, Math.PI * 2);
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

      // Vertex circle at segment start
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x0, y0, circleRadius, 0, Math.PI * 2);
      ctx.fill();

      // Vertex circle at animated end (if progress > 0)
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

  // Draw the starting vertex (0,0) if we're past the intro
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
  const charCount = points.length - 1; // Number of segments
  const padding = 20;
  const drawWidth = box.width - padding * 2;
  const drawHeight = box.height - padding * 2;

  const scaleX = drawWidth / (2 * n);
  const scaleY = drawHeight / n;

  function toCanvasX(gx) { return box.x + padding + gx * scaleX; }
  function toCanvasY(gy) { return box.y + padding + (n - gy) * scaleY; }

  const strokeWidth = theme.strokeWidth || 3;
  const circleRadius = Math.max(4, Math.min(scaleX, scaleY) * 0.15);

  // Draw all segments with correspondence colors
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

  // Draw circles at all vertices
  for (let i = 0; i <= charCount; i++) {
    const p = points[i];
    // Use the color of the segment that starts at this point (last vertex uses last segment color)
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
