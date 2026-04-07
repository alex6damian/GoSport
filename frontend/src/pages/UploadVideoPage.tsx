import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import homeBg from '../assets/home.png';
import { uploadVideo } from '../services/videoService';
import { AxiosError } from 'axios';

const UploadVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    tags: '',
  });

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid video file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const thumbnailFile = files[0];
      if (thumbnailFile.type.startsWith('image/')) {
        setThumbnail(thumbnailFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result as string);
        };
        reader.readAsDataURL(thumbnailFile);
        setError(null);
      } else {
        setError('Please select a valid image file for thumbnail');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadVideo(
        file,
        formData.title,
        formData.description,
        formData.sport,
        formData.tags,
        thumbnail || undefined,
        (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      setSuccess(true);
      setFile(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      setFormData({ title: '', description: '', sport: '', tags: '' });
      setUploadProgress(0);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/browse');
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      if (axiosError.response?.data?.error) {
        setError(axiosError.response.data.error);
      } else if (axiosError.message) {
        setError(axiosError.message);
      } else {
        setError('Failed to upload video. Please try again.');
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
      alignItems: 'center',
      justifyContent: 'center',
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

      {/* Upload card */}
      <div style={{
        position: 'relative',
        maxWidth: '450px',
        width: '90%',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            marginBottom: '0.25rem',
            letterSpacing: '-1px',
          }}>
            Upload Video
          </h1>
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
          }}>
            Share your sports moments with the community
          </p>
        </div>

        {success && (
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

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(248,113,113,0.15)',
            borderLeft: '4px solid #f87171',
            color: '#fca5a5',
            fontSize: '0.85rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {/* File Upload */}
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
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                position: 'relative',
                border: `2px dashed ${isDragging ? '#008ddf' : 'rgba(255,255,255,0.3)'}`,
                borderRadius: '8px',
              padding: '0.6rem',
                textAlign: 'center',
                background: isDragging ? 'rgba(0,141,223,0.1)' : 'rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
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
                {file ? (
                  <>
                    <p style={{ color: '#008ddf', fontWeight: 600, margin: '0.1rem 0', fontSize: '0.7rem' }}>
                      {file.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', margin: 0 }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
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
                onChange={handleThumbnailChange}
                disabled={uploading}
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: 0,
                }}
              />
              <div style={{ pointerEvents: 'none' }}>
                {thumbnailPreview ? (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '80px',
                        borderRadius: '6px',
                        marginBottom: '0.3rem',
                      }}
                    />
                    <p style={{ color: '#008ddf', fontWeight: 500, margin: '0.1rem 0', fontSize: '0.7rem' }}>
                      {thumbnail?.name}
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
              value={formData.title}
              onChange={handleInputChange}
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
              value={formData.description}
              onChange={handleInputChange}
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
              value={formData.sport}
              onChange={handleInputChange}
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
              value={formData.tags}
              onChange={handleInputChange}
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
              disabled={uploading || !file}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: '#e63946',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: uploading || !file ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(230,57,70,0.35)',
                transition: 'all 0.2s ease',
                opacity: uploading || !file ? 0.6 : 1,
              }}
              onMouseEnter={e => !uploading && !file === false && (e.currentTarget.style.background = '#c1121f', e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => !uploading && !file === false && (e.currentTarget.style.background = '#e63946', e.currentTarget.style.transform = 'translateY(0)')}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/browse')}
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
    </div>
  );
};

export default UploadVideoPage;
