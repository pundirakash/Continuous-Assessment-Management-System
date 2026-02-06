import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';
import { useTerm } from '../../context/TermContext';
import { FaPlus, FaBook, FaHistory, FaGlobe, FaLayerGroup } from 'react-icons/fa';

const CreateCourseModal = ({ show, handleClose, addCourse }) => {
  const { selectedTerm } = useTerm();
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'catalog'
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  const [catalogCourses, setCatalogCourses] = useState([]);
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState('');

  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCatalogCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.getCatalogCourses(selectedTerm);
      setCatalogCourses(data);
    } catch (err) {
      console.error("Failed to fetch catalog", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTerm]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      if (activeTab === 'catalog') {
        fetchCatalogCourses();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [show, activeTab, fetchCatalogCourses]);

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await userService.createCourse({ name: courseName, code: courseCode, termId: selectedTerm });
      addCourse(); // Refresh list
      handleClose();
      setCourseName('');
      setCourseCode('');
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCatalog = async (e) => {
    e.preventDefault();
    if (!selectedCatalogCourseId) return;
    setIsLoading(true);
    try {
      await userService.activateCourse(selectedCatalogCourseId, selectedTerm);
      addCourse(); // Refresh list
      handleClose();
      setSelectedCatalogCourseId('');
    } catch (error) {
      console.error('Error activating course:', error);
      setError(error.message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1100, backdropFilter: 'blur(4px)' }}>

      <div className="bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column"
        style={{
          width: '500px',
          maxHeight: '90vh',
          animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}>

        {/* Header */}
        <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <FaBook size={20} />
            </div>
            <div>
              <h5 className="m-0 fw-bold">Add Course to Term</h5>
              <p className="m-0 small opacity-75">Configure course for current cycle</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-close btn-close-white opacity-100 shadow-none"></button>
        </div>

        {/* Custom Tabs */}
        <div className="px-4 py-3 bg-light d-flex gap-2">
          <button
            className={`flex-grow-1 btn py-2 px-3 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold transition-all ${activeTab === 'new' ? 'bg-white shadow-sm text-primary border' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('new')}
          >
            <FaPlus size={14} /> Create New
          </button>
          <button
            className={`flex-grow-1 btn py-2 px-3 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold transition-all ${activeTab === 'catalog' ? 'bg-white shadow-sm text-primary border' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('catalog')}
          >
            <FaHistory size={14} /> Import from Catalog
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-auto">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmitNew}>
              <div className="mb-4 text-left">
                <label className="form-label fw-bold text-secondary small text-uppercase ls-1">Course Details</label>
                <div className="mb-3 position-relative">
                  <div className="position-absolute ps-3 top-50 translate-middle-y text-secondary opacity-50"><FaGlobe size={14} /></div>
                  <input
                    type="text"
                    className="form-control ps-5 py-3 border-0 bg-light rounded-3 shadow-none custom-input"
                    placeholder="Enter Course Full Name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3 position-relative">
                  <div className="position-absolute ps-3 top-50 translate-middle-y text-secondary opacity-50"><FaLayerGroup size={14} /></div>
                  <input
                    type="text"
                    className="form-control ps-5 py-3 border-0 bg-light rounded-3 shadow-none custom-input"
                    placeholder="Enter Course Code (e.g. CS101)"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn text-white py-3 fw-bold shadow-lg rounded-pill w-100 transition-all hover-lift mt-2"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
              >
                {isLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span> Processing...</>
                ) : 'Create & Activate Course'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitCatalog}>
              <div className="mb-4 text-left">
                <p className="text-secondary small mb-3">Re-activate an existing course from the system catalog for this term.</p>
                <label className="form-label fw-bold text-secondary small text-uppercase ls-1">Select from Catalog</label>

                <div className="mb-3">
                  <select
                    className="form-select py-3 px-4 border-0 bg-light rounded-3 shadow-none custom-input"
                    value={selectedCatalogCourseId}
                    onChange={(e) => setSelectedCatalogCourseId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {catalogCourses.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {catalogCourses.length === 0 && !isLoading && (
                  <div className="p-4 text-center bg-light rounded-4 border-dashed border-2">
                    <FaHistory size={24} className="text-muted mb-2 opacity-50" />
                    <p className="small text-muted mb-0">No inactive courses found in global catalog.</p>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center p-3">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedCatalogCourseId || isLoading}
                className="btn btn-success py-3 fw-bold shadow-lg rounded-pill w-100 transition-all hover-lift mt-2 border-0"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', opacity: (!selectedCatalogCourseId || isLoading) ? 0.7 : 1 }}
              >
                {isLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span> Processing...</>
                ) : 'Import Selected Course'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .ls-1 { letter-spacing: 0.5px; }
        .custom-input:focus {
            background-color: #fff !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
            border: 1px solid #4f46e5 !important;
        }
        .hover-lift:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .modal-backdrop-custom {
            will-change: backdrop-filter;
        }
      `}</style>

      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>,
    document.body
  );
};

export default CreateCourseModal;
