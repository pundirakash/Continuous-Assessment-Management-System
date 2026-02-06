import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import userService from '../../services/userService';
import { FaCloudUploadAlt, FaDownload, FaUndo, FaTimes, FaFileExcel, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const BulkImportModal = ({ assessmentId, setName, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [importErrors, setImportErrors] = useState([]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
        setSuccess(null);
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await userService.downloadImportTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'PrashnaMitra_Bulk_Import_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download template. Please try again.');
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('assessmentId', assessmentId);
        formData.append('setName', setName);

        try {
            const result = await userService.bulkImportQuestions(formData);
            setSuccess(result.message);
            setImportErrors(result.errors || []);
            if (onImportSuccess) onImportSuccess();
            setFile(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Import failed. Check your file format.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndoImport = async () => {
        if (!window.confirm('Are you sure you want to revert the LAST bulk import? This will delete those questions.')) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await userService.undoBulkImport(assessmentId, setName);
            setSuccess(result.message);
            if (onImportSuccess) onImportSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Undo failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1100 }}>

            <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column"
                style={{
                    width: '550px',
                    animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform, opacity'
                }}>

                {/* Header */}
                <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                            <FaCloudUploadAlt size={22} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-bold">Bulk Import Questions</h5>
                            <p className="m-0 small opacity-75">Upload Excel set for {setName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-close btn-close-white opacity-100 shadow-none"></button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {/* Step 1: Download Template */}
                    <div className="mb-4 p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                <FaFileExcel size={20} />
                            </div>
                            <div className="text-left">
                                <h6 className="m-0 fw-bold text-dark">Need the template?</h6>
                                <p className="m-0 small text-secondary">Download the pre-filled format</p>
                            </div>
                        </div>
                        <button className="btn btn-white border shadow-sm rounded-pill btn-sm px-3 fw-bold text-primary" onClick={handleDownloadTemplate}>
                            <FaDownload className="me-2" /> Download
                        </button>
                    </div>

                    {/* Step 2: Upload File */}
                    <div className="mb-4">
                        <label className="form-label fw-bold text-secondary small text-uppercase text-left w-100">Choose Excel File</label>
                        <div className={`p-4 border-2 border-dashed rounded-4 text-center transition-all ${file ? 'border-primary bg-primary bg-opacity-5' : 'border-light-subtle'}`}
                            style={{ cursor: 'pointer', position: 'relative' }}>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                            <FaCloudUploadAlt size={32} className={`mb-2 ${file ? 'text-primary' : 'text-secondary opacity-50'}`} />
                            <div className="small fw-bold text-dark">
                                {file ? file.name : 'Click to browse or drag & drop'}
                            </div>
                            <div className="x-small text-secondary mt-1">Supports .xlsx, .xls</div>
                        </div>
                    </div>

                    {/* Feedback */}
                    {error && (
                        <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-10 rounded-3 text-danger small d-flex align-items-center gap-2">
                            <FaExclamationCircle /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-10 rounded-3 text-success small">
                            <div className="d-flex align-items-center gap-2 fw-bold mb-1">
                                <FaCheckCircle /> {success}
                            </div>
                            {importErrors && importErrors.length > 0 && (
                                <div className="mt-2 text-danger">
                                    <div className="fw-bold x-small text-uppercase opacity-75 mb-1">Skipped Rows:</div>
                                    <ul className="m-0 ps-3" style={{ fontSize: '0.85em', maxHeight: '100px', overflowY: 'auto' }}>
                                        {importErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="d-flex flex-column gap-3">
                        <button
                            className="btn text-white py-2 fw-bold shadow-sm rounded-pill transition-all"
                            disabled={!file || isLoading}
                            onClick={handleImport}
                            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', opacity: (!file || isLoading) ? 0.7 : 1 }}
                        >
                            {isLoading ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span> Importing...</>
                            ) : 'Start Import'}
                        </button>

                        <div className="d-flex align-items-center gap-2">
                            <div className="flex-grow-1 border-top opacity-25"></div>
                            <span className="small text-secondary fw-bold px-2">OR</span>
                            <div className="flex-grow-1 border-top opacity-25"></div>
                        </div>

                        <button
                            className="btn btn-outline-warning py-2 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2"
                            disabled={isLoading}
                            onClick={handleUndoImport}
                        >
                            <FaUndo size={14} /> Undo Last Import
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .x-small { font-size: 0.75rem; }
      `}</style>
        </div>,
        document.body
    );
};

export default BulkImportModal;
