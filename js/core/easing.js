/**
 * Easing Utilities
 *
 * Provides easing functions for smooth animation transitions.
 * Used by the render function to transform raw linear progress
 * into perceptually smooth motion.
 */

/**
 * Cubic ease-in-out function (Robert Penner).
 * Normalized to [0,1] input/output domain.
 * Slow start, fast middle, slow end -- ideal for step transitions.
 *
 * @param {number} t - Raw progress value (clamped to [0,1])
 * @returns {number} Eased progress value in [0,1]
 */
export function easeInOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Linear interpolation between two values.
 *
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0 = a, 1 = b)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
