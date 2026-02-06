import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import EditQuestionModal from '../FacultyPanel/EditQuestionModal';
import ErrorModal from '../ErrorModal';
import "../../css/QuestionListModal.css"

const QuestionListModal = ({ show, handleClose, initialQuestions = [], setName, onApprove, onReject, hodStatus }) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [filteredQuestions, setFilteredQuestions] = useState(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setQuestions(initialQuestions);
    setFilteredQuestions(initialQuestions);
  }, [initialQuestions]);

  useEffect(() => {
    const filtered = questions.filter(q =>
      q.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQuestions(filtered);
  }, [searchTerm, questions]);

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await userService.deleteQuestionByHod(questionId);
        const updatedQuestions = questions.filter(q => q._id !== questionId);
        setQuestions(updatedQuestions);
        setFilteredQuestions(updatedQuestions);
      } catch (error) {
        console.error('Error deleting question', error);
        setError(error.message);
        setShowErrorModal(true);
      }
    }
  };

  const handleSaveEdit = async (updatedQuestion) => {
    try {
      await userService.editQuestionByHod(updatedQuestion._id, updatedQuestion);
      const updatedQuestions = questions.map(q => (q._id === updatedQuestion._id ? updatedQuestion : q));
      setQuestions(updatedQuestions);
      setFilteredQuestions(updatedQuestions);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error editing question', error);
      setError(error.message);
      setShowErrorModal(true);
    }
  };

  const handleApprove = () => {
    if (onApprove && setName) {
      onApprove(setName);
    }
  };

  const handleReject = () => {
    if (onReject && setName) {
      onReject(setName);
    }
  };

  return (
    <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable" role="document">
        <div className="modal-content hod-question-list">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title text-left">Questions</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search questions by text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="px-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredQuestions.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {filteredQuestions.map((question, index) => (
                    <div key={question._id} className="card border shadow-sm question-card">
                      <div className="card-header bg-white d-flex justify-content-between align-items-start py-3">
                        <div className="d-flex align-items-start gap-3">
                          <span className="badge bg-secondary rounded-pill px-3">Q{index + 1}</span>
                          <div>
                            <h6 className="fw-bold text-dark mb-1" style={{ whiteSpace: 'pre-wrap' }}>{question.text}</h6>
                            <div className="d-flex gap-2 mt-2">
                              <span className="badge bg-light text-dark border">{question.type}</span>
                              <span className="badge bg-light text-dark border">Marks: {question.marks}</span>
                              <span className="badge bg-light text-dark border">Bloom: {question.bloomLevel}</span>
                              <span className="badge bg-light text-dark border">CO: {question.courseOutcome}</span>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => handleEditQuestion(question)}>
                            Edit
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteQuestion(question._id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="card-body">
                        {question.image && (
                          <div className="mb-3 p-2 border rounded bg-light d-inline-block">
                            <img src={question.image} alt="Question Reference" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                          </div>
                        )}

                        {question.options && question.options.length > 0 && (
                          <div className="mb-3">
                            <h6 className="text-secondary small fw-bold text-uppercase">Options</h6>
                            <div className="d-flex flex-column gap-2">
                              {question.options.map((option, idx) => (
                                <div key={idx} className={`p-2 rounded border ${option === question.solution ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                                  <div className="d-flex">
                                    <span className="fw-bold me-2 text-muted">{String.fromCharCode(65 + idx)}:</span>
                                    <span className={option === question.solution ? 'text-success fw-bold' : ''}>{option}</span>
                                    {option === question.solution && <span className="ms-auto badge bg-success">Correct Answer</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === 'Subjective' && (
                          <div className="p-3 bg-light rounded border border-start-0 border-end-0 border-bottom-0">
                            <strong className="text-muted small text-uppercase">Expected Solution:</strong>
                            <p className="mb-0 mt-1">{question.solution || 'No solution provided'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="text-muted mb-2">No questions found matching your search.</div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>Close</button>
            {setName && <button className="btn btn-danger" onClick={handleReject} disabled={hodStatus !== 'Submitted'}>Reject Set</button>}
            {setName && <button className="btn btn-success" onClick={handleApprove} disabled={hodStatus !== 'Submitted'}>Approve Set</button>}
          </div>
        </div>
      </div>

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveEdit}
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

export default QuestionListModal;
