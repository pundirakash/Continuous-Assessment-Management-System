
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import userService from '../services/userService';
import { useTerm } from '../context/TermContext';
import { FaUserTie, FaBookOpen, FaSearch } from 'react-icons/fa';
import FacultyWorkloadModal from '../components/HodPanel/FacultyWorkloadModal';

const HodFaculty = () => {
    const { setActiveTab } = useOutletContext();
    const { selectedTerm } = useTerm();

    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Specific Faculty View
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [facultyCourses, setFacultyCourses] = useState([]);
    const [showCoursesModal, setShowCoursesModal] = useState(false);

    useEffect(() => {
        setActiveTab('faculty');
        fetchFaculty();
    }, [setActiveTab, selectedTerm]);

    const fetchFaculty = async () => {
        setLoading(true);
        try {
            const data = await userService.getFacultiesByDepartment();
            setFaculties(data);
        } catch (err) {
            console.error("Failed to fetch faculty", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFaculties = faculties.filter(f =>
        (f.name && f.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.uid && String(f.uid).toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleViewFaculty = async (faculty) => {
        setSelectedFaculty(faculty);
        try {
            // Fetch courses for this faculty
            const courses = await userService.getCoursesByFaculty(faculty._id, selectedTerm);
            setFacultyCourses(courses);

            // Need pending sets for this faculty?
            // We can fetch ALL pending sets and filter, or just rely on the modal to show what we have.
            // Let's fetch all pending sets for department and filter here to pass down.
            const allPending = await userService.getPendingAssessmentSets(selectedTerm);
            const relevantPending = allPending.filter(set => set.facultyId === faculty._id);
            setPendingSets(relevantPending);

            setShowCoursesModal(true);
        } catch (err) {
            console.error("Error loading faculty details", err);
        }
    };

    const handleDeallocateCourse = async (courseId) => {
        if (!selectedFaculty) return;
        if (window.confirm('Are you sure you want to deallocate this course?')) {
            try {
                await userService.removeCourseFromFaculty(selectedFaculty._id, courseId);
                alert(`Course Deallocated successfully!`);
                setFacultyCourses(prev => prev.filter(c => c._id !== courseId));
                // Optionally refresh main list? Not strictly needed unless counts show there.
            } catch (error) {
                console.error('Error Deallocating Course', error);
                alert("Failed to deallocate course");
            }
        }
    };


    return (
        <div className="container-fluid p-4">
            {/* Premium Header */}
            <div className="card mb-4 border-0 shadow-sm bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)', borderRadius: '15px' }}>
                <div className="card-body p-4">
                    <h2 className="fw-bold mb-1 text-white">Faculty Directory</h2>
                    <p className="mb-0 text-white-50">Manage teaching staff, view workloads, and track performance.</p>
                </div>
            </div>

            {/* Stats & Tools Bar */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px', borderLeft: '5px solid #0ea5e9' }}>
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-circle bg-sky-light p-3 me-3 text-sky" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
                                <FaUserTie className="fs-4" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-0 small text-uppercase fw-bold letter-spacing-1">Total Faculty</h6>
                                <h3 className="mb-0 fw-bold text-dark">{faculties.length}</h3>
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
                                    placeholder="Search by Name, UID or Email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 p-3 sticky-th text-uppercase small text-muted fw-bold">Avatar</th>
                                    <th className="border-0 p-3 sticky-th text-uppercase small text-muted fw-bold">Name</th>
                                    <th className="border-0 p-3 sticky-th text-uppercase small text-muted fw-bold">UID</th>
                                    <th className="border-0 p-3 sticky-th text-uppercase small text-muted fw-bold">Email</th>
                                    <th className="border-0 p-3 sticky-th text-uppercase small text-muted fw-bold text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center p-4">Loading faculty...</td></tr>
                                ) : filteredFaculties.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center p-4">No faculty found.</td></tr>
                                ) : (
                                    filteredFaculties.map(faculty => (
                                        <tr key={faculty._id}>
                                            <td className="p-3">
                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <FaUserTie />
                                                </div>
                                            </td>
                                            <td className="p-3 fw-bold">{faculty.name}</td>
                                            <td className="p-3 text-muted">{faculty.uid}</td>
                                            <td className="p-3 text-muted">{faculty.email}</td>
                                            <td className="p-3 text-end">
                                                <button
                                                    className="btn btn-outline-primary btn-sm rounded-pill px-3"
                                                    onClick={() => handleViewFaculty(faculty)}
                                                >
                                                    <FaBookOpen className="me-2" /> View Workload
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedFaculty && (
                <FacultyWorkloadModal
                    show={showCoursesModal}
                    handleClose={() => setShowCoursesModal(false)}
                    faculty={selectedFaculty}
                    courses={facultyCourses}
                    handleDeallocateCourse={handleDeallocateCourse}
                    currentTerm={selectedTerm}
                />
            )}

        </div>
    );
};

export default HodFaculty;

