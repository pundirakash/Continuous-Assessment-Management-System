import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import LoadingSpinner from '../LoadingSpinner';

const ManageTerms = () => {
    const [currentTerm, setCurrentTerm] = useState('');
    const [newTerm, setNewTerm] = useState('');
    const [archivedTerms, setArchivedTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    useEffect(() => {
        fetchConfig();
        fetchArchives();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const config = await userService.getSystemConfig();
            if (config && config.value) {
                setCurrentTerm(config.value);
            }
        } catch (err) {
            console.error('Failed to fetch system config', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchArchives = async () => {
        try {
            const archives = await userService.getArchivedTerms();
            setArchivedTerms(archives);
        } catch (err) {
            console.error("Failed to fetch archives", err);
        }
    };

    const handleRestoreTerm = async (termId) => {
        if (!window.confirm(`Are you sure you want to RESTORE term "${termId}"? This will archive the current active term and reload the data for ${termId}.`)) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await userService.restoreTerm(termId);
            setSuccess(`Successfully restored term ${termId}.`);
            setCurrentTerm(termId);
            fetchArchives(); // Refresh list
        } catch (err) {
            console.error('Failed to restore term', err);
            setError(err.response?.data?.message || 'Failed to restore term');
        } finally {
            setLoading(false);
        }
    };

    const initiateSwitch = () => {
        if (!newTerm) {
            setError('Please enter a new term.');
            return;
        }
        if (newTerm === currentTerm) {
            setError('New term cannot be the same as current term.');
            return;
        }
        setError(null);
        setShowConfirmModal(true);
        setConfirmInput('');
    };

    const handleConfirmSwitch = async () => {
        if (confirmInput.trim() !== newTerm.trim()) {
            setError("Confirmation text does not match the new term.");
            return;
        }

        setShowConfirmModal(false);

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await userService.switchTerm(newTerm);
            setSuccess(`Successfully switched to term ${newTerm}.`);
            setCurrentTerm(newTerm);
            setNewTerm('');
            fetchArchives(); // Refresh list
        } catch (err) {
            console.error('Failed to switch term', err);
            setError(err.response?.data?.message || 'Failed to switch term');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await userService.syncRoles();
            setSuccess("System roles synchronized and verified for the current term.");
        } catch (err) {
            console.error('Failed to sync roles', err);
            setError(err.response?.data?.message || 'Failed to sync roles');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-content-fade">
            {loading && <LoadingSpinner />}

            <div className="row g-4 mb-4">
                <div className="col-lg-12">
                    <div className="p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-10 d-flex justify-content-between align-items-center shadow-sm">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-3 bg-primary rounded-circle shadow-sm text-white">
                                <i className="bi bi-calendar-check fs-4"></i>
                            </div>
                            <div>
                                <span className="x-small fw-bold text-uppercase text-primary ls-1 d-block mb-1">Active Academic Term</span>
                                <h2 className="mb-0 fw-bold text-dark">{currentTerm || 'Not Set'}</h2>
                            </div>
                        </div>
                        <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">Status: Active</span>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="admin-card border-0 shadow-sm overflow-hidden h-100">
                        <div className="admin-card-header bg-warning bg-opacity-10 py-3">
                            <div className="d-flex align-items-center gap-2 text-warning font-weight-bold">
                                <i className="bi bi-lightning-charge-fill"></i>
                                <span className="admin-card-title fw-bold">Term Switcher</span>
                            </div>
                        </div>
                        <div className="admin-card-body p-4">
                            <div className="mb-3">
                                <div className="alert alert-warning border-0 small mb-4 rounded-3 d-flex align-items-start gap-2">
                                    <i className="bi bi-exclamation-triangle-fill mt-1"></i>
                                    <span>Warning: Switching terms will archive current faculty-course mappings and clear active assignments. This action is irreversible without a restore.</span>
                                </div>
                                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">New Term ID</label>
                                <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1 mb-3">
                                    <input
                                        type="text"
                                        className="form-control border-0 px-4 fw-medium"
                                        placeholder="e.g. 25261"
                                        value={newTerm}
                                        onChange={(e) => setNewTerm(e.target.value)}
                                    />
                                    <button className="btn btn-warning px-4 fw-bold text-dark" onClick={initiateSwitch} disabled={loading}>
                                        Switch
                                    </button>
                                </div>
                                <div className="mt-4 pt-4 border-top">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <h6 className="x-small fw-bold text-uppercase text-muted ls-1 mb-1">System Maintenance</h6>
                                            <p className="text-muted small mb-0">Re-verify and sync roles for the current term.</p>
                                        </div>
                                        <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" onClick={handleSyncRoles} disabled={loading}>
                                            Sync Roles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="admin-card border-0 shadow-sm h-100">
                        <div className="admin-card-header bg-white py-3">
                            <div className="d-flex align-items-center gap-2 text-secondary">
                                <i className="bi bi-archive-fill"></i>
                                <span className="admin-card-title fw-bold">Term History & Archives</span>
                            </div>
                        </div>
                        <div className="admin-card-body p-0">
                            <div className="list-group list-group-flush">
                                {archivedTerms.length === 0 ? (
                                    <div className="p-5 text-center text-muted fst-italic">
                                        No archived terms found.
                                    </div>
                                ) : (
                                    archivedTerms.map(term => (
                                        <div key={term} className="list-group-item p-4 d-flex justify-content-between align-items-center border-bottom border-light hover-bg-light transition-all">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 bg-light rounded-3 text-secondary shadow-sm">
                                                    <i className="bi bi-folder-fill"></i>
                                                </div>
                                                <span className="fw-bold text-dark fs-5">{term}</span>
                                            </div>
                                            {term !== currentTerm ? (
                                                <button
                                                    className="btn btn-white btn-sm px-4 border shadow-sm fw-bold rounded-pill"
                                                    onClick={() => handleRestoreTerm(term)}
                                                    disabled={loading}
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <span className="badge bg-success bg-opacity-10 text-success border-0 px-3 py-2 rounded-pill fw-bold">
                                                    <i className="bi bi-check-circle-fill me-1"></i> Current
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger mt-4 shadow-sm border-0 rounded-3">{error}</div>}
            {success && <div className="alert alert-success mt-4 shadow-sm border-0 rounded-3">{success}</div>}

            {/* Strict Confirmation Modal */}
            {showConfirmModal && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal-content border-0 shadow-2xl p-0 overflow-hidden">
                        <div className="bg-warning p-4 d-flex align-items-center gap-3 text-dark">
                            <div className="p-3 bg-white bg-opacity-25 rounded-circle text-dark">
                                <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                            </div>
                            <div>
                                <h4 className="mb-0 fw-bold">Confirm Term Switch</h4>
                                <span className="x-small text-uppercase fw-bold ls-1 opacity-75">Caution Required</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-muted mb-4">
                                You are about to switch to term <strong className="text-dark">{newTerm}</strong>.
                                This will <strong className="text-danger">ARCHIVE</strong> all current data and <strong className="text-danger">RESET</strong> course allocations.
                            </p>
                            <label className="form-label x-small fw-bold text-uppercase text-muted ls-1 mb-2">Type "{newTerm}" to confirm</label>
                            <input
                                type="text"
                                className="form-control border-light bg-light rounded-3 py-3 px-3 fw-bold text-center fs-4"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder={newTerm}
                            />
                        </div>
                        <div className="p-4 bg-light d-flex gap-2">
                            <button type="button" className="btn btn-light flex-grow-1 py-3 fw-bold" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button
                                type="button"
                                className="btn btn-danger flex-grow-1 py-3 fw-bold shadow-sm"
                                onClick={handleConfirmSwitch}
                                disabled={confirmInput !== newTerm}
                            >
                                Confirm Switch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTerms;
