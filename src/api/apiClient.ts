import axios from 'axios';
import { SessionStore } from '../store/sessionStore';

const BASE_URL = 'https://gcdev.oxymoney.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  config => {
    // Token attach karo
    const token = SessionStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // client-id sirf tab lagao jab pehle se set nahi hai
    if (!config.headers['client-id']) {
      const clientId = SessionStore.getClientId() || 'SENEXTCLT000194';
      config.headers['client-id'] = clientId;
    }

    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('client-id going:', config.headers['client-id']);
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('API Error:', status, error?.config?.url);
    console.error('Error Response:', JSON.stringify(data));
    return Promise.reject(error);
  }
);

export default apiClient;
