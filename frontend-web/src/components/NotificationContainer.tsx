import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  message: string;
  type: string; // e.g., 'NEW_VIDEO', 'NEW_COMMENT'
  related_entity_id?: string; // ID of video, comment, etc.
  related_entity_type?: string; // e.g., 'video', 'comment'
}

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io('http://localhost:3000'); // Connect to backend Socket.IO

    socket.on('newNotification', (notification: Notification) => {
      setNotifications((prev) => [...prev, { ...notification, id: Date.now().toString() }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClick = (notification: Notification) => {
    handleClose(notification.id);
    if (notification.related_entity_type === 'video' && notification.related_entity_id) {
      navigate(`/watch/${notification.related_entity_id}`);
    } else if (notification.related_entity_type === 'comment' && notification.related_entity_id) {
      // Example: navigate to video and scroll to comment
      navigate(`/watch/${notification.related_entity_id}`); // Assuming comment ID can lead to video
    } else if (notification.related_entity_type === 'user' && notification.related_entity_id) {
      navigate(`/profile/${notification.related_entity_id}`); // Assuming user ID can lead to profile
    }
    // Add more navigation logic for other types
  };

  return (
    <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1050 }}>
      {notifications.map((notification) => (
        <Toast key={notification.id} show={true} onClose={() => handleClose(notification.id)} delay={5000} autohide>
          <Toast.Header closeButton>
            <strong className="me-auto">New Notification</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body onClick={() => handleClick(notification)} style={{ cursor: 'pointer' }}>
            {notification.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default NotificationContainer;
