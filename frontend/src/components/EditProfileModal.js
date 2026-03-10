import React, { useState } from 'react';
import { FaUserEdit } from 'react-icons/fa';

const EditProfileModal = ({ onClose, onSave, currentUser }) => {
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [uid, setUid] = useState(currentUser?.uid || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(name, email, uid);
    };

    return (
        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                    <div className="modal-header border-bottom-0 p-4 pb-0 justify-content-center position-relative">
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose}></button>
                        <div className="text-center">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary d-inline-flex mb-3">
                                <FaUserEdit size={24} />
                            </div>
                            <h5 className="modal-title fw-bold">Edit Profile</h5>
                        </div>
                    </div>
                    <div className="modal-body p-4 pt-3">
                        <form onSubmit={handleSubmit}>
                            <div className="form-floating mb-3">
                                <input
                                    type="text"
                                    className="form-control rounded-3 border-light bg-light"
                                    id="profileName"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <label htmlFor="profileName">Full Name</label>
                            </div>

                            <div className="form-floating mb-3">
                                <input
                                    type="email"
                                    className="form-control rounded-3 border-light bg-light"
                                    id="profileEmail"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <label htmlFor="profileEmail">Email Address</label>
                            </div>

                            <div className="form-floating mb-4">
                                <input
                                    type="text"
                                    className="form-control rounded-3 border-light bg-light"
                                    id="profileUid"
                                    placeholder="UID / Employee ID"
                                    value={uid}
                                    onChange={(e) => setUid(e.target.value)}
                                    required
                                />
                                <label htmlFor="profileUid">UID / Employee ID</label>
                            </div>

                            <div className="d-grid">
                                <button type="submit" className="btn btn-primary btn-lg rounded-pill fw-bold shadow-sm">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
