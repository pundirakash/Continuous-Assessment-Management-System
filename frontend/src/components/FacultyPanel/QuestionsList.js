import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import EditQuestionModal from './EditQuestionModal';
import CreateQuestionModal from './CreateQuestionModal';
import ErrorModal from '../ErrorModal';
import '../../css/QuestionList.css';

const QuestionsList = ({ assessment, setName }) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [assessmentType, setAssessmentType] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [hodStatus, setHodStatus] = useState('');
  const [hodRemarks,setHodRemarks]=useState('');
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false); 
  const [showRandomDownloadModal, setShowRandomDownloadModal] = useState(false);
const [numberOfQuestions, setNumberOfQuestions] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await userService.getQuestionsForSet(assessment._id, setName);
        setQuestions(response.data);
      } catch (error) {
        console.error('Error Fetching Questions', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(error.message);
        }
        setShowErrorModal(true); 
      }
    };

    const fetchSetDetails = async () => {
      try {
        const response = await userService.getSetsForAssessment(assessment._id);
        const currentSet = response.find(set => set.setName === setName);
        setHodStatus(currentSet.hodStatus);
        setHodRemarks(currentSet.hodRemarks);
      } catch (error) {
        console.error('Error Fetching Set Details:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(error.message);
        }
        setShowErrorModal(true); 
      }
    };    

    if (assessment && setName) {
      fetchQuestions();
      fetchSetDetails();
      setAssessmentType(assessment.type);
    }
  }, [assessment, setName]);
  useEffect(() => {
    if (searchQuery) {
      setFilteredQuestions(
        questions.filter(question =>
          question.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredQuestions(questions);
    }
  }, [searchQuery, questions]);

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleSaveEdit = async (updatedQuestion) => {
    try {
      await userService.editQuestion(updatedQuestion._id, updatedQuestion);
      alert(`Question Edited successfully!`);
      setQuestions(questions.map(q => (q._id === updatedQuestion._id ? updatedQuestion : q)));
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true); 
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await userService.deleteQuestion(questionId);
        alert(`Question Deleted successfully!`);
        setQuestions(questions.filter(question => question._id !== questionId));
      } catch (error) {
        console.error('Error deleting question:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(error.message);
        }
        setShowErrorModal(true); 
      }
    }
  };

  const handleDownloadAssessment = async (templateNumber) => {
    try {
      const blob = await userService.downloadAssessment(assessment._id, setName, templateNumber);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment_${assessment._name}_${setName}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading assessment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true); 
    }
  };

  const handleDownloadSolution = async (templateNumber) => {
    try {
      const blob = await userService.downloadSolution(assessment._id, setName, templateNumber);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `solution_${assessment.name}_${setName}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading solution:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true); 
    }
  };

  const handleDownloadRandomQuestions = async () => {
    try {
      const blob = await userService.downloadRandomApprovedQuestions(assessment._id, numberOfQuestions, setName);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment_${assessment.name}_random_${numberOfQuestions}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error Downloading assessment:', error);
  
      let errorMessage = 'An error occurred while downloading the assessment';
      if (error.response) {
        if (error.response.status === 403 && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404 && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else {
        errorMessage = error.message;
      }
  
      setError(errorMessage);
      setShowErrorModal(true);
    }
  };  

  const handleCreateQuestion = async () => {
    const response = await userService.getQuestionsForSet(assessment._id, setName);
    setQuestions(response.data);
    setHodStatus('Pending');
    setShowCreateQuestion(false); 
  };

  const getTemplateNumber = (type) => {
    switch (type) {
      case 'Mix':
        return 2;
      case 'Subjective':
        return 4;
      case 'MCQ':
        return 3;
      case 'Solution':
        return 5;
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
      console.error('Error submitting assessment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true); 
    }
  };
  
  

  const renderSubmitButton = () => {
    switch (hodStatus) {
      case 'Pending':
        return (
          <button className="btn btn-primary me-2" onClick={() => setShowSubmitConfirmation(true)}>
            Submit
          </button>
        );
      case 'Submitted':
        return <button className="btn btn-secondary me-2" disabled>Awaiting HOD Approval</button>;
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
            <button className="btn btn-secondary me-2" disabled>Submit</button>
            <div className="btn-group">
              <button className="btn btn-secondary me-2" onClick={() => setShowDownloadOptions(!showDownloadOptions)}>
                Download Options
              </button>
              {showDownloadOptions && (
                <>
                  <button className="btn btn-secondary me-2" onClick={() => handleDownloadAssessment(1)}>
                    Course File Format
                  </button>
                  <button className="btn btn-secondary me-2" onClick={() => handleDownloadAssessment(getTemplateNumber(assessmentType))}>
                    {`${assessmentType} Format`}
                  </button>
                  <button className="btn btn-secondary me-2" onClick={() => handleDownloadSolution(getTemplateNumber('Solution'))}>
                    {`Solutions`}
                  </button>
                  <button className="btn btn-secondary me-2" onClick={() => setShowRandomDownloadModal(true)}>
                    Random Approved Questions
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
        {(hodStatus === 'Rejected' || hodStatus === 'Approved with Remarks') && (
  <div className="alert alert-info mt-3">
    <strong>HOD Remarks: </strong>{hodRemarks}
  </div>
)}
 <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
<div className="table-container">
        <table className="table table-striped">
          <thead>
            <tr className='text-center'>
            <th>S.No</th>
              <th>Question Text</th>
              <th>Type</th>
              <th>Bloom Level</th>
              <th>Course Outcome</th>
              <th>Marks</th>
              <th>Options</th>
              <th>Image</th>
              <th>Solution</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {filteredQuestions.map((question, index) => (
                <tr key={question._id || Math.random()}>
                <td className='text-center'>{index + 1}</td>
                <td className='text-justify'>{question.text || 'N/A'}</td>
                <td className='text-center'>{question.type || 'N/A'}</td>
                <td className='text-center'>{question.bloomLevel || 'N/A'}</td>
                <td className='text-center'>{question.courseOutcome || 'N/A'}</td>
                <td className='text-center'>{question.marks || 'N/A'}</td>
                <td className='text-center'>
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
                <td className='text-center'>
  {question.image ? (
    <img src={question.image} alt="question" style={{ width: '100px' }} />
  ) : (
    'N/A'
  )}
</td>

                <td>{question.solution || 'N/A'}</td>
                <td>
  <button
    className="btn btn-sm btn-primary mb-1"
    onClick={() => handleEditQuestion(question)}
    disabled={hodStatus === 'Approved'|| hodStatus === 'Submitted'}
  >
    Edit
  </button>
  <button
    className="btn btn-sm btn-danger"
    onClick={() => handleDeleteQuestion(question._id)}
    disabled={hodStatus === 'Approved' || hodStatus === 'Approved with Remarks'|| hodStatus === 'Submitted'}
  >
    Delete
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>    
        <button className="btn btn-primary me-2 mb-2 mt-2" onClick={() => setShowCreateQuestion(true)} disabled={hodStatus === 'Approved'|| hodStatus === 'Submitted'}>
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
                  <button type="button" className="btn-close" onClick={() => setShowSubmitConfirmation(false)}>
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
        
    {showRandomDownloadModal && (
  <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Download Random Approved Questions</h5>
          <button type="button" className="btn-close" onClick={() => setShowRandomDownloadModal(false)}>
          </button>
        </div>
        <div className="modal-body">
          <p>Enter the number of questions to download:</p>
          <input
            type="number"
            className="form-control"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowRandomDownloadModal(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleDownloadRandomQuestions}>Download</button>
        </div>
      </div>
    </div>
    
  </div>
)}
{showErrorModal && (
      <ErrorModal
        message={error}
        onClose={() => setShowErrorModal(false)}
      />
    )}
      </div>
    </div>
  );
};

export default QuestionsList;
