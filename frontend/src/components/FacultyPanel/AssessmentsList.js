import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';

const AssessmentsList = ({ courseId, onAssessmentSelect }) => {
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await userService.getAssessments(courseId);
        setAssessments(data);
      } catch (error) {
        console.error('Error fetching assessments', error);
      }
    };

    fetchAssessments();
  }, [courseId]);

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Assessments</h3>
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
      </div>
    </div>
  );
};

export default AssessmentsList;
