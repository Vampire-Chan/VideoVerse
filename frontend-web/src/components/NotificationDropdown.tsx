import React from 'react';
import { Dropdown } from 'react-bootstrap';
import styles from './NotificationDropdown.module.css'; // We'll create this CSS module later

interface NotificationDropdownProps {
  show: boolean;
  onHide: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ show, onHide }) => {
  return (
    <Dropdown show={show} onToggle={onHide} align="end" className={styles.notificationDropdown}>
      <Dropdown.Menu show={show} className={styles.dropdownMenu}>
        <Dropdown.Header>Notifications</Dropdown.Header>
        <Dropdown.Divider />
        <Dropdown.Item>No new notifications</Dropdown.Item>
        {/* Placeholder for future notifications */}
        {/*
        <Dropdown.Item>
          <div className={styles.notificationItem}>
            <div className={styles.notificationContent}>
              <p className={styles.notificationMessage}>User X uploaded a new video!</p>
              <small className={styles.notificationTime}>2 hours ago</small>
            </div>
            <div className={styles.notificationActions}>
              <Button variant="link" size="sm">View</Button>
            </div>
          </div>
        </Dropdown.Item>
        */}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;