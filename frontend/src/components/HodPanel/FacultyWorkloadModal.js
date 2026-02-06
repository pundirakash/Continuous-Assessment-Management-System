import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    FaTrash, FaFolderOpen, FaArrowLeft, FaEdit, FaCheck, FaChevronRight,
    FaUserGraduate, FaClipboardList, FaCloudDownloadAlt
} from 'react-icons/fa';
import userService from '../../services/userService';

const FacultyWorkloadModal = ({ show, handleClose, faculty, courses, handleDeallocateCourse, currentTerm }) => {
    const [loading, setLoading] = useState(false);

    // Review Flow State
    const [viewMode, setViewMode] = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [sets, setSets] = useState([]);
    const [selectedSetData, setSelectedSetData] = useState(null);

    // Split View State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [reviewDisplay, setReviewDisplay] = useState('split'); // 'split' or 'list'

    // Approval State
    const [remarks, setRemarks] = useState('');
    const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | null

    // Edit Question State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            resetReviewView();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show]);

    const resetReviewView = () => {
        setViewMode('list');
        setSelectedCourse(null);
        setSelectedAssessment(null);
        setSelectedSetData(null);
        setAssessments([]);
        setSets([]);
        setRemarks('');
        setActionType(null);
        setCurrentQuestionIndex(0);
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
        setSelectedSetData({
            questions: set.questions,
            setName: set.setName,
            hodStatus: set.hodStatus,
            assessmentId: selectedAssessment._id,
            hodRemarks: set.hodRemarks,
            approvedBy: set.approvedBy,
            approvedByName: set.approvedByName,
            approvalDate: set.approvalDate
        });
        setRemarks(set.hodRemarks || '');
        setCurrentQuestionIndex(0);
        setViewMode('questions');
    };

    const submitDecision = async (status) => {
        if (status === 'Rejected' && !remarks.trim()) {
            alert("Please provide remarks for rejection.");
            return;
        }



        try {
            await userService.approveAssessment(
                selectedAssessment._id,
                faculty._id,
                selectedSetData.setName,
                status,
                remarks
            );
            setSets(prev => prev.map(s => s.setName === selectedSetData.setName ? { ...s, hodStatus: status, hodRemarks: remarks } : s));
            setViewMode('sets');
            setSelectedSetData(null);
            setRemarks('');
            setActionType(null);
        } catch (error) {
            console.error("Decision failed", error);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm("Are you sure you want to DELETE this question? This cannot be undone.")) return;
        try {
            await userService.deleteQuestionByHod(questionId);
            const newQuestions = selectedSetData.questions.filter(q => q._id !== questionId);
            setSelectedSetData(prev => ({ ...prev, questions: newQuestions }));
            if (currentQuestionIndex >= newQuestions.length) {
                setCurrentQuestionIndex(Math.max(0, newQuestions.length - 1));
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleEditClick = (q) => {
        setEditingQuestion({ ...q });
        setShowEditModal(true);
    };

    const saveEditedQuestion = async (e) => {
        if (e) e.preventDefault();
        try {
            const payload = {
                ...editingQuestion,
                options: editingQuestion.type === 'MCQ' ? editingQuestion.options.filter(opt => opt.trim() !== '') : []
            };
            await userService.editQuestionByHod(editingQuestion._id, payload);
            setSelectedSetData(prev => ({
                ...prev,
                questions: prev.questions.map(q => q._id === editingQuestion._id ? payload : q)
            }));
            setShowEditModal(false);
            setEditingQuestion(null);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleDownloadAssessment = async (templateNumber) => {
        try {
            const blob = await userService.downloadAssessment(selectedAssessment._id, selectedSetData.setName, templateNumber);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Set_${selectedSetData.setName}_${selectedAssessment.name}.docx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) { console.error('Download failed', e); }
    };

    const handleDownloadSolution = async (templateNumber) => {
        try {
            const blob = await userService.downloadSolution(selectedAssessment._id, selectedSetData.setName, templateNumber);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Solution_Set_${selectedSetData.setName}_${selectedAssessment.name}.docx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error('Solution download error', e);
        }
    };

    const isApproved = (status) => status === 'Approved' || status === 'Approved with Remarks';
    const currentQ = selectedSetData?.questions[currentQuestionIndex];

    const isCorrectOption = (question, opt) => {
        if (!question.solution || !opt) return false;
        return question.solution.trim().toLowerCase() === opt.trim().toLowerCase();
    };

    if (!show) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1100, backdropFilter: 'blur(4px)' }}>

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
                            <p className="m-0 small opacity-75">{faculty?.name} • {faculty?.role}</p>
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
                                            if (viewMode === 'questions') setViewMode('sets');
                                            else if (viewMode === 'sets') setViewMode('assessments');
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
                                    {viewMode === 'questions' && (
                                        <>
                                            <FaChevronRight size={8} className="opacity-50" />
                                            <span className="text-primary disabled">Set {selectedSetData?.setName}</span>
                                        </>
                                    )}
                                </div>
                                {viewMode === 'questions' && selectedSetData?.questions.length > 0 && (
                                    <div className="dropdown">
                                        <button className="btn btn-white btn-sm border rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-2 dropdown-toggle" data-bs-toggle="dropdown">
                                            <FaCloudDownloadAlt className="text-primary" /> Download
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                                            <li><button className="dropdown-item py-2 small fw-medium" onClick={() => handleDownloadAssessment(1)}>Course File Format</button></li>
                                            <li><button className="dropdown-item py-2 small fw-medium" onClick={() => handleDownloadAssessment(selectedAssessment.type === 'MCQ' ? 3 : 4)}>Compact Format</button></li>
                                            <li><hr className="dropdown-divider opacity-50" /></li>
                                            <li><button className="dropdown-item py-2 small text-success fw-bold" onClick={() => handleDownloadSolution(5)}>Download Solution</button></li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drill-down Screens */}
                        <div className="flex-grow-1 overflow-auto">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-primary opacity-50"></div>
                                </div>
                            ) : viewMode === 'list' ? (
                                <div className="p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h6 className="fw-bold text-dark m-0 text-left">Current Term Allocations & Reviews</h6>
                                        <span className="badge bg-white text-secondary border px-3 py-2 rounded-pill small fw-bold shadow-sm">
                                            {courses.length} Active Courses
                                        </span>
                                    </div>
                                    <div className="row g-4">
                                        {courses.map(course => (
                                            <div className="col-md-4" key={course._id}>
                                                <div
                                                    className="bg-white p-4 rounded-4 border shadow-sm text-center cursor-pointer hover-card transition-all position-relative overflow-hidden group"
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
                                        ))}
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
                                                <div className="bg-white p-4 rounded-4 border shadow-sm hover-shadow-md transition-all d-flex align-items-center justify-content-between">
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
                                <div className="h-100 g-0 row overflow-hidden">
                                    {/* Sidebar Question Nav */}
                                    <div className="col-md-3 bg-white border-end h-100 d-flex flex-column text-left">
                                        <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex align-items-center justify-content-between">
                                            <h6 className="fw-bold mb-0">Navigator</h6>
                                            <div className="d-flex bg-white rounded-pill p-1 border shadow-sm" style={{ scale: '0.85' }}>
                                                <button
                                                    className={`btn btn-sm px-3 py-1 rounded-pill fw-bold border-0 transition-all ${reviewDisplay === 'split' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
                                                    onClick={() => setReviewDisplay('split')}
                                                >
                                                    Split
                                                </button>
                                                <button
                                                    className={`btn btn-sm px-3 py-1 rounded-pill fw-bold border-0 transition-all ${reviewDisplay === 'list' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
                                                    onClick={() => setReviewDisplay('list')}
                                                >
                                                    List
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-grow-1 overflow-auto">
                                            <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                                {selectedSetData?.questions.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`question-nav-item shadow-sm rounded-3 d-flex align-items-center justify-content-center fw-bold transition-all cursor-pointer ${idx === currentQuestionIndex ? 'active' : ''}`}
                                                        onClick={() => setCurrentQuestionIndex(idx)}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Decision Section */}
                                        <div className="p-4 border-top bg-light">
                                            <label className="x-small text-secondary fw-bold text-uppercase ls-1 mb-3 d-block opacity-75">Overall Decision</label>
                                            {selectedSetData?.questions.length === 0 ? (
                                                <div className="p-4 bg-white rounded-4 border border-warning border-opacity-50 shadow-sm text-center">
                                                    <div className="mx-auto bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: '40px', height: '40px' }}>
                                                        <FaClipboardList size={20} />
                                                    </div>
                                                    <p className="small text-dark fw-bold mb-1">Set is Empty</p>
                                                    <p className="x-small text-secondary mb-0">Cannot review or approve an assessment with no questions.</p>
                                                </div>
                                            ) : !isApproved(selectedSetData?.hodStatus) ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {!actionType ? (
                                                        <>
                                                            <button
                                                                className="btn btn-success bg-gradient rounded-4 fw-bold w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2 hover-lift transition-all border-0"
                                                                onClick={() => setActionType('approve')}
                                                            >
                                                                <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                                                    <FaCheck size={12} />
                                                                </div>
                                                                <span>Approve Entire Set</span>
                                                            </button>
                                                            <button
                                                                className="btn btn-white rounded-4 fw-bold w-100 py-3 border shadow-sm text-danger hover-shadow-md transition-all d-flex align-items-center justify-content-center gap-2"
                                                                onClick={() => setActionType('reject')}
                                                            >
                                                                <span>Reject Set</span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className={`bg-white p-4 rounded-4 border shadow-lg mt-1 animation-fade-in position-relative overflow-hidden ${actionType === 'approve' ? 'border-success' : 'border-danger'}`}>
                                                            <div className={`position-absolute top-0 start-0 w-100 h-1 px-4 ${actionType === 'approve' ? 'bg-success' : 'bg-danger'}`} style={{ height: '4px' }}></div>
                                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                                <label className={`small fw-bold d-block m-0 d-flex align-items-center gap-2 ${actionType === 'approve' ? 'text-success' : 'text-danger'}`}>
                                                                    {actionType === 'approve' ? <FaCheckCircle /> : <FaTimesCircle />}
                                                                    {actionType === 'approve' ? 'Approval Remarks' : 'Rejection Reason'}
                                                                </label>
                                                                {actionType === 'approve' && <span className="badge bg-light text-secondary border rounded-pill x-small">Optional</span>}
                                                            </div>

                                                            <textarea
                                                                className="form-control bg-light border-0 rounded-3 mb-4 small p-3 custom-input"
                                                                rows="4"
                                                                style={{ fontSize: '14px', resize: 'none' }}
                                                                placeholder={actionType === 'approve' ? "Add any commendations or notes for the faculty..." : "Please specify exactly what needs to be corrected..."}
                                                                value={remarks}
                                                                onChange={(e) => setRemarks(e.target.value)}
                                                                autoFocus
                                                            ></textarea>

                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-light btn-sm flex-grow-1 rounded-pill fw-bold py-2"
                                                                    onClick={() => { setActionType(null); setRemarks(''); }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    className={`btn btn-sm flex-grow-1 rounded-pill text-white fw-bold py-2 shadow-sm ${actionType === 'approve' ? 'btn-success bg-gradient' : 'btn-danger bg-gradient'}`}
                                                                    onClick={() => submitDecision(actionType === 'approve' ? (remarks.trim() ? 'Approved with Remarks' : 'Approved') : 'Rejected')}
                                                                >
                                                                    Confirm Decision
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-success bg-opacity-10 text-success rounded-4 border border-success border-opacity-25 text-center position-relative overflow-hidden">
                                                    <div className="position-absolute top-0 end-0 p-3 opacity-10">
                                                        <FaCheckDouble size={60} />
                                                    </div>
                                                    <div className="bg-white bg-opacity-50 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm mx-auto" style={{ width: '48px', height: '48px' }}>
                                                        <FaCheck size={20} />
                                                    </div>
                                                    <div className="fw-bold h5 mb-1">{selectedSetData?.hodStatus}</div>
                                                    <div className="small opacity-75">
                                                        Processed on {selectedSetData.approvalDate ? new Date(selectedSetData.approvalDate).toLocaleDateString() : 'Unknown Date'}
                                                    </div>
                                                    {selectedSetData?.approvedByName && (
                                                        <div className="mt-3 pt-3 border-top border-success border-opacity-25 x-small fw-bold text-uppercase ls-1 opacity-75">
                                                            Approved by {selectedSetData.approvedByName}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Detail View or List View */}
                                    <div className="col-md-9 bg-light h-100 d-flex flex-column overflow-hidden text-left">
                                        {reviewDisplay === 'list' ? (
                                            <div className="flex-grow-1 overflow-auto p-5">
                                                <div className="mx-auto" style={{ maxWidth: '850px' }}>
                                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                                        <h5 className="fw-bold text-dark m-0">Question Set Details</h5>
                                                        <span className="badge bg-white text-secondary border px-3 py-2 rounded-pill fw-bold shadow-sm">
                                                            {selectedSetData?.questions.length} Questions
                                                        </span>
                                                    </div>

                                                    <div className="d-flex flex-column gap-5">
                                                        {selectedSetData?.questions.map((q, idx) => (
                                                            <div key={q._id} className="bg-white p-5 rounded-5 shadow-sm border position-relative overflow-hidden">
                                                                <div className="d-flex align-items-center justify-content-between mb-4">
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <span className="badge bg-indigo-50 text-dark border-0 px-3 py-2 rounded-4 fw-bold">Q{idx + 1}</span>
                                                                        <div className="d-flex gap-2">
                                                                            <span className="badge bg-light text-secondary border-0 px-2 py-1 rounded-3 x-small">Marks: {q.marks}</span>
                                                                            <span className="badge bg-light text-info border-0 px-2 py-1 rounded-3 x-small">{q.bloomLevel}</span>
                                                                            <span className="badge bg-light text-secondary border-0 px-2 py-1 rounded-3 x-small">{q.courseOutcome}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex gap-2">
                                                                        <button
                                                                            className="btn btn-white shadow-sm border rounded-circle d-flex align-items-center justify-content-center text-primary transition-all"
                                                                            style={{ width: '32px', height: '32px', flexShrink: 0 }}
                                                                            onClick={() => handleEditClick(q)}>
                                                                            <FaEdit size={12} />
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-white shadow-sm border rounded-circle d-flex align-items-center justify-content-center text-danger transition-all"
                                                                            style={{ width: '32px', height: '32px', flexShrink: 0 }}
                                                                            onClick={() => handleDeleteQuestion(q._id)}>
                                                                            <FaTrash size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <p className="fs-6 text-dark mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontWeight: '500' }}>
                                                                    {q.text}
                                                                </p>

                                                                {q.image && (
                                                                    <div className="mb-4 p-3 bg-light rounded-4 border text-center">
                                                                        <img
                                                                            src={`${process.env.REACT_APP_API_URL.replace('/api', '')}/${q.image}`}
                                                                            className="img-fluid rounded-3"
                                                                            style={{ maxHeight: '200px' }}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {q.type === 'MCQ' && (
                                                                    <div className="bg-light p-3 rounded-4 border-dashed">
                                                                        <div className="row g-2">
                                                                            {q.options.map((opt, i) => (
                                                                                <div key={i} className="col-md-6">
                                                                                    <div className={`p-3 rounded-4 d-flex align-items-center gap-3 border-2 transition-all ${isCorrectOption(q, opt) ? 'correct-option-bg border-success border-opacity-50 text-success' : 'bg-white border-light'}`}>
                                                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold x-small ${isCorrectOption(q, opt) ? 'bg-success text-white' : 'bg-secondary bg-opacity-10 text-secondary'}`} style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                                                                                            {String.fromCharCode(65 + i)}
                                                                                        </div>
                                                                                        <div className="small fw-semibold truncate-1">{opt}</div>
                                                                                        {isCorrectOption(q, opt) && <FaCheck size={10} className="ms-auto" />}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : currentQ ? (
                                            <div className="flex-grow-1 overflow-auto px-4 py-3">
                                                <div className="mx-auto" style={{ maxWidth: '850px' }}>
                                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="badge bg-indigo-50 text-primary border px-3 py-2 rounded-pill fw-bold">Question {currentQuestionIndex + 1}</span>
                                                            <div className="d-flex gap-2 text-nowrap">
                                                                <span className="badge bg-white text-secondary border px-2 py-1 rounded-pill x-small">Marks: {currentQ.marks}</span>
                                                                <span className="badge bg-white text-info border border-info border-opacity-25 px-2 py-1 rounded-pill x-small">{currentQ.bloomLevel}</span>
                                                                <span className="badge bg-white text-secondary border px-2 py-1 rounded-pill x-small">{currentQ.courseOutcome}</span>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-white shadow-sm border rounded-circle d-flex align-items-center justify-content-center text-primary hover-shadow-md transition-all"
                                                                style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                                onClick={() => handleEditClick(currentQ)}>
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <button
                                                                className="btn btn-white shadow-sm border rounded-circle d-flex align-items-center justify-content-center text-danger hover-shadow-md transition-all"
                                                                style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                                onClick={() => handleDeleteQuestion(currentQ._id)}>
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-3 px-4 rounded-4 shadow-sm border mb-3 position-relative overflow-hidden">
                                                        <div className="position-relative">
                                                            <p className="fs-6 text-dark mb-3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontWeight: '500' }}>
                                                                {currentQ.text?.trim()}
                                                            </p>

                                                            {currentQ.image && currentQ.image !== 'null' && currentQ.image !== '' && (
                                                                <div className="mb-3 p-2 bg-light rounded-4 border text-center">
                                                                    <div className="d-flex align-items-center gap-2 small text-muted mb-1 x-small">
                                                                        <FaImage size={10} /> Supporting Image
                                                                    </div>
                                                                    <img
                                                                        src={`${process.env.REACT_APP_API_URL.replace('/api', '')}/${currentQ.image}`}
                                                                        alt="Context"
                                                                        className="img-fluid rounded-3 shadow-sm"
                                                                        style={{ maxHeight: '180px', objectFit: 'contain' }}
                                                                    />
                                                                </div>
                                                            )}

                                                            {currentQ.type === 'MCQ' ? (
                                                                <div className="bg-light p-3 rounded-4 border border-dashed">
                                                                    <label className="small fw-bold text-secondary text-uppercase ls-1 mb-2 d-block x-small" style={{ fontSize: '9px' }}>Available Options</label>
                                                                    <div className="d-flex flex-column gap-2">
                                                                        {currentQ.options.map((opt, i) => (
                                                                            <div key={i} className={`p-2 px-3 rounded-3 border-2 transition-all d-flex align-items-center gap-3 ${isCorrectOption(currentQ, opt) ? 'correct-option-bg border-success text-success' : 'bg-white border-light'}`}>
                                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold x-small ${isCorrectOption(currentQ, opt) ? 'bg-success text-white' : 'bg-secondary bg-opacity-10 text-secondary'}`} style={{ width: '24px', height: '24px', minWidth: '24px', fontSize: '10px' }}>
                                                                                    {String.fromCharCode(65 + i)}
                                                                                </div>
                                                                                <div className="flex-grow-1 fw-semibold small line-height-1" style={{ fontSize: '13px' }}>{opt?.trim()}</div>
                                                                                {isCorrectOption(currentQ, opt) && <FaCheck size={11} />}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                currentQ.solution && (
                                                                    <div className="bg-success bg-opacity-10 p-3 rounded-4 border border-success border-opacity-25">
                                                                        <label className="small fw-bold text-success text-uppercase ls-1 mb-2 d-block x-small" style={{ fontSize: '9px' }}>Expected Solution</label>
                                                                        <p className="mb-0 small text-dark fw-medium" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                                                            {currentQ.solution}
                                                                        </p>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="d-flex justify-content-between pb-3">
                                                        <button
                                                            className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold shadow-none"
                                                            style={{ fontSize: '12px' }}
                                                            disabled={currentQuestionIndex === 0}
                                                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm"
                                                            style={{ fontSize: '12px' }}
                                                            disabled={currentQuestionIndex === (selectedSetData?.questions.length - 1)}
                                                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                                        >
                                                            Next Question
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted fst-italic">
                                                Select a question from the navigator to begin review.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inner Edit Modal - Modernized (Faculty Style) */}
                {showEditModal && ReactDOM.createPortal(
                    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', zIndex: 1300, backdropFilter: 'blur(2px)' }}>
                        <div className="bg-white rounded-5 shadow-2xl overflow-hidden d-flex flex-column"
                            style={{ width: '700px', maxHeight: '90vh', animation: 'zoomIn 0.2s ease-out' }}>
                            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="fw-bold m-0 text-dark">Edit Question Details</h6>
                                    <p className="m-0 x-small text-muted">Update question content and parameters</p>
                                </div>
                                <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="p-4 overflow-auto text-left custom-scrollbar" style={{ flex: 1 }}>
                                <div className="mb-4">
                                    <label className="form-label x-small fw-bold text-secondary text-uppercase ls-1">Question Content</label>
                                    <textarea
                                        className="form-control bg-light border-0 rounded-4 py-3 px-4 custom-input"
                                        rows="4"
                                        value={editingQuestion.text}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                                        required
                                        style={{ fontSize: '15px' }}
                                    ></textarea>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label x-small fw-bold text-secondary text-uppercase ls-1">Marks</label>
                                        <input type="number" className="form-control bg-light border-0 rounded-3 custom-input" value={editingQuestion.marks} onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: e.target.value })} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label x-small fw-bold text-secondary text-uppercase ls-1">Bloom Level</label>
                                        <select className="form-select bg-light border-0 rounded-3 custom-input" value={editingQuestion.bloomLevel} onChange={(e) => setEditingQuestion({ ...editingQuestion, bloomLevel: e.target.value })}>
                                            {['L1: Remember', 'L2: Understand', 'L3: Apply', 'L4: Analyze', 'L5: Evaluate', 'L6: Create'].map(lvl => <option key={lvl}>{lvl}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label x-small fw-bold text-secondary text-uppercase ls-1">Outcome</label>
                                        <select className="form-select bg-light border-0 rounded-3 custom-input" value={editingQuestion.courseOutcome} onChange={(e) => setEditingQuestion({ ...editingQuestion, courseOutcome: e.target.value })}>
                                            {['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'].map(co => <option key={co}>{co}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {editingQuestion.type === 'MCQ' && (
                                    <div className="mb-2">
                                        <label className="form-label x-small fw-bold text-secondary text-uppercase ls-1 mb-3">Options & Answer Key</label>
                                        <div className="d-flex flex-column gap-3">
                                            {editingQuestion.options.map((opt, idx) => (
                                                <div key={idx} className="input-group">
                                                    <span className="input-group-text bg-white border border-light-subtle fw-bold text-muted x-small" style={{ width: '36px' }}>{String.fromCharCode(65 + idx)}</span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-light-subtle shadow-none small"
                                                        placeholder={`Option ${idx + 1}`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...editingQuestion.options];
                                                            newOpts[idx] = e.target.value;
                                                            setEditingQuestion(prev => ({ ...prev, options: newOpts }));
                                                        }}
                                                    />
                                                    <div className="input-group-text bg-white border border-light-subtle">
                                                        <input
                                                            className="form-check-input mt-0 cursor-pointer"
                                                            type="radio"
                                                            name="solution"
                                                            checked={editingQuestion.solution?.trim() === opt?.trim() && opt?.trim() !== ''}
                                                            onChange={() => setEditingQuestion(prev => ({ ...prev, solution: opt }))}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {editingQuestion.type === 'Subjective' && (
                                    <div className="mb-4">
                                        <label className="form-label x-small fw-bold text-secondary text-uppercase ls-1">Correct Solution</label>
                                        <textarea
                                            className="form-control bg-light border-0 rounded-4 py-3 px-4 custom-input"
                                            rows="3"
                                            value={editingQuestion.solution}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, solution: e.target.value })}
                                        ></textarea>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-light border-top d-flex gap-3 justify-content-end">
                                <button type="button" className="btn btn-white border rounded-pill px-4 fw-bold" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" onClick={saveEditedQuestion}>Save Changes</button>
                            </div>
                        </div>
                    </div>,
                    document.body
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
        </div >,
        document.body
    );
};

export default FacultyWorkloadModal;
