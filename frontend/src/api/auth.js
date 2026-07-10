import api from './axios';

export const register = async ({ username, email, password, region }) => {
  const response = await api.post('/api/auth/register', { username, email, password, region });
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};
