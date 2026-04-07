import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import homeBg from '../assets/home.png';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Missing token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Your password has been reset successfully.' } });
      }, 2000);
    } catch (err: any) {
      console.error('Reset password failed:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please make sure the backend is running.');
        return;
      }
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        return;
      }
      setError('Failed to reset password. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
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
          Reset Your Password
        </h2>

        {error && !token && (
          <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(248,113,113,0.15)', borderLeft: '4px solid #f87171', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '0.75rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {token ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
                New Password
              </label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', opacity: loading ? 0.6 : 1 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
                Confirm Password
              </label>
              <input
                type="password" required value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', opacity: loading ? 0.6 : 1 }}
              />
            </div>

            {successMessage && (
                <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(34,197,94,0.15)', borderLeft: '4px solid #22c55e', color: '#86efac', fontSize: '0.8rem', marginBottom: '0.75rem', borderRadius: '4px' }}>
                    {successMessage}
                </div>
                )}

            {error && (
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(248,113,113,0.15)', borderLeft: '4px solid #f87171', color: '#fca5a5', fontSize: '0.8rem', marginBottom: 0, borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.6rem', background: '#e63946', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem', boxShadow: '0 4px 20px rgba(230,57,70,0.35)', transition: 'all 0.2s ease', opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = '#c1121f', e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = '#e63946', e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textAlign: 'center' }}>
            Invalid reset link.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
