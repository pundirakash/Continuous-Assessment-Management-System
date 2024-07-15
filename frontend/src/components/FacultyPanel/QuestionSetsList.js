import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import CreateSetModal from './CreateSetModal';

const QuestionSetsList = ({ assessmentId, onSetSelect, onCreateSet }) => {
  const [sets, setSets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleCreateSet = async (setName) => {
    try {
      await userService.createSetForAssessment(assessmentId, setName); // You need to implement this function in userService
      setShowCreateModal(false);
      const updatedSets = await userService.getSetsForAssessment(assessmentId);
      setSets(updatedSets);
    } catch (error) {
      console.error('Error creating set', error);
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
              className="list-group-item list-group-item-action"
              onClick={() => onSetSelect(set.setName)}
              style={{ cursor: 'pointer' }}
            >
              {set.setName}
            </li>
          ))}
        </ul>
        <button className="btn btn-primary mt-3" onClick={() => setShowCreateModal(true)}>
          Create New Set
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
