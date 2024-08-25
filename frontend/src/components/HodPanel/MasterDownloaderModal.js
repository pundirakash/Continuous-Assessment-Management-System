import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const MasterDownloaderModal = ({ show, handleClose }) => {
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedBloomLevel, setSelectedBloomLevel] = useState('');
  const [selectedCourseOutcome, setSelectedCourseOutcome] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [numberOfQuestions, setNumberOfQuestions] = useState(''); // New state for Number of Questions
  const [loading, setLoading] = useState(false); // New state for loading

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await userService.getCoursesByDepartment();
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const fetchAssessments = async () => {
        try {
          const assessmentsData = await userService.getAssessmentsByCourse(selectedCourse);
          setAssessments(assessmentsData);
        } catch (error) {
          console.error('Error fetching assessments:', error);
        }
      };
      fetchAssessments();
    } else {
      setAssessments([]);
    }
  }, [selectedCourse]);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = {
        courseId: selectedCourse,
        assessmentId: selectedAssessment,
        bloomLevel: selectedBloomLevel,
        courseOutcome: selectedCourseOutcome,
        templateNumber: selectedTemplate,
        ...(numberOfQuestions && { numberOfQuestions }) // Conditionally include the numberOfQuestions parameter
      };
      await userService.downloadQuestions(params);
    } catch (error) {
      console.error('Error downloading questions:', error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className={`modal ${show ? 'show' : ''}`} style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title text-left">Master Downloader</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="courseSelect">Course</label>
              <select
                className="form-control"
                id="courseSelect"
                onChange={(e) => setSelectedCourse(e.target.value)}
                value={selectedCourse}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="assessmentSelect">Assessment</label>
              <select
                className="form-control"
                id="assessmentSelect"
                onChange={(e) => setSelectedAssessment(e.target.value)}
                disabled={!selectedCourse}
                value={selectedAssessment}
              >
                <option value="">Select Assessment</option>
                {assessments.map((assessment) => (
                  <option key={assessment._id} value={assessment._id}>
                    {assessment.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="bloomLevelSelect">Bloom Level</label>
              <select
                className="form-control"
                id="bloomLevelSelect"
                onChange={(e) => setSelectedBloomLevel(e.target.value)}
                value={selectedBloomLevel}
              >
                <option value="">Select Bloom Level</option>
                {[...Array(6).keys()].map((i) => (
                  <option key={i + 1} value={`L${i + 1}`}>
                    L{i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="courseOutcomeSelect">Course Outcome</label>
              <select
                className="form-control"
                id="courseOutcomeSelect"
                onChange={(e) => setSelectedCourseOutcome(e.target.value)}
                value={selectedCourseOutcome}
              >
                <option value="">Select Course Outcome</option>
                {[...Array(6).keys()].map((i) => (
                  <option key={i + 1} value={`CO${i + 1}`}>
                    CO{i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="templateSelect">Template Name</label>
              <select
                className="form-control"
                id="templateSelect"
                onChange={(e) => setSelectedTemplate(Number(e.target.value))}
                value={selectedTemplate}
              >
                <option value={1}>Course File Format</option>
                <option value={3}>MCQ Format</option>
                <option value={4}>Subjective Format</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="numberOfQuestionsInput">Number of Questions</label>
              <input
                type="number"
                className="form-control"
                id="numberOfQuestionsInput"
                placeholder="Enter number of questions"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                'Download'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDownloaderModal;
