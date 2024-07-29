import React from 'react';

const CourseList = ({ courses, onAddCourse, onAssignCourse, onCreateAssignment, onViewAssignments, onDeleteCourse }) => {
  return (
    <div className="col-md-6 mb-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">Courses</h4>
          <button className="btn btn-outline-primary btn-sm" onClick={onAddCourse}>Add Course</button>
        </div>
        
        <ul className="list-group list-group-flush">
          {courses.map((course) => (
            <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
              {course.name} ({course.code})
              <div>
                <button className="btn btn-outline-danger btn-sm me-2" onClick={() => onDeleteCourse(course._id)}>Delete</button>
                <button className="btn btn-outline-primary btn-sm me-2" onClick={() => onAssignCourse(course)}>Assign Course</button>
                <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => onCreateAssignment(course)}>Create Task</button>
                <button className="btn btn-outline-info btn-sm" onClick={() => onViewAssignments(course)}>View Tasks</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseList;
