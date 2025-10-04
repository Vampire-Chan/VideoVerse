import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { login } from '../services/authService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { redirectPath, login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      // Pass both token and user data to authLogin
      authLogin(response.data.token);
      // The user data will be set in authLogin if available in token
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
      <Button variant="primary" type="submit" className="w-100">
        Login
      </Button>
    </Form>
  );
};

export default LoginForm;
