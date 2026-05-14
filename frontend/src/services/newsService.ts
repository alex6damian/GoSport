import api from '../api/axiosConfig';

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  summary: string;
  sport: string;
  source: string;
  source_url: string;
  image_url: string;
  author: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

// GET /api/v1/news
export const getNews = async (page = 1, limit = 20, sport?: string) => {
  const response = await api.get('/news', { params: { page, limit, sport } });
  return response.data;
};

// GET /api/v1/news/:id
export const getNewsArticle = async (id: number) => {
  const response = await api.get(`/news/${id}`);
  return response.data;
};

// GET /api/v1/news/sport/:sport
export const getNewsBySport = async (sport: string, page = 1, limit = 20) => {
  const response = await api.get(`/news/sport/${sport}`, { params: { page, limit } });
  return response.data;
};

// GET /api/v1/search/news
export const searchNews = async (q: string, limit = 20) => {
  const response = await api.get('/search/news', { params: { q, limit } });
  return response.data;
};
