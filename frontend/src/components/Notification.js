import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const Notification = ({ message, type, onClose }) => {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slideIn`}>
      <CheckCircle size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-80">
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
