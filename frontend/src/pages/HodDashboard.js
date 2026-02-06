import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import userService from '../services/userService';
import authService from '../services/authService';
import CreateCourseModal from '../components/HodPanel/CreateCourseModal';
import ViewCoursesModal from '../components/HodPanel/ViewCoursesModal';
import AssignCourseModal from '../components/HodPanel/AssignCourseModal';
import CreateAssignmentModal from '../components/HodPanel/CreateAssignmentModal';
import ViewAssignmentsModal from '../components/HodPanel/ViewAssignmentsModal';
import FacultyList from '../components/HodPanel/FacultyList';
import CourseList from '../components/HodPanel/CourseList';
import ErrorModal from '../components/ErrorModal';
import ManageCoordinatorModal from '../components/HodPanel/ManageCoordinatorModal';
import MasterDownloaderModal from '../components/HodPanel/MasterDownloaderModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TermSelector from '../components/TermSelector';
import { useTerm } from '../context/TermContext';
import { FaCloudDownloadAlt } from 'react-icons/fa';

const HodDashboard = () => {
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pendingAssessmentSets, setPendingAssessmentSets] = useState([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showFacultyCoursesModal, setShowFacultyCoursesModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [showManageCoordinatorModal, setShowManageCoordinatorModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [facultyCourses, setFacultyCourses] = useState([]);
  const [facultyPendingSets, setFacultyPendingSets] = useState([]);
  const [user, setUser] = useState({ username: '', uid: '', _id: '' });
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showViewAssignmentsModal, setShowViewAssignmentsModal] = useState(false);
  const [selectedCourseAssignments, setSelectedCourseAssignments] = useState([]);
  const [showMasterDownloaderModal, setShowMasterDownloaderModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedTerm } = useTerm();

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ username: decodedToken.user, uid: decodedToken.uid, _id: decodedToken._id, department: decodedToken.department });
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [facultiesResponse, coursesResponse, pendingSetsResponse] = await Promise.all([
          userService.getFaculties(),
          userService.getCoursesByDepartment(selectedTerm),
          userService.getPendingAssessmentSets(selectedTerm)
        ]);

        setFaculties(facultiesResponse);
        setCourses(coursesResponse);
        setPendingAssessmentSets(pendingSetsResponse);
      } catch (error) {
        setError('Failed to load data');
        setShowErrorModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedTerm) {
      fetchInitialData();
    }
  }, [selectedTerm]);

  const addCourse = async () => {
    const response = await userService.getCoursesByDepartment();
    setCourses(response);
  };

  const handleShowAddCourse = () => setShowAddCourseModal(true);
  const handleCloseAddCourse = () => setShowAddCourseModal(false);

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };
  const handleShowMasterDownloader = () => setShowMasterDownloaderModal(true);
  const handleCloseMasterDownloader = () => setShowMasterDownloaderModal(false);

  const handleShowFacultyCourses = () => setShowFacultyCoursesModal(true);
  const handleCloseFacultyCourses = () => {
    setShowFacultyCoursesModal(false);
    setSelectedFaculty(null);
  };

  const handleShowAssignCourse = (course) => {
    setSelectedCourse(course);
    setShowAssignCourseModal(true);
  };
  const handleCloseAssignCourse = () => setShowAssignCourseModal(false);

  const handleShowManageCoordinator = (course) => {
    setSelectedCourse(course);
    setShowManageCoordinatorModal(true);
  };
  const handleCloseManageCoordinator = () => setShowManageCoordinatorModal(false);

  const handleShowCreateAssignment = (course) => {
    setSelectedCourse(course);
    setShowCreateAssignmentModal(true);
  };
  const handleCloseCreateAssignment = () => setShowCreateAssignmentModal(false);

  const handleFacultyClick = async (faculty) => {
    setSelectedFaculty(faculty);
    const response = await userService.getCoursesByFaculty(faculty._id, selectedTerm);
    setFacultyCourses(response);
    const facultyPending = pendingAssessmentSets.filter(set => set.facultyId === faculty._id);
    setFacultyPendingSets(facultyPending);
    handleShowFacultyCourses();
  };

  const handleDeallocateCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to deallocate this course from the faculty?')) {
      if (selectedFaculty) {
        try {
          await userService.removeCourseFromFaculty(selectedFaculty._id, courseId);
          alert(`Course Deallocated successfully!`);
          const updatedCourses = facultyCourses.filter(course => course._id !== courseId);
          setFacultyCourses(updatedCourses);
        } catch (error) {
          console.error('Error Deallocating Course', error);
          if (error.response && error.response.data && error.response.data.message) {
            setError(error.response.data.message);
          } else {
            setError(error.message);
          }
          setShowErrorModal(true);
        }
      }
    }
  };

  const handleAssignCourse = async (facultyId, courseId) => {
    try {
      const response = await userService.getCoursesByFaculty(facultyId);
      const isCourseAssigned = response.some(course => course._id === courseId);
      if (!isCourseAssigned) {
        await userService.assignCourseToFaculty(facultyId, courseId);
        alert(`Course Assigned successfully!`);
      } else {
        alert('Course already assigned to this faculty.');
      }
    } catch (error) {
      console.error('Error Assigning Course', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true);
    }
  };

  const handleCreateAssignment = async (courseId, assignmentData) => {
    try {
      await userService.createAssessment(courseId, assignmentData);
      alert(`Assessment Created successfully!`);
      handleCloseCreateAssignment();
    } catch (error) {
      console.error('Error Creating Assignment', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true);
    }
  };

  const handleAppointCoordinator = async (courseId, facultyId) => {
    try {
      await userService.appointCoordinator(facultyId, courseId);
      alert("Coordinator appointed successfully!");

      // Refresh courses to show updated coordinator immediately
      const updatedCourses = await userService.getCoursesByDepartment(selectedTerm);
      setCourses(updatedCourses);

    } catch (error) {
      console.error("Failed to appoint coordinator", error);
      setError("Failed to appoint coordinator");
      setShowErrorModal(true);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleShowViewAssignments = async (course) => {
    const assignments = await userService.getAssessmentsByCourse(course._id, selectedTerm);
    setSelectedCourse(course);
    setSelectedCourseAssignments(assignments);
    setShowViewAssignmentsModal(true);
  };

  const handleCloseViewAssignments = () => {
    setShowViewAssignmentsModal(false);
    setSelectedCourse(null);
    setSelectedCourseAssignments([]);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      await userService.deleteCourse(courseId);
      const updatedCourses = courses.filter(course => course._id !== courseId);
      setCourses(updatedCourses);
    }
  };

  const handleEditAssignment = async (assignmentId, assignmentData) => {
    await userService.editAssessment(assignmentId, assignmentData);
    alert(`Assessment Edited successfully!`);
    const updatedAssignments = selectedCourseAssignments.map(assignment =>
      assignment._id === assignmentId ? { ...assignment, ...assignmentData } : assignment
    );
    setSelectedCourseAssignments(updatedAssignments);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      await userService.deleteAssessment(assignmentId);
      alert(`Assessment Deleted successfully!`);
      const updatedAssignments = selectedCourseAssignments.filter(assignment => assignment._id !== assignmentId);
      setSelectedCourseAssignments(updatedAssignments);
    }
  };


  const handleChangePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
      setShowChangePasswordModal(false);
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    }
  };


  return (
    <div className="container mt-5">
      <Header user={user} onLogout={handleLogout} handleShowMasterDownloader={handleShowMasterDownloader} openChangePasswordModal={openChangePasswordModal} />
      <div className="row">
        <FacultyList
          faculties={faculties}
          onFacultyClick={handleFacultyClick}
          pendingAssessmentSets={pendingAssessmentSets}
          isLoading={isLoading}
        />
        <CourseList
          courses={courses}
          onAddCourse={handleShowAddCourse}
          onAssignCourse={handleShowAssignCourse}
          onManageCoordinator={handleShowManageCoordinator}
          onCreateAssignment={handleShowCreateAssignment}
          onViewAssignments={handleShowViewAssignments}
          onDeleteCourse={handleDeleteCourse}
          isLoading={isLoading}
        />
      </div>
      <Modals
        showAddCourseModal={showAddCourseModal}
        handleCloseAddCourse={handleCloseAddCourse}
        addCourse={addCourse}
        selectedFaculty={selectedFaculty}
        showFacultyCoursesModal={showFacultyCoursesModal}
        handleCloseFacultyCourses={handleCloseFacultyCourses}
        facultyCourses={facultyCourses}
        facultyPendingSets={facultyPendingSets}
        handleDeallocateCourse={handleDeallocateCourse}
        selectedCourse={selectedCourse}
        showAssignCourseModal={showAssignCourseModal}
        handleCloseAssignCourse={handleCloseAssignCourse}
        handleAssignCourse={handleAssignCourse}
        showCreateAssignmentModal={showCreateAssignmentModal}
        handleCloseCreateAssignment={handleCloseCreateAssignment}
        handleCreateAssignment={handleCreateAssignment}
        showManageCoordinatorModal={showManageCoordinatorModal}
        handleCloseManageCoordinator={handleCloseManageCoordinator}
        handleAppointCoordinator={handleAppointCoordinator}
        faculties={faculties}
      />
      {showViewAssignmentsModal && (
        <ViewAssignmentsModal
          show={showViewAssignmentsModal}
          handleClose={handleCloseViewAssignments}
          assignments={selectedCourseAssignments}
          course={selectedCourse}
          onEditAssignment={handleEditAssignment}
          onDeleteAssignment={handleDeleteAssignment}
        />
      )}
      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
      {showMasterDownloaderModal && (
        <MasterDownloaderModal
          show={showMasterDownloaderModal}
          handleClose={handleCloseMasterDownloader}
        />
      )}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onChangePassword={handleChangePassword}
        />
      )}

    </div>
  );

};

