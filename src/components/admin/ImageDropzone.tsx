'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { UploadCloud, X, ImageIcon } from 'lucide-react';

interface ImageDropzoneProps {
  onFileSelect: (file: File) => void;
  currentPreview?: string | null;
  onClear?: () => void;
  isUploading?: boolean;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
}

export default function ImageDropzone({
  onFileSelect,
  currentPreview = null,
  onClear,
  isUploading = false,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxSizeMB = 5,
}: ImageDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPreview);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setError(null);

      if (rejections.length > 0) {
        const rejection = rejections[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload a PNG, JPG, or WebP image.');
        } else {
          setError(rejection.errors[0]?.message || 'File rejected.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onFileSelect(file);
      }
    },
    [onFileSelect, maxSizeMB]
  );

  const handleClear = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onClear?.();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      {previewUrl ? (
        /* ── Preview State ── */
        <div className="relative group rounded-xl border-2 border-slate-200 bg-slate-50 overflow-hidden">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="w-full h-48 object-cover"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-red-500"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
                Uploading…
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Dropzone State ── */
        <div
          {...getRootProps()}
          className={`
            flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed
            px-6 py-10 text-center transition-all duration-200
            ${isDragActive
              ? 'border-emerald-400 bg-emerald-50/60 scale-[1.02]'
              : 'border-slate-300 bg-slate-50/80 hover:border-emerald-300 hover:bg-slate-50'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
              isDragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isDragActive ? (
              <ImageIcon className="h-6 w-6" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>
          <p className="text-sm font-medium text-slate-700">
            {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            or <span className="font-semibold text-emerald-600">browse files</span>
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            PNG, JPG, WebP up to {maxSizeMB}MB
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
