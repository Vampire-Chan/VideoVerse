import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';
import styles from './SettingsPage.module.css';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [autoplay, setAutoplay] = useState(localStorage.getItem('autoplay') === 'true');
  const [quality, setQuality] = useState(localStorage.getItem('preferredQuality') || 'auto');
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') !== 'false');

  const handleAutoplayChange = (value: boolean) => {
    setAutoplay(value);
    localStorage.setItem('autoplay', String(value));
  };

  const handleQualityChange = (value: string) => {
    setQuality(value);
    localStorage.setItem('preferredQuality', value);
  };

  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem('notifications', String(value));
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Settings</h1>

      <Row>
        <Col lg={8}>
          <Card className={`mb-4 ${styles.settingsCard}`}>
            <Card.Body>
              <h5 className="mb-3">
                <i className="bi bi-palette me-2"></i>Appearance
              </h5>
              <Form.Group className="mb-3">
                <Form.Label>Theme</Form.Label>
                <div className={styles.themeOptions}>
                  <div 
                    className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
                    onClick={theme === 'dark' ? toggleTheme : undefined}
                  >
                    <div className={styles.themePreview} style={{ background: '#fff' }}>
                      <div style={{ background: '#0066ff', height: '8px', borderRadius: '4px' }}></div>
                      <div style={{ background: '#e5e5e5', height: '20px', marginTop: '8px', borderRadius: '4px' }}></div>
                      <div style={{ background: '#f0f0f0', height: '40px', marginTop: '8px', borderRadius: '4px' }}></div>
                    </div>
                    <p className="mb-0 mt-2">Light</p>
                  </div>
                  <div 
                    className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
                    onClick={theme === 'light' ? toggleTheme : undefined}
                  >
                    <div className={styles.themePreview} style={{ background: '#1a1a1a' }}>
                      <div style={{ background: '#3ea6ff', height: '8px', borderRadius: '4px' }}></div>
                      <div style={{ background: '#2a2a2a', height: '20px', marginTop: '8px', borderRadius: '4px' }}></div>
                      <div style={{ background: '#252525', height: '40px', marginTop: '8px', borderRadius: '4px' }}></div>
                    </div>
                    <p className="mb-0 mt-2">Dark</p>
                  </div>
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className={`mb-4 ${styles.settingsCard}`}>
            <Card.Body>
              <h5 className="mb-3">
                <i className="bi bi-play-circle me-2"></i>Playback
              </h5>
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Form.Label className="mb-0">Autoplay</Form.Label>
                    <p className="text-muted small mb-0">Automatically play next video</p>
                  </div>
                  <Form.Check 
                    type="switch"
                    checked={autoplay}
                    onChange={(e) => handleAutoplayChange(e.target.checked)}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label>Preferred Quality</Form.Label>
                <Form.Select 
                  value={quality} 
                  onChange={(e) => handleQualityChange(e.target.value)}
                >
                  <option value="auto">Auto</option>
                  <option value="2160p">4K (2160p)</option>
                  <option value="1440p">2K (1440p)</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                  <option value="360p">360p</option>
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className={`mb-4 ${styles.settingsCard}`}>
            <Card.Body>
              <h5 className="mb-3">
                <i className="bi bi-bell me-2"></i>Notifications
              </h5>
              <Form.Group className="mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Form.Label className="mb-0">Enable Notifications</Form.Label>
                    <p className="text-muted small mb-0">Receive notifications for new content</p>
                  </div>
                  <Form.Check 
                    type="switch"
                    checked={notifications}
                    onChange={(e) => handleNotificationsChange(e.target.checked)}
                  />
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className={`mb-4 ${styles.settingsCard}`}>
            <Card.Body>
              <h5 className="mb-3">
                <i className="bi bi-shield-check me-2"></i>Privacy & Data
              </h5>
              <Button variant="outline-primary" className="me-2 mb-2">Clear Watch History</Button>
              <Button variant="outline-primary" className="mb-2">Clear Search History</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className={styles.infoCard}>
            <Card.Body>
              <h6>About Settings</h6>
              <p className="small text-muted">
                Customize your experience with themes, playback preferences, and notification settings.
                Changes are saved automatically.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage;
