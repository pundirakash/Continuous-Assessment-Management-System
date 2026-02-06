import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import HodDashboard from './pages/HodDashboard'; // Keeping for reference/fallback if needed
import HodLayout from './components/HodPanel/HodLayout';
import HodHome from './pages/HodHome';
import HodCourses from './pages/HodCourses';
import HodFaculty from './pages/HodFaculty';
import HodApprovals from './pages/HodApprovals';
import HodReports from './pages/HodReports';
import PrivateRoute from './utils/PrivateRoute';
import RoleSelection from './pages/RoleSelection';
import Footer from './components/Footer';
import NetworkStatusModal from './components/NetworkStatusModal'; // Import the new modal
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import { TermProvider } from './context/TermContext';

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Handler for network changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up the event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <NetworkStatusModal show={isOffline} handleClose={() => setIsOffline(false)} />
      <TermProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute role="Admin">
                <AdminDashboard />
                <Footer />
              </PrivateRoute>
            }
          />
          <Route
            path="/faculty"
            element={
              <PrivateRoute role="Faculty">
                <FacultyDashboard />
                <Footer />
              </PrivateRoute>
            }
          />
          <Route
            path="/hod"
            element={
              <PrivateRoute role="HOD">
                <HodLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HodHome />} />
            <Route path="courses" element={<HodCourses />} />
            <Route path="faculty" element={<HodFaculty />} />
            <Route path="approvals" element={<HodApprovals />} />
            <Route path="reports" element={<HodReports />} />
          </Route>
          <Route
            path="/role-selection"
            element={
              <PrivateRoute role="HOD">
                <RoleSelection />
                <Footer />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </TermProvider>
    </Router>
  );
}

export default App;
