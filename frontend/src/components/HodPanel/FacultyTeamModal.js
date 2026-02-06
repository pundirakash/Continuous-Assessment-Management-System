import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaUserFriends, FaEnvelope, FaChevronRight, FaCogs } from 'react-icons/fa';

const FacultyTeamModal = ({ show, onClose, teamToView, onManageTeam }) => {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show]);

    if (!show || !teamToView) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1100, backdropFilter: 'blur(4px)' }}>

            <div className="bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column"
                style={{
                    width: '550px',
                    maxHeight: '85vh',
                    animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform, opacity'
                }}>

                {/* Header */}
                <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                            <FaUserFriends size={22} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="m-0 fw-bold">Faculty Team</h5>
                                <span className="badge rounded-pill bg-white text-primary small" style={{ fontSize: '0.75rem' }}>
                                    {teamToView.faculties?.length || 0}
                                </span>
                            </div>
                            <p className="m-0 small opacity-75">Course assigned team members</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-close btn-close-white opacity-100 shadow-none"></button>
                </div>

                {/* Course Banner */}
                <div className="px-4 py-3 bg-light border-bottom text-left">
                    <div className="small text-secondary fw-bold text-uppercase ls-1 mb-1">Assigned Course</div>
                    <div className="d-flex align-items-center gap-2">
                        <h6 className="m-0 fw-bold text-dark">{teamToView.name}</h6>
                        <span className="badge bg-white border text-secondary rounded-pill">{teamToView.code}</span>
                    </div>
                </div>

                {/* Faculty List */}
                <div className="flex-grow-1 overflow-auto p-2" style={{ backgroundColor: '#fdfdfd' }}>
                    {teamToView.faculties && teamToView.faculties.length > 0 ? (
                        <div className="d-flex flex-column gap-2 p-2">
                            {teamToView.faculties.map((f, i) => (
                                <div key={i} className="bg-white p-3 rounded-4 border shadow-sm transition-all text-left d-flex align-items-center gap-3 hover-card">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            background: `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#10b981', '#f59e0b'][i % 4]} 0%, ${['#4338ca', '#be185d', '#047857', '#b45309'][i % 4]} 100%)`
                                        }}>
                                        {f.name.charAt(0)}
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                        <h6 className="mb-0 fw-bold text-dark text-truncate">{f.name}</h6>
                                        <div className="d-flex align-items-center gap-1 text-secondary">
                                            <FaEnvelope size={12} className="opacity-50" />
                                            <small className="text-truncate">{f.email}</small>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column align-items-end gap-2">
                                        <span className="badge bg-light text-secondary border rounded-pill x-small px-3">Faculty Member</span>
                                        <FaChevronRight size={12} className="text-muted opacity-25" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5 text-center text-muted h-100 d-flex flex-column align-items-center justify-content-center">
                            <div className="p-3 bg-light rounded-circle mb-3">
                                <FaUserFriends size={48} className="opacity-10" />
                            </div>
                            <p className="fw-bold mb-1">No Faculty Members</p>
                            <p className="small mb-0">Start by allocating faculty to this course.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-top d-flex gap-3">
                    <button className="btn btn-light flex-grow-1 py-2 fw-bold rounded-pill text-secondary border" onClick={onClose}>
                        Close
                    </button>
                    <button className="btn text-white flex-grow-1 py-2 fw-bold shadow-sm rounded-pill d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                            onClose();
                            onManageTeam(teamToView);
                        }}
                        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                    >
                        <FaCogs size={14} /> Manage Team
                    </button>
                </div>

                <style>{`
            @keyframes zoomIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .ls-1 { letter-spacing: 0.5px; }
            .x-small { font-size: 10px; }
            .hover-card:hover {
                background-color: #f8fafc !important;
                border-color: #e2e8f0 !important;
                transform: translateX(4px);
            }
            .modal-backdrop-custom { will-change: backdrop-filter; }
        `}</style>
            </div>
        </div>,
        document.body
    );
};

export default FacultyTeamModal;
