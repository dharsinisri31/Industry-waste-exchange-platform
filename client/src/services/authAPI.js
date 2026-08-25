import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // Required for HTTP-only cookies
});

// Request Interceptor: Attach access token from local storage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent refresh on 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we have not retried yet and the request is not login/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid: logout user
        localStorage.removeItem('accessToken');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const loginAPI = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const registerIndustryAPI = async (data) => {
  const response = await API.post('/auth/register-industry', data);
  return response.data;
};

export const registerAdminAPI = async (data) => {
  const response = await API.post('/auth/register-admin', data);
  return response.data;
};

export const logoutAPI = async () => {
  const response = await API.post('/auth/logout');
  localStorage.removeItem('accessToken');
  return response.data;
};

export const getMeAPI = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export default API;
