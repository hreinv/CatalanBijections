/**
 * Stack-Sortable Permutation Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A stack-sortable permutation of {1, ..., n} is a permutation that can be
 * sorted using a single stack (Knuth, 1968). These are exactly the
 * 231-avoiding permutations. C_n counts them.
 *
 * Bijection: Walk Dyck word -- +1 = push next input value onto stack,
 * -1 = pop stack top to output. Reverse via greedy stack-sorting simulation.
 *
 * Instance representation: { perm: number[], n: number }
 */

/**
 * Convert a Dyck word to a stack-sortable permutation.
 * Walk the word: +1 = push next input value (1, 2, ...) onto stack,
 * -1 = pop stack top and append to output permutation.
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {{ perm: number[], n: number }}
 */
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  const perm = [];
  const stack = [];
  let inputIdx = 1;

  for (const step of dyckWord) {
    if (step === 1) {
      stack.push(inputIdx);
      inputIdx++;
    } else {
      perm.push(stack.pop());
    }
  }

  return { perm, n };
}

/**
 * Convert a stack-sortable permutation back to its Dyck word.
 * Simulate Knuth's stack-sorting algorithm with greedy popping:
 * always pop when the stack top matches the next expected output value.
 *
 * CRITICAL: Use a while loop for popping (greedy), not if.
 * The condition check order matters: pop before push.
 *
 * @param {{ perm: number[], n: number }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  const { perm, n } = instance;
  const word = [];
  const stack = [];
  let nextInput = 1; // Next value to push (inputs arrive in order 1,2,3,...)

  // Reconstruct the push/pop sequence that produces this output permutation.
  // For each output value in the permutation:
  //   1. Push all input values up to and including the output value
  //   2. Pop the output value (it's now on top of the stack)
  for (let i = 0; i < n; i++) {
    const target = perm[i]; // Next value that must be popped
    // Push input values until target is on the stack
    while (nextInput <= target) {
      stack.push(nextInput);
      word.push(1);
      nextInput++;
    }
    // Now target is on top of the stack -- pop it
    stack.pop();
    word.push(-1);
  }

  return word;
}

/**
 * Render the permutation as a row of labeled boxes with correspondence colors.
 * Each box contains the permutation value at that position.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ perm: number[], n: number }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { perm, n } = instance;

  if (!perm || perm.length === 0) return;

  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const padding = 10;

  // Compute box dimensions
  const availWidth = width - padding * 2;
  const availHeight = height - padding * 2;
  const boxSize = Math.min(availWidth / n, availHeight * 0.6, 60);
  const totalBoxWidth = boxSize * n;
  const startX = x + (width - totalBoxWidth) / 2;
  const centerY = y + height * 0.45;

  // Font sizes
  const valueFontSize = Math.max(12, Math.floor(boxSize * 0.5));
  const indexFontSize = Math.max(8, Math.floor(boxSize * 0.3));

  // Draw boxes with permutation values
  for (let i = 0; i < n; i++) {
    const bx = startX + i * boxSize;
    const by = centerY - boxSize / 2;

    // Fill box with semi-transparent color based on value
    ctx.fillStyle = colors[(perm[i] - 1) % colors.length] + '40';
    ctx.fillRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);

    // Draw box border
    ctx.strokeStyle = colors[(perm[i] - 1) % colors.length];
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);

    // Draw permutation value inside box
    ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    ctx.font = `bold ${valueFontSize}px ${monoFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(perm[i]), bx + boxSize / 2, centerY);

    // Draw position index below box
    ctx.fillStyle = theme.strokeColor || '#999';
    ctx.font = `${indexFontSize}px ${monoFont}`;
    ctx.fillText(String(i + 1), bx + boxSize / 2, centerY + boxSize / 2 + indexFontSize);
  }

  // Draw label above
  const labelFontSize = Math.max(10, Math.floor(boxSize * 0.25));
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `${labelFontSize}px ${monoFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    'Stack-sortable: [' + perm.join(', ') + ']',
    x + width / 2,
    centerY - boxSize / 2 - 4
  );
}

/**
 * Return the number of progressive elements (values/boxes) in the permutation.
 *
 * @param {{ perm: number[], n: number }} instance
 * @returns {number}
 */
export function elementCount(instance) {
  return instance.n;
}

/**
 * Draw the stack-sortable permutation progressively, revealing boxes one at a time.
 *
 * - Label text always shows the full permutation.
 * - Processed boxes (i < activeIndex): colored fill + border (same as draw()).
 * - Active box (i === activeIndex): colored fill + border + pulsing glow.
 * - Unprocessed boxes (i > activeIndex): faint border only, dimmed value text.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ perm: number[], n: number }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  const { x, y, width, height, theme, colors, activeIndex, progress } = opts;
  const { perm, n } = instance;

  if (!perm || perm.length === 0) return;

  const monoFont = theme.monoFont || "'Consolas', 'Courier New', monospace";
  const padding = 10;

  const availWidth = width - padding * 2;
  const availHeight = height - padding * 2;
  const boxSize = Math.min(availWidth / n, availHeight * 0.6, 60);
  const totalBoxWidth = boxSize * n;
  const startX = x + (width - totalBoxWidth) / 2;
  const centerY = y + height * 0.45;

  const valueFontSize = Math.max(12, Math.floor(boxSize * 0.5));
  const indexFontSize = Math.max(8, Math.floor(boxSize * 0.3));

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw label above (always full permutation)
  ctx.save();
  const labelFontSize = Math.max(10, Math.floor(boxSize * 0.25));
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `${labelFontSize}px ${monoFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    'Stack-sortable: [' + perm.join(', ') + ']',
    x + width / 2,
    centerY - boxSize / 2 - 4
  );
  ctx.restore();

  // Draw boxes with three-zone pattern
  for (let i = 0; i < n; i++) {
    const bx = startX + i * boxSize;
    const by = centerY - boxSize / 2;

    ctx.save();

    if (i < activeIndex) {
      // Processed: full opacity, colored fill + border
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[(perm[i] - 1) % colors.length] + '40';
      ctx.fillRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);

      ctx.strokeStyle = colors[(perm[i] - 1) % colors.length];
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);
    } else if (i === activeIndex) {
      // Active: full opacity, colored fill + border + pulsing glow
      ctx.globalAlpha = 1.0;
      const color = colors[(perm[i] - 1) % colors.length];
      ctx.fillStyle = color + '40';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.fillRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);
    } else {
      // Unprocessed: faint border only, no fill
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);
    }

    ctx.restore();

    // Draw value text
    ctx.save();
    if (i > activeIndex) {
      // Dimmed text for unprocessed
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    } else {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = theme.strokeColor || '#1A1A1A';
    }
    ctx.font = `bold ${valueFontSize}px ${monoFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(perm[i]), bx + boxSize / 2, centerY);
    ctx.restore();

    // Draw position index below box
    ctx.save();
    if (i > activeIndex) {
      ctx.globalAlpha = 0.25;
    }
    ctx.fillStyle = theme.strokeColor || '#999';
    ctx.font = `${indexFontSize}px ${monoFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), bx + boxSize / 2, centerY + boxSize / 2 + indexFontSize);
    ctx.restore();
  }
}
