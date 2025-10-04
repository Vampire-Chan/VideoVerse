import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 text-center">
      <Row>
        <Col>
          <h1 className="display-1">404</h1>
          <h2 className="mb-4">Page Not Found</h2>
          <p className="lead mb-4">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Button href="/" variant="primary">
            Go to Homepage
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
