import React, { useState } from 'react';

const CourseList = ({ courses, onAddCourse, onAssignCourse, onCreateAssignment, onViewAssignments, onDeleteCourse }) => {
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
            />
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={onAddCourse}>Add Courses</button>
        </div>
        
        <ul className="list-group list-group-flush">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                {course.name} ({course.code})
                <div>
                  <button className="btn btn-outline-danger btn-sm me-2" onClick={() => onDeleteCourse(course._id)}>Delete</button>
                  <button className="btn btn-outline-primary btn-sm me-2" onClick={() => onAssignCourse(course)}>Assign Course</button>
                  <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => onCreateAssignment(course)}>Create Task</button>
                  <button className="btn btn-outline-info btn-sm" onClick={() => onViewAssignments(course)}>View Tasks</button>
                </div>
              </li>
            ))
          ) : (
            <li className="list-group-item text-center">No Course Available</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CourseList;
