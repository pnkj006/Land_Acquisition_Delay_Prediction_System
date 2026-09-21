import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network or timeout errors
    if (!error.response) {
      console.error('Network or timeout error:', error);
      return Promise.reject(new Error('Network error or timeout. Please check your connection.'));
    }

    const { status, config } = error.response;
    const isAuthRoute = config?.url?.includes('/auth/login');

    if (status === 401 && !isAuthRoute) {
      // Don't redirect if we're already on login page or requesting login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      // Don't spam alerts for background fetches; just log it and reject
      console.warn('Forbidden: You do not have permission to access this resource.', config?.url);
    } else if (status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
