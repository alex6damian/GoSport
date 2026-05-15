import React from 'react';
import { useNavigate } from 'react-router-dom';

const btnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#ffffff',
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
  backdropFilter: 'blur(8px)',
};

const NavButtons: React.FC = () => {
  const navigate = useNavigate();

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      left: '1.25rem',
      display: 'flex',
      gap: '0.4rem',
      zIndex: 10000,
    }}>
      <button
        onClick={() => navigate(-1)}
        title="Go back"
        style={btnStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        ←
      </button>
      <button
        onClick={() => navigate('/browse')}
        title="Home"
        style={btnStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        🏠
      </button>
    </div>
  );
};

export default NavButtons;
