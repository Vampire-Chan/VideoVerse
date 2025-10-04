import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import styles from './LiveNotifications.module.css';

interface Notification {
  id: number;
  message: string;
  type: string;
  created_at: string;
}

const LiveNotifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000');
    setSocket(newSocket);

    // Join user's notification room
    newSocket.emit('join', `user-${currentUser.id}`);

    // Listen for new notifications
    newSocket.on('newNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      setUnreadCount(prev => Math.min(prev + 1, 99));
      
      // Show toast
      const toast = document.createElement('div');
      toast.className = styles.notificationToast;
      toast.innerHTML = `
        <div class="${styles.toastContent}">
          <i class="bi bi-bell-fill"></i>
          <span>${notification.message}</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add(styles.show), 100);
      setTimeout(() => {
        toast.classList.remove(styles.show);
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  const handleClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  if (!currentUser) return null;

  return (
    <div className={styles.liveNotifications}>
      <div className={styles.notificationBell} onClick={handleClick}>
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <Badge bg="danger" className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
      
      {showNotifications && (
        <div className={styles.notificationPanel}>
          <div className={styles.panelHeader}>
            <h6>Notifications</h6>
            <button onClick={() => setShowNotifications(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className={styles.notificationList}>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className={styles.notificationItem}>
                  <p>{notif.message}</p>
                  <small>{new Date(notif.created_at).toLocaleString()}</small>
                </div>
              ))
            ) : (
              <p className="text-center text-muted p-3">No notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveNotifications;
