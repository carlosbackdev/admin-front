import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Export image server URL for use in components
export const IMAGE_SERVER_URL = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001';

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response || error.message);
        return Promise.reject(error);
    }
);

export const productsApi = {
    getAll: () => api.get('/products/admin/all'),
    getById: (id) => api.get(`/products/admin/${id}`),
    create: (data) => api.post('/products/admin/save', data),
    update: (data) => api.put('/products/admin/update', data),
    delete: (id) => api.delete(`/products/admin/admin/delete/${id}`),
    import: (url, categoryId) => api.post('/products/admin/import', { url, categoryId }),
    scrapeUpdate: () => api.post('/products/admin/scripting-update'),
    getImages: (productId) => api.post(`/products-images/get-image/${productId}`),
    getPrimaryImage: (productId) => api.post(`/products-images/get-image/home/${productId}`),
};

export const categoriesApi = {
    getAll: () => api.get('/categories/get/all'),
    create: (data) => api.post('/categories/admin/save', data),
    delete: (id) => api.delete(`/categories/admin/delete/${id}`),
};

export const ordersApi = {
    getByStatus: (status) => api.get(`/orders/admin/status/${status}`),
    getById: (id) => api.get(`/orders/admin/${id}`),
    updateStatus: (id, status, notes) => api.patch(`/orders/admin/${id}/status`, { status, notes }),
    delete: (id) => api.delete(`/orders/admin/${id}`),
};

export const trackingApi = {
    getUpdate: (orderId) => api.post(`/track/track-udpate/${orderId}`),
    getOrder: (orderId) => api.get(`/track/track-order/${orderId}`),
    scrape: (trackingNumber, orderId) => api.post('/track/admin/scrape', { trackingNumber, orderId }),
};

export const configApi = {
    getProfitMargin: () => api.get('/config/profit-margin'),
    updateProfitMargin: (percentage) => api.put(`/config/profit-margin?percentage=${percentage}`),
};

export const bestProductsApi = {
    getAll: () => api.get('/best/get-products'),
    add: (id) => api.post(`/best/admin/set-products/${id}`),
    remove: (id) => api.post(`/best/admin/delete/${id}`),
};

export default api;
