/**
 * Non-Crossing Partition Structure Module
 *
 * Implements the uniform structure interface: fromDyck, toDyck, draw.
 *
 * A non-crossing partition of {1, ..., n} is a partition into blocks such
 * that if a < b < c < d with a,c in one block and b,d in another, those
 * blocks must be the same. C_n counts non-crossing partitions of {1,...,n}.
 *
 * Bijection: Each matched pair in the Dyck word corresponds to one element
 * (numbered 1..n by opening position). Elements whose matched pairs are
 * siblings at the same nesting depth within the same enclosing pair
 * belong to the same block.
 *
 * Instance representation: { n: number, partition: Array<Array<number>>, dyckWord: number[] }
 */

/**
 * Convert a Dyck word to a non-crossing partition of {1, ..., n}.
 *
 * Algorithm:
 * 1. Walk the Dyck word, assigning element indices 1..n to each +1 (opening).
 * 2. Track the current enclosing context using a stack. Elements that are
 *    consecutive siblings at the same depth within the same parent share a block.
 * 3. Use a stack of "current block at this context level" -- when entering a
 *    new nesting level (+1), check if there's already a block for this context;
 *    if so, add the element to it. When leaving (-1), pop the context.
 *
 * Stores a copy of the Dyck word for reliable round-trip.
 *
 * @param {number[]} dyckWord - Array of +1/-1 values
 * @returns {{ n: number, partition: Array<Array<number>>, dyckWord: number[] }}
 */
export function fromDyck(dyckWord) {
  const n = dyckWord.length / 2;
  if (n === 0) return { n: 0, partition: [], dyckWord: [] };

  // We use a context stack. Each entry in the stack represents being inside
  // a matched pair. At each nesting level, consecutive +1s that are siblings
  // (children of the same parent at the same depth) belong to the same block.
  //
  // contextStack tracks the block index for siblings at the current level.
  // When we see +1: the element gets the block for the current context level.
  // When we see -1: we pop the context, restoring the parent's block context.

  const partition = []; // Array of blocks (each block is array of 1-indexed elements)
  const blockMap = {};  // Maps context key to block index
  const contextStack = []; // Stack of context identifiers
  let elemIdx = 0;

  // Context key: identifies the "slot" where siblings live.
  // We use a counter that increments each time we enter a new nesting level.
  let contextCounter = 0;

  // The top-level context
  const topContext = contextCounter++;
  let currentContext = topContext;

  for (let i = 0; i < dyckWord.length; i++) {
    if (dyckWord[i] === 1) {
      elemIdx++;
      // This element belongs to the block for currentContext
      if (!(currentContext in blockMap)) {
        blockMap[currentContext] = partition.length;
        partition.push([]);
      }
      partition[blockMap[currentContext]].push(elemIdx);

      // Push current context and create a new context for children
      contextStack.push(currentContext);
      currentContext = contextCounter++;
    } else {
      // Pop: return to parent context
      currentContext = contextStack.pop();
    }
  }

  // Sort each block and sort blocks by minimum element
  for (const block of partition) {
    block.sort((a, b) => a - b);
  }
  partition.sort((a, b) => a[0] - b[0]);

  return { n, partition, dyckWord: [...dyckWord] };
}

/**
 * Convert a non-crossing partition instance back to its Dyck word.
 * Uses stored Dyck word copy for reliable round-trip.
 *
 * @param {{ n: number, partition: Array<Array<number>>, dyckWord: number[] }} instance
 * @returns {number[]} Dyck word as +1/-1 array
 */
export function toDyck(instance) {
  return [...instance.dyckWord];
}

/**
 * Render the non-crossing partition on a circle with colored arcs.
 *
 * Places n points evenly around a circle. For each partition block with 2+
 * elements, draws chords connecting consecutive elements in the block.
 * Each block gets a distinct correspondence color.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, partition: Array<Array<number>>, dyckWord: number[] }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[] }} opts
 */
