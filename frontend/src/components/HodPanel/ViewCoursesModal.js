import React, { useState } from 'react';
import userService from '../../services/userService'; // Ensure you import the userService

const ViewCoursesModal = ({ show, handleClose, faculty, courses, handleDeallocateCourse }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleViewAssessments = async (courseId) => {
    const response = await userService.getAssessments(courseId);
    setAssessments(response);
    setSelectedCourse(courseId);
  };

  return (
    <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Courses Assigned to {faculty.name}</h5>
          </div>
          <div className="modal-body">
            <ul className="list-group">
              {courses.map((course) => (
                <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="font-weight-bold">{course.name}</span> ({course.code})
                  <div>
                    <button className="btn btn-info btn-sm mr-2" onClick={() => handleViewAssessments(course._id)}>Assessments</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeallocateCourse(course._id)}>Deallocate</button>
                  </div>
                </li>
              ))}
            </ul>
            {selectedCourse && assessments.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-3">Assessments for Course ID: {selectedCourse}</h6>
                <ul className="list-group">
                  {assessments.map((assessment) => (
                    <li key={assessment._id} className="list-group-item">
                      {assessment.name}
                      {/* Add more details or actions for each assessment here if needed */}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCoursesModal;
