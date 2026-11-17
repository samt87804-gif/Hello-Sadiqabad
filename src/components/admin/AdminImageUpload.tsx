import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { uploadAdminImage, type AdminImagePurpose } from '../../lib/adminMedia';
import { usePermissions } from '../../lib/permissions';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export function AdminImageUpload({
  purpose,
  onUploaded,
  disabled = false,
  label = 'Upload image',
  onUploadingChange,
}: {
  purpose: AdminImagePurpose;
  onUploaded: (url: string) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const { isSuperAdmin, hasAnyPermission } = usePermissions();
  const canUpload = isSuperAdmin || hasAnyPermission(
    'settings.manage',
    'business.create',
    'business.publish',
    'ads.review',
    'announcements.manage'
  );

  if (!canUpload) return null;

  const selectFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const uploaded = await uploadAdminImage(file, purpose);
      await onUploaded(uploaded.publicUrl);
      const saved = uploaded.originalBytes > 0
        ? Math.max(0, Math.round((1 - uploaded.compressedBytes / uploaded.originalBytes) * 100))
        : 0;
      showToast('Image WebP mein compress ho kar upload ho gayi (' + saved + '% size kam).', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Image upload nahi ho saki.', 'error');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only" disabled={disabled || uploading}
        onChange={(event) => { void selectFile(event.target.files?.[0]); }} />
      <Button type="button" size="sm" variant="outline" disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()} leftIcon={<UploadCloud className="w-4 h-4" />}>
        {uploading ? 'Compressing & uploading…' : label}
      </Button>
      <span className="text-[10px] text-on-surface-variant">JPG / PNG / WebP / AVIF · auto WebP compression</span>
    </div>
  );
}
