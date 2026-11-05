import type { ImageMetadata } from 'astro';
import { z } from 'astro/zod';
import photosRaw from '../data/photos.json';
import metaRaw from '../data/photos.meta.json';
import seriesRaw from '../data/series.json';
import indexRaw from '../data/index.json';
import siteRaw from '../data/site.json';

/* ------------------------------------------------------------------ schema */

export const CATEGORY_LABELS = {
  yosemite: 'Yosemite',
  hawaii: 'Hawaiʻi',
  greece: 'Greece',
  climbing: 'Climbing',
  landscape: 'Landscape',
  portraits: 'Portraits',
  events: 'Events',
  travel: 'Travel',
} as const;
export type Category = keyof typeof CATEGORY_LABELS;
const categoryEnum = z.enum(Object.keys(CATEGORY_LABELS) as [Category, ...Category[]]);

const PhotoEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  file: z.string().min(1),
  title: z.string().min(1),
  place: z.string().default(''),
  category: categoryEnum,
  series: z.string().nullable().default(null),
  alt: z.string(),
  focus: z.tuple([z.number(), z.number()]).optional(),
});

const Exif = z.object({
  camera: z.string().optional(),
  lens: z.string().optional(),
  focal: z.string().optional(),
  aperture: z.string().optional(),
  shutter: z.string().optional(),
  iso: z.string().optional(),
});

const MetaEntry = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  color: z.string(),
  lqip: z.string().startsWith('data:image/'),
  date: z.string().optional(),
  exif: Exif.default({}),
});

const PlateKind = z.enum(['full', 'wide', 'left', 'right', 'center', 'pair']);
export type PlateKind = z.infer<typeof PlateKind>;
const PlateEntry = z.union([
  z.object({ photo: z.string(), plate: PlateKind.exclude(['pair']) }),
  z.object({ photo: z.tuple([z.string(), z.string()]), plate: z.literal('pair') }),
]);

const SeriesEntry = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  number: z.number().int().positive(),
  title: z.string().min(1),
  /** 'place' (a trip or location) or 'subject' (a kind of picture across places). */
  kind: z.enum(['place', 'subject']).default('place'),
  place: z.string().default(''),
  dates: z.string().default(''),
  blurb: z.string().default(''),
  cover: z.string(),
  plates: z.array(PlateEntry).min(1),
});

const Site = z.object({
  name: z.string(),
  email: z.string().default(''),
  instagram: z.string().default(''),
  city: z.string().default(''),
  school: z.string().default(''),
});

/* ------------------------------------------------------------------ types */

export type Exif = z.infer<typeof Exif>;
export type Photo = z.infer<typeof PhotoEntry> &
  Omit<z.infer<typeof MetaEntry>, 'exif'> & {
    exif: Exif;
    image: ImageMetadata;
    ar: number;
    categoryLabel: string;
  };
export type Plate =
  | { plate: Exclude<PlateKind, 'pair'>; photos: [Photo] }
  | { plate: 'pair'; photos: [Photo, Photo] };
export type Series = Omit<z.infer<typeof SeriesEntry>, 'plates' | 'cover'> & {
  cover: Photo;
  plates: Plate[];
  photos: Photo[];
};

/* ------------------------------------------------------------- validation */

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const parse = <T extends z.ZodType>(schema: T, data: unknown, where: string): z.infer<T> => {
  const r = schema.safeParse(data);
  if (!r.success) {
    for (const issue of r.error.issues) fail(`${where}${issue.path.length ? '.' + issue.path.join('.') : ''}: ${issue.message}`);
    throw new Error(`[photos] invalid data\n  ${errors.join('\n  ')}`);
  }
  return r.data;
};

const images = import.meta.glob<ImageMetadata>('/src/assets/photos/**/*.jpg', {
  eager: true,
  import: 'default',
});

