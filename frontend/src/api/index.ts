import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': localStorage.getItem('language') || 'ar',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = localStorage.getItem('language') || 'ar';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  registerCollector: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register/collector', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),
};

export const users = {
  getProfile: () => api.get<ApiResponse<User>>('/users/profile'),

  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<User>>('/users', { params }),
};

export const publishers = {
  create: (data: { name: string; hall_number?: string; booth_number?: string }) =>
    api.post<ApiResponse<Publisher>>('/publishers', data),

  getAll: (params?: PaginationParams & { search?: string }) =>
    api.get<PaginatedResponse<Publisher>>('/publishers', { params }),

  getOne: (id: number) => api.get<ApiResponse<Publisher>>(`/publishers/${id}`),

  update: (id: number, data: Partial<Publisher>) =>
    api.put<ApiResponse<Publisher>>(`/publishers/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<void>>(`/publishers/${id}`),
};

export const books = {
  create: (data: CreateBookDto) => api.post<ApiResponse<Book>>('/books', data),

  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Book>>('/books', { params }),

  search: (params: { q: string; limit?: number }) =>
    api.get<PaginatedResponse<BookWithRank>>('/books/search', { params }),

  getOne: (id: number) => api.get<ApiResponse<Book>>(`/books/${id}`),

  update: (id: number, data: Partial<Book>) =>
    api.put<ApiResponse<Book>>(`/books/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<void>>(`/books/${id}`),

  restore: (id: number) => api.post<ApiResponse<Book>>(`/books/${id}/restore`),
};

export const lists = {
  create: (data: CreateListDto) => api.post<ApiResponse<List>>('/lists', data),

  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<List>>('/lists', { params }),

  getPublic: (params?: PaginationParams) =>
    api.get<PaginatedResponse<List>>('/lists/public', { params }),

  getByShareToken: (token: string) =>
    api.get<ApiResponse<ListWithBooks>>(`/lists/shared/${token}`),

  getOne: (id: number) => api.get<ApiResponse<ListWithBooks>>(`/lists/${id}`),

  update: (id: number, data: Partial<List>) =>
    api.put<ApiResponse<List>>(`/lists/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<void>>(`/lists/${id}`),

  addBook: (listId: number, data: AddBookToListDto) =>
    api.post<ApiResponse<ListBook>>(`/lists/${listId}/books`, data),

  getBooks: (listId: number) =>
    api.get<ApiResponse<ListBookWithDetails[]>>(`/lists/${listId}/books`),

  updateBook: (bookId: number, data: Partial<ListBook>) =>
    api.put<ApiResponse<ListBook>>(`/lists/books/${bookId}`, data),

  removeBook: (bookId: number) =>
    api.delete<ApiResponse<void>>(`/lists/books/${bookId}`),

  merge: (data: { sourceId: number; targetId: number }) =>
    api.post<ApiResponse<void>>('/lists/merge', data),

  inviteCollector: (listId: number, data: { collectorId: number }) =>
    api.post<ApiResponse<void>>(`/lists/${listId}/invite`, data),

  respondToInvitation: (listId: number, accept: boolean) =>
    api.post<ApiResponse<void>>(`/lists/${listId}/invitation/respond`, { accept }),

  assignCollector: (listId: number, data: { collectorId: number }) =>
    api.post<ApiResponse<void>>(`/lists/${listId}/assign`, data),

  unassignCollector: (listId: number) =>
    api.delete<ApiResponse<void>>(`/lists/${listId}/assign`),

  assignCollectorToBook: (listId: number, bookId: number, data: { collectorId: number }) =>
    api.post<ApiResponse<void>>(`/lists/${listId}/books/${bookId}/assign`, data),

  unassignCollectorFromBook: (listId: number, bookId: number) =>
    api.delete<ApiResponse<void>>(`/lists/${listId}/books/${bookId}/assign`),

  claimBook: (listId: number, bookId: number) =>
    api.post<ApiResponse<ListBook>>(`/lists/${listId}/books/${bookId}/claim`),
};

export const orders = {
  create: (data: CreateOrderDto) =>
    api.post<ApiResponse<Order>>('/orders', data),

  getMyOrders: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Order>>('/orders/my-orders', { params }),

  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }),

  getOne: (id: number) => api.get<ApiResponse<OrderWithDetails>>(`/orders/${id}`),

  update: (id: number, data: Partial<Order>) =>
    api.put<ApiResponse<Order>>(`/orders/${id}`, data),

  updateTracking: (data: UpdateTrackingDto) =>
    api.post<ApiResponse<void>>('/orders/tracking', data),

  getAdminView: (params?: {
    hall?: string;
    booth?: string;
    priority?: number;
    status?: string;
  }) => api.get<ApiResponse<AdminViewItem[]>>('/orders/admin-view', { params }),

  assignCollector: (orderId: number, collectorId: number) =>
    api.post<ApiResponse<void>>(`/orders/${orderId}/assign`, { collectorId }),

  unassignCollector: (orderId: number) =>
    api.delete<ApiResponse<void>>(`/orders/${orderId}/assign`),
};

export const notifications = {
  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  markAsRead: (id: number) =>
    api.post<ApiResponse<void>>(`/notifications/${id}/read`),

  markAllAsRead: () => api.post<ApiResponse<void>>('/notifications/read-all'),

  delete: (id: number) => api.delete<ApiResponse<void>>(`/notifications/${id}`),
};

export default api;

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'collector' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface Publisher {
  id: number;
  name: string;
  hall_number: string | null;
  booth_number: string | null;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  author_name?: string;
  publisher_id: number | null;
  publisher_name?: string;
  isbn: string | null;
  original_price: number | null;
  category?: string;
  cover_image?: string | null;
  hall_number?: string;
  booth_number?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BookWithRank extends Book {
  rank: number;
}

export interface CreateBookDto {
  title: string;
  author?: string;
  publisher_id?: number;
  isbn?: string;
  original_price?: number;
  category?: string;
}

export interface List {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  visibility: 'public' | 'private';
  share_token: string | null;
  assigned_collector_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ListWithBooks extends List {
  books?: ListBookWithDetails[];
}

export interface CreateListDto {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface ListBook {
  id: number;
  list_id: number;
  book_id: number;
  status: ListBookStatus;
  priority: number;
  notes: string | null;
  assigned_collector_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ListBookWithDetails extends ListBook {
  title: string;
  author_name: string;
  publisher_name: string | null;
  isbn: string | null;
  original_price: number | null;
  hall_number: string | null;
  booth_number: string | null;
  category?: string;
  actual_price?: number | null;
  discount_amount?: number | null;
  search_status?: SearchStatus | null;
}

export type ListBookStatus =
  | 'pending'
  | 'claimed'
  | 'in_progress'
  | 'sourced'
  | 'shipped'
  | 'delivered'
  | 'not_found'
  | 'cancelled';

export type SearchStatus = 'searching' | 'found' | 'purchased';

export interface AddBookToListDto {
  book_id: number;
  status?: ListBookStatus;
  priority?: number;
  notes?: string;
}

export interface Order {
  id: number;
  user_id: number;
  assigned_collector_id: number | null;
  visibility: 'public' | 'private';
  total_price: number | null;
  shipping_status: ShippingStatus;
  shipping_notes: string | null;
  shipping_tracking_serial: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrderWithDetails extends Order {
  user_name?: string;
  collector_name?: string;
  books?: OrderBookItem[];
}

export interface OrderBookItem {
  id: number;
  list_book_id: number;
  book_title: string;
  book_author: string;
  original_price: number | null;
  actual_price: number | null;
  discount_amount: number | null;
}

export type ShippingStatus = 'pending' | 'shipped' | 'delivered';

export interface CreateOrderDto {
  user_id: number;
  list_book_ids: number[];
}

export interface UpdateTrackingDto {
  list_book_id: number;
  actual_price?: number;
  discount_amount?: number;
  search_status?: SearchStatus;
}

export interface AdminViewItem {
  list_book_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  book_id: number;
  title: string;
  author_name: string;
  publisher_name: string | null;
  hall_number: string | null;
  booth_number: string | null;
  original_price: number | null;
  actual_price: number | null;
  discount_amount: number | null;
  priority: number;
  status: ListBookStatus;
  search_status: SearchStatus | null;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}
