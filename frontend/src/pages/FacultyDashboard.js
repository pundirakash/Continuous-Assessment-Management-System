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
import '../css/FacultyDashboard.css';
import { FaBell } from 'react-icons/fa';

const FacultyDashboard = () => {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedSetName, setSelectedSetName] = useState(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showUpdateSetDetails, setShowUpdateSetDetails] = useState(false);
  const [isSetDetailsUpdated, setIsSetDetailsUpdated] = useState(true);
  const [user, setUser] = useState({ username: '', uid: '', _id: '', department: '' });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ username: decodedToken.user, uid: decodedToken.uid, _id: decodedToken._id, department: decodedToken.department });
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsData = await userService.getNotifications();
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
    setIsSetDetailsUpdated(true);
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
      setIsSetDetailsUpdated(false);
    } else {
      setIsSetDetailsUpdated(true);
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
                <div className="clock-container">
  <div className="clock">
    <p className="time">
      {currentTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      })}
    </p>
    <p className="date">
      {currentTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </p>
  </div>
</div>
                <button className="btn btn-danger mt-2 mb-2" onClick={() => handleLoading(handleLogout)}>Logout</button>
                <div className="mt-1">
      <h3>Notifications</h3>
      <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
        <FaBell size={30} />
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </div>
      {showNotifications && (
        <div className="notification-container">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <ul>
                  <li><strong>{notification}</strong></li>
                </ul>
              </div>
            ))
          ) : (
            <p className="no-notifications">No notifications</p>
          )}
        </div>
      )}
    </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedSetName && selectedAssessment && isSetDetailsUpdated && (
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
