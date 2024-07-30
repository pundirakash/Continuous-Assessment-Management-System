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

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ username: decodedToken.user, uid: decodedToken.uid, _id: decodedToken._id, department: decodedToken.department });
    }

    const fetchInitialData = async () => {
      const [facultiesResponse, coursesResponse, pendingSetsResponse] = await Promise.all([
        userService.getFacultiesByDepartment(),
        userService.getCoursesByDepartment(),
        userService.getPendingAssessmentSets()
      ]);
      
      setFaculties(facultiesResponse);
      setCourses(coursesResponse);
      setPendingAssessmentSets(pendingSetsResponse);
    };

    fetchInitialData();
  }, []);

  const addCourse = async () => {
    const response = await userService.getCoursesByDepartment();
    setCourses(response);
  };

  const handleShowAddCourse = () => setShowAddCourseModal(true);
  const handleCloseAddCourse = () => setShowAddCourseModal(false);

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
        const updatedCourses = facultyCourses.filter(course => course._id !== courseId);
        setFacultyCourses(updatedCourses);
      } catch (error) {
        console.error("Error deallocating course:", error);
        setError(error.message);
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
      } else {
        alert('Course already assigned to this faculty.');
      }
    } catch (error) {
      console.error("Error assigning course:", error);
    }
  };

  const handleCreateAssignment = async (courseId, assignmentData) => {
    try {
      await userService.createAssessment(courseId, assignmentData);
      handleCloseCreateAssignment();
    } catch (error) {
      console.error("Error creating assignment:", error);
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
    const updatedAssignments = selectedCourseAssignments.map(assignment => 
      assignment._id === assignmentId ? { ...assignment, ...assignmentData } : assignment
    );
    setSelectedCourseAssignments(updatedAssignments);
  };
  
  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      await userService.deleteAssessment(assignmentId);
      const updatedAssignments = selectedCourseAssignments.filter(assignment => assignment._id !== assignmentId);
      setSelectedCourseAssignments(updatedAssignments);
    }
  };
  

  return (
    <div className="container mt-5">
      <Header user={user} onLogout={handleLogout} />
      <div className="row">
        <FacultyList faculties={faculties} onFacultyClick={handleFacultyClick} pendingAssessmentSets={pendingAssessmentSets}/>
        <CourseList 
          courses={courses} 
          onAddCourse={handleShowAddCourse} 
          onAssignCourse={handleShowAssignCourse} 
          onCreateAssignment={handleShowCreateAssignment} 
          onViewAssignments={handleShowViewAssignments} 
          onDeleteCourse={handleDeleteCourse} 
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
    </div>
  );
  
};

const Header = ({ user, onLogout }) => (
  <div className="row mb-4">
    <div className="col-12">
      <h1 className="display-2">Welcome</h1>
      <h1 className="display-2">{user.username}!</h1>
      <p className="lead">UID: {user.uid}</p>
      <p className="lead">{user.department}</p>
      <button className="btn btn-danger mt-2 btn-lg" onClick={onLogout}>Logout</button>
    </div>
  </div>
);

const Modals = ({
  showAddCourseModal, handleCloseAddCourse, addCourse,
  selectedFaculty, showFacultyCoursesModal, handleCloseFacultyCourses,
  facultyCourses, facultyPendingSets, handleDeallocateCourse,
  selectedCourse, showAssignCourseModal, handleCloseAssignCourse, handleAssignCourse,
  showCreateAssignmentModal, handleCloseCreateAssignment, handleCreateAssignment
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
