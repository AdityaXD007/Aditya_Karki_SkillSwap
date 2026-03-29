import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL;

// Compute the backend base (without /api) for media URL rewriting
let BACKEND_BASE_URL: string;

const hostname = window.location.hostname;
if (!API_BASE_URL) {
    // If using VS Code tunnels (e.g. k2ntmrxd-5173.inc1.devtunnels.ms),
    // the backend will be on k2ntmrxd-8000.inc1.devtunnels.ms
    if (hostname.includes('devtunnels.ms') || hostname.includes('preview.app.github.dev')) {
        const tunnelProtocol = window.location.protocol;
        const backendHostname = hostname.replace('5173', '8000');
        API_BASE_URL = `${tunnelProtocol}//${backendHostname}/api`;
        BACKEND_BASE_URL = `${tunnelProtocol}//${backendHostname}`;
        console.log("Detected Dev Tunnel. Initializing backend at:", API_BASE_URL);
    } else {
        API_BASE_URL = `http://${hostname}:8000/api`;
        BACKEND_BASE_URL = `http://${hostname}:8000`;
    }
} else {
    // If VITE_API_URL is set, derive BACKEND_BASE_URL from it (strip trailing /api)
    BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
}

/**
 * Converts a backend media URL to the correct protocol/host for the current environment.
 * Fixes Mixed Content errors when the frontend is on HTTPS (e.g. VS Code devtunnels)
 * but media URLs still point to http://localhost:8000/...
 */
export const getMediaUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    // Already a non-localhost absolute URL — return as-is
    if (url.startsWith('http') && !url.includes('localhost')) return url;
    // Relative path or localhost URL — rewrite host to BACKEND_BASE_URL
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return `${BACKEND_BASE_URL}${path}`;
};

/**
 * Recursively walks through any object/array and rewrites all
 * http://localhost:8000 string values to use BACKEND_BASE_URL.
 * Applied to every API response so no component needs manual fixing.
 */
const rewriteMediaUrls = (data: any): any => {
    if (typeof data === 'string') {
        if (data.includes('localhost:8000') || data.includes('localhost:')) {
            return getMediaUrl(data);
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(rewriteMediaUrls);
    }
    if (data !== null && typeof data === 'object') {
        const result: any = {};
        for (const key of Object.keys(data)) {
            result[key] = rewriteMediaUrls(data[key]);
        }
        return result;
    }
    return data;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        // Rewrite all localhost media URLs in every API response globally
        // This fixes Mixed Content errors on ALL pages without touching each component
        response.data = rewriteMediaUrls(response.data);
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if this is a login or register attempt
            const isAuthEndpoint = error.config?.url?.includes('/auth/login/') ||
                error.config?.url?.includes('/auth/register/');

            if (!isAuthEndpoint) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
