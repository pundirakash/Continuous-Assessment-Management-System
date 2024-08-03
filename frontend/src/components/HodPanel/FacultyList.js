import React, { useState } from 'react';

const FacultyList = ({ faculties, onFacultyClick, pendingAssessmentSets }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredFaculties = faculties.filter((faculty) =>
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasPendingAssessments = (facultyId) => {
    return pendingAssessmentSets.some(set => set.facultyId === facultyId);
  };

  return (
    <div className="col-md-6 mb-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0 me-2">Faculties</h4>
          <input 
            type="text"
            className="form-control form-control-sm"
            placeholder="Search faculties..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <ul className="list-group list-group-flush">
          {filteredFaculties.length > 0 ? (
            filteredFaculties.map((faculty) => (
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
            ))
          ) : (
            <li className="list-group-item text-center">No Faculty Available</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FacultyList;
