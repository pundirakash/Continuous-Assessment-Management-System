import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
});

// Request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or unauthorized
            localStorage.removeItem('token');
            // Dispatch event to show the nice Bootstrap modal
            window.dispatchEvent(new Event('sessionExpired'));
        }
        return Promise.reject(error);
    }
);

export default api;
