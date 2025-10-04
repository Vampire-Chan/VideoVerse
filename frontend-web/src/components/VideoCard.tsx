
import { Card, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getAvatarPlaceholder } from '../utils/placeholderGenerator';
import styles from './VideoCard.module.css'; // Import the CSS module

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  uploader: string;
  views: number;
  createdAt: string;
  uploaderAvatarUrl?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ id, title, thumbnailUrl, uploader, views, createdAt, uploaderAvatarUrl }) => {
  const { theme } = useTheme();
  const formattedViews = new Intl.NumberFormat().format(views);
  const timeAgo = new Date(createdAt).toLocaleDateString(); // Simple date format for now

  return (
    <Col md={4} className="mb-4">
    <Card className={`${theme === 'dark' ? 'bg-dark text-white' : ''} mb-3 border-0 ${styles.card}`}>
        <Link to={`/watch/${id}`}>
          <Card.Img variant="top" src={thumbnailUrl} alt={title} style={{ height: '180px', objectFit: 'cover' }} />
        </Link>
        <Card.Body>
          <Card.Title as={Link} to={`/watch/${id}`} style={{ fontSize: '1.1rem' }}>{title}</Card.Title>
          <div className="d-flex align-items-center mt-2">
            <img
              src={uploaderAvatarUrl || getAvatarPlaceholder(uploader)}
              alt={`${uploader}'s Avatar`}
              className="rounded-circle me-2"
              style={{ width: '30px', height: '30px' }}
            />
            <Card.Text className="text-muted m-0" style={{ fontSize: '0.9rem' }}>
              <Link to={`/profile/${uploader}`} className="text-muted text-decoration-none">{uploader}</Link>
            </Card.Text>
          </div>
          <Card.Text className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
            {formattedViews} views • {timeAgo}
          </Card.Text>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default VideoCard;
