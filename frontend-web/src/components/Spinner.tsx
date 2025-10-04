
import React from 'react';
import { Spinner as BootstrapSpinner } from 'react-bootstrap';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center my-5">
      <BootstrapSpinner animation="border" role="status">
        <span className="visually-hidden">{message}</span>
      </BootstrapSpinner>
      <p className="mt-3 text-muted">{message}</p>
    </div>
  );
};

export default Spinner;
