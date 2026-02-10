import React, { useState } from 'react';

const CourseList = ({ courses, onAddCourse, onAssignCourse, onCreateAssignment, onViewAssignments, onDeleteCourse, onManageCoordinator, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <h4 className="card-title mb-0 me-2">Courses</h4>
            <input
              type="text"
              className="form-control form-control-sm me-2"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isLoading}
            />
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={onAddCourse}
            disabled={isLoading}
          >
            Add Courses
          </button>
        </div>

        {isLoading ? (
          <ul className="list-group list-group-flush">
            {[1, 2, 3, 4].map((_, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <div className="skeleton" style={{ width: '40%', height: '20px' }}></div>
                <div className="d-flex gap-2">
                  <div className="skeleton rounded" style={{ width: '60px', height: '30px' }}></div>
                  <div className="skeleton rounded" style={{ width: '80px', height: '30px' }}></div>
                  <div className="skeleton rounded" style={{ width: '80px', height: '30px' }}></div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="list-group list-group-flush">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                  {course.name} ({course.code})
                  <div>
                    <button
                      className="btn btn-outline-danger btn-sm me-2"
                      onClick={() => onDeleteCourse(course._id)}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => onAssignCourse(course)}
                    >
                      Assign Course
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm me-2"
                      onClick={() => onManageCoordinator(course)}
                    >
                      Coordinator
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={() => onCreateAssignment(course)}
                    >
                      Create CA
                    </button>
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={() => onViewAssignments(course)}
                    >
                      View CAs
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="list-group-item text-center">No Course Available</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CourseList;
