import React, { createContext, useContext, useState, useCallback } from 'react';
import { GlobalToast, ToastType } from './GlobalToast';

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number, details?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    details?: string;
    type: ToastType;
    duration: number;
    visible: boolean;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType, duration = 5000, details?: string) => {
    setToast({ message, details, type, duration, visible: true });
  }, []);

  const handleClose = () => {
    setToast((prev) => prev ? { ...prev, visible: false } : null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && toast.visible && (
        <GlobalToast
          message={toast.message}
          details={toast.details}
          type={toast.type}
          duration={toast.duration}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
} 