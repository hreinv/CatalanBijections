# Feature Research

**Domain:** Interactive mathematical visualization / presentation tool for Catalan number bijections
**Researched:** 2026-02-23
**Confidence:** MEDIUM (based on domain expertise with tools like Manim, GeoGebra, VisuAlgo, Desmos, D3.js visualizations, and Mathigon; no live source verification available)

## Feature Landscape

### Table Stakes (Presentation Fails Without These)

Features the presenter and audience absolutely require. If any of these are missing, the tool cannot serve its purpose during the live presentation.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Correct rendering of all 11 structures** | The entire presentation premise is showing these structures. A broken or missing structure stops the talk. | HIGH | Each structure has unique geometry (trees, paths, polygons, partitions). This is the bulk of the work. Canvas coordinate math differs per structure. |
| **Animated bijection between any two selected structures** | Core value proposition. "Pick any pair and watch the transformation" is the thesis of the presentation. | HIGH | 8 hand-crafted + Dyck bridge for remaining 47 pairs. Bridge compositions must chain cleanly. |
| **Playback controls (play/pause, step forward/back)** | Presenter must control pacing for the audience. Auto-play-only would make the tool unusable for teaching. | MEDIUM | Standard media-player pattern. Step-by-step is critical for explaining "what just happened." |
| **Speed control** | Different bijections need different pacing. Simple ones (Parentheses to Dyck) are fast; complex ones (Binary Trees to Triangulations) need time. | LOW | A single slider or 3 preset speeds (0.5x, 1x, 2x). |
| **Structure pair selector** | Presenter needs to pick source and target structure without fumbling during the talk. | LOW | Two dropdown menus or a grid selector. Must be fast -- no more than 2 clicks to start a bijection. |
| **n selector (1-4)** | Must be able to show simple (n=1,2) and complex (n=3,4) examples. | LOW | Radio buttons or small stepper control. |
| **Instance navigator** | There are C(n) instances per structure. Presenter needs to cycle through them to show the bijection works for all cases, not just one cherry-picked example. | LOW | Previous/next buttons with "3 of 14" indicator. |
| **Projector-friendly visual design** | Audience is 20-30 feet from a projector. Thin lines, small text, or low contrast will be invisible. | MEDIUM | White background, thick strokes (3-4px minimum), large labels, high-contrast colors. Test on an actual projector. |
| **Step description text** | Without narration of "what is happening right now," the animation is just shapes moving. Text grounds the visual in the mathematical mapping. | LOW | 1-2 sentence overlay or panel below the canvas, updated each step. |
| **Color-coded element correspondence** | When element A in the source becomes element B in the target, colors make this trackable. Without it, the bijection looks like random morphing. | MEDIUM | Consistent color palette (6-8 distinct colors). Colors must survive projector color wash -- no pastels. |
| **Works offline from index.html** | Presentation is in a classroom. WiFi may be unreliable. "npm start" failing at the podium is catastrophic. | LOW | Already a constraint. Zero dependencies, no CDN links, no build step. Just open the file. |

### Differentiators (Would Make the Presentation Exceptional)

