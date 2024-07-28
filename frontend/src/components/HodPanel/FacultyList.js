import React from 'react';

const FacultyList = ({ faculties, onFacultyClick, pendingAssessmentSets }) => {
  const hasPendingAssessments = (facultyId) => {
    return pendingAssessmentSets.some(set => set.facultyId === facultyId);
  };

  return (
    <div className="col-md-6 mb-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h4 className="card-title mb-0">Faculties</h4>
        </div>
        <ul className="list-group list-group-flush">
          {faculties.map((faculty) => (
            <li key={faculty._id} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{faculty.name} ({faculty.role})</span>
              <div className="position-relative">
                <button className="btn btn-outline-primary btn-sm" onClick={() => onFacultyClick(faculty)}>
                  View Courses
                </button>
                {hasPendingAssessments(faculty._id) && (
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FacultyList;
