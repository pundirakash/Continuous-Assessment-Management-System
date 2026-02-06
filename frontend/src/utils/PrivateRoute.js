import React from 'react';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decodedToken = jwtDecode(token);
  const user = decodedToken;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role && !(role === 'Faculty' && (user.role === 'HOD' || user.role === 'CourseCoordinator'))) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
