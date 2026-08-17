import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bmo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const requestOtpApi = (phone) => API.post('/auth/request-otp', { phone });
export const verifyOtpApi = (data) => API.post('/auth/verify-otp', data);
export const adminLoginApi = (credentials) => API.post('/auth/admin-login', credentials);
export const getMeApi = () => API.get('/auth/me');

// Provider APIs
export const registerRestaurantApi = (data) => API.post('/provider/register-restaurant', data);
export const getMyRestaurantApi = () => API.get('/provider/my-restaurant');
export const saveMenuItemApi = (data) => API.post('/provider/menu-items', data);
export const getMenuByRestaurantApi = (id) => API.get(`/provider/menu-items/${id}`);
export const deleteMenuItemApi = (id) => API.delete(`/provider/menu-items/${id}`);
export const getKdsOrdersApi = (restaurantId) => API.get(`/provider/kds/${restaurantId}`);
export const updateOrderStatusApi = (orderId, status) => API.patch(`/provider/orders/${orderId}/status`, { status });
export const createWalkInBookingApi = (data) => API.post('/provider/walkin-booking', data);

// Customer APIs
export const getRestaurantsApi = (params) => API.get('/customer/restaurants', { params });
export const getRestaurantByIdApi = (id) => API.get(`/customer/restaurants/${id}`);
export const createBookingApi = (data) => API.post('/customer/bookings', data);
export const getMyHistoryApi = () => API.get('/customer/my-history');
export const addReviewApi = (data) => API.post('/customer/reviews', data);

// Payment APIs (Cashfree Sandbox)
export const createCashfreeOrderApi = (data) => API.post('/payments/create-order', data);
export const verifyCashfreePaymentApi = (orderId) => API.get(`/payments/verify/${orderId}`);

export default API;

