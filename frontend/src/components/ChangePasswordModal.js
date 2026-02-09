import React, { useState } from 'react';
import { FaLock } from 'react-icons/fa';

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
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          <div className="modal-header border-bottom-0 p-4 pb-0 justify-content-center position-relative">
            <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose}></button>
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary d-inline-flex mb-3">
                <FaLock size={24} />
              </div>
              <h5 className="modal-title fw-bold">Change Password</h5>
            </div>
          </div>
          <div className="modal-body p-4 pt-3">
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control rounded-3 border-light bg-light"
                  id="currentPassword"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <label htmlFor="currentPassword">Current Password</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control rounded-3 border-light bg-light"
                  id="newPassword"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <label htmlFor="newPassword">New Password</label>
              </div>

              <div className="form-floating mb-4">
                <input
                  type="password"
                  className="form-control rounded-3 border-light bg-light"
                  id="confirmNewPassword"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
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
