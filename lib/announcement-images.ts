import { supabase } from '@/lib/supabase';

export const ANNOUNCEMENT_IMAGE_BUCKET = 'announcement-images';
export const ANNOUNCEMENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Returns a plain-language problem with the file, or null when it is fine. */
export function validateAnnouncementImage(file: File): string | null {
  if (!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG or WebP photo.';
  }
  // The original may be large (phone photos); it is shrunk before upload, so
  // only reject files that are unreasonably big to even open.
  if (file.size > 25 * 1024 * 1024) {
    return 'That photo is too large. Please choose one under 25 MB.';
  }
  return null;
}

/** Shrinks big photos so the noticeboard stays fast on slow connections. */
async function shrink(file: File, maxEdge = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** Uploads a photo to the announcement bucket and returns its public URL. */
export async function uploadAnnouncementImage(file: File): Promise<string> {
  const blob = await shrink(file);
  if (blob.size > ANNOUNCEMENT_IMAGE_MAX_BYTES) {
    throw new Error('That photo is still over 5 MB after resizing. Please choose a smaller one.');
  }

  const type = blob.type || file.type;
  const path = `${crypto.randomUUID()}.${EXTENSIONS[type] ?? 'jpg'}`;

  const { error } = await supabase.storage
    .from(ANNOUNCEMENT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: type, cacheControl: '31536000' });
  if (error) throw error;

  return supabase.storage.from(ANNOUNCEMENT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Deletes a previously uploaded photo. Best effort: failures are only logged. */
export async function removeAnnouncementImage(url: string | null | undefined) {
  if (!url) return;
  const marker = `/${ANNOUNCEMENT_IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const path = decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
  const { error } = await supabase.storage.from(ANNOUNCEMENT_IMAGE_BUCKET).remove([path]);
  if (error) console.error('Could not remove announcement image:', error);
}
