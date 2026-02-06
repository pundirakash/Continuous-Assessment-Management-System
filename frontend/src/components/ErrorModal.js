import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorModal = ({ message, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return ReactDOM.createPortal(
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000 }}>

      <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column"
        style={{
          width: '400px',
          animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}>

        {/* Header */}
        <div className="p-3 text-white d-flex align-items-center justify-content-between text-left"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
          <div className="d-flex align-items-center gap-2">
            <FaExclamationTriangle size={18} />
            <h6 className="m-0 fw-bold">Oops! Something went wrong</h6>
          </div>
          <button onClick={onClose} className="btn-close btn-close-white opacity-100 shadow-none"></button>
        </div>

        {/* Body */}
        <div className="p-4 text-center">
          <p className="text-secondary mb-4">{message}</p>
          <button
            className="btn btn-danger px-5 fw-bold rounded-pill shadow-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
    </div>,
    document.body
  );
};

export default ErrorModal;