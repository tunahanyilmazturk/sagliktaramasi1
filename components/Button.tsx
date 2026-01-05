import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = React.memo(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center gap-2 transition-all duration-200';
  
  const variants = {
    primary: 'btn-primary shadow-blue-200 shadow-md',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger shadow-red-200 shadow-md',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';