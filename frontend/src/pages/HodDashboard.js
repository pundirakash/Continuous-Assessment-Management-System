import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
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
import MasterDownloaderModal from '../components/HodPanel/MasterDownloaderModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const HodDashboard = () => {
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pendingAssessmentSets, setPendingAssessmentSets] = useState([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showFacultyCoursesModal, setShowFacultyCoursesModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
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

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ username: decodedToken.user, uid: decodedToken.uid, _id: decodedToken._id, department: decodedToken.department });
    }

    const fetchInitialData = async () => {
      try {
        const [facultiesResponse, coursesResponse, pendingSetsResponse] = await Promise.all([
          userService.getFacultiesByDepartment(),
          userService.getCoursesByDepartment(),
          userService.getPendingAssessmentSets()
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

    fetchInitialData();
  }, []);

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

  const handleShowCreateAssignment = (course) => {
    setSelectedCourse(course);
    setShowCreateAssignmentModal(true);
  };
  const handleCloseCreateAssignment = () => setShowCreateAssignmentModal(false);

  const handleFacultyClick = async (faculty) => {
    setSelectedFaculty(faculty);
    const response = await userService.getCoursesByFaculty(faculty._id);
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

  const handleLogout = () => {
    if (window.confirm(`Are you sure you want to logout ?` )) {
    authService.logout();
    navigate('/login');
    }
  };

  const handleShowViewAssignments = async (course) => {
    const assignments = await userService.getAssessmentsByCourse(course._id);
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
      <Header user={user} onLogout={handleLogout} handleShowMasterDownloader={handleShowMasterDownloader} openChangePasswordModal={openChangePasswordModal}/>
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

const Header = ({ user, onLogout,handleShowMasterDownloader, openChangePasswordModal }) => (
  <div className='card w-100 h-100'>
    <div className="card-body text-center">
  <div className="row mb-4">
    <div className="col-12">
      <h1 className="display-2">Welcome</h1>
      <h1 className="display-2">{user.username}!</h1>
      <p className="lead">UID: {user.uid}</p>
      <p className="lead">{user.department}</p>
      <button className="btn btn-primary mt-2" onClick={handleShowMasterDownloader}>
  Master Downloader
</button>
<button className="btn btn-primary mt-2" onClick={openChangePasswordModal}>Change Password</button><br></br> 
      <button className="btn btn-danger mt-4 btn-lg" onClick={onLogout}>Logout</button>
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
