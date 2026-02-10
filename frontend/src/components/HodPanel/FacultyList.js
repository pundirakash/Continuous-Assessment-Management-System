import React, { useState } from 'react';

const FacultyList = ({ faculties, onFacultyClick, pendingAssessmentSets, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Sorting faculties by uid in ascending order (numeric comparison)
  const sortedFaculties = faculties.sort((a, b) => a.uid - b.uid);

  const filteredFaculties = sortedFaculties.filter((faculty) =>
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.uid.toString().includes(searchTerm.toLowerCase())
  );

  const hasPendingAssessments = (facultyId) => {
    return pendingAssessmentSets.some(set => set.facultyId === facultyId);
  };

  return (
    <div className="col-md-6 mb-4">
      <style>
        {`
          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            border-radius: 4px;
          }
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
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
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {isLoading ? (
            <ul className="list-group list-group-flush">
              {[1, 2, 3, 4].map((_, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="w-100">
                    <div className="skeleton mb-2" style={{ width: '60%', height: '20px' }}></div>
                    <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
                  </div>
                  <div>
                    <div className="skeleton rounded" style={{ width: '80px', height: '30px' }}></div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="list-group list-group-flush">
              {filteredFaculties.length > 0 ? (
                filteredFaculties.map((faculty) => (
                  <li key={faculty._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold">{faculty.name}</span>
                      <div className="text-muted small">UID: {faculty.uid} | {faculty.department || 'No Dept'}</div>
                    </div>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyList;
