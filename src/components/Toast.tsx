import { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastProps = {
  toast: Toast;
  onClose: (id: string) => void;
  theme?: 'light' | 'dark';
};

const ToastComponent = ({ toast, onClose, theme = 'light' }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setIsVisible(true);

    // Auto-fermeture après la durée spécifiée
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300); // Attendre la fin de l'animation
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = 'flex items-start gap-3 p-4 rounded-lg shadow-lg border min-w-[300px] max-w-[500px] transition-all duration-300';
    
    if (!isVisible) {
      return `${baseStyles} opacity-0 translate-x-full`;
    }

    switch (toast.type) {
      case 'success':
        return theme === 'dark'
          ? `${baseStyles} bg-green-900/90 border-green-700 text-green-100`
          : `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return theme === 'dark'
          ? `${baseStyles} bg-red-900/90 border-red-700 text-red-100`
          : `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return theme === 'dark'
          ? `${baseStyles} bg-orange-900/90 border-orange-700 text-orange-100`
          : `${baseStyles} bg-orange-50 border-orange-200 text-orange-800`;
      case 'info':
      default:
        return theme === 'dark'
          ? `${baseStyles} bg-blue-900/90 border-blue-700 text-blue-100`
          : `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    const iconSize = 'w-5 h-5';
    switch (toast.type) {
      case 'success':
        return <FiCheckCircle className={`${iconSize} flex-shrink-0`} />;
      case 'error':
        return <FiXCircle className={`${iconSize} flex-shrink-0`} />;
      case 'warning':
        return <FiAlertCircle className={`${iconSize} flex-shrink-0`} />;
      case 'info':
      default:
        return <FiInfo className={`${iconSize} flex-shrink-0`} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors ${
          theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Fermer"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

type ToastContainerProps = {
  toasts: Toast[];
  onClose: (id: string) => void;
  theme?: 'light' | 'dark';
};

export const ToastContainer = ({ toasts, onClose, theme = 'light' }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={onClose} theme={theme} />
        </div>
      ))}
    </div>
  );
};

// Hook pour gérer les toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string, duration?: number) => showToast(message, 'success', duration);
  const error = (message: string, duration?: number) => showToast(message, 'error', duration);
  const warning = (message: string, duration?: number) => showToast(message, 'warning', duration);
  const info = (message: string, duration?: number) => showToast(message, 'info', duration);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};
