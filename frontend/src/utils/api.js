
// Ensure no trailing slash
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = rawUrl.replace(/\/$/, '');
