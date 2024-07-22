import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import CreateUser from '../components/AdminPanel/CreateUser';
import FetchUsersByDepartment from '../components/AdminPanel/FetchUsersByDepartment';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="container mt-5">
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h2 className="mb-4 text-center">Admin Dashboard</h2>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
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
    </div>
  );
};

export default AdminDashboard;
