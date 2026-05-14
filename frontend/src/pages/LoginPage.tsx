import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, forgotPassword } from '../services/authService';
import homeBg from '../assets/home.png';
import ReactDOM from 'react-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.data.token);
      const from = (location.state as any)?.from?.pathname || '/browse';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      console.error(err);
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
          Hop into your account!
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
              autoComplete="current-password"
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
            Sign In
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <button
            onClick={() => setShowForgotPassword(true)}
            style={{ background: 'none', border: 'none', color: '#008ddf', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', padding: 0 }}
          >
            Forgot your password?
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem', marginBottom: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#008ddf', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>



        {successMessage && (
          <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(34,197,94,0.15)', borderLeft: '4px solid #22c55e', color: '#86efac', fontSize: '0.8rem', marginTop: '0.75rem', borderRadius: '4px' }}>
            {successMessage}
          </div>
        )}

        {showForgotPassword && ReactDOM.createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000,
          }}>
            <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} onSuccess={() => {
              setShowForgotPassword(false);
              setSuccessMessage('Password reset link has been sent to your email.');
            }} />
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      onSuccess();
    } catch (err: any) {
      console.error('Forgot password failed:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please make sure the backend is running.');
        return;
      }
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
          Reset Password
        </h2>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
        >
          ×
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
            Email Address
          </label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', opacity: loading ? 0.6 : 1 }}
          />
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.6rem', background: '#e63946', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem', boxShadow: '0 4px 20px rgba(230,57,70,0.35)', transition: 'all 0.2s ease', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;