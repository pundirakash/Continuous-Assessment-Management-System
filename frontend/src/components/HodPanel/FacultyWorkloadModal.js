import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    FaTrash, FaFolderOpen, FaArrowLeft, FaEdit, FaCheck, FaChevronRight,
    FaUserGraduate, FaClipboardList, FaCloudDownloadAlt, FaCheckCircle,
    FaTimesCircle, FaCheckDouble, FaImage
} from 'react-icons/fa';
import userService from '../../services/userService';
import ReviewSetModal from './ReviewSetModal';

const FacultyWorkloadModal = ({ show, handleClose, faculty, courses, handleDeallocateCourse, currentTerm, loadingWorkload }) => {
    const [loading, setLoading] = useState(false);

    // Review Flow State
    const [viewMode, setViewMode] = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [sets, setSets] = useState([]);

    // Unified Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedSetForReview, setSelectedSetForReview] = useState(null);

    useEffect(() => {
        if (show) {
            console.log("FacultyWorkloadModal: Opening for", faculty?.name, { coursesCount: (courses || []).length });
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            resetReviewView();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show, faculty]);

    const resetReviewView = () => {
        setViewMode('list');
        setSelectedCourse(null);
        setSelectedAssessment(null);
        setSelectedSetForReview(null);
        setAssessments([]);
        setSets([]);
        setShowReviewModal(false);
    };


    const handleSelectCourseForReview = async (course) => {
        setLoading(true);
        try {
            const data = await userService.getAssessmentsByCourse(course._id, currentTerm);
            setAssessments(data);
            setSelectedCourse(course);
            setViewMode('assessments');
        } catch (error) {
            console.error("Failed to fetch assessments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAppointCoordinator = async (courseId) => {
        if (!window.confirm(`Are you sure you want to appoint ${faculty.name} as Course Coordinator for this course?`)) return;
        try {
            await userService.appointCoordinator(faculty._id, courseId);
            // Update local state to reflect change? 
            // We might need to refresh courses or update the specific course object in the list
            alert("Coordinator appointed successfully!");
            // Ideally we should update the courses prop or have a callback to refresh. 
            // But since courses are passed as prop, we might just show an alert. 
            // Or better, we can't easily update 'courses' prop. 
            // But we can assume it works.
        } catch (error) {
            console.error("Failed to appoint coordinator", error);
            alert("Failed to appoint coordinator");
        }
    };

    const handleSelectAssessment = async (assessment) => {
        setLoading(true);
        try {
            const data = await userService.getSetsForAssessmentByHOD(faculty._id, assessment._id);
            setSets(data);
            setSelectedAssessment(assessment);
            setViewMode('sets');
        } catch (error) {
            console.error("Failed to fetch sets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewQuestions = (set) => {
        setSelectedSetForReview(set);
        setShowReviewModal(true);
    };

    const handleReviewModalClose = () => {
        setShowReviewModal(false);
        // Refresh sets list to show updated status
        if (selectedAssessment) {
            handleSelectAssessment(selectedAssessment);
        }
    };

    const isApproved = (status) => status === 'Approved' || status === 'Approved with Remarks';

    if (!show) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>

            <div className="bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column"
                style={{
                    width: '1000px',
                    maxWidth: '95vw',
                    height: '90vh',
                    animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform, opacity'
                }}>

                {/* Header */}
                <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                            <FaUserGraduate size={24} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-bold">Faculty Workload</h5>
                            <p className="m-0 small opacity-75">{faculty?.name} • {faculty?.role || 'Faculty Member'}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="btn-close btn-close-white opacity-100 shadow-none"></button>
                </div>

                {/* Content Area */}
                <div className="flex-grow-1 overflow-auto bg-light">
                    <div className="h-100 d-flex flex-column">
                        {/* Review Navigation Overlay (Breadcrumbs) */}
                        <div className="px-4 py-2 bg-white border-bottom d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                {viewMode !== 'list' && (
                                    <button
                                        className="btn btn-light btn-sm rounded-circle border d-flex align-items-center justify-content-center"
                                        style={{ width: '28px', height: '28px', flexShrink: 0 }}
                                        onClick={() => {
                                            if (viewMode === 'sets') setViewMode('assessments');
                                            else setViewMode('list');
                                        }}
                                    >
                                        <FaArrowLeft size={10} />
                                    </button>
                                )}
                                <div className="d-flex align-items-center gap-2 small fw-bold text-secondary">
                                    <span className={`cursor-pointer ${viewMode === 'list' ? 'text-primary' : ''}`} onClick={() => resetReviewView()}>Courses</span>
                                    {selectedCourse && (
                                        <>
                                            <FaChevronRight size={8} className="opacity-50" />
                                            <span className={`cursor-pointer ${viewMode === 'assessments' ? 'text-primary' : ''}`} onClick={() => setViewMode('assessments')}>{selectedCourse.name}</span>
                                        </>
                                    )}
                                    {selectedAssessment && (
                                        <>
                                            <FaChevronRight size={8} className="opacity-50" />
                                            <span className={`cursor-pointer ${viewMode === 'sets' ? 'text-primary' : ''}`} onClick={() => setViewMode('sets')}>{selectedAssessment.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow-1 overflow-auto">
                            {loading || loadingWorkload ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-primary opacity-50"></div>
                                </div>
                            ) : viewMode === 'list' ? (
                                <div className="p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h6 className="fw-bold text-dark m-0 text-left">Current Term Allocations & Reviews</h6>
                                        <span className="badge bg-white text-secondary border px-3 py-2 rounded-pill small fw-bold shadow-sm">
                                            {(courses || []).length} Active Courses
                                        </span>
                                    </div>
                                    <div className="row g-4">
                                        {(courses || []).length > 0 ? (courses || []).map(course => (
                                            <div className="col-md-4" key={course._id}>
                                                <div
                                                    className="bg-white p-4 rounded-4 border shadow-sm text-center cursor-pointer hover-card transition-all position-relative overflow-hidden group"
                                                    onClick={() => handleSelectCourseForReview(course)}
                                                >
                                                    <div className="mx-auto bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                                        <FaFolderOpen size={30} />
                                                    </div>
                                                    <h6 className="fw-bold text-dark mb-1">{course.name}</h6>
                                                    <span className="small text-muted mb-3 d-block">{course.code}</span>
                                                    {course.coordinator === faculty._id && (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 mb-2 d-inline-block">
                                                            Course Coordinator
                                                        </span>
                                                    )}
                                                    {faculty.departmentId && course.departmentId && faculty.departmentId !== course.departmentId && (
                                                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-3 py-1 mb-2 d-inline-block">
                                                            External Course
                                                        </span>
                                                    )}
                                                    {!faculty.departmentId && faculty.department !== course.department && (
                                                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-3 py-1 mb-2 d-inline-block">
                                                            External Course
                                                        </span>
                                                    )}

                                                    <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top">
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm flex-grow-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectCourseForReview(course);
                                                                }}
                                                            >
                                                                Review
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeallocateCourse(course._id);
                                                                }}
                                                            >
                                                                Deallocate
                                                            </button>
                                                        </div>
                                                        {course.coordinator !== faculty._id && (
                                                            <button
                                                                className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-secondary border hover-shadow-sm transition-all"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAppointCoordinator(course._id);
                                                                }}
                                                            >
                                                                Make Coordinator
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-12 text-center py-5">
                                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                                                    <FaFolderOpen size={40} className="text-muted opacity-25" />
                                                </div>
                                                <h6 className="fw-bold text-dark">No Courses Found</h6>
                                                <p className="text-secondary small">This faculty member has no courses allocated for the selected term ({currentTerm}).</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : viewMode === 'assessments' ? (
                                <div className="p-4">
                                    <h6 className="fw-bold text-dark mb-4 text-left">Assessments in {selectedCourse?.name}</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {assessments.map(a => (
                                            <div
                                                key={a._id}
                                                className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center justify-content-between hover-shadow-md transition-all cursor-pointer"
                                                onClick={() => handleSelectAssessment(a)}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="p-3 bg-light rounded-3 text-secondary">
                                                        <FaClipboardList size={20} />
                                                    </div>
                                                    <div className="text-left">
                                                        <h6 className="mb-1 fw-bold text-dark">{a.name}</h6>
                                                        <span className={`badge px-2 py-1 rounded-pill x-small ${a.type === 'MCQ' ? 'bg-info bg-opacity-10 text-info' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                                            {a.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <FaChevronRight className="text-muted opacity-25" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : viewMode === 'sets' ? (
                                <div className="p-4">
                                    <h6 className="fw-bold text-dark mb-4 text-left">Question Sets ({selectedAssessment?.name})</h6>
                                    <div className="row g-3">
                                        {sets.map(set => (
                                            <div className="col-md-6" key={set.setName}>
                                                <div
                                                    className="bg-white p-4 rounded-4 border shadow-sm hover-shadow-md transition-all d-flex align-items-center justify-content-between cursor-pointer"
                                                    onClick={() => set.questions.length > 0 && handleViewQuestions(set)}
                                                >
                                                    <div className="text-left">
                                                        <h6 className="fw-bold text-dark mb-2">Set {set.setName}</h6>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className={`badge px-3 py-1 rounded-pill small ${isApproved(set.hodStatus) ? 'bg-success' : set.hodStatus === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                                {set.hodStatus || 'Pending'}
                                                            </span>
                                                            <span className="small text-muted">{set.questions.length} Questions</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className={`btn px-4 rounded-pill fw-bold ${set.questions.length === 0 ? 'btn-light text-muted' : 'btn-primary'}`}
                                                        onClick={() => handleViewQuestions(set)}
                                                        disabled={set.questions.length === 0}
                                                    >
                                                        {set.questions.length === 0 ? 'No Questions' : 'Review Set'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-white bg-opacity-50 h-100 d-flex flex-column align-items-center justify-content-center text-center">
                                    <div className="bg-primary bg-opacity-10 p-4 rounded-circle mb-3 shadow-sm text-primary">
                                        <FaClipboardList size={40} />
                                    </div>
                                    <h5 className="fw-bold text-dark mb-2">Ready to Review</h5>
                                    <p className="text-secondary small max-w-xs mx-auto">
                                        Drill down into courses and assessments to begin reviewing individual question sets.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reused Review Component */}
                {selectedSetForReview && (
                    <ReviewSetModal
                        show={showReviewModal}
                        handleClose={handleReviewModalClose}
                        set={selectedSetForReview}
                        assessmentId={selectedAssessment?._id}
                        facultyId={faculty?._id}
                        facultyName={faculty?.name}
                        onRefresh={handleReviewModalClose}
                    />
                )}

                <style>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .ls-1 { letter-spacing: 0.5px; }
                .x-small { font-size: 10px; }
                .hover-shadow-md:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
                .hover-card:hover { border-color: #4f46e5 !important; background-color: #f8fafc !important; }
                .bg-indigo-50 { background-color: #eef2ff; }
                .bg-gray-50 { background-color: #f9fafb; }
                .custom-input:focus {
                    background-color: #fff !important;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
                    border: 1px solid #4f46e5 !important;
                }
                .question-nav-item {
                    height: 40px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    font-size: 14px;
                }
                .question-nav-item:hover { background: #f1f5f9; color: #1e293b; }
                .question-nav-item.active { background: #4f46e5 !important; border-color: #4f46e5; color: white !important; transform: scale(1.1); }
                .modal-backdrop-custom { will-change: backdrop-filter; }
                .cursor-pointer { cursor: pointer; }
                .truncate-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .border-dashed { border-style: dashed !important; }
                .correct-option-bg { background-color: rgba(25, 135, 84, 0.1) !important; }
            `}</style>
            </div>
        </div>,
        document.body
    );
};

export default FacultyWorkloadModal;