Features the audience does not expect but would make the presentation memorable and the demonstration more effective.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Bijection chain visualization** | When two structures lack a direct classical bijection (e.g., Triangulations to Stack-sortable Permutations), showing the intermediate steps through Dyck words makes the "universal bridge" concept tangible. A small breadcrumb like "Triangulations -> Dyck Path -> Permutations" is illuminating. | MEDIUM | Requires rendering the intermediate Dyck word state, not just the endpoints. Could show a small inset or a transition indicator. |
| **Side-by-side dual-panel layout** | Source structure on the left, target on the right, with animated correspondence lines between them. Much more powerful than morphing one into the other, because the audience can see both simultaneously. | MEDIUM | Two canvases or two regions of one canvas. Correspondence arrows/lines animate during the bijection. Layout must fit a 16:9 projector. |
| **Keyboard shortcuts for live control** | Spacebar for play/pause, arrow keys for stepping, number keys for speed. The presenter's hands are often gesturing or pointing at the screen -- quick keyboard access beats mouse precision. | LOW | Standard keydown event listeners. 10-15 lines of code. Very high value-to-effort ratio. |
| **"All instances" gallery view** | A grid showing all C(n) instances of a structure at once. For n=3, showing all 5 Dyck paths or all 5 binary trees in a grid gives an immediate "feel" for the Catalan family. | MEDIUM | Miniature renderings in a grid. Clickable to select an instance for the bijection view. Useful for n=3 (5 instances) and n=4 (14 instances). |
| **Smooth interpolation animations** | Rather than discrete frame jumps, nodes and edges glide smoothly between positions. Trees morph fluidly. Paths bend continuously. This is the difference between "PowerPoint slide transition" and "3Blue1Brown." | HIGH | Requires interpolating between geometric states. Each structure type needs its own interpolation logic. Worth investing in for the 8 classical bijections. |
| **Highlight active transformation step** | During animation, the element currently being transformed glows or pulses while everything else dims slightly. Directs attention in a room full of distractions. | LOW | Opacity reduction on non-active elements + glow/outline on active element. Simple but very effective for teaching. |
| **URL hash state for bookmarking specific demos** | Encode the current structure pair, n value, and instance in the URL hash. Presenter can pre-prepare bookmarked URLs for specific demonstrations rather than navigating live. | LOW | `#pair=BinaryTree-Triangulation&n=3&instance=2`. Parse on load. No backend needed. |
| **Presenter notes / cheat sheet mode** | A small collapsible panel showing the mathematical definition of the current bijection and key talking points. The presenter can glance at it without breaking flow. | LOW | Hidden by default, toggled with a key. Just static text per bijection pair. |

### Anti-Features (Deliberately NOT Building)

Features that seem appealing but would add complexity without proportional value for a one-time class presentation.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User-editable structures** | "Let students draw their own binary tree and see it transform." | Massive input handling complexity. Validating that a user-drawn structure is actually a valid Catalan structure is hard. Draggable nodes, snapping, undo -- this is an entire app. Not needed for a 15-minute presentation segment. | Pre-generate all C(n) instances. The instance navigator already lets you cycle through every valid structure. |
| **n > 4 support** | "Show bigger examples for dramatic effect." | C(5)=42 instances. Rendering 42 items in a gallery or navigating through them kills pacing. Individual structure rendering at n=5 gets visually dense (a Dyck path of length 10, a binary tree with 5 internal nodes). Projector resolution makes this illegible. | Keep n <= 4. For "wow factor," state the numbers verbally: "C(10) = 16,796 -- imagine all those trees!" |
| **Mobile/touch support** | "Students could follow along on their phones." | Touch event handling, responsive layout, pinch-to-zoom, viewport management -- all orthogonal to the core value. The tool is used on one laptop connected to a projector. | If students want to explore later, they can open it on a laptop. The tool works in any browser. |
| **Full graph/network editor** | "Let users build arbitrary graphs, not just Catalan structures." | Completely out of scope. Catalan structures have rigid combinatorial constraints. A general graph editor solves a different problem. | Scope to exactly 11 Catalan structures. |
| **Persistence / save/load state** | "Save your favorite bijection demos." | Requires either localStorage or a backend. Adds state management complexity. This is a one-shot presentation tool. | Use URL hash bookmarks (see Differentiators) for lightweight "saving." |
| **Automated quiz / assessment mode** | "Test students: which structure does this map to?" | Building assessment logic, scoring, feedback -- this is an LMS feature, not a visualization tool. The presentation is a demonstration, not an interactive exercise. | The presenter asks questions verbally and uses the tool to reveal the answer. |
| **3D visualizations** | "Render the associahedron or other polytopes in 3D." | WebGL/Three.js dependency. 3D navigation (rotate, pan, zoom) is notoriously finicky. Projector presentations are especially bad for 3D -- the audience cannot control the viewpoint. | All 11 structures have clean 2D representations. Use 2D exclusively. |
| **LaTeX rendering in canvas** | "Show the formulas with proper math typesetting." | Pulling in MathJax or KaTeX breaks the zero-dependency constraint. Canvas text rendering of LaTeX is a known pain point. | Use Unicode math symbols (parentheses, arrows) and simple text. Formal notation lives in the Google Slides, not the interactive tool. |
| **Sound effects / audio cues** | "Play a tone when each step completes." | Audio in a classroom presentation is distracting, not helpful. Browser autoplay policies can block it. | Visual cues only (color changes, highlights, step counter). |
| **Tutorial / onboarding flow** | "Walk the user through how to use the tool." | The only user is the presenter, who built it. There is no onboarding audience. | Keep the UI obvious enough that a 5-second glance explains it. |

