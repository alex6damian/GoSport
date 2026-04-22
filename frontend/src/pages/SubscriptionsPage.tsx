import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSubscriptions } from '../services/userService';

interface User {
  id: number;
  username: string;
  avatar: string;
  subscribers_count: number;
}

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const response = await getSubscriptions();
        setSubscriptions(response.data || []);
      } catch (err) {
        setError('Failed to fetch subscriptions. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Subscriptions</h1>
        <div className="text-center">Loading your subscriptions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Subscriptions</h1>
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">You haven't subscribed to anyone yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subscriptions.map((user) => (
            <Link
              key={user.id}
              to={`/users/${user.username}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="text-center">
                <img
                  src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                  alt={`${user.username}'s avatar`}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-indigo-500"
                />
                <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">{user.username}</h2>
                <p className="text-sm text-gray-600">{user.subscribers_count} subscribers</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
