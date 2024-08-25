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
      <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
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
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'scroll' }}>
              <table className="table table-striped table-hover">
                <thead className="thead-dark">
                  <tr>
                    <th>S.No</th>
                    <th>Question</th>
                    <th>Type</th>
                    <th>Options</th>
                    <th>Bloom Level</th>
                    <th>Course Outcome</th>
                    <th>Marks</th>
                    <th>Image</th>
                    <th>Solution</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question, index) => (
                      <tr key={question._id}>
                        <td>{index + 1}</td>
                        <td>{question.text}</td>
                        <td>{question.type}</td>
                        <td>
                          {question.options && question.options.length > 0 ? (
                            <ol>
                              {question.options.map((option, idx) => (
                                <li key={idx}>{option || 'N/A'}</li>
                              ))}
                            </ol>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>{question.bloomLevel}</td>
                        <td>{question.courseOutcome}</td>
                        <td>{question.marks}</td>
                        <td className='text-center'>
  {question.image ? (
    <img src={question.image} alt="question" style={{ width: '100px' }} />
  ) : (
    'N/A'
  )}
</td>
                        <td>{question.solution}</td>
                        <td>{question.status}</td>
                        <td>
                          <button className="btn btn-sm btn-primary mr-2" onClick={() => handleEditQuestion(question)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuestion(question._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11">No questions available</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
