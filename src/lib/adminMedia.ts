import { getSupabaseClient } from './supabase';
import { compressImageFile } from './imageCompression';

export const ADMIN_MEDIA_BUCKET = 'Hello Sadiqabad';
export const MAX_ADMIN_IMAGE_BYTES = 15 * 1024 * 1024;

export type AdminImagePurpose = 'directory' | 'banner' | 'profile' | 'news' | 'campaign' | 'gallery' | 'payment';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export async function uploadAdminImage(
  source: File,
  purpose: AdminImagePurpose
): Promise<{ path: string; publicUrl: string; originalBytes: number; compressedBytes: number; width: number; height: number }> {
  if (!IMAGE_TYPES.has(source.type)) {
    throw new Error('JPG, PNG, WebP ya AVIF image select karein. SVG aur doosri file types allowed nahi.');
  }
  if (source.size > MAX_ADMIN_IMAGE_BYTES) {
    throw new Error('Original image 15 MB se chhoti honi chahiye.');
  }
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('Is browser mein image compression supported nahi. Updated Chrome/Edge use karein.');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase Storage configured nahi hai; image upload available nahi.');
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error('Image upload ke liye admin login dobara verify karein.');

  const maxDimension = purpose === 'payment' ? 256 : purpose === 'profile' ? 900 : purpose === 'banner' ? 1920 : purpose === 'directory' ? 1200 : 1600;
  const quality = purpose === 'profile' ? 0.86 : purpose === 'banner' ? 0.83 : purpose === 'payment' ? 0.82 : 0.84;
  const compressed = await compressImageFile(source, { maxDimension, quality, maxInputBytes: MAX_ADMIN_IMAGE_BYTES, maxOutputBytes: 8 * 1024 * 1024 });
  const path = 'site-media/' + authData.user.id + '/' + purpose + '/' + crypto.randomUUID() + '.webp';
  const { data, error } = await client.storage.from(ADMIN_MEDIA_BUCKET).upload(path, compressed.file, { cacheControl: '31536000', contentType: 'image/webp', upsert: false });
  if (error) throw error;
  if (!data?.path) throw new Error('Supabase Storage ne upload path return nahi kiya.');
  const { data: publicData } = client.storage.from(ADMIN_MEDIA_BUCKET).getPublicUrl(data.path);
  return { path: data.path, publicUrl: publicData.publicUrl, originalBytes: compressed.originalBytes, compressedBytes: compressed.compressedBytes, width: compressed.width, height: compressed.height };
}
