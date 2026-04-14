'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error';
};

type ToastContextType = {
  toast: (message: string, type?: 'success' | 'error') => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in rounded-lg border px-4 py-3 text-[13px] shadow-card max-w-sm ${
              t.type === 'success'
                ? 'bg-positive/5 border-positive/15 text-positive'
                : 'bg-negative/5 border-negative/15 text-negative'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}