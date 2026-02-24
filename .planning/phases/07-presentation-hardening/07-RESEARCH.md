# Phase 7: Presentation Hardening - Research

**Researched:** 2026-02-24
**Domain:** Keyboard event handling, animation resilience, projector color accessibility
**Confidence:** HIGH

## Summary

Phase 7 addresses the final functional requirement (UICT-08: keyboard shortcuts) and two resilience/quality success criteria (edge case handling and projector color verification). The codebase is mature -- all 40 of 41 v1 requirements are complete, the animation engine is solid, and a resize handler already exists. This phase is about wiring keyboard events to the existing engine API, hardening against tab-switch and rapid-input edge cases, and verifying (or correcting) the color palette for projector legibility.

The existing `createAnimationEngine` already exposes `togglePlay()`, `stepForward()`, `stepBackward()`, `jumpToStart()`, `jumpToEnd()`, and `setSpeed()` -- these are exactly the functions keyboard shortcuts need to call. No new engine work is required; this is purely a wiring and hardening phase.

**Primary recommendation:** Add a single `document.addEventListener('keydown', handler)` in main.js that maps keys to existing engine methods, guard it against active form elements, add a `visibilitychange` listener to pause on tab-switch, and replace the current color palette with the Okabe-Ito palette (the standard for color-blind-safe 8-color data visualization).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UICT-08 | Keyboard shortcuts (spacebar play/pause, arrow keys step, number keys speed) | Keyboard event pattern (keydown on document, event.key matching, preventDefault for Space/arrows), engine API already exposes all needed methods |
</phase_requirements>

## Standard Stack

### Core

No new libraries. This phase uses only browser-native APIs already available in the project.

| API | Purpose | Why Standard |
|-----|---------|--------------|
| `KeyboardEvent` (keydown) | Detect keyboard input | Native DOM API, zero dependencies, supported in all modern browsers |
| `event.key` property | Identify which key was pressed | Modern standard replacing deprecated `keyCode`; readable string values like `'ArrowLeft'`, `' '` (space) |
| `Page Visibility API` (`document.visibilitychange`) | Detect tab switching | Native browser API for knowing when page is hidden/visible |
| `ResizeObserver` | Detect container size changes | Already handled by existing `window.resize` listener with debounce (sufficient for this project) |

### Supporting

None required. All functionality is built on existing browser APIs and the existing animation engine.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw keydown listener | Hotkeys.js library | Adds dependency; project constraint is zero dependencies (FOUND-01). Raw listener is 20-30 lines. |
| `event.key` string matching | `event.code` physical key codes | `event.key` is correct for this use case -- we want logical key intent ("play/pause" not "physical key position"). `event.code` is for game-style positional input. |
| `visibilitychange` event | `blur`/`focus` events | `blur`/`focus` fires on window switch, not tab switch specifically. `visibilitychange` is the correct API for "is the page actually hidden?" |

**Installation:** None -- zero-dependency project.

## Architecture Patterns

### Recommended Structure

No new files. All changes go in `js/main.js`:

```
js/main.js  (add ~40-60 lines)
  +-- keydown handler function
  +-- visibilitychange handler
  +-- minor speed preset mapping
js/core/colors.js  (modify ~5 lines)
  +-- Replace CORRESPONDENCE_COLORS hex values with Okabe-Ito palette
```

### Pattern 1: Centralized Keyboard Handler with Element Guard

**What:** A single `keydown` listener on `document` that maps key values to engine methods, with a guard that ignores events when focus is on form elements (select, input).

**When to use:** When keyboard shortcuts are global (not scoped to a specific element) and must not interfere with form controls.

**Example:**
```javascript
// Source: MDN KeyboardEvent.key, web best practices
function onKeyDown(e) {
  // Guard: don't capture keys when user is interacting with form controls
  const tag = e.target.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

  switch (e.key) {
    case ' ':
      e.preventDefault(); // Prevent page scroll on spacebar
      engine.togglePlay();
      break;
    case 'ArrowRight':
      e.preventDefault(); // Prevent horizontal scroll
      engine.stepForward();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      engine.stepBackward();
      break;
    case '1':
      engine.setSpeed(0.5);
      syncSpeedUI(0.5);
      break;
    case '2':
      engine.setSpeed(1.0);
      syncSpeedUI(1.0);
      break;
    case '3':
      engine.setSpeed(1.5);
      syncSpeedUI(1.5);
      break;
    case '4':
      engine.setSpeed(2.0);
      syncSpeedUI(2.0);
      break;
    case '5':
      engine.setSpeed(3.0);
      syncSpeedUI(3.0);
      break;
    default:
      return; // Don't prevent default for unhandled keys
  }
}
document.addEventListener('keydown', onKeyDown);
```

