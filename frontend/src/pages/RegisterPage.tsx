import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import homeBg from '../assets/home.png';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(username, email, password);
      navigate('/login', { state: { message: 'Your account has been created successfully. Please check your email to verify your account.' } });
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please make sure the backend is running.');
        return;
      }
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        return;
      }
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      backgroundImage: `url(${homeBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '360px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        margin: '1rem',
      }}>
        <h2 style={{ textAlign: 'center', color: '#ffffff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1rem' }}>
          Create an Account
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
              Username
            </label>
            <input
              type="text" required value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
              Email Address
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
              Password
            </label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            style={{ width: '100%', padding: '0.6rem', background: '#e63946', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.25rem', boxShadow: '0 4px 20px rgba(230,57,70,0.35)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c1121f'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#e63946'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Sign Up
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem', marginBottom: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#008ddf', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;