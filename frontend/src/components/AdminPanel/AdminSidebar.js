import React from 'react';
import { FaUserGraduate, FaBuilding, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';

import BrandLogo from '../BrandLogo';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout }) => {
    return (
        <div className="admin-sidebar-modern">
            <a href="/admin" className="admin-brand d-flex flex-column align-items-center gap-2 py-3 text-decoration-none">
                <BrandLogo textSize="fs-4" lightMode={true} />
                <span className="small text-white-50 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.65rem' }}>Admin Console</span>
            </a>

            <div className="flex-grow-1 mt-4">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                >
                    <FaUserGraduate size={18} />
                    <span>User Management</span>
                </button>

                <button
                    onClick={() => setActiveTab('departments')}
                    className={`admin-nav-item ${activeTab === 'departments' ? 'active' : ''}`}
                >
                    <FaBuilding size={18} />
                    <span>Departments</span>
                </button>

                <button
                    onClick={() => setActiveTab('terms')}
                    className={`admin-nav-item ${activeTab === 'terms' ? 'active' : ''}`}
                >
                    <FaCalendarAlt size={18} />
                    <span>Term Management</span>
                </button>

                <button
                    onClick={() => setActiveTab('organization')}
                    className={`admin-nav-item ${activeTab === 'organization' ? 'active' : ''}`}
                >
                    <FaBuilding size={18} />
                    <span>Organization</span>
                </button>
            </div>

            <div className="pt-4 border-top border-secondary border-opacity-25">
                <button
                    className="admin-nav-item w-100 text-danger border-0 bg-transparent"
                    onClick={onLogout}
                    style={{ transition: 'all 0.3s' }}
                >
                    <FaSignOutAlt size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
