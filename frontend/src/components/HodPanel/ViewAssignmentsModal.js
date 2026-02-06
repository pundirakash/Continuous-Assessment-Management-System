import React, { useState } from 'react';

const ViewAssignmentsModal = ({ show, handleClose, assignments, course, onEditAssignment, onDeleteAssignment }) => {
  const [editableAssignment, setEditableAssignment] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedTermId, setEditedTermId] = useState('');
  const [editedType, setEditedType] = useState('');

  const handleEditClick = (assignment) => {
    setEditableAssignment(assignment);
    setEditedName(assignment.name);
    setEditedTermId(assignment.termId);
    setEditedType(assignment.type);
  };

  const handleSaveEdit = () => {
    onEditAssignment(editableAssignment._id, {
      name: editedName,
      termId: editedTermId,
      type: editedType,
    });
    setEditableAssignment(null);
  };

  return (
    <div className={`modal ${show ? 'd-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Assignments for {course.name} ({course.code})</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <ul className="list-group">
              {assignments.map((assignment) => (
                <li key={assignment._id} className="list-group-item d-flex justify-content-between align-items-center">
                  {editableAssignment && editableAssignment._id === assignment._id ? (
                    <div className="w-100">
                      <input 
                        type="text" 
                        className="form-control mb-2" 
                        value={editedName} 
                        onChange={(e) => setEditedName(e.target.value)} 
                        placeholder="Assignment Name" 
                      />
                      <input 
                        type="text" 
                        className="form-control mb-2" 
                        value={editedTermId} 
                        onChange={(e) => setEditedTermId(e.target.value)} 
                        placeholder="Term ID" 
                      />
                      <select 
                        className="form-control mb-2" 
                        value={editedType} 
                        onChange={(e) => setEditedType(e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="MCQ">MCQ</option>
                        <option value="Subjective">Subjective</option>
                      </select>
                      <button className="btn btn-primary me-2" onClick={handleSaveEdit}>Save</button>
                      <button className="btn btn-secondary" onClick={() => setEditableAssignment(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div>{assignment.name} - {assignment.termId} - {assignment.type}</div>
                      <div>
                        <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => handleEditClick(assignment)}>Edit</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => onDeleteAssignment(assignment._id)}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAssignmentsModal;
