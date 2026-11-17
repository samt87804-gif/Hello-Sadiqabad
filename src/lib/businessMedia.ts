import { getSupabaseClient } from './supabase';

export const BUSINESS_MEDIA_BUCKET = 'Hello Sadiqabad';
export const MAX_RAW_BUSINESS_IMAGE_BYTES = 15 * 1024 * 1024;

export type BusinessMediaKind = 'logo' | 'cover';

export interface CompressedBusinessImage {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

export async function compressBusinessImage(
  source: File,
  kind: BusinessMediaKind
): Promise<CompressedBusinessImage> {
  if (!source.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }
  if (source.size > MAX_RAW_BUSINESS_IMAGE_BYTES) {
    throw new Error('Image 15 MB se chhoti honi chahiye. Upload se pehle image resize karein.');
  }
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('Is browser mein image compression supported nahi. Updated Chrome/Edge use karein.');
  }

  const bitmap = await createImageBitmap(source);
  try {
    const maxDimension = kind === 'logo' ? 640 : 1800;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression start nahi ho saki.');
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Compressed image generate nahi ho saki.')),
        'image/webp',
        kind === 'logo' ? 0.82 : 0.80
      );
    });
    const safeBase = source.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 50) || kind;
    const file = new File([blob], `${safeBase}-${kind}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    return {
      file,
      originalBytes: source.size,
      compressedBytes: blob.size,
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}

export async function uploadBusinessImage(
  file: File,
  kind: BusinessMediaKind
): Promise<{ path: string; publicUrl: string }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase Storage configured nahi hai; image upload available nahi.');
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error('Image upload ke liye admin login dobara verify karein.');

  const path = `business-media/${authData.user.id}/${crypto.randomUUID()}-${kind}.webp`;
  const { data, error } = await client.storage.from(BUSINESS_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw error;
  const { data: publicData } = client.storage.from(BUSINESS_MEDIA_BUCKET).getPublicUrl(data.path);
  return { path: data.path, publicUrl: publicData.publicUrl };
}

export async function deleteBusinessImages(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase Storage configured nahi hai.');
  const { error } = await client.storage.from(BUSINESS_MEDIA_BUCKET).remove([...new Set(paths)]);
  if (error) throw error;
}

export function getBusinessMediaObjectPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${encodeURIComponent(BUSINESS_MEDIA_BUCKET)}/`;
    const decodedMarker = `/storage/v1/object/public/${BUSINESS_MEDIA_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker) >= 0
      ? parsed.pathname.indexOf(marker) + marker.length
      : parsed.pathname.indexOf(decodedMarker) >= 0
        ? parsed.pathname.indexOf(decodedMarker) + decodedMarker.length
        : -1;
    if (index < 0) return null;
    return decodeURIComponent(parsed.pathname.slice(index));
  } catch {
    return null;
  }
}
