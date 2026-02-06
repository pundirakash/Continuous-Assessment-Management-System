import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import userService from '../../services/userService';
import { FaInfoCircle, FaTimes, FaCalendarAlt, FaStar, FaQuestionCircle } from 'react-icons/fa';

const UpdateSetDetailsModal = ({ assessmentId, setName, onClose, onDetailsUpdated }) => {
  const [allotmentDate, setAllotmentDate] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [maximumMarks, setMaximumMarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Body scroll lock
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const isFormValid = () => {
    const allotmentDateObj = new Date(allotmentDate);
    const submissionDateObj = new Date(submissionDate);

    return (
      allotmentDate &&
      totalQuestions &&
      submissionDate &&
      maximumMarks &&
      parseInt(maximumMarks) >= 0 &&
      submissionDateObj >= allotmentDateObj
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid()) {
      alert("Please ensure submission date is not before allotment date and marks/questions are valid.");
      return;
    }

    setIsLoading(true);

    try {
      await userService.updateSetDetails(assessmentId, setName, { allotmentDate, submissionDate, maximumMarks, totalQuestions });
      onDetailsUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating set details:', error);
      alert(error.response?.data?.message || "Failed to update details.");
    } finally {
      setIsLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1050 }}>

      <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column"
        style={{
          width: '600px',
          animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}>

        {/* Modern Header */}
        <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <FaInfoCircle size={20} />
            </div>
            <div>
              <h5 className="m-0 fw-bold">Set Details</h5>
              <p className="m-0 small opacity-75">Update configuration for Set {setName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close btn-close-white opacity-100"></button>
        </div>

        {/* Body Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Total Questions & Max Marks */}
              <div className="col-md-6 text-left">
                <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                  <FaQuestionCircle className="text-primary opacity-50" /> Total Questions
                </label>
                <input
                  type="number"
                  className="form-control bg-light border-0 fw-bold px-3 py-2"
                  value={totalQuestions}
                  min="0"
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              <div className="col-md-6 text-left">
                <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                  <FaStar className="text-warning opacity-50" /> Max Marks
                </label>
                <input
                  type="number"
                  className="form-control bg-light border-0 fw-bold px-3 py-2"
                  value={maximumMarks}
                  min="0"
                  onChange={(e) => setMaximumMarks(e.target.value)}
                  placeholder="Ex: 100"
                />
              </div>

              {/* Dates */}
              <div className="col-md-6 text-left">
                <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                  <FaCalendarAlt className="text-secondary opacity-50" /> Allotment Date
                </label>
                <input
                  type="date"
                  className="form-control bg-light border-0 fw-bold px-3 py-2"
                  value={allotmentDate}
                  onChange={(e) => setAllotmentDate(e.target.value)}
                />
              </div>
              <div className="col-md-6 text-left">
                <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                  <FaCalendarAlt className="text-secondary opacity-50" /> Submission Date
                </label>
                <input
                  type="date"
                  className="form-control bg-light border-0 fw-bold px-3 py-2"
                  value={submissionDate}
                  onChange={(e) => setSubmissionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Validation Hint */}
            {!isFormValid() && allotmentDate && submissionDate && (new Date(submissionDate) < new Date(allotmentDate)) && (
              <div className="mt-3 text-danger small bg-danger bg-opacity-10 p-2 rounded-2 border border-danger border-opacity-25">
                ⚠️ Submission date cannot be before allotment date.
              </div>
            )}

            {/* Footer Actions */}
            <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
              <button
                type="button"
                className="btn btn-white border px-4 fw-bold rounded-pill"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white px-5 fw-bold shadow-sm rounded-pill"
                disabled={!isFormValid() || isLoading}
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Update Details'
                )}
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

export default UpdateSetDetailsModal;
