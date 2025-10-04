import React from 'react';
import { Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import ModalLoginForm from './ModalLoginForm'; // Import ModalLoginForm
import ModalRegisterForm from './ModalRegisterForm'; // Import ModalRegisterForm

const AuthModal: React.FC = () => {
  const { modalType, hideModal, showLogin, showRegister } = useAuth(); // Destructure showLogin and showRegister

  const handleSuccess = () => {
    hideModal();
  };

  return (
    <Modal show={modalType !== null} onHide={hideModal} centered dialogClassName="auth-modal-backdrop-blur">
      <Modal.Header closeButton>
        <Modal.Title>{modalType === 'login' ? 'Login' : 'Register'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {modalType === 'login' && <ModalLoginForm onSuccess={handleSuccess} onSwitchToRegister={() => showRegister()} />}
        {modalType === 'register' && <ModalRegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => showLogin()} />}
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;
