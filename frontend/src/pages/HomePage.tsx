import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      
      <div className="relative z-10 flex flex-col items-center text-center p-8">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
          Welcome to GoSport
        </h1>
        <p className="text-lg md:text-xl font-light mb-8 max-w-2xl" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
          Your ultimate destination for sports content. Dive into a world of exclusive videos, news, and community engagement.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login">
            <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105">
              Sign In
            </button>
          </Link>
          <Link to="/register">
            <button className="w-full sm:w-auto bg-transparent hover:bg-white hover:text-gray-900 text-white font-bold py-3 px-8 rounded-lg border-2 border-white text-lg transition duration-300 ease-in-out transform hover:scale-105">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
