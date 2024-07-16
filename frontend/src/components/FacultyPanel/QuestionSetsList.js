import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import CreateSetModal from './CreateSetModal';

const QuestionSetsList = ({ assessmentId, facultyId, onSetSelect }) => {
  const [sets, setSets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  console.log(facultyId);
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const data = await userService.getSetsForAssessment(assessmentId);
        setSets(data);
      } catch (error) {
        console.error('Error fetching sets', error);
      }
    };

    fetchSets();
  }, [assessmentId]);

  const handleCreateSet = async (numSets) => {
    try {
      const existingSets = await userService.getSetsForAssessment(assessmentId);
      const startIndex = existingSets.length;
      const setNames = Array.from({ length: numSets }, (_, i) => String.fromCharCode(65 + startIndex + i));

      for (const setName of setNames) {
        await userService.createSetForAssessment(assessmentId, setName);
      }

      setShowCreateModal(false);
      const updatedSets = await userService.getSetsForAssessment(assessmentId);
      setSets(updatedSets);
    } catch (error) {
      console.error('Error creating sets', error);
    }
  };

  const handleDeleteSet = async (assessmentId, facultyId, setName) => {
    try {
      await userService.deleteSetForAssessment(assessmentId, facultyId, setName);
      const updatedSets = await userService.getSetsForAssessment(assessmentId);
      setSets(updatedSets);
    } catch (error) {
      console.error('Error deleting set', error);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Question Sets</h3>
        <ul className="list-group">
          {sets.map(set => (
            <li
              key={set._id}
              className="list-group-item d-flex justify-content-between align-items-center"
              onClick={() => onSetSelect(set.setName)}
              style={{ cursor: 'pointer' }}
            >
              {set.setName}
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSet(assessmentId, facultyId, set.setName);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        <button className="btn btn-primary mt-3" onClick={() => setShowCreateModal(true)}>
          Create New Sets
        </button>
      </div>
      {showCreateModal && (
        <CreateSetModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSet}
        />
      )}
    </div>
  );
};

export default QuestionSetsList;