### Pattern 2: Visibility Change Handler for Tab-Switch Resilience

**What:** Listen for `visibilitychange` to pause animation when the tab becomes hidden, preventing large timestamp deltas when returning.

**When to use:** Any `requestAnimationFrame`-based animation that should not accumulate time while hidden.

**Why critical:** When a tab is backgrounded, browsers throttle or pause `requestAnimationFrame`. On return, the delta between `lastTimestamp` and the new timestamp can be huge (seconds or minutes), causing the animation to skip ahead or behave erratically. The existing engine already resets `lastTimestamp = null` on pause, so pausing on visibility change is sufficient.

**Example:**
```javascript
// Source: MDN Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine && engine.isPlaying()) {
    engine.pause();
    // Optionally update play/pause button state
    updatePlayPauseButton();
  }
});
```

### Pattern 3: Speed UI Synchronization

**What:** When keyboard shortcuts change speed, the slider and display must reflect the new value.

**When to use:** Any time a programmatic change must sync with DOM controls.

**Example:**
```javascript
function syncSpeedUI(value) {
  dom.speedSlider.value = value;
  dom.speedDisplay.textContent = `${value.toFixed(1)}x`;
}
```

### Anti-Patterns to Avoid

- **Separate keydown listeners per key:** Creates multiple listeners that must all be managed. Use one switch/case handler.
- **Using `keypress` event:** Deprecated. Use `keydown` exclusively.
- **Using `keyCode` numeric values:** Deprecated. Use `event.key` string values.
- **Not guarding form elements:** Spacebar in a `<select>` opens the dropdown -- intercepting it breaks native behavior.
- **Not calling `preventDefault()` for Space and Arrow keys:** Space scrolls the page, arrows scroll or change dropdown values. Must prevent default when handling these keys.
- **Resuming animation on visibility change:** The requirement is to pause on tab-switch, not auto-resume. The presenter should explicitly resume with spacebar after returning.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color-blind-safe palette | Custom hand-picked hex colors | Okabe-Ito 8-color palette | Scientifically validated for all forms of color vision deficiency; published in Nature Methods; standard in data visualization |
| Keyboard shortcut framework | Custom event routing system | Single switch/case on `event.key` | 20-30 lines of code; a framework would be overkill for ~8 key bindings |
| Resize debouncing | Custom debounce utility | `setTimeout`/`clearTimeout` (already in codebase) | Already implemented in main.js with 200ms debounce |
| Animation pause on tab switch | Custom timer tracking | `visibilitychange` + existing engine.pause() | Browser-native API, 5 lines of code |

**Key insight:** The existing animation engine API already provides every method the keyboard shortcuts need. This phase is almost entirely "wiring" -- connecting DOM events to existing functions. The only substantive change is the color palette replacement.

## Common Pitfalls

### Pitfall 1: Spacebar Scrolls the Page

**What goes wrong:** Pressing spacebar to toggle play/pause also scrolls the page down, especially on pages taller than the viewport.
**Why it happens:** Spacebar's default browser behavior is "scroll down one screenful."
**How to avoid:** Call `e.preventDefault()` in the `keydown` handler when `e.key === ' '` and the target is not a form element.
**Warning signs:** Page jumps when pressing spacebar during the presentation.

### Pitfall 2: Arrow Keys Interfere with Dropdown Navigation

**What goes wrong:** Left/right arrow keys step the animation BUT also change the selected value in a focused `<select>` dropdown.
**How to avoid:** Guard the keyboard handler -- if `e.target.tagName === 'SELECT'`, return early without handling the key. This lets the dropdown work normally when focused.
**Warning signs:** Selecting a structure from the dropdown while arrow keys are also stepping the animation.

### Pitfall 3: Large Timestamp Delta After Tab Return

**What goes wrong:** After switching to another tab and back, the animation jumps ahead by the elapsed hidden time.
**Why it happens:** `requestAnimationFrame` is paused while the tab is hidden. On return, the timestamp delta is the entire hidden duration.
**How to avoid:** Listen for `visibilitychange` and pause the engine when `document.hidden` becomes true. The existing engine already resets `lastTimestamp = null` on pause, which prevents delta accumulation on next play.
**Warning signs:** Animation suddenly at the end after alt-tabbing during a presentation.

