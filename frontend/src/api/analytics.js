import api from './axios';

export const getUserAnalytics = async (userId) => {
  const response = await api.get(`/api/analytics/user/${userId}`);
  return response.data;
};
