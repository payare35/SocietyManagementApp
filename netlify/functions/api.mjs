/**
 * Netlify Serverless Function — Express API proxy
 *
 * Netlify redirects  /api/*  →  /.netlify/functions/api/:splat
 * event.path contains the ORIGINAL request path (/api/auth/login, etc.)
 * so no path transformation is needed — Express routes match as-is.
 */
import serverless from 'serverless-http';
import app from '../../server/src/app.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  return serverlessHandler(event, context);
};
