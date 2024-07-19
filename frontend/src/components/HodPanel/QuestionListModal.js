import React, { useState, useEffect } from 'react';
import userService from '../../services/userService'; 
import EditQuestionModal from '../FacultyPanel/EditQuestionModal'; 

const QuestionListModal = ({ show, handleClose, initialQuestions = [] }) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await userService.deleteQuestionByHod(questionId);
        setQuestions(prevQuestions => prevQuestions.filter(q => q._id !== questionId));
      } catch (error) {
        console.error('Error deleting question', error);
      }
    }
  };

  const handleSaveEdit = async (updatedQuestion) => {
    try {
      await userService.editQuestionByHod(updatedQuestion._id, updatedQuestion);
      setQuestions(prevQuestions =>
        prevQuestions.map(q => (q._id === updatedQuestion._id ? updatedQuestion : q))
      );
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error editing question', error);
    }
  };

  return (
    <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Questions</h5>
            <button type="button" className="close" onClick={handleClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Type</th>
                    <th>Options</th>
                    <th>Bloom Level</th>
                    <th>Course Outcome</th>
                    <th>Marks</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.length > 0 ? (
                    questions.map((question) => (
                      <tr key={question._id}>
                        <td>{question.text}</td>
                        <td>{question.type}</td>
                        <td>
                          {question.options && question.options.length > 0 ? (
                            <ol>
                              {question.options.map((option, index) => (
                                <li key={index}>{option || 'N/A'}</li>
                              ))}
                            </ol>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>{question.bloomLevel}</td>
                        <td>{question.courseOutcome}</td>
                        <td>{question.marks}</td>
                        <td>
                          {question.image ? (
                            <img src={`http://localhost:3002/${question.image}`} alt="question" style={{ width: '100px' }} />
                          ) : (
                            'N/A'
                          )}
                        </td>
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
                      <td colSpan="9">No questions available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>Close</button>
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
    </div>
  );
};

export default QuestionListModal;
