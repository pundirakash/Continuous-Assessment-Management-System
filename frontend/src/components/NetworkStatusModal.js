import React from 'react';
import { FaWifi } from 'react-icons/fa';

const NetworkStatusModal = ({ show, handleClose }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg p-3">
          <div className="modal-body text-center p-4">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-4 d-inline-flex mb-4">
              <FaWifi size={40} />
            </div>
            <h4 className="fw-bold mb-2">Connection Lost</h4>
            <p className="text-muted mb-4 opacity-75">
              You are currently disconnected from the internet. Please check your network connection to continue working.
            </p>
            <button className="btn btn-dark rounded-pill px-5 fw-bold" onClick={handleClose}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatusModal;
