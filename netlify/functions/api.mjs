/**
 * Netlify Serverless Function — Express API proxy
 *
 * Netlify redirects  /api/*  →  /.netlify/functions/api/:splat
 * The Lambda event.path arrives as  /:splat  (prefix stripped).
 * We restore the /api prefix so every Express route resolves correctly
 * without any changes to the route definitions.
 */
import serverless from 'serverless-http';
import app from '../../server/src/app.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Restore the /api prefix stripped by the Netlify redirect rule
  event.path = `/api${event.path}`;
  return serverlessHandler(event, context);
};
