import { storage } from '../config/firebase.js';
import sharp from 'sharp';

// Max dimension (px) — images wider/taller than this are scaled down
const MAX_DIMENSION = 2048;

/**
 * Compress an image buffer using sharp.
 * - JPEG / JPG → 80% quality, progressive encoding
 * - PNG        → level-8 compression, adaptive filtering
 * - Other      → returned unchanged
 */
const compressImage = async (file) => {
  const { mimetype, buffer } = file;

  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    const compressed = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();
    return { ...file, buffer: compressed };
  }

  if (mimetype === 'image/png') {
    const compressed = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 8, adaptiveFiltering: true })
      .toBuffer();
    return { ...file, buffer: compressed };
  }

  // PDFs and other types pass through unchanged
  return file;
};

export const uploadFile = async (file, folder = 'general') => {
  if (!process.env.FIREBASE_STORAGE_BUCKET) {
    throw new Error('File upload is not available: Firebase Storage is not configured.');
  }

  // Compress images before uploading
  const processedFile = await compressImage(file);

  const bucket = storage.bucket();
  const timestamp = Date.now();
  const safeName = processedFile.originalname.replace(/\s+/g, '_');
  const destination = `uploads/${folder}/${timestamp}_${safeName}`;
  const fileRef = bucket.file(destination);

  await fileRef.save(processedFile.buffer, {
    metadata: { contentType: processedFile.mimetype },
  });
  // File stays private — no makePublic() call.
  // Access is granted via the authenticated GET /api/files/view endpoint.

  return { filePath: destination, fileName: processedFile.originalname };
};
