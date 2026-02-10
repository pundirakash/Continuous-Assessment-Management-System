import React, { useState } from 'react';
import userService from '../../services/userService';
import QuestionListModal from './QuestionListModal';
import ErrorModal from '../ErrorModal';
import '../../css/ViewCoursesModal.css'

const ViewCoursesModal = ({ show, handleClose, faculty, courses, handleDeallocateCourse, handleAppointCoordinator, pendingAssessmentSets }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [sets, setSets] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [hodStatus, setHodStatus] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingSets, setLoadingSets] = useState(false);


  const handleViewAssessments = async (course) => {
    setLoadingAssessments(true);
    setSelectedCourse(course.name);
    setAssessments([]); // Clear previous
    setSets([]); // Clear sets
    try {
      const response = await userService.getAssessments(course._id);
      setAssessments(response);
    } catch (error) {
      setErrorMessage('Error fetching assessments. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleViewSets = async (assessmentId) => {
    setLoadingSets(true);
    setSelectedAssessmentId(assessmentId);
    setSets([]); // Clear previous
    try {
      const response = await userService.getSetsForAssessmentByHOD(faculty._id, assessmentId);
      setSets(response.length > 0 ? response : []);
    } catch (error) {
      setErrorMessage('Error fetching sets. Please try again.');
      setShowErrorModal(true);
      setSets([]);
    } finally {
      setLoadingSets(false);
    }
  };

  const handleViewQuestions = (questions, set, hodStatus) => {
    setSelectedQuestions(questions);
    setSelectedSet(set);
    setHodStatus(hodStatus);
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
    setHodStatus("Approved");
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
      <style>
        {`
          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            border-radius: 4px;
          }
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content custom-modal">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title text-left">Courses Assigned to {faculty.name}</h5>
            </div>
            <div className="modal-body">
              <ul className="list-group">
                {courses.map((course) => (
                  <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <span className="font-weight-bold">{course.name}</span> <span className="text-muted small">({course.code})</span>
                      {course.coordinator === faculty._id && <span className="badge bg-success ms-2">Coordinator</span>}
                    </div>
                    <div>
                      {course.coordinator !== faculty._id && (
                        <button
                          className="btn btn-outline-success btn-sm me-2"
                          onClick={() => {
                            if (window.confirm(`Appoint ${faculty.name} as Course Coordinator for ${course.name}?`)) {
                              handleAppointCoordinator(faculty._id, course._id);
                            }
                          }}
                        >
                          Make Coordinator
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeallocateCourse(course._id)}>Deallocate</button>
                      <button className="btn btn-primary btn-sm me-2" onClick={() => handleViewAssessments(course)}>Assessments</button>
                    </div>
                    {hasPendingAssessments(course.name) && (
                      <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">New alerts</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {selectedCourse && (loadingAssessments || assessments.length > 0) && (
                <div className="mt-3">
                  <h6 className="mb-3">Assessments for Course: {selectedCourse}</h6>
                  {loadingAssessments ? (
                    <ul className="list-group">
                      {[1, 2].map((_, i) => (
                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center mb-1">
                          <div className="skeleton" style={{ width: '40%', height: '20px' }}></div>
                          <div className="skeleton" style={{ width: '80px', height: '30px' }}></div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="list-group">
                      {assessments.map((assessment) => (
                        <li key={assessment._id} className="list-group-item d-flex justify-content-between align-items-center mb-1">
                          <span>{assessment.name}</span>
                          <button className="btn btn-link btn-sm" onClick={() => handleViewSets(assessment._id)}>View Sets</button>
                          {hasPendingSet(assessment._id) && (
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                              <span className="visually-hidden">New alerts</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {(loadingSets || sets.length > 0) && (
                <div className="mt-3">
                  <h6 className="mb-3">Sets</h6>
                  {loadingSets ? (
                    <ul className="list-group">
                      {[1, 2, 3].map((_, i) => (
                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center mb-1">
                          <div className="skeleton" style={{ width: '30%', height: '20px' }}></div>
                          <div className="skeleton" style={{ width: '100px', height: '30px' }}></div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="list-group">
                      {sets.map((set) => (
                        <li key={set._id} className="list-group-item d-flex justify-content-between align-items-center mb-1">
                          <span>{set.setName}</span>
                          <button className="btn btn-link btn-sm" onClick={() => handleViewQuestions(set.questions, set.setName, set.hodStatus)}>View Questions</button>
                          {hasPendingQuestion(set.setName) && (
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-warning border border-light rounded-circle">
                              <span className="visually-hidden">New alerts</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
      <QuestionListModal show={showQuestionsModal} handleClose={handleCloseQuestionsModal} initialQuestions={selectedQuestions} setName={selectedSet} onApprove={handleApproveSet} onReject={handleRejectSet} hodStatus={hodStatus} />
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