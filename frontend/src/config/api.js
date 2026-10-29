/**
 * Centralized API configuration for the React frontend.
 *
 * ─── Development ─────────────────────────────────────────────────────────────
 * Set VITE_API_URL in .env or .env.local:
 *   VITE_API_URL=http://localhost:5000/api
 *
 * ─── Production ──────────────────────────────────────────────────────────────
 * VITE_API_URL comes from frontend/.env.production, or from a build environment
 * variable set in your hosting provider (e.g. AWS Amplify) or CI:
 *   VITE_API_URL=https://<your-backend-host>/api
 *
 * Vite replaces import.meta.env.VITE_API_URL at build time, so no runtime
 * environment injection is needed for a static site.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    '[GoLoco] VITE_API_URL is not defined. ' +
    'Add it to your .env file for local development, or set it as a ' +
    'build environment variable in your hosting configuration.'
  );
}

export default API_BASE_URL;

