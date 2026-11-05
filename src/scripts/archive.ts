// Archive: in-place filtering with a FLIP reflow, URL sync, list view and its preview.

type State = { cat: string; camera: string; year: string; view: 'sheet' | 'list' };
const KEYS = ['camera', 'year'] as const;
const MARKER: Record<string, string> = { cat: 'mk-cat', camera: 'mk-cam', year: 'mk-year', view: 'mk-view' };

const root = () => document.querySelector<HTMLElement>('[data-archive]');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function readState(el: HTMLElement): State {
  const base = el.dataset.base!;
  const rest = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : '';
  const fromPath = rest.split('/').filter(Boolean)[0];
  const q = new URLSearchParams(location.search);
  const valid = (group: string, v: string | null) =>
    !!v && !!el.querySelector(`[data-filter="${group}"][data-value="${CSS.escape(v)}"]`);
  const cat = fromPath && valid('cat', fromPath) ? fromPath : 'all';
  return {
    cat,
    camera: valid('camera', q.get('camera')) ? q.get('camera')! : 'all',
    year: valid('year', q.get('year')) ? q.get('year')! : 'all',
    view: q.get('view') === 'list' ? 'list' : 'sheet',
  };
}

function href(el: HTMLElement, s: State) {
  const q = new URLSearchParams();
  for (const k of KEYS) if (s[k] !== 'all') q.set(k, s[k]);
  if (s.view === 'list') q.set('view', 'list');
  const qs = q.toString();
  return `${el.dataset.base}${s.cat === 'all' ? '' : `${s.cat}/`}${qs ? `?${qs}` : ''}`;
}

const matches = (d: DOMStringMap, s: State, ignoreCat = false) =>
  (ignoreCat || s.cat === 'all' || d.cat === s.cat) &&
  (s.camera === 'all' || d.camera === s.camera) &&
  (s.year === 'all' || d.year === s.year);

function labelOf(el: HTMLElement, group: string, value: string) {
  return el.querySelector(`[data-filter="${group}"][data-value="${CSS.escape(value)}"] .opt-l`)?.textContent ?? value;
}

/** Bring the bar, counts and (when `layout` is true) the tiles, rows and views in line with `s`.
 *  The reflow calls it once with `layout` false on the click, so the bar answers at once. */
function apply(el: HTMLElement, s: State, layout = true) {
  const tiles = [...el.querySelectorAll<HTMLElement>('[data-tile]')];
  const rows = [...el.querySelectorAll<HTMLElement>('[data-row]')];
  let shown = 0;
  for (const t of tiles) {
    const m = matches(t.dataset, s);
    if (layout) t.hidden = !m;
    if (m) shown++;
  }
  if (layout) for (const r of rows) r.hidden = !matches(r.dataset, s);

  // Category counts under the current camera/year refinements. Zero stays visible.
  const counts = new Map<string, number>();
  for (const t of tiles) {
    if (!matches(t.dataset, s, true)) continue;
    counts.set('all', (counts.get('all') ?? 0) + 1);
    counts.set(t.dataset.cat!, (counts.get(t.dataset.cat!) ?? 0) + 1);
  }
  el.querySelectorAll<HTMLElement>('[data-count]').forEach((c) => {
    const n = counts.get(c.dataset.count!) ?? 0;
    c.textContent = String(n);
    c.closest('.facet')?.classList.toggle('is-zero', n === 0);
  });

  // Active options and their accent squares.
  for (const group of ['cat', 'camera', 'year', 'view'] as const) {
    const value = s[group];
    const opts = [...el.querySelectorAll<HTMLAnchorElement>(`[data-filter="${group}"]`)];
    const mk = el.querySelector<HTMLElement>(`.${MARKER[group]}`);
    for (const o of opts) {
      const on = o.dataset.value === value;
      o.classList.toggle('is-active', on);
      if (group === 'cat') on ? o.setAttribute('aria-current', 'page') : o.removeAttribute('aria-current');
      if (on && mk && mk.parentElement !== o) o.prepend(mk);
      o.href = href(el, { ...s, [group]: o.dataset.value });
    }
  }
  const clear = el.querySelector<HTMLAnchorElement>('[data-clear]');
  if (clear) clear.href = href(el, { cat: 'all', camera: 'all', year: 'all', view: s.view });

  const total = tiles.length;
  const filtered = s.cat !== 'all' || s.camera !== 'all' || s.year !== 'all';
  el.querySelectorAll('[data-live]').forEach((l) => (l.textContent = filtered ? `${shown} of ${total}` : `${total} photographs`));

  const catLabel = s.cat === 'all' ? '' : labelOf(el, 'cat', s.cat);
  // Copy the facet's markup, not its text, so the ʻokina keeps its tightening span.
  const cur = el.querySelector('[data-fb-current]');
  const curSrc = el.querySelector(`[data-filter="cat"][data-value="${CSS.escape(s.cat)}"] .opt-l`);
  if (cur) cur.innerHTML = curSrc?.innerHTML ?? 'All';
  const cnt = el.querySelector('[data-fb-count]');
  if (cnt) cnt.textContent = filtered ? `${shown} of ${total}` : String(total);
  document.title = document.title.replace(/^(.*?· )?Archive · /, catLabel ? `${catLabel} · Archive · ` : 'Archive · ');
  el.dataset.category = s.cat;
  if (!layout) return;

  const empty = el.querySelector<HTMLElement>('[data-empty]');
  if (empty) {
    empty.hidden = shown > 0;
    const parts = [
      s.cat !== 'all' && labelOf(el, 'cat', s.cat),
      s.camera !== 'all' && labelOf(el, 'camera', s.camera),
      s.year !== 'all' && labelOf(el, 'year', s.year),
    ].filter(Boolean);
    const text = empty.querySelector('[data-empty-text]');
    if (text) text.textContent = `No photographs match ${parts.join(', ')}.`;
  }

  const sheet = el.querySelector<HTMLElement>('[data-sheet]');
  const list = el.querySelector<HTMLElement>('[data-listview]');
  if (sheet) sheet.hidden = s.view !== 'sheet' || shown === 0;
  if (list) list.hidden = s.view !== 'list' || shown === 0;
  if (s.view === 'list') preview(el, rows.find((r) => !r.hidden)?.dataset.row);
}

