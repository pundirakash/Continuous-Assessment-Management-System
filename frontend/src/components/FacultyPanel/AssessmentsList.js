import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';
import ErrorModal from '../ErrorModal';
// import LoadingSpinner from '../LoadingSpinner';
import SkeletonLoader from '../SkeletonLoader';
import { FaFileAlt } from 'react-icons/fa';

const AssessmentsList = ({ courseId, onAssessmentSelect }) => {
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await userService.getAssessments(courseId);
        setAssessments(data);
      } catch (error) {
        console.error('Error fetching assessments:', error);
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

    fetchAssessments();
  }, [courseId]);

  if (loading) return (
    <div className="assessments-grid-container">
      {[...Array(3)].map((_, i) => (
        <SkeletonLoader key={i} className="assessment-card" height={100} />
      ))}
    </div>
  );

  return (
    <div>
      {assessments.length > 0 ? (
        <div className="assessments-grid-container">
          {assessments.map(assessment => (
            <div
              key={assessment._id}
              className="assessment-card"
              onClick={() => onAssessmentSelect(assessment)}
            >
              <FaFileAlt size={24} style={{ marginBottom: '10px', color: '#64748b' }} />
              <h4>{assessment.name}</h4>
              <span className="badge bg-light text-dark mt-2">{assessment.type}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4">
          <p className="text-muted">No Assessments Created</p>
        </div>
      )}

      {showErrorModal && (
        <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />
      )}
    </div>
  );
};

export default AssessmentsList;
