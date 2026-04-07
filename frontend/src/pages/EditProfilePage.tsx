import React, { useState, useEffect } from 'react';
import { getMyProfile, updateUserProfile } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import homeBg from '../assets/home.png';

interface UserProfile {
  username: string;
  email: string;
  avatar: string;
}

const EditProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ username: '', email: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    setError(null);
    setSubmitting(true);

    try {
      await updateUserProfile(profile);
      navigate('/me');
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
        setError(axiosError.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
        <div style={{ position: 'relative', zIndex: 1, color: '#ffffff' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      backgroundImage: `url(${homeBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      overflowY: 'auto',
      padding: '2rem 0',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '460px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        margin: '1rem',
      }}>
        <h2 style={{ textAlign: 'center', color: '#ffffff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1.5rem' }}>
          Edit Your Profile
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={profile.username}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: submitting ? 0.6 : 1,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: submitting ? 0.6 : 1,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
              Avatar URL
            </label>
            <input
              type="text"
              name="avatar"
              value={profile.avatar}
              onChange={handleChange}
              disabled={submitting}
              placeholder="https://example.com/avatar.jpg"
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: submitting ? 0.6 : 1,
              }}
            />
            {profile.avatar && (
              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <img
                  src={profile.avatar}
                  alt="Avatar preview"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(0, 141, 223, 0.6)',
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '0.6rem 0.85rem',
              background: 'rgba(248,113,113,0.15)',
              borderLeft: '4px solid #f87171',
              color: '#fca5a5',
              fontSize: '0.8rem',
              borderRadius: '4px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: '#e63946',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(230,57,70,0.35)',
                transition: 'all 0.2s ease',
                opacity: submitting ? 0.7 : 1,
              }}
              onMouseEnter={e => !submitting && (e.currentTarget.style.background = '#c1121f', e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => !submitting && (e.currentTarget.style.background = '#e63946', e.currentTarget.style.transform = 'translateY(0)')}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/me')}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: submitting ? 0.7 : 1,
              }}
              onMouseEnter={e => !submitting && (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => !submitting && (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;