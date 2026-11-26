import { getSupabaseClient } from './supabase';
import { compressImageFile } from './imageCompression';

export const BUSINESS_MEDIA_BUCKET = 'Hello Sadiqabad';
export const MAX_RAW_BUSINESS_IMAGE_BYTES = 15 * 1024 * 1024;

export type BusinessMediaKind = 'logo' | 'cover' | 'gallery';

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
  return compressImageFile(source, {
    maxDimension: kind === 'logo' ? 640 : 1800,
    quality: kind === 'logo' ? 0.82 : 0.80,
    maxInputBytes: MAX_RAW_BUSINESS_IMAGE_BYTES,
    maxOutputBytes: 8 * 1024 * 1024,
  });
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
  if (!data?.path) throw new Error('Supabase Storage ne upload path return nahi kiya.');
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
