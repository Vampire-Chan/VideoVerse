import React, { useState, useCallback } from 'react';
import { Modal, Button, Form, ProgressBar, Alert } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import './UploadModal.css';

interface UploadModalProps {
  show: boolean;
  handleClose: () => void;
  onUploadComplete: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const calculateETA = (loaded: number, total: number, startTime: number | null) => {
  if (!startTime || loaded === 0 || total === 0) return '--:--';

  const timeElapsed = (Date.now() - startTime) / 1000; // in seconds
  const uploadSpeed = loaded / timeElapsed; // bytes per second
  const remainingBytes = total - loaded;
  const etaSeconds = remainingBytes / uploadSpeed;

  if (etaSeconds === Infinity || isNaN(etaSeconds)) return '--:--';

  const minutes = Math.floor(etaSeconds / 60);
  const seconds = Math.floor(etaSeconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const UploadModal: React.FC<UploadModalProps> = ({ show, handleClose, onUploadComplete }) => {
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState(0); // New state for upload speed
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setVideoFile(acceptedFiles[0]);
      setStep(2);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': []
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!videoFile) return;

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('description', description);

    setIsUploading(true);
    setError('');
    setStep(3);
    setUploadStartTime(Date.now());

    try {
      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            setUploadedBytes(progressEvent.loaded);

            // Calculate upload speed
            if (uploadStartTime) {
              const timeElapsed = (Date.now() - uploadStartTime) / 1000; // in seconds
              if (timeElapsed > 0) {
                const currentSpeed = progressEvent.loaded / timeElapsed; // bytes per second
                setUploadSpeed(currentSpeed);
              }
            }
            console.log(`Loaded: ${progressEvent.loaded}, Total: ${progressEvent.total}, Percent: ${percentCompleted}%`);
          }
        },
      });

      if (response.status === 201) {
        onUploadComplete();
        handleClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setStep(2); // Go back to details step on error
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setVideoFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setUploadedBytes(0);
    setError('');
    setUploadStartTime(null);
    setIsUploading(false);
  };

  return (
    <Modal show={show} onHide={handleClose} onExited={resetState} centered size="lg" className="upload-modal">
      <Modal.Header closeButton>
        <Modal.Title>{step === 1 ? 'Upload Video' : step === 2 ? 'Video Details' : 'Uploading'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className={`step-container ${step === 1 ? 'active' : ''}`}>
          <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
            <input {...getInputProps()} />
            <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '4rem' }}></i>
            <p>Drag & drop a video file here, or click to select a file</p>
          </div>
        </div>

        <div className={`step-container ${step === 2 ? 'active' : ''}`}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Tell viewers about your video"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </div>

        <div className={`step-container ${step === 3 ? 'active' : ''}`}>
            <div className="text-center">
                <p>Uploading your video...</p>
                {videoFile && (
                  <p className="text-muted small">
                    {formatFileSize(uploadedBytes)} / {formatFileSize(videoFile.size)}
                    {uploadStartTime && ` (Speed: ${formatFileSize(uploadSpeed)}/s, ETA: ${calculateETA(uploadedBytes, videoFile.size, uploadStartTime)})`}
                  </p>
                )}
                <ProgressBar animated now={uploadProgress} label={`${uploadProgress}%`} />
            </div>
        </div>

      </Modal.Body>
      <Modal.Footer>
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={isUploading}>
            Back
          </Button>
        )}
        {step === 2 && (
          <Button variant="primary" onClick={handleUpload} disabled={!title || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default UploadModal;
