'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type NotificationType = 'info' | 'success' | 'error';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: NotificationType) => {
    const id = new Date().getTime();
    setNotifications([...notifications, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50">
        {notifications.map(notification => (
          <div key={notification.id} className={`p-4 rounded-md shadow-lg mb-2 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
