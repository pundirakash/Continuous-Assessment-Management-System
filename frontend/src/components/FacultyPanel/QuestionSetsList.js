import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import CreateSetModal from './CreateSetModal';
import ErrorModal from '../ErrorModal';
import LoadingSpinner from '../LoadingSpinner';
import { FaTrash, FaEye, FaPlus } from 'react-icons/fa';

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
      // ... (error handling same as before)
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return <span className="badge bg-success">Approved</span>;
      case 'Rejected': return <span className="badge bg-danger">Rejected</span>;
      case 'Submitted': return <span className="badge bg-info">Submitted</span>;
      default: return <span className="badge bg-warning text-dark">Pending</span>;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0" style={{ visibility: 'hidden' }}>Sets</h4>
        <button className="btn btn-primary btn-sm d-flex align-items-center" onClick={() => setShowCreateModal(true)}>
          <FaPlus style={{ marginRight: '6px' }} /> Create New Sets
        </button>
      </div>

      {sets.length > 0 ? (
        <div className="sets-list-container">
          {sets.map(set => (
            <div key={set._id} className="set-item-card">
              <div className="d-flex align-items-center gap-3">
                <div className="set-icon bg-light p-2 rounded">
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Set {set.setName}</span>
                </div>
                {getStatusBadge(set.hodStatus)}
              </div>

              <div className="set-actions">
                <button
                  className="btn btn-outline-primary btn-sm btn-sm-action"
                  onClick={() => onSetSelect(set.setName)}
                  title="View Questions"
                >
                  <FaEye /> View
                </button>
                <button
                  className="btn btn-outline-danger btn-sm btn-sm-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSet(assessmentId, facultyId, set.setName);
                  }}
                  disabled={set.hodStatus !== 'Pending'}
                  title="Delete Set"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4">
          <p className="text-muted">No Question Sets Created</p>
        </div>
      )}

      {showCreateModal && (
        <CreateSetModal onClose={() => setShowCreateModal(false)} onSave={handleCreateSet} />
      )}
      {showErrorModal && (
        <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />
      )}
    </div>
  );
};

export default QuestionSetsList;