### Pitfall 4: Speed Slider Out of Sync with Keyboard Speed Changes

**What goes wrong:** Pressing number keys changes the playback speed but the slider still shows the old position and the speed display text is stale.
**How to avoid:** After `engine.setSpeed(value)`, also update `dom.speedSlider.value = value` and `dom.speedDisplay.textContent`.
**Warning signs:** Speed display says "1.0x" but animation is playing at 2.0x.

### Pitfall 5: Rapid Key Presses Cause State Corruption

**What goes wrong:** Pressing arrow keys rapidly (holding them down) fires many keydown events. Each calls `stepForward()` or `stepBackward()`, which pauses the engine if playing, sets new step/progress, and renders.
**Why it happens:** `keydown` fires repeatedly when a key is held (key repeat). Each event is a full step transition.
**How to avoid:** The existing engine methods already handle this correctly -- `stepForward()` clamps at the last step, `stepBackward()` clamps at step 0, and both call `onRender()`. No additional debouncing is needed because each step is a valid discrete operation. The key repeat rate (~30ms) is well within the rendering budget. However, if the animation is playing, rapid stepping should pause first (which the engine already does).
**Warning signs:** None expected -- but verify by holding arrow keys for 2+ seconds.

### Pitfall 6: Color Palette Fails on Projector

