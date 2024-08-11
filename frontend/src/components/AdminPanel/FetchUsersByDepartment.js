import React, { useState } from 'react';
import axios from 'axios';
import ErrorModal from '../ErrorModal';
import authService from '../../services/authService';

const FetchUsersByDepartment = () => {
  const [department, setDepartment] = useState('');
  const [users, setUsers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const departments = [
    'System Programming',
    'Web Development',
    'Machine Learning',
    'Artificial Intelligence',
    'Programming',
  ];

  const handleFetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/admin/users/${department}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUsers(response.data);
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
      await axios.delete(`http://localhost:3002/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
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
      await axios.put(`http://localhost:3002/api/admin/users/${currentUser._id}`, currentUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
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
    <div>
      <h3 className="mb-4">Fetch Users by Department</h3>
      <div className="mb-3">
        <select 
          className="form-select" 
          value={department} 
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <button className="btn btn-primary mt-2" onClick={handleFetchUsers}>Fetch Users</button>
      </div>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {editMode ? (
        <div>
          <h4>Edit User</h4>
          <div className="form-group mb-3">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              className="form-control"
              placeholder="Name"
              value={currentUser.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="uid">UID</label>
            <input
              type="text"
              name="uid"
              id="uid"
              className="form-control"
              placeholder="UID"
              value={currentUser.uid}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              className="form-control"
              placeholder="Email"
              value={currentUser.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="department">Department</label>
            <select
              name="department"
              id="department"
              className="form-select"
              value={currentUser.department}
              onChange={handleChange}
            >
              <option value="">Select Department</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-3">
            <label htmlFor="role">Role</label>
            <select
              name="role"
              id="role"
              className="form-select"
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
          <button className="btn btn-success me-2" onClick={handleSaveChanges}>Save Changes</button>
          <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <h4>User List</h4>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>UID</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.uid}</td>
                  <td>{user.email}</td>
                  <td>{user.department}</td>
                  <td>{user.role}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditUser(user)}>Edit</button><br/>
                    <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteUser(user._id)}>Delete</button><br/>
                    <button className="btn btn-info btn-sm" onClick={() => handleResetPassword(user._id)}>Reset</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
