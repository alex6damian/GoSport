import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import homeBg from '../assets/home.png';
import NavButtons from '../components/NavButtons';
import { getVideoDetails, likeVideo, unlikeVideo, checkIfVideoLiked, recordVideoView, getVideoComments, addComment, deleteComment, getCommentReplies, addReply, updateComment, getFeed, searchVideos, toggleFavorite, checkIfFavorited, updateVideo, deleteVideo, updateWatchProgress } from '../services/videoService';
import type { Video } from '../services/videoService';
import { subscribeToUser, unsubscribeFromUser, checkSubscription } from '../services/userService';

interface Comment {
  id: number;
  user_id: number;
  video_id: number;
  content: string;
  replies_count: number;
  created_at: string;
  user: { id: number; username: string; avatar: string };
}

interface VideoDetails {
  id: number;
  user_id: number;
  title: string;
  description: string;
  sport: string;
  minio_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  hls_path: string;
  thumbnail: string;
  duration: number;
  status: string;
  views_count: number;
  likes_count: number;
  favorites_count: number;
  tags: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    avatar: string;
    subscribers_count: number;
  };
}

const VideoPlayer: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRecorded = useRef<Set<string>>(new Set());
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [videoURL, setVideoURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [repliesMap, setRepliesMap] = useState<Record<number, Comment[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [showEditVideo, setShowEditVideo] = useState(false);
  const [editVideoData, setEditVideoData] = useState({ title: '', description: '', sport: '', tags: '' });
  const [editVideoSubmitting, setEditVideoSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const currentUserId: number | null = (() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id ?? payload.sub ?? null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        const response = await getVideoDetails(Number(videoId));
        // response.data should have: { video, video_url, thumbnail_url }
        const videoData = response.video || response;
        setVideo(videoData);
        setVideoURL(response.video_url || '');
        setLikesCount(videoData.likes_count || 0);

        // Record view (guard against StrictMode double-invoke)
        if (!viewRecorded.current.has(videoId)) {
          viewRecorded.current.add(videoId);
          try {
            await recordVideoView(Number(videoId));
          } catch (err) {
            console.error('Failed to record view:', err);
          }
        }

        // Check subscription status if user is logged in
        if (token && videoData?.user?.id) {
          try {
            const subResponse = await checkSubscription(videoData.user.id);
            setIsSubscribed(subResponse?.is_subscribed || false);
          } catch (err) {
            console.error('Failed to check subscription:', err);
          }
        }

        // Check if video is liked
        if (token) {
          try {
            const likeResponse = await checkIfVideoLiked(Number(videoId));
            setIsLiked(likeResponse?.is_liked || false);
          } catch (err) {
            console.error('Failed to check like status:', err);
          }
        }

        // Check if video is favorited
        if (token) {
          try {
            const favResponse = await checkIfFavorited(Number(videoId));
            setIsFavorited(favResponse?.is_favorited || false);
          } catch (err) {
            console.error('Failed to check favorite status:', err);
          }
        }
      } catch (err) {
        setError('Failed to load video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, token]);

  const fetchComments = async () => {
    if (!videoId) return;
    setCommentsLoading(true);
    try {
      const res = await getVideoComments(Number(videoId));
      setComments(res?.data?.items || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  // Watch progress: send every 15s while playing
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoId || !token) return;

    const startTimer = () => {
      progressTimerRef.current = setInterval(() => {
        if (videoEl && !videoEl.paused && !videoEl.ended) {
          updateWatchProgress(Number(videoId), Math.floor(videoEl.currentTime)).catch(() => {});
        }
      }, 15000);
    };

    const stopTimer = () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };

    videoEl.addEventListener('play', startTimer);
    videoEl.addEventListener('pause', stopTimer);
    videoEl.addEventListener('ended', stopTimer);

    return () => {
      stopTimer();
      videoEl.removeEventListener('play', startTimer);
      videoEl.removeEventListener('pause', stopTimer);
      videoEl.removeEventListener('ended', stopTimer);
    };
  }, [videoId, token]);

  useEffect(() => {
    if (!video) return;
    const fetchRecommended = async () => {
      try {
        let videos: Video[] = [];
        if (video.sport) {
          const res = await searchVideos(video.sport, video.sport, 8);
          videos = (res.data?.data?.hits as Video[]) || [];
        }
        if (videos.length < 3) {
          const feedRes = await getFeed(1, 8);
          const feedVids: Video[] = feedRes.data?.data || [];
          const ids = new Set(videos.map(v => v.id));
          feedVids.forEach(v => { if (!ids.has(v.id)) { ids.add(v.id); videos.push(v); } });
        }
        setRecommendedVideos(videos.filter(v => v.id !== video.id).slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };
    fetchRecommended();
  }, [video?.id]);

  const handleAddComment = async () => {
    if (!commentInput.trim() || !videoId) return;
    setCommentSubmitting(true);
    try {
      await addComment(Number(videoId), commentInput.trim());
      setCommentInput('');
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleToggleReplies = async (commentId: number) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => { const s = new Set(prev); s.delete(commentId); return s; });
      return;
    }
    setLoadingReplies(prev => new Set(prev).add(commentId));
    try {
      const res = await getCommentReplies(commentId);
      setRepliesMap(prev => ({ ...prev, [commentId]: res?.data?.items || [] }));
      setExpandedReplies(prev => new Set(prev).add(commentId));
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setLoadingReplies(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    }
  };

  const handleAddReply = async (commentId: number) => {
    if (!replyInput.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await addReply(commentId, replyInput.trim());
      setReplyInput('');
      setReplyingTo(null);
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), res.data],
      }));
      setExpandedReplies(prev => new Set(prev).add(commentId));
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies_count: c.replies_count + 1 } : c
      ));
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      const res = await updateComment(commentId, editContent.trim());
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: res.data.content } : c));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  const handleEditReply = async (commentId: number, replyId: number) => {
    if (!editContent.trim()) return;
    try {
      const res = await updateComment(replyId, editContent.trim());
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map(r => r.id === replyId ? { ...r, content: res.data.content } : r),
      }));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit reply:', err);
    }
  };

  const handleDeleteReply = async (commentId: number, replyId: number) => {
    try {
      await deleteComment(replyId);
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).filter(r => r.id !== replyId),
      }));
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies_count: Math.max(0, c.replies_count - 1) } : c
      ));
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const handleLike = async () => {
    if (!token || !video) return;
    setLiking(true);
    try {
      if (isLiked) {
        await unlikeVideo(video.id);
        setIsLiked(false);
        setLikesCount(Math.max(0, likesCount - 1));
      } else {
        await likeVideo(video.id);
        setIsLiked(true);
        setLikesCount(likesCount + 1);
      }
    } catch (err) {
      console.error('Failed to update like:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!token || !video) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromUser(video.user.id);
        setIsSubscribed(false);
        setVideo(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            subscribers_count: Math.max(0, prev.user.subscribers_count - 1)
          }
        } : null);
      } else {
        await subscribeToUser(video.user.id);
        setIsSubscribed(true);
        setVideo(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            subscribers_count: prev.user.subscribers_count + 1
          }
        } : null);
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleFavorite = async () => {
    if (!token || !video) return;
    setFavoriting(true);
    try {
      const res = await toggleFavorite(video.id);
      setIsFavorited(res?.is_favorited ?? !isFavorited);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavoriting(false);
    }
  };

  const handleEditVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;
    setEditVideoSubmitting(true);
    try {
      await updateVideo(video.id, editVideoData);
      setVideo(prev => prev ? { ...prev, ...editVideoData } : null);
      setShowEditVideo(false);
    } catch (err) {
      console.error('Failed to update video:', err);
    } finally {
      setEditVideoSubmitting(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!video) return;
    setDeletingVideo(true);
    try {
      await deleteVideo(video.id);
      navigate('/browse');
    } catch (err) {
      console.error('Failed to delete video:', err);
      setDeletingVideo(false);
      setShowDeleteConfirm(false);
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
        backgroundAttachment: 'fixed',
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
        <div style={{ position: 'relative', zIndex: 1, color: '#ffffff' }}>Loading video...</div>
      </div>
    );
  }

  if (error || !video) {
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
        backgroundAttachment: 'fixed',
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
        <div style={{ position: 'relative', zIndex: 1, color: '#f87171' }}>{error || 'Video not found'}</div>
      </div>
    );
  }

  const formatViews = (views?: number) => {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
      backgroundAttachment: 'fixed',
      display: 'flex',
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <NavButtons />

        {loading && !video && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '1.1rem',
          }}>
            Loading video...
          </div>
        )}

        {error && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fca5a5',
            fontSize: '1.1rem',
          }}>
            {error}
          </div>
        )}

        {video && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '1.5rem',
          padding: '4rem 2rem 2rem',
          height: '100%',
          boxSizing: 'border-box',
        }}>

          {/* LEFT — player + info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

            {/* Player */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#000',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              <video
                ref={videoRef}
                src={videoURL}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Title + stats + like + favorite + owner actions */}
            <div style={{ color: '#ffffff' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                {video.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  <span>{formatViews(video.views_count)} views</span>
                  <span>•</span>
                  <span>{formatDate(video.created_at)}</span>
                  {video.sport && <><span>•</span><span style={{ color: '#00d4ff' }}>{video.sport}</span></>}
                </div>
                {token && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleLike}
                      disabled={liking}
                      style={{
                        padding: '0.4rem 1rem',
                        background: isLiked ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.1)',
                        border: isLiked ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.2)',
                        color: isLiked ? '#fca5a5' : '#ffffff',
                        borderRadius: '8px',
                        cursor: liking ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        opacity: liking ? 0.6 : 1,
                      }}
                    >
                      {isLiked ? '❤️' : '🤍'} {likesCount}
                    </button>
                    <button
                      onClick={handleFavorite}
                      disabled={favoriting}
                      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      style={{
                        padding: '0.4rem 1rem',
                        background: isFavorited ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.1)',
                        border: isFavorited ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.2)',
                        color: isFavorited ? '#fbbf24' : '#ffffff',
                        borderRadius: '8px',
                        cursor: favoriting ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        opacity: favoriting ? 0.6 : 1,
                      }}
                    >
                      {isFavorited ? '★' : '☆'} Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Channel */}
            {video.user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.2rem',
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={video.user.avatar || `https://i.pravatar.cc/40?u=${video.user_id}`}
                    alt={video.user.username}
                    onClick={() => navigate(`/users/${video.user.username}`)}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div>
                    <Link to={`/users/${video.user.username}`} style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                      {video.user.username}
                    </Link>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0.15rem 0 0' }}>
                      {video.user.subscribers_count} subscribers
                    </p>
                  </div>
                </div>
                {token && video && currentUserId !== video.user_id && (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    style={{
                      padding: '0.45rem 1.1rem',
                      background: isSubscribed ? 'rgba(248,113,113,0.2)' : '#008ddf',
                      border: isSubscribed ? '1px solid rgba(248,113,113,0.3)' : 'none',
                      color: isSubscribed ? '#fca5a5' : '#ffffff',
                      borderRadius: '8px',
                      cursor: subscribing ? 'not-allowed' : 'pointer',
                      fontWeight: 600, fontSize: '0.85rem',
                      opacity: subscribing ? 0.6 : 1,
                    }}
                  >
                    {subscribing ? '...' : isSubscribed ? '✓ Subscribed' : '+ Subscribe'}
                  </button>
                )}
              </div>
            )}

            {/* Description */}
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '1rem 1.2rem',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.88rem' }}>
                {video.description || <span style={{ opacity: 0.4 }}>No description.</span>}
              </p>
              {video.tags && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {video.tags.split(',').map((tag, idx) => (
                    <span key={idx} style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended videos - REMOVED - now in right sidebar */}
          </div>

          {/* RIGHT — comments + recommended */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            height: '100%',
            overflowY: 'auto',
          }}>
            {/* Comments box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              overflow: 'hidden',
              flex: 1,
              minHeight: '400px',
            }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#ffffff', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                Comments {comments.length > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({comments.length})</span>}
              </h3>
            </div>

            {/* Comment list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {commentsLoading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'left', fontSize: '0.85rem', marginTop: '1rem' }}>Loading...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'left', fontSize: '0.85rem', marginTop: '1rem' }}>No comments yet. Be the first!</p>
              ) : comments.map(c => {
                const cMenuId = `c-${c.id}`;
                const isVideoOwnerComment = c.user_id === video?.user_id;
                const canEditComment = currentUserId === c.user_id;
                const canDeleteComment = currentUserId === c.user_id || currentUserId === video?.user_id;

                return (
                  <div key={c.id}>
                    {editingId === cMenuId ? (
                      /* Edit mode */
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <img src={c.user.avatar || `https://i.pravatar.cc/40?u=${c.user.id}`} alt={c.user.username}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          <span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.8rem' }}>{c.user.username}</span>
                          {isVideoOwnerComment && <span title="Video owner" style={{ fontSize: '0.75rem' }}>🎬</span>}
                        </div>
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditComment(c.id); } }}
                          rows={3} autoFocus
                          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#ffffff', fontSize: '0.83rem', padding: '0.4rem 0.6rem', outline: 'none', resize: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                          <button onClick={() => handleEditComment(c.id)}
                            style={{ padding: '0.25rem 0.65rem', background: '#008ddf', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                            Save
                          </button>
                          <button onClick={() => { setEditingId(null); setEditContent(''); }}
                            style={{ padding: '0.25rem 0.65rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal mode */
                      <div>
                        {/* Header: avatar + username + badge + date + 3-dot */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                            <img src={c.user.avatar || `https://i.pravatar.cc/40?u=${c.user.id}`} alt={c.user.username}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            <span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.8rem' }}>{c.user.username}</span>
                            {isVideoOwnerComment && <span title="Video owner" style={{ fontSize: '0.75rem' }}>🎬</span>}
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {(canEditComment || canDeleteComment) && (
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <button
                                onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === cMenuId ? null : cMenuId); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '1rem', cursor: 'pointer', padding: '0 0.25rem', lineHeight: 1 }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                              >⋮</button>
                              {openMenuId === cMenuId && (
                                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.25rem', zIndex: 200, minWidth: '110px', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                                  {canEditComment && (
                                    <button
                                      onClick={() => { setEditingId(cMenuId); setEditContent(c.content); setOpenMenuId(null); }}
                                      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', padding: '0.4rem 0.65rem', borderRadius: '5px', cursor: 'pointer' }}
                                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >✏️ Edit</button>
                                  )}
                                  {canDeleteComment && (
                                    <button
                                      onClick={() => { handleDeleteComment(c.id); setOpenMenuId(null); }}
                                      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#f87171', fontSize: '0.78rem', padding: '0.4rem 0.65rem', borderRadius: '5px', cursor: 'pointer' }}
                                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >🗑️ Delete</button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.83rem', margin: '0.25rem 0 0.2rem 0', lineHeight: 1.5, wordBreak: 'break-word', textAlign: 'left' }}>
                          {c.content}
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.1rem' }}>
                          {token && (
                            <button
                              onClick={() => {
                                const closing = replyingTo === c.id;
                                setReplyingTo(closing ? null : c.id);
                                if (!closing && c.replies_count > 0 && !expandedReplies.has(c.id)) {
                                  handleToggleReplies(c.id);
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                            >Reply</button>
                          )}
                          {c.replies_count > 0 && (
                            <button
                              onClick={() => { handleToggleReplies(c.id); if (expandedReplies.has(c.id)) setReplyingTo(null); }}
                              style={{ background: 'none', border: 'none', color: 'rgba(0,212,255,0.7)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,212,255,0.7)'}
                            >
                              {loadingReplies.has(c.id) ? 'Loading...' : expandedReplies.has(c.id) ? 'Hide replies' : `View ${c.replies_count} ${c.replies_count === 1 ? 'reply' : 'replies'}`}
                            </button>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Replies */}
                    {expandedReplies.has(c.id) && (repliesMap[c.id] || []).length > 0 && (
                      <div style={{ marginLeft: '10px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '0.75rem' }}>
                        {(repliesMap[c.id] || []).map(r => {
                          const rMenuId = `r-${r.id}`;
                          const isVideoOwnerReply = r.user_id === video?.user_id;
                          const canEditReply = currentUserId === r.user_id;
                          const canDeleteReply = currentUserId === r.user_id || currentUserId === video?.user_id;

                          return (
                            <div key={r.id}>
                              {editingId === rMenuId ? (
                                /* Edit mode for reply */
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                    <img src={r.user.avatar || `https://i.pravatar.cc/40?u=${r.user.id}`} alt={r.user.username}
                                      style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                    <span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.75rem' }}>{r.user.username}</span>
                                    {isVideoOwnerReply && <span title="Video owner" style={{ fontSize: '0.7rem' }}>🎬</span>}
                                  </div>
                                  <textarea
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditReply(c.id, r.id); } }}
                                    rows={2} autoFocus
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#ffffff', fontSize: '0.78rem', padding: '0.35rem 0.55rem', outline: 'none', resize: 'none' }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                                    <button onClick={() => handleEditReply(c.id, r.id)}
                                      style={{ padding: '0.2rem 0.55rem', background: '#008ddf', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                                      Save
                                    </button>
                                    <button onClick={() => { setEditingId(null); setEditContent(''); }}
                                      style={{ padding: '0.2rem 0.55rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', cursor: 'pointer' }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Normal mode for reply */
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <img src={r.user.avatar || `https://i.pravatar.cc/40?u=${r.user.id}`} alt={r.user.username}
                                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                        <span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.75rem' }}>{r.user.username}</span>
                                        {isVideoOwnerReply && <span title="Video owner" style={{ fontSize: '0.68rem' }}>🎬</span>}
                                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                                      </div>
                                      {(canEditReply || canDeleteReply) && (
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                          <button
                                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === rMenuId ? null : rMenuId); }}
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', cursor: 'pointer', padding: '0 0.2rem', lineHeight: 1 }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                                          >⋮</button>
                                          {openMenuId === rMenuId && (
                                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.25rem', zIndex: 200, minWidth: '110px', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                                              {canEditReply && (
                                                <button
                                                  onClick={() => { setEditingId(rMenuId); setEditContent(r.content); setOpenMenuId(null); }}
                                                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', padding: '0.35rem 0.6rem', borderRadius: '5px', cursor: 'pointer' }}
                                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >✏️ Edit</button>
                                              )}
                                              {canDeleteReply && (
                                                <button
                                                  onClick={() => { handleDeleteReply(c.id, r.id); setOpenMenuId(null); }}
                                                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', padding: '0.35rem 0.6rem', borderRadius: '5px', cursor: 'pointer' }}
                                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >🗑️ Delete</button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', margin: '0.2rem 0 0', lineHeight: 1.5, wordBreak: 'break-word', textAlign: 'left' }}>
                                      {r.content}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply input — apare sub ultimul reply existent */}
                    {replyingTo === c.id && (
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', marginLeft: '10px', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                        <textarea
                          value={replyInput}
                          onChange={e => setReplyInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddReply(c.id); } }}
                          placeholder={`Reply to ${c.user.username}...`}
                          rows={1} disabled={replySubmitting} autoFocus
                          style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '5px', color: '#ffffff', fontSize: '0.72rem', padding: '0.3rem 0.5rem', outline: 'none', resize: 'none', opacity: replySubmitting ? 0.6 : 1 }}
                        />
                        <button
                          onClick={() => handleAddReply(c.id)}
                          disabled={replySubmitting || !replyInput.trim()}
                          style={{ padding: '0 0.5rem', height: '28px', background: '#008ddf', border: 'none', borderRadius: '5px', color: '#ffffff', fontWeight: 700, fontSize: '0.7rem', cursor: replySubmitting || !replyInput.trim() ? 'not-allowed' : 'pointer', opacity: replySubmitting || !replyInput.trim() ? 0.5 : 1, alignSelf: 'center' }}
                        >Post</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>



            {/* Input */}
            {token ? (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
                <textarea
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Add a comment..."
                  rows={2}
                  disabled={commentSubmitting}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.83rem',
                    padding: '0.5rem 0.7rem',
                    outline: 'none',
                    resize: 'none',
                    opacity: commentSubmitting ? 0.6 : 1,
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={commentSubmitting || !commentInput.trim()}
                  style={{
                    padding: '0 0.8rem',
                    background: '#008ddf',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: commentSubmitting || !commentInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: commentSubmitting || !commentInput.trim() ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Post
                </button>
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', margin: 0 }}>Log in to comment</p>
              </div>
            )}
            </div>

            {/* Recommended videos carousel - BELOW comments */}
            {recommendedVideos.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <h4 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                  Recommended Videos
                </h4>

                {/* 3-video carousel display */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {/* Left Arrow */}
                  <button
                    onClick={() => setRecommendedIndex(Math.max(0, recommendedIndex - 1))}
                    disabled={recommendedIndex === 0}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: recommendedIndex === 0 ? 'rgba(255,255,255,0.05)' : '#008ddf',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      cursor: recommendedIndex === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      opacity: recommendedIndex === 0 ? 0.4 : 1,
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => recommendedIndex > 0 && (e.currentTarget.style.background = 'rgba(0, 141, 223, 0.8)')}
                    onMouseLeave={e => recommendedIndex > 0 && (e.currentTarget.style.background = '#008ddf')}
                  >
                    ←
                  </button>

                  {/* Video cards (3 at a time) */}
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
                    {[0, 1, 2].map((offset) => {
                      const vidIndex = recommendedIndex + offset;
                      if (vidIndex >= recommendedVideos.length) return null;
                      const vid = recommendedVideos[vidIndex];

                      return (
                        <div
                          key={vid.id}
                          onClick={() => navigate(`/videos/${vid.id}`)}
                          style={{
                            flex: '1 0 calc(33.333% - 0.5rem)',
                            minWidth: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {/* Thumbnail */}
                          <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.1)',
                            flexShrink: 0,
                          }}>
                            <img
                              src={vid.thumbnail || `https://i.pravatar.cc/300?u=${vid.id}`}
                              alt={vid.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Title at bottom */}
                          <p style={{
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            margin: 0,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.3,
                          }}>
                            {vid.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => setRecommendedIndex(Math.min(recommendedVideos.length - 3, recommendedIndex + 1))}
                    disabled={recommendedIndex >= recommendedVideos.length - 3}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: recommendedIndex >= recommendedVideos.length - 3 ? 'rgba(255,255,255,0.05)' : '#008ddf',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      cursor: recommendedIndex >= recommendedVideos.length - 3 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      opacity: recommendedIndex >= recommendedVideos.length - 3 ? 0.4 : 1,
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => recommendedIndex < recommendedVideos.length - 3 && (e.currentTarget.style.background = 'rgba(0, 141, 223, 0.8)')}
                    onMouseLeave={e => recommendedIndex < recommendedVideos.length - 3 && (e.currentTarget.style.background = '#008ddf')}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Edit Video Modal */}
      {showEditVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
          onClick={e => { if (e.target === e.currentTarget) setShowEditVideo(false); }}>
          <div style={{ background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', color: '#ffffff' }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Edit Video</h2>
            <form onSubmit={handleEditVideoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Title', key: 'title', type: 'text' },
                { label: 'Sport', key: 'sport', type: 'text' },
                { label: 'Tags', key: 'tags', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>{label}</label>
                  <input
                    type={type}
                    value={editVideoData[key as keyof typeof editVideoData]}
                    onChange={e => setEditVideoData(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', padding: '0.55rem 0.75rem', outline: 'none' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  rows={4}
                  value={editVideoData.description}
                  onChange={e => setEditVideoData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', padding: '0.55rem 0.75rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowEditVideo(false)}
                  style={{ padding: '0.5rem 1.1rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
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
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
          <div style={{ background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '380px', color: '#ffffff', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700 }}>Delete Video?</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>This action cannot be undone. The video will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '0.5rem 1.3rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteVideo} disabled={deletingVideo}
                style={{ padding: '0.5rem 1.3rem', background: 'rgba(248,113,113,0.8)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: deletingVideo ? 'not-allowed' : 'pointer', opacity: deletingVideo ? 0.6 : 1 }}>
                {deletingVideo ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
