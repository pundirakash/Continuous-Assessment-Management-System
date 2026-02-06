import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import LoadingSpinner from '../LoadingSpinner';

const DepartmentManager = () => {
    const [departments, setDepartments] = useState([]);
    const [schools, setSchools] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [loading, setLoading] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [editDeptId, setEditDeptId] = useState(null);
    const [editDeptName, setEditDeptName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const orgData = await userService.getOrganization();
            setSchools(orgData.schools || []);
            const depts = await userService.getDepartments();
            setDepartments(depts);
        } catch (err) {
            console.error(err);
            setError("Failed to load organization data");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async (schoolId) => {
        try {
            setLoading(true);
            const data = await userService.getDepartments(schoolId);
            setDepartments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSchoolChange = (e) => {
        const schoolId = e.target.value;
        setSelectedSchool(schoolId);
        fetchDepartments(schoolId);
    };

    const handleCreate = async () => {
        if (!newDeptName.trim() || !selectedSchool) {
            setError("Please provide both department name and select a school.");
            return;
        }
        try {
            setLoading(true);
            setError(''); setSuccess('');
            await userService.createDepartment(newDeptName, selectedSchool);
            setSuccess('Department added successfully.');
            setNewDeptName('');
            fetchDepartments(selectedSchool);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add department');
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async () => {
        if (!editDeptName.trim() || !editDeptId) return;
        try {
            setLoading(true);
            setError(''); setSuccess('');
            const res = await userService.renameDepartment(editDeptId, editDeptName);
            setSuccess(res.message);
            setEditDeptId(null);
            setEditDeptName('');
            fetchDepartments(selectedSchool);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to rename department');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-content-fade">
            <header className="admin-header">
                <div>
                    <h1 className="admin-page-title">Department Management</h1>
                    <p className="text-muted small">Create and organize departments within their respective schools.</p>
                </div>
            </header>

            <div className="admin-card border-0 shadow-sm mb-4">
                <div className="admin-card-header bg-white">
                    <h5 className="admin-card-title fw-bold">Add New Department</h5>
                </div>
                <div className="admin-card-body p-4">
                    <div className="row g-4 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Target School</label>
                            <select
                                className="form-select border-0 bg-light rounded-3 py-2 px-3 fw-medium"
                                value={selectedSchool}
                                onChange={(e) => setSelectedSchool(e.target.value)}
                            >
                                <option value="">-- Select School --</option>
                                {schools.map(school => (
                                    <option key={school._id} value={school._id}>{school.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-5">
                            <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Department Name</label>
                            <input
                                type="text"
                                className="form-control border-0 bg-light rounded-3 py-2 px-3 fw-medium"
                                placeholder="e.g., Computer Science"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-primary w-100 py-2 fw-bold shadow-sm" onClick={handleCreate} disabled={loading || !selectedSchool}>
                                Add Dept
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger mb-4 shadow-sm border-0 rounded-3">{error}</div>}
            {success && <div className="alert alert-success mb-4 shadow-sm border-0 rounded-3">{success}</div>}

            {loading && <LoadingSpinner />}

            <div className="admin-card border-0 shadow-lg mt-4">
                <div className="admin-card-header bg-white py-4 px-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary">
                            <i className="bi bi-list-task fs-4"></i>
                        </div>
                        <h5 className="admin-card-title fw-bold mb-0">Existing Departments</h5>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted x-small fw-bold text-uppercase ls-1">Filter:</span>
                        <select
                            className="form-select form-select-sm border-0 bg-light rounded-pill px-3"
                            style={{ minWidth: '180px' }}
                            value={selectedSchool}
                            onChange={handleSchoolChange}
                        >
                            <option value="">All Schools</option>
                            {schools.map(school => (
                                <option key={school._id} value={school._id}>{school.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="admin-card-body p-0">
                    <div className="list-group list-group-flush border-0">
                        {departments.map(dept => (
                            <div key={dept._id} className="list-group-item p-4 d-flex justify-content-between align-items-center border-bottom border-light hover-bg-light transition-all">
                                {editDeptId === dept._id ? (
                                    <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1 w-100">
                                        <input
                                            type="text"
                                            className="form-control border-0 px-4"
                                            value={editDeptName}
                                            onChange={(e) => setEditDeptName(e.target.value)}
                                        />
                                        <button className="btn btn-success px-4" onClick={handleRename}>Save</button>
                                        <button className="btn btn-light px-4" onClick={() => setEditDeptId(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h6 className="fw-bold text-dark mb-1 fs-5">{dept.name}</h6>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary border-0 px-2 fw-medium">
                                                    {schools.find(s => s._id === dept.schoolId)?.name || 'Unknown School'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-white btn-sm px-3 border shadow-sm"
                                            onClick={() => { setEditDeptId(dept._id); setEditDeptName(dept.name); }}
                                        >
                                            Rename
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        {departments.length === 0 && (
                            <div className="p-5 text-center">
                                <i className="bi bi-inbox fs-1 text-muted opacity-25 d-block mb-3"></i>
                                <span className="text-muted">No departments found in this category.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentManager;
