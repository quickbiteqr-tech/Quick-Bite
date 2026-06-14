// src/lib/utils/image-compressor.ts

import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file in the browser.
 * @param file The image file to compress.
 * @returns A promise that resolves with the compressed file.
 */
export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,          // Max file size in MB
    maxWidthOrHeight: 1024,  // Max width or height
    useWebWorker: true,    // Use web worker for better performance
  };

  try {
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressedFile = await imageCompression(file, options);
    
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Re-throw the error to be handled by the calling function
    throw new Error('Could not compress the selected image.');
  }
};