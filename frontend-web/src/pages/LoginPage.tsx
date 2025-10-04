import React from 'react';
import { Container, Card } from 'react-bootstrap';
import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card style={{ width: '25rem' }} className="p-4 shadow-lg">
        <h2 className="text-center mb-4">Login</h2>
        <LoginForm onSuccess={handleLoginSuccess} />
      </Card>
    </Container>
  );
};

export default LoginPage;
