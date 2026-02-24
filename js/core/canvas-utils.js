/**
 * HiDPI canvas setup and clear utilities.
 * Handles devicePixelRatio scaling so all rendering is sharp on Retina/HiDPI displays.
 */

/**
 * Configure a canvas element for HiDPI rendering.
 * Sets the internal resolution to match devicePixelRatio and applies CSS sizing.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to set up
 * @returns {{ ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number }}
 */
export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.scale(dpr, dpr);

  return { ctx, width: rect.width, height: rect.height, dpr };
}

/**
 * Clear the entire canvas with a white fill.
 * Uses fillRect instead of clearRect since alpha is disabled.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - CSS pixel width
 * @param {number} height - CSS pixel height
 */
export function clearCanvas(ctx, width, height) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
}
