// Readable source: make all edits here.
// To build: run "npm run minify" which outputs bookmarklet.min.js
// Then prefix "javascript:" to the contents of bookmarklet.min.js — that's your installable bookmarklet.
// Requires terser: npm install

(function () {

  // If the panel is already on the page, kill it before re-running.
  // This way clicking the bookmarklet twice doesn't stack two panels.
  const existingPanel = document.getElementById('a11y-motion-panel');
  if (existingPanel) existingPanel.remove();


  // This is where we collect every problem we find.
  // Each entry will be an object like { type, selector, value }.
  const violations = [];


  // The actual logic for inspecting a single CSS rule.
  // We call this for every rule we find across all stylesheets.
  //
  // "isProtected" currently inside a prefers-reduced-motion
  // media query block. 
  function checkRule(rule, isProtected) {

    // instanceof checks what the object actually is — safer and more
    // readable than comparing against a numeric type constant, which is deprecated.
    if (!(rule instanceof CSSStyleRule)) return;

    const style    = rule.style;
    const selector = rule.selectorText;

    const hasAnimation = style.animation && style.animation !== '';
    const hasTransition = style.transition
      && style.transition !== ''
      && style.transition !== 'none';

    if ((hasAnimation || hasTransition) && !isProtected) {
      violations.push({
        type:     hasAnimation ? 'animation' : 'transition',
        selector: selector,
        value:    hasAnimation ? style.animation : style.transition,
      });
    }
  }


  // Walk every stylesheet on the page.
  // document.styleSheets includes both <style> tags and external .css files.
  Array.from(document.styleSheets).forEach(sheet => {

    // Cross-origin stylesheets (loaded from a CDN on a different domain)
    // will throw a security error when you try to read their rules.
    // We can't do anything about those, so we just move on.
    try {
      Array.from(sheet.cssRules || []).forEach(rule => {

        // instanceof CSSMediaRule checks for @media blocks — more explicit
        // and future-proof than the deprecated rule.type === 4 numeric check.
        if (rule instanceof CSSMediaRule) {
          const mediaText = rule.conditionText || rule.media.mediaText;
          const isSafe    = mediaText.includes('prefers-reduced-motion');

          // Check each rule inside the @media block, passing along
          // whether this block counts as "safe" or not.
          Array.from(rule.cssRules || []).forEach(innerRule => {
            checkRule(innerRule, isSafe);
          });

          return;
        }

        // Regular rule outside any @media block — never protected.
        checkRule(rule, false);
      });

    } catch (e) {
      // Cross-origin sheet
      console.warn("Could not read stylesheet rules:", e);
    }
  });


  // GIFs are a separate issue as they're not CSS.
  // We just grab every img tag whose src contains ".gif".
  // We can't tell programmatically now if a GIF is actually animated,
  // but flagging all of them is a reasonable since animated
  // GIFs are extremely common and always worth a second look.
  Array.from(document.querySelectorAll('img'))
    .filter(img => img.src && img.src.toLowerCase().includes('.gif'))
    .forEach(img => {
      violations.push({
        type:     'gif',
        selector: img.alt ? `img[alt="${img.alt}"]` : 'img (no alt)',
        value:    img.src,
      });
    });


  // Tally up by type so the summary line is easy to read.
  const animCount  = violations.filter(v => v.type === 'animation').length;
  const transCount = violations.filter(v => v.type === 'transition').length;
  const gifCount   = violations.filter(v => v.type === 'gif').length;
  const total      = violations.length;

  // Color-code the result: green if clean, yellow if a handful, red if bad.
  const statusColor = total === 0 ? '#22c55e' : total < 5 ? '#f59e0b' : '#ef4444';
  const statusText  = total === 0
    ? 'All Clear'
    : `${total} Violation${total > 1 ? 's' : ''} Found`;


  // Build the floating panel and inject it into the page.
  // Everything is inline styles so the page's own CSS can't mess with it.
  // z-index 999999 puts it above basically anything.
  const panel = document.createElement('div');
  panel.id = 'a11y-motion-panel';
  panel.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    width: 340px;
    max-height: 80vh;
    overflow-y: auto;
    background: #0f172a;
    color: #e2e8f0;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 999999;
    border: 1px solid #334155;
    line-height: 1.5;
  `;

  // Truncate long selectors and values so the panel doesn't get unwieldy.
  // CSS selectors on real sites can get absolutely ridiculous.
  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
  }



  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-weight:bold;font-size:14px;color:#f8fafc;">Motion Scanner</div>
        <div style="font-size:11px;color:#b3becd;">WCAG 2.3.3 — prefers-reduced-motion</div>
      </div>
      <button id="a11y-close-btn" style="background:#334155;border:none;color:#b3becd;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;">x</button>
    </div>

    <div style="padding:12px 16px;border-bottom:1px solid #1e293b;">
      <div style="color:${statusColor};font-size:15px;font-weight:bold;margin-bottom:8px;">${statusText}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <span style="background:#1e293b;padding:3px 8px;border-radius:4px;font-size:11px;">
          Animations: <b style="color:#f472b6;">${animCount}</b>
        </span>
        <span style="background:#1e293b;padding:3px 8px;border-radius:4px;font-size:11px;">
          Transitions: <b style="color:#60a5fa;">${transCount}</b>
        </span>
        <span style="background:#1e293b;padding:3px 8px;border-radius:4px;font-size:11px;">
          GIFs: <b style="color:#34d399;">${gifCount}</b>
        </span>
      </div>
    </div>

    <div style="padding:12px 16px;">
      ${total === 0
        ? `<div style="color:#b3becd;font-size:12px;">
             No unprotected animations found. This page respects motion preferences.
           </div>`
        : violations.slice(0, 20).map(v => `
            <div style="margin-bottom:10px;padding:8px;background:#1e293b;border-radius:6px;border-left:3px solid ${
              v.type === 'animation' ? '#f472b6' :
              v.type === 'transition' ? '#60a5fa' : '#34d399'
            };">
              <div style="font-size:11px;color:#b3becd;text-transform:uppercase;letter-spacing:.5px;">${v.type}</div>
              <div style="color:#fbbf24;font-size:11px;word-break:break-all;">${truncate(v.selector, 60)}</div>
              <div style="color:#b3becd;font-size:10px;word-break:break-all;">${truncate(v.value, 80)}</div>
            </div>
          `).join('')
      }
      ${total > 20
        ? `<div style="color:#94a3b8;font-size:11px;text-align:center;">...and ${total - 20} more</div>`
        : ''
      }
    </div>

    <div style="padding:10px 16px;border-top:1px solid #1e293b;">
      <button id="a11y-toggle-btn" style="width:100%;padding:8px;background:#7c3aed;color:#ede9fe;border:none;border-radius:6px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;margin-bottom:8px;">
        Suppress All Animations
      </button>
      <div style="font-size:10px;color:#94a3b8;">
        Scanned ${document.styleSheets.length} stylesheet(s) · ${document.querySelectorAll('*').length} elements
      </div>
    </div>
  `;

  document.body.appendChild(panel);


  // Close button — straightforward.
  document.getElementById('a11y-close-btn').addEventListener('click', () => {
    panel.remove();
  });


  // The toggle works by injecting a <style> tag that overrides every
  // animation and transition on the page to basically zero duration.
  //
  // We use 0.01ms instead of "none" because some JavaScript listens for
  // the animationend event — setting duration to none can break that.
  // Near-zero is the safer way to effectively kill motion.
  //
  // To "undo", we just remove the injected tag. The page's original
  // CSS was never touched, so everything snaps back automatically.
  let suppressed = false;
  const KILL_SWITCH_ID = 'a11y-kill-switch';

  document.getElementById('a11y-toggle-btn').addEventListener('click', () => {
    const btn = document.getElementById('a11y-toggle-btn');

    if (!suppressed) {
      const styleTag = document.createElement('style');
      styleTag.id = KILL_SWITCH_ID;
      styleTag.textContent = `
        *, *::before, *::after {
          animation-duration:        0.01ms !important;
          animation-iteration-count: 1      !important;
          transition-duration:       0.01ms !important;
          scroll-behavior:           auto   !important;
        }
      `;
      document.head.appendChild(styleTag);

      suppressed = true;
      btn.textContent      = 'Re-enable Animations';
      btn.style.background = '#166534';
      btn.style.color      = '#86efac';

    } else {
      const styleTag = document.getElementById(KILL_SWITCH_ID);
      if (styleTag) styleTag.remove();

      suppressed = false;
      btn.textContent      = 'Suppress All Animations';
      btn.style.background = '#7c3aed';
      btn.style.color      = '#ede9fe';
    }
  });

})();