import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const users = {
  getProfile: () => api.get('/users/profile'),
  getAll: () => api.get('/users'),
};

export const publishers = {
  create: (data) => api.post('/publishers', data),
  getAll: () => api.get('/publishers'),
  getOne: (id) => api.get(`/publishers/${id}`),
  update: (id, data) => api.put(`/publishers/${id}`, data),
  delete: (id) => api.delete(`/publishers/${id}`),
};

export const books = {
  create: (data) => api.post('/books', data),
  getAll: (search) => api.get('/books', { params: { search } }),
  getOne: (id) => api.get(`/books/${id}`),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export const lists = {
  create: (data) => api.post('/lists', data),
  getAll: () => api.get('/lists'),
  getPublic: () => api.get('/lists/public'),
  getOne: (id) => api.get(`/lists/${id}`),
  update: (id, data) => api.put(`/lists/${id}`, data),
  delete: (id) => api.delete(`/lists/${id}`),
  addBook: (listId, data) => api.post(`/lists/${listId}/books`, data),
  getBooks: (listId) => api.get(`/lists/${listId}/books`),
  updateBook: (bookId, data) => api.put(`/lists/books/${bookId}`, data),
  deleteBook: (bookId) => api.delete(`/lists/books/${bookId}`),
  merge: (data) => api.post('/lists/merge', data),
};

export const orders = {
  updateTracking: (data) => api.post('/orders/tracking', data),
  getAdminView: (filters) => api.get('/orders/admin-view', { params: filters }),
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getAll: () => api.get('/orders'),
  getOne: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
};

export default api;