const entries = parse(z.array(PhotoEntry), photosRaw, 'photos.json');
const metas = parse(z.record(z.string(), MetaEntry), metaRaw, 'photos.meta.json');
const seriesEntries = parse(z.array(SeriesEntry), seriesRaw, 'series.json');
const indexEntries = parse(z.array(PlateEntry).min(1), indexRaw, 'index.json');
export const site = parse(Site, siteRaw, 'site.json');

const seen = new Set<string>();
export const photos: Photo[] = [];
for (const e of entries) {
  if (seen.has(e.id)) fail(`duplicate photo id "${e.id}"`);
  seen.add(e.id);
  const image = images[`/src/assets/photos/${e.file}`];
  const meta = metas[e.id];
  if (!image) fail(`"${e.id}": file src/assets/photos/${e.file} is missing`);
  if (!meta) fail(`"${e.id}": no entry in photos.meta.json (run npm run meta)`);
  const alt = e.alt.trim();
  if (!alt) fail(`"${e.id}": alt is empty`);
  if (alt.length > 160) fail(`"${e.id}": alt is ${alt.length} characters (max 160)`);
  if (/^(image|photo|picture) of\b/i.test(alt)) fail(`"${e.id}": alt starts with "${alt.split(' ').slice(0, 2).join(' ')}"`);
  if (/—/.test(e.title + e.place + e.alt)) fail(`"${e.id}": copy contains an em dash`);
  if (!image || !meta) continue;
  if (meta.width !== image.width || meta.height !== image.height)
    fail(`"${e.id}": photos.meta.json is stale (${meta.width}x${meta.height} vs ${image.width}x${image.height}); run npm run meta`);
  photos.push({
    ...e,
    ...meta,
    width: image.width,
    height: image.height,
    image,
    ar: image.width / image.height,
    categoryLabel: CATEGORY_LABELS[e.category],
  });
}

export const byId = new Map(photos.map((p) => [p.id, p]));

const resolve = (id: string, where: string): Photo | undefined => {
  const p = byId.get(id);
  if (!p && seen.has(id)) return undefined; // already reported
  if (!p) fail(`${where}: references missing photo "${id}"`);
  return p;
};

const resolvePlates = (list: z.infer<typeof PlateEntry>[], where: string): Plate[] => {
  const out: Plate[] = [];
  list.forEach((entry, i) => {
    if (entry.plate === 'pair') {
      const a = resolve(entry.photo[0], `${where}[${i}]`);
      const b = resolve(entry.photo[1], `${where}[${i}]`);
      if (a && b) out.push({ plate: 'pair', photos: [a, b] });
    } else {
      const a = resolve(entry.photo, `${where}[${i}]`);
      if (!a) return;
      if (entry.plate === 'full' && a.ar < 1.4)
        fail(`${where}[${i}]: "full" plate "${a.id}" has aspect ratio ${a.ar.toFixed(2)} (needs >= 1.4)`);
      if (entry.plate === 'full' && list[i - 1]?.plate === 'full') fail(`${where}[${i}]: two "full" plates in a row`);
      out.push({ plate: entry.plate, photos: [a] });
    }
  });
  return out;
};

/* --------------------------------------------------------------- index */

export const indexPlates = resolvePlates(indexEntries, 'index.json');
{
  const opener = indexPlates[0];
  if (opener && opener.plate !== 'pair' && opener.photos[0].ar < 1.4)
    fail(`index.json[0]: the opener "${opener.photos[0].id}" must be landscape with aspect ratio >= 1.4`);
  if (opener && opener.plate === 'pair') fail('index.json[0]: the opener cannot be a pair');
}
/** Photos in Index reading order (pairs expanded). */
export const indexPhotos = indexPlates.flatMap((p) => p.photos);
// Sequencing rule: two neighbouring frames (including the two halves of a pair) never come from
// the same series, or, for singles, the same category. Keeps El Capitan from following itself.
indexPhotos.forEach((p, i) => {
  const q = indexPhotos[i - 1];
  if (!q) return;
  const same = p.series || q.series ? p.series === q.series : p.category === q.category;
  if (same) fail(`index.json: "${q.id}" and "${p.id}" are neighbours from the same ${p.series ? 'series' : 'category'}`);
});
indexPlates.forEach((p, i) => {
  if (i > 0 && p.plate === 'full' && indexPlates[i - 1].plate === 'full') fail(`index.json[${i}]: two full plates back to back`);
});

