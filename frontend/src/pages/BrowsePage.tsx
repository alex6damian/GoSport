import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import homeBg from '../assets/home.png';
import { getMyProfile, updateUserProfile } from '../services/userService';
import { getFeed, uploadVideo, type Video } from '../services/videoService';
import { AxiosError } from 'axios';

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

const BrowsePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'news' | 'profile' | 'upload'>('videos');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editFormSubmitting, setEditFormSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: '', email: '', avatar: '' });
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadThumbnail, setUploadThumbnail] = useState<File | null>(null);
  const [uploadThumbnailPreview, setUploadThumbnailPreview] = useState<string | null>(null);
  const [uploadIsDragging, setUploadIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    sport: '',
    tags: '',
  });
  
  const navigate = useNavigate();

  const menuItems = [
    { id: 'videos', label: 'Videos', icon: '🎬' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'upload', label: 'Upload', icon: '📤' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  // Profile fetch function
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await getMyProfile();
      setProfile(response.data);
      setEditFormData({
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar,
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Videos fetch function
  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const response = await getFeed(1, 12);
      setVideos(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && !profile) {
      fetchProfile();
    } else if (activeTab === 'videos' && videos.length === 0) {
      fetchVideos();
    }
  }, [activeTab]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setEditFormSubmitting(true);

    try {
      await updateUserProfile(editFormData);
      // Refetch profile
      await fetchProfile();
      setIsEditingProfile(false);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      if (axiosError.response?.data?.error) {
        setEditFormError(axiosError.response.data.error);
      } else {
        setEditFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setEditFormSubmitting(false);
    }
  };

  const handleMenuClick = (id: string) => {
    if (id === 'videos' || id === 'news' || id === 'profile' || id === 'upload') {
      setActiveTab(id as 'videos' | 'news' | 'profile' | 'upload');
    }
  };

  // Upload handlers
  const handleUploadDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadIsDragging(true);
  };

  const handleUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadIsDragging(false);
  };

  const handleUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type.startsWith('video/')) {
        setUploadFile(selectedFile);
        setUploadError(null);
      } else {
        setUploadError('Please select a valid video file');
      }
    }
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
      setUploadError(null);
    }
  };

  const handleUploadThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const thumbnailFile = files[0];
      if (thumbnailFile.type.startsWith('image/')) {
        setUploadThumbnail(thumbnailFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadThumbnailPreview(reader.result as string);
        };
        reader.readAsDataURL(thumbnailFile);
        setUploadError(null);
      } else {
        setUploadError('Please select a valid image file for thumbnail');
      }
    }
  };

  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUploadFormData({
      ...uploadFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadFile) {
      setUploadError('Please select a video file');
      return;
    }

    if (!uploadFormData.title.trim()) {
      setUploadError('Title is required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadVideo(
        uploadFile,
        uploadFormData.title,
        uploadFormData.description,
        uploadFormData.sport,
        uploadFormData.tags,
        uploadThumbnail || undefined,
        (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      setUploadSuccess(true);
      setUploadFile(null);
      setUploadThumbnail(null);
      setUploadThumbnailPreview(null);
      setUploadFormData({ title: '', description: '', sport: '', tags: '' });
      setUploadProgress(0);

      // Reload videos after upload
      setTimeout(() => {
        setUploadSuccess(false);
        setActiveTab('videos');
        fetchVideos();
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      if (axiosError.response?.data?.error) {
        setUploadError(axiosError.response.data.error);
      } else if (axiosError.message) {
        setUploadError(axiosError.message);
      } else {
        setUploadError('Failed to upload video. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

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
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Dark overlay — gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Sidebar — left */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '220px',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0 2rem',
        gap: '0.5rem',
        zIndex: 10,
        overflowY: 'auto',
      }}>
        {/* GOSPORT Logo */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '1.5rem',
          marginBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-1px',
          }}>
            <span style={{ color: '#008ddf' }}>GO</span><span style={{ color: '#e63946' }}>SPORT</span>
          </h1>
        </div>

        {/* Menu items */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.9rem 1.5rem',
              background: activeTab === item.id ? 'rgba(0, 141, 223, 0.25)' : 'transparent',
              border: 'none',
              borderLeft: activeTab === item.id ? '3px solid #008ddf' : '3px solid transparent',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: activeTab === item.id ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Logout button — bottom */}
        <div style={{ marginTop: 'auto', padding: '0 1.5rem' }}>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            style={{
              width: '100%',
              padding: '0.7rem 1rem',
              background: 'rgba(248, 113, 113, 0.2)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: '#fca5a5',
              fontSize: '0.6rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)';
            }}
          >
            Logout from {profile?.username}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        position: 'relative',
        marginLeft: '220px',
        marginTop: '0',
        width: 'calc(100% - 220px)',
        height: '100%',
        padding: '2rem',
        overflowY: 'auto',
        zIndex: 1,
      }}>
        {activeTab === 'videos' && (
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              Discover Videos
            </h2>
            {loadingVideos ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>
                <p>Loading videos...</p>
              </div>
            ) : videos.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem',
              }}>
                {videos.map((video) => (
                  <div
                    key={video.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.3)',
                    }}>
                      <img
                        src={video.thumbnail || `https://i.pravatar.cc/300?u=${video.id}`}
                        alt={video.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {/* Play button overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.4)',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: 'rgba(230, 57, 70, 0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}>
                          ▶
                        </div>
                      </div>
                      {/* Duration badge */}
                      {video.duration > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0.5rem',
                          right: '0.5rem',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: '#ffffff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Video title */}
                    <div style={{ padding: '0.6rem 0.8rem' }}>
                      <h3 style={{
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {video.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>
                <p>No videos available</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'news' && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#ffffff',
          }}>
            <p style={{ fontSize: '1.2rem', opacity: 0.7 }}>News coming soon...</p>
          </div>
        )}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {loadingProfile ? (
              <div style={{ textAlign: 'center', color: '#ffffff', padding: '2rem' }}>
                Loading profile...
              </div>
            ) : profile ? (
              isEditingProfile ? (
                // Edit form
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '2rem',
                }}>
                  <h2 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1.5rem', textAlign: 'center' }}>
                    Edit Profile
                  </h2>

                  <form onSubmit={handleEditFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3rem' }}>
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={editFormData.username}
                        onChange={handleEditFormChange}
                        disabled={editFormSubmitting}
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
                          opacity: editFormSubmitting ? 0.6 : 1,
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
                        value={editFormData.email}
                        onChange={handleEditFormChange}
                        disabled={editFormSubmitting}
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
                          opacity: editFormSubmitting ? 0.6 : 1,
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
                        value={editFormData.avatar}
                        onChange={handleEditFormChange}
                        disabled={editFormSubmitting}
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
                          opacity: editFormSubmitting ? 0.6 : 1,
                        }}
                      />
                      {editFormData.avatar && (
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                          <img
                            src={editFormData.avatar}
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

                    {editFormError && (
                      <div style={{
                        padding: '0.6rem 0.85rem',
                        background: 'rgba(248,113,113,0.15)',
                        borderLeft: '4px solid #f87171',
                        color: '#fca5a5',
                        fontSize: '0.8rem',
                        borderRadius: '4px',
                      }}>
                        {editFormError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="submit"
                        disabled={editFormSubmitting}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          background: '#e63946',
                          color: '#fff',
                          fontWeight: 700,
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          cursor: editFormSubmitting ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 20px rgba(230,57,70,0.35)',
                          transition: 'all 0.2s ease',
                          opacity: editFormSubmitting ? 0.7 : 1,
                        }}
                        onMouseEnter={e => !editFormSubmitting && (e.currentTarget.style.background = '#c1121f', e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={e => !editFormSubmitting && (e.currentTarget.style.background = '#e63946', e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {editFormSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        disabled={editFormSubmitting}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          background: 'rgba(255,255,255,0.15)',
                          color: '#ffffff',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.25)',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          cursor: editFormSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: editFormSubmitting ? 0.7 : 1,
                        }}
                        onMouseEnter={e => !editFormSubmitting && (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                        onMouseLeave={e => !editFormSubmitting && (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Profile view
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                }}>
                  <img
                    src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.id}`}
                    alt={`${profile.username}'s avatar`}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid rgba(0, 141, 223, 0.6)',
                      margin: '0 auto 1rem',
                      display: 'block',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {profile.username}
                    </h2>
                    {profile.verified && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#86efac',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Videos</p>
                      <p style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{profile.videos_count}</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Subscribers</p>
                      <p style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{profile.subscribers_count}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Member since:</span> {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Email:</span> {profile.email}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.6rem',
                      background: '#e63946',
                      color: '#fff',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(230,57,70,0.35)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#c1121f';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#e63946';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Edit Profile
                  </button>
                </div>
              )
            ) : (
              <div style={{ color: '#f87171' }}>Failed to load profile</div>
            )}
          </div>
        )}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: '450px', margin: '0 auto' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
              Upload Video
            </h2>

            {uploadSuccess && (
              <div style={{
                padding: '0.6rem 0.8rem',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#86efac',
                marginBottom: '0.8rem',
                fontSize: '0.8rem',
                textAlign: 'center',
              }}>
                ✓ Video uploaded successfully! Redirecting...
              </div>
            )}

            {uploadError && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(248,113,113,0.15)',
                borderLeft: '4px solid #f87171',
                color: '#fca5a5',
                fontSize: '0.85rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
              }}>
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {/* Video File */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.2rem',
                }}>
                  Video File *
                </label>
                <div
                  onDragEnter={handleUploadDragEnter}
                  onDragLeave={handleUploadDragLeave}
                  onDragOver={handleUploadDragOver}
                  onDrop={handleUploadDrop}
                  style={{
                    position: 'relative',
                    border: `2px dashed ${uploadIsDragging ? '#008ddf' : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: '8px',
                    padding: '0.6rem',
                    textAlign: 'center',
                    background: uploadIsDragging ? 'rgba(0,141,223,0.1)' : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleUploadFileChange}
                    disabled={uploading}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: 0,
                    }}
                  />
                  <div style={{ pointerEvents: 'none' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>📹</div>
                    {uploadFile ? (
                      <>
                        <p style={{ color: '#008ddf', fontWeight: 600, margin: '0.1rem 0', fontSize: '0.7rem' }}>
                          {uploadFile.name}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', margin: 0 }}>
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ color: '#ffffff', fontWeight: 600, margin: '0.1rem 0', fontSize: '0.7rem' }}>
                          Drag and drop your video here
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', margin: 0 }}>
                          or click to browse (Max 100 MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.2rem',
                }}>
                  Thumbnail Image
                </label>
                <div style={{
                  position: 'relative',
                  border: '2px dashed rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadThumbnailChange}
                    disabled={uploading}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: 0,
                    }}
                  />
                  <div style={{ pointerEvents: 'none' }}>
                    {uploadThumbnailPreview ? (
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={uploadThumbnailPreview}
                          alt="Thumbnail preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '80px',
                            borderRadius: '6px',
                            marginBottom: '0.3rem',
                          }}
                        />
                        <p style={{ color: '#008ddf', fontWeight: 500, margin: '0.1rem 0', fontSize: '0.7rem' }}>
                          {uploadThumbnail?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>🖼️</div>
                        <p style={{ color: '#ffffff', fontWeight: 500, margin: '0.05rem 0', fontSize: '0.7rem' }}>
                          Select thumbnail
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', margin: 0 }}>
                          (optional)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.2rem',
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={uploadFormData.title}
                  onChange={handleUploadFormChange}
                  disabled={uploading}
                  placeholder="Enter video title"
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    opacity: uploading ? 0.6 : 1,
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.2rem',
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={uploadFormData.description}
                  onChange={handleUploadFormChange}
                  disabled={uploading}
                  placeholder="Describe your video..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'none',
                    opacity: uploading ? 0.6 : 1,
                  }}
                />
              </div>

              {/* Sport */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.2rem',
                }}>
                  Sport
                </label>
                <input
                  type="text"
                  name="sport"
                  value={uploadFormData.sport}
                  onChange={handleUploadFormChange}
                  disabled={uploading}
                  placeholder="e.g., Football, Basketball, Tennis"
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    opacity: uploading ? 0.6 : 1,
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.2rem',
                }}>
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={uploadFormData.tags}
                  onChange={handleUploadFormChange}
                  disabled={uploading}
                  placeholder="Comma-separated tags (e.g., goal, highlights, training)"
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    opacity: uploading ? 0.6 : 1,
                  }}
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.3rem',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.75rem',
                  }}>
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #008ddf, #00d4ff)',
                      transition: 'width 0.2s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#e63946',
                    color: '#fff',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: uploading || !uploadFile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 20px rgba(230,57,70,0.35)',
                    transition: 'all 0.2s ease',
                    opacity: uploading || !uploadFile ? 0.6 : 1,
                  }}
                  onMouseEnter={e => !uploading && !uploadFile === false && (e.currentTarget.style.background = '#c1121f', e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => !uploading && !uploadFile === false && (e.currentTarget.style.background = '#e63946', e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('videos')}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: uploading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => !uploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                  onMouseLeave={e => !uploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;
