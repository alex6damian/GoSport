import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import homeBg from '../assets/home.png';
import { getMyProfile, updateUserProfile, getSubscriptions } from '../services/userService';
import { getVideos, uploadVideo, deleteVideo, updateVideo, searchVideos, type Video } from '../services/videoService';
import { getNews, searchNews, type NewsArticle } from '../services/newsService';
import { getFavorites } from '../services/userService';
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

interface User {
  id: number;
  username: string;
  avatar: string;
  subscribers_count: number;
}

const BrowsePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'news' | 'myvideos' | 'profile' | 'subscriptions' | 'upload' | 'saved'>('videos');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editFormSubmitting, setEditFormSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: '', email: '', avatar: '' });
  const [editFormPreviewImage, setEditFormPreviewImage] = useState<string | null>(null);
  const [editFormSelectedFile, setEditFormSelectedFile] = useState<File | null>(null);
  const [editFormIsDragging, setEditFormIsDragging] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [subscriptions, setSubscriptions] = useState<User[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedPage, setSavedPage] = useState(0);
  const [myVideosPage, setMyVideosPage] = useState(0);

  // Videos search + filter state
  const [videoSearchInput, setVideoSearchInput] = useState('');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoSport, setVideoSport] = useState('');
  const [videoPage, setVideoPage] = useState(0);
  const VIDEO_PER_PAGE = 6;

  // News state
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsSport, setNewsSport] = useState('');
  const [newsSearchInput, setNewsSearchInput] = useState('');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [newsPage, setNewsPage] = useState(0);
  const NEWS_PER_PAGE = 6;

  // My Videos state
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [loadingMyVideos, setLoadingMyVideos] = useState(false);
  const [editVideoId, setEditVideoId] = useState<number | null>(null);
  const [editVideoData, setEditVideoData] = useState({ title: '', description: '', sport: '', tags: '' });
  const [editVideoSubmitting, setEditVideoSubmitting] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

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
    { id: 'saved', label: 'Saved', icon: '🔖' },
    { id: 'myvideos', label: 'My Videos', icon: '🎥' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '⭐' },
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
  const fetchVideos = async (sport = '') => {
    setLoadingVideos(true);
    try {
      const response = await getVideos(1, 60, sport || undefined);
      setVideos(response.data?.data?.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleVideoSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = videoSearchInput.trim();
    setVideoSearchQuery(q);
    setVideoPage(0);
    if (!q) {
      fetchVideos(videoSport);
      return;
    }
    setLoadingVideos(true);
    try {
      const response = await searchVideos(q, undefined, 50);
      setVideos(response.data?.data?.hits || []);
    } catch (err) {
      console.error('Failed to search videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleVideoClearSearch = () => {
    setVideoSearchInput('');
    setVideoSearchQuery('');
    setVideoPage(0);
    fetchVideos(videoSport);
  };

  // Subscriptions fetch function
  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const response = await getSubscriptions();
      setSubscriptions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchSaved = async () => {
    setLoadingSaved(true);
    try {
      const response = await getFavorites();
      setSavedVideos(response.data || []);
    } catch (err) {
      console.error('Failed to fetch saved videos:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Fetch profile on component mount
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, []);

  const fetchNews = async (sport = '') => {
    setLoadingNews(true);
    try {
      const response = await getNews(1, 20, sport || undefined);
      setNews(response.data?.articles || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleNewsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = newsSearchInput.trim();
    setNewsSearchQuery(q);
    setNewsPage(0);
    if (!q) {
      fetchNews(newsSport);
      return;
    }
    setLoadingNews(true);
    try {
      const response = await searchNews(q, 50);
      setNews(response.data?.hits || response.data || []);
    } catch (err) {
      console.error('Failed to search news:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleNewsClearSearch = () => {
    setNewsSearchInput('');
    setNewsSearchQuery('');
    setNewsPage(0);
    fetchNews(newsSport);
  };

  const fetchMyVideos = async () => {
    if (!profile) return;
    setLoadingMyVideos(true);
    try {
      const { getUserVideos } = await import('../services/userService');
      const response = await getUserVideos(profile.username);
      setMyVideos(response.data?.videos || response.data || []);
    } catch (err) {
      console.error('Failed to fetch my videos:', err);
    } finally {
      setLoadingMyVideos(false);
    }
  };

  const handleEditVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVideoId) return;
    setEditVideoSubmitting(true);
    try {
      await updateVideo(editVideoId, editVideoData);
      window.location.reload();
    } catch (err) {
      console.error('Failed to update video:', err);
      setEditVideoSubmitting(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    setDeletingVideo(true);
    try {
      await deleteVideo(deleteVideoId);
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete video:', err);
      setDeletingVideo(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && !profile) {
      fetchProfile();
    } else if (activeTab === 'videos' && videos.length === 0) {
      fetchVideos();
    } else if (activeTab === 'subscriptions' && subscriptions.length === 0) {
      fetchSubscriptions();
    } else if (activeTab === 'news' && news.length === 0) {
      fetchNews(newsSport);
    } else if (activeTab === 'myvideos') {
      fetchMyVideos();
    } else if (activeTab === 'saved') {
      fetchSaved();
    }
  }, [activeTab]);

  // Poll My Videos every 4s while there are pending/processing videos
  useEffect(() => {
    if (activeTab !== 'myvideos') return;
    const hasPending = myVideos.some(v => v.status === 'pending' || v.status === 'processing');
    if (!hasPending) return;
    const interval = setInterval(fetchMyVideos, 4000);
    return () => clearInterval(interval);
  }, [activeTab, myVideos]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditFormFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setEditFormError('Please select a valid image file');
        return;
      }
      setEditFormSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditFormPreviewImage(result);
        setEditFormData({ ...editFormData, avatar: result });
      };
      reader.readAsDataURL(file);
      setEditFormError(null);
    }
  };

  const handleEditFormDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditFormIsDragging(true);
  };

  const handleEditFormDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditFormIsDragging(false);
  };

  const handleEditFormDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEditFormDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditFormIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type.startsWith('image/')) {
        setEditFormSelectedFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setEditFormPreviewImage(result);
          setEditFormData({ ...editFormData, avatar: result });
        };
        reader.readAsDataURL(selectedFile);
        setEditFormError(null);
      } else {
        setEditFormError('Please select a valid image file');
      }
    }
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
    if (['videos', 'news', 'myvideos', 'profile', 'subscriptions', 'upload', 'saved'].includes(id)) {
      setActiveTab(id as 'videos' | 'news' | 'myvideos' | 'profile' | 'subscriptions' | 'upload' | 'saved');
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
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadFile(null);
        setUploadThumbnail(null);
        setUploadThumbnailPreview(null);
        setUploadFormData({ title: '', description: '', sport: '', tags: '' });
        setUploadProgress(0);
        setActiveTab('myvideos');
      }, 1500);
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
      backgroundAttachment: 'fixed',
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {videoSearchQuery ? <>Discover Videos <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>—</span> <span style={{ color: '#00d4ff' }}>{videoSearchQuery}</span></> : 'Discover Videos'}
              </h2>
              <form onSubmit={handleVideoSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                  <input
                    type="text"
                    value={videoSearchInput}
                    onChange={e => setVideoSearchInput(e.target.value)}
                    placeholder="Search videos..."
                    style={{
                      paddingLeft: '2.2rem', paddingRight: videoSearchInput ? '2rem' : '0.75rem',
                      paddingTop: '0.45rem', paddingBottom: '0.45rem',
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', width: '220px',
                    }}
                  />
                  {videoSearchInput && (
                    <button type="button" onClick={handleVideoClearSearch}
                      style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>
                      ✕
                    </button>
                  )}
                </div>
                <button type="submit"
                  style={{ padding: '0.45rem 1rem', background: '#008ddf', border: 'none', borderRadius: '20px', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  Search
                </button>
              </form>
            </div>
            {/* Sport filters */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {['', 'football', 'basketball', 'tennis', 'boxing', 'cycling', 'rugby'].map(sport => (
                <button key={sport} onClick={() => { setVideoSport(sport); setVideoPage(0); setVideoSearchInput(''); setVideoSearchQuery(''); fetchVideos(sport); }}
                  style={{ padding: '0.3rem 0.8rem', background: videoSport === sport ? '#008ddf' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: '20px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: videoSport === sport ? 700 : 400 }}>
                  {sport || 'All'}
                </button>
              ))}
            </div>
            {loadingVideos ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>Loading videos...</div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No videos available.</div>
            ) : (
              <div style={{ position: 'relative', minHeight: '560px', display: 'flex', alignItems: 'flex-start' }}>
                {/* Left arrow */}
                <button onClick={() => setVideoPage(p => Math.max(0, p - 1))} disabled={videoPage === 0}
                  style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: videoPage === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: videoPage === 0 ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: videoPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ‹
                </button>
                {/* Grid: 2 rows × 3 cols */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingLeft: '52px', paddingRight: '52px' }}>
                  {videos.slice(videoPage * VIDEO_PER_PAGE, videoPage * VIDEO_PER_PAGE + VIDEO_PER_PAGE).map(video => (
                    <div key={video.id} onClick={() => navigate(`/videos/${video.id}`)}
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      {/* Thumbnail */}
                      <div style={{ position: 'relative', width: '100%', height: '185px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                        <img src={video.thumbnail || `https://i.pravatar.cc/300?u=${video.id}`} alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {/* Play overlay */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          <div style={{ width: '46px', height: '46px', background: 'rgba(230,57,70,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>▶</div>
                        </div>
                        {video.duration > 0 && (
                          <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      {/* Title */}
                      <div style={{ padding: '0.6rem 0.75rem' }}>
                        <h3 style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {video.title}
                        </h3>
                        {video.sport && (
                          <span style={{ display: 'inline-block', marginTop: '0.3rem', background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}>{video.sport}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Right arrow */}
                <button onClick={() => setVideoPage(p => p + 1)} disabled={(videoPage + 1) * VIDEO_PER_PAGE >= videos.length}
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: (videoPage + 1) * VIDEO_PER_PAGE >= videos.length ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: (videoPage + 1) * VIDEO_PER_PAGE >= videos.length ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: (videoPage + 1) * VIDEO_PER_PAGE >= videos.length ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ›
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'news' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {newsSearchQuery ? <>Sports News <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>—</span> <span style={{ color: '#00d4ff' }}>{newsSearchQuery}</span></> : 'Sports News'}
              </h2>
              <form onSubmit={handleNewsSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                  <input
                    type="text"
                    value={newsSearchInput}
                    onChange={e => setNewsSearchInput(e.target.value)}
                    placeholder="Search news..."
                    style={{
                      paddingLeft: '2.2rem', paddingRight: newsSearchInput ? '2rem' : '0.75rem',
                      paddingTop: '0.45rem', paddingBottom: '0.45rem',
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', width: '220px',
                    }}
                  />
                  {newsSearchInput && (
                    <button type="button" onClick={handleNewsClearSearch}
                      style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>
                      ✕
                    </button>
                  )}
                </div>
                <button type="submit"
                  style={{ padding: '0.45rem 1rem', background: '#008ddf', border: 'none', borderRadius: '20px', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  Search
                </button>
              </form>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {['', 'football', 'basketball', 'tennis', 'boxing', 'cycling', 'rugby'].map(sport => (
                <button key={sport} onClick={() => { setNewsSport(sport); setNewsPage(0); setNewsSearchInput(''); setNewsSearchQuery(''); fetchNews(sport); }}
                  style={{ padding: '0.3rem 0.8rem', background: newsSport === sport ? '#008ddf' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: '20px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: newsSport === sport ? 700 : 400 }}>
                  {sport || 'All'}
                </button>
              ))}
            </div>
            {loadingNews ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>Loading news...</div>
            ) : news.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem' }}>No news articles available.</div>
            ) : (
              <div style={{ position: 'relative', minHeight: '560px', display: 'flex', alignItems: 'flex-start' }}>
                {/* Left arrow - fixed vertical center */}
                <button
                  onClick={() => setNewsPage(p => Math.max(0, p - 1))}
                  disabled={newsPage === 0}
                  style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: newsPage === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: newsPage === 0 ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: newsPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ‹
                </button>

                {/* Grid: 2 rows × 3 cols */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingLeft: '52px', paddingRight: '52px' }}>
                  {news.slice(newsPage * NEWS_PER_PAGE, newsPage * NEWS_PER_PAGE + NEWS_PER_PAGE).map(article => (
                    <Link key={article.id} to={`/news/${article.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', height: '100%' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.3)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                        <div style={{ width: '100%', height: '155px', overflow: 'hidden', flexShrink: 0 }}>
                          {article.image_url ? (
                            <img src={article.image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(0,141,223,0.3) 0%, rgba(0,212,255,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                              {article.sport === 'football' ? '⚽' : article.sport === 'basketball' ? '🏀' : article.sport === 'tennis' ? '🎾' : article.sport === 'boxing' ? '🥊' : article.sport === 'cycling' ? '🚴' : article.sport === 'rugby' ? '🏉' : '🏆'}
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '0.6rem 0.75rem' }}>
                          {article.sport && (
                            <span style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '0.15rem 0.45rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}>{article.sport}</span>
                          )}
                          <h3 style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, margin: '0.4rem 0 0.35rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
                            <span>{article.source}</span>
                            <span>{new Date(article.published_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Right arrow - fixed vertical center */}
                <button
                  onClick={() => setNewsPage(p => p + 1)}
                  disabled={(newsPage + 1) * NEWS_PER_PAGE >= news.length}
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: (newsPage + 1) * NEWS_PER_PAGE >= news.length ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: (newsPage + 1) * NEWS_PER_PAGE >= news.length ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: (newsPage + 1) * NEWS_PER_PAGE >= news.length ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ›
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'myvideos' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Videos</h2>
            </div>
            <div style={{ marginBottom: '1.5rem', height: '30px' }} />
            {loadingMyVideos ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>Loading...</div>
            ) : myVideos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '4rem' }}>
                <p style={{ marginBottom: '1rem' }}>You haven't uploaded any videos yet.</p>
                <button onClick={() => setActiveTab('upload')} style={{ padding: '0.6rem 1.5rem', background: '#008ddf', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Upload a Video</button>
              </div>
            ) : (
              <div style={{ position: 'relative', minHeight: '420px', display: 'flex', alignItems: 'flex-start' }}>
                {/* Left arrow */}
                <button onClick={() => setMyVideosPage(p => Math.max(0, p - 1))} disabled={myVideosPage === 0}
                  style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: myVideosPage === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: myVideosPage === 0 ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: myVideosPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ‹
                </button>
                {/* Grid: 2 rows × 3 cols */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingLeft: '52px', paddingRight: '52px' }}>
                  {myVideos.slice(myVideosPage * VIDEO_PER_PAGE, myVideosPage * VIDEO_PER_PAGE + VIDEO_PER_PAGE).map(video => (
                    <div key={video.id}
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      {/* Thumbnail */}
                      <div onClick={() => navigate(`/videos/${video.id}`)}
                        style={{ position: 'relative', width: '100%', height: '130px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', flexShrink: 0, cursor: 'pointer' }}>
                        <img src={video.thumbnail || `https://i.pravatar.cc/300?u=${video.id}`} alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          <div style={{ width: '36px', height: '36px', background: 'rgba(230,57,70,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>▶</div>
                        </div>
                        {video.duration > 0 && (
                          <div style={{ position: 'absolute', bottom: '0.3rem', right: '0.3rem', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      {/* Info + actions */}
                      <div style={{ padding: '0.45rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h3 style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {video.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                          {video.status === 'pending' || video.status === 'processing' ? (
                            <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '0.1rem 0.35rem', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 600 }}>
                              ⏳ {video.status === 'processing' ? 'Processing...' : 'Pending...'}
                            </span>
                          ) : video.sport ? (
                            <span style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '0.1rem 0.35rem', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 600, textTransform: 'capitalize' }}>{video.sport}</span>
                          ) : <span />}
                          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>{video.views_count || 0} views</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => { setEditVideoId(video.id); setEditVideoData({ title: video.title, description: video.description || '', sport: video.sport || '', tags: video.tags || '' }); }}
                            style={{ flex: 1, padding: '0.25rem 0', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: '6px', fontSize: '0.68rem', cursor: 'pointer' }}>
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeleteVideoId(video.id)}
                            style={{ flex: 1, padding: '0.25rem 0', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5', borderRadius: '6px', fontSize: '0.68rem', cursor: 'pointer' }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Right arrow */}
                <button onClick={() => setMyVideosPage(p => p + 1)} disabled={(myVideosPage + 1) * VIDEO_PER_PAGE >= myVideos.length}
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: (myVideosPage + 1) * VIDEO_PER_PAGE >= myVideos.length ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: (myVideosPage + 1) * VIDEO_PER_PAGE >= myVideos.length ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: (myVideosPage + 1) * VIDEO_PER_PAGE >= myVideos.length ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ›
                </button>
              </div>
            )}

            {/* Edit Video Modal */}
            {editVideoId !== null && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
                onClick={e => { if (e.target === e.currentTarget) setEditVideoId(null); }}>
                <div style={{ background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', color: '#ffffff' }}>
                  <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Edit Video</h2>
                  <form onSubmit={handleEditVideoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(['title', 'sport', 'tags'] as const).map(key => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem', textTransform: 'capitalize' }}>{key}</label>
                        <input type="text" value={editVideoData[key]}
                          onChange={e => setEditVideoData(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', padding: '0.55rem 0.75rem', outline: 'none' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>Description</label>
                      <textarea rows={4} value={editVideoData.description}
                        onChange={e => setEditVideoData(prev => ({ ...prev, description: e.target.value }))}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', padding: '0.55rem 0.75rem', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setEditVideoId(null)}
                        style={{ padding: '0.5rem 1.1rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={editVideoSubmitting}
                        style={{ padding: '0.5rem 1.2rem', background: '#008ddf', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: editVideoSubmitting ? 'not-allowed' : 'pointer', opacity: editVideoSubmitting ? 0.6 : 1 }}>
                        {editVideoSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Video Confirm Modal */}
            {deleteVideoId !== null && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
                onClick={e => { if (e.target === e.currentTarget) setDeleteVideoId(null); }}>
                <div style={{ background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '380px', color: '#ffffff', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700 }}>Delete Video?</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>This action cannot be undone.</p>
                  <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                    <button onClick={() => setDeleteVideoId(null)}
                      style={{ padding: '0.5rem 1.3rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleDeleteVideo} disabled={deletingVideo}
                      style={{ padding: '0.5rem 1.3rem', background: 'rgba(248,113,113,0.8)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: deletingVideo ? 'not-allowed' : 'pointer', opacity: deletingVideo ? 0.6 : 1 }}>
                      {deletingVideo ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'subscriptions' && (
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              My Subscriptions
            </h2>
            {loadingSubscriptions ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>
                <p>Loading subscriptions...</p>
              </div>
            ) : subscriptions.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem',
              }}>
                {subscriptions.map((user) => (
                  <Link
                    key={user.id}
                    to={`/users/${user.username}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <img
                        src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                        alt={`${user.username}'s avatar`}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid rgba(0, 141, 223, 0.6)',
                          marginBottom: '1rem',
                        }}
                      />
                      <h3 style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: 600,
                        margin: '0 0 0.5rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {user.username}
                      </h3>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.75rem',
                        margin: 0,
                      }}>
                        {user.subscribers_count} subscribers
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>
                <p>You haven't subscribed to anyone yet.</p>
              </div>
            )}
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
                        Avatar
                      </label>
                      <div
                        onDragEnter={handleEditFormDragEnter}
                        onDragLeave={handleEditFormDragLeave}
                        onDragOver={handleEditFormDragOver}
                        onDrop={handleEditFormDrop}
                        style={{
                          position: 'relative',
                          border: `2px dashed ${editFormIsDragging ? '#008ddf' : 'rgba(255,255,255,0.3)'}`,
                          borderRadius: '10px',
                          padding: '1.5rem 1rem',
                          textAlign: 'center',
                          background: editFormIsDragging ? 'rgba(0,141,223,0.1)' : 'rgba(255,255,255,0.05)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          minHeight: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditFormFileSelect}
                          disabled={editFormSubmitting}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            cursor: editFormSubmitting ? 'not-allowed' : 'pointer',
                            opacity: 0,
                          }}
                        />
                        <div style={{ pointerEvents: 'none' }}>
                          {editFormPreviewImage ? (
                            <>
                              <img
                                src={editFormPreviewImage}
                                alt="Avatar preview"
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid rgba(0, 141, 223, 0.6)',
                                  display: 'block',
                                  margin: '0 auto 0.6rem',
                                }}
                              />
                              <p style={{ color: '#008ddf', fontWeight: 600, margin: '0.2rem 0', fontSize: '0.75rem' }}>
                                {editFormSelectedFile?.name}
                              </p>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>
                                Click or drag to change
                              </p>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🖼️</div>
                              <p style={{ color: '#ffffff', fontWeight: 600, margin: '0.2rem 0', fontSize: '0.8rem' }}>
                                Drag your photo here
                              </p>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>
                                or click to browse
                              </p>
                            </>
                          )}
                        </div>
                      </div>
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
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Keep the flow if you want to grow</span>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Member since:</span> {new Date(profile.created_at).toLocaleDateString()}
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
        {activeTab === 'saved' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Saved Videos</h2>
            </div>
            <div style={{ marginBottom: '1.5rem', height: '30px' }} />
            {loadingSaved ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>Loading saved videos...</div>
            ) : savedVideos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '4rem' }}>
                <p style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>No saved videos yet.</p>
                <p style={{ fontSize: '0.85rem' }}>Save a video from the player to find it here.</p>
              </div>
            ) : (
              <div style={{ position: 'relative', minHeight: '560px', display: 'flex', alignItems: 'flex-start' }}>
                {/* Left arrow */}
                <button onClick={() => setSavedPage(p => Math.max(0, p - 1))} disabled={savedPage === 0}
                  style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: savedPage === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: savedPage === 0 ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: savedPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ‹
                </button>
                {/* Grid: 2 rows × 3 cols */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingLeft: '52px', paddingRight: '52px' }}>
                  {savedVideos.slice(savedPage * VIDEO_PER_PAGE, savedPage * VIDEO_PER_PAGE + VIDEO_PER_PAGE).map(video => (
                    <div key={video.id} onClick={() => navigate(`/videos/${video.id}`)}
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      {/* Thumbnail */}
                      <div style={{ position: 'relative', width: '100%', height: '185px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                        <img src={video.thumbnail || `https://i.pravatar.cc/300?u=${video.id}`} alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {/* Play overlay */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          <div style={{ width: '46px', height: '46px', background: 'rgba(230,57,70,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>▶</div>
                        </div>
                        {video.duration > 0 && (
                          <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding: '0.6rem 0.75rem' }}>
                        <h3 style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {video.title}
                        </h3>
                        {video.sport && (
                          <span style={{ display: 'inline-block', marginTop: '0.3rem', background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}>{video.sport}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Right arrow */}
                <button onClick={() => setSavedPage(p => p + 1)} disabled={(savedPage + 1) * VIDEO_PER_PAGE >= savedVideos.length}
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: (savedPage + 1) * VIDEO_PER_PAGE >= savedVideos.length ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', color: (savedPage + 1) * VIDEO_PER_PAGE >= savedVideos.length ? 'rgba(255,255,255,0.2)' : '#ffffff', fontSize: '1.1rem', cursor: (savedPage + 1) * VIDEO_PER_PAGE >= savedVideos.length ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                  ›
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
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
                marginBottom: '1rem',
              }}>
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left column — file & thumbnail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Video File */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '0.4rem',
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
                        borderRadius: '10px',
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        background: uploadIsDragging ? 'rgba(0,141,223,0.1)' : 'rgba(255,255,255,0.05)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        minHeight: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📹</div>
                        {uploadFile ? (
                          <>
                            <p style={{ color: '#008ddf', fontWeight: 600, margin: '0.2rem 0', fontSize: '0.75rem' }}>
                              {uploadFile.name}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>
                              {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            <p style={{ color: '#ffffff', fontWeight: 600, margin: '0.2rem 0', fontSize: '0.8rem' }}>
                              Drag & drop your video here
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>
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
                      marginBottom: '0.4rem',
                    }}>
                      Thumbnail Image
                    </label>
                    <div style={{
                      position: 'relative',
                      border: '2px dashed rgba(255,255,255,0.3)',
                      borderRadius: '10px',
                      padding: '1.2rem 1rem',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      minHeight: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                                maxHeight: '100px',
                                borderRadius: '6px',
                                marginBottom: '0.4rem',
                              }}
                            />
                            <p style={{ color: '#008ddf', fontWeight: 500, margin: '0.1rem 0', fontSize: '0.7rem' }}>
                              {uploadThumbnail?.name}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🖼️</div>
                              <p style={{ color: '#ffffff', fontWeight: 500, margin: '0.1rem 0', fontSize: '0.8rem' }}>
                                Select thumbnail
                              </p>
                              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: 0 }}>
                                optional
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — metadata & actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {/* Title */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '0.3rem',
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
                        padding: '0.5rem 0.7rem',
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
                      marginBottom: '0.3rem',
                    }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={uploadFormData.description}
                      onChange={handleUploadFormChange}
                      disabled={uploading}
                      placeholder="Describe your video..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.7rem',
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
                      marginBottom: '0.3rem',
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
                        padding: '0.5rem 0.7rem',
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
                      marginBottom: '0.3rem',
                    }}>
                      Tags
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={uploadFormData.tags}
                      onChange={handleUploadFormChange}
                      disabled={uploading}
                      placeholder="Comma-separated (e.g., goal, highlights, training)"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.7rem',
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
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <button
                      type="submit"
                      disabled={uploading || !uploadFile}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
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
                      onMouseEnter={e => !uploading && !!uploadFile && (e.currentTarget.style.background = '#c1121f', e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => !uploading && !!uploadFile && (e.currentTarget.style.background = '#e63946', e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {uploading ? 'Uploading...' : 'Upload Video'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('videos')}
                      disabled={uploading}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
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
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;