**What goes wrong:** Colors that look distinct on a laptop screen wash out or become indistinguishable on a classroom projector.
**Why it happens:** Projectors have lower color gamut, lower contrast ratio, and ambient light wash. Adjacent hues (blue/cyan, red/orange) merge.
**How to avoid:** Use the Okabe-Ito palette, which was specifically designed for distinguishability across all display types and color vision deficiencies. The current palette has two potentially problematic adjacent pairs: cyan (#00BCD4) vs blue (#2196F3), and brown (#795548) vs blue-grey (#607D8B).
**Warning signs:** Squinting at the projector to distinguish elements during rehearsal.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Complete Keyboard Handler

```javascript
// Source: MDN KeyboardEvent.key, project animation engine API
const SPEED_PRESETS = { '1': 0.5, '2': 1.0, '3': 1.5, '4': 2.0, '5': 3.0 };

function onKeyDown(e) {
  const tag = e.target.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

  switch (e.key) {
    case ' ':
      e.preventDefault();
      engine.togglePlay();
      updatePlayPauseButton();
      break;
    case 'ArrowRight':
      e.preventDefault();
      engine.stepForward();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      engine.stepBackward();
      break;
    default:
      if (SPEED_PRESETS[e.key] !== undefined) {
        const speed = SPEED_PRESETS[e.key];
        engine.setSpeed(speed);
        dom.speedSlider.value = speed;
        dom.speedDisplay.textContent = `${speed.toFixed(1)}x`;
      }
      return; // Don't prevent default for unhandled keys
  }
}
```

### Visibility Change Handler

```javascript
// Source: MDN Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine && engine.isPlaying()) {
    engine.pause();
    updatePlayPauseButton();
  }
});
```

### Okabe-Ito Color Palette Replacement

```javascript
// Source: Okabe & Ito (2002), Wong (2011) Nature Methods
// Replaces current CORRESPONDENCE_COLORS in js/core/colors.js
export const CORRESPONDENCE_COLORS = [
  '#0072B2', // blue
  '#D55E00', // vermillion
  '#009E73', // bluish green
  '#E69F00', // orange
  '#CC79A7', // reddish purple
  '#56B4E9', // sky blue
  '#F0E442', // yellow
  '#000000', // black
];
```

**Note on yellow (#F0E442):** On a white background, yellow has low contrast (fails WCAG 3:1 for non-text elements). For this application, yellow is used as a fill/stroke color on shapes rather than as text, and the shapes also have dark outlines (--stroke-color: #1A1A1A). If yellow proves hard to see in projector testing, replace it with a darker gold (#B8860B) or use it only as a fill with the dark stroke providing the distinguishing boundary.

### Current vs Proposed Palette Comparison

| Index | Current | Current Name | Proposed (Okabe-Ito) | Proposed Name | Change Reason |
|-------|---------|-------------|---------------------|---------------|---------------|
| 0 | #2196F3 | blue | #0072B2 | blue | Darker blue; better projector contrast |
| 1 | #F44336 | red | #D55E00 | vermillion | Avoids red-green confusion for protanopia/deuteranopia |
| 2 | #4CAF50 | green | #009E73 | bluish green | Blue-shifted green is distinguishable from vermillion for color-blind viewers |
| 3 | #FF9800 | orange | #E69F00 | orange | Similar hue; Okabe-Ito version tested for distinguishability |
| 4 | #9C27B0 | purple | #CC79A7 | reddish purple | Lighter, more distinct from dark blue |
| 5 | #00BCD4 | cyan | #56B4E9 | sky blue | More distinct from blue (#0072B2) than current cyan is from current blue |
| 6 | #795548 | brown | #F0E442 | yellow | Brown was too close to blue-grey; yellow maximizes palette spread |
| 7 | #607D8B | blue-grey | #000000 | black | Blue-grey was indistinct; black provides maximum contrast anchor |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `event.keyCode` (numeric) | `event.key` (string) | Deprecated since ~2017, removed from spec 2020 | Use `event.key` exclusively -- all browsers support it |
| `keypress` event | `keydown` event | `keypress` deprecated in DOM Level 3 Events | `keypress` does not fire for modifier/arrow keys |
| Custom color palettes | Okabe-Ito / Wong palette | Okabe & Ito 2002, Wong 2011 in Nature Methods | Scientific standard for colorblind-safe visualization |
| `blur`/`focus` for tab detection | `visibilitychange` API | Page Visibility API standardized ~2013, universal support | Correctly detects actual page visibility, not just window focus |

**Deprecated/outdated:**
- `keyCode` and `which` properties: Use `event.key` instead
- `keypress` event: Use `keydown` instead
- `window.onblur` for tab detection: Use `document.visibilitychange` instead

## Open Questions

1. **Speed preset mapping for number keys**
   - What we know: UICT-08 says "number keys control speed." The slider range is 0.5 to 3.0.
   - What's unclear: Which number keys map to which speeds? Keys 1-5 mapping to 0.5x/1.0x/1.5x/2.0x/3.0x is one natural choice. Keys 1-3 mapping to 0.5x/1.0x/2.0x is another.
   - Recommendation: Use 5 presets (1=0.5x, 2=1.0x, 3=1.5x, 4=2.0x, 5=3.0x) to give the presenter fine-grained control. This matches the slider's full range.

2. **Yellow on white background**
   - What we know: Okabe-Ito includes yellow (#F0E442), which has low contrast on white.
   - What's unclear: Whether the dark stroke outlines provide sufficient distinction on a projector.
   - Recommendation: Use Okabe-Ito yellow initially. If projector testing reveals issues, swap to darker gold (#B8860B). This must be verified on target hardware (Success Criterion 3).

3. **Home/End keys for jump to start/end**
   - What we know: UICT-08 specifies spacebar, arrow keys, and number keys. The early PITFALLS.md research also suggests Home/End for jump-to-start/end.
   - What's unclear: Whether Home/End should be added beyond the UICT-08 specification.
   - Recommendation: Add Home/End as bonus shortcuts -- they're 4 lines of code and match the existing `jumpToStart()`/`jumpToEnd()` engine methods. Low risk, high value for the presenter.

## Sources

### Primary (HIGH confidence)
- [MDN KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) - Key property values, browser support
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) - Tab visibility detection
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) - Animation loop behavior in background tabs
- Existing codebase: `js/engine/animation.js` engine API, `js/main.js` current event handlers, `js/core/colors.js` current palette

### Secondary (MEDIUM confidence)
- [javascript.info - Keyboard events](https://javascript.info/keyboard-events) - keydown/keyup patterns and best practices
- [Okabe-Ito palette / Wong 2011](https://davidmathlogic.com/colorblind/) - Color-blind friendly palette tool with Okabe-Ito reference
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG contrast ratio verification
- [W3C WCAG 2.1 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) - 3:1 ratio requirement for UI components

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only native browser APIs already well-documented and universally supported
- Architecture: HIGH - Pattern is a single keydown listener wiring to existing engine API; no new modules
- Pitfalls: HIGH - All pitfalls are well-known (spacebar scroll, form element conflict, timestamp delta) with established solutions
- Color palette: MEDIUM - Okabe-Ito is scientifically validated, but projector-specific rendering must be verified on target hardware

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable domain -- keyboard events and color science do not change rapidly)