const Header = ({ user, onLogout, handleShowMasterDownloader, openChangePasswordModal }) => (
  <div className="card w-100 border-0 shadow-lg overflow-hidden position-relative mb-4" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
    {/* Background Pattern */}
    <div className="position-absolute top-0 start-0 w-100 h-100" style={{ opacity: 0.05 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    {/* Abstract Shapes */}
    <div className="position-absolute" style={{ top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
    <div className="position-absolute" style={{ bottom: '-10%', left: '-5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', borderRadius: '50%' }}></div>

    <div className="card-body p-4 p-lg-5 position-relative text-white">
      <div className="row align-items-center">
        <div className="col-lg-8 text-center text-lg-start mb-4 mb-lg-0">
          <div className="d-flex align-items-center justify-content-center justify-content-lg-start mb-3">
            <div className="bg-white bg-opacity-25 rounded-pill px-3 py-1 text-white border border-white border-opacity-25 small backdrop-blur-sm">
              <span className="fw-bold">UID:</span> {user.uid}
            </div>
            <div className="mx-2 text-white opacity-50">•</div>
            <div className="bg-white bg-opacity-25 rounded-pill px-3 py-1 text-white border border-white border-opacity-25 small backdrop-blur-sm">
              {user.department}
            </div>
            <div className="ms-3">
              <TermSelector dark />
            </div>
          </div>

          <h1 className="display-5 fw-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Welcome back, {user.username}!</h1>
          <p className="lead opacity-75 mb-0" style={{ maxWidth: '600px', fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem' }}>
            Manage your department's academic ecosystem with precision.
          </p>
        </div>

        <div className="col-lg-4 text-center text-lg-end">
          <div className="d-flex flex-column gap-3 justify-content-center align-items-center align-items-lg-end">
            <button
              className="btn btn-light btn-lg px-4 py-3 rounded-pill shadow-sm fw-bold d-flex align-items-center gap-2 hover-scale w-100 justify-content-center"
              style={{ maxWidth: '280px', color: '#4f46e5' }}
              onClick={handleShowMasterDownloader}
            >
              <FaCloudDownloadAlt /> Master Explorer
            </button>

            <div className="d-flex gap-2 w-100 justify-content-center justify-content-lg-end" style={{ maxWidth: '280px' }}>
              <button
                className="btn btn-outline-light px-3 py-2 rounded-pill fw-medium backdrop-blur-sm border-2 hover-white w-100"
                onClick={openChangePasswordModal}
              >
                Change Password
              </button>
              <button
                className="btn btn-danger bg-gradient px-3 py-2 rounded-pill fw-medium shadow-sm border-0 hover-lift w-100"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Modals = ({
  showAddCourseModal, handleCloseAddCourse, addCourse,
  selectedFaculty, showFacultyCoursesModal, handleCloseFacultyCourses,
  facultyCourses, facultyPendingSets, handleDeallocateCourse,
  selectedCourse, showAssignCourseModal, handleCloseAssignCourse, handleAssignCourse,
  showManageCoordinatorModal, handleCloseManageCoordinator, handleAppointCoordinator, faculties,
  showCreateAssignmentModal, handleCloseCreateAssignment, handleCreateAssignment, showErrorModal
}) => (
  <>
    <CreateCourseModal show={showAddCourseModal} handleClose={handleCloseAddCourse} addCourse={addCourse} />
    {selectedFaculty && (
      <ViewCoursesModal
        show={showFacultyCoursesModal}
        handleClose={handleCloseFacultyCourses}
        faculty={selectedFaculty}
        courses={facultyCourses}
        pendingAssessmentSets={facultyPendingSets}
        handleDeallocateCourse={handleDeallocateCourse}
      />
    )}
    {selectedCourse && (
      <>
        <AssignCourseModal
          show={showAssignCourseModal}
          handleClose={handleCloseAssignCourse}
          course={selectedCourse}
          assignCourse={handleAssignCourse}
        />
        <ManageCoordinatorModal
          show={showManageCoordinatorModal}
          handleClose={handleCloseManageCoordinator}
          course={selectedCourse}
          faculties={faculties}
          appointCoordinator={handleAppointCoordinator}
        />
        <CreateAssignmentModal
          show={showCreateAssignmentModal}
          handleClose={handleCloseCreateAssignment}
          course={selectedCourse}
          createAssignment={handleCreateAssignment}
        />
      </>
    )}

  </>
);

export default HodDashboard;
