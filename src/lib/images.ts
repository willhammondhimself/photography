import type { Photo, PlateKind } from './photos';

export const WIDTHS = {
  tile: [320, 480, 640, 960, 1280],
  full: [960, 1280, 1920, 2560, 3200],
  plate: [640, 960, 1280, 1920, 2560],
  hero: [960, 1280, 1920, 2560, 3200],
  preview: [640, 960, 1280],
} as const;

/**
 * Never request a width larger than the source. If the context wants more pixels
 * than we have, the source width itself becomes the top candidate.
 */
export function widthsFor(photo: Photo, list: readonly number[]): number[] {
  const out = list.filter((w) => w < photo.width);
  if (list.some((w) => w >= photo.width)) out.push(photo.width);
  return out.length ? out : [photo.width];
}

const r = (n: number) => Math.round(n);

// Justified rows stretch tiles past their row-height basis (most on phones, where a
// row may hold one photo), so the hint allows for that growth instead of upscaling.
export const tileSizes = (p: Photo) =>
  `(max-width: 639px) min(100vw, ${r(184 * p.ar * 1.75)}px), (min-width: 1600px) ${r(320 * p.ar * 1.3)}px, ${r(20 * p.ar * 1.3)}vw`;

const PLATE_VW: Record<Exclude<PlateKind, 'full'>, number> = { wide: 84, left: 58, right: 58, center: 50, pair: 50 };
export const plateSizes = (kind: PlateKind) => (kind === 'full' ? '100vw' : `(min-width: 1024px) ${PLATE_VW[kind]}vw, 100vw`);

export const heroSizes = (p: Photo) =>
  `(max-width: 639px) 100vw, (min-aspect-ratio: ${p.width}/${p.height}) calc((100svh - 12rem) * ${p.ar.toFixed(4)}), calc(100vw - 6rem)`;

export const previewSizes = '(min-width: 1024px) 40vw, 100vw';

/** Inline custom properties for a photo wrapper. */
export const photoVars = (p: Photo, lqip = false) =>
  `--w:${p.width};--h:${p.height};--ar:${p.ar.toFixed(5)};--dom:${p.color}` + (lqip ? `;--lqip:url(${p.lqip})` : '');
