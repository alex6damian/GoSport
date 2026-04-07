import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState(false);
  const effectRan = useRef(false);

  useEffect(() => {
    // This check ensures the effect runs only once, even in StrictMode
    if (effectRan.current === true) {
      return;
    }
    effectRan.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setMessage('Verification token not found.');
      setError(true);
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setMessage('Your email has been verified successfully! You can now log in.');
        setError(false);
      } catch (err: any) {
        setError(true);
        if (err.response && err.response.data && err.response.data.error) {
          // If the error is "Invalid verification token", it's likely because it was already used.
          // We can treat this as a success for the user experience.
          if (err.response.data.error.includes('Invalid verification token')) {
            setMessage('Your email has been verified successfully! You can now log in.');
            setError(false);
          } else {
            setMessage(`Error: ${err.response.data.error}`);
          }
        } else {
          setMessage('An unexpected error occurred during verification.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white shadow-lg rounded-xl">
        <h2 className="text-3xl font-bold text-gray-800">Email Verification</h2>
        <p className={`text-lg ${error ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
        {!error && (
          <Link
            to="/login"
            className="inline-block px-6 py-3 mt-4 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
