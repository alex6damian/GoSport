import React from 'react';
import { Link } from 'react-router-dom';
import homeBg from '../assets/home.png';

const HomePage: React.FC = () => {
  return (
    <div
      style={{
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
      }}
    >
      {/* Dark overlay — gradient de jos în sus pentru depth */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Badge sus */}
<div style={{
  position: 'absolute',
  top: '2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2,
}}>
  <span style={{
    display: 'inline-block',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    padding: '0.35rem 1rem',
    borderRadius: '999px',
  }}>
    Create · Explore · Enjoy
  </span>
</div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0',
      }}>

        {/* Titlu */}
        <h1 style={{
          fontSize: 'clamp(3.5rem, 8vw, 7rem)',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-3px',
          margin: '0 0 0.5rem',
          lineHeight: 1,
          fontFamily: "'Inter', sans-serif",
          textShadow: 'none',
        }}>
          <span style={{ color: '#008ddf' }}>GO</span><span style={{ color: '#e63946' }}>SPORT</span>
        </h1>
        {/* Butoane */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              background: '#e63946',
              color: '#fff',
              fontWeight: 600,
              padding: '0.8rem 2rem',
              borderRadius: '0.4rem',
              fontSize: '0.7rem',
              textDecoration: 'none',
              letterSpacing: '0.01em',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 20px rgba(230,57,70,0.4)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#c1121f';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(230,57,70,0.55)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#e63946';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(230,57,70,0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get started
          </Link>

          <Link
            to="/browse"
            style={{
              display: 'inline-block',
              background: '#008ddf',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              fontWeight: 600,
              padding: '0.8rem 2rem',
              borderRadius: '0.4rem',
              fontSize: '0.7rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              letterSpacing: '0.01em',
              boxShadow: '0 4px 20px rgba(0,141,223,0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#0070b3';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,141,223,0.55)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#008ddf';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Explore
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HomePage;