/* --------------------------------------------------------------- series */

const slugs = new Set<string>();
export const series: Series[] = seriesEntries.map((s, si) => {
  if (slugs.has(s.slug)) fail(`series.json: duplicate slug "${s.slug}"`);
  slugs.add(s.slug);
  const where = `series.json[${si}] (${s.slug})`;
  if (s.plates[0]?.plate === 'full') fail(`${where}: the first plate cannot be "full"`);
  const plates = resolvePlates(s.plates, `${where}.plates`);
  const list = plates.flatMap((p) => p.photos);
  const cover = resolve(s.cover, `${where}.cover`) ?? list[0];
  if (/—/.test(s.title + s.place + s.blurb)) fail(`${where}: copy contains an em dash`);
  return { ...s, cover, plates, photos: list };
});
export const seriesBySlug = new Map(series.map((s) => [s.slug, s]));
/** A series' place, unless it only repeats the title ("Hawaiʻi / Hawaiʻi", "Yosemite /
 *  Yosemite Valley"), in which case the meta line drops it. */
export const seriesPlace = (s: Pick<Series, 'title' | 'place'>) => {
  const t = s.title.toLowerCase();
  const p = s.place.toLowerCase();
  return p && !p.includes(t) && !t.includes(p) ? s.place : '';
};

for (const p of photos) {
  if (!p.series) continue;
  const s = seriesBySlug.get(p.series);
  if (!s) fail(`"${p.id}": series "${p.series}" does not exist in series.json`);
  else if (!s.photos.includes(p)) fail(`"${p.id}": has series "${p.series}" but is not in its plates`);
}
for (const s of series) {
  for (const p of s.photos) if (p.series !== s.slug) fail(`series "${s.slug}": plate photo "${p.id}" has series "${p.series}"`);
}

if (errors.length) throw new Error(`[photos] build validation failed\n  ${errors.join('\n  ')}`);

/* ---------------------------------------------------------------- order */

/** Newest first. Undated photos follow in photos.json order. */
export const archiveOrder: Photo[] = photos
  .map((p, i) => ({ p, i }))
  .sort((a, b) => {
    const da = a.p.date ?? '';
    const db = b.p.date ?? '';
    if (da && db && da !== db) return da < db ? 1 : -1;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return a.i - b.i;
  })
  .map(({ p }) => p);

export type Sequence = {
  list: Photo[];
  index: number;
  context: { title: string; href: string };
};

/** Prev/next follow the photo's series; unseried photos follow Archive order. */
export function seriesSequence(photo: Photo): Sequence {
  const s = photo.series ? seriesBySlug.get(photo.series) : undefined;
  if (s) return { list: s.photos, index: s.photos.indexOf(photo), context: { title: s.title, href: `series/${s.slug}/` } };
  return { list: archiveOrder, index: archiveOrder.indexOf(photo), context: { title: 'Archive', href: 'archive/' } };
}

/* ----------------------------------------------------------- categories */

export const categories = (Object.keys(CATEGORY_LABELS) as Category[])
  .map((slug) => ({ slug, label: CATEGORY_LABELS[slug], count: photos.filter((p) => p.category === slug).length }))
  .filter((c) => c.count > 0);

/** Short camera label and URL slug for the Archive refinement ("A7C II", "a7c-ii"). */
export const cameraShort = (camera?: string) => (camera ? camera.replace(/^(Sony|Panasonic|Fujifilm|Canon|Nikon|Leica|Ricoh)\s+/i, '') : '');
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const yearOf = (p: Photo) => (p.date ? p.date.slice(0, 4) : '');
