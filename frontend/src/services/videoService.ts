import api from '../api/axiosConfig';

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

export const uploadVideo = (
  file: File,
  title: string,
  description: string,
  sport: string,
  tags: string,
  thumbnail?: File,
  onUploadProgress?: (progressEvent: ProgressEvent) => void
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
