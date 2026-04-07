import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserVideos } from '../services/userService';
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

const UserVideosPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const response = await getUserVideos(username);
        // API returns data in format: { data: { videos: [...] }, pagination: {...} }
        const videosArray = response.data?.videos || [];
        setVideos(Array.isArray(videosArray) ? videosArray : []);
      } catch (err) {
        setError('Failed to fetch user videos. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to={`/users/${username}`} className="text-indigo-600 hover:text-indigo-800">
            ← Back to profile
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Videos by {username}</h1>
        <div className="text-center">Loading videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to={`/users/${username}`} className="text-indigo-600 hover:text-indigo-800">
            ← Back to profile
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Videos by {username}</h1>
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to={`/users/${username}`} className="text-indigo-600 hover:text-indigo-800">
          ← Back to profile
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Videos by {username}</h1>

      {videos.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">This user hasn't uploaded any videos yet.</p>
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

export default UserVideosPage;
