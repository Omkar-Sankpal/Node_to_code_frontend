// Central API configuration — reads from Vite env variables at build time.
// In development, set VITE_API_BASE_URL in .env.development
// In production, set VITE_API_BASE_URL in .env.production or as a build-time env var.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://node-to-code-backend.onrender.com'

export default API_BASE_URL
