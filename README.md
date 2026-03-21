# Animation Sensitivity Scanner

A browser bookmarklet that scans any webpage for CSS animations and transitions that don't respect the `prefers-reduced-motion` user preference.

Unprotected animations can cause real problems for people with vestibular disorders, epilepsy, ADHD, or motion sensitivity. Most sites ship them anyway. This tool makes it easy to see exactly where.

Under Progress: You could use the suppress button to stop some animations but may not work for gifs and some other components yet

---

## What it checks

- CSS `animation` properties not wrapped in a `prefers-reduced-motion` media query
- CSS `transition` properties with the same problem
- GIF images, which are always a motion concern regardless of CSS

Each violation shows the selector and the offending value so you know exactly what to fix.

---

## Install

1. Open `bookmarklet.js` in this repo and copy the single line starting with `javascript:`
2. Create a new bookmark in your browser (any browser works)
3. Paste that line as the bookmark's URL
4. Give it a name like "Animation Scanner"

That's it, try the bookmark on any webpage to run the scan.

---

## Usage

Click the bookmarklet on any page. A panel appears in the top-right corner showing:

- A count of animation, transition, and GIF violations
- The CSS selector and value for each one
- A toggle button to suppress all motion on the page (Still wonky)

The suppress toggle works by injecting a `<style>` tag that sets all animation and transition durations to near-zero. Clicking it again removes the tag so the page's original CSS is never modified.

---

## How prefers-reduced-motion works

It's an OS-level setting, not a browser one. Users turn it on in their system accessibility settings:

- macOS: System Settings → Accessibility → Display → Reduce Motion
- Windows: Settings → Accessibility → Visual Effects → Animation Effects
- iOS: Settings → Accessibility → Motion → Reduce Motion
- Android: Settings → Accessibility → Remove Animations

Once enabled, the browser exposes it via CSS. A correctly written animation looks like this:

```css
@media (prefers-reduced-motion: no-preference) {
  .spinner {
    animation: spin 1s linear infinite;
  }
}
```

This only animates for users who haven't requested reduced motion. The scanner flags anything that skips this guard.

---

## Testing it locally

Open `index.html` in a browser. The page has four intentional violations and two correctly guarded elements — a controlled environment to verify the scanner is catching the right things and ignoring the rest.

To emulate the OS setting without changing your system preferences, open Chrome DevTools, go to the Rendering tab, and set "Emulate CSS media feature prefers-reduced-motion" to reduce.

Side Note: Rendering tab has lots of a11y emulstions that you could try out.

---

## Files

```
animation-scanner/
├── index.html       test page with intentional violations
├── scanner.js       annotated source, read this to understand how it works
├── bookmarklet.js   minified one-liner, this is the actual bookmarklet that you need
└── README.md
```

`scanner.js` is the source of truth. `bookmarklet.js` is a build artifact — if you change the scanner, re-minify from the source rather than editing the minified version by hand.

---

## Relevant standard

WCAG 2.3.3 (AAA) — Animation from Interactions. Users should be able to disable motion triggered by interaction unless the animation is essential to the functionality.

---

Built as part of a project exploring cognitive accessibility tooling.