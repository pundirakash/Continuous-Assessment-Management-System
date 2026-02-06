import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import HodSidebar from './HodSidebar';
import authService from '../../services/authService';

import Footer from '../Footer';

const HodLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
            <HodSidebar activeTab={activeTab} onLogout={handleLogout} />
            <div className="flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
                <div className="flex-grow-1 overflow-auto custom-scrollbar" style={{ position: 'relative' }}>
                    <div className="d-flex flex-column" style={{ minHeight: '100%' }}>
                        <div className="flex-grow-1">
                            <Outlet context={{ setActiveTab }} />
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HodLayout;
