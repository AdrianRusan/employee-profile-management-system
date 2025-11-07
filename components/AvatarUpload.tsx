'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/Provider';
import { toast } from 'sonner';
import { Upload, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string | null;
  userName: string;
  onUploadSuccess?: (url: string) => void;
}

/**
 * AvatarUpload component with drag-and-drop support
 * Allows users to upload and preview avatar images
 */
export function AvatarUpload({
  userId,
  currentAvatar,
  userName,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const utils = trpc.useUtils();

  // Keep latest onUploadSuccess callback to avoid stale closure in mutation
  const onUploadSuccessRef = useRef(onUploadSuccess);
  useEffect(() => {
    onUploadSuccessRef.current = onUploadSuccess;
  }, [onUploadSuccess]);

  const updateAvatarMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      toast.success('Avatar updated successfully');
      utils.user.getById.invalidate({ id: userId });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update avatar');
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type. Please upload an image.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        // Validate that the result is a string (data URL)
        if (typeof reader.result === 'string') {
          setPreview(reader.result);
        } else {
          toast.error('Failed to read image file');
        }
      };
      reader.readAsDataURL(file);

      // Upload file
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();

        // Update user avatar in database
        await updateAvatarMutation.mutateAsync({
          id: userId,
          data: { avatar: data.url },
        });

        // Notify parent with the actual uploaded URL (never pass a null/undefined value)
        if (typeof data?.url === 'string' && data.url) {
          onUploadSuccess?.(data.url);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
        setPreview(currentAvatar || null);
      } finally {
        setIsUploading(false);
      }
    },
    [userId, currentAvatar, updateAvatarMutation, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      await updateAvatarMutation.mutateAsync({
        id: userId,
        data: { avatar: null },
      });
      setPreview(null);
      toast.success('Avatar removed successfully');
    } catch {
      toast.error('Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const initials = (userName || '')
    .split(' ')
    .filter((part) => part.trim() !== '')
    .map((part) => part.trim()[0]!)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview || undefined} alt={userName} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm text-primary font-medium">Drop image here...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium">
                  Drag & drop an image, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP or GIF (max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {preview && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove Avatar
          </Button>
        </div>
      )}
    </div>
  );
}