export function draw(ctx, instance, opts) {
  const { x, y, width, height, theme, colors } = opts;
  const { n, partition } = instance;

  if (n === 0) return;

  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2 - 30;
  const pointRadius = 6;
  const fontFamily = theme.fontFamily || 'sans-serif';

  // Place n points evenly around the circle (starting at top, -PI/2, clockwise)
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    points.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
      angle,
    });
  }

  // Draw arcs for each partition block
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    const block = partition[bIdx];
    const color = colors[bIdx % colors.length];

    if (block.length >= 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      // Draw chords between all pairs of adjacent elements in the block
      // (connecting consecutive elements in the sorted block creates a
      // visually clean non-crossing pattern)
      for (let j = 0; j < block.length; j++) {
        for (let k = j + 1; k < block.length; k++) {
          const p1 = points[block[j] - 1]; // Convert 1-indexed to 0-indexed
          const p2 = points[block[k] - 1];

          // Draw as a quadratic curve bowing toward the center
          const midX = (p1.px + p2.px) / 2;
          const midY = (p1.py + p2.py) / 2;
          // Control point: move midpoint toward center
          const controlX = midX + (cx - midX) * 0.3;
          const controlY = midY + (cy - midY) * 0.3;

          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.quadraticCurveTo(controlX, controlY, p2.px, p2.py);
          ctx.stroke();
        }
      }
    }
  }

  // Draw filled circles at each point
  for (let i = 0; i < n; i++) {
    // Determine which block this element belongs to, for coloring
    let blockIdx = 0;
    for (let bIdx = 0; bIdx < partition.length; bIdx++) {
      if (partition[bIdx].includes(i + 1)) {
        blockIdx = bIdx;
        break;
      }
    }

    ctx.fillStyle = colors[blockIdx % colors.length];
    ctx.beginPath();
    ctx.arc(points[i].px, points[i].py, pointRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw black outline for visibility
    ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw labels outside the circle
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const angle = points[i].angle;
    const lx = cx + (radius + 18) * Math.cos(angle);
    const ly = cy + (radius + 18) * Math.sin(angle);
    ctx.fillText(String(i + 1), lx, ly);
  }
}

/**
 * Return the number of points in the partition.
 * @param {{ n: number, partition: Array<Array<number>>, dyckWord: number[] }} instance
 * @returns {number}
 */
export function elementCount(instance) {
  return instance.n;
}

/**
 * Draw non-crossing partition progressively with three-zone highlighting.
 * Circle layout and labels are always visible. Points use three-zone pattern.
 * Chords are only drawn when BOTH endpoints have been revealed.
 * Each point uses its block's color.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ n: number, partition: Array<Array<number>>, dyckWord: number[] }} instance
 * @param {{ x: number, y: number, width: number, height: number, theme: Object, colors: string[], activeIndex: number, progress: number }} opts
 */
export function drawProgressive(ctx, instance, opts) {
  const { x, y, width, height, theme, colors, activeIndex, progress } = opts;
  const { n, partition } = instance;

  if (n === 0) return;

  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2 - 30;
  const pointRadius = 6;
  const fontFamily = theme.fontFamily || 'sans-serif';

  // Place n points evenly around the circle (same as draw)
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    points.push({
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
      angle,
    });
  }

  // Build a map: point index (0-based) -> block index for coloring
  const pointBlockMap = new Array(n).fill(0);
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    for (const elem of partition[bIdx]) {
      pointBlockMap[elem - 1] = bIdx; // elem is 1-indexed
    }
  }

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 * Math.PI);

  // Draw chords: only when BOTH endpoints have been revealed
  // Point i (0-based) is revealed when i <= activeIndex
  for (let bIdx = 0; bIdx < partition.length; bIdx++) {
    const block = partition[bIdx];
    const color = colors[bIdx % colors.length];

    if (block.length >= 2) {
      for (let j = 0; j < block.length; j++) {
        for (let k = j + 1; k < block.length; k++) {
          const pi = block[j] - 1; // 0-indexed
          const pk = block[k] - 1;

          // Only draw if both endpoints are revealed
          if (pi <= activeIndex && pk <= activeIndex) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1.0;

            const p1 = points[pi];
            const p2 = points[pk];
            const midX = (p1.px + p2.px) / 2;
            const midY = (p1.py + p2.py) / 2;
            const controlX = midX + (cx - midX) * 0.3;
            const controlY = midY + (cy - midY) * 0.3;

            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.quadraticCurveTo(controlX, controlY, p2.px, p2.py);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }
  }

  // Draw points with three-zone pattern
  for (let i = 0; i < n; i++) {
    const blockIdx = pointBlockMap[i];
    ctx.save();

    if (i < activeIndex) {
      // Processed: filled colored circle + outline
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = colors[blockIdx % colors.length];
      ctx.beginPath();
      ctx.arc(points[i].px, points[i].py, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(points[i].px, points[i].py, pointRadius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (i === activeIndex) {
      // Active: filled circle + glow
      ctx.globalAlpha = 1.0;
      const color = colors[blockIdx % colors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.beginPath();
      ctx.arc(points[i].px, points[i].py, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(points[i].px, points[i].py, pointRadius, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Unprocessed: faint outline only
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = theme.strokeColor || '#1A1A1A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(points[i].px, points[i].py, pointRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw labels (always visible)
  ctx.fillStyle = theme.strokeColor || '#1A1A1A';
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const angle = points[i].angle;
    const lx = cx + (radius + 18) * Math.cos(angle);
    const ly = cy + (radius + 18) * Math.sin(angle);
    ctx.fillText(String(i + 1), lx, ly);
  }
}
