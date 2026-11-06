# Innerjam

A songwriter's jam tool. Pick a root note and a scale, then choose a mode (Scale, Guitar or Piano) to see the diatonic chords, scale formula, fretboard shapes and keyboard layout, and play along. Built for quick jams on any device, phone first.

## Product principles

- **Show what's needed when.** The first screen is only the key wheel, the scale picker and the three mode buttons. Nothing else appears until a mode is chosen. Keep new features inside the mode they belong to rather than adding to the top of the page.
- **Ease of use over completeness.** One clear action per area. Sentence-case copy, plain verbs, no jargon in labels unless it's standard music vocabulary.
- **Phone first.** Everything must work one-handed on a ~380px-wide screen with touch targets of at least 32px.

## Repo layout

- `index.html` is the whole app: HTML, CSS and JavaScript in one file. No build step, no dependencies, no framework.
- Only external resource: Google Fonts (Young Serif for display, Figtree for UI), with system font fallbacks.
- Deployed via GitHub Pages (GitHub Actions workflow in `.github/workflows/deploy.yml`, output directory = repo root, no build command).

Keep it a single file unless it grows past what's comfortable to edit; if splitting, use plain ES modules with no bundler.

## User flow

1. **Key wheel** (circle of fifths) picks the root; **scale pills** pick Major, Minor, Harmonic minor, Dorian, Mixolydian, Lydian, Phrygian or Locrian.
2. **Mode buttons** reveal one panel:
   - **Scale**: degree tiles (note, degree vs major such as ♭3, interval such as m3), formula, intervals, W/H step pattern, "versus major" line. Sing-along player: optional home-chord cue, pattern (up and down / up / down), start octave, tempo, and "after each round" = stop / repeat / up a half step / down a half step (modulates the key each round for vocal practice). Half-step buttons transpose the key.
   - **Guitar**: sub-tabs Chords (open + E-shape + A-shape barre voicings, 3-note or 7ths), Triads (three-string inversions on G-B-E, D-G-B or A-D-G), Scale shapes (seven 3-notes-per-string shapes plus whole-neck view, degree or note labels, Play shape).
   - **Piano**: sub-tabs Chords (keyboard diagrams) and Scale (large 2-octave keyboard with labels and a player).
3. **Progression looper** (sticky bottom bar) appears only on chord tabs. Chords are stored as scale degrees, so the progression follows key changes. Presets per scale.
4. **Wooden metronome**: floating button bottom-right, 4/4, woodblock click, defaults to 120 BPM, pendulum swings in time. Independent of the other players.

## Code map (inside the `<script>`)

- **Music data**: `MODES` (semitone steps), `PRESETS` (degree arrays per scale), `QUAL` (chord symbol, numeral suffix, colour class), `SHAPES` (movable E/A-shape fret offsets per quality), `OPEN` (open-chord dictionary keyed `"pc:quality"`), `OPEN_MIDI` (standard tuning, low E = 40).
- **State**: single `state` object, persisted to `localStorage` key `innerjam:v1` via `save()` (all access wrapped in try/catch). `panel`, `view` and `voicing` are not persisted, so each visit starts at the mode chooser. Bump the key version if the shape of saved state changes incompatibly.
- **Theory**: `spell()` picks the enharmonic spelling with the fewest accidentals (F♯ preferred over G♭ for the tie); `buildChords()` derives `NAMES`, `DEGS` (degree/interval labels) and `CH` (chords with quality, numeral, symbol). `chordView()` maps panel + sub-tab to `"piano" | "guitar" | "triads" | null`.
- **Voicings**: `guitarVoicings()`, `triadVoicings()` (brute-force search, span ≤ 3 frets), `scaleShapes()` (3NPS, sorted by lowest fret).
- **Drawing**: SVG strings from `guitarSVG()`, `chordPianoSVG()`, `scalePianoSVG()`, `fretboardSVG()`. Colours always come from CSS variables.
- **Audio** (Web Audio, no samples): `pianoNote()` (triangle + sine), `guitarNote()` (Karplus-Strong, cached buffers), `woodblock()` (filtered noise + pitched sine).
- **Three independent schedulers** using lookahead (`setInterval` 25 ms, 120 ms window): `jam` (progression looper), `seq` (scale/shape players, driven by generator functions that return one round of events at a time), `metro` (metronome). Starting `seq` stops `jam` and vice versa; the metronome runs alongside either.
- **Rendering**: `render()` = `buildChords()` → `renderKey()` → `renderPanel()` → `renderJam()` → `save()`. Panels are rebuilt with `innerHTML`; events are delegated on `#panel`, `.controls`, `#prog` via `data-*` attributes. Playback highlights use the `.hl` class.

## Music conventions

- Roman numerals use plain scale degrees for every scale (minor: i ii° III iv v VI VII), uppercase for major/augmented, lowercase for minor/diminished, ° dim, + aug, ø7 half-diminished.
- Degree labels compare against the major scale (1 2 ♭3 …); intervals use R, M, m, P, A, d.
- Chord colours: amber = major, teal = minor, rose = diminished, accent brown = augmented. Root notes in diagrams use the accent colour.
- Use real ♯ and ♭ characters, never # or b, in anything the user sees.

## Design system

- Tokens are CSS variables on `:root`, with dark values under `@media (prefers-color-scheme: dark)` (guarded by `:not([data-theme="light"])`) and repeated under `[data-theme="dark"]`. Never hard-code colours in markup or SVG.
- Young Serif for chord symbols, headings and key name; Figtree for everything else. No all-caps labels.
- Respect `prefers-reduced-motion`, keep visible focus outlines, give icon buttons `aria-label`s, and keep safe-area insets for the sticky bar and floating metronome (`--dock` offsets the metronome above the looper).
- Typographic apostrophes and quotes (’ “ ”) in UI copy.

## Testing

- Open `index.html` directly in a browser; there's nothing to build or serve.
- Check at 380px and desktop widths, in light and dark mode, and listen to each player (audio only starts after a user tap).
- Optional quick check with Playwright: load the file, click through `[data-panel=scale]`, `[data-panel=guitar]` → `[data-gsub=shapes]`, `[data-panel=piano]` → `[data-psub=scale]`, and assert there are no page errors.
- Theory sanity checks worth keeping: F♯ major spells E♯ for degree 7; harmonic minor 7ths give m(maj7), m7♭5, maj7♯5, m7, 7, maj7, dim7.

## Ideas backlog (not built yet)

- Installable web app with offline support (manifest, icons, service worker) for rehearsal rooms without signal.
- Capo setting that suggests easier open shapes.
- Borrowed chords (♭VII, iv in major) and secondary dominants.
- Strumming / rhythm patterns for the looper.
- Drone note option for vocal practice.
