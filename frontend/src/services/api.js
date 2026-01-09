const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) console.warn('VITE_API_URL is missing!');

/**
 * Common fetch wrapper to handle Base URL and Headers
 */
const api = {
    get: async (endpoint, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers
        });
        return handleResponse(res);
    },

    post: async (endpoint, body, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        return handleResponse(res);
    },

    put: async (endpoint, body, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        return handleResponse(res);
    },

    delete: async (endpoint, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        return handleResponse(res);
    }
};

async function handleResponse(res) {
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.message || 'Error en la petición');
        error.data = data;
        throw error;
    }
    return data;
}

export default api;
