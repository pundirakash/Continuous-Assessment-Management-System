import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';

const AssessmentsList = ({ courseId, onAssessmentSelect }) => {
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await userService.getAssessments(courseId);
        setAssessments(data);
      } catch (error) {
        console.error('Error fetching assessment:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(error.message);
        }
        setShowErrorModal(true);
      }
    };

    fetchAssessments();
  }, [courseId]);

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Assessments</h3>
        <div className="assessment-list">
          {assessments.length > 0 ? (
            <ul className="list-group">
              {assessments.map(assessment => (
                <li
                  key={assessment._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => onAssessmentSelect(assessment)}
                  style={{ cursor: 'pointer' }}
                >
                  {assessment.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No Assessment available</p>
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

export default AssessmentsList;
