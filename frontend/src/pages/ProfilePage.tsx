import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyProfile } from '../services/userService';

// Define a type for the user profile data
interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string;
  videos_count: number;
  subscribers_count: number;
  created_at: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getMyProfile();
        setProfile(response.data); // The user data is nested under response.data
      } catch (err) {
        setError('Failed to fetch profile. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center mt-10">Could not load profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
        <img
          src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.id}`}
          alt={`${profile.username}'s avatar`}
          className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500"
        />
        <div className="flex-grow text-center md:text-left">
          <h1 className="text-4xl font-bold text-gray-800">{profile.username}</h1>
          <p className="text-lg text-gray-500">{profile.email}</p>
          <div className="flex justify-center md:justify-start space-x-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.videos_count}</p>
              <p className="text-sm text-gray-500">Videos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.subscribers_count}</p>
              <p className="text-sm text-gray-500">Subscribers</p>
            </div>
          </div>
          <p className="text-md text-gray-500 capitalize mt-4">
            Role: <span className="font-semibold">{profile.role}</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Member since: {new Date(profile.created_at).toLocaleDateString()}
          </p>
          <div className="mt-6">
            <Link to="/edit-profile" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
