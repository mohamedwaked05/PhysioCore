import React from 'react';

const MaleSVG = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="#3b82f6"/>
    <circle cx="24" cy="18" r="8" fill="rgba(255,255,255,0.9)"/>
    <ellipse cx="24" cy="38" rx="13" ry="10" fill="rgba(255,255,255,0.9)"/>
  </svg>
);

const FemaleSVG = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="#ec4899"/>
    <circle cx="24" cy="18" r="8" fill="rgba(255,255,255,0.9)"/>
    <path d="M11 42 Q11 30 24 30 Q37 30 37 42" fill="rgba(255,255,255,0.9)"/>
    <path d="M15 30 Q12 34 11 38" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"/>
    <path d="M33 30 Q36 34 37 38" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const GenderAvatar = ({ gender, size = 40, className = '', style = {} }) => {
  const isFemale = gender === 'female' || gender === 'Female' || gender === 'FEMALE';
  return (
    <div className={className} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'inline-flex', ...style }}>
      {isFemale ? <FemaleSVG size={size} /> : <MaleSVG size={size} />}
    </div>
  );
};

export default GenderAvatar;
