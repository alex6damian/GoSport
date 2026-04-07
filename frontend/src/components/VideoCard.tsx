import React from 'react';
import { Link } from 'react-router-dom';

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

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <Link to={`/videos/${video.id}`} className="block relative overflow-hidden bg-gray-900 aspect-video">
        <img
          src={video.thumbnail || 'https://via.placeholder.com/320x180?text=Video'}
          alt={video.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </span>
        )}
      </Link>

      <div className="p-4">
        <Link 
          to={`/videos/${video.id}`}
          className="text-sm font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2"
        >
          {video.title}
        </Link>

        <Link
          to={`/users/${video.user.username}`}
          className="text-xs text-gray-600 hover:text-indigo-600 block mt-2"
        >
          {video.user.username}
        </Link>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>{formatViews(video.views_count)} views</span>
          <span>{formatDate(video.created_at)}</span>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          {video.sport && (
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              {video.sport}
            </span>
          )}
          <span className="text-xs text-gray-500">❤️ {video.likes_count}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
