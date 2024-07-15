import React, { useEffect, useState } from 'react';
import userService from '../services/userService';
import CreateCourseModal from '../components/HodPanel/CreateCourseModal';
import ViewCoursesModal from '../components/HodPanel/ViewCoursesModal';
import AssignCourseModal from '../components/HodPanel/AssignCourseModal';
import CreateAssignmentModal from '../components/HodPanel/CreateAssignmentModal';  // Import the new modal component
import FacultyList from '../components/HodPanel/FacultyList';
import CourseList from '../components/HodPanel/CourseList';

const HodDashboard = () => {
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showFacultyCoursesModal, setShowFacultyCoursesModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);  // New state for the create assignment modal
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [facultyCourses, setFacultyCourses] = useState([]);

  useEffect(() => {
    const fetchFaculties = async () => {
      const response = await userService.getFacultiesByDepartment();
      setFaculties(response);
    };

    const fetchCourses = async () => {
      const response = await userService.getCoursesByDepartment();
      setCourses(response);
    };

    fetchFaculties();
    fetchCourses();
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
    handleShowFacultyCourses();
  };

  const handleDeallocateCourse = async (courseId) => {
    if (selectedFaculty) {
      try {
        await userService.removeCourseFromFaculty(selectedFaculty._id, courseId);
        const updatedCourses = facultyCourses.filter(course => course._id !== courseId);
        setFacultyCourses(updatedCourses);
      } catch (error) {
        console.error("Error deallocating course:", error);
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

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">HOD Dashboard</h2>
      <div className="row">
        <FacultyList faculties={faculties} onFacultyClick={handleFacultyClick} />
        <CourseList courses={courses} onAddCourse={handleShowAddCourse} onAssignCourse={handleShowAssignCourse} onCreateAssignment={handleShowCreateAssignment} /> 
      </div>
      <CreateCourseModal show={showAddCourseModal} handleClose={handleCloseAddCourse} addCourse={addCourse} />
      {selectedFaculty && (
        <ViewCoursesModal
          show={showFacultyCoursesModal}
          handleClose={handleCloseFacultyCourses}
          faculty={selectedFaculty}
          courses={facultyCourses}
          handleDeallocateCourse={handleDeallocateCourse}
        />
      )}
      {selectedCourse && (
        <AssignCourseModal
          show={showAssignCourseModal}
          handleClose={handleCloseAssignCourse}
          course={selectedCourse}
          assignCourse={handleAssignCourse}
        />
      )}
      {selectedCourse && (
        <CreateAssignmentModal
          show={showCreateAssignmentModal}
          handleClose={handleCloseCreateAssignment}
          course={selectedCourse}
          createAssignment={handleCreateAssignment}
        />
      )}
    </div>
  );
};

export default HodDashboard;
