import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
    const hostname = window.location.hostname;
    // If using VS Code tunnels (e.g. 5173-xxx.devtunnels.ms), 
    // the backend will likely be on 8000-xxx.devtunnels.ms
    if (hostname.includes('devtunnels.ms') || hostname.includes('preview.app.github.dev')) {
        const tunnelProtocol = window.location.protocol;
        const backendHostname = hostname.replace('5173', '8000');
        API_BASE_URL = `${tunnelProtocol}//${backendHostname}/api`;
        console.log("Detected Dev Tunnel. Initializing backend at:", API_BASE_URL);
    } else {
        API_BASE_URL = `http://${hostname}:8000/api`;
    }
}

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
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
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
