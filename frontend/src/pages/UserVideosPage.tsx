import React from 'react';
import { useParams } from 'react-router-dom';

const UserVideosPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <div><h1>Videos by {username}</h1><p>List of videos coming soon...</p></div>;
};

export default UserVideosPage;
