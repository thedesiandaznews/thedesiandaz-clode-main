'use client';

import React from 'react';
import Link from 'next/link';
import ResponsiveBanner from './ResponsiveBanner';

interface Block {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
  bgImage?: string;
  buttonText?: string;
  buttonLink?: string;
  body?: string;
  fontSize?: string;
  color?: string;
  headline?: string;
  bgGradient?: string;
  url?: string;
  colsCount?: string;
  cols?: Array<{ title: string; desc: string; btn: string; link: string }>;
  founderName?: string;
  founderTitle?: string;
  founderBio1?: string;
  founderBio2?: string;
  founderQuote?: string;
  founderImage?: string;
  items?: string[];
  adCategory?: string;
  position?: string;
  height?: string;
  style?: string;
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero':
            return (
              <section 
                key={block.id}
                style={{
                  background: block.bgColor || '#1e293b',
                  backgroundImage: block.bgImage ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${block.bgImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: block.textColor || '#ffffff',
                  padding: '80px 24px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  minHeight: '260px'
                }}
              >
                <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px', lineHeight: '1.2', maxWidth: '800px', fontFamily: 'var(--font-heading, inherit)' }}>
                  {block.title}
                </h1>
                {block.subtitle && (
                  <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '24px', maxWidth: '600px', fontWeight: 500 }}>
                    {block.subtitle}
                  </p>
                )}
                {block.buttonText && block.buttonLink && (
                  <Link 
                    href={block.buttonLink}
                    style={{
                      background: block.textColor || '#ffffff',
                      color: block.bgColor || '#1e293b',
                      padding: '12px 30px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      fontSize: '15px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {block.buttonText}
                  </Link>
                )}
              </section>
            );

          case 'text':
            return (
              <div 
                key={block.id}
                style={{
                  fontSize: block.fontSize ? `${block.fontSize}px` : '16px',
                  color: block.color || '#334155',
                  lineHeight: '1.8',
                  marginBottom: '24px',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'justify'
                }}
              >
                {block.body}
              </div>
            );

          case 'notice':
            return (
              <div 
                key={block.id}
                style={{
                  background: block.bgGradient || '#dc2626',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.15)',
                }}
              >
                <i className="fas fa-bullhorn" style={{ fontSize: '18px', flexShrink: 0 }} />
                <span>{block.headline}</span>
              </div>
            );

          case 'video':
            // Parse youtube ID if custom watch link is passed
            let videoSrc = block.url;
            if (block.url?.includes('youtube.com/watch')) {
              const urlObj = new URL(block.url);
              const videoId = urlObj.searchParams.get('v');
              if (videoId) videoSrc = `https://www.youtube.com/embed/${videoId}`;
            } else if (block.url?.includes('youtu.be/')) {
              const parts = block.url.split('/');
              const videoId = parts[parts.length - 1];
              if (videoId) videoSrc = `https://www.youtube.com/embed/${videoId}`;
            }

            return (
              <div 
                key={block.id}
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '56.25%', // 16:9 ratio
                  height: 0,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  marginBottom: '24px'
                }}
              >
                <iframe
                  src={videoSrc}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );

          case 'columns':
            return (
              <div 
                key={block.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
                  gap: '20px',
                  marginBottom: '24px',
                  width: '100%'
                }}
              >
                {block.cols?.map((col, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '24px',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                        {col.title}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
                        {col.desc}
                      </p>
                    </div>
                    {col.btn && col.link && (
                      <Link 
                        href={col.link}
                        style={{
                          background: 'var(--primary)',
                          color: '#ffffff',
                          padding: '8px 20px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          fontSize: '13px',
                          boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
                          width: '100%',
                          display: 'block'
                        }}
                      >
                        {col.btn}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            );

          case 'founder':
            return (
              <section 
                key={block.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '36px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '30px',
                  alignItems: 'start'
                }}
              >
                <img 
                  src={block.founderImage || '/founder.png'} 
                  alt={block.founderName || 'Founder'} 
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #f1f5f9',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                    {block.founderName}
                  </h2>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {block.founderTitle}
                  </div>
                  {block.founderBio1 && (
                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', marginTop: '16px', marginBottom: 0 }}>
                      {block.founderBio1}
                    </p>
                  )}
                  {block.founderBio2 && (
                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', marginTop: '12px', marginBottom: 0 }}>
                      {block.founderBio2}
                    </p>
                  )}
                  {block.founderQuote && (
                    <div 
                      style={{
                        marginTop: '20px',
                        padding: '16px 20px',
                        background: '#fff8f8',
                        borderLeft: '4px solid var(--primary)',
                        borderRadius: '0 12px 12px 0',
                        fontSize: '15px',
                        fontWeight: 600,
                        fontStyle: 'italic',
                        color: '#451a1a',
                        lineHeight: '1.6'
                      }}
                    >
                      &ldquo;{block.founderQuote}&rdquo;
                    </div>
                  )}
                </div>
              </section>
            );

          case 'manifesto':
            return (
              <section 
                key={block.id}
                style={{
                  background: '#1e293b',
                  color: '#ffffff',
                  borderRadius: '16px',
                  padding: '40px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', fontSize: '180px', color: 'rgba(255,255,255,0.03)', fontWeight: 900, userSelect: 'none', pointerEvents: 'none' }}>
                  TDA
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '24px', color: '#ffffff', fontFamily: 'var(--font-heading, inherit)' }}>
                  {block.title || 'Our Manifesto'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {block.items?.map((item, index) => item && (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '14px 20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        transition: 'transform 0.2s, background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(6px)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <div 
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px',
                          flexShrink: 0
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'ad_banner':
            return (
              <div 
                key={block.id}
                style={{
                  margin: '24px auto',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <ResponsiveBanner 
                  categoryName={block.adCategory || 'Home'} 
                  position={parseInt(block.position || '1')} 
                />
              </div>
            );

          case 'spacer':
            const spaceHeight = parseInt(block.height || '30');
            const lineStyle = block.style || 'none';
            return (
              <div 
                key={block.id}
                style={{
                  height: `${spaceHeight}px`,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  position: 'relative'
                }}
              >
                {lineStyle !== 'none' && (
                  <div 
                    style={{
                      width: '100%',
                      height: '1px',
                      borderTop: `1px ${lineStyle} #cbd5e1`
                    }}
                  />
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
