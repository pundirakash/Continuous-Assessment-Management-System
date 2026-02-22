import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaRobot, FaExclamationTriangle, FaCheckCircle, FaMagic, FaArrowRight, FaCheck, FaSpinner, FaSync, FaLightbulb, FaUserEdit, FaWrench } from 'react-icons/fa';

// Memoized Sidebar Item for Performance
const ReviewListItem = React.memo(({ review, index, isActive, onClick }) => (
    <button
        className={`btn text-start p-3 rounded-3 border-0 w-100 d-flex align-items-start gap-3 transition-all ${isActive ? 'bg-blue-50 text-dark border-start border-4 border-primary shadow-sm' : 'hover-bg-gray text-secondary'}`}
        style={{ position: 'relative' }}
        onClick={onClick}
    >
        <span className={`d-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-light text-dark border'}`}
            style={{ width: '28px', height: '28px', fontSize: '12px' }}>
            {review.questionIndex + 1}
        </span>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <p className="mb-1 small fw-bold text-dark" style={{
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.2',
                maxHeight: '2.4em'
            }}>
                {review.originalText || "Question " + (review.questionIndex + 1)}
            </p>
            <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
                {review.status === 'Approved' ? (
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2" style={{ fontSize: '9px' }}>
                        Approved
                    </span>
                ) : review.isManuallyFixed ? (
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2" style={{ fontSize: '9px' }}>
                        Fix Applied
                    </span>
                ) : (
                    <span className="badge bg-warning bg-opacity-10 text-warning-dark rounded-pill px-2" style={{ fontSize: '9px' }}>Issues</span>
                )}

                {/* Metadata Badges */}
                {review.difficultyLevel && (
                    <span className="badge bg-light text-secondary border rounded-pill px-2" style={{ fontSize: '9px' }}>
                        {review.difficultyLevel}
                    </span>
                )}
                {/* Bloom Level */}
                {(review.bloomDetails?.actual || review.bloomDetails?.labeled) && (
                    <span className="badge bg-light text-secondary border rounded-pill px-2" style={{ fontSize: '9px' }}>
                        {(review.bloomDetails?.actual || review.bloomDetails?.labeled).split(' ')[0].replace(':', '')}
                    </span>
                )}
                {/* CO Level */}
                {(review.coDetails?.actual || review.coDetails?.labeled) && (
                    <span className="badge bg-light text-secondary border rounded-pill px-2" style={{ fontSize: '9px' }}>
                        {review.coDetails?.actual || review.coDetails?.labeled}
                    </span>
                )}
            </div>
        </div>
        {isActive && <FaArrowRight size={12} className="text-primary mt-1" />}
    </button>
));

/**
 * AIReviewModal Component
 * Displays AI-generated feedback and suggestions for assessment questions.
 * Allows users to apply suggested fixes directly to their questions.
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to close the modal
 * @param {object} aiResponse - The JSON response from the AI backend
 * @param {function} onApplyFix - Function(questionIndex, fixedData) to update a question
 * @param {Array} questions - The original array of questions to compare against.
 * @param {boolean} loading - Loading state during AI generation
 * @param {string} feedback - Success feedback message to display
 */
