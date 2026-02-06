import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/userService';
import { useTerm } from '../../context/TermContext';
import MultiSelectDropdown from '../Common/MultiSelectDropdown';

const MasterDownloaderModal = ({ show, handleClose }) => {
  const { selectedTerm, currentTerm } = useTerm();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [availableTerms, setAvailableTerms] = useState([]);

  // Filters - Now Arrays
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

  // Download settings
  const [templateNumber, setTemplateNumber] = useState(1);
  const [numberOfQuestions, setNumberOfQuestions] = useState('');

  // Data & UI State
  const [previewData, setPreviewData] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Load available terms and initial faculties on mount
  useEffect(() => {
    if (show) {
      const fetchMeta = async () => {
        try {
          // Fetch Archived Terms
          const archived = await userService.getArchivedTerms();
          const allTerms = [
            { id: currentTerm, label: `Current Term (${currentTerm})` },
            ...archived.map(t => ({ id: t, label: `Archived Term ${t}` }))
          ];

          // Unique by ID
          const uniqueTerms = [...new Map(allTerms.map(item => [item.id, item])).values()];
          setAvailableTerms(uniqueTerms);

          // Fetch Faculties
          const facultiesData = await userService.getFacultiesByDepartment();
          setFaculties(facultiesData);

        } catch (error) {
          console.error("Error fetching meta data", error);
        }
      };
      fetchMeta();

      // Reset filters when modal opens, defaulting to global selectedTerm
      setFilters(prev => ({
        ...prev,
        termId: selectedTerm ? [selectedTerm] : [],
        courseId: [], assessmentId: [], facultyId: [], type: [], bloomLevel: [], courseOutcome: [], status: []
      }));
    }
  }, [show, currentTerm, selectedTerm]);

  // Fetch Courses whenever Term ID changes
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // If no term selected, maybe don't fetch or fetch default? 
        // Backend defaults to current term if empty, so let's try to be smart.
        // Since we can multiselect terms, we might need to fetch courses for multiple terms.
        // BUT getCoursesByDepartment usually takes ONE term or None.
        // Let's iterate if multiple, or just fetch for "Current" if mixed?
        // Simplification: Fetch courses for the FIRST selected term to show generic list?
        // BETTER: We need a new endpoint or loop. 
        // Let's just Loop for now if list is small.

        if (filters.termId.length === 0) {
          setCourses([]);
          return;
        }

        let allCourses = [];
        for (const tId of filters.termId) {
          const data = await userService.getCoursesByDepartment(tId);
          allCourses = [...allCourses, ...data];
        }
        // Unique courses by ID
        const unique = [...new Map(allCourses.map(c => [c._id, c])).values()];
        setCourses(unique);

      } catch (error) {
        console.error("Error fetching courses", error);
      }
    };
    fetchCourses();
  }, [filters.termId]);

  // Load Assessments when Course changes
  useEffect(() => {
    if (filters.courseId.length > 0) {
      const fetchAssessments = async () => {
        try {
          // Similarly, loop through courses/terms or use a smarter backend.
          // Loop is safe for reasonable usage.
          let allAssessments = [];

          // We need assessments for the selected Courses AND the selected Terms.
          // The existing API getAssessmentsByCourse(courseId, termId) works.
          // This is getting exponential complexity (M terms * N courses).
          // Optimization: Only do this for reasonable numbers.

          const termLoop = filters.termId.length > 0 ? filters.termId : [currentTerm]; // Fallback to current if empty? OR handle empty.

          for (const cId of filters.courseId) {
            for (const tId of termLoop) {
              const data = await userService.getAssessmentsByCourse(cId, tId);
              allAssessments = [...allAssessments, ...data];
            }
          }

          const unique = [...new Map(allAssessments.map(a => [a._id, a])).values()];
          setAssessments(unique);
        } catch (error) {
          console.error(error);
        }
      };
      fetchAssessments();
    } else {
      setAssessments([]);
    }
  }, [filters.courseId, filters.termId, currentTerm]);

  // Fetch Preview Data
  const fetchPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key].length > 0) cleanFilters[key] = filters[key];
      });

      const data = await userService.masterFilterQuestions(cleanFilters);
      setPreviewData(data);
      setTotalQuestions(data.length);
    } catch (err) {
      console.error("Preview failed", err);
    } finally {
      setLoadingPreview(false);
    }
  }, [filters]);

  useEffect(() => {
    if (show) fetchPreview();
  }, [filters, show, fetchPreview]);


  const handleFilterUpdate = (key, newValues) => {
    setFilters(prev => ({
      ...prev,
      [key]: newValues,
      // Clear dependents if parents cleared? (Optional, maybe keep them to be nice)
      ...(key === 'termId' && newValues.length === 0 ? { courseId: [], assessmentId: [] } : {}),
      ...(key === 'courseId' && newValues.length === 0 ? { assessmentId: [] } : {})
    }));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = {
        ...filters,
        templateNumber,
        ...(numberOfQuestions && { numberOfQuestions })
      };

      // Clean empty arrays
      Object.keys(params).forEach(key => {
        if (Array.isArray(params[key]) && params[key].length === 0) delete params[key];
        if (params[key] === '' || params[key] == null) delete params[key];
      });

      await userService.downloadQuestions(params);
    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to download questions");
    } finally {
      setDownloading(false);
    }
  };

  // Helper options map
  // ...

  return (
    <div className={`modal ${show ? 'show' : ''}`} style={{ display: show ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <h5 className="modal-title">Master Question Downloader</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">

            {/* Filters Row 1: Term, Course, Faculty, Assessment, Status */}
            <div className="row g-2 mb-3">
              <div className="col-md-2">
                <MultiSelectDropdown
                  label="Term"
                  options={availableTerms.map(t => ({ label: t.label, value: t.id }))}
                  selected={filters.termId}
                  onChange={(vals) => handleFilterUpdate('termId', vals)}
                />
              </div>
              <div className="col-md-3">
                <MultiSelectDropdown
                  label="Course"
                  options={courses.map(c => ({ label: `${c.name} (${c.code})`, value: c._id }))}
                  selected={filters.courseId}
                  onChange={(vals) => handleFilterUpdate('courseId', vals)}
                />
              </div>
              <div className="col-md-3">
                <MultiSelectDropdown
                  label="Assessment"
                  options={assessments.map(a => ({ label: a.name, value: a._id }))}
                  selected={filters.assessmentId}
                  onChange={(vals) => handleFilterUpdate('assessmentId', vals)}
                />
              </div>
              <div className="col-md-2">
                <MultiSelectDropdown
                  label="Faculty"
                  options={faculties.map(f => ({ label: f.name, value: f._id }))}
                  selected={filters.facultyId}
                  onChange={(vals) => handleFilterUpdate('facultyId', vals)}
                />
              </div>
              <div className="col-md-2">
                <MultiSelectDropdown
                  label="Status"
                  options={[
                    { label: 'Pending', value: 'Pending' },
                    { label: 'Submitted', value: 'Submitted' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Approved with Remarks', value: 'Approved with Remarks' },
                    { label: 'Rejected', value: 'Rejected' },
                  ]}
                  selected={filters.status}
                  onChange={(vals) => handleFilterUpdate('status', vals)}
                />
              </div>
            </div>

            {/* Filters Row 2 */}
            <div className="row g-2 mb-4">
              <div className="col-md-3">
                <MultiSelectDropdown
                  label="Question Type"
                  options={[
                    { label: 'MCQ', value: 'MCQ' },
                    { label: 'Subjective', value: 'Subjective' }
                  ]}
                  selected={filters.type}
                  onChange={(vals) => handleFilterUpdate('type', vals)}
                />
              </div>
              <div className="col-md-2">
                <MultiSelectDropdown
                  label="Bloom Level"
                  options={[1, 2, 3, 4, 5, 6].map(i => ({ label: `L${i}`, value: `L${i}` }))}
                  selected={filters.bloomLevel}
                  onChange={(vals) => handleFilterUpdate('bloomLevel', vals)}
                />
              </div>
              <div className="col-md-2">
                <MultiSelectDropdown
                  label="CO"
                  options={[1, 2, 3, 4, 5, 6].map(i => ({ label: `CO${i}`, value: `CO${i}` }))}
                  selected={filters.courseOutcome}
                  onChange={(vals) => handleFilterUpdate('courseOutcome', vals)}
                />
              </div>
              <div className="col-md-5 d-flex align-items-end justify-content-end">
                <span className="badge bg-info text-dark p-2">
                  Total Questions Found: {loadingPreview ? '...' : totalQuestions}
                </span>
              </div>
            </div>

            <hr />

            {/* Preview Table */}
            <div className="table-responsive border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: '40%' }}>Question Text</th>
                    <th>Type</th>
                    <th>Faculty</th>
                    <th>Status</th>
                    <th>Marks</th>
                    <th>Course</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPreview ? (
                    <tr><td colSpan="6" className="text-center py-4">Loading preview...</td></tr>
                  ) : previewData.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No questions match filter criteria</td></tr>
                  ) : (
                    previewData.slice(0, 50).map((q) => (
                      <tr key={q._id}>
                        <td className="text-truncate" style={{ maxWidth: '300px' }} title={q.text}>{q.text}</td>
                        <td><span className="badge bg-light text-dark border">{q.type}</span></td>
                        <td className="small">{q.facultyName}</td>
                        <td>
                          <span className={`badge ${q.status === 'Approved' ? 'bg-success' :
                            q.status === 'Rejected' ? 'bg-danger' :
                              'bg-warning text-dark'
                            }`}>
                            {q.status}
                          </span>
                        </td>
                        <td>{q.marks}</td>
                        <td className="small">{q.courseCode}</td>
                      </tr>
                    ))
                  )}
                  {previewData.length > 50 && (
                    <tr><td colSpan="6" className="text-center fst-italic text-muted small">... and {previewData.length - 50} more questions</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
          <div className="modal-footer bg-light justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div>
                <select className="form-select form-select-sm" value={templateNumber} onChange={(e) => setTemplateNumber(e.target.value)}>
                  <option value="1">Template 1 (Course File)</option>
                  <option value="3">Template 3 (MCQ)</option>
                  <option value="4">Template 4 (Subjective)</option>
                </select>
              </div>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Limit Qty (Optional)"
                style={{ width: '150px' }}
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
              />
            </div>

            <div>
              <button type="button" className="btn btn-secondary me-2" onClick={handleClose}>Close</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={downloading || totalQuestions === 0}
              >
                {downloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating Zip...
                  </>
                ) : (
                  `Download (${totalQuestions})`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDownloaderModal;
