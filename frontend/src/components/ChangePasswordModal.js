import React, { useState } from 'react';
import { FaLock, FaTimes } from 'react-icons/fa';

const ChangePasswordModal = ({ onClose, onChangePassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match');
      return;
    }
    onChangePassword(currentPassword, newPassword, confirmNewPassword);
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-header border-bottom-0 p-4 pb-0">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                <FaLock size={24} />
              </div>
              <h4 className="modal-title fw-bold">Change Password</h4>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted fw-bold small text-uppercase">Current Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg rounded-3 bg-light border-0"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted fw-bold small text-uppercase">New Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg rounded-3 bg-light border-0"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted fw-bold small text-uppercase">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg rounded-3 bg-light border-0"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary btn-lg rounded-pill fw-bold shadow-sm">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
