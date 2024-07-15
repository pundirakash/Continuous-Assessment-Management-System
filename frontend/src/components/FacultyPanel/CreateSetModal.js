import React, { useState } from 'react';

const CreateSetModal = ({ onClose, onSave }) => {
  const [setName, setSetName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (setName.trim()) {
      onSave(setName.trim());
    }
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Set</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="setName">Set Name:</label>
                <input
                  type="text"
                  className="form-control"
                  id="setName"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSetModal;
