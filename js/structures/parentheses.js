/**
 * Balanced Parentheses Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * Mapping: +1 -> '(' , -1 -> ')'
 * Instance representation: string of balanced parentheses, e.g. "(()())"
 */

/**
 * Convert a Dyck word to a balanced parenthesis string.
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {string} Balanced parenthesis string
 */
export function fromDyck(dyckWord) {
  return dyckWord.map(s => s === 1 ? '(' : ')').join('');
}

/**
 * Convert a balanced parenthesis string back to a Dyck word.
 * @param {string} parens - Balanced parenthesis string
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(parens) {
  return [...parens].map(c => c === '(' ? 1 : -1);
}

/**
 * Render the parenthesis string centered in the bounding box.
 * Each character is drawn individually for independent coloring.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} instance - Balanced parenthesis string
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;

  if (!instance || instance.length === 0) return;

  const charCount = instance.length;
  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";

  // Scale font size to fill bounding box width, cap at 48px
  // Each char in monospace is roughly 0.6x font size wide
  const maxFontByWidth = Math.floor(width / (charCount * 0.6));
  const maxFontByHeight = Math.floor(height * 0.6);
  const fontSize = Math.min(maxFontByWidth, maxFontByHeight, 48);

  ctx.font = `bold ${fontSize}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Measure actual character width using the font
  const charWidth = ctx.measureText('(').width;
  const totalWidth = charWidth * charCount;
  const startX = x + (width - totalWidth) / 2;
  const centerY = y + height / 2;

  for (let i = 0; i < charCount; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillText(instance[i], startX + i * charWidth, centerY);
  }
}
