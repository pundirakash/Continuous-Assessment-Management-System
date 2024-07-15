import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import EditQuestionModal from './EditQuestionModal';
import CreateQuestionModal from './CreateQuestionModal';

const QuestionsList = ({ assessment, setName }) => {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [assessmentType, setAssessmentType] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [hodStatus, setHodStatus] = useState('');
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await userService.getQuestionsForSet(assessment._id, setName);
        setQuestions(response.data);
      } catch (error) {
        console.error('Error fetching questions', error);
      }
    };

    const fetchSetDetails = async () => {
      try {
        const response = await userService.getSetsForAssessment(assessment._id);
        const currentSet = response.find(set => set.setName === setName);
        setHodStatus(currentSet.hodStatus);
      } catch (error) {
        console.error('Error fetching set details', error);
      }
    };    

    if (assessment && setName) {
      fetchQuestions();
      fetchSetDetails();
      setAssessmentType(assessment.type);
    }
  }, [assessment, setName]);

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleSaveEdit = async (updatedQuestion) => {
    try {
      await userService.editQuestion(updatedQuestion._id, updatedQuestion);
      setQuestions(questions.map(q => (q._id === updatedQuestion._id ? updatedQuestion : q)));
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error editing question', error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await userService.deleteQuestion(questionId);
        setQuestions(questions.filter(question => question._id !== questionId));
      } catch (error) {
        console.error('Error deleting question', error);
      }
    }
  };

  const handleDownloadAssessment = async (templateNumber) => {
    try {
      const blob = await userService.downloadAssessment(assessment._id, setName, templateNumber);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment_${assessment._id}_${setName}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading assessment', error);
    }
  };

  const handleCreateQuestion = async () => {
    const response = await userService.getQuestionsForSet(assessment._id, setName);
    setQuestions(response.data);
    setShowCreateQuestion(false); 
  };

  const getTemplateNumber = (type) => {
    switch (type) {
      case 'Mix':
        return 2;
      case 'Theory':
        return 3;
      case 'MCQ':
        return 3;
      default:
        return 1; 
    }
  };

  const handleSubmit = async () => {
    try {
      await userService.submitAssessment(assessment._id, setName);
      setHodStatus('Submitted');
      setShowSubmitConfirmation(false); 
    } catch (error) {
      console.error('Error submitting assessment', error);
    }
  };

  const renderSubmitButton = () => {
    switch (hodStatus) {
      case 'Pending':
        return (
          <button className="btn btn-primary" onClick={() => setShowSubmitConfirmation(true)}>
            Submit
          </button>
        );
      case 'Submitted':
        return <button className="btn btn-secondary" disabled>Awaiting HOD Approval</button>;
      case 'Rejected':
        return (
          <button className="btn btn-warning" onClick={() => setShowSubmitConfirmation(true)}>
            Re-Submit
          </button>
        );
      case 'Approved':
      case 'Approved with Remarks':
        return (
          <>
            <button className="btn btn-secondary" disabled>Submit</button>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setShowDownloadOptions(!showDownloadOptions)}>
                Download Options
              </button>
              {showDownloadOptions && (
                <>
                  <button className="btn btn-secondary" onClick={() => handleDownloadAssessment(2)}>
                    Course File Format
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleDownloadAssessment(getTemplateNumber(assessmentType))}>
                    {`${assessmentType} Format`}
                  </button>
                </>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Questions for Set {setName}</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Question Text</th>
              <th>Type</th>
              <th>Bloom Level</th>
              <th>Course Outcome</th>
              <th>Marks</th>
              <th>Options</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question = {}) => (
              <tr key={question._id || Math.random()}>
                <td>{question.text || 'N/A'}</td>
                <td>{question.type || 'N/A'}</td>
                <td>{question.bloomLevel || 'N/A'}</td>
                <td>{question.courseOutcome || 'N/A'}</td>
                <td>{question.marks || 'N/A'}</td>
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
                <td>
                  {question.image ? (
                    <img src={`http://localhost:3002/${question.image}`} alt="question" style={{ width: '100px' }} />
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>
                  <button className="btn btn-sm btn-primary mr-2" onClick={() => handleEditQuestion(question)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuestion(question._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-primary mr-2" onClick={() => setShowCreateQuestion(true)}>
          Create New Question
        </button>

        {renderSubmitButton()}

        {showCreateQuestion && (
          <CreateQuestionModal assessmentId={assessment._id} setName={setName} onQuestionCreated={handleCreateQuestion} onClose={() => setShowCreateQuestion(false)} />
        )}

        {editingQuestion && (
          <EditQuestionModal question={editingQuestion} onClose={() => setEditingQuestion(null)} onSave={handleSaveEdit} />
        )}

        {showSubmitConfirmation && (
          <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Submission</h5>
                  <button type="button" className="close" onClick={() => setShowSubmitConfirmation(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to submit the assessment for HOD approval?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitConfirmation(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsList;