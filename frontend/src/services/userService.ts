import api from '../api/axiosConfig';

// GET /api/v1/users/me
export const getMyProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// PUT /api/v1/users/me
export const updateUserProfile = async (profileData: any) => {
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

// GET /api/v1/users/subscriptions
export const getSubscriptions = async () => {
  const response = await api.get('/users/subscriptions');
  return response.data;
};

// POST /api/v1/users/:userId/subscribe
export const subscribeToUser = async (userId: number) => {
  const response = await api.post(`/users/${userId}/subscribe`);
  return response.data;
};

// DELETE /api/v1/users/:userId/unsubscribe
export const unsubscribeFromUser = async (userId: number) => {
  const response = await api.delete(`/users/${userId}/unsubscribe`);
  return response.data;
};

// GET /api/v1/users/:userId/subscription
export const checkSubscription = async (userId: number) => {
  const response = await api.get(`/users/${userId}/subscription`);
  return response.data;
};

// GET /api/v1/users/:userId/subscribers
export const getSubscribers = async (userId: number) => {
  const response = await api.get(`/users/${userId}/subscribers`);
  return response.data;
};
