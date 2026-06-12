'use client';

import React from 'react';

export default function RootLoading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      pointerEvents: 'none'
    }}>
      <div style={{
        height: '3.5px',
        background: 'linear-gradient(90deg, #cc2200 0%, #ff4d4d 50%, #cc2200 100%)',
        width: '100%',
        animation: 'loadingProgress 1.5s ease-in-out infinite',
        boxShadow: '0 1px 10px rgba(204, 34, 0, 0.4)'
      }} />
      <style>{`
        @keyframes loadingProgress {
          0% { width: 0%; left: 0%; transform: translateX(-100%); }
          50% { width: 70%; left: 15%; transform: translateX(0%); }
          100% { width: 100%; left: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
