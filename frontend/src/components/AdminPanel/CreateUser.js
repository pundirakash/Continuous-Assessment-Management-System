import React, { useState } from 'react';
import axios from 'axios';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    department: '',
    email: '',
    password: '',
    role: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3002/api/admin/register', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user', error);
    }
  };

  return (
    <div>
      <h3 className="mb-4">Create User</h3>
      <form onSubmit={handleSubmit}>
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
    </div>
  );
};

export default CreateUser;
