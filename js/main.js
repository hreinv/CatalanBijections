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
import { createAnimationEngine } from './engine/animation.js';
import { easeInOutCubic } from './core/easing.js';
import { getSteps as routerGetSteps } from './bijections/router.js';

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
    path: [],
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

// --- Bijection Step Loading ---

/**
 * Query the bijection router for animation steps matching the current
 * source/target pair. Updates animation state and step description.
 */
function loadBijectionSteps() {
  const result = routerGetSteps(state.sourceKey, state.targetKey, state.currentDyck, state.n);
  if (result !== null) {
    state.animation.steps = result.steps;
    state.animation.path = result.path;
    state.animation.currentStep = 0;
    state.animation.progress = 0.0;
  } else {
    state.animation.steps = [];
    state.animation.path = [];
  }
  updateStepDescription();
}

/**
 * Update the step description panel text based on current animation state.
 * Shows step info during animation, default message otherwise.
 */
function updateStepDescription() {
  if (!dom.stepDescription) return;

  if (state.animation.steps.length > 0 && state.animation.steps[state.animation.currentStep]) {
    const step = state.animation.steps[state.animation.currentStep];
    const stepText = `Step ${state.animation.currentStep + 1} of ${state.animation.steps.length}: ${step.description}`;

    // Show chain indicator for composed bijections (path through intermediate structures)
    if (state.animation.path.length > 2) {
      const chain = state.animation.path
        .map((key) => structures[key].label)
        .join(' \u2192 ');
      dom.stepDescription.textContent = `[${chain}] ${stepText}`;
    } else {
      dom.stepDescription.textContent = stepText;
    }
  } else if (state.sourceKey === state.targetKey) {
    // Identity case: same structure selected
    dom.stepDescription.textContent = 'Same structure selected \u2014 no transformation needed.';
  } else {
    dom.stepDescription.textContent = 'Select two structures to see a bijection animation.';
  }
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

  // --- Shared: panel labels and divider (both modes) ---
  const sourceLabel = structures[state.sourceKey].label;
  const targetLabel = structures[state.targetKey].label;

  ctx.fillStyle = theme.strokeColor;
  ctx.font = `bold 16px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(sourceLabel, padding + panelWidth / 2, padding);
  ctx.fillText(targetLabel, padding * 2 + panelWidth + panelWidth / 2, padding);

  const dividerX = padding + panelWidth + padding / 2;
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dividerX, padding);
  ctx.lineTo(dividerX, canvasHeight - padding);
  ctx.stroke();

  // --- Layout boxes for animation drawFrame ---
  const sourceBox = {
    x: padding,
    y: padding + labelHeight,
    width: panelWidth,
    height: panelHeight - labelHeight,
  };
  const targetBox = {
    x: padding * 2 + panelWidth,
    y: padding + labelHeight,
    width: panelWidth,
    height: panelHeight - labelHeight,
  };

  // --- Dual-mode: animation vs static ---
  const currentStep = state.animation.steps[state.animation.currentStep];
  if (state.animation.steps.length > 0 && currentStep) {
    // Animation mode: apply easing to raw linear progress, delegate to step drawFrame
    const easedProgress = easeInOutCubic(state.animation.progress);
    currentStep.drawFrame(ctx, easedProgress, {
      sourceBox,
      targetBox,
      theme,
      colors: CORRESPONDENCE_COLORS,
      currentStep: state.animation.currentStep,
      totalSteps: state.animation.steps.length,
    });
    updateStepDescription();
  } else {
    // Static mode: render source and target structures side-by-side
    const sourceModule = structures[state.sourceKey].module;
    const sourceInstance = sourceModule.fromDyck(state.currentDyck);
    sourceModule.draw(ctx, sourceInstance, {
      ...sourceBox,
      theme,
      colors: CORRESPONDENCE_COLORS,
    });

    const targetModule = structures[state.targetKey].module;
    const targetInstance = targetModule.fromDyck(state.currentDyck);
    targetModule.draw(ctx, targetInstance, {
      ...targetBox,
      theme,
      colors: CORRESPONDENCE_COLORS,
    });
  }
}

// --- Event Handlers ---

function onSourceChange() {
  state.sourceKey = dom.sourceSelect.value;
  resetAnimation();
  loadBijectionSteps();
  render();
}

function onTargetChange() {
  state.targetKey = dom.targetSelect.value;
  resetAnimation();
  loadBijectionSteps();
  render();
}

function onNChange() {
  state.n = parseInt(dom.nSelect.value, 10);
  state.instanceIndex = 0;
  resetAnimation();
  updateDerivedState();
  loadBijectionSteps();
  render();
}

function onPrev() {
  if (state.dyckWords.length === 0) return;
  state.instanceIndex = state.instanceIndex === 0
    ? state.dyckWords.length - 1
    : state.instanceIndex - 1;
  resetAnimation();
  updateDerivedState();
  loadBijectionSteps();
  render();
}

function onNext() {
  if (state.dyckWords.length === 0) return;
  state.instanceIndex = state.instanceIndex === state.dyckWords.length - 1
    ? 0
    : state.instanceIndex + 1;
  resetAnimation();
  updateDerivedState();
  loadBijectionSteps();
  render();
}

// --- Animation Engine (initialized in DOMContentLoaded) ---

let engine = null;

/**
 * Update the play/pause button text and title to reflect current state.
 */
function updatePlayPauseButton() {
  if (!dom.btnPlayPause) return;
  const playing = state.animation.playing;
  dom.btnPlayPause.textContent = playing ? 'Pause' : 'Play';
  dom.btnPlayPause.title = playing ? 'Pause animation' : 'Play animation';
}

/**
 * Reset animation state and pause. Called when structures or n change
 * to prevent orphan animation loops (Pitfall 4 from research).
 */
function resetAnimation() {
  if (engine) engine.pause();
  state.animation.steps = [];
  state.animation.path = [];
  state.animation.currentStep = 0;
  state.animation.progress = 0.0;
}

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
  dom.btnPlayPause = document.getElementById('btn-play-pause');
  dom.btnStepFwd = document.getElementById('btn-step-fwd');
  dom.btnStepBack = document.getElementById('btn-step-back');
  dom.btnStart = document.getElementById('btn-start');
  dom.btnEnd = document.getElementById('btn-end');
  dom.speedSlider = document.getElementById('speed-slider');
  dom.speedDisplay = document.getElementById('speed-display');
  dom.stepDescription = document.getElementById('step-description');

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

  // Load bijection steps for initial structure pair
  loadBijectionSteps();

  console.log(`App initialized: ${canvasWidth}x${canvasHeight}, n=${state.n}, ${state.dyckWords.length} instances`);

  // Attach event handlers
  dom.sourceSelect.addEventListener('change', onSourceChange);
  dom.targetSelect.addEventListener('change', onTargetChange);
  dom.nSelect.addEventListener('change', onNChange);
  dom.btnPrev.addEventListener('click', onPrev);
  dom.btnNext.addEventListener('click', onNext);

  // Initialize animation engine
  engine = createAnimationEngine({
    onRender: () => render(),
    getState: () => state.animation,
    setState: (changes) => {
      Object.assign(state.animation, changes);
      updatePlayPauseButton();
    },
  });

  // Wire playback controls
  dom.btnPlayPause.addEventListener('click', () => engine.togglePlay());
  dom.btnStepFwd.addEventListener('click', () => engine.stepForward());
  dom.btnStepBack.addEventListener('click', () => engine.stepBackward());
  dom.btnStart.addEventListener('click', () => engine.jumpToStart());
  dom.btnEnd.addEventListener('click', () => engine.jumpToEnd());

  // Wire speed slider
  dom.speedSlider.addEventListener('input', () => {
    const value = parseFloat(dom.speedSlider.value);
    engine.setSpeed(value);
    dom.speedDisplay.textContent = `${value.toFixed(1)}x`;
  });

  // Enable playback controls (remove disabled class set in Plan 02-02)
  document.querySelectorAll('#controls .control-group.disabled').forEach((el) => {
    el.classList.remove('disabled');
  });

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
