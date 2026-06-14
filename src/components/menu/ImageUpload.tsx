'use client';

import { useState, useCallback } from 'react';
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from '@/lib/utils/image-compressor'; // 1. Import the new function
import { X, UploadCloud, Loader2, AlertTriangle } from "lucide-react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ImageUploadProps {
  onChange: (url?: string) => void;
  value?: string;
  /** Defaults to menu item uploads */
  uploadEndpoint?: keyof OurFileRouter;
}

export default function ImageUpload({ onChange, value, uploadEndpoint = "menuItemImage" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { startUpload } = useUploadThing(
    uploadEndpoint,
    {
      onClientUploadComplete: (res:{url:string}[]) => {
        setIsUploading(false);
        setUploadError(null);
        onChange(res?.[0].url);
        setPreview(null);
      },
      onUploadError: (error: Error) => {
        setIsUploading(false);
        setPreview(null);
        setUploadError("Upload failed. Please try again.");
        console.error("Upload failed:", error);
      },
    }
  );

  // 2. Simplify the onDrop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      setPreview(URL.createObjectURL(file));
      setIsUploading(true);

      try {
        // Use the utility function to compress the image
        const compressedFile = await compressImage(file);
        
        // Upload the compressed file
        await startUpload([compressedFile]);

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Compression failed.';
        setUploadError(errorMessage);
        setIsUploading(false);
        setPreview(null);
      }
    }
  }, [startUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false,
  });

  // The rest of the component's JSX remains unchanged...
  if (value) {
    return (
      <div className="relative h-48 w-full md:w-96">
        <Image
          fill
          src={value}
          alt="Uploaded Image"
          className="rounded-lg object-cover"
        />
        <button
          onClick={() => onChange()}
          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md transition-colors hover:bg-red-600"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (isUploading || preview) {
    return (
      <div className="relative h-48 w-full md:w-96">
        {preview && (
          <Image
            fill
            src={preview}
            alt="Image Preview"
            className="rounded-lg object-cover"
            onLoad={() => {
              if (preview) URL.revokeObjectURL(preview);
            }}
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        flex h-48 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors md:w-96
        ${isDragActive ? 'border-[#6DBE45] bg-[#6DBE45]/10' : 'border-slate-200 hover:border-[#6DBE45]/50'}
        ${uploadError ? 'border-red-400 bg-red-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="text-slate-500">
        {uploadError ? (
          <div className="text-red-600">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm font-semibold">{uploadError}</p>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto mb-2 h-8 w-8 text-[#6DBE45]/80" />
            <p className="text-sm text-slate-600">{isDragActive ? 'Drop the image here' : 'Click or drag to upload'}</p>
          </>
        )}
      </div>
    </div>
  );
}