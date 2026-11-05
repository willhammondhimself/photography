import { archiveOrder, categories, cameraShort, slugify, yearOf, type Photo } from './photos';

export type Option = { value: string; label: string };
export type Group = { key: 'camera' | 'year'; label: string; options: Option[] };

const distinct = (list: Option[]) => [...new Map(list.filter((o) => o.value).map((o) => [o.value, o])).values()];

const cameras = distinct(archiveOrder.map((p) => ({ value: slugify(cameraShort(p.exif.camera)), label: cameraShort(p.exif.camera) })));
const years = distinct(archiveOrder.map((p) => ({ value: yearOf(p), label: yearOf(p) }))).sort((a, b) => (a.value < b.value ? 1 : -1));

/** Refinement groups render only when they would actually refine something (two or more values). */
export const groups: Group[] = [
  ...(cameras.length >= 2 ? [{ key: 'camera' as const, label: 'Camera', options: cameras }] : []),
  ...(years.length >= 2 ? [{ key: 'year' as const, label: 'Year', options: years }] : []),
];

export const tileData = (p: Photo) => ({
  'data-cat': p.category,
  'data-camera': slugify(cameraShort(p.exif.camera)) || undefined,
  'data-year': yearOf(p) || undefined,
});

export { archiveOrder, categories };
