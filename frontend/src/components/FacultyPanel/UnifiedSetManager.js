import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import userService from '../../services/userService';
import QuestionsList from './QuestionsList';
import CreateSetModal from './CreateSetModal';
// Duplicate removed
// import LoadingSpinner from '../LoadingSpinner';
import SkeletonLoader from '../SkeletonLoader';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';

const UnifiedSetManager = ({ assessment, courseId }) => {
    const [sets, setSets] = useState([]);
    const [activeSet, setActiveSet] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCreateSetModal, setShowCreateSetModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

    const fetchSets = useCallback(async () => {
        setLoading(true);
        setSets([]); // Clear previous sets to prevent ghosting
        setActiveSet(null); // Clear active set
        try {
            const data = await userService.getSetsForAssessment(assessment._id);
            setSets(data);
            // If we have sets, default to the first one, or keep current if it still exists
            if (data.length > 0) {
                setActiveSet(prev => {
                    if (prev && data.find(s => s.setName === prev.setName)) return prev;
                    return data[0]; // Default to first
                });
            } else {
                setActiveSet(null);
            }
        } catch (error) {
            console.error("Failed to fetch sets", error);
        } finally {
            setLoading(false);
        }
    }, [assessment]);

    useEffect(() => {
        fetchSets();
    }, [fetchSets]);

    const handleCreateSet = async (numSets) => {
        // ... Logic from QuestionSetsList ...
        try {
            const existingSets = await userService.getSetsForAssessment(assessment._id);
            const startIndex = existingSets.length;
            const setNames = Array.from({ length: numSets }, (_, i) => String.fromCharCode(65 + startIndex + i));

            for (const setName of setNames) {
                await userService.createSetForAssessment(assessment._id, setName);
            }
            setShowCreateSetModal(false);
            fetchSets(); // Refresh
        } catch (e) { console.error(e); }
    };

    const handleSetTabClick = (set) => {
        setActiveSet(set);
    };

    const handleDeleteSet = () => {
        if (!activeSet) return;
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteSet = async () => {
        if (!activeSet) return;

        setLoading(true);
        setShowDeleteConfirmModal(false);
        try {
            const token = localStorage.getItem('token');
            const decoded = jwtDecode(token);
            const facultyId = decoded._id;

            await userService.deleteSetForAssessment(assessment._id, facultyId, activeSet.setName);

            // Clear active set before fetching to avoid stale data issues
            setActiveSet(null);
            await fetchSets();
        } catch (error) {
            console.error("Failed to delete set", error);
            alert(error.response?.data?.message || "Failed to delete set. Please check if it's already approved.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="unified-set-manager h-100 d-flex flex-column">
            {/* Header / Tabs */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3 bg-white p-2 rounded-pill shadow-sm border">
                    {sets.map(set => (
                        <button
                            key={set._id}
                            onClick={() => handleSetTabClick(set)}
                            className={`btn rounded-pill fw-bold position-relative d-flex align-items-center gap-2 border-0 transition-all ${activeSet?.setName === set.setName ? 'bg-primary text-white shadow' : 'text-muted hover-bg-light'}`}
                            style={{ padding: '8px 24px' }}
                        >
                            <span>Set {set.setName}</span>
                            <span
                                className={`rounded-circle border border-white ${set.hodStatus === 'Approved' ? 'bg-success' :
                                    set.hodStatus === 'Approved with Remarks' ? 'bg-warning' :
                                        set.hodStatus === 'Submitted' ? 'bg-info' :
                                            set.hodStatus === 'Pending' ? 'bg-secondary' : 'bg-danger'
                                    }`}
                                style={{ width: '10px', height: '10px' }}
                                title={`Status: ${set.hodStatus}`}
                            ></span>
                        </button>
                    ))}
                    <button
                        className="btn btn-light text-primary rounded-circle shadow-sm hover-scale d-flex align-items-center justify-content-center border"
                        style={{ width: '40px', height: '40px' }}
                        onClick={() => setShowCreateSetModal(true)}
                        title="Create New Set"
                    >
                        <FaPlus size={14} />
                    </button>
                </div>

                <div className="d-flex gap-2">
                    {/* Delete Set action moved to QuestionsList dropdown */}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow-1 overflow-hidden d-flex flex-column bg-light rounded-3 border">
                {loading ? (
                    <div className="p-4">
                        <SkeletonLoader type="list" count={5} />
                    </div>
                ) : (
                    activeSet ? (
                        <div className="animation-fade-in h-100 overflow-auto custom-scrollbar p-0">
                            {/* We just render the existing QuestionList here, passing the current set context */}
                            <QuestionsList
                                assessment={assessment}
                                setName={activeSet.setName}
                                onDeleteSet={handleDeleteSet}
                            />
                        </div>
                    ) : (
                        <div className="text-center p-5 text-muted h-100 d-flex flex-column justify-content-center align-items-center">
                            <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                                <FaPlus size={30} className="text-secondary opacity-50" />
                            </div>
                            <h5 className="fw-bold text-dark">No Sets Created Yet</h5>
                            <p className="small mb-4">Create a set (e.g., Set A, Set B) to start adding questions.</p>
                            <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowCreateSetModal(true)}>
                                <FaPlus className="me-2" /> Create First Set
                            </button>
                        </div>
                    )
                )}
            </div>

            {showCreateSetModal && (
                <CreateSetModal onClose={() => setShowCreateSetModal(false)} onSave={handleCreateSet} />
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirmModal && activeSet && (
                <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(15, 23, 42, 0.7)', zIndex: 1100, backdropFilter: 'blur(4px)'
                    }}>
                    <div className="bg-white rounded-4 shadow-lg overflow-hidden"
                        style={{ width: '90%', maxWidth: '400px', animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="p-4 text-center">
                            <div className="d-inline-flex bg-danger bg-opacity-10 text-danger p-3 rounded-circle mb-3">
                                <FaExclamationTriangle size={36} />
                            </div>
                            <h4 className="fw-bold text-dark mb-2">Delete Set {activeSet.setName}?</h4>
                            <p className="text-muted small mb-4 px-2">
                                You are about to permanently delete <strong>Set {activeSet.setName}</strong> and all questions inside it. This action cannot be undone.
                            </p>
                            <div className="d-flex gap-2 w-100">
                                <button className="btn btn-light text-secondary border fw-bold w-50 py-2 rounded-pill" onClick={() => setShowDeleteConfirmModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger text-white fw-bold w-50 py-2 rounded-pill shadow-sm" onClick={confirmDeleteSet}>
                                    Yes, Delete Set
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedSetManager;
