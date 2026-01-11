
// centralized API configuration

const LIVE_BACKEND = "https://turfics-web.onrender.com";
const LOCAL_BACKEND = "http://localhost:5000";

let API_URL = LOCAL_BACKEND;

// Smart Detection Logic
// If we are in a browser environment
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Check if we are running locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        API_URL = LOCAL_BACKEND;
        console.log("Detected Localhost: Using Local Backend ->", API_URL);
    } else {
        // We are on Vercel/Netlify/Internet
        API_URL = LIVE_BACKEND;
        console.log("Detected Production: Using Live Backend ->", API_URL);
    }
}

export default API_URL;
