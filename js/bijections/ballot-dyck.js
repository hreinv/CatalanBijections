/**
 * Ballot Sequences to Dyck Paths Bijection Module
 *
 * Implements step-by-step animation for the bijection:
 * each vote 'A' maps to an East step (+1,0) and each vote 'B' maps to a North step (0,+1).
 * The "A always ahead or tied" constraint equals the "path stays below diagonal" constraint.
 *
 * Exports META for router registration and getSteps() for step sequence generation.
 * Each step has a description string and a drawFrame(ctx, progress, opts) function
 * that renders both source and target panels with color correspondence,
 * active element glow, and dimming of unprocessed elements.
 */

import * as ballotSequence from '../structures/ballot-sequence.js';
import * as dyckPath from '../structures/dyck-path.js';
import { drawDyckGrid, drawDyckSegments, drawDyckSegmentsComplete } from './dyck-draw-helpers.js';

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

      drawBallotVotes(ctx, ballot, ballotBox, theme, null, -1, voteCount);
      drawDyckGrid(ctx, n, pathBox, theme);
    },
  });

  // --- Steps 1..2n: One per vote ---
  for (let i = 0; i < voteCount; i++) {
    const vote = ballot.votes[i];
    const direction = vote === 'A' ? 'East' : 'North';

    steps.push({
      description: reversed
        ? `Step ${voteCount - i}: '${direction}' path step maps to vote '${vote}'`
        : `Vote ${i + 1}: '${vote}' maps to ${direction} step`,
      drawFrame(ctx, progress, opts) {
        const { sourceBox, targetBox, theme, colors } = opts;
        const ballotBox = reversed ? targetBox : sourceBox;
        const pathBox = reversed ? sourceBox : targetBox;

        drawBallotVotes(ctx, ballot, ballotBox, theme, colors, i, voteCount);
        drawDyckGrid(ctx, n, pathBox, theme);
        drawDyckSegments(ctx, points, n, pathBox, theme, colors, i, voteCount, progress);
      },
    });
  }

  // --- Step 2n+1: Completion ---
  steps.push({
    description: reversed
      ? `Bijection complete: each path step maps to one vote`
      : `Bijection complete: A-ahead constraint equals path-above-diagonal constraint`,
    drawFrame(ctx, progress, opts) {
      const { sourceBox, targetBox, theme, colors } = opts;
      const ballotBox = reversed ? targetBox : sourceBox;
      const pathBox = reversed ? sourceBox : targetBox;

      drawBallotVotesComplete(ctx, ballot, ballotBox, theme, colors);
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
// Drawing Helpers: Ballot Sequence
// =============================================================================

/**
 * Draw ballot vote letters with three visual zones.
 * Includes running tally counts below each vote letter.
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

    ctx.save();
    ctx.font = `bold ${fontSize}px ${monoFont}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillText(ballot.votes[i], cx, voteY);
    ctx.restore();

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
