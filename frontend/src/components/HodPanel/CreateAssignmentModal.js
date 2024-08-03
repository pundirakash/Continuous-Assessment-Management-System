import React, { useState } from 'react';

const CreateAssignmentModal = ({ show, handleClose, course, createAssignment }) => {
  const [name, setName] = useState('');
  const [termId, setTermId] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = () => {
    createAssignment(course._id, { name, termId, type });
  };

  return (
    <div className={`modal ${show ? 'd-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title text-left">Create Assignment</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="assignmentName" className="form-label">Assignment Name</label>
              <input
                type="text"
                id="assignmentName"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="termId" className="form-label">Term ID</label>
              <select
                id="termId"
                className="form-select"
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
              >
                <option value="">Select Term ID</option>
                <option value="24251">24251</option>
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="type" className="form-label">Type</label>
              <select
                id="type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="MCQ">MCQ</option>
                <option value="Subjective">Subjective</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Create Assignment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
