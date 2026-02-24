/**
 * Staircase Polygon Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A staircase polygon is the filled region under a Dyck path, visualized
 * as unit-square columns on a grid. Each column's height corresponds to
 * the running prefix sum of the Dyck word at that position.
 *
 * Instance representation: { n, columns: Array<{x, height}>, dyckWord: number[] }
 */

/**
 * Convert a Dyck word to a staircase polygon (columns under the Dyck path).
 * Walk the word, tracking running height (prefix sum). At each position i,
 * currentHeight += dyckWord[i]. Store column with that height.
 * Also stores a copy of the Dyck word for trivial round-trip.
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {{ n: number, columns: Array<{x: number, height: number}>, dyckWord: number[] }}
 */
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const columns = [];
  let currentHeight = 0;
  for (let i = 0; i < dyckWord.length; i++) {
    currentHeight += dyckWord[i];
    columns.push({ x: i, height: currentHeight });
  }
  return { n, columns, dyckWord: [...dyckWord] };
}

/**
 * Convert a staircase polygon instance back to a Dyck word.
 * Trivial round-trip via stored copy (same pattern as parentheses.js).
 *
 * @param {{ n: number, columns: Array<{x: number, height: number}>, dyckWord: number[] }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  return [...instance.dyckWord];
}

/**
 * Draw the staircase polygon within the bounding box.
 * Renders as filled rectangular columns on a grid with a staircase outline.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, columns: Array<{x: number, height: number}>, dyckWord: number[] }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { n, columns } = instance;

  if (columns.length === 0) return;

  const padding = 20;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // Grid dimensions: 2n columns wide, n rows tall
  const gridCols = 2 * n;
  const gridRows = n;

  const cellW = drawWidth / gridCols;
  const cellH = drawHeight / gridRows;

  // Convert grid coords to canvas coords
  // y=0 is at the bottom, y=n at top
  function toCanvasX(gx) { return x + padding + gx * cellW; }
  function toCanvasY(gy) { return y + padding + (gridRows - gy) * cellH; }

  // Draw light grid lines for context
  ctx.strokeStyle = theme.gridLine || '#E0E0E0';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= gridCols; gx++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(gx), toCanvasY(0));
    ctx.lineTo(toCanvasX(gx), toCanvasY(gridRows));
    ctx.stroke();
  }
  for (let gy = 0; gy <= gridRows; gy++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(gy));
    ctx.lineTo(toCanvasX(gridCols), toCanvasY(gy));
    ctx.stroke();
  }

  // Fill each column with semi-transparent color
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (col.height > 0) {
      ctx.fillStyle = colors[i % colors.length] + '40';
      ctx.fillRect(
        toCanvasX(col.x),
        toCanvasY(col.height),
        cellW,
        col.height * cellH
      );
    }
  }

  // Draw the staircase outline (top boundary) with thick strokes
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = theme.strokeWidth || 3;
  ctx.beginPath();

  // Start at the top-left corner of the first column
  const firstH = columns[0].height;
  ctx.moveTo(toCanvasX(0), toCanvasY(firstH));

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    // Horizontal line across this column at its height
    ctx.lineTo(toCanvasX(col.x + 1), toCanvasY(col.height));
    // Vertical line to the next column's height (if there is a next column)
    if (i < columns.length - 1) {
      ctx.lineTo(toCanvasX(col.x + 1), toCanvasY(columns[i + 1].height));
    }
  }
  ctx.stroke();

  // Draw the baseline at y=0 as a thin line
  ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), toCanvasY(0));
  ctx.lineTo(toCanvasX(gridCols), toCanvasY(0));
  ctx.stroke();
}
