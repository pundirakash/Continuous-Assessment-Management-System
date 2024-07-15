import React, { useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import CoursesList from '../components/FacultyPanel/CoursesList';
import AssessmentsList from '../components/FacultyPanel/AssessmentsList';
import QuestionSetsList from '../components/FacultyPanel/QuestionSetsList';
import QuestionsList from '../components/FacultyPanel/QuestionsList';
import CreateQuestionModal from '../components/FacultyPanel/CreateQuestionModal'; // Corrected import
import authService from '../services/authService';

const FacultyDashboard = () => {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedSetName, setSelectedSetName] = useState(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [user, setUser] = useState({ username: '', uid: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      console.log(decodedToken);
      setUser({ username: decodedToken.user, uid: decodedToken.uid });
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleQuestionCreated = async () => {
    setShowCreateQuestion(false); 
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-4">
          <CoursesList onCourseSelect={setSelectedCourseId} />
          {selectedCourseId && (
            <AssessmentsList courseId={selectedCourseId} onAssessmentSelect={setSelectedAssessment} />
          )}
          {selectedAssessment && (
            <QuestionSetsList
              assessmentId={selectedAssessment._id}
              onSetSelect={setSelectedSetName}
              onCreateSet={() => console.log('Create Set')}
            />
          )}
        </div>
        <div className="col-md-8 d-flex flex-column align-items-center justify-content-center">
          <div className="card w-100 h-100">
            <div className="card-body text-center">
              <h1 className="display-2">Welcome {user.username}!</h1>
              <p className="lead">UID: {user.uid}</p>
              <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </div>

      {selectedSetName && selectedAssessment && (
        <div className="mt-5">
          <QuestionsList
            assessment={selectedAssessment}
            setName={selectedSetName}
            onCreateQuestion={() => setShowCreateQuestion(true)}
          />
          {showCreateQuestion && (
            <CreateQuestionModal
              assessmentId={selectedAssessment._id}
              setName={selectedSetName}
              onQuestionCreated={handleQuestionCreated}
              onClose={() => setShowCreateQuestion(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;