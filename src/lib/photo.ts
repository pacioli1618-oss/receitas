// Photo of the dish. Phones take 3–12 MB pictures; the browser shrinks them before upload so
// grandma's mobile data and the Storage bill stay small: a 1600px photo (~200–400 KB) and a
// 360px thumbnail for the book list, both WebP where the browser can encode it, else JPEG.
//
// Files: Storage bucket "receitas", <recipe_id>/<random>.<ext> and <random>-thumb.<ext>
// (supabase/migrations/20261116000200_recipe_photos.sql).

const BUCKET = 'receitas';
const FULL_SIZE = 1600;
const THUMB_SIZE = 360;

export type PreparedPhoto = {full: Blob; thumb: Blob; extension: 'webp' | 'jpg'; contentType: 'image/webp' | 'image/jpeg'};

/** Thrown when the picked file can't be decoded (an odd format, a broken file). */
export class PhotoError extends Error {
  constructor(message: 'photo_unreadable' | 'photo_upload_failed') {
    super(message);
    this.name = 'PhotoError';
  }
}

function publicBase() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
}

/** "<recipe>/<name>.webp" → "<recipe>/<name>-thumb.webp". */
export function thumbPath(photoPath: string) {
  return photoPath.replace(/\.(jpg|webp)$/, '-thumb.$1');
}

export function buildPhotoUrl(photoPath: string, size: 'full' | 'thumb' = 'full') {
  return `${publicBase()}/${size === 'thumb' ? thumbPath(photoPath) : photoPath}`;
}

export function randomPhotoName() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // Applies the camera's EXIF rotation, so portrait photos stay upright.
    return await createImageBitmap(file, {imageOrientation: 'from-image'});
  } catch {
    // Older Safari: fall back to an <img>, which also honours EXIF rotation.
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } catch {
      throw new PhotoError('photo_unreadable');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encode(source: ImageBitmap | HTMLImageElement, maxSide: number, preferWebp: boolean) {
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoError('photo_unreadable');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  // Safari can't encode WebP and silently returns a PNG instead: check the type we got.
  if (preferWebp) {
    const webp = await toBlob(canvas, 'image/webp', 0.8);
    if (webp?.type === 'image/webp') return webp;
  }
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.82);
  if (!jpeg) throw new PhotoError('photo_unreadable');
  return jpeg;
}

/** Shrinks the picked picture into the two files we upload. */
export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const source = await decode(file);
  try {
    const full = await encode(source, FULL_SIZE, true);
    const isWebp = full.type === 'image/webp';
    const thumb = await encode(source, THUMB_SIZE, isWebp);
    return {full, thumb, extension: isWebp ? 'webp' : 'jpg', contentType: isWebp ? 'image/webp' : 'image/jpeg'};
  } finally {
    if ('close' in source) source.close();
  }
}
