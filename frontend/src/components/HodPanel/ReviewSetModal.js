import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    FaTrash, FaEdit, FaCheck,
    FaClipboardList, FaCloudDownloadAlt, FaCheckDouble, FaImage,
    FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import userService from '../../services/userService';

const ReviewSetModal = ({ show, handleClose, set, assessmentId, facultyId, facultyName, onRefresh }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [reviewDisplay, setReviewDisplay] = useState('split'); // 'split' or 'list'
    const [remarks, setRemarks] = useState('');
    const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | null
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [localSetData, setLocalSetData] = useState(null);

    useEffect(() => {
        if (show && set) {
            setLocalSetData(set);
            setRemarks(set.hodRemarks || '');
            setCurrentQuestionIndex(0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show, set]);

    const isApproved = (status) => status === 'Approved' || status === 'Approved with Remarks';
    const currentQ = localSetData?.questions[currentQuestionIndex];

    const isCorrectOption = (question, opt) => {
        if (!question.solution || !opt) return false;
        return question.solution.trim().toLowerCase() === opt.trim().toLowerCase();
    };

    const submitDecision = async (status) => {
        // Explicitly sanitize remarks
        const sanitizedRemarks = remarks ? remarks.trim() : '';

        // Final fallback: If deciding to 'Approve' (locked), force remarks to empty
        // This prevents 'Approved' status carrying ghost remarks
        const finalRemarks = status === 'Approved' ? '' : sanitizedRemarks;

        if (status === 'Rejected' && !finalRemarks) {
            alert("Please provide remarks for rejection.");
            return;
        }

        console.log("Submitting Decision:", { status, finalRemarks, originalRemarks: remarks });

        try {
            await userService.approveAssessment(
                assessmentId,
                facultyId,
                localSetData.setName,
                status,
                finalRemarks
            );
            handleClose();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Decision failed", error);
            alert("Failed to submit decision. Please try again.");
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm("Are you sure you want to DELETE this question? This cannot be undone.")) return;
        try {
            await userService.deleteQuestionByHod(questionId);
            const newQuestions = localSetData.questions.filter(q => q._id !== questionId);
            setLocalSetData(prev => ({ ...prev, questions: newQuestions }));
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
            setLocalSetData(prev => ({
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
            const blob = await userService.downloadAssessment(assessmentId, localSetData.setName, templateNumber);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Set_${localSetData.setName}.docx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) { console.error('Download failed', e); }
    };

    const handleDownloadSolution = async (templateNumber) => {
        try {
            const blob = await userService.downloadSolution(assessmentId, localSetData.setName, templateNumber);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Solution_Set_${localSetData.setName}.docx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error('Solution download error', e);
        }
    };

    if (!show || !localSetData) return null;

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
                            <FaClipboardList size={24} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-bold">Review Assessment Set</h5>
                            <p className="m-0 small opacity-75">{facultyName} • Set {localSetData.setName}</p>
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
                                <div className="d-flex align-items-center gap-2 small fw-bold text-secondary">
                                    <span className="text-primary disabled">Set {localSetData.setName}</span>
                                </div>
                                {localSetData.questions.length > 0 && (
                                    <div className="dropdown">
                                        <button className="btn btn-white btn-sm border rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-2 dropdown-toggle" data-bs-toggle="dropdown">
                                            <FaCloudDownloadAlt className="text-primary" /> Download
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                                            <li><button className="dropdown-item py-2 small fw-medium" onClick={() => handleDownloadAssessment(1)}>Course File Format</button></li>
                                            <li><button className="dropdown-item py-2 small fw-medium" onClick={() => handleDownloadAssessment(3)}>Compact Format</button></li>
                                            <li><hr className="dropdown-divider opacity-50" /></li>
                                            <li><button className="dropdown-item py-2 small text-success fw-bold" onClick={() => handleDownloadSolution(5)}>Download Solution</button></li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drill-down Screens */}
                        <div className="flex-grow-1 overflow-auto">
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
                                            {localSetData.questions.map((_, idx) => (
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
                                        {localSetData.questions.length === 0 ? (
                                            <div className="p-4 bg-white rounded-4 border border-warning border-opacity-50 shadow-sm text-center">
                                                <div className="mx-auto bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: '40px', height: '40px' }}>
                                                    <FaClipboardList size={20} />
                                                </div>
                                                <p className="small text-dark fw-bold mb-1">Set is Empty</p>
                                                <p className="x-small text-secondary mb-0">Cannot review or approve an assessment with no questions.</p>
                                            </div>
                                        ) : !isApproved(localSetData.hodStatus) ? (
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
                                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                                            <label className={`x-small fw-bold text-uppercase ls-1 ${actionType === 'approve' ? 'text-success' : 'text-danger'}`}>
                                                                {actionType === 'approve' ? 'Approval Remarks' : 'Rejection Reason'}
                                                            </label>
                                                            {actionType === 'approve' && <span className="badge bg-light text-secondary border rounded-pill" style={{ fontSize: '9px' }}>Optional</span>}
                                                        </div>

                                                        {actionType === 'approve' && (
                                                            <div className="bg-light rounded-3 p-2 mb-2 border border-light-subtle">
                                                                <div className="d-flex gap-2 align-items-center mb-1 text-secondary" style={{ fontSize: '11px' }}>
                                                                    <FaCheckDouble className="text-success" size={10} />
                                                                    <span>Empty = <strong className="text-success">Lock Set</strong></span>
                                                                </div>
                                                                <div className="d-flex gap-2 align-items-center text-secondary" style={{ fontSize: '11px' }}>
                                                                    <FaEdit className="text-warning" size={10} />
                                                                    <span>With Remarks = <strong className="text-dark">Allow Edit</strong></span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <textarea
                                                            className="form-control bg-light border-0 rounded-3 mb-3 small p-3 custom-input"
                                                            rows="3"
                                                            style={{ fontSize: '13px', resize: 'none' }}
                                                            placeholder={actionType === 'approve' ? "Add remarks to request changes..." : "Reason for rejection..."}
                                                            value={remarks}
                                                            onChange={(e) => setRemarks(e.target.value)}
                                                            autoFocus
                                                        ></textarea>

                                                        {actionType === 'approve' && remarks.trim() && (
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 rounded-pill" style={{ fontSize: '10px' }}>
                                                                    Status: Approved with Remarks
                                                                </span>
                                                                <button
                                                                    className="btn btn-link text-decoration-none p-0 x-small text-danger fw-bold d-flex align-items-center gap-1"
                                                                    onClick={() => setRemarks('')}
                                                                >
                                                                    <FaTrash size={10} /> Clear
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-light btn-sm flex-grow-1 rounded-pill fw-bold"
                                                                onClick={() => { setActionType(null); setRemarks(''); }}
                                                            >
                                                                Back
                                                            </button>
                                                            <button
                                                                className={`btn btn-sm flex-grow-1 rounded-pill text-white fw-bold shadow-sm ${actionType === 'approve' ? 'btn-success bg-gradient' : 'btn-danger bg-gradient'}`}
                                                                onClick={() => submitDecision(actionType === 'approve' ? (remarks.trim() ? 'Approved with Remarks' : 'Approved') : 'Rejected')}
                                                            >
                                                                {actionType === 'approve' ? (remarks.trim() ? 'Approve & Edit' : 'Approve & Lock') : 'Reject'}
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
                                                <div className="fw-bold h5 mb-1">{localSetData.hodStatus}</div>
                                                <div className="small opacity-75">
                                                    Processed on {localSetData.approvalDate ? new Date(localSetData.approvalDate).toLocaleDateString() : 'Unknown Date'}
                                                </div>
                                                {localSetData.approvedByName && (
                                                    <div className="mt-3 pt-3 border-top border-success border-opacity-25 x-small fw-bold text-uppercase ls-1 opacity-75">
                                                        Approved by {localSetData.approvedByName}
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
                                                        {localSetData.questions.length} Questions
                                                    </span>
                                                </div>

                                                <div className="d-flex flex-column gap-5">
                                                    {localSetData.questions.map((q, idx) => (
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
                                                                        alt="Review context"
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
                                                        disabled={currentQuestionIndex === (localSetData.questions.length - 1)}
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
        </div>,
        document.body
    );
};

export default ReviewSetModal;
