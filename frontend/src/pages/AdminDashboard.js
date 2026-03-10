import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import CreateUser from '../components/AdminPanel/CreateUser';
import FetchUsersByDepartment from '../components/AdminPanel/FetchUsersByDepartment';
import ManageTerms from '../components/AdminPanel/ManageTerms';
import DepartmentManager from '../components/AdminPanel/DepartmentManager';
import OrganizationManager from '../components/AdminPanel/OrganizationManager';
import AdminSidebar from '../components/AdminPanel/AdminSidebar';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditProfileModal from '../components/EditProfileModal';
import { jwtDecode } from 'jwt-decode';
import '../css/AdminModern.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (err) {
        console.error('Failed to decode token', err);
      }
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleChangePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
      alert('Password changed successfully');
      setShowChangePasswordModal(false);
    } catch (error) {
      console.error('Password change error', error);
      alert(error.response?.data?.message || 'Failed to change password. Please try again.');
    }
  };

  const handleEditProfile = async (name, email, uid) => {
    try {
      await authService.updateProfile(name, email, uid);
      alert('Profile updated successfully');
      setShowEditProfileModal(false);
      // Update local state with new token payload
      const token = localStorage.getItem('token');
      if (token) {
        setCurrentUser(jwtDecode(token));
      }
    } catch (error) {
      console.error('Profile update error', error);
      alert(error.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="admin-content-fade">
            <header className="admin-header">
              <div>
                <h1 className="admin-page-title">User Management</h1>
                <p className="text-muted small">Manage faculty, HODs, and administrative staff across departments.</p>
              </div>
            </header>
            <div className="row g-4">
              <div className="col-lg-5">
                <CreateUser />
              </div>
              <div className="col-lg-7">
                <FetchUsersByDepartment />
              </div>
            </div>
          </div>
        );
      case 'departments':
        return <DepartmentManager />;
      case 'terms':
        return (
          <div className="admin-content-fade">
            <header className="admin-header">
              <div>
                <h1 className="admin-page-title">Term Management</h1>
                <p className="text-muted small">Configure academic sessions and manage historical archives.</p>
              </div>
            </header>
            <ManageTerms />
          </div>
        );
      case 'organization':
        return <OrganizationManager />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onChangePasswordClick={() => setShowChangePasswordModal(true)}
        onEditProfileClick={() => setShowEditProfileModal(true)}
      />
      <main className="admin-main">
        {renderContent()}
      </main>

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onChangePassword={handleChangePassword}
        />
      )}

      {showEditProfileModal && (
        <EditProfileModal
          onClose={() => setShowEditProfileModal(false)}
          onSave={handleEditProfile}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
