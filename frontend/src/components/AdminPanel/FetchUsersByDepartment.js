import React, { useState, useEffect } from 'react';

import ErrorModal from '../ErrorModal';
import { FaEdit, FaKey, FaTrash, FaSearch, FaUserFriends, FaCalendarCheck } from 'react-icons/fa';
import authService from '../../services/authService';
import userService from '../../services/userService';

const FetchUsersByDepartment = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [users, setUsers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);

  const [currentTerm, setCurrentTerm] = useState('--');

  useEffect(() => {
    fetchSchools();
    fetchCurrentTerm();
  }, []);

  const fetchCurrentTerm = async () => {
    try {
      const config = await userService.getSystemConfig();
      if (config && config.value) setCurrentTerm(config.value);
    } catch (err) {
      console.error("Failed to fetch current term", err);
    }
  };

  const fetchSchools = async () => {
    try {
      const orgData = await userService.getOrganization();
      setSchools(orgData.schools || []);
    } catch (err) {
      console.error("Failed to fetch organization data", err);
    }
  };

  const handleSchoolChange = async (e) => {
    const schoolId = e.target.value;
    setSelectedSchool(schoolId);
    setDepartmentId(''); // Reset dept
    setUsers([]); // Reset users
    if (schoolId) {
      try {
        const depts = await userService.getDepartments(schoolId);
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    } else {
      setDepartments([]);
    }
  };

  const handleFetchUsers = async () => {
    if (!departmentId) return;
    try {
      // Find the department object to get its name if backend still expects name, 
      // but my updated backend now handles both ID and name string.
      const data = await userService.getUsersByDepartment(departmentId);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users', error);
      setError(error.message);
      setShowErrorModal(true);
    }
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setEditMode(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      alert('User deleted successfully');
      handleFetchUsers();
    } catch (error) {
      console.error('Error deleting user', error);
      setError(error.message);
      setShowErrorModal(true);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:');
    if (newPassword) {
      try {
        await authService.adminResetPassword(userId, newPassword);
        alert('Password reset successfully');
      } catch (error) {
        console.error('Error resetting password', error);
        setError(error.message);
        setShowErrorModal(true);
      }
    }
  };

  const handleChange = (e) => {
    setCurrentUser({
      ...currentUser,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveChanges = async () => {
    try {
      await userService.updateUser(currentUser);
      alert('User updated successfully');
      setEditMode(false);
      handleFetchUsers();
    } catch (error) {
      console.error('Error updating user', error);
      setError(error.message);
      setShowErrorModal(true);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-content-fade">
      <div className="admin-header mb-4">
        <div className="d-flex align-items-center justify-content-between w-100">
          <div>
            <h4 className="admin-page-title mb-1">Search & Filter Users</h4>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill px-3 shadow-sm py-2">
                <FaCalendarCheck className="me-2" />
                Active Term: {currentTerm}
              </span>
              <span className="text-muted small">Fetch staff directory to manage profiles</span>
            </div>
          </div>
          <div className="p-2 bg-white rounded-circle shadow-sm border">
            <FaUserFriends className="text-primary fs-4 m-1" />
          </div>
        </div>
      </div>

      <div className="admin-card border-0 shadow-sm mb-4">
        <div className="admin-card-header bg-white py-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary">
              <FaSearch size={18} />
            </div>
            <h5 className="admin-card-title fw-bold mb-0">Staff Search Engine</h5>
          </div>
        </div>
        <div className="admin-card-body p-4">
          <div className="row g-4 align-items-end">
            <div className="col-md-5">
              <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">1. Select School</label>
              <select
                className="form-select border-0 bg-light rounded-3 py-2 px-3 fw-medium"
                value={selectedSchool}
                onChange={handleSchoolChange}
              >
                <option value="">-- All Schools --</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">2. Select Department</label>
              <select
                className="form-select border-0 bg-light rounded-3 py-2 px-3 fw-medium"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={!selectedSchool && departments.length === 0}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100 py-2 fw-bold shadow-sm" onClick={handleFetchUsers} disabled={!departmentId}>
                Fetch List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1">
          <span className="input-group-text bg-transparent border-0 ps-3">
            <FaSearch className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-0 px-2 fw-medium"
            placeholder="Quick search within results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {editMode ? (
        <div className="admin-card border-0 shadow-lg p-0 overflow-hidden admin-content-fade">
          <div className="bg-primary p-4 text-white d-flex align-items-center gap-3">
            <div className="p-3 bg-white bg-opacity-25 rounded-circle text-white">
              <FaEdit size={30} />
            </div>
            <div>
              <h4 className="mb-0 fw-bold">Modifying Profile</h4>
              <span className="x-small text-uppercase fw-bold ls-1 opacity-75">{currentUser.name} ({currentUser.uid})</span>
            </div>
          </div>
          <div className="p-4">
            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control border-light bg-light rounded-3 py-2 px-3 fw-bold"
                  value={currentUser.name}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">UID / ID</label>
                <input
                  type="text"
                  name="uid"
                  className="form-control border-light bg-light rounded-3 py-2 px-3 fw-bold"
                  value={currentUser.uid}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control border-light bg-light rounded-3 py-2 px-3 fw-bold"
                value={currentUser.email}
                onChange={handleChange}
              />
            </div>
            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Department</label>
                <select
                  name="departmentId"
                  className="form-select border-light bg-light rounded-3 py-2 px-3 fw-bold"
                  value={currentUser.departmentId}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Role</label>
                <select
                  name="role"
                  className="form-select border-light bg-light rounded-3 py-2 px-3 fw-bold"
                  value={currentUser.role}
                  onChange={handleChange}
                >
                  <option value="">Select Role</option>
                  {['Faculty', 'HOD', 'CourseCoordinator'].map((role, index) => (
                    <option key={index} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 bg-light d-flex gap-2">
            <button className="btn btn-primary flex-grow-1 py-3 fw-bold shadow-sm" onClick={handleSaveChanges}>Save Changes</button>
            <button className="btn btn-white flex-grow-1 py-3 border fw-bold" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="admin-card border-0 shadow-lg">
          <div className="admin-card-header bg-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <FaUserFriends className="text-primary" />
              <span className="admin-card-title fw-bold">Staff Directory</span>
              <span className="badge bg-light text-primary border rounded-pill ms-2 px-3 shadow-sm">{filteredUsers.length} Users</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th className="px-4 py-3 x-small fw-bold text-uppercase text-muted ls-1">Basic Info</th>
                  <th className="py-3 x-small fw-bold text-uppercase text-muted ls-1">UID</th>
                  <th className="py-3 x-small fw-bold text-uppercase text-muted ls-1">Role</th>
                  <th className="px-4 py-3 x-small fw-bold text-uppercase text-muted ls-1 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="admin-table-row">
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-circle text-primary fw-bold small shadow-sm" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{user.name}</div>
                          <div className="text-muted x-small">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <code className="bg-light px-2 py-1 rounded text-secondary x-small fw-bold border">{user.uid}</code>
                    </td>
                    <td className="py-3">
                      <span className={`badge border-0 px-3 py-2 rounded-pill fw-bold x-small ${user.role === 'HOD' ? 'bg-danger bg-opacity-10 text-danger' :
                          user.role === 'CourseCoordinator' ? 'bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25' :
                            'bg-info bg-opacity-10 text-info'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-inline-flex gap-2">
                        <button className="admin-btn-white btn-sm rounded-circle p-2 shadow-sm border" onClick={() => handleEditUser(user)} title="Edit profile" style={{ width: '38px', height: '38px' }}>
                          <FaEdit className="text-primary" />
                        </button>
                        <button className="admin-btn-white btn-sm rounded-circle p-2 shadow-sm border" onClick={() => handleResetPassword(user._id)} title="Reset password" style={{ width: '38px', height: '38px' }}>
                          <FaKey className="text-warning" />
                        </button>
                        <button className="admin-btn-white btn-sm rounded-circle p-2 shadow-sm border" onClick={() => handleDeleteUser(user._id)} title="Delete account" style={{ width: '38px', height: '38px' }}>
                          <FaTrash className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-5 text-center bg-light bg-opacity-25">
              <div className="mb-3 opacity-25">
                <FaUserFriends size={50} className="text-muted" />
              </div>
              <p className="text-muted mb-0">No staff members match the selected criteria.</p>
            </div>
          )}
        </div>
      )}
      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default FetchUsersByDepartment;
