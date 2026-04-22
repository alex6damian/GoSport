import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile, subscribeToUser, unsubscribeFromUser, checkSubscription } from '../services/userService';
import homeBg from '../assets/home.png';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  verified: boolean;
  role: string;
  avatar: string;
  videos_count: number;
  subscribers_count: number;
  created_at: string;
}

const UserPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfileAndCheckSubscription = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const response = await getUserProfile(username);
        const profileData = response.data || response;
        setProfile(profileData);

        // Check subscription status if user is logged in
        if (token) {
          try {
            const subResponse = await checkSubscription(profileData.id);
            setIsSubscribed(subResponse?.is_subscribed || false);
          } catch (err) {
            console.error('Failed to check subscription status:', err);
          }
        }
      } catch (err) {
        setError('Failed to fetch user profile. User may not exist.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndCheckSubscription();
  }, [username, token]);

  const handleSubscribe = async () => {
    if (!profile) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromUser(profile.id);
        setIsSubscribed(false);
        setProfile({
          ...profile,
          subscribers_count: Math.max(0, profile.subscribers_count - 1),
        });
      } else {
        await subscribeToUser(profile.id);
        setIsSubscribed(true);
        setProfile({
          ...profile,
          subscribers_count: profile.subscribers_count + 1,
        });
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${homeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, color: '#ffffff' }}>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${homeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, color: '#f87171' }}>{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${homeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, color: '#ffffff' }}>User not found</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundImage: `url(${homeBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '2rem 1rem',
      overflowY: 'auto',
    }}>
      {/* Dark overlay — gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '600px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Back to Browse */}
<Link
  to="/browse"
  style={{
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '50%',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '1.1rem',
    transition: 'all 0.2s ease',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
    e.currentTarget.style.color = '#ffffff';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
  }}
>
  ←
</Link>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.id}`}
            alt={`${profile.username}'s avatar`}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #008ddf',
              margin: '0 auto 1.5rem',
              display: 'block',
              boxShadow: '0 4px 12px rgba(0, 141, 223, 0.4)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {profile.username}
            </h1>
            {profile.verified && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#86efac',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                ✓
              </span>
            )}
          </div>

          {profile.role === 'admin' && (
            <p style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600, margin: '0.5rem 0 0' }}>👑 Admin</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#00d4ff', margin: '0 0 0.4rem' }}>
              {profile.videos_count}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Videos</p>
          </div>
          <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#00d4ff', margin: '0 0 0.4rem' }}>
              {profile.subscribers_count}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Subscribers</p>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 2rem' }}>
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {token && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                background: isSubscribed ? 'rgba(248, 113, 113, 0.2)' : '#008ddf',
                border: isSubscribed ? '1px solid rgba(248, 113, 113, 0.3)' : 'none',
                color: isSubscribed ? '#fca5a5' : '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: subscribing ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                opacity: subscribing ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (!subscribing) {
                  if (isSubscribed) {
                    e.currentTarget.style.background = 'rgba(248, 113, 113, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
                  } else {
                    e.currentTarget.style.background = '#0071b8';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 141, 223, 0.4)';
                  }
                }
              }}
              onMouseLeave={e => {
                if (!subscribing) {
                  if (isSubscribed) {
                    e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)';
                  } else {
                    e.currentTarget.style.background = '#008ddf';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }
              }}
            >
              {subscribing ? 'Loading...' : (isSubscribed ? '✓ Subscribed' : 'Subscribe')}
            </button>
          )}

          <Link
            to={`/users/${profile.username}/videos`}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.7rem 1rem',
              background: 'rgba(230, 57, 70, 0.2)',
              border: '1px solid rgba(230, 57, 70, 0.3)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(230, 57, 70, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(230, 57, 70, 0.5)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(230, 57, 70, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(230, 57, 70, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(230, 57, 70, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Videos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
