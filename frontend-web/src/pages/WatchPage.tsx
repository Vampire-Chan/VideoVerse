import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VideoActionButtons from '../components/VideoActionButtons';
import CustomVideoControls from '../components/CustomVideoControls';
import styles from './WatchPage.module.css';
import { io } from 'socket.io-client';
import { JwtPayload } from '../services/authService';
import { parseMentionsForMarkdown } from '../utils/mentionParser';
import WatchPageSkeleton from '../components/WatchPageSkeleton';
import { getAvatarPlaceholder } from '../utils/placeholderGenerator';

// Define interfaces
interface Comment {
  id: number;
  text: string;
  user_id: number;
  username?: string;
  author?: string;
  avatar_url?: string;
  author_avatar_url?: string;
  created_at: string;
  parent_id: number | null;
  replies?: Comment[];
}

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: number;
  uploader: string;
  uploader_avatar_url?: string;
  is_creator: boolean;
  is_admin: boolean;
  created_at: string;
  views: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
}

const buildCommentTree = (flatComments: Comment[], parentId: number | null = null): Comment[] => {
  const comments: Comment[] = [];
  for (const comment of flatComments) {
    if (comment.parent_id === parentId) {
      const replies = buildCommentTree(flatComments, comment.id);
      comments.push({ 
        ...comment, 
        username: comment.username || comment.author || 'Anonymous',
        avatar_url: comment.avatar_url || comment.author_avatar_url,
        replies 
      });
    }
  }
  return comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [views, setViews] = useState(0);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('commentAdded', (newComment: Comment) => {
      setComments(prev => buildCommentTree([...prev.flat(), newComment]));
    });
    socket.on('likeUpdated', (data: { likes: number, dislikes: number }) => {
      setLikes(data.likes);
      setDislikes(data.dislikes);
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const [videoRes, commentsRes, allVideosRes] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get(`/videos/${id}/comments`),
          api.get('/videos')
        ]);
        setVideo(videoRes.data);
        setViews(videoRes.data.views || 0);
        setLikes(videoRes.data.likes || 0);
        setDislikes(videoRes.data.dislikes || 0);
        setComments(buildCommentTree(commentsRes.data));
        
        // Filter out current video and get related videos
        const filtered = allVideosRes.data.filter((v: Video) => v.id !== parseInt(id || '0'));
        setRelatedVideos(filtered.slice(0, 10));
        
        if (currentUser) {
          const watchStatusRes = await api.get(`/users/${videoRes.data.user_id}/is-watching`);
          setIsWatching(watchStatusRes.data.isWatching);
        }
      } catch (err) {
        console.error('Error fetching video data:', err);
        setError('Failed to load video data.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideoData();
  }, [id, currentUser]);

  const handleCommentSubmit = async (text: string, parentId: number | null) => {
    if (!currentUser) return setError('You must be logged in to comment.');
    if (text.length > 2000) return setError('Comment cannot exceed 2000 characters.');
    if (!text.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await api.post<Comment>(`/videos/${id}/comments`, { text, parent_id: parentId });
      if (!parentId) setNewCommentText('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    try { await api.post(`/videos/${id}/like`); } catch (err) { console.error(err); }
  };

  const handleDislike = async () => {
    if (!currentUser) return;
    try { await api.post(`/videos/${id}/dislike`); } catch (err) { console.error(err); }
  };

  const handleWatchToggle = async () => {
    if (!video || !currentUser) return;
    try {
      await api.post(`/users/${video.user_id}/${isWatching ? 'unwatch' : 'watch'}`);
      setIsWatching(!isWatching);
    } catch (err) { console.error(err); }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Video controls handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else videoRef.current?.parentElement?.requestFullscreen();
  };

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const timeUpdate = () => setCurrentTime(video.currentTime);
    const durationChange = () => setDuration(video.duration);
    const playEvent = () => setIsPlaying(true);
    const pauseEvent = () => setIsPlaying(false);
    
    video.addEventListener('timeupdate', timeUpdate);
    video.addEventListener('durationchange', durationChange);
    video.addEventListener('play', playEvent);
    video.addEventListener('pause', pauseEvent);
    video.addEventListener('loadedmetadata', durationChange);
    
    return () => {
      video.removeEventListener('timeupdate', timeUpdate);
      video.removeEventListener('durationchange', durationChange);
      video.removeEventListener('play', playEvent);
      video.removeEventListener('pause', pauseEvent);
      video.removeEventListener('loadedmetadata', durationChange);
    };
  }, []);

  const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showUserCard, setShowUserCard] = useState(false);

    const handleReplySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyText.trim()) return;
      handleCommentSubmit(replyText, comment.id);
      setShowReply(false);
      setReplyText('');
    };

    const handleEdit = async () => {
      try {
        await api.put(`/videos/comments/${comment.id}`, { text: editText });
        comment.text = editText;
        setIsEditing(false);
      } catch (err) {
        console.error('Failed to edit comment', err);
      }
    };

    const handleDelete = async () => {
      if (!window.confirm('Delete this comment?')) return;
      try {
        await api.delete(`/videos/comments/${comment.id}`);
        setComments(prev => prev.filter(c => c.id !== comment.id));
      } catch (err) {
        console.error('Failed to delete comment', err);
      }
    };

    const handleReport = () => {
      alert('Comment reported to moderators');
    };

    return (
      <div className={styles.commentItem}>
        <div 
          className={styles.commentAvatarWrapper}
          onMouseEnter={() => setShowUserCard(true)}
          onMouseLeave={() => setShowUserCard(false)}
        >
          <Link to={`/profile/${comment.username}`}>
            <img
              src={comment.avatar_url || getAvatarPlaceholder(comment.username || 'User')}
              alt={`${comment.username}'s Avatar`}
              className={`rounded-circle ${styles.commentAvatar}`}
            />
          </Link>
          {showUserCard && (
            <div className={styles.userCard}>
              <img
                src={comment.avatar_url || getAvatarPlaceholder(comment.username || 'User')}
                alt={comment.username}
                className={styles.userCardAvatar}
              />
              <h6>{comment.username}</h6>
              <Link to={`/profile/${comment.username}`} className="btn btn-sm btn-primary">
                View Profile
              </Link>
            </div>
          )}
        </div>
        <div className={styles.commentContent}>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <Link to={`/profile/${comment.username}`} className={styles.commentAuthor}>
                {comment.username}
              </Link>
              <span className={styles.commentTime}>{formatCommentTime(comment.created_at)}</span>
            </div>
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className={styles.commentMenuButton}>
                <i className="bi bi-three-dots-vertical"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {currentUser && currentUser.username === comment.username && (
                  <>
                    <Dropdown.Item onClick={() => setIsEditing(true)}>
                      <i className="bi bi-pencil me-2"></i>Edit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleDelete} className="text-danger">
                      <i className="bi bi-trash me-2"></i>Delete
                    </Dropdown.Item>
                    <Dropdown.Divider />
                  </>
                )}
                <Dropdown.Item onClick={handleReport}>
                  <i className="bi bi-flag me-2"></i>Report
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          {isEditing ? (
            <div className="mt-2">
              <Form.Control
                as="textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                maxLength={2000}
                rows={2}
              />
              <div className="d-flex justify-content-end mt-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" variant="primary" onClick={handleEdit}>Save</Button>
              </div>
            </div>
          ) : (
            <div className={styles.commentText}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {parseMentionsForMarkdown(comment.text)}
              </ReactMarkdown>
            </div>
          )}
          <Button variant="link" size="sm" onClick={() => setShowReply(!showReply)}>Reply</Button>
          {showReply && (
            <Form onSubmit={handleReplySubmit} className="mt-2">
              <Form.Control
                as="textarea"
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Replying to @${comment.username}`}
                className={styles.commentInput}
                maxLength={2000}
              />
              <div className="d-flex justify-content-end mt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowReply(false)} className="me-2">Cancel</Button>
                <Button variant="primary" size="sm" type="submit" disabled={!replyText.trim()}>Submit</Button>
              </div>
            </Form>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className={styles.repliesContainer}>
              {comment.replies.map(reply => <CommentItem key={reply.id} comment={reply} />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <WatchPageSkeleton />;
  if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!video) return <Container className="mt-4"><Alert variant="warning">Video not found.</Alert></Container>;

  const isOwner = currentUser && currentUser.id === video.user_id;

  return (
    <Container className={styles.watchContainer}>
      <Row>
        <Col lg={isPlayerExpanded ? 12 : 8}>
          <div 
            className={`${styles.videoPlayerContainer} ${isPlayerExpanded ? styles.expanded : ''} ${isTheaterMode ? styles.theaterMode : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setControlsVisible(false)}
          >
            <video 
              ref={videoRef} 
              src={video.video_url} 
              className={styles.videoElement}
              onClick={handlePlayPause}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
            />
            <CustomVideoControls 
                videoRef={videoRef}
                isPlaying={isPlaying}
                volume={volume}
                currentTime={currentTime}
                duration={duration}
                onPlayPause={handlePlayPause}
                onVolumeChange={handleVolumeChange}
                onSeek={handleSeek}
                onToggleFullscreen={handleToggleFullscreen}
                onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                isTheaterMode={isTheaterMode}
                controlsVisible={controlsVisible}
            />
          </div>
          <h1 className={styles.videoTitle}>{video.title}</h1>
          <div className={styles.videoStats}>
            <span>{new Intl.NumberFormat().format(views)} views</span>
            <span> • </span>
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
          </div>
          <div className={styles.channelInfo}>
            <div className={styles.channelDetails}>
              <Link to={`/profile/${video.uploader}`}>
                <img
                  src={video.uploader_avatar_url || getAvatarPlaceholder(video.uploader)}
                  alt={`${video.uploader}'s Avatar`}
                  className={`rounded-circle me-3 ${styles.channelAvatar}`}
                />
              </Link>
              <div>
                <Link to={`/profile/${video.uploader}`} className={`text-decoration-none ${styles.channelName}`}>
                  {video.uploader}
                </Link>
                <div className={styles.channelBadges}>
                  {video.is_creator && <span className="badge bg-primary me-1">Creator</span>}
                  {video.is_admin && <span className="badge bg-danger">Admin</span>}
                </div>
              </div>
            </div>
            <div className={styles.actionButtons}>
              <VideoActionButtons
                likes={likes}
                dislikes={dislikes}
                isWatching={isWatching}
                handleWatchToggle={handleWatchToggle}
                isOwner={isOwner}
                currentUser={currentUser}
                handleLike={handleLike}
                handleDislike={handleDislike}
              />
            </div>
          </div>
          <div className={`${styles.descriptionBox} ${isDescriptionExpanded ? styles.expanded : ''}`}>
            <div className={`${styles.descriptionContent} ${isDescriptionExpanded ? styles.expanded : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{parseMentionsForMarkdown(video.description)}</ReactMarkdown>
            </div>
            {video.description.length > 200 && (
              <Button variant="link" className={styles.showMoreButton} onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                {isDescriptionExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
          <div className={styles.commentsSection}>
            <h3>{comments.length} Comments</h3>
            <div className={styles.commentForm}>
              {currentUser && (
                <img
                  src={currentUser.avatar_url || getAvatarPlaceholder(currentUser.username)}
                  alt="Your avatar"
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px' }}
                />
              )}
              <Form.Control
                as="textarea"
                className={styles.commentInput}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCommentSubmit(newCommentText, null))}
                placeholder="Add a comment... (Markdown supported, max 2000 chars)"
                rows={1}
                maxLength={2000}
                disabled={!currentUser || isSubmittingComment}
              />
              <div className="d-flex justify-content-between align-items-center mt-1">
                <small className="text-muted">{newCommentText.length}/2000</small>
                <Button 
                  size="sm"
                  onClick={() => handleCommentSubmit(newCommentText, null)} 
                  disabled={!newCommentText.trim() || isSubmittingComment || newCommentText.length > 2000}
                >
                  {isSubmittingComment ? <Spinner as="span" size="sm" /> : 'Comment'}
                </Button>
              </div>
            </div>
            <div>
              {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
              {comments.length > 0 && (
                <div className={styles.endMarker}>
                  <hr />
                  <p className="text-center text-muted">— the end —</p>
                </div>
              )}
            </div>
          </div>
        </Col>
        {!isPlayerExpanded && (
          <Col lg={4}>
            <div className={styles.relatedVideosContainer}>
              <h5 className="mb-3">Related Videos</h5>
              {relatedVideos.length > 0 ? (
                relatedVideos.map((relatedVideo) => (
                  <Card 
                    key={relatedVideo.id} 
                    className={`mb-3 ${styles.relatedVideoCard}`}
                    onClick={() => navigate(`/watch/${relatedVideo.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Row className="g-0">
                      <Col xs={5}>
                        <img 
                          src={relatedVideo.thumbnail_url || getAvatarPlaceholder(relatedVideo.title)} 
                          alt={relatedVideo.title}
                          className={styles.relatedVideoThumbnail}
                        />
                      </Col>
                      <Col xs={7}>
                        <Card.Body className="p-2">
                          <Card.Title className={styles.relatedVideoTitle}>
                            {relatedVideo.title}
                          </Card.Title>
                          <Card.Text className={styles.relatedVideoInfo}>
                            <div>{relatedVideo.uploader}</div>
                            <div>{new Intl.NumberFormat().format(relatedVideo.views || 0)} views</div>
                          </Card.Text>
                        </Card.Body>
                      </Col>
                    </Row>
                  </Card>
                ))
              ) : null}
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default WatchPage;