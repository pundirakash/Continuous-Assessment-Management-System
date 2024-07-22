import React, { useState } from 'react';
import userService from '../../services/userService';
import QuestionListModal from './QuestionListModal';
import ErrorModal from '../ErrorModal';

const ViewCoursesModal = ({ show, handleClose, faculty, courses, handleDeallocateCourse }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [sets, setSets] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);

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
    try {
      await userService.approveAssessment(selectedAssessmentId, faculty._id, setName, 'Approved', 'Approved by HOD');
      setSets(prevSets => prevSets.map(set => set.setName === setName ? { ...set, status: 'Approved' } : set));
      setShowQuestionsModal(false);
      setSelectedQuestions([]);
      setSelectedSet(null);
    } catch (error) {
      setErrorMessage('Error approving set. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
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
                      <button className="btn btn-primary btn-sm mr-2" onClick={() => handleViewAssessments(course)}>Assessments</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeallocateCourse(course._id)}>Deallocate</button>
                    </div>
                  </li>
                ))}
              </ul>
              {selectedCourse && assessments.length > 0 && (
                <div className="mt-3">
                  <h6 className="mb-3">Assessments for Course: {selectedCourse}</h6>
                  <ul className="list-group">
                    {assessments.map((assessment) => (
                      <li key={assessment._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{assessment.name}</span>
                        <button className="btn btn-link btn-sm" onClick={() => handleViewSets(assessment._id)}>View Sets</button>
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
                      <li key={set._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{set.setName}</span>
                        <button className="btn btn-link btn-sm" onClick={() => handleViewQuestions(set.questions, set.setName)}>View Questions</button>
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
      <QuestionListModal show={showQuestionsModal} handleClose={handleCloseQuestionsModal} initialQuestions={selectedQuestions} setName={selectedSet} onApprove={handleApproveSet} />
      {showErrorModal && <ErrorModal message={errorMessage} onClose={handleCloseErrorModal} />}
    </>
  );
};

export default ViewCoursesModal;
