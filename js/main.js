/**
 * Application entry point.
 * Wires canvas setup, reads CSS theme properties, and draws a verification pattern.
 */

import { setupCanvas, clearCanvas } from './core/canvas-utils.js';

/**
 * Read theme values from CSS custom properties.
 * @returns {Object} Theme configuration object
 */
function readTheme() {
  const styles = getComputedStyle(document.documentElement);
  return Object.freeze({
    strokeColor: styles.getPropertyValue('--stroke-color').trim(),
    strokeWidth: Number(styles.getPropertyValue('--stroke-width').trim()),
    fontSize: styles.getPropertyValue('--font-size').trim(),
    nodeRadius: Number(styles.getPropertyValue('--node-radius').trim()),
    fontFamily: styles.getPropertyValue('--font-family').trim(),
    monoFont: styles.getPropertyValue('--mono-font').trim(),
  });
}

/**
 * Draw a verification pattern to confirm HiDPI sharpness and theme application.
 * Draws title text, a horizontal line, and a filled circle.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - CSS pixel width
 * @param {number} height - CSS pixel height
 * @param {Object} theme - Theme configuration
 */
function drawVerificationPattern(ctx, width, height, theme) {
  // Title text centered at top
  ctx.fillStyle = theme.strokeColor;
  ctx.font = `bold ${theme.fontSize} ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Catalan Bijection Explorer', width / 2, 24);

  // Horizontal line at 1/3 height
  const lineY = Math.round(height / 3);
  ctx.strokeStyle = theme.strokeColor;
  ctx.lineWidth = theme.strokeWidth;
  ctx.beginPath();
  ctx.moveTo(0, lineY);
  ctx.lineTo(width, lineY);
  ctx.stroke();

  // Filled circle at center
  ctx.fillStyle = theme.strokeColor;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, theme.nodeRadius, 0, Math.PI * 2);
  ctx.fill();
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('main-canvas');
  let { ctx, width, height, dpr } = setupCanvas(canvas);
  clearCanvas(ctx, width, height);

  const theme = readTheme();
  drawVerificationPattern(ctx, width, height, theme);

  console.log(`Canvas initialized: ${width}x${height} @${dpr}x`);

  // Resize handler with 200ms debounce
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ({ ctx, width, height, dpr } = setupCanvas(canvas));
      clearCanvas(ctx, width, height);
      const updatedTheme = readTheme();
      drawVerificationPattern(ctx, width, height, updatedTheme);
      console.log(`Canvas resized: ${width}x${height} @${dpr}x`);
    }, 200);
  });
});
