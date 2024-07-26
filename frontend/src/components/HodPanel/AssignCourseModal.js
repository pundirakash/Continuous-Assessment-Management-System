import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';

const AssignCourseModal = ({ show, handleClose, course, assignCourse }) => {
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false); 

  useEffect(() => {
    const fetchFaculties = async () => {
      const response = await userService.getFacultiesByDepartment();
      setFaculties(response);
    };

    if (show) {
      fetchFaculties();
    }
  }, [show]);

  const handleAssignCourse = async () => {
    try {
      const response = await userService.getCoursesByFaculty(selectedFaculty);
      const isCourseAssigned = response.some(assignedCourse => assignedCourse._id === course._id);
      if (!isCourseAssigned) {
        await assignCourse(selectedFaculty, course._id);
        handleClose();
      } else {
        alert('Course already assigned to this faculty.');
      }
    } catch (error) {
      console.error("Error checking course assignment:", error);
      setError(error.message); 
      setShowErrorModal(true); 
    }
  };

  return (
    <div className={`modal ${show ? 'd-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Assign Course</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="facultySelect" className="form-label">Select Faculty</label>
              <select
                id="facultySelect"
                className="form-select"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
              >
                <option value="">Choose...</option>
                {faculties.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.name} ({faculty.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleAssignCourse}>Assign Course</button>
          </div>
        </div>
      </div>
      {showErrorModal && (
      <ErrorModal
        message={error}
        onClose={() => setShowErrorModal(false)}
      />
    )}
    </div>
  );
};

export default AssignCourseModal;
