import api from './api';

const API_URL = '/api/auth';

// Login function
const login = async (email, password) => {
  const response = await api.post(`${API_URL}/login`, { email, password });
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
  const response = await api.post(
    `${API_URL}/admin/reset-password`,
    { userId, newPassword }
  );
  return response.data;
};

// User change password function
const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
  const response = await api.post(
    `${API_URL}/user/change-password`,
    { currentPassword, newPassword, confirmNewPassword }
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
