// Generates src/data/photos.meta.json from the source JPEGs.
// For each photo in src/data/photos.json: width/height, dominant color,
// a 24px-wide WebP LQIP, and (when present) EXIF capture date and exposure.
// GPS is never read. Runs as `prebuild`, so `npm run build` always refreshes it.

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import exifr from 'exifr';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photosPath = path.join(root, 'src/data/photos.json');
const metaPath = path.join(root, 'src/data/photos.meta.json');
const assets = path.join(root, 'src/assets/photos');

const CAMERAS = {
  'ILCE-7CM2': 'Sony A7C II',
  'DC-S5': 'Panasonic S5',
};

const pick = [
  'Make', 'Model', 'LensModel', 'FocalLength', 'FNumber',
  'ExposureTime', 'ISO', 'DateTimeOriginal', 'CreateDate',
];

const photos = JSON.parse(await readFile(photosPath, 'utf8'));
const previous = existsSync(metaPath) ? JSON.parse(await readFile(metaPath, 'utf8')) : {};

const trimNum = (n) => String(Number(n.toFixed(1))).replace(/\.0$/, '');

function camera(make = '', model = '') {
  if (!model) return undefined;
  if (CAMERAS[model]) return CAMERAS[model];
  const m = model.trim();
  const brand = make.trim().split(/\s+/)[0] ?? '';
  const pretty = brand && !m.toLowerCase().startsWith(brand.toLowerCase())
    ? `${brand[0].toUpperCase()}${brand.slice(1).toLowerCase()} ${m}`
    : m;
  return pretty;
}

function shutter(t) {
  if (!t) return undefined;
  if (t >= 1) return `${trimNum(t)} s`;
  return `1/${Math.round(1 / t)} s`;
}

// Local wall-clock time, no timezone: the camera has no idea where it was.
function isoLocal(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return undefined;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

async function readExif(buf) {
  let tags;
  try {
    tags = await exifr.parse(buf, { pick, gps: false, xmp: false, icc: false, iptc: false });
  } catch {
    tags = undefined;
  }
  if (!tags) return { date: undefined, exif: {} };
  const exif = {
    camera: camera(tags.Make, tags.Model),
    lens: tags.LensModel ? tags.LensModel.trim().replace(/(\d)\s*-\s*(\d)/g, '$1–$2') : undefined,
    focal: tags.FocalLength ? `${Math.round(tags.FocalLength)} mm` : undefined,
    aperture: tags.FNumber ? `f/${trimNum(tags.FNumber)}` : undefined,
    shutter: shutter(tags.ExposureTime),
    iso: tags.ISO ? `ISO ${tags.ISO}` : undefined,
  };
  for (const k of Object.keys(exif)) if (exif[k] === undefined) delete exif[k];
  return { date: isoLocal(tags.DateTimeOriginal ?? tags.CreateDate), exif };
}

const out = {};
let fresh = 0;
for (const photo of photos) {
  const file = path.join(assets, photo.file);
  if (!existsSync(file)) {
    console.error(`[photo-meta] missing file for "${photo.id}": src/assets/photos/${photo.file}`);
    process.exit(1);
  }
  const buf = await readFile(file);
  const key = createHash('sha1').update(buf).digest('hex').slice(0, 16);
  const prev = previous[photo.id];
  if (prev && prev.source === key) {
    out[photo.id] = prev;
    continue;
  }
  const img = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  // Respect EXIF orientation when reporting dimensions.
  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  const { dominant } = await sharp(buf).stats();
  const lqipBuf = await sharp(buf).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const { date, exif } = await readExif(buf);
  const entry = {
    width,
    height,
    color: `rgb(${dominant.r} ${dominant.g} ${dominant.b})`,
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    ...(date ? { date } : {}),
    exif,
    source: key,
  };
  out[photo.id] = entry;
  fresh++;
}

await writeFile(metaPath, JSON.stringify(out, null, 2) + '\n');
console.log(`[photo-meta] ${photos.length} photos, ${fresh} refreshed -> src/data/photos.meta.json`);
