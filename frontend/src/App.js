import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import HodDashboard from './pages/HodDashboard';
import PrivateRoute from './utils/PrivateRoute';
import RoleSelection from './pages/RoleSelection';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/admin" 
          element={
            <PrivateRoute role="Admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/faculty" 
          element={
            <PrivateRoute role="Faculty">
              <FacultyDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/hod" 
          element={
            <PrivateRoute role="HOD">
              <HodDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/role-selection" 
          element={
            <PrivateRoute role="HOD">
              <RoleSelection />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
