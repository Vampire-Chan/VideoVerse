import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { login } from '../services/authService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ModalLoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const ModalLoginForm: React.FC<ModalLoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { redirectPath, login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      authLogin(response.data.token);
      onSuccess();
      window.location.href = redirectPath || '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log in');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3" controlId="loginEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="loginPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Button variant="primary" type="submit" className="w-100 mb-3">
        Login
      </Button>

      <div className="text-center mt-3">
        <span>Don't have an account? </span>
        <Button variant="link" onClick={onSwitchToRegister}>Register</Button>
      </div>

      <hr className="my-4" />
      <p className="text-center text-muted">Or log in with:</p>

      <a
        className="btn btn-dark w-100" // Apply Bootstrap button styling
        href="http://localhost:3000/api/auth/github" // Redirect to backend GitHub OAuth
      >
        <i className="fab fa-github me-2"></i> Login with GitHub
      </a>
    </Form>
  );
};

export default ModalLoginForm;
