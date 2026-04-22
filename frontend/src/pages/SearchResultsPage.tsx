import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchVideos, type Video } from '../services/videoService';
import { getFeed } from '../services/videoService';
import { AxiosError } from 'axios';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [videosResults, setVideosResults] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [errorVideos, setErrorVideos] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'users'>('videos');

  useEffect(() => {
    if (query && activeTab === 'videos') {
      fetchSearchResults();
    }
  }, [query, activeTab]);

  const fetchSearchResults = async () => {
    setLoadingVideos(true);
    setErrorVideos(null);
    try {
      const response = await searchVideos(query, undefined, 50);
      setVideosResults(response.data?.data?.hits || []);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setErrorVideos(axiosError.response?.data?.error || 'Failed to search videos');
      console.error('Search error:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const tabs = [
    { id: 'videos', label: 'Videos', icon: '🎬' },
    { id: 'users', label: 'Users', icon: '👥' },
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
              onClick={() => setActiveTab(tab.id as 'videos' | 'users')}
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {errorVideos}
              </div>
            )}

            {!loadingVideos && videosResults.length === 0 && !errorVideos && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No videos found for "{query}"</p>
              </div>
            )}

            {videosResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videosResults.map((video) => (
                  <Link
                    key={video.id}
                    to={`/videos/${video.id}`}
                    className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="relative pb-56 bg-gray-200">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-3xl">🎬</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {video.user?.username || 'Unknown User'}
                      </p>
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

        {/* Users Tab - Coming Soon */}
        {activeTab === 'users' && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">User search coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
