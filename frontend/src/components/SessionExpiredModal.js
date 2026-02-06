import React from 'react';
import { useNavigate } from 'react-router-dom';

const SessionExpiredModal = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Session Expired</h5>
          </div>
          <div className="modal-body">
            <p>Your session has expired. Please log in again.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={handleRedirect}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
