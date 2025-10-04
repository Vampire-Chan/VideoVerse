import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Button, Alert, Card, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import EditVideoModal from '../components/EditVideoModal';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import UploadModal from '../components/UploadModal';
import './StudioPage.css';

interface StudioVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  created_at: string;
  visibility: string;
  restrictions: string;
  views: number;
  engagement: number;
  likes: number;
  dislikes: number;
  category: string;
  file_size: number;
  duration: number;
  width: number;
  height: number;
  format: string;
}

interface VideoStats {
  date: string;
  views: number;
  engagement: number;
  likes: number;
}

type SortKey = keyof StudioVideo;

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  if (hh) {
    return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
  }
  return `${mm}:${ss}`;
};


const StudioPage: React.FC = () => {
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<StudioVideo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<StudioVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser, login } = useAuth();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [videoStats, setVideoStats] = useState<VideoStats[]>([]);
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(30);

  const fetchUserVideos = useCallback(async () => {
    if (!currentUser?.is_creator) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<StudioVideo[]>('/studio/my-videos');
      setVideos(response.data);
      if (response.data.length > 0 && !selectedVideo) {
        setSelectedVideo(response.data[0]);
        generateMockStats(response.data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching user videos:', err);
      setError(err.response?.data?.message || 'Failed to load your videos.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedVideo]);

  const generateMockStats = (video: StudioVideo) => {
    const stats: VideoStats[] = [];
    const today = new Date();
    for (let i = chartPeriod - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      stats.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * (video.views / 10)) + 10,
        engagement: Math.floor(Math.random() * (video.engagement / 10)) + 5,
        likes: Math.floor(Math.random() * (video.likes / 10)) + 2,
      });
    }
    setVideoStats(stats);
  };

  const loadVideoMetadata = async (video: StudioVideo) => {
    return new Promise<{ duration: number; width: number; height: number }>((resolve) => {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.src = video.video_url;
      
      videoElement.onloadedmetadata = () => {
        const metadata = {
          duration: Math.floor(videoElement.duration),
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
        };
        videoElement.remove();
        resolve(metadata);
      };

      videoElement.onerror = () => {
        videoElement.remove();
        resolve({ duration: 0, width: 0, height: 0 });
      };
    });
  };

  const getVideoQuality = (video: StudioVideo): string => {
    if (!video.height) return 'Unknown';
    const height = video.height;
    
    if (height >= 4320) return '8K (4320p)';
    if (height >= 2160) return '4K (2160p)';
    if (height >= 1440) return '2K (1440p)';
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    return '360p';
  };

  const handleVideoSelect = (video: StudioVideo) => {
    setSelectedVideo(video);
    generateMockStats(video);
    
    if (!video.duration || !video.width || !video.height) {
      loadVideoMetadata(video).then((metadata) => {
        const updatedVideo = { ...video, ...metadata };
        setSelectedVideo(updatedVideo);
        setVideos(videos.map(v => v.id === video.id ? updatedVideo : v));
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserVideos();
    }
  }, [currentUser, fetchUserVideos]);

  const sortedVideos = useMemo(() => {
    let sortableVideos = [...videos];
    if (sortConfig !== null) {
      sortableVideos.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVideos;
  }, [videos, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleActivateChannel = async () => {
    try {
      const response = await api.post('/users/activate-channel');
      login(); // Trigger re-check of auth status
      window.location.reload();
    } catch (err: any) {
      console.error('Error activating channel:', err);
      setError(err.response?.data?.message || 'Failed to activate channel.');
    }
  };

  const handleEdit = (video: StudioVideo) => {
    setCurrentVideo(video);
    setShowEditModal(true);
  };

  const handleDelete = async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await api.delete(`/videos/${videoId}`);
        fetchUserVideos();
      } catch (err: any) {
        console.error('Error deleting video:', err);
        setError(err.response?.data?.message || 'Failed to delete video.');
      }
    }
  };

  if (!currentUser) {
    return <Spinner message="Loading user data..." />;
  }

  if (!currentUser.is_creator) {
    return (
      <Container className="mt-4 text-center">
        <Card className="p-4">
          <h2>Activate Your Creator Channel</h2>
          <p>To upload and manage videos, you need to activate your creator channel first.</p>
          <Button onClick={handleActivateChannel} variant="primary" size="lg">Activate Channel</Button>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4 studio-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Creator Studio</h1>
        <Button onClick={() => setShowUploadModal(true)} variant="primary">Upload New Video</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={4}>
            <Card className="dashboard-stat-card">
                <div className="stat-value">{videos.length}</div>
                <div className="stat-label">Total Videos</div>
            </Card>
        </Col>
        <Col md={4}>
            <Card className="dashboard-stat-card">
                <div className="stat-value">{videos.reduce((acc, video) => acc + video.views, 0)}</div>
                <div className="stat-label">Total Reach</div>
            </Card>
        </Col>
        <Col md={4}>
            <Card className="dashboard-stat-card">
                <div className="stat-value">{videos.reduce((acc, video) => acc + video.engagement, 0)}</div>
                <div className="stat-label">Total Engagement</div>
            </Card>
        </Col>
      </Row>

      {loading ? (
        <Spinner message="Loading your videos..." />
      ) : (
        <>
          {selectedVideo && (
            <Row className="mb-4">
              <Col lg={5}>
                <Card className="video-preview-card">
                  <div className="mini-video-player">
                    <video src={selectedVideo.video_url} controls className="w-100 h-100" style={{ borderRadius: '12px' }} />
                  </div>
                  <Card.Body>
                    <h5 className="mb-3">{selectedVideo.title}</h5>
                    <div className="video-info-grid">
                      <div className="info-item">
                        <i className="bi bi-clock-history"></i>
                        <div>
                          <div className="info-label">Duration</div>
                          <div className="info-value">{formatDuration(selectedVideo.duration)}</div>
                        </div>
                      </div>
                      <div className="info-item">
                        <i className="bi bi-file-earmark-bar-graph"></i>
                        <div>
                          <div className="info-label">File Size</div>
                          <div className="info-value">{formatFileSize(selectedVideo.file_size)}</div>
                        </div>
                      </div>
                      <div className="info-item">
                        <i className="bi bi-badge-hd"></i>
                        <div>
                          <div className="info-label">Quality</div>
                          <div className="info-value">{getVideoQuality(selectedVideo)}</div>
                        </div>
                      </div>
                      <div className="info-item">
                        <i className="bi bi-calendar-event"></i>
                        <div>
                          <div className="info-label">Uploaded</div>
                          <div className="info-value">{new Date(selectedVideo.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={7}>
                <Card className="analytics-card">
                  <Card.Body>
                    <h5 className="mb-3">Analytics - Last {chartPeriod} Days</h5>
                    <Row className="mb-3">
                      <Col md={4}>
                        <div className="metric-box">
                          <div className="metric-icon views"><i className="bi bi-eye-fill"></i></div>
                          <div className="metric-value">{(selectedVideo.views || 0).toLocaleString()}</div>
                          <div className="metric-label">Total Views</div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="metric-box">
                          <div className="metric-icon engagement"><i className="bi bi-chat-dots-fill"></i></div>
                          <div className="metric-value">{(selectedVideo.engagement || 0).toLocaleString()}</div>
                          <div className="metric-label">Engagement</div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="metric-box">
                          <div className="metric-icon likes"><i className="bi bi-hand-thumbs-up-fill"></i></div>
                          <div className="metric-value">{(selectedVideo.likes || 0).toLocaleString()}</div>
                          <div className="metric-label">Likes</div>
                        </div>
                      </Col>
                    </Row>
                    <div className="chart-container">
                      <div className="chart-controls mb-3">
                        <div className="btn-group" role="group">
                          <button 
                            className={`btn btn-sm btn-outline-primary ${chartPeriod === 7 ? 'active' : ''}`}
                            onClick={() => { setChartPeriod(7); if (selectedVideo) generateMockStats(selectedVideo); }}
                          >
                            Last 7 Days
                          </button>
                          <button 
                            className={`btn btn-sm btn-outline-primary ${chartPeriod === 30 ? 'active' : ''}`}
                            onClick={() => { setChartPeriod(30); if (selectedVideo) generateMockStats(selectedVideo); }}
                          >
                            Last 30 Days
                          </button>
                          <button 
                            className={`btn btn-sm btn-outline-primary ${chartPeriod === 90 ? 'active' : ''}`}
                            onClick={() => { setChartPeriod(90); if (selectedVideo) generateMockStats(selectedVideo); }}
                          >
                            Last 90 Days
                          </button>
                        </div>
                      </div>
                      <svg viewBox="0 0 800 300" className="analytics-chart">
                        <defs>
                          <linearGradient id="viewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3ea6ff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3ea6ff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {videoStats.length > 0 && (() => {
                          const maxViews = Math.max(...videoStats.map(s => s.views));
                          const maxViewIndex = videoStats.findIndex(s => s.views === maxViews);
                          const points = videoStats.map((stat, i) => ({
                            x: (i / (videoStats.length - 1)) * 760 + 20,
                            y: 280 - (stat.views / maxViews) * 240
                          }));
                          const pathData = `M ${points[0].x} 280 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} 280 Z`;
                          const lineData = points.map(p => `${p.x},${p.y}`).join(' ');
                          
                          return (
                            <>
                              <path d={pathData} fill="url(#viewsGradient)" />
                              <polyline points={lineData} fill="none" stroke="#3ea6ff" strokeWidth="3" />
                              {points.map((p, i) => (
                                <g key={i}>
                                  <circle cx={p.x} cy={p.y} r="4" fill="#3ea6ff" stroke="#fff" strokeWidth="2" className="chart-point" />
                                  {i % Math.floor(videoStats.length / 6) === 0 && (
                                    <>
                                      <text x={p.x} y="295" fontSize="10" fill="var(--text-secondary)" textAnchor="middle">
                                        {new Date(videoStats[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </text>
                                      <line x1={p.x} y1="280" x2={p.x} y2="285" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.3" />
                                    </>
                                  )}
                                  <title>{`${videoStats[i].date}: ${videoStats[i].views} views`}</title>
                                </g>
                              ))}
                              {maxViewIndex >= 0 && (
                                <g className="peak-marker">
                                  <circle 
                                    cx={points[maxViewIndex].x} 
                                    cy={points[maxViewIndex].y} 
                                    r="8" 
                                    fill="none" 
                                    stroke="#f59e0b" 
                                    strokeWidth="2"
                                    className="peak-ring"
                                  />
                                  <circle 
                                    cx={points[maxViewIndex].x} 
                                    cy={points[maxViewIndex].y} 
                                    r="6" 
                                    fill="#f59e0b"
                                  />
                                  <line 
                                    x1={points[maxViewIndex].x} 
                                    y1={points[maxViewIndex].y - 15} 
                                    x2={points[maxViewIndex].x} 
                                    y2={points[maxViewIndex].y - 25} 
                                    stroke="#f59e0b" 
                                    strokeWidth="2"
                                  />
                                  <polygon 
                                    points={`${points[maxViewIndex].x},${points[maxViewIndex].y - 25} ${points[maxViewIndex].x - 4},${points[maxViewIndex].y - 32} ${points[maxViewIndex].x + 4},${points[maxViewIndex].y - 32}`}
                                    fill="#f59e0b"
                                  />
                                  <rect
                                    x={points[maxViewIndex].x - 60}
                                    y={points[maxViewIndex].y - 60}
                                    width="120"
                                    height="22"
                                    rx="4"
                                    fill="rgba(245, 158, 11, 0.95)"
                                  />
                                  <text 
                                    x={points[maxViewIndex].x} 
                                    y={points[maxViewIndex].y - 45} 
                                    fontSize="11" 
                                    fill="#fff" 
                                    textAnchor="middle"
                                    fontWeight="600"
                                  >
                                    Peak: {maxViews} views
                                  </text>
                                  <text 
                                    x={points[maxViewIndex].x} 
                                    y={points[maxViewIndex].y - 32} 
                                    fontSize="9" 
                                    fill="#fff" 
                                    textAnchor="middle"
                                  >
                                    {new Date(videoStats[maxViewIndex].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </text>
                                </g>
                              )}
                              <line x1="20" y1="280" x2="780" y2="280" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.2" />
                              <line x1="20" y1="40" x2="780" y2="40" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.1" strokeDasharray="4,4" />
                              <line x1="20" y1="160" x2="780" y2="160" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.1" strokeDasharray="4,4" />
                              <text x="5" y="285" fontSize="10" fill="var(--text-secondary)">0</text>
                              <text x="5" y="45" fontSize="10" fill="var(--text-secondary)">{maxViews}</text>
                              <text x="5" y="165" fontSize="10" fill="var(--text-secondary)">{Math.floor(maxViews / 2)}</text>
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Card>
            <Card.Header>
              <h5 className="mb-0">All Videos</h5>
            </Card.Header>
            <Table responsive hover className="studio-table mb-0">
                <thead>
                    <tr>
                        <th>Video</th>
                        <th onClick={() => requestSort('created_at')} style={{ cursor: 'pointer' }}>
                          Date {sortConfig?.key === 'created_at' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => requestSort('views')} style={{ cursor: 'pointer' }}>
                          Views {sortConfig?.key === 'views' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => requestSort('engagement')} style={{ cursor: 'pointer' }}>
                          Engagement {sortConfig?.key === 'engagement' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => requestSort('likes')} style={{ cursor: 'pointer' }}>
                          Likes {sortConfig?.key === 'likes' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => requestSort('file_size')} style={{ cursor: 'pointer' }}>
                          Size {sortConfig?.key === 'file_size' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                        </th>
                        <th>Quality</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedVideos.length > 0 ? (
                        sortedVideos.map((video) => (
                            <tr 
                              key={video.id} 
                              onClick={() => handleVideoSelect(video)}
                              className={selectedVideo?.id === video.id ? 'table-active' : ''}
                              style={{ cursor: 'pointer' }}
                            >
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="position-relative me-3 thumbnail-wrapper">
                                            <img src={video.thumbnail_url} alt={video.title} className="thumbnail-in-table" />
                                            <div className="thumbnail-overlay">
                                                <div className="duration-badge">{formatDuration(video.duration)}</div>
                                            </div>
                                        </div>
                                        <div className="video-title-wrapper">
                                            <div className="video-title">{video.title}</div>
                                            <div className="video-description">
                                                {video.description.length > 60 ? `${video.description.substring(0, 60)}...` : video.description}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-nowrap">{new Date(video.created_at).toLocaleDateString()}</td>
                                <td><strong>{(video.views || 0).toLocaleString()}</strong></td>
                                <td>{(video.engagement || 0).toLocaleString()}</td>
                                <td>{(video.likes || 0).toLocaleString()}</td>
                                <td className="text-nowrap">{formatFileSize(video.file_size || 0)}</td>
                                <td><span className="quality-badge">{getVideoQuality(video)}</span></td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="action-buttons">
                                      <Button variant="link" size="sm" title="View" onClick={() => navigate(`/watch/${video.id}`)}><i className="bi bi-eye"></i></Button>
                                      <Button variant="link" size="sm" title="Share" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`)}><i className="bi bi-share"></i></Button>
                                      <Button variant="link" size="sm" title="Edit" onClick={() => handleEdit(video)}><i className="bi bi-pencil"></i></Button>
                                      <Button variant="link" size="sm" title="Delete" className="text-danger" onClick={() => handleDelete(video.id)}><i className="bi bi-trash"></i></Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="text-center py-5">
                              <i className="bi bi-camera-video fs-1 text-muted d-block mb-3"></i>
                              <p className="text-muted">You haven't uploaded any videos yet.</p>
                              <Button variant="primary" onClick={() => setShowUploadModal(true)}>Upload Your First Video</Button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Card>
        </>
      )}

      <EditVideoModal
        show={showEditModal}
        handleClose={() => setCurrentVideo(null)}
        video={currentVideo}
        onVideoUpdated={fetchUserVideos}
      />

      <UploadModal
        show={showUploadModal}
        handleClose={() => setShowUploadModal(false)}
        onUploadComplete={fetchUserVideos}
      />

    </Container>
  );
};

export default StudioPage;
