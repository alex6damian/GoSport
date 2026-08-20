import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavButtons from '../components/NavButtons';
import { getUserVideos } from '../services/userService';
import homeBg from '../assets/home.png';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views_count: number;
  likes_count: number;
  user: {
    id: number;
    username: string;
  };
  created_at: string;
  sport: string;
}

const timeAgo = (dateStr: string) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
};

const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    zIndex: 9999,
    overflowY: 'auto',
    fontFamily: "'Inter', sans-serif",
  }}>
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
      pointerEvents: 'none',
    }} />
    <NavButtons />
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '5rem 2rem 3rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1100px' }}>
        {children}
      </div>
    </div>
  </div>
);

const UserVideosPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const response = await getUserVideos(username);
        // API returns data in format: { data: { videos: [...] }, pagination: {...} }
        const videosArray = response.data?.videos || [];
        setVideos(Array.isArray(videosArray) ? videosArray : []);
      } catch (err) {
        setError('Failed to fetch user videos. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [username]);

  return (
    <PageShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Videos by <span style={{ color: '#00d4ff' }}>{username}</span>
          </h1>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '4rem' }}>Loading videos...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#f87171', padding: '4rem' }}>{error}</div>
      ) : videos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
        }}>
          This user hasn't uploaded any videos yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
          {videos.map(video => (
            <div key={video.id} onClick={() => navigate(`/videos/${video.id}`)}
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'relative', width: '100%', height: '130px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                <img src={video.thumbnail || `https://i.pravatar.cc/300?u=${video.id}`} alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {video.duration > 0 && (
                  <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
              <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h3 style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {video.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>
                    {video.views_count} views · {timeAgo(video.created_at)}
                  </span>
                  {video.sport && (
                    <span style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.62rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}>{video.sport}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default UserVideosPage;
