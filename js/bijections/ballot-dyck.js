/**
 * Ballot Sequences to Dyck Paths Bijection Module
 *
 * Implements step-by-step animation for the bijection:
 * each vote 'A' maps to an up step (+1,+1) and each vote 'B' maps to a down step (+1,-1).
 * The "A always ahead or tied" constraint equals the "path never below x-axis" constraint.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as ballotSequence from '../structures/ballot-sequence.js';
import * as dyckPath from '../structures/dyck-path.js';

/** Router metadata for bidirectional registration */
export const META = {
  source: 'ballot-sequence',
  target: 'dyck-path',
  label: 'Ballot Sequences to Dyck Paths',
};

/**
 * Generate animation step sequence for ballot-sequences-to-Dyck-paths bijection.
 *
 * Produces 2n+2 steps for a Dyck word of length 2n:
 *   Step 0:       Introduction -- show ballot sequence and empty grid
 *   Steps 1..2n:  One per vote -- highlight active vote, draw corresponding segment
 *   Step 2n+1:    Completion -- both structures fully colored
 *
 * @param {number[]} dyckWord - The Dyck word (+1/-1 array)
 * @param {number} n - Catalan order (half-length of dyckWord)
 * @param {boolean} [reversed=false] - If true, show Dyck Paths -> Ballot Sequences
 * @returns {Array<{ description: string, drawFrame: Function }>}
 */
export function getSteps(dyckWord, n, reversed = false) {
  const ballot = ballotSequence.fromDyck(dyckWord);
  const pathInstance = dyckPath.fromDyck(dyckWord);
  const voteCount = ballot.votes.length; // 2n

  // Pre-compute path vertices for drawing
  const points = pathInstance.points;

  const steps = [];

  // --- Step 0: Introduction ---
  steps.push({
    description: reversed
      ? `Start with the Dyck path of ${voteCount} steps`
      : `Start with the ballot sequence: ${ballot.votes.join('')}`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const ballotBox = reversed ? targetBox : sourceBox;
      const pathBox = reversed ? sourceBox : targetBox;

      // Draw all ballot votes at full opacity, no correspondence colors yet
      drawBallotVotes(ctx, ballot, ballotBox, theme, null, -1, voteCount);

      // Draw empty grid on path panel (no path segments)
      drawDyckGrid(ctx, n, pathBox, theme);
    },
  });

  // --- Steps 1..2n: One per vote ---
  for (let i = 0; i < voteCount; i++) {
    const vote = ballot.votes[i];
    const direction = vote === 'A' ? 'up' : 'down';

    steps.push({
      description: reversed
        ? `Step ${voteCount - i}: '${direction}' path step maps to vote '${vote}'`
        : `Vote ${i + 1}: '${vote}' maps to ${direction} step`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const ballotBox = reversed ? targetBox : sourceBox;
        const pathBox = reversed ? sourceBox : targetBox;

        // Draw ballot votes with three visual zones
        drawBallotVotes(ctx, ballot, ballotBox, theme, colors, i, voteCount);

        // Draw grid then path segments with three visual zones
        drawDyckGrid(ctx, n, pathBox, theme);
        drawDyckSegments(ctx, points, n, pathBox, theme, colors, i, voteCount, progress);
      },
    });
  }

  // --- Step 2n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each path step maps to one vote`
      : `Bijection complete: A-ahead constraint equals path-above-axis constraint`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const ballotBox = reversed ? targetBox : sourceBox;
      const pathBox = reversed ? sourceBox : targetBox;

      // All elements at full opacity with correspondence colors, no glow
      drawBallotVotesComplete(ctx, ballot, ballotBox, theme, colors);

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
// Drawing Helpers: Ballot Sequence
// =============================================================================

/**
 * Draw ballot vote letters with three visual zones:
 * - Already processed (index < activeIndex): full opacity, correspondence color, no glow
 * - Active (index === activeIndex): full opacity, correspondence color, pulsing glow
 * - Not yet processed (index > activeIndex): dimmed, default stroke color
 *
 * Includes running tally counts below each vote letter with the same zone dimming.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }} ballot
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {Object} theme
 * @param {string[]|null} colors - CORRESPONDENCE_COLORS or null for intro step
 * @param {number} activeIndex - Index of the active vote (-1 for intro)
 * @param {number} voteCount - Total number of votes
 */
function drawBallotVotes(ctx, ballot, box, theme, colors, activeIndex, voteCount) {
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const fontSize = Math.min(box.height * 0.25, 48, box.width / (voteCount * 0.7));
  const tallyFontSize = Math.max(8, Math.floor(fontSize * 0.4));

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const cellWidth = ctx.measureText('W').width * 1.1;
  const totalWidth = cellWidth * voteCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const voteY = box.y + box.height * 0.38;
  const tallyY = box.y + box.height * 0.62;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < voteCount; i++) {
    const cx = startX + (i + 0.5) * cellWidth;

    // Draw vote letter
    ctx.save();
    ctx.font = `bold ${fontSize}px ${monoFont}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    if (colors === null || activeIndex < 0) {
      // Introduction step: all votes at full opacity, default color
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

    ctx.fillText(ballot.votes[i], cx, voteY);
    ctx.restore();

    // Draw tally below vote
    ctx.save();
    ctx.font = `${tallyFontSize}px ${monoFont}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    if (colors === null || activeIndex < 0) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    } else if (i < activeIndex) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length];
    } else if (i === activeIndex) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[i % colors.length];
    } else {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }

    const tally = ballot.tallies[i];
    ctx.fillText(`${tally.a}:${tally.b}`, cx, tallyY);
    ctx.restore();
  }
}

/**
 * Draw all ballot votes at full opacity with correspondence colors (completion step).
 */
function drawBallotVotesComplete(ctx, ballot, box, theme, colors) {
  const voteCount = ballot.votes.length;
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const fontSize = Math.min(box.height * 0.25, 48, box.width / (voteCount * 0.7));
  const tallyFontSize = Math.max(8, Math.floor(fontSize * 0.4));

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const cellWidth = ctx.measureText('W').width * 1.1;
  const totalWidth = cellWidth * voteCount;
  const startX = box.x + (box.width - totalWidth) / 2;
  const voteY = box.y + box.height * 0.38;
  const tallyY = box.y + box.height * 0.62;

  for (let i = 0; i < voteCount; i++) {
    const cx = startX + (i + 0.5) * cellWidth;

    // Vote letter
    ctx.save();
    ctx.font = `bold ${fontSize}px ${monoFont}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillText(ballot.votes[i], cx, voteY);
    ctx.restore();

    // Tally
    ctx.save();
    ctx.font = `${tallyFontSize}px ${monoFont}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[i % colors.length];
    const tally = ballot.tallies[i];
    ctx.fillText(`${tally.a}:${tally.b}`, cx, tallyY);
    ctx.restore();
  }
}

// =============================================================================
// Drawing Helpers: Dyck Path (copied from parens-dyck.js, self-contained)
// =============================================================================

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
