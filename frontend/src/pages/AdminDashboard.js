import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import CreateUser from '../components/AdminPanel/CreateUser';
import FetchUsersByDepartment from '../components/AdminPanel/FetchUsersByDepartment';
import ManageTerms from '../components/AdminPanel/ManageTerms';
import DepartmentManager from '../components/AdminPanel/DepartmentManager';
import OrganizationManager from '../components/AdminPanel/OrganizationManager';
import AdminSidebar from '../components/AdminPanel/AdminSidebar';
import '../css/AdminModern.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
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
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="admin-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
