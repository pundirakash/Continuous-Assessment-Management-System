import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import userService from '../services/userService';
import { useTerm } from '../context/TermContext';
import { FaPlus, FaTrash, FaBook, FaSearch, FaCogs } from 'react-icons/fa';
import CreateCourseModal from '../components/HodPanel/CreateCourseModal';
import CourseManagerModal from '../components/HodPanel/CourseManagerModal';
import FacultyTeamModal from '../components/HodPanel/FacultyTeamModal';
import ManageCoordinatorModal from '../components/HodPanel/ManageCoordinatorModal';
import { FaUserTie, FaCommentDots } from 'react-icons/fa';
import CourseChat from '../components/CourseChat/CourseChat'; // Import Chat Component
import chatService from '../services/chatService';

const HodCourses = () => {
    const { setActiveTab } = useOutletContext();
    const { selectedTerm, isCurrentTerm } = useTerm();
    const [user, setUser] = useState(null);

    const [courses, setCourses] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Course Manager State
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showManagerModal, setShowManagerModal] = useState(false);

    // View Team State
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamToView, setTeamToView] = useState(null);

    // Coordinator Modal State
    const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatCourse, setChatCourse] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    const handleViewTeam = (course) => {
        setTeamToView(course);
        setShowTeamModal(true);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setUser({ ...decoded, role: 'HOD' });
        }
        setActiveTab('courses');
        fetchCourses();
    }, [setActiveTab, fetchCourses]);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const [coursesData, facultiesData] = await Promise.all([
                userService.getCoursesByDepartment(selectedTerm),
                userService.getFacultiesByDepartment()
            ]);
            setCourses(coursesData);
            setFaculties(facultiesData);

            // Poll for unread counts
            fetchUnreadCounts(coursesData.map(c => c._id));
        } catch (err) {
            console.error("Failed to fetch courses", err);
        } finally {
            setLoading(false);
        }
    }, [selectedTerm, fetchUnreadCounts]);

    const fetchUnreadCounts = useCallback(async (courseIds) => {
        try {
            const counts = await chatService.getUnreadCounts(courseIds);
            setUnreadCounts(counts);
        } catch (error) {
            console.error("Failed to fetch unread counts", error);
        }
    }, []);

    useEffect(() => {
        if (courses.length > 0) {
            const interval = setInterval(() => {
                fetchUnreadCounts(courses.map(c => c._id));
            }, 10000); // Check every 10 seconds
            return () => clearInterval(interval);
        }
    }, [courses, fetchUnreadCounts]);

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleManageCourse = (course) => {
        setSelectedCourse(course);
        setShowManagerModal(true);
    };

    const handleManageCoordinator = (course) => {
        setSelectedCourse(course);
        setShowCoordinatorModal(true);
    };

    const handleAppointCoordinator = async (courseId, facultyId) => {
        try {
            await userService.appointCoordinator(facultyId, courseId, selectedTerm);
            alert("Coordinator appointed successfully!");
            fetchCourses(); // Refresh list
        } catch (err) {
            console.error("Failed to appoint coordinator", err);
            alert("Failed to appoint coordinator");
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm("Are you sure you want to REMOVE this course from the CURRENT TERM? It will remain in the catalog.")) return;
        try {
            await userService.deleteCourse(courseId, selectedTerm);
            setCourses(prev => prev.filter(c => c._id !== courseId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete course");
        }
    };

    // Callback for when modal updates data (e.g. assigned faculty), we might want to refresh list
    const handleRefresh = () => {
        fetchCourses();
    };

    return (
        <div className="container-fluid p-4">
            {/* Premium Header */}
            <div className="card mb-4 border-0 shadow-sm bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '15px' }}>
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bold mb-1 text-white">Course Management</h2>
                        <p className="mb-0 text-white-50">Manage curriculum, assign faculty, and oversee course delivery.</p>
                    </div>
                    <button
                        className="btn btn-light rounded-pill px-4 fw-bold shadow-sm hover-scale"
                        onClick={() => setShowCreateModal(true)}
                        disabled={!isCurrentTerm}
                        style={{ color: '#6366f1' }}
                    >
                        <FaPlus className="me-2" /> Add Course
                    </button>
                </div>
            </div>

            {/* Stats & Tools Bar */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px', borderLeft: '5px solid #6366f1' }}>
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-circle bg-indigo-light p-3 me-3 text-indigo" style={{ backgroundColor: '#e0e7ff', color: '#6366f1' }}>
                                <FaBook className="fs-4" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-0 small text-uppercase fw-bold letter-spacing-1">Total Courses</h6>
                                <h3 className="mb-0 fw-bold text-dark">{courses.length}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-9">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                        <div className="card-body d-flex align-items-center p-2">
                            <div className="input-group input-group-lg border-0">
                                <span className="input-group-text bg-transparent border-0 ps-3"><FaSearch className="text-muted" /></span>
                                <input
                                    type="text"
                                    className="form-control border-0 bg-transparent"
                                    placeholder="Search by Course Name, Code, or Facutly..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Table Card */}
            <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr className="text-uppercase text-muted small letter-spacing-1">
                                <th className="border-0 p-4 ps-5">Course Details</th>
                                <th className="border-0 p-4">Coordinator</th>
                                <th className="border-0 p-4">Faculty Team</th>
                                <th className="border-0 p-4 text-end pe-5">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-5 text-muted">Loading courses...</td></tr>
                            ) : filteredCourses.length === 0 ? (
                                <tr><td colSpan="4" className="text-center p-5 text-muted">No courses found matching your criteria.</td></tr>
                            ) : (
                                filteredCourses.map(course => (
                                    <tr key={course._id} style={{ transition: 'all 0.2s' }}>
                                        <td className="p-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                                                    <span className="fw-bold fs-5">{course.code.substring(0, 3)}</span>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 fw-bold text-dark">{course.name}</h6>
                                                    <span className="badge bg-light text-dark border">{course.code}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {course.coordinator ? (
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-success bg-opacity-10 text-success rounded-circle me-2 d-flex justify-content-center align-items-center" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                                        {course.coordinator.name.charAt(0)}
                                                    </div>
                                                    <span className="fw-semibold text-dark">{course.coordinator.name}</span>
                                                </div>
                                            ) : <span className="text-muted small fst-italic">Not Assigned</span>}
                                        </td>
                                        <td className="p-4" style={{ verticalAlign: 'middle' }}>
                                            <div
                                                className="d-flex align-items-center"
                                                onClick={() => handleViewTeam(course)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view full team"
                                            >
                                                {course.faculties && course.faculties.length > 0 ? (
                                                    <div className="d-flex align-items-center ps-2 position-relative faculty-stack-container">
                                                        {course.faculties.slice(0, 4).map((f, i) => (
                                                            <div
                                                                key={i}
                                                                className="rounded-circle border border-2 border-white d-flex align-items-center justify-content-center text-white shadow-sm faculty-avatar"
                                                                title={f.name}
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    marginLeft: '-12px',
                                                                    backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'][i % 4],
                                                                    zIndex: 4 - i,
                                                                    fontSize: '12px',
                                                                    transition: 'transform 0.2s'
                                                                }}
                                                            >
                                                                {f.name.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {course.faculties.length > 4 && (
                                                            <div
                                                                className="rounded-circle border border-2 border-white d-flex align-items-center justify-content-center bg-light text-muted shadow-sm"
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    marginLeft: '-12px',
                                                                    zIndex: 0,
                                                                    fontSize: '11px',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                +{course.faculties.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : <span className="text-muted small">No Faculty Assigned</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-end">
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-outline-success btn-sm px-2"
                                                    title="Manage Coordinator"
                                                    onClick={() => handleManageCoordinator(course)}
                                                >
                                                    <FaUserTie />
                                                </button>
                                                <button
                                                    className="btn btn-outline-dark btn-sm px-2"
                                                    title="Open Course Chat"
                                                    onClick={() => {
                                                        setChatCourse(course);
                                                        setShowChat(true);
                                                        // Optimistically clear unread count
                                                        setUnreadCounts(prev => ({ ...prev, [course._id]: 0 }));
                                                    }}
                                                >
                                                    <div className="position-relative">
                                                        <FaCommentDots />
                                                        {unreadCounts[course._id] > 0 && (
                                                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                                                <span className="visually-hidden">New alerts</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                                <button
                                                    className="btn btn-outline-primary btn-sm px-3"
                                                    title="Manage Course"
                                                    onClick={() => handleManageCourse(course)}
                                                >
                                                    <FaCogs className="me-2" /> Manage
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm px-2"
                                                    title="Remove from Term"
                                                    onClick={() => handleDeleteCourse(course._id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <CreateCourseModal
                show={showCreateModal}
                handleClose={() => setShowCreateModal(false)}
                addCourse={fetchCourses}
            />

            {selectedCourse && (
                <CourseManagerModal
                    show={showManagerModal}
                    handleClose={() => setShowManagerModal(false)}
                    course={selectedCourse}
                    refreshData={handleRefresh}
                    currentTerm={selectedTerm}
                />
            )}
            {/* Faculty Team Modal (Modernized) */}
            <FacultyTeamModal
                show={showTeamModal}
                onClose={() => setShowTeamModal(false)}
                teamToView={teamToView}
                onManageTeam={handleManageCourse}
            />

            {selectedCourse && (
                <ManageCoordinatorModal
                    show={showCoordinatorModal}
                    handleClose={() => setShowCoordinatorModal(false)}
                    course={selectedCourse}
                    faculties={faculties}
                />
            )}

            {/* Course Chat Sidebar */}
            {showChat && chatCourse && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
                    <div className="position-absolute bg-dark bg-opacity-50 w-100 h-100" onClick={() => setShowChat(false)}></div>
                    <CourseChat
                        course={chatCourse}
                        currentUser={user}
                        termId={selectedTerm}
                        onClose={() => setShowChat(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default HodCourses;
