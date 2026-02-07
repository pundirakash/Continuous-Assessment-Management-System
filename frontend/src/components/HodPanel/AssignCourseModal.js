import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';

const AssignCourseModal = ({ show, handleClose, course, assignCourse }) => {
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await userService.getFaculties();
        setFaculties(response);
      } catch (err) {
        console.error("Failed to fetch faculties:", err);
      }
    };

    if (show) {
      fetchFaculties();
    }
  }, [show]);

  const filteredFaculties = faculties.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.department && f.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <h5 className="modal-title text-left">Assign Course</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="facultySearch" className="form-label">Search Faculty (Name, Email, or Department)</label>
              <input
                type="text"
                className="form-control mb-2"
                id="facultySearch"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label htmlFor="facultySelect" className="form-label">Select Faculty</label>
              <select
                id="facultySelect"
                className="form-select"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
              >
                <option value="">Choose...</option>
                {filteredFaculties.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.name} ({faculty.department || 'No Dept'} - {faculty.schoolId?.name || 'No School'})
                  </option>
                ))}
              </select>
              {searchTerm && filteredFaculties.length === 0 && (
                <div className="text-danger small mt-1">No faculties found matching "{searchTerm}"</div>
              )}
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