function preview(el: HTMLElement, id?: string) {
  if (!id) return;
  el.querySelectorAll<HTMLElement>('[data-pv]').forEach((p) => (p.hidden = p.dataset.pv !== id));
}

/* ------------------------------------------------------------- reflow */

// Filtering animates the live tiles directly (FLIP with the Web Animations API), not through a
// view transition: there is no snapshot to wait for, so the bar, the count and the markers
// answer in the same frame as the click. Two layouts are never on screen together:
//   1. tiles that do not match fade out where they are (--dur-tile-out); everything else holds;
//   2. only then is the new layout committed. Every tile that stays, and is on screen both
//      before and after, glides from its old slot to its new one (--dur-tile-move, --ease-out);
//   3. every other tile that is on screen in the new layout (new matches, and survivors that
//      were off screen) fades up in its own slot, with no travel, once the glide has all but
//      landed (--dur-tile-in). Nothing flies in from the edge and no tile crosses another.
// The sheet clips while this runs, so nothing passes outside it (under the bar or the margins).
// Arriving images are warmed in advance (warmTiles), so they arrive as photographs.

/** A duration token in milliseconds. Chrome serializes computed time values in seconds
 *  ("0.15s"), so the unit must be read, not assumed. */
const ms = (name: string, fallback: number) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const v = parseFloat(raw);
  if (!Number.isFinite(v)) return fallback;
  return /ms$/.test(raw) ? v : /s$/.test(raw) ? v * 1000 : v;
};
const ease = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'ease-out';

let running: Animation[] = [];
let pending: { timer: number; run: () => void } | undefined;
let unclip = 0;
/** Jump any reflow in flight to its end state, so a second click starts from a settled sheet. */
function settleNow() {
  if (pending) {
    clearTimeout(pending.timer);
    const run = pending.run;
    pending = undefined;
    run();
  }
  running.forEach((a) => a.cancel());
  running = [];
  clearTimeout(unclip);
  document.querySelectorAll('.sheet.is-reflowing').forEach((x) => x.classList.remove('is-reflowing'));
}

function startVT(update: () => void, type: string) {
  const d = document as Document & { startViewTransition?: (arg: unknown) => { finished: Promise<void> } };
  if (!d.startViewTransition || reduced()) {
    update();
    return Promise.resolve();
  }
  // Mirror the type on <html> so the CSS holds even where VT types are unsupported.
  const html = document.documentElement;
  html.dataset.vt = type;
  let finished: Promise<void>;
  try {
    finished = d.startViewTransition({ update, types: [type] }).finished;
  } catch {
    finished = d.startViewTransition(update).finished;
  }
  return finished.catch(() => {}).finally(() => delete html.dataset.vt);
}

