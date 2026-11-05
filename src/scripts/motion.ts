// View Transition wiring: name the one photo that morphs, pre-decode the Viewer hero,
// mark images loaded so nothing is ever captured at opacity 0.
import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from 'astro:transitions/client';
import { syncArchive } from './archive';

let fromPath = '';
let nav: string | undefined;
/** 'open' (plate or tile into the Viewer) or 'close' (Viewer back out), when a photo morphs. */
let morph: 'open' | 'close' | undefined;
const named = new Set<HTMLElement>();

const name = (el: HTMLElement, vtName = 'photo') => {
  el.style.setProperty('view-transition-name', vtName);
  named.add(el);
  // The photo lifts out of its frame for the morph. Drop the frame's placeholder (dominant
  // color, blurred LQIP) so no ghost of it stays behind in the page snapshot.
  const frame = el.closest<HTMLElement>('.frame');
  if (frame) {
    frame.classList.add('is-lifted');
    named.add(frame);
  }
  // A tile skipped by content-visibility is never captured; keep it rendered for the snapshot.
  const tile = el.closest<HTMLElement>('.tile');
  if (tile) {
    tile.style.setProperty('content-visibility', 'visible');
    tile.classList.add('is-lifted');
    named.add(tile);
  }
};
const clearNames = () => {
  named.forEach((el) => {
    el.style.removeProperty('view-transition-name');
    el.style.removeProperty('content-visibility');
    el.classList.remove('is-lifted');
  });
  named.clear();
};

const isVisible = (el: Element) => el.getClientRects().length > 0 && !el.closest('[hidden]');

/** The mobile opener is cropped; a cropped image never morphs into an uncropped one. */
const isCropped = (a: Element) => {
  if (!a.hasAttribute('data-cropped')) return false;
  const img = a.querySelector('img');
  return !img || getComputedStyle(img).objectFit === 'cover';
};

const photoLinkFor = (pathname: string, prefer?: Element | null) => {
  const ok = (a: HTMLAnchorElement | null | undefined): a is HTMLAnchorElement =>
    !!a && a.pathname === pathname && isVisible(a) && !isCropped(a) && !!a.querySelector('img');
  const first = prefer?.closest<HTMLAnchorElement>('a[data-photo]');
  if (ok(first)) return first;
  return [...document.querySelectorAll<HTMLAnchorElement>('a[data-photo]')].find(ok);
};

export function markLoaded(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>('img[data-fade]:not(.is-loaded)').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) img.classList.add('is-loaded', 'no-fade');
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function decodeLike(hero: HTMLImageElement) {
  const avif = hero.closest('picture')?.querySelector<HTMLSourceElement>('source[type="image/avif"]');
  const img = new Image();
  const sizes = avif?.getAttribute('sizes') ?? hero.getAttribute('sizes');
  if (sizes) img.sizes = sizes;
  const srcset = avif?.getAttribute('srcset') ?? hero.getAttribute('srcset');
  if (srcset) img.srcset = srcset;
  img.src = hero.getAttribute('src') ?? '';
  return img.decode().catch(() => {});
}

/* Warm the Viewer's photo before the click lands. When a pointer rests on a plate or tile (or
   it is pressed or focused), fetch the Viewer page (usually already prefetched) and decode its
   hero, so the morph starts on the click instead of after a decode wait. */
const warm = new Map<string, Promise<void>>();
function warmViewer(a: HTMLAnchorElement) {
  const key = a.pathname;
  if (warm.has(key) || !key.includes('/photo/')) return;
  const p = fetch(a.href)
    .then((r) => (r.ok ? r.text() : ''))
    .then((html) => {
      const hero = html && new DOMParser().parseFromString(html, 'text/html').querySelector<HTMLImageElement>('img[data-hero]');
      return hero ? decodeLike(hero) : undefined;
    })
    .catch(() => {});
  warm.set(key, p);
}
let hoverTimer = 0;
const photoLink = (t: EventTarget | null) =>
  (t instanceof Element ? t.closest<HTMLAnchorElement>('a[data-photo]') : null) ?? undefined;
document.addEventListener('pointerover', (e) => {
  const a = photoLink(e.target);
  clearTimeout(hoverTimer);
  if (a) hoverTimer = window.setTimeout(() => warmViewer(a), 60);
});
document.addEventListener('pointerdown', (e) => {
  const a = photoLink(e.target);
  if (a) warmViewer(a);
});
document.addEventListener('focusin', (e) => {
  const a = photoLink(e.target);
  if (a) warmViewer(a);
});

document.addEventListener('astro:before-preparation', (ev) => {
  const e = ev as TransitionBeforePreparationEvent;
  fromPath = e.from.pathname;
  nav = e.info?.nav;
  clearNames();
  // Next/previous: the outgoing photo gets its own group, so each photo crossfades at its
  // own size and position instead of being squeezed into the other's box.
  const oldHero = document.querySelector<HTMLImageElement>('img[data-hero]');
  morph = undefined;
  if (nav && oldHero) name(oldHero, 'photo-out');
  if (!nav && oldHero) morph = 'close';
  if (!nav && !oldHero) {
    const a = photoLinkFor(e.to.pathname, e.sourceElement);
    const img = a?.querySelector('img');
    if (img) {
      name(img);
      morph = 'open';
    }
  }
  const loader = e.loader;
  e.loader = async () => {
    await loader();
    const hero = e.newDocument?.querySelector<HTMLImageElement>('img[data-hero]');
    const warmed = warm.get(e.to.pathname);
    if (hero) await Promise.race([warmed ? Promise.all([warmed, decodeLike(hero)]) : decodeLike(hero), wait(warmed ? 300 : 450)]);
  };
});

document.addEventListener('astro:before-swap', (ev) => {
  const e = ev as TransitionBeforeSwapEvent;
  if (nav) e.newDocument.documentElement.dataset.nav = nav;
  if (morph) e.newDocument.documentElement.dataset.morph = morph;
  e.viewTransition?.finished
    .catch(() => {})
    .finally(() => {
      clearNames();
      delete document.documentElement.dataset.nav;
      delete document.documentElement.dataset.morph;
      document.documentElement.style.removeProperty('--slide-d');
    });
});

document.addEventListener('astro:after-swap', () => {
  syncArchive();
  /** Next/prev slide travel, shared by both photos (they move in lockstep). One screen width
   *  plus a gutter: the outgoing photo (which sits inside the screen) is just off it when the
   *  incoming one lands, and the incoming one starts just off the opposite edge. */
  function slideDistance() {
    document.documentElement.style.setProperty('--slide-d', `${Math.round(innerWidth + 24)}px`);
  }

  markLoaded();
  // The hero was decoded before the swap; never capture it at opacity 0.
  document.querySelectorAll('img[data-hero]').forEach((img) => img.classList.add('is-loaded', 'no-fade'));
  if (nav) slideDistance();
  if (nav || document.querySelector('img[data-hero]')) return;
  const a = photoLinkFor(fromPath);
  const img = a?.querySelector('img');
  if (!a || !img) return;
  const r = a.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) a.scrollIntoView({ block: 'center', behavior: 'instant' });
  img.loading = 'eager';
  img.classList.add('is-loaded', 'no-fade');
  name(img);
});

markLoaded();
