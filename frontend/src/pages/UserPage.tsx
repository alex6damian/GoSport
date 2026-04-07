import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile } from '../services/userService';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  verified: boolean;
  role: string;
  avatar: string;
  videos_count: number;
  subscribers_count: number;
  created_at: string;
}

const UserPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const response = await getUserProfile(username);
        setProfile(response.data || response);
      } catch (err) {
        setError('Failed to fetch user profile. User may not exist.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <img
            src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.id}`}
            alt={`${profile.username}'s avatar`}
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500"
          />

          <div className="flex-grow text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
            <h1 className="text-4xl font-bold text-gray-800">{profile.username}</h1>
            {profile.verified && (
              <div className="mt-1.5 inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800" title="Verified Account">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                🔵
              </div>
            )}
          </div>

            {profile.role === 'admin' && (
              <p className="text-sm text-purple-600 font-semibold mt-2">👑 Admin</p>
            )}

            <div className="flex flex-col md:flex-row justify-center md:justify-start space-y-4 md:space-y-0 md:space-x-8 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">Videos: {profile.videos_count}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">Subscribers: {profile.subscribers_count}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Member since: {new Date(profile.created_at).toLocaleDateString()}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Link 
                to={`/users/${profile.username}/videos`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center"
              >
                View Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