/** Glide each filter-bar marker from where it was to its new option. */
function markerRects(el: HTMLElement) {
  return new Map([...el.querySelectorAll<HTMLElement>('.filterbar .mk')].map((m) => [m, m.getBoundingClientRect()]));
}
function glideMarkers(before: Map<HTMLElement, DOMRect>) {
  const dur = ms('--dur-marker', 420);
  before.forEach((r0, m) => {
    const r1 = m.getBoundingClientRect();
    if (!r1.width) return;
    const dx = r0.left - r1.left;
    const dy = r0.top - r1.top;
    if (!dx && !dy) return;
    m.getAnimations().forEach((a) => a.cancel());
    m.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: dur, easing: ease('--ease-out') });
  });
}

/** Where each tile in `show` will sit once the filter is committed, measured in the same frame
 *  (toggle, read, restore: nothing is painted). Allows for the scroll reset in go(). The archive
 *  is at least a screen tall, so the shorter sheet never clamps the scroll while probing. */
function probe(el: HTMLElement, tiles: HTMLElement[], show: Set<HTMLElement>) {
  const was = tiles.map((t) => t.hidden);
  tiles.forEach((t) => (t.hidden = !show.has(t)));
  const barTop = el.getBoundingClientRect().top + scrollY;
  const shift = scrollY > barTop ? scrollY - barTop : 0;
  const out = new Map<HTMLElement, DOMRect>();
  show.forEach((t) => {
    const r = t.getBoundingClientRect();
    out.set(t, new DOMRect(r.left, r.top + shift, r.width, r.height));
  });
  tiles.forEach((t, i) => (t.hidden = was[i]));
  return out;
}

function reflow(el: HTMLElement, next: State, commit: () => void) {
  settleNow();
  const sheet = el.querySelector<HTMLElement>('[data-sheet]');
  const tiles = [...el.querySelectorAll<HTMLElement>('[data-tile]')];
  const onScreen = (r: DOMRect) => r.bottom > 0 && r.top < innerHeight && r.width > 0;
  const sheetVisible = !!sheet && !sheet.hidden;
  const willShow = new Set(tiles.filter((t) => matches(t.dataset, next)));

  // The bar answers at once: counts, active facet, its marker.
  const marks = markerRects(el);
  apply(el, next, false);
  glideMarkers(marks);
  if (!sheetVisible) {
    commit();
    return;
  }

  const out = ms('--dur-tile-out', 120);
  const move = ms('--dur-tile-move', 300);
  const fadeIn = ms('--dur-tile-in', 180);
  const easeOut = ease('--ease-out');

  // Phones: the category disclosure closes first, so the old layout is measured where it rests.
  setOpen(el, false);
  const shownBefore = tiles.filter((t) => !t.hidden);
  const after = probe(el, tiles, willShow);
  // Beat 1 takes off screen every tile that will not be on screen in the new layout: the ones
  // that no longer match, and the survivors whose new slot is below the fold (they would
  // otherwise fly out of view and leave the sheet empty while the new set arrives).
  const leaving = shownBefore.filter((t) => {
    if (!onScreen(t.getBoundingClientRect())) return false;
    const r1 = after.get(t);
    return !r1 || !onScreen(r1);
  });
  sheet.classList.add('is-reflowing');

  const leavingSet = new Set(leaving);
  // Beat 1: the tiles that go fade out in place, in the old layout. Nothing else moves.
  for (const t of leaving) {
    running.push(t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: out, easing: ease('--ease-exit'), fill: 'forwards' }));
  }

  const second = () => {
    // First: where every staying tile is now (in the old layout).
    const first = new Map<HTMLElement, DOMRect>();
    shownBefore.forEach((t) => willShow.has(t) && first.set(t, t.getBoundingClientRect()));
    running.forEach((a) => a.cancel());
    running = [];
    commit();

    // Last: the new layout. A survivor glides from its old slot only when both slots are on
    // screen, so every move is short and visible from start to end. A survivor that was off
    // screen does not fly in from the edge: like a new tile, it fades up in its own slot.
    let moved = false;
    const arrivals: HTMLElement[] = [];
    const plan: [HTMLElement, DOMRect, DOMRect][] = [];
    for (const t of willShow) {
      const r1 = t.getBoundingClientRect();
      if (!onScreen(r1)) continue;
      const r0 = first.get(t);
      if (!r0 || !onScreen(r0) || leavingSet.has(t)) {
        arrivals.push(t);
        continue;
      }
      plan.push([t, r0, r1]);
    }
    for (const [t, r0, r1] of plan) {
      const dy = r0.top - r1.top;
      const dx = r0.left - r1.left;
      const sx = r0.width / r1.width;
      const sy = r0.height / r1.height;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.002) continue;
      moved = true;
      running.push(
        t.animate(
          [
            { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
            { transformOrigin: '0 0', transform: 'none' },
          ],
          { duration: move, easing: easeOut },
        ),
      );
    }
    // Beat 3: arrivals once the glide has all but landed (expo-out is ~93% there at 40%), so no
    // arriving tile shows while a mover is still crossing its slot.
    const delay = moved ? move * 0.4 : 0;
    for (const t of arrivals) {
      running.push(t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fadeIn, delay, easing: easeOut, fill: 'backwards' }));
    }
    unclip = window.setTimeout(() => sheet.classList.remove('is-reflowing'), Math.max(moved ? move : 0, arrivals.length ? delay + fadeIn : 0) + 20);
  };

  if (!leaving.length) {
    second();
    return;
  }
  pending = { timer: window.setTimeout(() => { pending = undefined; second(); }, out), run: second };
}

