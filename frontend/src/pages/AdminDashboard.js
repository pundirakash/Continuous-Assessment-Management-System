import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import CreateUser from '../components/AdminPanel/CreateUser';
import FetchUsersByDepartment from '../components/AdminPanel/FetchUsersByDepartment';
import ChangePasswordModal from '../components/ChangePasswordModal';
import '../css/AdminDashboard.css';

const AdminDashboard = () => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
      setShowChangePasswordModal(false);
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row mb-4">
        <div className="col-12 d-flex align-items-center justify-content-between">
          <h2 className="mb-2">Admin Dashboard</h2>
          <div className="btn-container">
            <button className="btn btn-primary m-2" onClick={openChangePasswordModal}>Change Password</button>
            <button className="btn btn-danger m-2" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              Create User
            </div>
            <div className="card-body">
              <CreateUser />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              Fetch Users by Department
            </div>
            <div className="card-body">
              <FetchUsersByDepartment />
            </div>
          </div>
        </div>
      </div>
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
