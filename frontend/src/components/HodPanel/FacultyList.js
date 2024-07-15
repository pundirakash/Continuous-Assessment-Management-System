import React from 'react';

const FacultyList = ({ faculties, onFacultyClick }) => {
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
              <button className="btn btn-outline-primary btn-sm" onClick={() => onFacultyClick(faculty)}>View Courses</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FacultyList;