function go(el: HTMLElement, next: State) {
  const prev = readState(el);
  const commit = () => {
    setOpen(el, false);
    apply(el, next);
    history.replaceState(history.state, '', href(el, next));
    // If the page was scrolled into the sheet, start the new results right under the filter
    // bar (which stays where it was) instead of wherever the shorter page clamps the scroll.
    const barTop = el.getBoundingClientRect().top + scrollY;
    if (scrollY > barTop) scrollTo({ top: barTop, behavior: 'instant' });
  };
  if (prev.view !== next.view) {
    settleNow();
    startVT(commit, 'view');
    return;
  }
  if (reduced() || !('animate' in Element.prototype)) {
    settleNow();
    commit();
    return;
  }
  reflow(el, next, commit);
}

/* ------------------------------------------------------------- wiring */

/** Phones: open or close the category disclosure. */
function setOpen(el: HTMLElement, open: boolean) {
  el.querySelector('.filterbar')?.classList.toggle('is-open', open);
  el.querySelector('[data-fb-toggle]')?.setAttribute('aria-expanded', String(open));
  if (open) edgeFades();
}

/** Bring the page in line with the URL (query params are JS-only). Idempotent. */
export function syncArchive() {
  const el = root();
  if (!el || el.dataset.synced === location.href) return;
  el.dataset.synced = location.href;
  apply(el, readState(el));
}

document.addEventListener('click', (e) => {
  const el = root();
  if (!el || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const toggle = (e.target as Element).closest?.('[data-fb-toggle]');
  if (toggle && el.contains(toggle)) {
    setOpen(el, toggle.getAttribute('aria-expanded') !== 'true');
    return;
  }
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('[data-filter], [data-clear]');
  if (!a || !el.contains(a)) return;
  e.preventDefault();
  // Finish any reflow in flight first, so the state (and URL) it was heading to is the start.
  settleNow();
  const s = readState(el);
  const next: State = a.hasAttribute('data-clear')
    ? { cat: 'all', camera: 'all', year: 'all', view: s.view }
    : { ...s, [a.dataset.filter!]: a.dataset.value! };
  if (JSON.stringify(next) === JSON.stringify(s)) return;
  go(el, next);
  el.dataset.synced = location.href;
});

const onRow = (e: Event) => {
  const el = root();
  const row = (e.target as Element).closest?.<HTMLElement>('[data-row]');
  if (el && row) preview(el, row.dataset.row);
};
document.addEventListener('pointerover', onRow);
document.addEventListener('focusin', onRow);

/** Phones: the category row scrolls sideways. Fade only the side that has more to show. */
function edgeFades() {
  document.querySelectorAll<HTMLElement>('.fb-cats').forEach((row) => {
    const max = row.scrollWidth - row.clientWidth;
    row.classList.toggle('is-scrolled', row.scrollLeft > 2);
    row.classList.toggle('is-end', max <= 2 || row.scrollLeft >= max - 2);
  });
}
document.addEventListener(
  'scroll',
  (e) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('fb-cats')) edgeFades();
  },
  { capture: true, passive: true },
);
addEventListener('resize', edgeFades, { passive: true });

/** Once the page is idle, let every tile's image load, including tiles hidden by the current
 *  filter, so a filter never reveals placeholders that then fade up one by one. */
function warmTiles() {
  const el = root();
  if (!el) return;
  const run = () =>
    el.querySelectorAll<HTMLImageElement>('[data-tile] img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 600);
}

document.addEventListener('astro:page-load', () => {
  syncArchive();
  edgeFades();
  warmTiles();
});
