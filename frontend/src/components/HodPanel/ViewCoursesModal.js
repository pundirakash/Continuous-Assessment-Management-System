import React, { useState } from 'react';
import userService from '../../services/userService';
import QuestionListModal from './QuestionListModal';
import ErrorModal from '../ErrorModal';

const ViewCoursesModal = ({ show, handleClose, faculty, courses, handleDeallocateCourse,pendingAssessmentSets }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [sets, setSets] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [remarks, setRemarks] = useState('');


  const handleViewAssessments = async (course) => {
    try {
      const response = await userService.getAssessments(course._id);
      setAssessments(response);
      setSelectedCourse(course.name);
    } catch (error) {
      setErrorMessage('Error fetching assessments. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleViewSets = async (assessmentId) => {
    try {
      const response = await userService.getSetsForAssessmentByHOD(faculty._id, assessmentId);
      setSets(response.length > 0 ? response : []);
      setSelectedAssessmentId(assessmentId);
    } catch (error) {
      setErrorMessage('Error fetching sets. Please try again.');
      setShowErrorModal(true);
      setSets([]);
    }
  };

  const handleViewQuestions = (questions, set) => {
    setSelectedQuestions(questions);
    setSelectedSet(set);
    setShowQuestionsModal(true);
  };

  const handleCloseQuestionsModal = () => {
    setShowQuestionsModal(false);
    setSelectedQuestions([]);
    setSelectedSet(null);
  };

  const handleApproveSet = async (setName) => {
    setShowApproveDialog(true);
    setSelectedSet(setName);
  };
  
  const handleConfirmApprove = async () => {
    try {
      const status = remarks ? 'Approved with Remarks' : 'Approved';
      await userService.approveAssessment(selectedAssessmentId, faculty._id, selectedSet, status, remarks);
      setSets(prevSets => prevSets.map(set => set.setName === selectedSet ? { ...set, status } : set));
      setShowQuestionsModal(false);
      setSelectedQuestions([]);
      setSelectedSet(null);
      setShowApproveDialog(false);
      setRemarks('');
    } catch (error) {
      setErrorMessage('Error approving set. Please try again.');
      setShowErrorModal(true);
    }
  };
  
  const handleRejectSet = async (setName) => {
    setShowRejectDialog(true);
    setSelectedSet(setName);
  };
  
  const handleConfirmReject = async () => {
    try {
      await userService.approveAssessment(selectedAssessmentId, faculty._id, selectedSet, 'Rejected', remarks);
      setSets(prevSets => prevSets.map(set => set.setName === selectedSet ? { ...set, status: 'Rejected' } : set));
      setShowQuestionsModal(false);
      setSelectedQuestions([]);
      setSelectedSet(null);
      setShowRejectDialog(false);
      setRemarks('');
    } catch (error) {
      setErrorMessage('Error rejecting set. Please try again.');
      setShowErrorModal(true);
    }
  };
  

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const hasPendingAssessments = (courseName) => {
    return pendingAssessmentSets.some(set => set.courseName === courseName);
  };

  const hasPendingSet = (assessmentId) => {
    return pendingAssessmentSets.some(set => set.assessmentId === assessmentId);
  };

  const hasPendingQuestion = (setName) => {
    return pendingAssessmentSets.some(set => set.setName === setName);
  };

  return (
    <>
      <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Courses Assigned to {faculty.name}</h5>
            </div>
            <div className="modal-body">
              <ul className="list-group">
                {courses.map((course) => (
                  <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="font-weight-bold">{course.name}</span> {course.code}
                    <div>
                    <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeallocateCourse(course._id)}>Deallocate</button>
                    <button className="btn btn-primary btn-sm me-2" onClick={() => handleViewAssessments(course)}>Assessments</button>
                    </div>
                    {hasPendingAssessments(course.name) && (
                  <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
                  </li>
                ))}
              </ul>
              {selectedCourse && assessments.length > 0 && (
                <div className="mt-3">
                  <h6 className="mb-3">Assessments for Course: {selectedCourse}</h6>
                  <ul className="list-group">
                    {assessments.map((assessment) => (
                      <li key={assessment._id} className="list-group-item d-flex justify-content-between align-items-center mb-1">
                        <span>{assessment.name}</span>
                        <button className="btn btn-link btn-sm" onClick={() => handleViewSets(assessment._id)}>View Sets</button>
                        {hasPendingSet(assessment._id) && (
                  <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sets.length > 0 && (
                <div className="mt-3">
                  <h6 className="mb-3">Sets</h6>
                  <ul className="list-group">
                    {sets.map((set) => (
                      <li key={set._id} className="list-group-item d-flex justify-content-between align-items-center mb-1">
                        <span>{set.setName}</span>
                        <button className="btn btn-link btn-sm" onClick={() => handleViewQuestions(set.questions, set.setName)}>View Questions</button>
                        {hasPendingQuestion(set.setName) && (
                  <span className="position-absolute top-0 start-100 translate-middle p-2 bg-warning border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
      <QuestionListModal show={showQuestionsModal} handleClose={handleCloseQuestionsModal} initialQuestions={selectedQuestions} setName={selectedSet} onApprove={handleApproveSet} onReject={handleRejectSet} />
      {showErrorModal && <ErrorModal message={errorMessage} onClose={handleCloseErrorModal} />}
      {showApproveDialog && (
  <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-centered" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Approve Set</h5>
          <button type="button" className="btn-close" onClick={() => setShowApproveDialog(false)}>
          </button>
        </div>
        <div className="modal-body">
          <textarea
            className="form-control"
            placeholder="Enter any remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowApproveDialog(false)}>Cancel</button>
          <button className="btn btn-success" onClick={handleConfirmApprove}>Approve</button>
        </div>
      </div>
    </div>
  </div>
)}

{showRejectDialog && (
  <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-centered" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Reject Set</h5>
          <button type="button" className="btn-close" onClick={() => setShowRejectDialog(false)}>
          </button>
        </div>
        <div className="modal-body">
          <textarea
            className="form-control"
            placeholder="Enter remarks for rejection"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowRejectDialog(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleConfirmReject}>Reject</button>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
};

export default ViewCoursesModal;
