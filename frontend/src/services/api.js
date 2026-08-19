import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bmo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const requestOtpApi = (phone) => API.post('/auth/request-otp', { phone });
export const verifyOtpApi = (data) => API.post('/auth/verify-otp', data);
export const getMeApi = () => API.get('/auth/me');
export const adminLoginApi = (data) => API.post('/auth/admin-login', data);

// Customer APIs
export const getRestaurantsApi = (params) => API.get('/customer/restaurants', { params });
export const getRestaurantDetailsApi = (id) => API.get(`/customer/restaurants/${id}`);
export const getRestaurantByIdApi = (id) => API.get(`/customer/restaurants/${id}`);
export const createBookingApi = (data) => API.post('/customer/bookings', data);
export const getMyHistoryApi = () => API.get('/customer/my-history');
export const addReviewApi = (data) => API.post('/customer/reviews', data);

// Provider APIs
export const registerProviderApi = (data) => API.post('/provider/register', data);
export const registerRestaurantApi = (data) => API.post('/provider/register', data);
export const getMyRestaurantApi = () => API.get('/provider/my-restaurant');
export const saveMenuItemApi = (data) => API.post('/provider/menu-item', data);
export const addMenuItemApi = (data) => API.post('/provider/menu-item', data);
export const getMenuByRestaurantApi = (restaurantId) => API.get(`/customer/restaurants/${restaurantId}`);
export const deleteMenuItemApi = (id) => API.delete(`/provider/menu-item/${id}`);
export const getKdsFeedApi = () => API.get('/provider/kds');
export const getKdsOrdersApi = () => API.get('/provider/kds');
export const updateOrderStatusApi = (orderId, status) => API.patch(`/provider/orders/${orderId}/status`, { status });
export const createWalkInOrderApi = (data) => API.post('/provider/walkin-order', data);
export const createWalkInBookingApi = (data) => API.post('/provider/walkin-order', data);

// Payment APIs
export const createCashfreeOrderApi = (data) => API.post('/payments/create-order', data);
export const verifyCashfreePaymentApi = (cfOrderId) => API.get(`/payments/verify/${cfOrderId}`);

// Admin APIs
export const getAdminMetricsApi = () => API.get('/admin/metrics');
export const getAdminRestaurantsApi = () => API.get('/admin/restaurants');
export const updateRestaurantStatusApi = (id, data) => API.patch(`/admin/restaurants/${id}/status`, data);
export const getAdminReviewsApi = () => API.get('/admin/reviews');
export const deleteAdminReviewApi = (id) => API.delete(`/admin/reviews/${id}`);
export const getAdminUsersApi = () => API.get('/admin/users');

// Gemini AI Assistant API
export const getAiRecommendationApi = (data) => API.post('/ai/recommend', data);
