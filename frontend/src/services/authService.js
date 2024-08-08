import axios from 'axios';

const API_URL = 'http://localhost:3002/api/auth';

// Login function
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// Logout function
const logout = () => {
  localStorage.removeItem('token');
};

// Admin reset password function
const adminResetPassword = async (userId, newPassword) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/admin/reset-password`,
    { userId, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// User change password function
const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/user/change-password`,
    { currentPassword, newPassword, confirmNewPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const authService = {
  login,
  logout,
  adminResetPassword,
  changePassword,
};

export default authService;
