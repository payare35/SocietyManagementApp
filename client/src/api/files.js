import api from './axios';

/**
 * Fetch a private GCS file as a Blob through the authenticated backend proxy.
 * The real GCS URL is never exposed to the browser.
 *
 * @param {string} filePath - GCS path, e.g. "uploads/receipts/1234_receipt.pdf"
 * @returns {Promise<Blob>}
 */
export const fetchFileAsBlob = (filePath) =>
  api
    .get('/files/view', { params: { path: filePath }, responseType: 'blob' })
    .then((r) => r.data);
