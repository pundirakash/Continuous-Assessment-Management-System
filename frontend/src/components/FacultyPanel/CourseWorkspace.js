import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/userService';
import LoadingSpinner from '../LoadingSpinner';
import ErrorModal from '../ErrorModal';
import UnifiedSetManager from './UnifiedSetManager';
import CourseChat from '../CourseChat/CourseChat';
import chatService from '../../services/chatService';
import { FaArrowLeft, FaLayerGroup, FaChartPie, FaBookOpen, FaComments } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { useTerm } from '../../context/TermContext';

const CourseWorkspace = ({ course, onBack }) => {
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const { selectedTerm } = useTerm();

    const fetchAssessments = useCallback(async () => {
        try {
            const data = await userService.getAssessments(course._id, selectedTerm);
            setAssessments(data);
            if (data.length > 0) {
                setSelectedAssessment(data[0]);
            }
        } catch (err) {
            setError(err.message || 'Failed to load assessments');
        } finally {
            setLoading(false);
        }
    }, [course?._id, selectedTerm]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setCurrentUser(decoded);
        }
        fetchAssessments();
    }, [fetchAssessments]);

    // Poll for unread counts
    useEffect(() => {
        if (!course?._id) return;

        const checkUnread = async () => {
            try {
                const counts = await chatService.getUnreadCounts([course._id]);
                setUnreadCount(counts[course._id] || 0);
            } catch (error) {
                console.error("Failed to check unread messages");
            }
        };

        checkUnread();
        const interval = setInterval(checkUnread, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [course?._id]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="course-workspace h-100 d-flex flex-column">
            {/* 🌟 Workspace Header (Clean Premium) */}
            <div className="d-flex align-items-center justify-content-between mb-4 p-4 rounded-4 shadow-sm bg-white sticky-top"
                style={{
                    top: '80px',
                    zIndex: 900 // Lowered to let navbar dropdowns pass over
                }}>

                <div className="d-flex align-items-center gap-4">
                    <button
                        className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm text-secondary hover-bg-gray-200 transition-all"
                        style={{ width: '45px', height: '45px' }}
                        onClick={onBack}
                    >
                        <FaArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="m-0 fw-bold text-dark" style={{ fontFamily: 'Syne, sans-serif' }}>{course.name}</h2>
                        <span className="text-secondary fw-bold small font-monospace bg-light border px-2 py-1 rounded">{course.code || course.courseCode}</span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <button
                        className={`btn rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 transition-all ${showChat ? 'btn-primary shadow' : 'btn-outline-primary border-opacity-25'}`}
                        onClick={() => {
                            setShowChat(!showChat);
                            if (!showChat) setUnreadCount(0);
                        }}
                    >
                        <div className="position-relative d-flex align-items-center gap-2">
                            <FaComments />
                            <span>Discussion Hub</span>
                            {unreadCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                    <span className="visually-hidden">New messages</span>
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            <div className="row g-4 flex-grow-1 position-relative">
                {/* 🌟 Sidebar: Sticky & Styled */}
                <div className="col-md-3">
                    <div className="sticky-top" style={{ top: '210px', zIndex: 900 }}>
                        <div className="bg-white rounded-4 shadow-sm overflow-hidden border border-light">
                            <div className="p-4 bg-light border-bottom">
                                <h6 className="fw-bold text-uppercase text-secondary m-0 text-xs tracking-wider d-flex align-items-center gap-2">
                                    <FaBookOpen /> Assessments
                                </h6>
                            </div>
                            <div className="p-2 custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {assessments.length === 0 ? (
                                    <div className="text-center p-5 text-muted small opacity-75">
                                        No assessments found.
                                    </div>
                                ) : (
                                    assessments.map(assessment => {
                                        const isActive = selectedAssessment?._id === assessment._id;
                                        return (
                                            <div
                                                key={assessment._id}
                                                onClick={() => setSelectedAssessment(assessment)}
                                                className={`d-flex align-items-center gap-3 p-3 mb-1 rounded-3 cursor-pointer transition-all ${isActive ? 'bg-primary bg-opacity-10' : 'hover-bg-light'}`}
                                                style={{ borderLeft: isActive ? '4px solid #4f46e5' : '4px solid transparent' }}
                                            >
                                                <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm ${isActive ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 36, height: 36 }}>
                                                    {assessment.type === 'CA' ? <FaLayerGroup /> : <FaChartPie />}
                                                </div>
                                                <div>
                                                    <div className={`fw-bold ${isActive ? 'text-primary' : 'text-dark'}`}>{assessment.name}</div>
                                                    <div className="small text-muted text-xs text-uppercase">{assessment.type}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 Main Content Area */}
                <div className="col-md-9">
                    <div className="bg-white rounded-4 shadow-sm p-4 border border-light h-100" style={{ minHeight: '600px' }}>
                        {selectedAssessment ? (
                            <UnifiedSetManager
                                assessment={selectedAssessment}
                                courseId={course._id}
                            />
                        ) : (
                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50">
                                <div className="bg-light p-4 rounded-circle mb-3">
                                    <FaLayerGroup size={48} className="text-secondary" />
                                </div>
                                <h5 className="fw-normal">Select an assessment to start working</h5>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showChat && currentUser && (
                <>
                    <div
                        className="chat-backdrop position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 animate-fade-in"
                        style={{ zIndex: 1050, cursor: 'pointer' }}
                        onClick={() => setShowChat(false)}
                    />
                    <CourseChat
                        course={course}
                        currentUser={currentUser}
                        termId={selectedTerm}
                        onClose={() => setShowChat(false)}
                    />
                </>
            )}

            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
        </div>
    );
};

export default CourseWorkspace;