const AIReviewModal = ({ isOpen, onClose, aiResponse, questions, loading, onApplyFix, onApplyAllFixes, onReRun, feedback, isHodView = false }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [applyingFixId, setApplyingFixId] = useState(null);
    const [showReanalyzeConfirm, setShowReanalyzeConfirm] = useState(false);
    const [showApplyAllConfirm, setShowApplyAllConfirm] = useState(false);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    // Helper logic for state-aware displays
    const activeReview = typeof activeTab === 'number' ? aiResponse?.reviews?.[activeTab] : null;
    const currentQuestion = activeReview ? questions?.find(q =>
        (q._id && activeReview.questionId && q._id === activeReview.questionId) ||
        (questions.indexOf(q) === activeReview.questionIndex)
    ) : null;

    // Calculate pending fixes for Bulk Actions
    const fixesToApply = aiResponse?.reviews?.filter(r => {
        if (r.status === 'Approved') return false;
        const liveQ = questions?.find(q =>
            (q._id && r.questionId && q._id === r.questionId) ||
            (questions.indexOf(q) === r.questionIndex)
        );
        if (liveQ?.isManuallyFixed) return false;
        return true;
    }) || [];

    // Authorization logic
    const hasAppliedFixes = questions?.some(q => q.isManuallyFixed);
    const disableReanalyze = loading || (!isHodView && hasAppliedFixes);

    const isMetadataOnlyFix = activeReview?.suggestedFix &&
        (activeReview.suggestedFix.text === currentQuestion?.text || !activeReview.suggestedFix.text) &&
        (activeReview.suggestedFix.bloomLevel !== currentQuestion?.bloomLevel ||
            activeReview.suggestedFix.courseOutcome !== currentQuestion?.courseOutcome ||
            activeReview.suggestedFix.difficultyLevel !== currentQuestion?.difficultyLevel ||
            JSON.stringify(activeReview.suggestedFix.options) !== JSON.stringify(currentQuestion?.options) ||
            activeReview.suggestedFix.solution !== currentQuestion?.solution);

    // Reset to overview when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('summary');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Portal for rendering outside parent hierarchy
    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                zIndex: 1200,
                backdropFilter: 'blur(8px)'
            }}>

            <div className="bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column"
                style={{
                    width: '95vw',
                    maxWidth: '1600px',
                    height: '92vh',
                    animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform, opacity'
                }}>

                {/* Navbar / Header */}
                <div className="px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between shrink-0">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' }}>
                            <FaRobot size={20} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>AI Assessment Review</h5>
                            <div className="d-flex align-items-center gap-2">
                                {aiResponse && (
                                    <span className={`badge rounded-pill px-2 py-0 fw-bold ${aiResponse.summary.alignmentScore >= 80 ? 'bg-success bg-opacity-10 text-success' :
                                        aiResponse.summary.alignmentScore >= 60 ? 'bg-warning bg-opacity-10 text-warning-dark' : 'bg-danger bg-opacity-10 text-danger'
                                        }`} style={{ fontSize: '11px' }}>
                                        Score: {aiResponse.summary.alignmentScore}/100
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn btn-sm btn-light border-secondary text-secondary rounded-pill px-3 fw-bold d-flex align-items-center gap-2 shadow-sm"
                            onClick={() => {
                                setShowReanalyzeConfirm(true);
                            }}
                            disabled={disableReanalyze}
                            title={!isHodView && hasAppliedFixes ? "Re-analysis is disabled because AI fixes have already been applied to this set." : "Regenerate AI Analysis"}
                        >
                            <FaSync className={loading ? "spin-anim" : ""} size={12} /> Re-analyze
                        </button>
                        {aiResponse && aiResponse.reviews.some(r => r.status !== 'Approved') && (
                            <button
                                className={`btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm hover-lift`}
                                onClick={() => {
                                    setDisclaimerAccepted(false); // Reset disclaimer on opening confirm modal
                                    setShowApplyAllConfirm(true);
                                }}
                                disabled={loading || fixesToApply.length === 0}
                                style={{ opacity: (loading || fixesToApply.length === 0) ? 0.5 : 1 }}
                            >
                                <FaWrench size={14} /> Apply All Fixes
                                {fixesToApply.length > 0 && (
                                    <span className="badge bg-white text-primary rounded-pill ms-1 fw-bold" style={{ fontSize: '0.7em' }}>
                                        {fixesToApply.length}
                                    </span>
                                )}
                            </button>
                        )}
                        <button
                            className={`btn btn-sm fw-bold border-0 rounded-pill px-3 ${activeTab === 'summary' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-gray'} ${loading ? 'opacity-50' : ''}`}
                            onClick={() => setActiveTab('summary')}
                            disabled={loading}
                        >
                            Overview
                        </button>
                        <div className="vr h-50 my-auto"></div>
                        <button onClick={onClose} className="btn-close shadow-none opacity-50 hover-opacity-100"></button>
                    </div>
                </div>

                {/* Custom Re-analyze Confirmation Modal */}
                {showReanalyzeConfirm && (
                    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(15, 23, 42, 0.6)', zIndex: 1200, backdropFilter: 'blur(3px)', borderRadius: '24px'
                        }}>
                        <div className="bg-white rounded-4 shadow-lg overflow-hidden"
                            style={{ width: '90%', maxWidth: '380px', animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div className="p-4 text-center">
                                <div className="d-inline-flex bg-warning bg-opacity-10 text-warning p-3 rounded-circle mb-3 align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                    <FaSync size={32} />
                                </div>
                                <h5 className="fw-bold text-dark mb-2">Re-run AI Analysis?</h5>
                                <p className="text-muted small mb-4 px-2 lh-base">
                                    This will regenerate all feedback for the entire question set. This action takes a few moments and will override current suggestions.
                                </p>
                                <div className="d-flex gap-2 w-100">
                                    <button className="btn btn-light text-secondary border fw-bold w-50 py-2 rounded-pill" onClick={() => setShowReanalyzeConfirm(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-warning text-dark fw-bold w-50 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={() => {
                                        setShowReanalyzeConfirm(false);
                                        setActiveTab('summary');
                                        onReRun();
                                    }}>
                                        <FaSync size={12} /> Yes, Re-run
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Apply All Fixes Modal */}
                {showApplyAllConfirm && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1060 }}>
                        <div className="bg-white rounded-4 shadow-lg p-4 mx-3" style={{ maxWidth: '450px', width: '100%', animation: 'slideInDown 0.3s ease-out' }}>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-flex align-items-center justify-content-center">
                                    <FaWrench size={24} />
                                </div>
                                <h4 className="fw-bold mb-0 text-dark">Apply Bulk AI Fixes</h4>
                            </div>
                            <p className="text-secondary mb-4" style={{ fontSize: '15px', lineHeight: '1.5' }}>
                                You are about to instantly apply AI-suggested revisions to <strong>{aiResponse?.reviews?.filter(r => r.status !== 'Approved').length || 0} questions</strong>. This action will modify their content, options, Bloom levels, and CO mappings based on the AI's analysis.
                            </p>

                            <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 p-3 mb-4 d-flex align-items-start gap-3 w-100">
                                <div className="form-check mt-1">
                                    <input
                                        className="form-check-input border-danger"
                                        type="checkbox"
                                        id="aiDisclaimerCheck"
                                        checked={disclaimerAccepted}
                                        onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    />
                                </div>
                                <label className="form-check-label small text-danger fw-medium cursor-pointer" htmlFor="aiDisclaimerCheck" style={{ lineHeight: '1.4' }}>
                                    I acknowledge that AI is an unverified helper tool and is not 100% reliable. I confirm that I take responsibility for these bulk modifications to the assessment.
                                </label>
                            </div>

                            <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top w-100">
                                <button className="btn btn-light px-4 rounded-pill fw-medium" onClick={() => setShowApplyAllConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary px-4 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 hover-lift"
                                    disabled={!disclaimerAccepted}
                                    onClick={() => {
                                        setShowApplyAllConfirm(false);
                                        onApplyAllFixes();
                                    }}>
                                    <FaWrench size={14} /> Execute Fixes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Bar */}
                {feedback && !loading && (
                    <div className="bg-success bg-opacity-10 border-bottom px-4 py-1 text-success small d-flex align-items-center gap-2 animate-fade-in fw-bold">
                        <FaCheckCircle size={10} /> {feedback}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-grow-1 overflow-hidden d-flex bg-light" style={{ position: 'relative' }}>
                    {loading ? (
                        <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-5">
                            <div className="ai-radar-container mb-4">
                                <div className="ai-radar-ring"></div>
                                <div className="ai-radar-spinner"></div>
                                <FaRobot className="ai-radar-icon" size={32} />
                            </div>
                            <h4 className="fw-bold text-dark mb-2" style={{ animation: 'glow-text 2s ease-in-out infinite' }}>
                                AI Cognitive Analysis in Progress...
                            </h4>
                            <p className="text-secondary text-center small text-muted" style={{ maxWidth: '400px' }}>
                                Evaluating Bloom's Taxonomy cognitive depth, mapping Course Outcomes, and validating structural rigor.
                            </p>
                        </div>
                    ) : aiResponse ? (
                        <>
                            {/* Left Sidebar: Question List */}
                            <div className="bg-white border-end d-flex flex-column shadow-sm" style={{ width: '320px', flexShrink: 0 }}>
                                <div className="p-3 bg-gray-50 border-bottom d-flex justify-content-between align-items-center">
                                    <span className="small fw-bold text-uppercase text-secondary ls-1">Questions</span>
                                    <span className="badge bg-gray-200 text-dark rounded-pill">{aiResponse.reviews.length} total</span>
                                </div>

                                <div className="flex-grow-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                                    <div className="d-flex flex-column gap-2">
                                        {aiResponse.reviews.map((review, index) => {
                                            const liveQ = questions?.find(q =>
                                                (q._id && review.questionId && q._id === review.questionId) ||
                                                (questions.indexOf(q) === review.questionIndex)
                                            );
                                            const isFixed = liveQ?.isManuallyFixed || false;
                                            return (
                                                <ReviewListItem
                                                    key={index}
                                                    review={{ ...review, isManuallyFixed: review.isManuallyFixed || isFixed }}
                                                    index={index}
                                                    isActive={activeTab === index}
                                                    onClick={() => { setActiveTab(index); setExpandedQuestionIndex(index); }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div className="flex-grow-1 overflow-y-auto bg-slate-50 p-4 custom-scrollbar">

                                {/* DASHBOARD VIEW */}
                                {activeTab === 'summary' && (
                                    <div className="animate-fade-in mx-auto" style={{ maxWidth: '1000px' }}>
                                        {/* Hero Summary Card */}
                                        <div className="bg-white rounded-4 shadow-sm border p-4 mb-4 text-center position-relative overflow-hidden">
                                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-light opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #f0f9ff 0%, transparent 50%)', zIndex: 0 }}></div>
                                            <div className="position-relative" style={{ zIndex: 1 }}>
                                                <div className="d-inline-flex flex-column align-items-center justify-content-center bg-white rounded-circle shadow-md mb-2"
                                                    style={{ width: '100px', height: '100px', border: `6px solid ${aiResponse.summary.alignmentScore >= 80 ? '#22c55e' : aiResponse.summary.alignmentScore >= 60 ? '#f59e0b' : '#ef4444'}` }}>
                                                    <span className="h2 fw-bold mb-0 text-dark">{aiResponse.summary.alignmentScore}</span>
                                                    <small className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Score</small>
                                                </div>

                                                <div className="d-flex flex-column align-items-center mb-4">
                                                    {(() => {
                                                        const score = aiResponse.summary.alignmentScore;
                                                        const pendingFixes = aiResponse.reviews.filter(r => r.status !== 'Approved').length;
                                                        let label = '';
                                                        let badgeClass = '';

                                                        if (score >= 90) {
                                                            if (pendingFixes === 0) {
                                                                label = 'EXCELLENT';
                                                                badgeClass = 'text-success';
                                                            } else {
                                                                label = score >= 95 ? 'ALMOST PERFECT' : 'NEARLY READY';
                                                                badgeClass = 'text-success';
                                                            }
                                                        } else if (score >= 80) {
                                                            label = 'VERY GOOD';
                                                            badgeClass = 'text-success';
                                                        } else if (score >= 70) {
                                                            label = 'GOOD';
                                                            badgeClass = 'text-warning';
                                                        } else if (score >= 50) {
                                                            label = 'AVERAGE';
                                                            badgeClass = 'text-warning';
                                                        } else {
                                                            label = 'NEEDS WORK';
                                                            badgeClass = 'text-danger';
                                                        }

                                                        return (
                                                            <div className="text-center">
                                                                <h2 className={`fw-bold mb-0 ${badgeClass}`} style={{ fontSize: '2rem', letterSpacing: '-1px' }}>{label}</h2>
                                                                {aiResponse.summary.overallDifficulty && (
                                                                    <span className="badge bg-light text-secondary border px-3 py-1 rounded-pill mt-2">
                                                                        Difficulty: <strong className="text-dark">{aiResponse.summary.overallDifficulty}</strong>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="bg-light p-4 rounded-4 border mx-auto mb-4" style={{ maxWidth: '800px' }}>
                                                    <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-2" style={{ fontSize: '11px' }}>AI Summary</h6>
                                                    <p className="text-dark mb-0 fw-medium" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                                                        {aiResponse.summary.overallSentiment}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-4">
                                            {/* Key Metrics */}
                                            <div className="col-md-4">
                                                <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                                                    <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-4 d-flex align-items-center gap-2">
                                                        <FaCheckCircle className="text-success" /> Quality Stats
                                                    </h6>
                                                    <div className="d-flex flex-column gap-3">
                                                        <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                                                            <span className="text-secondary fw-bold small">Total Questions</span>
                                                            <span className="fw-bold text-dark">{aiResponse.reviews.length}</span>
                                                        </div>
                                                        <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border-start border-4 border-warning">
                                                            <span className="text-secondary fw-bold small">Required Fixes</span>
                                                            <span className="fw-bold text-danger">{aiResponse.reviews.filter(r => r.status !== 'Approved').length}</span>
                                                        </div>
                                                        <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border-start border-4 border-success">
                                                            <span className="text-secondary fw-bold small">Approved / Verified</span>
                                                            <span className="fw-bold text-success">{aiResponse.reviews.filter(r => r.status === 'Approved').length}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Distributions (Calculating on the fly for responsiveness) */}
                                            {(() => {
                                                const total = aiResponse.reviews.length;
                                                const bloomDist = {};
                                                const coDist = {};
                                                const diffDist = { "Easy": 0, "Medium": 0, "Hard": 0 };

                                                aiResponse.reviews.forEach((r, idx) => {
                                                    // Use LIVE question data for distribution — reflects applied fixes
                                                    const liveQ = questions?.[r.questionIndex];
                                                    const bloom = (liveQ?.bloomLevel || r.bloomDetails?.labeled || "Unknown").split(':')[0];
                                                    bloomDist[bloom] = (bloomDist[bloom] || 0) + 1;

                                                    const co = liveQ?.courseOutcome || r.coDetails?.labeled || "Unassigned";
                                                    coDist[co] = (coDist[co] || 0) + 1;

                                                    let diff = "Medium";
                                                    if (bloom === 'L1' || bloom === 'L2') diff = "Easy";
                                                    else if (bloom === 'L5' || bloom === 'L6') diff = "Hard";
                                                    diffDist[diff] = (diffDist[diff] || 0) + 1;
                                                });

                                                return (
                                                    <>
                                                        <div className="col-md-8">
                                                            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                                                                <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-4">Bloom's Taxonomy Distribution</h6>
                                                                <div className="d-flex flex-column gap-3">
                                                                    {Object.entries(bloomDist).sort().map(([level, count]) => (
                                                                        <div key={level}>
                                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                                <span className="fw-bold text-dark small">{level}</span>
                                                                                <span className="small text-muted fw-bold">{count} Qs ({Math.round((count / total) * 100)}%)</span>
                                                                            </div>
                                                                            <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                                                                                <div className="progress-bar rounded-pill" style={{
                                                                                    width: `${(count / total) * 100}%`,
                                                                                    backgroundColor: level.startsWith('L1') || level.startsWith('L2') ? '#3b82f6' : level.startsWith('L3') || level.startsWith('L4') ? '#8b5cf6' : '#ec4899'
                                                                                }}></div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Course Outcome Alignment */}
                                                        <div className="col-md-6">
                                                            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                                                                <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-4">Course Outcome Coverage</h6>
                                                                <div className="d-flex flex-column gap-3">
                                                                    {Object.entries(coDist).sort().map(([co, count]) => (
                                                                        <div key={co} className="p-3 bg-light rounded-3">
                                                                            <div className="d-flex justify-content-between align-items-center">
                                                                                <span className="fw-bold text-primary">{co}</span>
                                                                                <div className="d-flex align-items-center gap-3">
                                                                                    <span className="small text-dark fw-bold">{count} Question(s)</span>
                                                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                                                                                        {Math.round((count / total) * 100)}% Load
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Difficulty Breakdown */}
                                                        <div className="col-md-6">
                                                            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                                                                <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-4">Difficulty Breakdown</h6>
                                                                <div className="row g-3 h-100 align-items-center">
                                                                    {Object.entries(diffDist).map(([level, count]) => (
                                                                        <div key={level} className="col-4 text-center">
                                                                            <div className={`p-3 rounded-4 border-2 border-bottom shadow-sm ${level === 'Easy' ? 'bg-success border-success text-white' : level === 'Medium' ? 'bg-warning border-warning text-dark' : 'bg-danger border-danger text-white'}`}>
                                                                                <h3 className="fw-bold mb-0">{count}</h3>
                                                                                <small className="fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px', opacity: 0.9 }}>{level}</small>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* DETAIL VIEW */}
                                {activeTab !== 'summary' && aiResponse?.reviews?.[activeTab] && questions && (
                                    <div className="mx-auto" style={{ maxWidth: '1100px' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                                            <div>
                                                <h4 className="fw-bold text-dark mb-1">Question {(aiResponse?.reviews?.[activeTab]?.questionIndex ?? 0) + 1} Analysis</h4>
                                                <p className="text-muted small m-0">Comparing your input with AI recommendations</p>
                                            </div>
                                            {aiResponse?.reviews?.[activeTab]?.status === 'Approved'
                                                ? <span className="badge bg-success text-white px-4 py-2 rounded-pill shadow-sm fs-6"><FaCheckCircle className="me-2" /> Verified Alignment</span>
                                                : currentQuestion?.isManuallyFixed
                                                    ? <span className="badge bg-primary text-white px-4 py-2 rounded-pill shadow-sm fs-6"><FaCheckCircle className="me-2" /> Fixes Applied</span>
                                                    : <span className="badge bg-warning text-dark px-4 py-2 rounded-pill shadow-sm fs-6"><FaExclamationTriangle className="me-2" /> Suggestions Available</span>
                                            }
                                        </div>

                                        {/* Critique / Reasoning Box */}
                                        <div className="bg-light p-4 rounded-4 border mb-4 shadow-sm" style={{ borderLeft: '6px solid #fbbf24' }}>
                                            <h6 className="fw-bold text-warning-dark d-flex align-items-center gap-2 mb-2">
                                                <FaLightbulb /> AI CRITIQUE & REASONING
                                            </h6>
                                            <p className="text-dark mb-0 fs-6 lh-base">
                                                {aiResponse?.reviews?.[activeTab]?.critique || "No critique available."}
                                            </p>
                                        </div>

                                        {aiResponse?.reviews?.[activeTab]?.status !== 'Approved' ? (
                                            <div className="row g-4 animate-fade-in">
                                                {/* Left Column: Your Original Input */}
                                                <div className="col-lg-6">
                                                    <div className="h-100 d-flex flex-column">
                                                        <div className="d-flex align-items-center gap-2 mb-2 px-1 text-secondary small fw-bold text-uppercase ls-1">
                                                            <FaUserEdit /> Your Original Input
                                                        </div>
                                                        <div className="card border shadow-sm rounded-4 flex-grow-1 overflow-hidden" style={{ background: '#f8fafc' }}>
                                                            <div className="card-body p-4">
                                                                <div className="mb-4">
                                                                    <span className="x-small fw-bold text-muted text-uppercase d-block mb-1">Question Stem</span>
                                                                    <p className="m-0 text-dark opacity-75" style={{ fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>
                                                                        {questions[aiResponse?.reviews?.[activeTab]?.questionIndex]?.text || "Text unavailable..."}
                                                                    </p>
                                                                    {questions[aiResponse?.reviews?.[activeTab]?.questionIndex]?.image && (
                                                                        <div className="mt-3">
                                                                            <span className="badge bg-light text-secondary border">Contains Image</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="row g-2 mb-4">
                                                                    <div className="col-6">
                                                                        <span className="x-small fw-bold text-muted text-uppercase d-block mb-1">Bloom Level</span>
                                                                        <span className="badge bg-white text-secondary border px-2 py-1 rounded-pill w-100 text-start">{questions[aiResponse?.reviews?.[activeTab]?.questionIndex]?.bloomLevel || "N/A"}</span>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <span className="x-small fw-bold text-muted text-uppercase d-block mb-1">Course Outcome</span>
                                                                        <span className="badge bg-white text-secondary border px-2 py-1 rounded-pill w-100 text-start">{questions[aiResponse?.reviews?.[activeTab]?.questionIndex]?.courseOutcome || "N/A"}</span>
                                                                    </div>
                                                                </div>

                                                                {questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.type === 'MCQ' && questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.options && (
                                                                    <div className="mb-3">
                                                                        <span className="x-small fw-bold text-muted text-uppercase d-block mb-2">Your MCQ Options</span>
                                                                        <div className="d-flex flex-column gap-1 opacity-75">
                                                                            {questions[aiResponse?.reviews?.[activeTab]?.questionIndex].options.map((opt, idx) => (
                                                                                <div key={idx} className={`p-2 rounded border border-light small ${questions[aiResponse?.reviews?.[activeTab]?.questionIndex].solution === opt ? 'bg-success bg-opacity-5 border-success border-opacity-10' : 'bg-white'}`}>
                                                                                    <span className="fw-bold me-2">{String.fromCharCode(65 + idx)})</span> {opt}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.solution && (!questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.options || questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.options.length === 0) && (
                                                                    <div>
                                                                        <span className="x-small fw-bold text-muted text-uppercase d-block mb-1">Your Solution</span>
                                                                        <div className="p-2 bg-white rounded border small opacity-75">{questions[aiResponse?.reviews?.[activeTab]?.questionIndex].solution}</div>
                                                                    </div>
                                                                )}

                                                                <div className="d-flex align-items-center justify-content-around bg-light rounded-3 p-3 mt-4">
                                                                    <div className="d-flex flex-column">
                                                                        <span className="x-small fw-bold text-muted text-uppercase">Difficulty</span>
                                                                        <span className="fw-bold">{questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.difficultyLevel || "Easy"}</span>
                                                                    </div>
                                                                    <div className="vr"></div>
                                                                    <div className="d-flex flex-column">
                                                                        <span className="x-small fw-bold text-muted text-uppercase">Labeled Bloom</span>
                                                                        <span className="fw-bold">{questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.bloomLevel || "N/A"}</span>
                                                                    </div>
                                                                    <div className="vr"></div>
                                                                    <div className="d-flex flex-column">
                                                                        <span className="x-small fw-bold text-muted text-uppercase">AI Detected Bloom</span>
                                                                        <span className={`fw-bold ${(aiResponse?.reviews?.[activeTab]?.bloomDetails?.match) ? 'text-success' : 'text-danger'}`}>
                                                                            {aiResponse?.reviews?.[activeTab]?.suggestedFix?.bloomLevel || aiResponse?.reviews?.[activeTab]?.bloomDetails?.actual || "N/A"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: AI Suggestion */}
                                                <div className="col-lg-6">
                                                    <div className="h-100 d-flex flex-column">
                                                        <div className="d-flex align-items-center gap-2 mb-2 px-1 text-primary small fw-bold text-uppercase ls-1">
                                                            <FaMagic /> AI Suggested Improvement
                                                        </div>
                                                        <div className="card border-primary shadow-lg rounded-4 flex-grow-1 overflow-hidden" style={{ background: '#f0f9ff' }}>
                                                            <div className="card-body p-4">
                                                                <div className="mb-4">
                                                                    <div className="d-flex justify-content-between align-items-end mb-1">
                                                                        <span className="x-small fw-bold text-primary text-uppercase">Proposed Revision</span>
                                                                        {(activeReview?.suggestedFix?.text !== currentQuestion?.text && activeReview?.suggestedFix?.text) &&
                                                                            <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '9px' }}>Changed</span>
                                                                        }
                                                                        {isMetadataOnlyFix &&
                                                                            <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '9px' }}>Alignment Only</span>
                                                                        }
                                                                    </div>
                                                                    <p className="m-0 text-dark fw-bold" style={{ fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>
                                                                        {activeReview?.suggestedFix?.text || (isMetadataOnlyFix ? "Question wording is optimal. Parameter alignment suggested below." : "No text change recommended.")}
                                                                    </p>
                                                                </div>

                                                                <div className="row g-2 mb-4">
                                                                    <div className="col-4">
                                                                        <span className="x-small fw-bold text-primary text-uppercase d-block mb-1">Target Bloom</span>
                                                                        <span className={`badge border px-2 py-1 rounded-pill w-100 text-start ${(aiResponse?.reviews?.[activeTab]?.suggestedFix?.bloomLevel !== questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.bloomLevel) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-primary border-primary border-opacity-25'}`}>
                                                                            {aiResponse?.reviews?.[activeTab]?.suggestedFix?.bloomLevel || questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.bloomLevel}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <span className="x-small fw-bold text-primary text-uppercase d-block mb-1">Alignment CO</span>
                                                                        <span className={`badge border px-2 py-1 rounded-pill w-100 text-start ${(aiResponse?.reviews?.[activeTab]?.suggestedFix?.courseOutcome !== questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.courseOutcome) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-primary border-primary border-opacity-25'}`}>
                                                                            {aiResponse?.reviews?.[activeTab]?.suggestedFix?.courseOutcome || questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.courseOutcome}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <span className="x-small fw-bold text-primary text-uppercase d-block mb-1">Difficulty</span>
                                                                        <span className={`badge border px-2 py-1 rounded-pill w-100 text-start ${(aiResponse?.reviews?.[activeTab]?.suggestedFix?.difficultyLevel !== questions?.[aiResponse?.reviews?.[activeTab]?.questionIndex]?.difficultyLevel) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-primary border-primary border-opacity-25'}`}>
                                                                            {aiResponse?.reviews?.[activeTab]?.suggestedFix?.difficultyLevel || "No Change"}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {aiResponse?.reviews?.[activeTab]?.suggestedFix?.options && aiResponse?.reviews?.[activeTab]?.suggestedFix?.options?.length > 0 && (
                                                                    <div className="mb-3">
                                                                        <span className="x-small fw-bold text-primary text-uppercase d-block mb-2">Suggested Options</span>
                                                                        <div className="d-flex flex-column gap-1">
                                                                            {aiResponse?.reviews?.[activeTab]?.suggestedFix?.options.map((opt, idx) => (
                                                                                <div key={idx} className={`p-2 rounded border small ${aiResponse?.reviews?.[activeTab]?.suggestedFix?.solution === opt ? 'bg-success bg-opacity-10 border-success border-opacity-25' : 'bg-white border-primary border-opacity-10'}`}>
                                                                                    <span className="fw-bold me-2 text-primary">{String.fromCharCode(65 + idx)})</span> {opt}
                                                                                    {aiResponse?.reviews?.[activeTab]?.suggestedFix?.solution === opt && <FaCheck className="text-success float-end mt-1" size={10} />}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {aiResponse?.reviews?.[activeTab]?.suggestedFix?.solution && (!aiResponse?.reviews?.[activeTab]?.suggestedFix?.options || aiResponse?.reviews?.[activeTab]?.suggestedFix?.options?.length === 0) && (
                                                                    <div>
                                                                        <span className="x-small fw-bold text-primary text-uppercase d-block mb-1">Suggested Solution</span>
                                                                        <div className="p-2 bg-white rounded border border-primary border-opacity-10 small fw-bold text-dark">{aiResponse?.reviews?.[activeTab]?.suggestedFix?.solution}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-3 bg-white border-top">
                                                                {currentQuestion?.isManuallyFixed ? (
                                                                    <div className="bg-success bg-opacity-10 text-success p-3 rounded-pill text-center fw-bold d-flex align-items-center justify-content-center gap-2 border border-success border-opacity-25">
                                                                        <FaCheckCircle size={18} /> Optimization Applied Successfully
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 shake-hover"
                                                                        onClick={async () => {
                                                                            const qIdx = aiResponse?.reviews?.[activeTab]?.questionIndex;
                                                                            if (qIdx === undefined) return;
                                                                            setApplyingFixId(qIdx);
                                                                            await onApplyFix(qIdx, aiResponse?.reviews?.[activeTab]?.suggestedFix);
                                                                            setApplyingFixId(null);
                                                                        }}
                                                                        disabled={applyingFixId === aiResponse?.reviews?.[activeTab]?.questionIndex}
                                                                    >
                                                                        {applyingFixId === aiResponse?.reviews?.[activeTab]?.questionIndex ? (
                                                                            <><FaSpinner className="spin-anim me-2" /> Applying...</>
                                                                        ) : (
                                                                            <><FaCheckCircle /> Accept AI Optimization</>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-5 bg-white rounded-4 border border-dashed animate-fade-in shadow-sm mt-4">
                                                <div className="bg-success bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                                                    <FaCheckCircle size={64} className="text-success" />
                                                </div>
                                                <h3 className="text-dark fw-bold mb-3">Perfectly Balanced!</h3>
                                                <p className="text-muted fs-5 mb-0 mx-auto" style={{ maxWidth: '600px' }}>
                                                    The AI has verified this question only needs a review of its parameters. No textual changes are recommended.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </>
                    ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-5 text-muted">
                            <FaRobot size={64} className="mb-3 opacity-25" />
                            <p>No review data available. Click "Review with AI" to start.</p>
                        </div>
                    )}
                </div>

                <style>{`
                    .bg-blue-50 { background-color: #eff6ff; }
                    .border-blue-100 { border-color: #dbeafe; }
                    .bg-green-50 { background-color: #f0fdf4; }
                    .bg-orange-50 { background-color: #fff7ed; }
                    .text-warning-dark { color: #b45309; }
                    .bg-gray-50 { background-color: #f9fafb; }
                    .bg-gray-200 { background-color: #e5e7eb; }
                    .hover-bg-gray:hover { background-color: #f3f4f6; }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    .ls-1 { letter-spacing: 1px; }
                    .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>
            </div>
        </div >,
        document.body
    );
};

export default AIReviewModal;
