import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getAvatarPlaceholder } from '../utils/placeholderGenerator';
import { useAuth } from '../context/AuthContext';


interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  is_creator: boolean;
  created_at: string;
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
  created_at: string;
  views: number;
}

interface Comment {
  id: number;
  text: string;
  user_id: number;
  video_id: number;
  created_at: string;
  parent_id: number | null;
}

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'videos' | 'comments'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'video' | 'comment', id: number } | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!currentUser || !currentUser.is_admin) {
      setError('Access denied. Admin privileges required.');
      return;
    }
    
    const fetchData = async () => {
      try {
        const [usersRes, videosRes, commentsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/videos'),
          api.get('/admin/comments')
        ]);
        
        setUsers(usersRes.data);
        setVideos(videosRes.data);
        setComments(commentsRes.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      switch (deleteTarget.type) {
        case 'user':
          await api.delete(`/admin/users/${deleteTarget.id}`);
          setUsers(users.filter(user => user.id !== deleteTarget.id));
          break;
        case 'video':
          await api.delete(`/admin/videos/${deleteTarget.id}`);
          setVideos(videos.filter(video => video.id !== deleteTarget.id));
          break;
        case 'comment':
          await api.delete(`/admin/comments/${deleteTarget.id}`);
          setComments(comments.filter(comment => comment.id !== deleteTarget.id));
          break;
      }
      setShowDeleteModal(false);
    } catch (err) {
      console.error(`Error deleting ${deleteTarget.type}:`, err);
      setError(`Failed to delete ${deleteTarget.type}.`);
    }
  };

  const confirmDelete = (type: 'user' | 'video' | 'comment', id: number) => {
    setDeleteTarget({ type, id });
    setShowDeleteModal(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!currentUser || !currentUser.is_admin) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Access denied. Admin privileges required.</Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Admin Console</h2>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    Users
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                  >
                    Videos
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                  >
                    Comments
                  </button>
                </li>
              </ul>
            </Card.Header>
            <Card.Body>
              {activeTab === 'users' && (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={user.avatar_url || getAvatarPlaceholder(user.username)}
                                alt={`${user.username}'s Avatar`}
                                className="rounded-circle me-2"
                                style={{ width: '30px', height: '30px' }}
                              />
                              {user.username}
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            {user.is_admin && <span className="badge bg-danger me-1">Admin</span>}
                            {user.is_creator && <span className="badge bg-primary me-1">Creator</span>}
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => confirmDelete('user', user.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {activeTab === 'videos' && (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Uploader</th>
                        <th>Views</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map(video => (
                        <tr key={video.id}>
                          <td>{video.id}</td>
                          <td>
                            <Link to={`/watch/${video.id}`} target="_blank">
                              {video.title}
                            </Link>
                          </td>
                          <td>{video.uploader}</td>
                          <td>{video.views}</td>
                          <td>{formatDate(video.created_at)}</td>
                          <td>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => confirmDelete('video', video.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {activeTab === 'comments' && (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Content</th>
                        <th>Author</th>
                        <th>Video</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map(comment => (
                        <tr key={comment.id}>
                          <td>{comment.id}</td>
                          <td>{comment.text.substring(0, 50)}{comment.text.length > 50 ? '...' : ''}</td>
                          <td>User {comment.user_id}</td>
                          <td>Video {comment.video_id}</td>
                          <td>{formatDate(comment.created_at)}</td>
                          <td>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => confirmDelete('comment', comment.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel;