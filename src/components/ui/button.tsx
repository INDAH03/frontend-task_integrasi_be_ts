import React from 'react';
import classNames from 'classnames';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
};

export const Button = ({
  children,
  onClick,
  className,
  type = 'button',
  variant = 'default',
  size = 'md',
  disabled = false,
}: ButtonProps) => {
  const variantClasses = {
    default: 'bg-gray-300 text-black',
    primary: 'bg-blue-600 text-white',
    danger: 'bg-red-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'rounded shadow',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
};
