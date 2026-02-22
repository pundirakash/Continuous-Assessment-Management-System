import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import userService from '../../services/userService';
import { FaRandom, FaDownload, FaTimes } from 'react-icons/fa';

const RandomAssessmentDownloadModal = ({ onClose, assessmentId, setName, totalQuestions }) => {
    const [numberOfQuestions, setNumberOfQuestions] = useState(totalQuestions || 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Body scroll lock
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleDownload = async (e) => {
        if (e) e.preventDefault();
        if (numberOfQuestions < 1) return;

        setLoading(true);
        setError(null);
        try {
            const blob = await userService.downloadRandomApprovedQuestions(assessmentId, numberOfQuestions, setName);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `random_assessment_${setName}.zip`); // Matches backend archiver response
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to generate random assessment. Ensure you have enough approved questions.');
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1050 }}>

            <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column animate-zoom-in"
                style={{
                    width: '500px',
                    animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform, opacity'
                }}>

                {/* Modern Gradient Header */}
                <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                            <FaRandom size={20} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-bold">Random Set Generator</h5>
                            <p className="m-0 small opacity-75">Generate assessment from approved bank</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-link text-white p-0 opacity-75 hover-opacity-100 transition-all border-0 shadow-none">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4">
                    <p className="text-secondary small mb-4">
                        This tool will randomly select questions from the approved bank to create a unique ZIP containing the assessment, solution, and course format.
                    </p>

                    {error && (
                        <div className="alert alert-danger py-2 small border-0 mb-4" style={{ background: '#fef2f2', color: '#991b1b' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleDownload}>
                        <div className="mb-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase spacing-wide mb-2 d-block">Number of Questions</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-control form-control-lg bg-light border-0 fw-bold text-center"
                                    style={{ fontSize: '2rem', height: '80px', borderRadius: '12px' }}
                                    value={numberOfQuestions}
                                    onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 0)}
                                    min="1"
                                    autoFocus
                                />
                            </div>
                            <div className="form-text text-muted mt-2 text-center">
                                Enter the total questions to include in the generated set.
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="d-flex justify-content-end gap-3 pt-2">
                            <button
                                type="button"
                                className="btn btn-light border-0 px-4 fw-bold rounded-pill"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn text-white px-5 fw-bold shadow-sm rounded-pill d-flex align-items-center gap-2"
                                disabled={loading || numberOfQuestions < 1}
                                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FaDownload /> Generate & Download
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .spacing-wide { letter-spacing: 0.05em; }
                .hover-opacity-100:hover { opacity: 1 !important; }
            `}</style>
        </div>,
        document.body
    );
};

export default RandomAssessmentDownloadModal;
