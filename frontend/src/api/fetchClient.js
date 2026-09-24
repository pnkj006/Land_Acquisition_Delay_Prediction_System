import { fetchMeFromToken } from '../context/AuthContext';

export async function fetchClient(endpoint, { body, ...customConfig } = {}) {
  const token = localStorage.getItem('token');

  const isFormData = body instanceof FormData;

  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const url = `/api/v1${endpoint}`;
  const isAuthRoute = url.includes('/auth/login');

  let response;

  try {
    response = await fetch(url, config);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    console.error('Network or timeout error:', error);
    throw error;
  }

  if (response.status === 401 && !isAuthRoute) {
    if (window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    console.warn(
      'Forbidden: You do not have permission to access this resource.',
      url
    );

    fetchMeFromToken();
  }

  if (response.status >= 500) {
    console.error('Server error:', response.status);
  }

  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  const err = new Error('Failed to fetch');
  err.status = response.status;

  try {
    err.info = await response.json();
  } catch (e) {
    err.info = await response.text();
  }

  throw err;
}