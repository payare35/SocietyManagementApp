/**
 * Netlify Serverless Function — Express API proxy
 *
 * Netlify redirects  /api/*  →  /.netlify/functions/api/:splat
 * event.path contains the ORIGINAL request path (/api/auth/login, etc.)
 * so no path transformation is needed — Express routes match as-is.
 */
import serverless from 'serverless-http';
import app from '../../server/src/app.js';

// Binary content types must be base64-encoded inside the Lambda response
// JSON envelope — otherwise image/PDF bytes get corrupted in transit.
const serverlessHandler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream', 'audio/*', 'video/*'],
});

export const handler = async (event, context) => {
  return serverlessHandler(event, context);
};
