import React from 'react';
import { useParams } from 'react-router-dom';

const UserPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <div><h1>Profile of {username}</h1><p>Public profile details coming soon...</p></div>;
};

export default UserPage;
