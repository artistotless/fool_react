import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MessageToast, MessageType } from 'src/components/ui/Toast';

interface ToastContextProps {
  showToast: (message: string, type?: MessageType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

interface Toast {
  id: number;
  message: string;
  type: MessageType;
  duration: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastId, setLastId] = useState(0);

  const showToast = useCallback((message: string, type: MessageType = 'neutral', duration: number = 3000) => {
    const id = lastId + 1;
    setLastId(id);
    
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, [lastId]);

  const handleClose = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Контейнер для тостов */}
      <div className="toast-container">
        {toasts.map(toast => (
          <MessageToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => handleClose(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 