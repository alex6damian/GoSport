import api from '../api/axiosConfig';
import type { AxiosProgressEvent } from 'axios';

export interface Video {
  id: number;
  user_id: number;
  title: string;
  description: string;
  sport: string;
  minio_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  hls_path: string;
  thumbnail: string;
  duration: number;
  status: string;
  views_count: number;
  likes_count: number;
  favorites_count: number;
  tags: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    avatar: string;
  };
}

export const getFeed = (page: number = 1, limit: number = 12) => {
  return api.get('/feed', {
    params: { page, limit },
  });
};

export const searchVideos = (q: string, sport?: string, limit: number = 20) => {
  return api.get('/search/videos', {
    params: { q, sport, limit },
  });
};

export const uploadVideo = (
  file: File,
  title: string,
  description: string,
  sport: string,
  tags: string,
  thumbnail?: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('sport', sport);
  formData.append('tags', tags);
  if (thumbnail) {
    formData.append('thumbnail', thumbnail);
  }

  return api.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// GET /api/v1/videos/:videoId
export const getVideoDetails = async (videoId: number) => {
  const response = await api.get(`/videos/${videoId}`);
  return response.data.data; // Returns { video, video_url, thumbnail_url }
};

// POST /api/v1/videos/:videoId/like - Toggle like (POST for both like and unlike)
export const likeVideo = async (videoId: number) => {
  const response = await api.post(`/videos/${videoId}/like`);
  return response.data;
};

// POST /api/v1/videos/:videoId/like - Toggle like (Use POST to unlike as well)
export const unlikeVideo = async (videoId: number) => {
  const response = await api.post(`/videos/${videoId}/like`);
  return response.data;
};

// GET /api/v1/videos/:videoId/like - Check if video is liked
export const checkIfVideoLiked = async (videoId: number) => {
  const response = await api.get(`/videos/${videoId}/like`);
  return response.data;  // Returns { success, is_liked }
};

// POST /api/v1/videos/:videoId/view
export const recordVideoView = async (videoId: number) => {
  const response = await api.post(`/videos/${videoId}/view`);
  return response.data;
};

// GET /api/v1/videos/:videoId/comments
export const getVideoComments = async (videoId: number, page = 1, limit = 30) => {
  const response = await api.get(`/videos/${videoId}/comments`, { params: { page, limit } });
  return response.data;
};

// POST /api/v1/videos/:videoId/comments
export const addComment = async (videoId: number, content: string) => {
  const response = await api.post(`/videos/${videoId}/comments`, { content });
  return response.data;
};

// DELETE /api/v1/comments/:commentId
export const deleteComment = async (commentId: number) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};

// GET /api/v1/comments/:commentId/replies
export const getCommentReplies = async (commentId: number) => {
  const response = await api.get(`/comments/${commentId}/replies`);
  return response.data;
};

// POST /api/v1/comments/:commentId/replies
export const addReply = async (commentId: number, content: string) => {
  const response = await api.post(`/comments/${commentId}/replies`, { content });
  return response.data;
};

// PUT /api/v1/comments/:commentId
export const updateComment = async (commentId: number, content: string) => {
  const response = await api.put(`/comments/${commentId}`, { content });
  return response.data;
};

