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
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const [lastId, setLastId] = useState(0);

  const showToast = useCallback((message: string, type: MessageType = 'neutral', duration: number = 3000) => {
    const id = lastId + 1;
    setLastId(id);
    
    setCurrentToast({ id, message, type, duration });
  }, [lastId]);

  const handleClose = useCallback(() => {
    setCurrentToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Контейнер для тостов */}
      <div className="toast-container">
        {currentToast && (
          <MessageToast
            key={currentToast.id}
            message={currentToast.message}
            type={currentToast.type}
            duration={currentToast.duration}
            onClose={handleClose}
          />
        )}
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