import React from 'react';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, role }) => {
  
  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const user=decodedToken;
  console.log(user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
