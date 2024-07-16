import React, { useState } from 'react';

const CreateSetModal = ({ onClose, onSave }) => {
  const [numSets, setNumSets] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(numSets.trim(), 10);
    if (num > 0) {
      onSave(num);
    }
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Sets</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="numSets">Number of Sets:</label>
                <input
                  type="number"
                  className="form-control"
                  id="numSets"
                  value={numSets}
                  onChange={(e) => setNumSets(e.target.value)}
                  required
                  min="1"
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
