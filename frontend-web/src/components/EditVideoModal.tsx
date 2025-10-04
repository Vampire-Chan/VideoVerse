
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import api from '../services/api';

interface EditVideoModalProps {
  show: boolean;
  handleClose: () => void;
  video: {
    id: string;
    title: string;
    description: string;
    visibility: string;
    category: string;
  } | null;
  onVideoUpdated: () => void;
}

const categories = ['All', 'Gaming', 'Govt', 'Defence', 'Music', 'News', 'Sports', 'Education'];

const EditVideoModal: React.FC<EditVideoModalProps> = ({ show, handleClose, video, onVideoUpdated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [category, setCategory] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description);
      setVisibility(video.visibility);
      setCategory(video.category);
    }
  }, [video]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!video) {
      setError('No video selected for editing.');
      setLoading(false);
      return;
    }

    try {
      await api.put(`/videos/${video.id}`, {
        title,
        description,
        visibility,
        category,
      });
      onVideoUpdated();
      handleClose();
    } catch (err: any) {
      console.error('Error updating video:', err);
      setError(err.response?.data?.message || 'Failed to update video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Video</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="editVideoTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="editVideoDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="editVideoVisibility">
            <Form.Label>Visibility</Form.Label>
            <Form.Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="Unlisted">Unlisted</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="editVideoCategory">
            <Form.Label>Category</Form.Label>
            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditVideoModal;
