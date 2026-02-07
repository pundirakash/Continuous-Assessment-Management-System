import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    FaUserPlus, FaTrash, FaPlus, FaEdit, FaSearch,
    FaTimes, FaUsers, FaClipboardList, FaCheck, FaChevronRight
} from 'react-icons/fa';
import userService from '../../services/userService';

const CourseManagerModal = ({ show, handleClose, course, refreshData, currentTerm }) => {
    const [activeTab, setActiveTab] = useState('faculty');
    const [loading, setLoading] = useState(false);

    // Data States
    const [assignedFaculty, setAssignedFaculty] = useState([]);
    const [availableFaculty, setAvailableFaculty] = useState([]);
    const [assessments, setAssessments] = useState([]);

    // Multi-Select & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

    // Assessment Form States
    const [newAssessment, setNewAssessment] = useState({ name: '', type: 'MCQ', termId: currentTerm });
    const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
    const [editAssessmentId, setEditAssessmentId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'faculty') {
                const allFaculty = await userService.getFaculties();
                setAvailableFaculty(allFaculty);
                setAssignedFaculty(course.faculties || []);
            } else if (activeTab === 'assessments') {
                const data = await userService.getAssessmentsByCourse(course._id, currentTerm);
                setAssessments(data);
            }
        } catch (error) {
            console.error("Fetch Data Error", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, course, currentTerm]);

    useEffect(() => {
        if (show && course) {
            document.body.style.overflow = 'hidden';
            fetchData();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show, course, fetchData]);

    // Filter States
    const [filterSchool, setFilterSchool] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

    // Computed Lists for Dropdowns
    const uniqueSchools = [...new Set(availableFaculty.map(f => f.schoolId?.name).filter(Boolean))].sort();

    // Prefer departmentId.name, fallback to department string
    const uniqueDepartments = [...new Set(availableFaculty.map(f => f.departmentId?.name || f.department).filter(Boolean))].sort();

    const unassignedFaculty = availableFaculty.filter(
        f => !assignedFaculty.some(af => af._id === f._id)
    ).filter(
        f => {
            const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.email.toLowerCase().includes(searchTerm.toLowerCase());

            const facultySchoolName = f.schoolId?.name;
            const facultyDeptName = f.departmentId?.name || f.department;

            const matchesSchool = !filterSchool || facultySchoolName === filterSchool;
            const matchesDept = !filterDepartment || facultyDeptName === filterDepartment;

            return matchesSearch && matchesSchool && matchesDept;
        }
    );

    const handleCheckboxChange = (facultyId) => {
        setSelectedFacultyIds(prev =>
            prev.includes(facultyId) ? prev.filter(id => id !== facultyId) : [...prev, facultyId]
        );
    };

    const handleBulkAssign = async () => {
        if (selectedFacultyIds.length === 0) return;
        setLoading(true);
        try {
            await Promise.all(selectedFacultyIds.map(fid =>
                userService.assignCourseToFaculty(fid, course._id)
            ));
            const newlyAssigned = availableFaculty.filter(f => selectedFacultyIds.includes(f._id));
            setAssignedFaculty(prev => [...prev, ...newlyAssigned]);
            setSelectedFacultyIds([]);
            refreshData();
        } catch (error) {
            console.error("Bulk Assign Error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFaculty = async (facultyId) => {
        if (!window.confirm("Remove this faculty from the course?")) return;
        try {
            await userService.removeCourseFromFaculty(facultyId, course._id);
            setAssignedFaculty(prev => prev.filter(f => f._id !== facultyId));
            refreshData();
        } catch (error) {
            alert("Failed to remove faculty");
        }
    };

    const handleSaveAssessment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editAssessmentId) {
                await userService.editAssessment(editAssessmentId, newAssessment);
            } else {
                await userService.createAssessment(course._id, newAssessment);
            }
            setIsCreatingAssessment(false);
            setEditAssessmentId(null);
            setNewAssessment({ name: '', type: 'MCQ', termId: currentTerm });
            const data = await userService.getAssessmentsByCourse(course._id, currentTerm);
            setAssessments(data);
        } catch (error) {
            alert("Failed to save assessment");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (assessment) => {
        setNewAssessment({ name: assessment.name, type: assessment.type, termId: assessment.termId });
        setEditAssessmentId(assessment._id);
        setIsCreatingAssessment(true);
    };

    const handleDeleteAssessment = async (id) => {
        if (!window.confirm("Delete this assessment?")) return;
        try {
            await userService.deleteAssessment(id);
            setAssessments(prev => prev.filter(a => a._id !== id));
        } catch (error) {
            alert("Failed to delete assessment");
        }
    };

    if (!show || !course) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1100, backdropFilter: 'blur(4px)' }}>

            <div className="bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column"
                style={{
                    width: '700px',
                    maxHeight: '90vh',
                    animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform, opacity'
                }}>

                {/* Header */}
                <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                            <FaUsers size={24} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-bold">Manage Course</h5>
                            <p className="m-0 small opacity-75">{course.name} ({course.code})</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="btn-close btn-close-white opacity-100 shadow-none"></button>
                </div>

                {/* Custom Navigation */}
                <div className="px-4 pt-3 bg-light d-flex gap-4 border-bottom">
                    <button
                        className={`btn px-0 py-2 fw-bold position-relative border-0 shadow-none transition-all ${activeTab === 'faculty' ? 'text-primary' : 'text-secondary'}`}
                        onClick={() => setActiveTab('faculty')}
                    >
                        Faculty Team
                        {activeTab === 'faculty' && <div className="position-absolute bottom-0 start-0 w-100 bg-primary" style={{ height: '3px', borderRadius: '3px 3px 0 0' }}></div>}
                    </button>
                    <button
                        className={`btn px-0 py-2 fw-bold position-relative border-0 shadow-none transition-all ${activeTab === 'assessments' ? 'text-primary' : 'text-secondary'}`}
                        onClick={() => setActiveTab('assessments')}
                    >
                        Assessments (CA)
                        {activeTab === 'assessments' && <div className="position-absolute bottom-0 start-0 w-100 bg-primary" style={{ height: '3px', borderRadius: '3px 3px 0 0' }}></div>}
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-grow-1 overflow-auto bg-white">
                    {activeTab === 'faculty' ? (
                        <div className="p-4 d-flex flex-column gap-4 text-left">
                            {/* Assigned Faculty Tags */}
                            <div>
                                <label className="small text-secondary fw-bold text-uppercase ls-1 mb-2">Current Team ({assignedFaculty.length})</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {assignedFaculty.map(f => (
                                        <div key={f._id} className="d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-pill border transition-all hover-shadow-sm">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '10px', fontWeight: 'bold' }}>
                                                {f.name.charAt(0)}
                                            </div>
                                            <span className="small fw-bold text-dark">{f.name}</span>
                                            <FaTimes
                                                className="text-muted cursor-pointer hover-danger"
                                                size={12}
                                                onClick={() => handleRemoveFaculty(f._id)}
                                            />
                                        </div>
                                    ))}
                                    {assignedFaculty.length === 0 && <p className="small text-muted fst-italic">No faculty assigned yet.</p>}
                                </div>
                            </div>

                            {/* Add Faculty Search Section */}
                            <div className="bg-light p-4 rounded-4 border">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold text-dark m-0">Add New Members</h6>
                                    {selectedFacultyIds.length > 0 && (
                                        <button
                                            className="btn btn-primary btn-sm px-3 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-sm"
                                            onClick={handleBulkAssign}
                                            disabled={loading}
                                        >
                                            <FaUserPlus size={14} /> Assign {selectedFacultyIds.length} Selected
                                        </button>
                                    )}
                                </div>

                                {/* Filters */}
                                <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                        <select
                                            className="form-select border-0 bg-white shadow-sm rounded-3 custom-input text-secondary small fw-bold"
                                            value={filterSchool}
                                            onChange={(e) => { setFilterSchool(e.target.value); setFilterDepartment(''); }}
                                        >
                                            <option value="">All Schools</option>
                                            {uniqueSchools.map(school => (
                                                <option key={school} value={school}>{school}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <select
                                            className="form-select border-0 bg-white shadow-sm rounded-3 custom-input text-secondary small fw-bold"
                                            value={filterDepartment}
                                            onChange={(e) => setFilterDepartment(e.target.value)}
                                        >
                                            <option value="">All Departments</option>
                                            {uniqueDepartments
                                                .filter(dept => !filterSchool || availableFaculty.some(f => (f.departmentId?.name || f.department) === dept && f.schoolId?.name === filterSchool))
                                                .map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="position-relative mb-3">
                                    <FaSearch className="position-absolute ms-3 top-50 translate-middle-y text-muted opacity-50" size={14} />
                                    <input
                                        type="text"
                                        className="form-control ps-5 py-2 border-0 bg-white rounded-3 shadow-sm"
                                        placeholder="Search faculty by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="bg-white rounded-3 border overflow-auto" style={{ maxHeight: '250px' }}>
                                    {unassignedFaculty.map((f, i) => (
                                        <div
                                            key={f._id}
                                            className={`p-3 d-flex align-items-center gap-3 transition-all cursor-pointer ${i !== unassignedFaculty.length - 1 ? 'border-bottom' : ''} ${selectedFacultyIds.includes(f._id) ? 'bg-primary bg-opacity-10' : 'hover-bg-light'}`}
                                            onClick={() => handleCheckboxChange(f._id)}
                                        >
                                            <div className={`rounded-circle border d-flex align-items-center justify-content-center transition-all ${selectedFacultyIds.includes(f._id) ? 'bg-primary border-primary text-white' : 'bg-white border-2'}`} style={{ width: '20px', height: '20px' }}>
                                                {selectedFacultyIds.includes(f._id) && <FaCheck size={10} />}
                                            </div>
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                                                {f.name.charAt(0)}
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="fw-bold text-dark text-truncate small">
                                                    {f.name} <span className="text-muted fw-normal" style={{ fontSize: '10px' }}>({f.departmentId?.name || f.department} - {f.schoolId?.name || 'No School'})</span>
                                                </div>
                                                <div className="text-muted text-truncate" style={{ fontSize: '11px' }}>{f.uid} • {f.role}</div>
                                            </div>
                                            <FaChevronRight size={12} className="text-muted opacity-25" />
                                        </div>
                                    ))}
                                    {unassignedFaculty.length === 0 && (
                                        <div className="p-5 text-center text-muted small">
                                            <FaSearch className="mb-2 opacity-10" size={24} />
                                            <p className="mb-0">{searchTerm ? 'No results found.' : 'No more faculty available to assign.'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 d-flex flex-column gap-4 text-left h-100">
                            {!isCreatingAssessment ? (
                                <>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="fw-bold text-dark m-0">Term Assessments</h6>
                                        <button
                                            className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                                            onClick={() => setIsCreatingAssessment(true)}
                                        >
                                            <FaPlus size={14} /> Create New CA
                                        </button>
                                    </div>

                                    <div className="d-flex flex-column gap-3">
                                        {assessments.map(a => (
                                            <div key={a._id} className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center justify-content-between hover-shadow-md transition-all">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="p-3 bg-light rounded-3 text-primary">
                                                        <FaClipboardList size={20} />
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-1 fw-bold text-dark">{a.name}</h6>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className={`badge px-2 py-1 rounded-pill x-small ${a.type === 'MCQ' ? 'bg-info bg-opacity-10 text-info' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                                                {a.type}
                                                            </span>
                                                            <span className="small text-muted">Term: {a.termId}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-light btn-sm rounded-circle p-2 text-primary" title="Edit" onClick={() => handleEditClick(a)}>
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button className="btn btn-light btn-sm rounded-circle p-2 text-danger" title="Delete" onClick={() => handleDeleteAssessment(a._id)}>
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {assessments.length === 0 && (
                                            <div className="p-5 text-center text-muted bg-light rounded-4 border-dashed border-2">
                                                <FaClipboardList size={32} className="opacity-10 mb-2" />
                                                <p className="small mb-0">No assessments created for this term yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSaveAssessment} className="bg-light p-4 rounded-4 border">
                                    <h6 className="fw-bold text-dark mb-4">{editAssessmentId ? 'Edit Assessment' : 'New Continuous Assessment'}</h6>

                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary text-uppercase ls-1">Assessment Name</label>
                                        <input
                                            type="text"
                                            className="form-control py-3 px-4 border-0 shadow-sm rounded-3 custom-input"
                                            placeholder="e.g. CA-1, Mid-Term"
                                            value={newAssessment.name}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="row g-4 mb-5">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase ls-1">Format Type</label>
                                            <select
                                                className="form-select py-3 px-4 border-0 shadow-sm rounded-3 custom-input"
                                                value={newAssessment.type}
                                                onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                                            >
                                                <option value="MCQ">MCQ (Multiple Choice)</option>
                                                <option value="Subjective">Subjective (Long Answer)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase ls-1">Active Term</label>
                                            <input
                                                type="text"
                                                className="form-control py-3 px-4 border-0 bg-white-50 text-muted rounded-3"
                                                value={newAssessment.termId}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex gap-3">
                                        <button
                                            type="button"
                                            className="btn btn-light flex-grow-1 py-2 fw-bold rounded-pill border"
                                            onClick={() => { setIsCreatingAssessment(false); setEditAssessmentId(null); }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-grow-1 py-2 fw-bold shadow-sm rounded-pill"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : (editAssessmentId ? 'Save Changes' : 'Create Assessment')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                <style>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .ls-1 { letter-spacing: 0.5px; }
                .x-small { font-size: 10px; }
                .hover-shadow-md:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
                .hover-bg-light:hover { background-color: #f8fafc; }
                .hover-danger:hover { color: #dc3545 !important; }
                .custom-input:focus {
                    background-color: #fff !important;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
                    border: 1px solid #4f46e5 !important;
                }
                .modal-backdrop-custom { will-change: backdrop-filter; }
            `}</style>
            </div>
        </div>,
        document.body
    );
};

export default CourseManagerModal;
