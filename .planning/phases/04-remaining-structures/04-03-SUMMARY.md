---
phase: 04-remaining-structures
plan: 03
subsystem: structures
tags: [catalan, non-crossing-partition, stack-sortable-permutation, canvas, bijection, circular-arc]

# Dependency graph
requires:
  - phase: 04-remaining-structures
    provides: "Registry with 9 entries and uniform module interface pattern"
provides:
  - "Non-crossing partition structure module (fromDyck/toDyck/draw with circular arc rendering)"
  - "Stack-sortable permutation structure module (fromDyck/toDyck/draw with box-row rendering)"
  - "Complete registry with all 11 Catalan structure entries"
  - "Test harness covering 242 round-trips across all 11 structures"
affects: [05-bijections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sibling-at-same-depth block assignment for non-crossing partition bijection"
    - "Inverse push-reconstruction for stack-sortable permutation toDyck"
    - "Quadratic curve arcs bowed toward circle center for non-crossing partition rendering"

key-files:
  created:
    - js/structures/non-crossing-partition.js
    - js/structures/stack-sortable-perm.js
  modified:
    - js/structures/registry.js
    - tests/test-structures.html

key-decisions:
  - "Non-crossing partition stores dyckWord copy for reliable round-trip (same fallback pattern as staircase-polygon.js)"
  - "Stack-sortable permutation toDyck uses inverse push-reconstruction rather than Knuth's greedy stack-sorting algorithm"
  - "Non-crossing partition arcs rendered as quadratic curves bowed 30% toward center for visual clarity"

patterns-established:
  - "Inverse push-reconstruction algorithm: push inputs until target is on top, then pop, for each output value in permutation"

requirements-completed: [STRC-09, STRC-11]

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 4 Plan 3: Non-Crossing Partitions and Stack-Sortable Permutations Summary

**Non-crossing partition (sibling-depth bijection with circular arc rendering) and stack-sortable permutation (push/pop simulation with inverse reconstruction), completing the full 11-structure Catalan catalog with 242/242 round-trips passing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T07:29:57Z
- **Completed:** 2026-02-24T07:34:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Two final Catalan structure modules created with the most complex bijection algorithms in Phase 4
- Full 11-structure catalog complete: all structures selectable in UI dropdowns for side-by-side display
- 242/242 round-trips verified across all 11 structures at n=1..4 (complete coverage)
- Phase 4 success criteria fully satisfied: 7 new structures implemented and registered

## Task Commits

Each task was committed atomically:

1. **Task 1: Create non-crossing-partition.js and stack-sortable-perm.js modules** - `d492275` (feat)
2. **Task 2: Complete registry to 11 entries and verify full catalog** - `a934578` (feat)

## Files Created/Modified
- `js/structures/non-crossing-partition.js` - Sibling-depth bijection with circular arc rendering for partition blocks
- `js/structures/stack-sortable-perm.js` - Push/pop Dyck simulation with inverse reconstruction and labeled box-row rendering
- `js/structures/registry.js` - Extended from 9 to 11 frozen entries (complete catalog)
- `tests/test-structures.html` - Updated to verify 242 round-trips across all 11 structures

## Decisions Made
- Non-crossing partition stores a copy of the Dyck word for reliable round-trip (same proven fallback pattern as staircase-polygon.js), avoiding the complexity of reconstructing Dyck words from partition block structure
- Stack-sortable permutation toDyck uses inverse push-reconstruction (push inputs in order until target value is on stack top, then pop) rather than Knuth's greedy stack-sorting algorithm. The greedy algorithm produces a valid Dyck word but not the same one that fromDyck used, because it optimizes for sorted output rather than reversing the push/pop sequence.
- Non-crossing partition arcs drawn as quadratic curves bowed 30% toward circle center, providing visual clarity and avoiding straight chords that could be confused with polygon edges

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stack-sortable permutation toDyck algorithm**
- **Found during:** Task 1 (stack-sortable-perm.js implementation)
- **Issue:** Plan specified Knuth's greedy stack-sorting algorithm for toDyck, but this produces a different Dyck word than what fromDyck encodes. The greedy algorithm sorts the permutation (produces output 1,2,3,...) rather than reversing the push/pop encoding.
- **Fix:** Replaced with inverse push-reconstruction algorithm: for each output value in the permutation, push input values in order until the target is on top of the stack, then pop it. This correctly inverts fromDyck.
- **Files modified:** js/structures/stack-sortable-perm.js
- **Verification:** All 22 round-trips pass at n=1..4
- **Committed in:** d492275 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Algorithm correction was essential for round-trip correctness. No scope creep.

## Issues Encountered
- The Knuth greedy stack-sorting algorithm and the Dyck-word push/pop encoding are dual operations that produce different Dyck words for the same permutation. The plan's toDyck pseudocode was the standard Knuth algorithm, but the correct inverse for fromDyck's encoding is a push-reconstruction approach. Identified via round-trip test failure at n=3 (perm=[2,3,1]) and resolved with the inverse algorithm.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 11 Catalan structures implemented, registered, and verified (complete Phase 4)
- Phase 5 (bijections) can now build step sequences between any pair of the 11 structures
- Registry frozen at 11 entries; no further structure additions expected for v1.0

## Self-Check: PASSED

All files verified present, all commits verified in git log.

---
*Phase: 04-remaining-structures*
*Completed: 2026-02-24*