## Feature Dependencies

```
[Structure Renderers (all 11)]
    └──requires──> [Dyck Word Internal Representation]
                       └──enables──> [toDyck() / fromDyck() converters]
                                         └──enables──> [Dyck Bridge for non-classical pairs]

[Animated Bijections]
    └──requires──> [Structure Renderers]
    └──requires──> [Animation Engine (interpolation, timing)]
                       └──requires──> [Playback Controls]
                                         └──enhanced-by──> [Keyboard Shortcuts]
                                         └──enhanced-by──> [Speed Control]

[Color-Coded Correspondence]
    └──requires──> [Structure Renderers]
    └──requires──> [Element Tracking in Bijection Steps]

[Instance Navigator]
    └──requires──> [Structure Renderers]
    └──requires──> [Instance Enumeration (generate all C(n) instances)]

[Bijection Chain Indicator]
    └──requires──> [Dyck Bridge Module]
    └──requires──> [Animated Bijections]

[Side-by-Side Layout]
    └──requires──> [Structure Renderers]
    └──enhances──> [Color-Coded Correspondence]
    └──enhances──> [Animated Bijections]

[All-Instances Gallery]
    └──requires──> [Instance Enumeration]
    └──requires──> [Structure Renderers (miniature mode)]

[URL Hash State]
    └──requires──> [Structure Pair Selector]
    └──requires──> [Instance Navigator]
    └──independent-of──> [Animation Engine]
```

### Dependency Notes

- **Structure Renderers require Dyck Word Representation:** Every structure must convert to/from Dyck words. Build the Dyck word layer first, then renderers.
- **Animated Bijections require both Renderers and Animation Engine:** Cannot animate what you cannot draw. Build rendering, then animation engine, then bijection-specific animation sequences.
- **Color-Coded Correspondence requires Element Tracking:** The bijection step functions must output which elements map to which. Color assignment depends on this metadata.
- **Dyck Bridge requires all toDyck/fromDyck converters:** The bridge composes through Dyck words, so every structure's converter must work before the bridge can connect arbitrary pairs.
- **Side-by-Side Layout enhances Correspondence:** Showing both structures simultaneously makes color-coded mapping far more effective than sequential rendering.
- **Gallery view requires miniature rendering:** Structure renderers need to work at small scale without becoming illegible. This is a rendering constraint, not a logic one.

## MVP Definition

### Launch With (v1) -- "Presentation-Ready"

Minimum to stand in front of the class and deliver the Catalan bijection demo without embarrassment.

- [ ] **All 11 structure renderers** -- the entire point of the tool
- [ ] **Dyck word internal representation + converters** -- the architectural backbone
- [ ] **At least 3-4 classical bijections animated** (Parentheses-Dyck, Binary Trees-Triangulations, Parentheses-Binary Trees, Dyck-Mountain Ranges) -- enough to demonstrate the concept
- [ ] **Playback controls** (play/pause, step forward/back) -- presenter pacing
- [ ] **Structure pair selector + n selector** -- basic navigation
- [ ] **Projector-friendly styling** -- legibility
- [ ] **Step description text** -- contextual narration

### Add After Core Works (v1.x) -- "Polished Presentation"

Features to add once the core rendering and animation pipeline is solid.

- [ ] **Remaining 4 classical bijections** -- completes the hand-crafted set
- [ ] **Dyck bridge for non-classical pairs** -- enables any-to-any selection
- [ ] **Color-coded element correspondence** -- visual tracking
- [ ] **Instance navigator** -- cycle through all C(n) cases
- [ ] **Speed control slider** -- presentation pacing flexibility
- [ ] **Keyboard shortcuts** -- hands-free control
- [ ] **Bijection chain indicator** -- shows intermediate structures

### If Time Permits (v2) -- "Impressive Demo"

Features that make the tool exceptional but are not needed to deliver a good presentation.

- [ ] **Side-by-side dual-panel layout** -- simultaneous comparison
- [ ] **Smooth interpolation animations** -- 3Blue1Brown-quality motion
- [ ] **All-instances gallery view** -- overview of Catalan families
- [ ] **Highlight active transformation step** -- attention direction
- [ ] **URL hash state** -- pre-bookmarked demos
- [ ] **Presenter notes panel** -- talking point cheat sheet

