import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaFileDownload, FaChartPie, FaFilter, FaTable, FaUserTie, FaCheckCircle, FaExclamationCircle, FaEdit } from 'react-icons/fa';
import userService from '../services/userService';
import MultiSelectDropdown from '../components/Common/MultiSelectDropdown';
import TermSelector from '../components/TermSelector';
import { useTerm } from '../context/TermContext';

const HodReports = () => {
    const { setActiveTab } = useOutletContext();
    const { selectedTerm } = useTerm();

    const [activeSection, setActiveSection] = useState('analytics'); // analytics | download
    const [loading, setLoading] = useState(false);

    // --- Analytics State ---
    const [stats, setStats] = useState([]);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [totalPending, setTotalPending] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'uid', direction: 'asc' });

    const filteredStats = stats.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.uid && String(s.uid).includes(searchTerm))
    );

    const sortedStats = [...filteredStats].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <FaTable className="ms-1 text-muted opacity-25" style={{ fontSize: '0.8em' }} />;
        return sortConfig.direction === 'asc' ? <span className="ms-1">▲</span> : <span className="ms-1">▼</span>;
    };

    // --- Downloader State ---
    const [filters, setFilters] = useState({
        termId: [],
        courseId: [],
        assessmentId: [],
        facultyId: [],
        type: [],
        bloomLevel: [],
        courseOutcome: [],
        status: [],
    });

    const [availableTerms, setAvailableTerms] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [availableFaculties, setAvailableFaculties] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [previewCount, setPreviewCount] = useState(0);

    // Download Options
    const [templateNumber, setTemplateNumber] = useState(1);
    const [numberOfQuestions, setNumberOfQuestions] = useState('');
    const [previewSearchTerm, setPreviewSearchTerm] = useState(''); // NEW: Search state

    // Filtered Preview Data
    const filteredPreviewData = previewData.filter(q =>
        (q.text && q.text.toLowerCase().includes(previewSearchTerm.toLowerCase())) ||
        (q.type && q.type.toLowerCase().includes(previewSearchTerm.toLowerCase())) ||
        (q.bloomLevel && q.bloomLevel.toLowerCase().includes(previewSearchTerm.toLowerCase()))
    );



    const fetchInitialData = useCallback(async () => {
        try {
            const [terms, courses, faculties] = await Promise.all([
                userService.getArchivedTerms(),
                userService.getCoursesByDepartment(selectedTerm),
                userService.getFacultiesByDepartment()
            ]);

            setAvailableTerms(terms.map(t => ({ id: t.term || t, label: t.label || t.term || t })));
            setAvailableCourses(courses);
            setAvailableFaculties(faculties);

            if (selectedTerm) {
                setFilters(prev => ({ ...prev, termId: [selectedTerm] }));
            }
        } catch (error) {
            console.error("Error fetching report data", error);
        }
    }, [selectedTerm]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await userService.getDashboardStats(selectedTerm);
            setStats(data);

            // Calculate totals
            const questions = data.reduce((acc, curr) => acc + curr.totalQuestionsCreated, 0);
            const pending = data.reduce((acc, curr) => acc + curr.pendingReviews, 0);

            setTotalQuestions(questions);
            setTotalPending(pending);
        } catch (error) {
            console.error("Stats Fetch Error", error);
        }
    }, [selectedTerm]);

    useEffect(() => {
        setActiveTab('reports');
        fetchInitialData();
        fetchStats();
    }, [setActiveTab, fetchInitialData, fetchStats]);

    const handleFilterUpdate = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePreview = async () => {
        setLoading(true);
        try {
            const query = { ...filters };
            const response = await userService.masterFilterQuestions(query);
            setPreviewData(response || []);
            setPreviewCount(response.length || 0);
        } catch (error) {
            console.error("Preview failed", error);
            alert("Failed to fetch preview");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const params = {
                ...filters,
                templateNumber,
                ...(numberOfQuestions && { numberOfQuestions })
            };
            // Clean empty
            Object.keys(params).forEach(key => {
                if (Array.isArray(params[key]) && params[key].length === 0) delete params[key];
                if (params[key] === '' || params[key] == null) delete params[key];
            });

            await userService.downloadQuestions(params);
        } catch (error) {
            console.error("Download failed", error);
            alert("Download failed");
        }
    };

    const handleDownloadPendency = async () => {
        try {
            await userService.downloadPendencyReport(selectedTerm);
        } catch (error) {
            console.error("Pendency download failed", error);
            alert("Failed to download pendency report");
        }
    };

    const filterOptions = {
        type: ['MCQ', 'True/False', 'Short Answer', 'Fill in the Blanks', 'Match the Following'],
        bloomLevel: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
        courseOutcome: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'],
        status: ['Pending', 'Approved', 'Rejected', 'Submitted'],
    };

    return (
        <div className="container-fluid p-4">
            <style>
                {`
                    .sticky-th {
                        position: sticky;
                        top: 0;
                        z-index: 10;
                        background-color: #f8f9fa !important;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                `}
            </style>
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold mb-1 text-dark">Analytics & Reports</h2>
                    <p className="text-muted small mb-0">Monitor faculty performance and download master datasets.</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <TermSelector />
                    <div className="bg-white p-1 rounded-pill shadow-sm d-inline-flex border">
                        <button
                            className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeSection === 'analytics' ? 'bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                            onClick={() => setActiveSection('analytics')}
                            style={{ minWidth: '140px' }}
                        >
                            <FaChartPie className="me-2" /> Dashboard
                        </button>
                        <button
                            className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeSection === 'download' ? 'bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                            onClick={() => setActiveSection('download')}
                            style={{ minWidth: '160px' }}
                        >
                            <FaFileDownload className="me-2" /> Master Downloader
                        </button>
                    </div>
                </div>
            </div>

            {activeSection === 'analytics' ? (
                <div className="animate__animated animate__fadeIn">
                    {/* Summary Cards */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '20px' }}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="text-muted text-uppercase fw-bold mb-2 small tracking-wider">Total Questions</h6>
                                        <h2 className="display-4 fw-bold mb-0 text-dark">{totalQuestions}</h2>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5' }}>
                                        <FaFileDownload className="fs-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '20px' }}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="text-muted text-uppercase fw-bold mb-2 small tracking-wider">Active Courses</h6>
                                        <h2 className="display-4 fw-bold mb-0 text-dark">{availableCourses.length}</h2>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)', color: '#10b981' }}>
                                        <FaTable className="fs-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '20px' }}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="text-muted text-uppercase fw-bold mb-2 small tracking-wider">Pending Approvals</h6>
                                        <h2 className="display-4 fw-bold mb-0 text-dark">{totalPending}</h2>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', color: '#ea580c' }}>
                                        <FaExclamationCircle className="fs-4" />
                                    </div>
                                </div>
                                <div className="mt-4 pt-2 border-top">
                                    <button
                                        className="btn btn-light text-danger w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center py-2"
                                        style={{ background: '#fff7ed', border: '1px solid #ffedd5' }}
                                        onClick={handleDownloadPendency}
                                    >
                                        <FaFileDownload className="me-2" /> Download Pendency Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Faculty Performance Table */}
                    <div className="card border-0 shadow-lg overflow-hidden rounded-4" style={{ borderRadius: '20px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header bg-white py-4 d-flex justify-content-between align-items-center flex-shrink-0">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FaUserTie className="me-2 text-primary" /> Faculty Performance
                            </h5>
                            <div className="input-group" style={{ maxWidth: '300px' }}>
                                <span className="input-group-text bg-light border-0"><FaFilter className="text-muted" /></span>
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light"
                                    placeholder="Search Faculty..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)} // Need to add searchTerm state
                                />
                            </div>
                        </div>
                        <div className="table-responsive" style={{ overflowY: 'auto' }}>
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr className="text-uppercase text-muted small letter-spacing-1">
                                        <th className="border-0 p-4 sticky-th cursor-pointer text-center" onClick={() => handleSort('name')}>
                                            Faculty <SortIcon column="name" />
                                        </th>
                                        <th className="border-0 p-4 sticky-th text-center cursor-pointer" onClick={() => handleSort('coursesCount')}>
                                            Courses <SortIcon column="coursesCount" />
                                        </th>
                                        <th className="border-0 p-4 sticky-th text-center cursor-pointer" onClick={() => handleSort('allottedCAsCount')}>
                                            CAs <SortIcon column="allottedCAsCount" />
                                        </th>
                                        <th className="border-0 p-4 sticky-th text-center cursor-pointer" onClick={() => handleSort('totalQuestionsCreated')}>
                                            Prepared <SortIcon column="totalQuestionsCreated" />
                                        </th>
                                        <th className="border-0 p-4 sticky-th text-center cursor-pointer" onClick={() => handleSort('pendingQuestions')}>
                                            Pending <SortIcon column="pendingQuestions" />
                                        </th>
                                        <th className="border-0 p-4 sticky-th cursor-pointer" onClick={() => handleSort('approvedQuestions')}>
                                            Efficiency <SortIcon column="approvedQuestions" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStats.map((s, idx) => (
                                        <tr key={idx} style={{ transition: 'all 0.2s' }}>
                                            <td className="p-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                                        <span className="fw-bold">{s.name.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0 fw-bold text-dark">{s.name}</h6>
                                                        <small className="text-muted">UID: {s.uid}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold" style={{ minWidth: '45px' }}>{s.coursesCount}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-bold" style={{ minWidth: '45px' }}>{s.allottedCAsCount}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <h6 className="mb-0 fw-bold">{s.totalQuestionsCreated}</h6>
                                                <small className="text-muted x-small">Questions</small>
                                            </td>
                                            <td className="p-4 text-center">
                                                {s.pendingQuestions > 0 ? (
                                                    <div className="d-flex flex-column align-items-center">
                                                        <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill fw-bold">
                                                            {s.pendingQuestions} Qs
                                                        </span>
                                                        <small className="text-danger x-small mt-1 fw-bold">{s.pendingReviews} {s.pendingReviews === 1 ? 'Set' : 'Sets'}</small>
                                                    </div>
                                                ) : s.totalQuestionsCreated === 0 ? (
                                                    s.allottedCAsCount > 0 ? (
                                                        <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill fw-bold">
                                                            <FaExclamationCircle className="me-1" /> Not Started
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-light text-muted px-3 py-2 rounded-pill fw-bold">
                                                            No Allocation
                                                        </span>
                                                    )
                                                ) : s.approvedQuestions < s.totalQuestionsCreated ? (
                                                    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill fw-bold">
                                                        <FaEdit className="me-1" /> In Progress
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold">
                                                        <FaCheckCircle className="me-1" /> All Vetted
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4" style={{ width: '25%' }}>
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="small fw-bold text-muted">Approval Rate</span>
                                                        <span className="small fw-bold text-success">
                                                            {s.totalQuestionsCreated > 0 ? Math.round((s.approvedQuestions / s.totalQuestionsCreated) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                                        <div
                                                            className="progress-bar bg-gradient-success"
                                                            role="progressbar"
                                                            style={{
                                                                width: `${s.totalQuestionsCreated > 0 ? (s.approvedQuestions / s.totalQuestionsCreated) * 100 : 0}%`,
                                                                backgroundColor: '#28a745',
                                                                backgroundImage: 'linear-gradient(45deg, #28a745, #85d298)'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <small className="text-muted mt-1 text-end">{s.approvedQuestions} Approved</small>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStats.length === 0 && (
                                        <tr><td colSpan={6} className="text-center p-5 text-muted">
                                            <div className="d-flex flex-column align-items-center">
                                                <FaFilter className="display-6 mb-3 opacity-25" />
                                                <h6>No faculty found matching your search.</h6>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="animate__animated animate__fadeIn">
                    {/* Master Downloader Content */}
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
                        <div className="d-flex align-items-center mb-3">
                            <h5 className="fw-bold mb-0 text-primary"><FaFilter className="me-2" /> Master Data Filter</h5>
                        </div>
                        <div className="row g-3">
                            {/* Reusing Filters from previous steps */}
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Academic Term"
                                    options={availableTerms.map(t => ({ value: t.id, label: t.label }))}
                                    selected={filters.termId}
                                    onChange={(val) => handleFilterUpdate('termId', val)}
                                />
                            </div>
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Course"
                                    options={availableCourses.map(c => ({ value: c._id, label: c.name }))}
                                    selected={filters.courseId}
                                    onChange={(val) => handleFilterUpdate('courseId', val)}
                                />
                            </div>
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Faculty"
                                    options={availableFaculties.map(f => ({ value: f._id, label: f.name }))}
                                    selected={filters.facultyId}
                                    onChange={(val) => handleFilterUpdate('facultyId', val)}
                                />
                            </div>
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Question Type"
                                    options={filterOptions.type.map(t => ({ value: t, label: t }))}
                                    selected={filters.type}
                                    onChange={(val) => handleFilterUpdate('type', val)}
                                />
                            </div>
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Bloom Level"
                                    options={filterOptions.bloomLevel.map(b => ({ value: b, label: b }))}
                                    selected={filters.bloomLevel}
                                    onChange={(val) => handleFilterUpdate('bloomLevel', val)}
                                />
                            </div>
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Course Outcome"
                                    options={filterOptions.courseOutcome.map(c => ({ value: c, label: c }))}
                                    selected={filters.courseOutcome}
                                    onChange={(val) => handleFilterUpdate('courseOutcome', val)}
                                />
                            </div>
                            <div className="col-md-3">
                                <MultiSelectDropdown
                                    label="Status"
                                    options={filterOptions.status.map(s => ({ value: s, label: s }))}
                                    selected={filters.status}
                                    onChange={(val) => handleFilterUpdate('status', val)}
                                />
                            </div>
                        </div>

                        {/* Download Config Section */}
                        <div className="bg-light p-3 rounded mt-4 border">
                            <h6 className="fw-bold mb-3">Download Configuration</h6>
                            <div className="d-flex align-items-center gap-3">
                                <div style={{ minWidth: '200px' }}>
                                    <label className="small text-muted mb-1">Select Template</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={templateNumber}
                                        onChange={(e) => setTemplateNumber(e.target.value)}
                                    >
                                        <option value="1">Template 1 (Standard)</option>
                                        <option value="3">Template 3 (Advanced)</option>
                                        <option value="4">Template 4 (Compact)</option>
                                    </select>
                                </div>
                                <div style={{ maxWidth: '150px' }}>
                                    <label className="small text-muted mb-1">Limit Quantity</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="Max Questions"
                                        value={numberOfQuestions}
                                        onChange={(e) => setNumberOfQuestions(e.target.value)}
                                    />
                                </div>
                                <div className="ms-auto pt-4">
                                    <button className="btn btn-outline-primary me-2" onClick={handlePreview} disabled={loading}>
                                        {loading ? 'Scanning...' : 'Preview Data'}
                                    </button>
                                    <button className="btn btn-primary" onClick={handleDownload} disabled={previewCount === 0}>
                                        <FaFileDownload className="me-2" /> Download Archive
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Preview Table */}
                    {previewData.length > 0 && (
                        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="card-header bg-white py-4 px-4 border-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1 fw-bold text-dark">Preview Results</h5>
                                    <p className="text-muted small mb-0">Found <span className="fw-bold text-primary">{filteredPreviewData.length}</span> matching questions</p>
                                </div>
                                <div className="position-relative">
                                    <FaFilter className="position-absolute text-muted small" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="text"
                                        className="form-control form-control-sm border-0 bg-light rounded-pill ps-5 py-2 fw-medium"
                                        style={{ minWidth: '250px' }}
                                        placeholder="Search questions..."
                                        value={previewSearchTerm}
                                        onChange={(e) => setPreviewSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-responsive" style={{ maxHeight: '600px' }}>
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light sticky-top" style={{ zIndex: 5 }}>
                                        <tr className="text-uppercase text-muted x-small fw-bold letter-spacing-1">
                                            <th className="py-3 px-4 border-0">Question</th>
                                            <th className="py-3 px-4 border-0 text-center">Type</th>
                                            <th className="py-3 px-4 border-0 text-center">Bloom</th>
                                            <th className="py-3 px-4 border-0 text-center">CO</th>
                                            <th className="py-3 px-4 border-0 text-center">Marks</th>
                                            <th className="py-3 px-4 border-0 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPreviewData.map((q, idx) => (
                                            <tr key={idx} style={{ transition: 'all 0.2s' }}>
                                                <td className="py-3 px-4" style={{ minWidth: '350px' }}>
                                                    <div className="d-flex align-items-start">
                                                        <span className="badge bg-light text-secondary border me-3 mt-1 rounded-pill" style={{ minWidth: '35px' }}>Q{idx + 1}</span>
                                                        <span className="text-dark fw-medium lh-base">{q.text}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="badge bg-light text-dark border fw-normal px-3 py-2 rounded-pill">{q.type}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill fw-bold">
                                                        {q.bloomLevel || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-2 rounded-pill fw-bold">
                                                        {q.courseOutcome}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center fw-bold">{q.marks}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`badge ${q.status === 'Approved' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' :
                                                        q.status === 'Rejected' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' :
                                                            'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                                                        } px-3 py-2 rounded-pill fw-bold`}>
                                                        {q.status === 'Approved' ? <><FaCheckCircle className="me-1" /> Approved</> :
                                                            q.status === 'Rejected' ? <><FaExclamationCircle className="me-1" /> Rejected</> :
                                                                'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredPreviewData.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-5 text-muted">
                                                    <div className="d-flex flex-column align-items-center opacity-50">
                                                        <FaFilter className="fs-1 mb-3" />
                                                        <p className="mb-0">No questions found matching "{previewSearchTerm}"</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HodReports;
