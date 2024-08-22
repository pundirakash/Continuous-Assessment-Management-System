import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ErrorModal from '../ErrorModal';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    department: '',
    email: '',
    password: '',
    role: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_BASE_URL}/api/admin/register`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user', error);
      setError(error.message);
      setShowErrorModal(true);
    }
  };

  const handleBulkSubmit = async () => {
    if (!file) {
      alert('Please upload an Excel file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const users = XLSX.utils.sheet_to_json(sheet);
      console.log(users);

      try {
        await axios.post(`${process.env.REACT_APP_BASE_URL}/api/admin/bulk-register`, { users }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        alert('Users registered successfully');
      } catch (error) {
        console.error('Error creating users', error);
        setError(error.message);
        setShowErrorModal(true);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h3 className="mb-4">Create User</h3>
      
      {/* Single User Registration Form */}
      <form onSubmit={handleSingleSubmit}>
        <div className="form-group mb-3">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            className="form-control"
            placeholder="Name"
            value={formData.name}
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
            value={formData.uid}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="department">Department</label>
          <select
            name="department"
            id="department"
            className="form-control"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            <option value="System Programming">System Programming</option>
            <option value="Web Development">Web Development</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Programming">Programming</option>
          </select>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            className="form-control"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            className="form-control"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-4">
          <label htmlFor="role">Role</label>
          <select
            name="role"
            id="role"
            className="form-control"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="">Select Role</option>
            <option value="Faculty">Faculty</option>
            <option value="HOD">HOD</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Create User</button>
      </form>

      <hr />

      {/* Bulk User Registration */}
      <h3 className="mb-4">Bulk Register Users</h3>
      <div className="form-group mb-3">
        <label htmlFor="bulkFile">Upload Excel File</label>
        <input
          type="file"
          name="bulkFile"
          id="bulkFile"
          className="form-control"
          onChange={handleFileChange}
          accept=".xlsx, .xls"
        />
      </div>
      <button onClick={handleBulkSubmit} className="btn btn-primary">Upload and Register Users</button>

      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default CreateUser;
