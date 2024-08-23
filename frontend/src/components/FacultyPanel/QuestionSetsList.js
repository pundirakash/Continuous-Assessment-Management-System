import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import CreateSetModal from './CreateSetModal';
import ErrorModal from '../ErrorModal';
import LoadingSpinner from '../LoadingSpinner'; 
import '../../css/QuestionSetsList.css';

const QuestionSetsList = ({ assessmentId, facultyId, onSetSelect }) => {
  const [sets, setSets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const data = await userService.getSetsForAssessment(assessmentId);
        setSets(data);
      } catch (error) {
        console.error('Error fetching sets:', error);
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
      setError(error.message);
      setShowErrorModal(true);
    }
  };

  const handleDeleteSet = async (assessmentId, facultyId, setName) => {
    if (window.confirm(`Are you sure you want to delete the set "${setName}"?`)) {
      try {
        await userService.deleteSetForAssessment(assessmentId, facultyId, setName);
        const updatedSets = await userService.getSetsForAssessment(assessmentId);
        setSets(updatedSets);
      } catch (error) {
        console.error('Error deleting set', error);
        setError(error.message);
        setShowErrorModal(true);
      }
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Question Sets</h3>
        <div
          className={loading ? '' : 'question-sets-list'}
          style={{
            height: loading ? '50px' : 'auto',
            overflow: loading ? 'hidden' : 'auto'
          }}
        >
          {loading ? (
            <LoadingSpinner />
          ) : sets.length > 0 ? (
            <ul className="list-group">
              {sets.map(set => (
                <li
                  key={set._id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{set.setName}</span>
                  <div>
                    <button
                      className="btn btn-primary btn-sm mr-2"
                      onClick={() => onSetSelect(set.setName)}
                    >
                      View Set
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSet(assessmentId, facultyId, set.setName);
                      }}
                      disabled={set.hodStatus !== 'Pending'}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No Set available</p>
          )}
        </div>
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
      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default QuestionSetsList;
