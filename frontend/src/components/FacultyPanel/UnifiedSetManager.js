import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import userService from '../../services/userService';
import QuestionsList from './QuestionsList';
import CreateSetModal from './CreateSetModal';
import CreateSetModal from './CreateSetModal';
// import LoadingSpinner from '../LoadingSpinner';
import SkeletonLoader from '../SkeletonLoader';
import { FaPlus, FaTrash } from 'react-icons/fa';

const UnifiedSetManager = ({ assessment, courseId }) => {
    const [sets, setSets] = useState([]);
    const [activeSet, setActiveSet] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCreateSetModal, setShowCreateSetModal] = useState(false);

    const fetchSets = useCallback(async () => {
        setLoading(true);
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

    const handleDeleteSet = async () => {
        if (!activeSet) return;

        const confirmDelete = window.confirm(`⚠️ ARE YOU ABSOLUTELY SURE?\n\nDeleting Set ${activeSet.setName} will PERMANENTLY remove all questions uploaded in this set.\n\nThis action cannot be undone.`);

        if (confirmDelete) {
            setLoading(true);
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
                    {activeSet && (
                        <button
                            className="btn btn-outline-danger border-opacity-25 shadow-sm rounded-pill px-4 fw-bold hover-scale d-flex align-items-center gap-2"
                            onClick={handleDeleteSet}
                            disabled={['Approved', 'Approved with Remarks'].includes(activeSet.hodStatus)}
                        >
                            <FaTrash size={14} /> Delete Set {activeSet.setName}
                        </button>
                    )}
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
        </div>
    );
};

export default UnifiedSetManager;
