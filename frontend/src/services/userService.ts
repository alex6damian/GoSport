import api from '../api/axiosConfig';

// GET /api/v1/users/me
export const getMyProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// PUT /api/v1/users/me
export const updateMyProfile = async (profileData: any) => {
  const response = await api.put('/users/me', profileData);
  return response.data;
};

// GET /api/v1/users/me/history
export const getWatchHistory = async () => {
  const response = await api.get('/users/me/history');
  return response.data;
};

// GET /api/v1/users/me/favorites
export const getFavorites = async () => {
  const response = await api.get('/users/me/favorites');
  return response.data;
};

// GET /api/v1/users/:username
export const getUserProfile = async (username: string) => {
  const response = await api.get(`/users/${username}`);
  return response.data;
};

// GET /api/v1/users/:username/videos
export const getUserVideos = async (username: string) => {
  const response = await api.get(`/users/${username}/videos`);
  return response.data;
};
