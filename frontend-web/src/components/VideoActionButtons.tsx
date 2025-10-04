import React from 'react';
import { Button } from 'react-bootstrap';
import styles from './VideoActionButtons.module.css';
import { UserInfo } from '../context/AuthContext'; // Import UserInfo

interface VideoActionButtonsProps {
  likes: number;
  dislikes: number;
  isWatching: boolean;
  handleWatchToggle: () => void;
  isOwner: boolean | null;
  currentUser: UserInfo | null; // Changed from JwtPayload | null
  handleLike: () => void;
  handleDislike: () => void;
}

const VideoActionButtons: React.FC<VideoActionButtonsProps> = ({
  likes,
  dislikes,
  isWatching,
  handleWatchToggle,
  isOwner,
  currentUser,
  handleLike,
  handleDislike,
}) => {
  return (
    <div className={styles.actionButtonsGroup}>
      <Button variant="light" className={styles.iconButton} onClick={handleLike}>
        <i className="bi bi-hand-thumbs-up"></i> {likes}
      </Button>
      <Button variant="light" className={styles.iconButton} onClick={handleDislike}>
        <i className="bi bi-hand-thumbs-down"></i> {dislikes}
      </Button>
      <Button variant="light" className={styles.iconButton}>
        <i className="bi bi-share"></i>
      </Button>

      {!isOwner && currentUser && (
        <Button variant={isWatching ? 'outline-secondary' : 'danger'} onClick={handleWatchToggle} className={styles.watchButton}>
          {isWatching ? 'Watching' : 'Watch'}
        </Button>
      )}
    </div>
  );
};

export default VideoActionButtons;
