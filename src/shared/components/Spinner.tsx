import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  inline?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Đang xử lý...',
  inline = false
}) => {
  const sizeClass = `spinner-${size}`;

  if (inline) {
    return (
      <div className="spinner-inline">
        <div className={`spinner-circle ${sizeClass}`}></div>
        {label && <span className="spinner-label">{label}</span>}
      </div>
    );
  }

  return (
    <div className="spinner-overlay">
      <div className="spinner-card">
        <div className={`spinner-circle ${sizeClass}`}></div>
        {label && <p className="spinner-label">{label}</p>}
      </div>
    </div>
  );
};
