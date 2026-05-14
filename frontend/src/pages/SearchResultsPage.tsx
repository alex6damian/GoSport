import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchVideos, type Video } from '../services/videoService';
import { searchNews, type NewsArticle } from '../services/newsService';
import { AxiosError } from 'axios';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'videos' | 'news'>('videos');

  const [videosResults, setVideosResults] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [errorVideos, setErrorVideos] = useState<string | null>(null);

  const [newsResults, setNewsResults] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [errorNews, setErrorNews] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    if (activeTab === 'videos') fetchVideos();
    else fetchNewsResults();
  }, [query, activeTab]);

  const fetchVideos = async () => {
    setLoadingVideos(true);
    setErrorVideos(null);
    try {
      const response = await searchVideos(query, undefined, 50);
      setVideosResults(response.data?.data?.hits || []);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setErrorVideos(axiosError.response?.data?.error || 'Failed to search videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchNewsResults = async () => {
    setLoadingNews(true);
    setErrorNews(null);
    try {
      const response = await searchNews(query, 50);
      setNewsResults(response.data?.hits || response.data || []);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setErrorNews(axiosError.response?.data?.error || 'Failed to search news');
    } finally {
      setLoadingNews(false);
    }
  };

  const tabs = [
    { id: 'videos', label: 'Videos', icon: '🎬' },
    { id: 'news', label: 'News', icon: '📰' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600 mb-8">
          Results for: <span className="font-semibold text-indigo-600">"{query}"</span>
        </p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'videos' | 'news')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div>
            {loadingVideos && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {errorVideos && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errorVideos}</div>
            )}
            {!loadingVideos && videosResults.length === 0 && !errorVideos && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No videos found for "{query}"</p>
              </div>
            )}
            {videosResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videosResults.map((video) => (
                  <Link key={video.id} to={`/videos/${video.id}`}
                    className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                    <div className="relative pb-56 bg-gray-200">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-3xl">🎬</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{video.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">{video.user?.username || 'Unknown User'}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>👁️ {video.views_count || 0}</span>
                        <span>❤️ {video.likes_count || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div>
            {loadingNews && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {errorNews && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errorNews}</div>
            )}
            {!loadingNews && newsResults.length === 0 && !errorNews && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No news found for "{query}"</p>
              </div>
            )}
            {newsResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsResults.map((article) => (
                  <Link key={article.id} to={`/news/${article.id}`}
                    className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                    {article.image_url && (
                      <div className="h-44 overflow-hidden">
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      {article.sport && (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-2 capitalize">{article.sport}</span>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{article.title}</h3>
                      {article.summary && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{article.summary}</p>
                      )}
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{article.source}</span>
                        <span>{new Date(article.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
