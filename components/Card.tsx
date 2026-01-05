import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, onClick }) => {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="card-header mb-0">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};