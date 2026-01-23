
// Ensure no trailing slash
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const API_URL = rawUrl.replace(/\/$/, '');
