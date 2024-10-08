import React, { useState } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';

const CreateCourseModal = ({ show, handleClose, addCourse }) => {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.createCourse({ name: courseName, code: courseCode });
      alert(`Course Created successfully!`);
      addCourse();
      handleClose();
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.message); 
      setShowErrorModal(true); 
    }
  };

  return (
    <div className={`modal ${show ? 'd-block' : 'd-none'}`} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title text-left">Create New Course</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="courseName" className="form-label">Course Name</label>
                <input type="text" className="form-control" id="courseName" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="courseCode" className="form-label">Course Code</label>
                <input type="text" className="form-control" id="courseCode" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary">Create Course</button>
            </form>
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

export default CreateCourseModal;
