import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import LoadingSpinner from '../LoadingSpinner';

const OrganizationManager = () => {
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAddSchool, setShowAddSchool] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [editSchoolId, setEditSchoolId] = useState(null);
    const [editSchoolName, setEditSchoolName] = useState('');

    useEffect(() => {
        fetchOrganization();
    }, []);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            const data = await userService.getOrganization();
            setStructure(data);
        } catch (err) {
            setError("Failed to load organization structure");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchool = async () => {
        if (!newSchoolName.trim()) return;
        try {
            setLoading(true);
            await userService.createSchool(newSchoolName, structure.universityId);
            setNewSchoolName('');
            setShowAddSchool(false);
            fetchOrganization();
        } catch (err) {
            setError("Failed to create school");
            setLoading(false);
        }
    };

    const handleRenameSchool = async () => {
        if (!editSchoolName.trim()) return;
        try {
            setLoading(true);
            await userService.renameSchool(editSchoolId, editSchoolName);
            setEditSchoolId(null);
            fetchOrganization();
        } catch (err) {
            setError("Failed to rename school");
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-content-fade">
            <header className="admin-header">
                <div>
                    <h1 className="admin-page-title">Organization Structure</h1>
                    <p className="text-muted small">Manage the hierarchy of schools and departments in the university.</p>
                </div>
            </header>

            {error && <div className="alert alert-danger mb-4 rounded-3 border-0 shadow-sm">{error}</div>}

            {structure && (
                <div className="admin-card border-0 shadow-lg">
                    <div className="admin-card-header bg-white py-4 px-4 overflow-hidden position-relative">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary">
                                <i className="bi bi-bank2 fs-4"></i>
                            </div>
                            <h4 className="mb-0 fw-bold text-dark">{structure.university}</h4>
                        </div>
                        <button
                            className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                            onClick={() => setShowAddSchool(!showAddSchool)}
                        >
                            + Add School
                        </button>
                    </div>

                    {showAddSchool && (
                        <div className="p-4 bg-light border-bottom admin-content-fade">
                            <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1">
                                <input
                                    type="text"
                                    className="form-control border-0 px-4"
                                    placeholder="New School Name..."
                                    value={newSchoolName}
                                    onChange={(e) => setNewSchoolName(e.target.value)}
                                />
                                <button className="btn btn-primary px-4 fw-bold" onClick={handleAddSchool}>Save</button>
                                <button className="btn btn-light px-4" onClick={() => setShowAddSchool(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="admin-card-body p-4">
                        <div className="row g-4">
                            {structure.schools.map((school, idx) => (
                                <div key={idx} className="col-12">
                                    <div className="p-4 rounded-4 border border-light bg-light bg-opacity-50 hover-shadow transition-all">
                                        <div className="d-flex align-items-center justify-content-between mb-4">
                                            {editSchoolId === school._id ? (
                                                <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1 w-100">
                                                    <input
                                                        type="text"
                                                        className="form-control border-0 px-4"
                                                        value={editSchoolName}
                                                        onChange={(e) => setEditSchoolName(e.target.value)}
                                                    />
                                                    <button className="btn btn-success px-4" onClick={handleRenameSchool}>Save</button>
                                                    <button className="btn btn-light px-4" onClick={() => setEditSchoolId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-white p-2 rounded-circle shadow-sm text-primary">
                                                            <i className="bi bi-mortarboard fs-5"></i>
                                                        </div>
                                                        <h5 className="fw-bold text-dark mb-0">{school.name}</h5>
                                                    </div>
                                                    <button
                                                        className="btn btn-white btn-sm px-3 border"
                                                        onClick={() => {
                                                            setEditSchoolId(school._id);
                                                            setEditSchoolName(school.name);
                                                        }}
                                                    >
                                                        Rename
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div className="ms-5">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className="x-small fw-bold text-uppercase text-muted ls-1">Departments</span>
                                                <div className="flex-grow-1 border-bottom"></div>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2">
                                                {school.departments.length > 0 ? (
                                                    school.departments.map((dept, dIdx) => (
                                                        <span key={dIdx} className="badge bg-white text-dark shadow-sm border-0 py-2 px-3 rounded-pill fw-medium">
                                                            {dept}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted small fst-italic">No departments yet</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationManager;
