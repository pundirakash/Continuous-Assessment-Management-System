import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';

const CoursesList = ({ onCourseSelect }) => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await userService.getCourses();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(error.message);
        }
        setShowErrorModal(true);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Courses</h3>
        <div className="table-responsive">
          {courses.length > 0 ? (
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
          ) : (
            <p>No Course Alloted</p>
          )}
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

export default CoursesList;
