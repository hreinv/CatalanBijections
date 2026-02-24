# Phase 8: Verify Completed Work & Fix Integration Debt - Research

**Researched:** 2026-02-23
**Domain:** Code verification, tech debt cleanup, documentation gap closure
**Confidence:** HIGH

## Summary

Phase 8 is a verification and cleanup phase, not a feature-building phase. The v1.0 Milestone Audit (`.planning/v1.0-MILESTONE-AUDIT.md`) identified that 21 requirements across Phases 2 and 3 are marked "partial" because the work was done and claimed complete in SUMMARY files, but no VERIFICATION.md documents exist to formally confirm them. The actual code and integration are sound -- the audit confirmed 25/25 cross-phase connections wired and 4/4 E2E flows passing -- so this phase is primarily about producing verification documentation and fixing 3 small code hygiene issues.

The three code fixes are surgical single-line changes: (1) remove a dead `import * as triangulation` from `binary-triang.js` line 15, (2) remove the orphaned `THEME_COLORS` export from `colors.js`, (3) remove the orphaned `lerp()` export from `easing.js`. The `validate()` function in `dyck.js` is also listed as an "orphaned export" but it IS consumed internally by `enumerate()` for self-verification assertions, so it should be kept (it is part of the module's public API and tested in `test-dyck.html`).

**Primary recommendation:** Structure this phase as two plans: (1) create VERIFICATION.md for Phase 2 (14 requirements) and VERIFICATION.md for Phase 3 (7 requirements) using the established template from Phase 1's verification, then (2) apply the three surgical code fixes and confirm the 21 partial requirements now pass the 3-source cross-reference.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRC-01 | Balanced parentheses rendered as formatted character sequences | Verification needed -- code exists in `js/structures/parentheses.js`, claimed complete in 02-01-SUMMARY, but no VERIFICATION.md |
| STRC-02 | Dyck paths rendered as lattice paths with up/down steps on a grid | Verification needed -- code exists in `js/structures/dyck-path.js`, claimed complete in 02-01-SUMMARY, but no VERIFICATION.md |
| STRC-06 | Binary trees rendered with recursive node-edge layout | Verification needed -- code exists in `js/structures/binary-tree.js`, claimed complete in 02-01-SUMMARY, but no VERIFICATION.md |
| STRC-10 | Triangulations rendered as convex polygons with diagonals | Verification needed -- code exists in `js/structures/triangulation.js`, claimed complete in 02-01-SUMMARY, but no VERIFICATION.md |
| STRC-12 | Each structure correctly converts to/from Dyck word representation (round-trip identity verified for all C(4)=14 instances) | Verification needed -- 88/88 round-trips pass in test-structures.html per 02-01-SUMMARY, but no VERIFICATION.md. Audit also noted toDyck() never called at runtime (only in test harness) |
| ANIM-01 | Timestamp-based animation loop using requestAnimationFrame | Verification needed -- code exists in `js/engine/animation.js`, claimed complete in 02-03-SUMMARY, but no VERIFICATION.md |
| ANIM-02 | Play/pause toggle for bijection animations | Verification needed -- wired in main.js, claimed complete in 02-03-SUMMARY, but no VERIFICATION.md |
| ANIM-03 | Step forward and step backward controls for manual progression | Verification needed -- wired in main.js, claimed complete in 02-03-SUMMARY, but no VERIFICATION.md |
| ANIM-04 | Jump to start and jump to end controls | Verification needed -- wired in main.js, claimed complete in 02-03-SUMMARY, but no VERIFICATION.md |
| ANIM-05 | Speed slider adjustable from 0.5x to 3x | Verification needed -- wired in main.js, claimed complete in 02-03-SUMMARY, but no VERIFICATION.md |
| ANIM-06 | Smooth easing transitions between animation steps | Verification needed -- easeInOutCubic in `js/core/easing.js` applied in render(), claimed complete in 03-01-SUMMARY, but no VERIFICATION.md |
| UICT-01 | Structure A and Structure B dropdown selectors for choosing any two structures | Verification needed -- DOM controls in index.html, wired in main.js, claimed complete in 02-02-SUMMARY, but no VERIFICATION.md |
| UICT-02 | n selector (1-4) to set the Catalan number index | Verification needed -- DOM control in index.html, wired in main.js, claimed complete in 02-02-SUMMARY, but no VERIFICATION.md |
| UICT-03 | Instance navigator with previous/next buttons and "X of Y" indicator | Verification needed -- DOM controls in index.html, wired in main.js, claimed complete in 02-02-SUMMARY, but no VERIFICATION.md |
| UICT-04 | Step description text panel showing current bijection step explanation | Verification needed -- DOM element in index.html, wired in main.js, claimed complete in 03-01-SUMMARY, but no VERIFICATION.md |
| UICT-05 | Side-by-side dual-panel layout with source structure left, target structure right | Verification needed -- render() in main.js, claimed complete in 02-02-SUMMARY, but no VERIFICATION.md |
| UICT-06 | Color-coded element correspondence (matching elements share colors across both panels) | Verification needed -- implemented in bijection drawFrame functions, claimed complete in 03-02-SUMMARY, but no VERIFICATION.md |
| UICT-07 | Active transformation step highlighting (current step pulses/glows, others dim) | Verification needed -- three-zone rendering in bijection modules, claimed complete in 03-02-SUMMARY, but no VERIFICATION.md |
| BIJC-01 | Parentheses to Dyck Paths bijection with step-by-step animation | Verification needed -- code exists in `js/bijections/parens-dyck.js`, claimed complete in 03-02-SUMMARY, but no VERIFICATION.md |
| BIJC-02 | Binary Trees to Triangulations bijection with step-by-step animation | Verification needed -- code exists in `js/bijections/binary-triang.js`, claimed complete in 03-03-SUMMARY, but no VERIFICATION.md. Also has dead import of triangulation module |
| BIJC-03 | Parentheses to Binary Trees bijection with step-by-step animation | Verification needed -- code exists in `js/bijections/parens-binary.js`, claimed complete in 03-03-SUMMARY, but no VERIFICATION.md |
</phase_requirements>

## Standard Stack

This phase does not introduce new libraries or tools. It operates entirely within the existing codebase.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (ES modules) | N/A | All source code | Zero-dependency constraint (FOUND-01) |
| Browser DevTools | N/A | Manual verification of rendering | Only tool available for visual confirmation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python3 -m http.server | Built-in | Local HTTP server for module loading | Required for browser ES module verification |
| Node.js | System | Running JS files for non-visual verification | Round-trip tests, export checking |

### Alternatives Considered
None -- this phase uses only existing project infrastructure.

## Architecture Patterns

### Existing Project Structure (no changes needed)
```
js/
├── core/           # Foundation: dyck.js, colors.js, canvas-utils.js, easing.js
├── structures/     # 4 Catalan structure modules + registry
├── bijections/     # 3 bijection modules + router
├── engine/         # animation.js
└── main.js         # App controller
.planning/
├── phases/
│   ├── 01-core-foundation/   # Has 01-VERIFICATION.md (template)
│   ├── 02-vertical-slice/    # NEEDS VERIFICATION.md
│   ├── 03-first-bijections/  # NEEDS VERIFICATION.md
│   └── 08-verify-fix-integration/  # This phase
└── v1.0-MILESTONE-AUDIT.md   # Source of all gap data
```

### Pattern 1: VERIFICATION.md Template
**What:** Each phase that is "Complete" must have a VERIFICATION.md confirming all requirements pass success criteria.
**When to use:** After a phase is claimed complete, before the audit considers it "satisfied."
**Template source:** `.planning/phases/01-core-foundation/01-VERIFICATION.md` -- the only existing verified phase.

The VERIFICATION.md template has these sections:
1. **Frontmatter** (YAML): phase, verified date, status, score, re_verification flag
2. **Goal Achievement**: Observable Truths table (from roadmap success criteria) with VERIFIED status and evidence
3. **Required Artifacts**: One sub-table per plan listing expected files and their verification status
4. **Key Link Verification**: Cross-module import/wiring checks with grep patterns
5. **Requirements Coverage**: Final table mapping each requirement ID to its satisfaction evidence
6. **Anti-Patterns Found**: Scan for TODO/FIXME/HACK/PLACEHOLDER/stubs
7. **Notable Deviations**: Non-blocking differences between plan and implementation
8. **Human Verification Required**: Items that need browser testing
9. **Commit Verification**: Git log check for claimed commits
10. **Summary**: Concise conclusion

### Pattern 2: 3-Source Cross-Reference for Requirement Satisfaction
**What:** A requirement is "satisfied" only when ALL THREE sources agree:
1. VERIFICATION.md confirms it passes success criteria
2. SUMMARY.md (plan completion) claims it complete
3. REQUIREMENTS.md traceability marks it `[x]`

**Current state:** The 21 partial requirements have sources 2 and 3 but are missing source 1.

### Pattern 3: Surgical Code Fix
**What:** Small, isolated code changes that fix specific audit findings without altering behavior.
**Scope of fixes needed:**

1. **Dead import in binary-triang.js (line 15):**
   - `import * as triangulation from '../structures/triangulation.js';`
   - This import is never used. The module implements all triangulation drawing locally.
   - Fix: Delete the import line entirely.

2. **Orphaned THEME_COLORS export (colors.js lines 24-30):**
   - `THEME_COLORS` is exported from `js/core/colors.js` but never imported anywhere.
   - main.js reads theme values from CSS custom properties via `getComputedStyle` instead.
   - The Phase 1 VERIFICATION.md already noted this as a valid architectural deviation.
   - Fix: Remove the `THEME_COLORS` export and its JSDoc comment. Keep `CORRESPONDENCE_COLORS`.

3. **Orphaned lerp() export (easing.js lines 31-34):**
   - `lerp()` is exported from `js/core/easing.js` but never imported by any module.
   - Only `easeInOutCubic` is imported (by main.js).
   - Fix: Remove the `lerp()` function and its JSDoc comment.

4. **validate() -- NOT orphaned:**
   - `validate()` in `js/core/dyck.js` is exported and used internally by `enumerate()` on lines 83-85 for self-verification.
   - It is also tested in `tests/test-dyck.html`.
   - The audit listed it as "orphaned" but this is incorrect -- it is consumed within the same module.
   - Decision: Keep `validate()`. It serves a legitimate role.

### Anti-Patterns to Avoid
- **Over-verification:** Do not re-test things that were already confirmed by the existing infrastructure (e.g., round-trip tests already pass in test-structures.html).
- **Scope creep:** This phase fixes only the specific items identified in the audit. Do not refactor working code or add features.
- **Breaking existing behavior:** The dead import and orphaned exports are not breaking anything. Removing them should be purely subtractive -- no functional changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verification format | Custom format | Copy 01-VERIFICATION.md structure | Consistency with Phase 1's established template |
| Requirement checking | Automated test suite | Manual code inspection + grep patterns | This is a zero-dependency project with no test framework; browser test harnesses exist for specific things but general verification is manual |
| Import analysis | Custom import scanner | grep for import patterns | Small codebase (15 JS files), manual grep is sufficient |

**Key insight:** This phase is documentation + cleanup, not engineering. The code is working. The gap is in formal verification records.

## Common Pitfalls

### Pitfall 1: Confusing "partial" with "broken"
**What goes wrong:** Treating partial requirements as bugs that need code fixes.
**Why it happens:** The audit marks 21 requirements as "partial" which sounds like they are incomplete.
**How to avoid:** Understand that "partial" means "missing VERIFICATION.md, not missing implementation." The code is working (25/25 integration connections, 4/4 E2E flows). The fix is producing verification documents, not writing new code.
**Warning signs:** If you find yourself writing new feature code, you have misunderstood the scope.

### Pitfall 2: Removing validate() as "orphaned"
**What goes wrong:** Deleting `validate()` from dyck.js because the audit lists it as orphaned.
**Why it happens:** The audit frontmatter lists `validate()` alongside genuinely orphaned exports.
**How to avoid:** Check the actual usage. `validate()` is called on line 84 of dyck.js by `enumerate()` for self-verification. It is also tested in test-dyck.html. It is NOT orphaned.
**Warning signs:** Removing validate() would break the self-verification assertions in enumerate().

### Pitfall 3: Changing the binary-triang.js import for triangulation without checking usage
**What goes wrong:** Trying to wire the triangulation import to something instead of removing it.
**Why it happens:** The PLAN for 03-03 has a key_link entry that says binary-triang.js imports from triangulation.js.
**How to avoid:** The import exists but the module implements all triangulation rendering locally (drawPolygonOutline, drawTrianglesWithZones, etc.) so the import was never used. The key_link in the PLAN described intent, not actual usage. Remove the import.
**Warning signs:** If you try to call triangulation.fromDyck() or triangulation.draw() in binary-triang.js, you are adding new code instead of cleaning up.

### Pitfall 4: Producing VERIFICATION.md without checking actual code
**What goes wrong:** Copy-pasting claims from SUMMARY files into VERIFICATION without independent confirmation.
**Why it happens:** The SUMMARYs already say everything passes.
**How to avoid:** The VERIFICATION.md must independently confirm each claim by examining the actual source files, checking import patterns with grep, and noting what requires human browser verification. The Phase 1 VERIFICATION.md is a good model -- it checked actual line numbers and function signatures.
**Warning signs:** A VERIFICATION.md that just restates SUMMARY claims without file/line evidence.

### Pitfall 5: Updating REQUIREMENTS.md traceability prematurely
**What goes wrong:** Changing requirement statuses before verification is complete.
**Why it happens:** Eagerness to show progress.
**How to avoid:** Requirements stay at their current status until VERIFICATION.md confirms them. The 21 partial requirements are already marked `[x]` in REQUIREMENTS.md -- that does not need changing. What needs to happen is the VERIFICATION.md being created so the 3-source cross-reference passes.

## Code Examples

### Dead Import Removal (binary-triang.js)
```javascript
// BEFORE (line 14-15):
import * as binaryTree from '../structures/binary-tree.js';
import * as triangulation from '../structures/triangulation.js';

// AFTER (line 14):
import * as binaryTree from '../structures/binary-tree.js';
```

### Orphaned THEME_COLORS Removal (colors.js)
```javascript
// BEFORE (lines 8-30):
// ...CORRESPONDENCE_COLORS definition...

/** Theme colors for UI elements */
export const THEME_COLORS = {
  background: '#FFFFFF',
  stroke:     '#1A1A1A',
  gridLine:   '#E0E0E0',
  highlight:  '#FFC107',
  text:       '#212121',
};

// AFTER: Remove lines 23-30 (the THEME_COLORS export and its JSDoc).
// Keep only CORRESPONDENCE_COLORS export.
```

### Orphaned lerp() Removal (easing.js)
```javascript
// BEFORE (lines 24-34):
/**
 * Linear interpolation between two values.
 * ...
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// AFTER: Remove lines 24-34 entirely.
// Keep only easeInOutCubic export.
```

### VERIFICATION.md Frontmatter Template
```yaml
---
phase: 02-vertical-slice  # or 03-first-bijections
verified: 2026-02-23T00:00:00Z
status: passed
score: 14/14 must-haves verified  # or 7/7
re_verification: false
---
```

## State of the Art

Not applicable -- this phase involves no new technology decisions.

## Open Questions

1. **Should validate() be kept or removed?**
   - What we know: The audit lists it as orphaned. But it IS used internally by enumerate() for self-verification (line 84) and tested in test-dyck.html.
   - What's unclear: Nothing -- the answer is clear from code inspection.
   - Recommendation: Keep it. It is consumed within its own module. Mark this as resolved in verification.

2. **Should toDyck() be flagged as an issue?**
   - What we know: toDyck() is exported by all 4 structure modules, tested in test-structures.html (88 round-trips), but never called at runtime by the app (main.js only calls fromDyck()).
   - What's unclear: Whether this matters for STRC-12 satisfaction.
   - Recommendation: toDyck() is part of the uniform module interface and is tested. The requirement says "correctly converts to/from Dyck word representation (round-trip identity verified)" -- the test harness verifies this. It does not need to be called at runtime to be satisfied. Mark STRC-12 as satisfied with evidence from test-structures.html results.

## Inventory of Specific Verification Checks

### Phase 2 VERIFICATION.md Must Confirm (14 requirements)

**From Roadmap Success Criteria (5 observable truths):**
1. Balanced parentheses, Dyck paths, binary trees, and triangulations each render correctly for all C(n) instances at n=1 through n=4
2. Each of the four structures converts to/from Dyck words and round-trips correctly for all 14 instances at n=4
3. Presenter can select any two structures from dropdowns and see them rendered side-by-side
4. Playback controls respond correctly and animation runs smoothly via requestAnimationFrame
5. Instance navigator cycles through all C(n) instances with previous/next buttons and shows "X of Y" indicator

**From Plans (artifacts, key_links, truths):**
- Plan 02-01: 6 artifacts (4 structure modules + registry + test harness), 3 key_links, 6 truths
- Plan 02-02: 3 artifacts (index.html, style.css, main.js), 4 key_links, 5 truths
- Plan 02-03: 2 artifacts (animation.js, main.js), 3 key_links, 6 truths

**Requirements to cover:** STRC-01, STRC-02, STRC-06, STRC-10, STRC-12, ANIM-01-05, UICT-01-03, UICT-05

### Phase 3 VERIFICATION.md Must Confirm (7 requirements)

**From Roadmap Success Criteria (5 observable truths):**
1. Parentheses-to-Dyck-Paths bijection animates with 5+ distinct steps, each with text description
2. Binary-Trees-to-Triangulations bijection animates showing node-triangle correspondence
3. Parentheses-to-Binary-Trees bijection animates showing nesting-subtree mapping
4. Matching elements share the same color across source and target
5. Active transformation step pulses/glows while non-active elements are dimmed

**From Plans (artifacts, key_links, truths):**
- Plan 03-01: 4 artifacts (easing.js, router.js, index.html, style.css), 3 key_links, 4 truths
- Plan 03-02: 2 artifacts (parens-dyck.js, router.js), 4 key_links, 5 truths
- Plan 03-03: 3 artifacts (binary-triang.js, parens-binary.js, router.js), 5+ key_links, 5 truths

**Requirements to cover:** BIJC-01-03, ANIM-06, UICT-04, UICT-06, UICT-07

### Integration Fixes (3 items)

| Fix | File | Line(s) | Action | Risk |
|-----|------|---------|--------|------|
| Dead import | `js/bijections/binary-triang.js` | 15 | Delete line | Zero -- import unused |
| Orphaned THEME_COLORS | `js/core/colors.js` | 23-30 | Delete export + JSDoc | Zero -- no consumers |
| Orphaned lerp() | `js/core/easing.js` | 24-34 | Delete function + JSDoc | Zero -- no consumers |

### NOT Fixing (with justification)

| Item | Reason |
|------|--------|
| validate() in dyck.js | Used internally by enumerate() on line 84 for self-verification; also tested in test-dyck.html |
| toDyck() on 4 structure modules | Part of uniform module interface; tested in test-structures.html (88 round-trips); required by STRC-12 |

## Sources

### Primary (HIGH confidence)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- complete gap analysis with specific evidence per requirement
- `.planning/phases/01-core-foundation/01-VERIFICATION.md` -- template for verification document format
- All 6 SUMMARY files for Phases 2-3 -- claims of completion with commit hashes and file lists
- All 6 PLAN files for Phases 2-3 -- must_haves, artifacts, key_links that verification must check
- Direct code inspection of all 15 JS files in the project

### Secondary (MEDIUM confidence)
- None needed -- all findings based on direct code and document inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing infrastructure
- Architecture: HIGH -- verification template exists from Phase 1, code fixes are trivially scoped
- Pitfalls: HIGH -- all pitfalls identified from direct analysis of the audit report and codebase

**Research date:** 2026-02-23
**Valid until:** Indefinite -- this is project-internal verification, not dependent on external API changes
