import React from 'react';
import { Container, Card } from 'react-bootstrap';
import RegisterForm from '../components/RegisterForm';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/');
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card style={{ width: '25rem' }} className="p-4 shadow-lg">
        <h2 className="text-center mb-4">Register</h2>
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </Card>
    </Container>
  );
};

export default RegisterPage;
