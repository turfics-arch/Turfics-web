
// centralized API configuration
// Explicitly pointing to your live backend as fallback
const LIVE_BACKEND = "https://turfics-backend.onrender.com";
const LOCAL_BACKEND = "http://localhost:5000";

// Priority:
// 1. Environment Variable (VITE_API_URL)
// 2. Hardcoded Live URL (so it works even if env var is missing on Vercel)
// 3. Localhost (for development)

export const API_URL = import.meta.env.VITE_API_URL || LIVE_BACKEND;

console.log("Using API URL:", API_URL);

export default API_URL;
