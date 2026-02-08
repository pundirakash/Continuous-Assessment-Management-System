import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';
// Duplicate removed
// import LoadingSpinner from '../LoadingSpinner';
import SkeletonLoader from '../SkeletonLoader';
import { FaArrowRight } from 'react-icons/fa';
import { useTerm } from '../../context/TermContext';

const CoursesList = ({ onCourseSelect }) => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { selectedTerm } = useTerm();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true); // Ensure loading state is reset on term switch
      try {
        const data = await userService.getCourses(selectedTerm);
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(error.message);
        }
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    if (selectedTerm) {
      fetchCourses();
    }
  }, [selectedTerm]);

  if (loading) return (
    <div className="hero-courses-container">
      {[...Array(4)].map((_, i) => (
        <SkeletonLoader key={i} height={200} style={{ borderRadius: '24px' }} />
      ))}
    </div>
  );

  return (
    <div>
      {courses.length > 0 ? (
        <div className="hero-courses-container">
          {courses.map((course, index) => (
            <div
              className={`course-hero-card gradient-${index % 4}`}
              onClick={() => onCourseSelect(course)}
            >
              {/* Background Icon Decoration */}
              <div className="hero-icon">
                {/* Simple logic to pick an icon based on index or name length */}
                {index % 2 === 0 ? <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z" /></svg> : <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" /></svg>}
              </div>

              <div>
                <span className="hero-course-code">{course.code}</span>
                <h3 className="hero-course-name">{course.name}</h3>
              </div>

              <div className="hero-card-footer d-flex justify-content-between align-items-center mt-auto text-white">
                <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.9 }}>View Workspace</span>
                <button className="enter-btn bg-white bg-opacity-25 border border-white border-opacity-50 text-white px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-2 transition-all hover-scale">
                  Enter <FaArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-5 bg-white rounded-4 shadow-sm">
          <h4 className="text-muted">No courses found</h4>
          <p className="text-secondary">You haven't been assigned any courses yet.</p>
        </div>
      )}

      {showErrorModal && (
        <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />
      )}
    </div>
  );
};

export default CoursesList;
