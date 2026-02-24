/**
 * Ballot Sequence Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A ballot sequence is a sequence of votes for candidates A and B where
 * candidate A is always ahead or tied with B at every prefix. The bijection
 * maps Dyck word +1 to vote 'A' and -1 to vote 'B'.
 *
 * Instance representation: { votes: Array<'A'|'B'>, tallies: Array<{a, b}> }
 */

/**
 * Convert a Dyck word to a ballot sequence.
 * +1 maps to 'A', -1 maps to 'B'. Running tallies are computed.
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }}
 */
export function fromDyck(dyckWord) {
  const votes = [];
  const tallies = [];
  let a = 0, b = 0;

  for (const step of dyckWord) {
    if (step === 1) {
      votes.push('A');
      a++;
    } else {
      votes.push('B');
      b++;
    }
    tallies.push({ a, b });
  }

  return { votes, tallies };
}

/**
 * Convert a ballot sequence instance back to a Dyck word.
 * 'A' maps to +1, 'B' maps to -1.
 *
 * @param {{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  return instance.votes.map(v => v === 'A' ? 1 : -1);
}

/**
 * Render the ballot sequence as a row of labeled vote boxes with running tallies.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { votes, tallies } = instance;

  if (!votes || votes.length === 0) return;

  const charCount = votes.length;
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";

  // Scale font size to fill bounding box width, cap at 48px
  // Each char cell needs roughly 0.7x font size wide (slightly wider than parens for A/B)
  const maxFontByWidth = Math.floor(width / (charCount * 0.7));
  const maxFontByHeight = Math.floor(height * 0.35); // Leave room for tallies below
  const fontSize = Math.min(maxFontByWidth, maxFontByHeight, 48);

  // Tally font is smaller
  const tallyFontSize = Math.max(8, Math.floor(fontSize * 0.4));

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // Measure cell width based on vote characters
  const cellWidth = ctx.measureText('W').width * 1.1;
  const totalWidth = cellWidth * charCount;
  const startX = x + (width - totalWidth) / 2;

  // Vertically center: vote letters in top portion, tallies below
  const voteY = y + height * 0.38;
  const tallyY = y + height * 0.65;

  // Draw vote letters
  for (let i = 0; i < charCount; i++) {
    const cx = startX + (i + 0.5) * cellWidth;
    ctx.fillStyle = colors[i % colors.length];
    ctx.font = `bold ${fontSize}px ${monoFont}`;
    ctx.fillText(votes[i], cx, voteY);
  }

  // Draw running tallies below each vote
  ctx.font = `${tallyFontSize}px ${monoFont}`;
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  for (let i = 0; i < charCount; i++) {
    const cx = startX + (i + 0.5) * cellWidth;
    const tally = tallies[i];
    ctx.fillText(`${tally.a}:${tally.b}`, cx, tallyY);
  }
}

/**
 * Return the number of animatable elements (2n votes).
 * @param {{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }} instance
 * @returns {number}
 */
export function elementCount(instance) {
  return instance.votes.length;
}

/**
 * Draw the ballot sequence with three-zone progressive coloring.
 * Vote letters and their corresponding tallies share the same zone treatment.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ votes: Array<'A'|'B'>, tallies: Array<{a: number, b: number}> }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  const { x, y, width, height, theme, colors, activeIndex } = opts;
  const { votes, tallies } = instance;

  if (!votes || votes.length === 0) return;

  const charCount = votes.length;
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";

  const maxFontByWidth = Math.floor(width / (charCount * 0.7));
  const maxFontByHeight = Math.floor(height * 0.35);
  const fontSize = Math.min(maxFontByWidth, maxFontByHeight, 48);

  const tallyFontSize = Math.max(8, Math.floor(fontSize * 0.4));

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const cellWidth = ctx.measureText('W').width * 1.1;
  const totalWidth = cellWidth * charCount;
  const startX = x + (width - totalWidth) / 2;

  const voteY = y + height * 0.38;
  const tallyY = y + height * 0.65;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  for (let i = 0; i < charCount; i++) {
    const cx = startX + (i + 0.5) * cellWidth;

    ctx.save();

    if (i < activeIndex) {
      // Processed: full opacity, correspondence color, no glow
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
      // Not yet processed: dimmed
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }

    // Draw vote letter
    ctx.font = `bold ${fontSize}px ${monoFont}`;
    ctx.fillText(votes[i], cx, voteY);

    // Draw tally below (reset shadow for tally, keep alpha/color)
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.font = `${tallyFontSize}px ${monoFont}`;
    const tally = tallies[i];
    ctx.fillText(`${tally.a}:${tally.b}`, cx, tallyY);

    ctx.restore();
  }
}
