import React, { useState, useEffect } from 'react';
import { getMyProfile, updateUserProfile } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

interface UserProfile {
  username: string;
  email: string;
  avatar: string;
}

const EditProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ username: '', email: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getMyProfile();
        setProfile(response.data);
      } catch (err) {
        setError('Failed to fetch profile. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state on new submission

    try {
      await updateUserProfile(profile);
      navigate('/me'); // Redirect on success
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
        // Set the error message from the backend response
        setError(axiosError.response.data.error);
      } else {
        // Fallback error message
        setError('An unexpected error occurred. Please try again.');
      }
      console.error(err); // Log the full error for debugging
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 font-bold mb-2">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={profile.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="avatar" className="block text-gray-700 font-bold mb-2">Avatar URL</label>
          <input
            type="text"
            id="avatar"
            name="avatar"
            value={profile.avatar}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        {/* Display backend error here */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;