import React from 'react';
import CreateUser from '../components/AdminPanel/CreateUser';
import FetchUsersByDepartment from '../components/AdminPanel/FetchUsersByDepartment';

const AdminDashboard = () => {
  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Admin Dashboard</h2>
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
