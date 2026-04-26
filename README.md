# Animation Sensitivity Scanner

A browser bookmarklet that scans any webpage for CSS animations and transitions that don't respect the `prefers-reduced-motion` user preference — and lets you suppress all motion on the page instantly.

Under Progress: You could use the suppress button to stop some animations but may not work for gifs and some other components yet

---

## The problem

For most people, an unprotected spinner or hover transition is a minor annoyance. For people with vestibular disorders, epilepsy, migraines, or ADHD, it can cause physical symptoms dizziness, nausea, disorientation or significantly increase cognitive load during a task.

The browser already has a solution for this. Users can enable "Reduce Motion" in their OS accessibility settings, and the browser exposes that preference via the CSS media query `prefers-reduced-motion`. This preference can be honoured with css but some pages do not.

Existing auditing tools like axe and Lighthouse may not surface `prefers-reduced-motion` coverage in complete depth. Chrome DevTools lets you emulate the setting, but that shows you the experience, it doesn't tell you which specific rules are unprotected or where to fix them. This tool fills that gap.

---

## What it checks

- CSS `animation` properties not wrapped in a `prefers-reduced-motion` media query
- CSS `transition` properties with the same problem
- GIF images, which are always a motion concern regardless of CSS

Each violation shows the CSS selector and the offending value so you know exactly what to fix.

---

## Install

1. Open `bookmarklet.js` in this repo
2. Copy the entire contents
3. Create a new bookmark in your browser
4. Paste the code as the bookmark's URL
5. Name it something like "Animation Scanner"

Click the bookmark on any webpage to run the scan.

---

## Usage

A panel appears in the top-right corner showing a count of animation, transition, and GIF violations, the CSS selector and value for each one, and a toggle button to suppress (most) motion on the page instantly.

The suppress toggle injects a `<style>` tag that sets all animation and transition durations to near-zero. Clicking it again removes the tag. The page's original CSS is never modified so the override just gets layered on top and can be taken off.

---

## How prefers-reduced-motion works

It's an OS-level setting, not exactly a browser one. Users enable it in their system accessibility settings:

- macOS: System Settings → Accessibility → Display → Reduce Motion
- Windows: Settings → Accessibility → Visual Effects → Animation Effects
- iOS: Settings → Accessibility → Motion → Reduce Motion
- Android: Settings → Accessibility → Remove Animations

Once enabled, the browser exposes it via CSS. A correctly implemented animation looks like this:

```css
@media (prefers-reduced-motion: no-preference) {
  .spinner {
    animation: spin 1s linear infinite;
  }
}
```

This only runs the animation for users who haven't requested reduced motion. The scanner flags anything that skips this guard.

This behaviour is covered under WCAG 2.3.3 (AAA) — Animation from Interactions, which states that users should be able to disable motion triggered by interaction unless it's essential to the functionality.

---

## For developers

`scanner.js` is the annotated source — make all edits here.

The build pipeline goes:

```
scanner.js  →  npm run minify  →  bookmarklet.min.js  →  prepend "javascript:"  →  bookmarklet.js
```

To rebuild after making changes:

```bash
npm install
npm run minify
```

Then open `bookmarklet.min.js`, copy the contents, prepend `javascript:` to the very start, and paste into `bookmarklet.js`. That's the file users install.

To test locally, open `index.html` with Live Server. The page has four intentional violations and two correctly guarded elements. To emulate a user's reduced motion OS preference without changing your own system settings, open Chrome DevTools → Rendering tab → set "Emulate CSS media feature prefers-reduced-motion" to reduce.

```
animation-scanner/
├── scanner.js           annotated source — edit this
├── bookmarklet.min.js   raw minified output from terser
├── bookmarklet.js       installable bookmarklet — has the javascript: prefix
├── index.html           test page with intentional violations
├── package.json         build scripts and dev dependencies
├── package-lock.json    exact dependency versions, keep this committed
└── .gitignore
```

---

Built as part of a series of cognitive accessibility tools aimed at surfaces that existing auditing pipelines don't cover well.
