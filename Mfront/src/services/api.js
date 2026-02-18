import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401
api.interceptors.response.use((response) => {
  // If the API returns the token in headers (common in Devise-JWT), update it
  if (response.headers.authorization) {
    const token = response.headers.authorization.split(' ')[1];
    localStorage.setItem('token', token);
  }
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

// ... existing axios setup ...

export const transactionAPI = {
  getAll: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
  create: async (formData) => {
    const response = await api.post('/transactions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  createManual: async (data) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.patch(`/transactions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/transactions/${id}`);
    return id;
  }
};

export const categoryAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/categories/${id}`);
    return id;
  }
};

export const ocrAPI = {
  preview: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/ocr/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Export uploadReceipt for backward compatibility
export const uploadReceipt = (formData) => transactionAPI.create(formData);

export default api;
