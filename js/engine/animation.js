/**
 * Animation Engine
 *
 * Provides a requestAnimationFrame-based animation loop with timestamp delta
 * timing for display-refresh-independent animation. Manages playback state
 * (play, pause, step, jump, speed) via a decoupled callback interface.
 *
 * Factory function pattern: createAnimationEngine(options) returns an engine
 * object. The engine reads/writes animation state via getState()/setState()
 * callbacks, keeping it independent of the app controller's state structure.
 */

/** Default duration per animation step in milliseconds */
const STEP_DURATION_MS = 800;

/**
 * Create an animation engine instance.
 *
 * @param {{ onRender: Function, getState: Function, setState: Function }} options
 *   - onRender: called after each tick to trigger canvas redraw
 *   - getState: returns { steps, currentStep, progress, playing, speed }
 *   - setState: merges changes into animation state, e.g. setState({ playing: true })
 * @returns {Object} Engine API with play, pause, togglePlay, stepForward,
 *   stepBackward, jumpToStart, jumpToEnd, setSpeed, isPlaying
 */
export function createAnimationEngine({ onRender, getState, setState }) {
  // --- Internal engine state (not part of app state) ---
  let animFrameId = null;
  let lastTimestamp = null;

  // --- Internal tick function ---

  /**
   * Animation tick callback for requestAnimationFrame.
   * Computes delta time from the DOMHighResTimeStamp, advances animation
   * progress, handles step transitions, and schedules the next frame.
   *
   * @param {DOMHighResTimeStamp} timestamp
   */
  function tick(timestamp) {
    const state = getState();

    // First frame: just record timestamp, no delta
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
      onRender();
      if (state.playing) {
        animFrameId = requestAnimationFrame(tick);
      }
      return;
    }

    const rawDelta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const deltaMs = rawDelta * state.speed;

    // If steps array is empty, pause immediately (no-op animation)
    if (!state.steps || state.steps.length === 0) {
      setState({ playing: false });
      animFrameId = null;
      lastTimestamp = null;
      return;
    }

    // Advance progress within the current step
    let newProgress = state.progress + deltaMs / STEP_DURATION_MS;
    let newStep = state.currentStep;

    if (newProgress >= 1.0) {
      // Check if we can advance to the next step
      if (newStep < state.steps.length - 1) {
        newStep += 1;
        newProgress = 0.0;
      } else {
        // Animation complete: clamp at final position and pause
        newProgress = 1.0;
        setState({ currentStep: newStep, progress: newProgress, playing: false });
        animFrameId = null;
        lastTimestamp = null;
        onRender();
        return;
      }
    }

    setState({ currentStep: newStep, progress: newProgress });
    onRender();

    // Schedule next frame if still playing
    const updatedState = getState();
    if (updatedState.playing) {
      animFrameId = requestAnimationFrame(tick);
    } else {
      animFrameId = null;
      lastTimestamp = null;
    }
  }

  // --- Public API ---

  /**
   * Start the animation loop.
   * Sets playing=true, resets lastTimestamp, schedules tick.
   * No-op if already playing. Immediately pauses if steps are empty.
   */
  function play() {
    const state = getState();

    // No-op if already playing (prevent duplicate loops)
    if (state.playing) return;

    // If steps are empty, no-op (don't start a loop that will immediately stop)
    if (!state.steps || state.steps.length === 0) {
      return;
    }

    // Cancel any orphan rAF before starting a new loop
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    lastTimestamp = null;
    setState({ playing: true });
    animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Stop the animation loop.
   * Sets playing=false, cancels any pending rAF frame.
   * No-op if already paused.
   */
  function pause() {
    setState({ playing: false });
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    lastTimestamp = null;
  }

  /**
   * Toggle between play and pause.
   */
  function togglePlay() {
    const state = getState();
    if (state.playing) {
      pause();
    } else {
      play();
    }
  }

  /**
   * Advance to the next animation step.
   * Clamps at the last step. Pauses if playing. Triggers render.
   * No-op if steps are empty.
   */
  function stepForward() {
    const state = getState();
    if (!state.steps || state.steps.length === 0) return;

    if (state.playing) pause();

    const newStep = Math.min(state.currentStep + 1, state.steps.length - 1);
    setState({ currentStep: newStep, progress: 0.0 });
    onRender();
  }

  /**
   * Retreat to the previous animation step.
   * Clamps at step 0. Pauses if playing. Triggers render.
   * No-op if steps are empty.
   */
  function stepBackward() {
    const state = getState();
    if (!state.steps || state.steps.length === 0) return;

    if (state.playing) pause();

    const newStep = Math.max(state.currentStep - 1, 0);
    setState({ currentStep: newStep, progress: 0.0 });
    onRender();
  }

  /**
   * Jump to the start of the animation.
   * Sets step=0, progress=0.0. Pauses if playing. Triggers render.
   * No-op if steps are empty.
   */
  function jumpToStart() {
    const state = getState();
    if (!state.steps || state.steps.length === 0) return;

    if (state.playing) pause();

    setState({ currentStep: 0, progress: 0.0 });
    onRender();
  }

  /**
   * Jump to the end of the animation.
   * Sets step=last, progress=1.0. Pauses if playing. Triggers render.
   * No-op if steps are empty.
   */
  function jumpToEnd() {
    const state = getState();
    if (!state.steps || state.steps.length === 0) return;

    if (state.playing) pause();

    setState({ currentStep: state.steps.length - 1, progress: 1.0 });
    onRender();
  }

  /**
   * Set playback speed multiplier.
   * Clamped to [0.5, 3.0].
   *
   * @param {number} v - Desired speed multiplier
   */
  function setSpeed(v) {
    const clamped = Math.max(0.5, Math.min(3.0, v));
    setState({ speed: clamped });
  }

  /**
   * Query whether the animation is currently playing.
   * @returns {boolean}
   */
  function isPlaying() {
    return getState().playing;
  }

  return {
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    setSpeed,
    isPlaying,
  };
}
