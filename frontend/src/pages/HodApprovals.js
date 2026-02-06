import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import userService from '../services/userService';
import { useTerm } from '../context/TermContext';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import ReviewSetModal from '../components/HodPanel/ReviewSetModal';

const HodApprovals = () => {
    const { setActiveTab } = useOutletContext();
    const { selectedTerm } = useTerm();

    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedSet, setSelectedSet] = useState(null);
    const [reviewContext, setReviewContext] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [loadingSet, setLoadingSet] = useState(false);

    useEffect(() => {
        setActiveTab('approvals');
        fetchPending();
    }, [setActiveTab, selectedTerm]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await userService.getPendingAssessmentSets(selectedTerm);
            setPendingItems(data);
        } catch (err) {
            console.error("Failed to fetch pending approvals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (item) => {
        setLoadingSet(true);
        try {
            // Fetch full set details using the HOD endpoint
            const sets = await userService.getSetsForAssessmentByHOD(item.facultyId, item.assessmentId);
            const fullSet = sets.find(s => s.setName === item.setName);

            if (fullSet) {
                setSelectedSet(fullSet);
                setReviewContext({
                    assessmentId: item.assessmentId,
                    facultyId: item.facultyId,
                    facultyName: item.facultyName
                });
                setShowQuestionModal(true);
            } else {
                alert("Could not load set details. The set might have been deleted.");
            }
        } catch (error) {
            console.error("Failed to load set details", error);
            alert("Error loading set details. Please try again.");
        } finally {
            setLoadingSet(false);
        }
    };

    // Callback when modal closes (presumably after actions)
    const handleCloseModal = () => {
        setShowQuestionModal(false);
        setSelectedSet(null);
        setReviewContext(null);
        fetchPending(); // Refresh list to remove approved items
    };

    return (
        <div className="container-fluid p-4">
            {/* Premium Header */}
            <div className="card mb-4 border-0 shadow-sm bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', borderRadius: '15px' }}>
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bold mb-1 text-white">Pending Approvals Center</h2>
                        <p className="mb-0 text-white-50">Review, vet, and approve question sets submitted by faculty.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center p-5"><span className="spinner-border text-primary"></span></div>
            ) : pendingItems.length === 0 ? (
                <div className="text-center p-5 bg-white rounded shadow-sm border-0" style={{ borderRadius: '20px' }}>
                    <div className="mb-4">
                        <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                            <FaCheckCircle className="display-4" />
                        </div>
                    </div>
                    <h3 className="fw-bold text-dark">All Caught Up!</h3>
                    <p className="text-muted">No pending questions to review at the moment.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {pendingItems.map((item, idx) => (
                        <div className="col-md-6 col-lg-4" key={idx}>
                            <div className="card h-100 border-0 shadow-sm hover-lift" style={{ borderRadius: '15px', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="bg-warning bg-opacity-10 text-warning px-3 py-1 rounded-pill small fw-bold text-uppercase letter-spacing-1">
                                            Pending
                                        </div>
                                        <div className="text-muted small">
                                            <FaClock className="me-1" /> Today
                                        </div>
                                    </div>

                                    <h5 className="card-title fw-bold text-dark mb-1">{item.setName}</h5>
                                    <h6 className="text-primary mb-3 small fw-bold">{item.courseName} <span className="text-muted fw-normal">({item.courseCode})</span></h6>

                                    <div className="mt-auto">
                                        <div className="d-flex align-items-center mb-3 p-3 bg-light rounded-3">
                                            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                                <span className="fw-bold text-primary small">{(item.facultyName || '?').charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Submitted By</div>
                                                <div className="fw-bold text-dark">{item.facultyName || 'Unknown Faculty'}</div>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted small">Total Questions</div>
                                            <div className="fw-bold text-dark fs-5">{item.totalQuestions}</div>
                                        </div>

                                        <button
                                            className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm"
                                            onClick={() => handleReview(item)}
                                            disabled={loadingSet}
                                            style={{ background: 'linear-gradient(to right, #f59e0b, #ea580c)', border: 'none' }}
                                        >
                                            {loadingSet ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                            Review & Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedSet && reviewContext && (
                <ReviewSetModal
                    show={showQuestionModal}
                    handleClose={handleCloseModal}
                    set={selectedSet}
                    assessmentId={reviewContext.assessmentId}
                    facultyId={reviewContext.facultyId}
                    facultyName={reviewContext.facultyName}
                    onRefresh={fetchPending}
                />
            )}
        </div>
    );
};

export default HodApprovals;
