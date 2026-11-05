// Viewer: arrow keys, Esc, swipe with drag-follow, neighbor preloading.
import { navigate } from 'astro:transitions/client';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const viewer = () => document.querySelector<HTMLElement>('[data-viewer]');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let busy = false;
document.addEventListener('astro:after-swap', () => (busy = false));

function goTo(href: string, dir: 'prev' | 'next') {
  if (busy) return false;
  busy = true;
  navigate(href, { info: { nav: dir }, history: 'replace' }).finally(() => (busy = false));
  return true;
}

function go(dir: 'prev' | 'next') {
  const a = document.querySelector<HTMLAnchorElement>(`.b-links [data-nav-link="${dir}"]`);
  return !!a && goTo(a.href, dir);
}

function canGoBack() {
  if ((history.state?.index ?? 0) > 0) return true;
  try {
    const r = new URL(document.referrer);
    return r.origin === location.origin && r.pathname.startsWith(base) && !r.pathname.startsWith(`${base}photo/`);
  } catch {
    return false;
  }
}

function close() {
  if (canGoBack()) history.back();
  else {
    const a = document.querySelector<HTMLAnchorElement>('[data-close]');
    if (a) navigate(a.href);
  }
}

const isField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

document.addEventListener('keydown', (e) => {
  if (!viewer() || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isField(e.target)) return;
  if (e.key === 'ArrowRight' && go('next')) e.preventDefault();
  else if (e.key === 'ArrowLeft' && go('prev')) e.preventDefault();
  else if (e.key === 'Escape') {
    e.preventDefault();
    close();
  }
});

// Capture phase, so this runs before ClientRouter's own click handler.
document.addEventListener(
  'click',
  (e) => {
    if (!viewer() || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('[data-nav-link], [data-close]');
    if (!a) return;
    e.preventDefault();
    if (a.hasAttribute('data-close')) close();
    else go(a.dataset.navLink as 'prev' | 'next');
  },
  true,
);

/* ------------------------------------------------------------- swipe */

type Drag = { id: number; x: number; y: number; t: number; dx: number; axis?: 'x' | 'y'; frame: HTMLElement | null; onPhoto: boolean };
let drag: Drag | null = null;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const phone = () => matchMedia('(max-width: 639px)').matches;

// Hidden chrome stays hidden from photo to photo (it is an <html> attribute, which the swap
// would otherwise reset), and comes back on leaving the Viewer.
document.addEventListener('astro:before-swap', (ev) => {
  const e = ev as Event & { newDocument: Document };
  if (document.documentElement.dataset.chrome === 'off' && e.newDocument.querySelector('[data-viewer]'))
    e.newDocument.documentElement.dataset.chrome = 'off';
});

function settle(frame: HTMLElement | null) {
  if (!frame) return;
  frame.style.transition = 'transform 300ms var(--ease-in-out)';
  frame.style.transform = '';
  const done = () => {
    frame.style.transition = '';
    frame.removeEventListener('transitionend', done);
  };
  frame.addEventListener('transitionend', done);
}

document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' || !e.isPrimary) return;
  // The stage, or on phones anywhere on the viewer outside its controls.
  const t = e.target as Element;
  const area =
    t.closest?.<HTMLElement>('[data-stage]') ??
    (phone() && !t.closest?.('a, button, summary, details') ? t.closest?.<HTMLElement>('[data-viewer]') : null);
  if (!area) return;
  drag = {
    id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0,
    frame: document.querySelector('[data-stage] .frame'),
    onPhoto: !!t.closest?.('[data-stage] .frame'),
  };
});

document.addEventListener(
  'pointermove',
  (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.axis && Math.hypot(dx, dy) > 8) drag.axis = Math.abs(dx) > 1.5 * Math.abs(dy) ? 'x' : 'y';
    if (drag.axis !== 'x') return;
    drag.dx = dx;
    if (!reduced() && drag.frame) {
      drag.frame.style.transition = 'none';
      drag.frame.style.transform = `translateX(${clamp(dx * 0.35, -48, 48)}px)`;
    }
  },
  { passive: true },
);

const end = (e: PointerEvent) => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  // Phones: a tap on the photo (no drag) hides or shows the chrome.
  if (!d.axis && e.type === 'pointerup' && d.onPhoto && phone()) {
    const html = document.documentElement;
    if (html.dataset.chrome === 'off') delete html.dataset.chrome;
    else html.dataset.chrome = 'off';
    return;
  }
  if (d.axis !== 'x' || e.type === 'pointercancel') return settle(d.frame);
  const v = Math.abs(d.dx) / Math.max(1, e.timeStamp - d.t);
  if (Math.abs(d.dx) > 60 || v > 0.5) {
    // The slide-out continues from the current offset; the new page replaces the frame.
    if (go(d.dx < 0 ? 'next' : 'prev')) return;
  }
  settle(d.frame);
};
document.addEventListener('pointerup', end);
document.addEventListener('pointercancel', end);

/* ----------------------------------------------------------- preload */

const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);

document.addEventListener('astro:page-load', () => {
  if (!viewer()) return;
  idle(() => {
    document.querySelectorAll<HTMLAnchorElement>('.b-links a[data-preload]').forEach((a) => {
      const img = new Image();
      img.sizes = a.dataset.preloadSizes ?? '100vw';
      img.srcset = a.dataset.preload ?? '';
      img.decode().catch(() => {});
    });
  });
});
