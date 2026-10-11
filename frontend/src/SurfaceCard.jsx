import React from 'react';

/** Low emphasis container for related content. */
export default function SurfaceCard({
  frontContent,
  height = 'auto',
  width = '100%',
  className = '',
  style = {},
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`surface-card ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event);
        }
      } : undefined}
      style={{
        width,
        minHeight: height,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #202020',
        borderRadius: 3,
        padding: '18px 20px',
        transition: 'border-color 160ms ease, background-color 160ms ease',
        ...style,
      }}
    >
      {frontContent}
    </div>
  );
}
