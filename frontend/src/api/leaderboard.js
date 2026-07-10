import api from './axios';

export const getGlobalLeaderboard = async (limit = 20) => {
  const response = await api.get(`/api/leaderboard/global?limit=${limit}`);
  return response.data;
};

export const getRegionalLeaderboard = async (region, limit = 20) => {
  const response = await api.get(`/api/leaderboard/region/${region.toLowerCase()}?limit=${limit}`);
  return response.data;
};

export const getUserLeaderboardStatus = async (userId) => {
  const response = await api.get(`/api/leaderboard/user/${userId}`);
  return response.data;
};

export const incrementScore = async (points, idempotencyKey) => {
  const response = await api.post('/api/scores/increment', 
    { points }, 
    {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    }
  );
  return response.data;
};

export const decrementScore = async (points, idempotencyKey) => {
  const response = await api.post('/api/scores/decrement', 
    { points }, 
    {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    }
  );
  return response.data;
};
