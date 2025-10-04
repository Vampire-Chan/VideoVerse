import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface ModalRegisterFormProps {
    onSuccess: () => void;
    onSwitchToLogin: () => void;
}

const ModalRegisterForm: React.FC<ModalRegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { redirectPath, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await register({ username, email, password });
      login(response.data.token);
      onSuccess();
      window.location.href = redirectPath || '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3" controlId="registerUsername">
        <Form.Label>Username</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerPassword">
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
        Register
      </Button>
      <div className="text-center mt-3">
        <span>Already have an account? </span>
        <Button variant="link" onClick={onSwitchToLogin}>Login</Button>
      </div>

      <hr className="my-4" />
      <p className="text-center text-muted">Or register with:</p>

      <a
        className="btn btn-dark w-100" // Apply Bootstrap button styling
        href="http://localhost:3000/api/auth/github" // Redirect to backend GitHub OAuth
      >
        <i className="fab fa-github me-2"></i> Register with GitHub
      </a>
    </Form>
  );
};

export default ModalRegisterForm;
