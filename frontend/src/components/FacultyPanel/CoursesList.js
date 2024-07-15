import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';

const CoursesList = ({ onCourseSelect }) => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await userService.getCourses();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses', error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Courses</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th scope="col">Serial No</th>
                <th scope="col">Course Code</th>
                <th scope="col">Course Name</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course._id} onClick={() => onCourseSelect(course._id)} style={{ cursor: 'pointer' }}>
                  <td>{index + 1}</td>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoursesList;
