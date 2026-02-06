import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const CreateSetModal = ({ onClose, onSave }) => {
  const [numSets, setNumSets] = useState('1'); // Default to 1 for better UX
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(numSets.toString().trim(), 10);

    if (num > 0 && num <= 10) { // Reasonable limit logic
      setLoading(true);
      await onSave(num);
      // alert removed for smoother flow, let parent handle notification or just close
      setLoading(false);
      onClose();
    } else {
      alert("Please enter a valid number of sets (1-10).");
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1050 }}>

      <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column"
        style={{
          width: '500px', // Smaller width for simple modal
          animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}>

        {/* Modern Header */}
        <div className="p-4 text-white d-flex align-items-center justify-content-between"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div>
            <h5 className="m-0 fw-bold">Create New Sets</h5>
            <p className="m-0 small opacity-75">Initialize assessment sets</p>
          </div>
          <button onClick={onClose} className="btn-close btn-close-white opacity-100"></button>
        </div>

        {/* Body */}
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small text-uppercase">Number of Sets</label>
              <input
                type="number"
                className="form-control form-control-lg bg-light border-0 fw-bold text-center"
                style={{ fontSize: '2rem', height: '80px' }}
                value={numSets}
                onChange={(e) => setNumSets(e.target.value)}
                min="1"
                max="10"
                autoFocus
              />
              <div className="form-text text-muted mt-2">
                Enter <strong>1</strong> for Set A only, <strong>2</strong> for Sets A & B, etc.
              </div>
            </div>

            {/* Footer actions inside form so enter works */}
            <div className="d-flex justify-content-end gap-3 mt-4">
              <button type="button" className="btn btn-white border px-4 fw-bold" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="btn text-white px-5 fw-bold shadow-sm"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
              >
                {loading ? 'Creating...' : 'Create Sets'}
              </button>
            </div>
          </form>
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

export default CreateSetModal;
