import React, { useState } from 'react';
import userService from '../../services/userService';

const UpdateSetDetailsModal = ({ assessmentId, setName, onClose, onDetailsUpdated }) => {
  const [allotmentDate, setAllotmentDate] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [maximumMarks, setMaximumMarks] = useState('');

  const handleSubmit = async () => {
    try {
      await userService.updateSetDetails(assessmentId, setName, { allotmentDate, submissionDate, maximumMarks });
      onDetailsUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating set details:', error);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update Set Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
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
                onChange={(e) => setMaximumMarks(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateSetDetailsModal;
