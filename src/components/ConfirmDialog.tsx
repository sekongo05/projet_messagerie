import { FiAlertTriangle, FiX } from 'react-icons/fi';

type ConfirmDialogProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme?: 'light' | 'dark';
};

export const ConfirmDialog = ({
  isOpen,
  title = 'Confirmer l\'action',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  theme = 'light',
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const overlayBg = theme === 'dark' ? 'bg-black/50' : 'bg-black/30';
  const modalBg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-50 ${overlayBg} backdrop-blur-sm transition-opacity`}
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`${modalBg} rounded-xl shadow-2xl border ${borderColor} max-w-md w-full p-6 pointer-events-auto transform transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'} flex-shrink-0`}>
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className={`${textColor} font-semibold text-lg mb-1`}>
                {title}
              </h3>
              <p className={`${textSecondary} text-sm`}>
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              className={`p-1 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              aria-label="Fermer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
