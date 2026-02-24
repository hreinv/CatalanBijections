/**
 * Application Controller
 *
 * Manages app state, wires UI controls to structure modules,
 * and renders side-by-side Catalan structures on the canvas.
 */

import { setupCanvas, clearCanvas } from './core/canvas-utils.js';
import { enumerate } from './core/dyck.js';
import { CORRESPONDENCE_COLORS } from './core/colors.js';
import { structures } from './structures/registry.js';

// --- Application State ---

const state = {
  n: 3,
  instanceIndex: 0,
  sourceKey: 'parentheses',
  targetKey: 'dyck-path',
  dyckWords: [],
  currentDyck: null,
  animation: {
    steps: [],
    currentStep: 0,
    progress: 0.0,
    playing: false,
    speed: 1.0,
  },
};

// --- Rendering Context (module-scoped, not app state) ---

let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;
let theme = null;

// --- DOM References ---

const dom = {};

// --- Theme ---

/**
 * Read theme values from CSS custom properties.
 * @returns {Object} Frozen theme configuration object
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
    gridLine: '#E0E0E0',
  });
}

// --- Dropdown Population ---

/**
 * Populate source and target dropdowns from the structure registry.
 */
function populateDropdowns() {
  for (const [key, entry] of Object.entries(structures)) {
    const srcOption = document.createElement('option');
    srcOption.value = key;
    srcOption.textContent = entry.label;
    dom.sourceSelect.appendChild(srcOption);

    const tgtOption = document.createElement('option');
    tgtOption.value = key;
    tgtOption.textContent = entry.label;
    dom.targetSelect.appendChild(tgtOption);
  }

  dom.sourceSelect.value = state.sourceKey;
  dom.targetSelect.value = state.targetKey;
}

// --- Derived State ---

/**
 * Recompute derived state (dyckWords, currentDyck) after n or instanceIndex changes.
 * Updates the instance indicator display.
 */
function updateDerivedState() {
  state.dyckWords = enumerate(state.n);
  state.instanceIndex = Math.max(0, Math.min(state.instanceIndex, state.dyckWords.length - 1));
  state.currentDyck = state.dyckWords[state.instanceIndex];
  dom.instanceIndicator.textContent = `${state.instanceIndex + 1} of ${state.dyckWords.length}`;
}

// --- Rendering ---

/**
 * Render both structures side-by-side on the canvas.
 * Left panel: source structure. Right panel: target structure.
 * A thin vertical divider separates the panels.
 */
function render() {
  clearCanvas(ctx, canvasWidth, canvasHeight);

  // Guard: no Dyck word available (e.g., during init)
  if (!state.currentDyck) return;

  const padding = 20;
  const labelHeight = 30;
  const panelWidth = (canvasWidth - padding * 3) / 2;
  const panelHeight = canvasHeight - padding * 2;

  // Draw panel labels
  ctx.fillStyle = theme.strokeColor;
  ctx.font = `bold 16px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const sourceLabel = structures[state.sourceKey].label;
  const targetLabel = structures[state.targetKey].label;

  ctx.fillText(sourceLabel, padding + panelWidth / 2, padding);
  ctx.fillText(targetLabel, padding * 2 + panelWidth + panelWidth / 2, padding);

  // Draw vertical divider
  const dividerX = padding + panelWidth + padding / 2;
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dividerX, padding);
  ctx.lineTo(dividerX, canvasHeight - padding);
  ctx.stroke();

  // Render source structure (left panel)
  const sourceModule = structures[state.sourceKey].module;
  const sourceInstance = sourceModule.fromDyck(state.currentDyck);
  sourceModule.draw(ctx, sourceInstance, {
    x: padding,
    y: padding + labelHeight,
    width: panelWidth,
    height: panelHeight - labelHeight,
    theme,
    colors: CORRESPONDENCE_COLORS,
  });

  // Render target structure (right panel)
  const targetModule = structures[state.targetKey].module;
  const targetInstance = targetModule.fromDyck(state.currentDyck);
  targetModule.draw(ctx, targetInstance, {
    x: padding * 2 + panelWidth,
    y: padding + labelHeight,
    width: panelWidth,
    height: panelHeight - labelHeight,
    theme,
    colors: CORRESPONDENCE_COLORS,
  });
}

// --- Event Handlers ---

function onSourceChange() {
  state.sourceKey = dom.sourceSelect.value;
  render();
}

function onTargetChange() {
  state.targetKey = dom.targetSelect.value;
  render();
}

function onNChange() {
  state.n = parseInt(dom.nSelect.value, 10);
  state.instanceIndex = 0;
  updateDerivedState();
  render();
}

function onPrev() {
  if (state.dyckWords.length === 0) return;
  state.instanceIndex = state.instanceIndex === 0
    ? state.dyckWords.length - 1
    : state.instanceIndex - 1;
  updateDerivedState();
  render();
}

function onNext() {
  if (state.dyckWords.length === 0) return;
  state.instanceIndex = state.instanceIndex === state.dyckWords.length - 1
    ? 0
    : state.instanceIndex + 1;
  updateDerivedState();
  render();
}

// Playback controls wired in Plan 02-03

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM references
  const canvas = document.getElementById('main-canvas');
  dom.sourceSelect = document.getElementById('source-select');
  dom.targetSelect = document.getElementById('target-select');
  dom.nSelect = document.getElementById('n-select');
  dom.btnPrev = document.getElementById('btn-prev');
  dom.btnNext = document.getElementById('btn-next');
  dom.instanceIndicator = document.getElementById('instance-indicator');

  // Setup canvas
  ({ ctx, width: canvasWidth, height: canvasHeight } = setupCanvas(canvas));

  // Read theme
  theme = readTheme();

  // Populate dropdowns from registry
  populateDropdowns();

  // Set initial derived state
  updateDerivedState();

  // Initial render
  render();

  console.log(`App initialized: ${canvasWidth}x${canvasHeight}, n=${state.n}, ${state.dyckWords.length} instances`);

  // Attach event handlers
  dom.sourceSelect.addEventListener('change', onSourceChange);
  dom.targetSelect.addEventListener('change', onTargetChange);
  dom.nSelect.addEventListener('change', onNChange);
  dom.btnPrev.addEventListener('click', onPrev);
  dom.btnNext.addEventListener('click', onNext);

  // Resize handler with 200ms debounce
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ({ ctx, width: canvasWidth, height: canvasHeight } = setupCanvas(canvas));
      theme = readTheme();
      render();
      console.log(`Canvas resized: ${canvasWidth}x${canvasHeight}`);
    }, 200);
  });
});
