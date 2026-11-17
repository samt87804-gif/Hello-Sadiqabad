import { getSupabaseClient } from './supabase';

export const ADMIN_MEDIA_BUCKET = 'Hello Sadiqabad';
export const MAX_ADMIN_IMAGE_BYTES = 15 * 1024 * 1024;

export type AdminImagePurpose = 'directory' | 'banner' | 'profile' | 'news' | 'campaign' | 'gallery';

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

  const bitmap = await createImageBitmap(source);
  try {
    const maxDimension = purpose === 'profile' ? 900 : purpose === 'banner' ? 1920 : purpose === 'directory' ? 1200 : 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression start nahi ho saki.');
    context.drawImage(bitmap, 0, 0, width, height);

    const quality = purpose === 'profile' ? 0.86 : purpose === 'banner' ? 0.83 : 0.84;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Compressed WebP image generate nahi ho saki.')),
        'image/webp',
        quality
      );
    });
    const safeName = source.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 48) || purpose;
    if (blob.size > 8 * 1024 * 1024) {
      throw new Error('Compressed image bhi 8 MB se bari hai. Chhoti image select karein.');
    }
    const compressedFile = new File([blob], safeName + '-' + purpose + '.webp', {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    const path = 'site-media/' + authData.user.id + '/' + purpose + '/' + crypto.randomUUID() + '.webp';
    const { data, error } = await client.storage.from(ADMIN_MEDIA_BUCKET).upload(path, compressedFile, {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: false,
    });
    if (error) throw error;
    if (!data?.path) throw new Error('Supabase Storage ne upload path return nahi kiya.');

    const { data: publicData } = client.storage.from(ADMIN_MEDIA_BUCKET).getPublicUrl(data.path);
    return {
      path: data.path,
      publicUrl: publicData.publicUrl,
      originalBytes: source.size,
      compressedBytes: blob.size,
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}
