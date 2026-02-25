/**
 * Parentheses to Dyck Paths Bijection Module
 *
 * Implements step-by-step animation for the simplest Catalan bijection:
 * each '(' maps to an East step (+1,0) and each ')' maps to a North step (0,+1).
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as parentheses from '../structures/parentheses.js';
import * as dyckPath from '../structures/dyck-path.js';
import { drawDyckGrid, drawDyckSegments, drawDyckSegmentsComplete } from './dyck-draw-helpers.js';

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

      drawParentheses(ctx, parenStr, parenBox, theme, null, -1, charCount);
      drawDyckGrid(ctx, n, pathBox, theme);
    },
  });

  // --- Steps 1..2n: One per character ---
  for (let i = 0; i < charCount; i++) {
    const char = parenStr[i];
    const direction = char === '(' ? 'East' : 'North';
    const stepCoord = char === '(' ? '(+1,0)' : '(0,+1)';

    steps.push({
      description: reversed
        ? `Step ${charCount - i}: '${direction}' path step maps to '${char}' ${stepCoord}`
        : `Character ${i + 1}: '${char}' maps to ${direction} step ${stepCoord}`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const parenBox = reversed ? targetBox : sourceBox;
        const pathBox = reversed ? sourceBox : targetBox;

        drawParentheses(ctx, parenStr, parenBox, theme, colors, i, charCount);
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

      drawParenthesesComplete(ctx, parenStr, parenBox, theme, colors);
      drawDyckGrid(ctx, n, pathBox, theme);
      drawDyckSegmentsComplete(ctx, points, n, pathBox, theme, colors);
    },
  });

  if (reversed) {
    steps.reverse();
  }

  return steps;
}

// =============================================================================
// Drawing Helpers: Parentheses
// =============================================================================

/**
 * Draw parentheses characters with three visual zones.
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
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    } else if (i < activeIndex) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length];
    } else if (i === activeIndex) {
      ctx.globalAlpha = 1.0;
      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
    } else {
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
