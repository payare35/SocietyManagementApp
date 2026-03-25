import { storage } from '../config/firebase.js';
import { sendError } from '../utils/responseFormatter.js';

/**
 * GET /api/files/view?path=uploads/...
 *
 * Streams the raw file bytes from GCS through this authenticated endpoint.
 * The GCS path — and any GCS-signed URL — is never sent to the browser,
 * so copied links are worthless outside an authenticated session.
 *
 * Headers set deliberately:
 *   Content-Disposition: inline  → browser renders in-page (modal), not download
 *   Cache-Control: no-store      → browser must not cache; prevents replay via DevTools
 */
export const viewFile = async (req, res, next) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) return sendError(res, 400, 'path query parameter is required');

    const file = storage.bucket().file(filePath);

    // Verify the file exists before streaming
    const [exists] = await file.exists();
    if (!exists) return sendError(res, 404, 'File not found');

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });

    file
      .createReadStream()
      .on('error', next)
      .pipe(res);
  } catch (err) {
    next(err);
  }
};
