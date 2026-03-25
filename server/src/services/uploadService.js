import { storage } from '../config/firebase.js';

const MAX_DIMENSION = 2048;

// Lazy-load sharp — it uses native binaries that may not be available in all
// environments (e.g. Netlify Lambda with wrong architecture). If it fails to
// load we skip compression and upload the original file unmodified.
let sharpFn = null;
let sharpResolved = false;

const getSharp = async () => {
  if (sharpResolved) return sharpFn;
  try {
    sharpFn = (await import('sharp')).default;
  } catch {
    sharpFn = null;
  }
  sharpResolved = true;
  return sharpFn;
};

/**
 * Compress an image using sharp (if available).
 * - JPEG/JPG → 80 % quality, progressive, mozjpeg
 * - PNG      → level-8 compression, adaptive filtering
 * - Other    → returned unchanged
 */
const compressImage = async (file) => {
  const sharp = await getSharp();
  if (!sharp) return file; // compression unavailable — pass through

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

  return file; // PDFs and other types pass through unchanged
};

export const uploadFile = async (file, folder = 'general') => {
  if (!process.env.FIREBASE_STORAGE_BUCKET) {
    throw new Error('File upload is not available: Firebase Storage is not configured.');
  }

  const processedFile = await compressImage(file);

  const bucket = storage.bucket();
  const timestamp = Date.now();
  const safeName = processedFile.originalname.replace(/\s+/g, '_');
  const destination = `uploads/${folder}/${timestamp}_${safeName}`;
  const fileRef = bucket.file(destination);

  await fileRef.save(processedFile.buffer, {
    metadata: { contentType: processedFile.mimetype },
  });

  return { filePath: destination, fileName: processedFile.originalname };
};
