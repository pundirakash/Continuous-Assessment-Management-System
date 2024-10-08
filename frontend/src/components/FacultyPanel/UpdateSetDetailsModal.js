import React, { useState } from 'react';
import userService from '../../services/userService';

const UpdateSetDetailsModal = ({ assessmentId, setName, onClose, onDetailsUpdated }) => {
  const [allotmentDate, setAllotmentDate] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [maximumMarks, setMaximumMarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);  // Track loading status

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

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert("Please make sure that the submission date is not before the allotment date and that maximum marks are at least 1.");
      return;
    }

    setIsLoading(true);  // Start loading animation

    try {
      await userService.updateSetDetails(assessmentId, setName, { allotmentDate, submissionDate, maximumMarks, totalQuestions });
      onDetailsUpdated();
      alert(`Updated Successfully`);
      onClose();
    } catch (error) {
      console.error('Error updating set details:', error);
    } finally {
      setIsLoading(false);  // Stop loading animation
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title text-left">Set Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Enter total questions:</label>
              <input
                type="number"
                className="form-control"
                value={totalQuestions}
                min="0"
                onChange={(e) => setTotalQuestions(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Allotment Date</label>
              <input
                type="date"
                className="form-control"
                value={allotmentDate}
                onChange={(e) => setAllotmentDate(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Submission Date</label>
              <input
                type="date"
                className="form-control"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Maximum Marks</label>
              <input
                type="number"
                className="form-control"
                value={maximumMarks}
                min="0"
                onChange={(e) => setMaximumMarks(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateSetDetailsModal;
