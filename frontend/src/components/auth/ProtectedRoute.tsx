import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('token');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
