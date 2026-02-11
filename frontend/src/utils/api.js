
// Ensure no trailing slash
const rawUrl = import.meta.env.VITE_API_URL || 'https://turfics-web.onrender.com';
export const API_URL = rawUrl.replace(/\/$/, '');
