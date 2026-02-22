import React from 'react';
import ReactDOM from 'react-dom';
import { FaSignInAlt, FaShieldAlt } from 'react-icons/fa';

const SessionExpiredModal = () => {
  const handleRedirect = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return ReactDOM.createPortal(
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
      }}
    >
      <div
        className="bg-white rounded-4 shadow overflow-hidden d-flex flex-column"
        style={{
          width: '400px',
          maxWidth: '90vw',
          animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Header — matching portal purple gradient */}
        <div
          className="p-4 text-white d-flex align-items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          <div
            className="p-2 rounded-3 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}
          >
            <FaShieldAlt size={18} />
          </div>
          <div>
            <h6 className="m-0 fw-bold">Session Expired</h6>
            <p className="m-0 small opacity-75">Authentication required</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 text-center">
          {/* Icon */}
          <div
            className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              color: '#7c3aed',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.757.205 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
              <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
              <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
            </svg>
          </div>

          <h6 className="fw-bold text-dark mb-2">Your session has expired</h6>
          <p className="text-muted small mb-0">
            For your security, you have been logged out due to inactivity. Please log in again to continue.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            className="btn fw-bold w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none' }}
            onClick={handleRedirect}
          >
            <FaSignInAlt size={14} />
            Return to Login
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionExpiredModal;
