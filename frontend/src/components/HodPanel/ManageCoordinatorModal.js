import React, { useState, useEffect } from 'react';
import { FaUserTie, FaCheck } from 'react-icons/fa';

const ManageCoordinatorModal = ({ show, handleClose, course, faculties, appointCoordinator, currentCoordinatorId }) => {
    const [selectedFaculty, setSelectedFaculty] = useState('');

    useEffect(() => {
        if (course && course.coordinator) {
            // If coordinator is populated object or just ID
            const coordId = typeof course.coordinator === 'object' ? course.coordinator._id : course.coordinator;
            setSelectedFaculty(coordId || '');
        } else if (currentCoordinatorId) {
            setSelectedFaculty(currentCoordinatorId);
        } else {
            setSelectedFaculty('');
        }
    }, [course, currentCoordinatorId]);


    const handleSubmit = () => {
        if (selectedFaculty) {
            appointCoordinator(course._id, selectedFaculty);
            handleClose();
        }
    };

    if (!show) return null;

    // Filter faculties to only show those assigned to this course? 
    // Or shoudl we show all faculties in department?
    // User said: "from the faculty that has been alloted that course"
    // So we should filter `faculties` to only those who have this course in their list?
    // The `faculties` prop passed here will likely be ALL faculties in Dept.
    // However, `course.faculties` array exists. Let's use that if available.

    const allocatedFaculties = course.faculties && course.faculties.length > 0
        ? faculties.filter(f => course.faculties.some(cf => (typeof cf === 'object' ? cf._id : cf) === f._id))
        : [];

    return (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', zIndex: 1050, backdropFilter: 'blur(4px)' }}>

            <div className="bg-white rounded-4 shadow-lg overflow-hidden position-relative" style={{ width: '500px', animation: 'zoomIn 0.2s ease-out' }}>
                <div className="p-4 text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-white bg-opacity-25 p-2 rounded-circle">
                            <FaUserTie size={20} />
                        </div>
                        <div>
                            <h6 className="mb-0 fw-bold">Manage Coordinator</h6>
                            <p className="mb-0 x-small opacity-75">{course?.name} ({course?.code})</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="btn-close btn-close-white shadow-none"></button>
                </div>

                <div className="p-4">
                    <p className="small text-muted mb-4">
                        Select a faculty member from the allocated list to serve as the Course Coordinator. They will handle approvals for assessment sets submitted by other faculty.
                    </p>

                    <div className="mb-4">
                        <label className="form-label x-small fw-bold text-uppercase text-secondary ls-1">Select Coordinator</label>
                        {allocatedFaculties.length > 0 ? (
                            <div className="d-flex flex-column gap-2" style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
                                {allocatedFaculties.map(faculty => (
                                    <div
                                        key={faculty._id}
                                        className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${selectedFaculty === faculty._id ? 'border-primary bg-primary bg-opacity-10' : 'border-light hover-shadow-sm'}`}
                                        onClick={() => setSelectedFaculty(faculty._id)}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white ${selectedFaculty === faculty._id ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '32px', height: '32px' }}>
                                                {faculty.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h6 className="mb-0 text-dark small fw-bold">{faculty.name}</h6>
                                                <p className="mb-0 x-small text-muted">{faculty.email}</p>
                                            </div>
                                        </div>
                                        {selectedFaculty === faculty._id && <FaCheck className="text-primary" />}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="alert alert-warning small border-0 bg-warning bg-opacity-10 text-warning rounded-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                No faculty members are currently allocated to this course. Please allocate faculty first.
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={handleClose}>Cancel</button>
                        <button
                            className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                            disabled={!selectedFaculty || allocatedFaculties.length === 0}
                            onClick={handleSubmit}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCoordinatorModal;