## Feature Prioritization Matrix

| Feature | Presentation Value | Implementation Cost | Priority |
|---------|-------------------|---------------------|----------|
| 11 Structure Renderers | HIGH | HIGH | P1 |
| Dyck Word Representation | HIGH | MEDIUM | P1 |
| Classical Bijection Animations (8) | HIGH | HIGH | P1 |
| Playback Controls | HIGH | MEDIUM | P1 |
| Step Description Text | HIGH | LOW | P1 |
| Structure Pair Selector | HIGH | LOW | P1 |
| n Selector | HIGH | LOW | P1 |
| Projector-Friendly Styling | HIGH | LOW | P1 |
| Works Offline from index.html | HIGH | LOW (constraint) | P1 |
| Color-Coded Correspondence | HIGH | MEDIUM | P1 |
| Instance Navigator | MEDIUM | LOW | P1 |
| Speed Control | MEDIUM | LOW | P1 |
| Dyck Bridge (non-classical pairs) | MEDIUM | MEDIUM | P2 |
| Keyboard Shortcuts | MEDIUM | LOW | P2 |
| Bijection Chain Indicator | MEDIUM | MEDIUM | P2 |
| Side-by-Side Layout | HIGH | MEDIUM | P2 |
| Highlight Active Step | MEDIUM | LOW | P2 |
| Smooth Interpolation | HIGH | HIGH | P3 |
| All-Instances Gallery | MEDIUM | MEDIUM | P3 |
| URL Hash State | LOW | LOW | P3 |
| Presenter Notes Panel | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for the presentation to work
- P2: Should have, adds significant polish
- P3: Nice to have if time permits

## Comparable Tool Feature Analysis

| Feature | Manim (3B1B) | GeoGebra | VisuAlgo | Desmos | **Our Tool** |
|---------|-------------|-----------|----------|--------|-------------|
| Smooth animation | Yes (core strength) | Basic | Step-based | Slider-driven | Step-based with smooth interpolation goal |
| Interactive controls | No (pre-rendered video) | Full mouse interaction | Play/pause/step | Sliders + input | Play/pause/step/speed |
| Multiple structure types | Unlimited (programmatic) | Geometry-focused | Algorithm-focused | Function-focused | 11 Catalan structures (fixed) |
| Bijection/transformation | Custom-coded per video | Limited | Algorithm state transitions | Parameter changes | Core feature -- any pair |
| Offline capable | Yes (Python local) | Requires download or web | Web only | Web only | Yes (single HTML file) |
| Projector-optimized | Yes (designed for video) | Not specifically | Not specifically | Not specifically | Yes (explicit design goal) |
| Zero setup | No (Python + LaTeX needed) | Moderate (app download) | Just open URL | Just open URL | Just open file |
| Step-by-step narration | Voiceover in video | None | Built-in text | None | Step description text |
| Color correspondence | Custom per video | Limited | Algorithm-specific | N/A | Built-in element mapping |

### Key Insight from Comparables

No existing tool specifically handles Catalan number bijections. The closest parallel is VisuAlgo (step-through algorithm visualization), but it targets sorting/graph algorithms, not combinatorial bijections. Manim can do anything but requires pre-rendering video -- it is not interactive during a live presentation. The niche of "live-interactive bijection explorer for a specific mathematical family" is genuinely novel for a classroom presentation tool.

## Sources

- Manim Community documentation (training data knowledge -- MEDIUM confidence)
- GeoGebra feature set (training data knowledge -- MEDIUM confidence)
- VisuAlgo (visualgo.net) feature set (training data knowledge -- MEDIUM confidence)
- Desmos calculator features (training data knowledge -- MEDIUM confidence)
- D3.js capabilities for math visualization (training data knowledge -- MEDIUM confidence)
- Mathigon interactive math tools (training data knowledge -- MEDIUM confidence)
- General HCI principles for presentation tools (training data knowledge -- MEDIUM confidence)

**Note:** WebSearch and WebFetch were unavailable during this research session. All comparable tool analysis is based on training data knowledge (cutoff: early 2025). Feature recommendations are grounded in the specific project requirements from PROJECT.md and general principles of interactive visualization design. Confidence is MEDIUM across the board -- the recommendations are sound but could not be cross-referenced with current documentation.

---
*Feature research for: Interactive Catalan Number Bijection Explorer*
*Researched: 2026-02-23*
