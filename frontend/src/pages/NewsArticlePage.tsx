import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getNewsArticle, getNews, type NewsArticle } from '../services/newsService';
import homeBg from '../assets/home.png';

const NewsArticlePage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) return;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getNewsArticle(Number(articleId));
        const art: NewsArticle = res.data?.article || res.data;
        setArticle(art);
        if (art?.sport) {
          try {
            const relRes = await getNews(1, 6, art.sport);
            setRelated((relRes.data?.articles || []).filter((a: NewsArticle) => a.id !== art.id).slice(0, 4));
          } catch {}
        }
      } catch {
        setError('Article not found.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [articleId]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${homeBg})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
        <span style={{ position: 'relative', color: '#fff', fontSize: '1.1rem' }}>Loading...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${homeBg})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>{error || 'Article not found.'}</p>
          <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1.2rem', background: '#008ddf', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${homeBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', overflowY: 'auto', zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back
        </button>

        {/* Sport badge */}
        {article.sport && (
          <span style={{ display: 'inline-block', background: 'rgba(0,212,255,0.2)', color: '#00d4ff', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'capitalize' }}>
            {article.sport}
          </span>
        )}

        {/* Title */}
        <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, margin: '0 0 1rem' }}>
          {article.title}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {article.author && <span>By {article.author}</span>}
          {article.source && <span>· {article.source}</span>}
          <span>· {formatDate(article.published_at)}</span>
        </div>

        {/* Hero image */}
        {article.image_url && (
          <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', maxHeight: '420px' }}>
            <img src={article.image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Summary */}
        {article.summary && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid #00d4ff', paddingLeft: '1rem', marginBottom: '1.75rem' }}>
            {article.summary}
          </p>
        )}

        {/* Content */}
        {article.content && (
          <div
            className="news-content"
            style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.97rem', lineHeight: 1.8, marginBottom: '2rem' }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* Source link */}
        {article.source_url && (
          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#00d4ff', fontSize: '0.88rem', textDecoration: 'none', borderBottom: '1px solid rgba(0,212,255,0.4)', paddingBottom: '1px' }}>
            Read original article →
          </a>
        )}

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Related Articles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {related.map(rel => (
                <Link key={rel.id} to={`/news/${rel.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}>
                    {rel.image_url && (
                      <div style={{ height: '100px', overflow: 'hidden' }}>
                        <img src={rel.image_url} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '0.75rem' }}>
                      <p style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rel.title}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', margin: '0.35rem 0 0' }}>
                        {formatDate(rel.published_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsArticlePage;
