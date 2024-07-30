import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import CoursesList from '../components/FacultyPanel/CoursesList';
import AssessmentsList from '../components/FacultyPanel/AssessmentsList';
import QuestionSetsList from '../components/FacultyPanel/QuestionSetsList';
import QuestionsList from '../components/FacultyPanel/QuestionsList';
import CreateQuestionModal from '../components/FacultyPanel/CreateQuestionModal';
import UpdateSetDetailsModal from '../components/FacultyPanel/UpdateSetDetailsModal'; 
import authService from '../services/authService';
import userService from '../services/userService'; 
import LoadingSpinner from '../components/LoadingSpinner';

const FacultyDashboard = () => {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedSetName, setSelectedSetName] = useState(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showUpdateSetDetails, setShowUpdateSetDetails] = useState(false); 
  const [user, setUser] = useState({ username: '', uid: '', _id: '' });
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      console.log(decodedToken);
      setUser({ username: decodedToken.user, uid: decodedToken.uid, _id: decodedToken._id, department: decodedToken.department });
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm(`Are you sure you want to logout ?`)) {
    authService.logout();
    navigate('/login');
    }
  };

  const handleQuestionCreated = async () => {
    setShowCreateQuestion(false);
  };

  const handleSetDetailsUpdated = () => {
    setShowUpdateSetDetails(false);
  };

  const handleLoading = async (operation) => {
    setLoading(true);
    await operation();
    setLoading(false);
  };

  const handleSetSelect = async (name) => {
    setSelectedSetName(name);

    const details = await userService.getSetDetails(selectedAssessment._id, name);
    if (!details || !details.allotmentDate || !details.submissionDate || !details.maximumMarks) {
      setShowUpdateSetDetails(true);
    }
  };

  return (
    <div className="container mt-5">
      {loading && <LoadingSpinner />} {/* Conditionally render the loading spinner */}
      {!loading && (
        <div className="row">
          <div className="col-md-4">
            <CoursesList onCourseSelect={(id) => handleLoading(() => setSelectedCourseId(id))} />
            {selectedCourseId && (
              <AssessmentsList courseId={selectedCourseId} onAssessmentSelect={(assessment) => handleLoading(() => setSelectedAssessment(assessment))} />
            )}
            {selectedAssessment && (
              <QuestionSetsList
                assessmentId={selectedAssessment._id}
                facultyId={user._id}
                onSetSelect={handleSetSelect}
                onCreateSet={() => handleLoading(() => console.log('Create Set'))}
              />
            )}
          </div>
          <div className="col-md-8 d-flex flex-column align-items-center justify-content-center">
            <div className="card w-100 h-100">
              <div className="card-body text-center">
                <h1 className="display-2">Welcome! {user.username}</h1>
                <p className="lead">UID: {user.uid}</p>
                <p className="lead">{user.department}</p>
                <button className="btn btn-danger mt-3" onClick={() => handleLoading(handleLogout)}>Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedSetName && selectedAssessment && (
        <div className="mt-5">
          <QuestionsList
            assessment={selectedAssessment}
            setName={selectedSetName}
            onCreateQuestion={() => handleLoading(() => setShowCreateQuestion(true))}
          />
          {showCreateQuestion && (
            <CreateQuestionModal
              assessmentId={selectedAssessment._id}
              setName={selectedSetName}
              onQuestionCreated={() => handleLoading(handleQuestionCreated)}
              onClose={() => setShowCreateQuestion(false)}
            />
          )}
        </div>
      )}
      {showUpdateSetDetails && selectedAssessment && (
        <UpdateSetDetailsModal
          assessmentId={selectedAssessment._id}
          setName={selectedSetName}
          onClose={() => setShowUpdateSetDetails(false)}
          onDetailsUpdated={handleSetDetailsUpdated}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;
