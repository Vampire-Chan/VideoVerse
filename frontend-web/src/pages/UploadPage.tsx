
import React, { useState } from 'react';
import { Container, Form, Button, Card, ProgressBar, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const UploadPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !description || !videoFile) {
      setError('Please fill in all fields and select a video file.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);

    try {
      await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
      setSuccess('Video uploaded successfully!');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setUploadProgress(0);
      // Optionally redirect to home or video page
      // navigate('/');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload video.');
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Upload New Video</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="videoTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="videoDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter video description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="videoFile">
              <Form.Label>Video File</Form.Label>
              <Form.Control
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                required
              />
            </Form.Group>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} className="mb-3" />
            )}

            <Button variant="primary" type="submit" className="w-100">
              Upload Video
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UploadPage;
