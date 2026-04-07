import React, { useState, useEffect } from 'react';
import { getWatchHistory } from '../services/userService';
import VideoCard from '../components/VideoCard';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views_count: number;
  likes_count: number;
  user: {
    id: number;
    username: string;
  };
  created_at: string;
  sport: string;
}

const HistoryPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getWatchHistory();
        setVideos(response.data || []);
      } catch (err) {
        setError('Failed to fetch watch history. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Watch History</h1>
        <div className="text-center">Loading your watch history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Watch History</h1>
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Watch History</h1>

      {videos.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">You haven't watched any videos yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
