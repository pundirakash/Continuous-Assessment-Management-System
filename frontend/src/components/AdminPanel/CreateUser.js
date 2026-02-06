import React, { useState, useEffect } from 'react';

import * as XLSX from 'xlsx';
import ErrorModal from '../ErrorModal';
import userService from '../../services/userService';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    department: '',
    departmentId: '',
    schoolId: '',
    universityId: '',
    email: '',
    password: '',
    role: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [organization, setOrganization] = useState({ university: '', schools: [] });
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const data = await userService.getOrganization();
      setOrganization(data);
    } catch (err) {
      console.error("Failed to fetch organization", err);
    }
  };

  const handleSchoolChange = (e) => {
    const schoolName = e.target.value;
    const school = organization.schools.find(s => s.name === schoolName);
    setSelectedSchool(school);
    setDepartments(school ? school.departments : []);
    setFormData({
      ...formData,
      schoolId: school?.id || '',
      department: '',
      departmentId: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      // We set both the string name (legacy) and the ID
      setFormData({
        ...formData,
        [name]: value,
        departmentId: value // For now, the backend might be expecting the name string in the department field
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.register(formData);
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

      try {
        await userService.bulkRegister(users);
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
    <div className="admin-content-fade">
      <div className="admin-card border-0 shadow-sm mb-4 overflow-hidden">
        <div className="admin-card-header bg-white py-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary">
              <i className="bi bi-person-plus-fill fs-5"></i>
            </div>
            <h5 className="admin-card-title fw-bold mb-0">Create Single User</h5>
          </div>
        </div>
        <div className="admin-card-body p-4">
          <form onSubmit={handleSingleSubmit}>
            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Full Name</label>
                <input type="text" name="name" className="form-control border-0 bg-light rounded-3 py-2 px-3 fw-medium" placeholder="Name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">University ID (UID)</label>
                <input type="text" name="uid" className="form-control border-0 bg-light rounded-3 py-2 px-3 fw-medium" placeholder="UID" value={formData.uid} onChange={handleChange} required />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">School</label>
                <select name="school" className="form-select border-0 bg-light rounded-3 py-2 px-3 fw-medium" onChange={handleSchoolChange} required>
                  <option value="">Select School</option>
                  {organization.schools.map((school) => (
                    <option key={school.name} value={school.name}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Department</label>
                <select
                  name="department"
                  className="form-select border-0 bg-light rounded-3 py-2 px-3 fw-medium"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!selectedSchool}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Email Address</label>
                <input type="email" name="email" className="form-control border-0 bg-light rounded-3 py-2 px-3 fw-medium" placeholder="Email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Initial Password</label>
                <input type="password" name="password" className="form-control border-0 bg-light rounded-3 py-2 px-3 fw-medium" placeholder="Password" value={formData.password} onChange={handleChange} required />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Access Role</label>
              <select name="role" className="form-select border-0 bg-light rounded-3 py-2 px-3 fw-medium" value={formData.role} onChange={handleChange} required>
                <option value="">Select Role</option>
                <option value="Faculty">Faculty</option>
                <option value="HOD">HOD</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm">
              <i className="bi bi-person-check-fill me-2"></i> Register User
            </button>
          </form>
        </div>
      </div>

      <div className="admin-card border-0 shadow-sm overflow-hidden">
        <div className="admin-card-header bg-white py-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-success bg-opacity-10 rounded-3 text-success">
              <i className="bi bi-file-earmark-excel-fill fs-5"></i>
            </div>
            <h5 className="admin-card-title fw-bold mb-0">Bulk Registration</h5>
          </div>
        </div>
        <div className="admin-card-body p-4">
          <div className="mb-4">
            <label className="form-label x-small fw-bold text-uppercase text-muted ls-1">Upload Data Sheet (.xlsx)</label>
            <div className="p-4 border-2 border-dashed border-light rounded-4 text-center bg-light bg-opacity-50">
              <input
                type="file"
                name="bulkFile"
                id="bulkFile"
                className="form-control d-none"
                onChange={handleFileChange}
                accept=".xlsx, .xls"
              />
              <label htmlFor="bulkFile" className="cursor-pointer">
                <div className="p-3 bg-white rounded-circle shadow-sm text-primary mb-3 mx-auto" style={{ width: 'fit-content' }}>
                  <i className="bi bi-cloud-arrow-up-fill fs-3"></i>
                </div>
                <p className="mb-1 fw-bold text-dark">{file ? file.name : 'Click to Browse Files'}</p>
                <p className="x-small text-muted mb-0">Excel worksheets formatted with column headers</p>
              </label>
            </div>
          </div>
          <button onClick={handleBulkSubmit} className="btn btn-success w-100 py-3 fw-bold shadow-sm" disabled={!file || loading}>
            <i className="bi bi-check-all me-2"></i> Process and Register
          </button>
        </div>
      </div>

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
