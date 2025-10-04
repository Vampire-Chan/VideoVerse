import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const VideoNotFoundPage: React.FC = () => {
  return (
    <Container className="mt-5 text-center">
      <Row>
        <Col>
          <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '5rem' }}></i>
          <h1 className="mt-3">Video Not Found</h1>
          <p className="lead">We're sorry, but the video you're looking for could not be found.</p>
          <p>This might be due to several reasons:</p>
          <ul className="list-unstyled">
            <li>The video has been removed by the uploader.</li>
            <li>The video has been removed due to a terms of service violation.</li>
            <li>The video ID in the URL is incorrect.</li>
          </ul>
          <Link to="/">
            <Button variant="primary" className="mt-3">
              Go to Homepage
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default VideoNotFoundPage;
