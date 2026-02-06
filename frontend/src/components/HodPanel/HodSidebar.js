import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { FaHome, FaBook, FaChalkboardTeacher, FaCheckCircle, FaFileDownload, FaSignOutAlt } from 'react-icons/fa';
import BrandLogo from '../BrandLogo';

const HodSidebar = ({ activeTab, onLogout }) => {
    return (
        <>
            <style>
                {`
                    .sidebar-container {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.5);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
                        border-radius: 24px;
                    }
                    
                    .brand-text {
                        font-family: 'Outfit', sans-serif;
                        letter-spacing: -0.5px;
                        color: #1e293b;
                    }
                    .brand-accent {
                        color: #4f46e5;
                    }

                    .nav-link-custom {
                        color: #64748b !important; /* Slate 500 */
                        border-radius: 16px;
                        padding: 14px 20px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        font-weight: 500;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        font-family: 'Inter', sans-serif;
                        border: 1px solid transparent;
                    }

                    .nav-link-custom:hover {
                        background: #f8fafc;
                        color: #4f46e5 !important;
                        transform: translateX(4px);
                    }

                    .nav-link-custom.active {
                        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
                        color: white !important;
                        box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
                        font-weight: 600;
                        border: none;
                    }
                    
                    /* Icons inside nav */
                    .nav-link-custom svg {
                        opacity: 0.8;
                        font-size: 1.1em;
                        transition: transform 0.2s;
                    }
                    .nav-link-custom:hover svg {
                        transform: scale(1.1);
                        opacity: 1;
                    }

                    .btn-switch-view {
                        background: linear-gradient(135deg, #ec4899 0%, #fa228d 100%);
                        border: none;
                        color: white;
                        border-radius: 16px;
                        padding: 14px;
                        font-weight: 600;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
                        opacity: 0.95;
                    }
                    .btn-switch-view:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(236, 72, 153, 0.4);
                        color: white;
                        opacity: 1;
                    }

                    .btn-logout-custom {
                        background: white;
                        border: 1px solid #e2e8f0;
                        color: #64748b;
                        border-radius: 16px;
                        padding: 14px;
                        transition: all 0.2s;
                        font-weight: 500;
                    }
                    .btn-logout-custom:hover {
                        background: #fee2e2;
                        border-color: #ef4444;
                        color: #ef4444;
                    }
                `}
            </style>

            {/* Floating Sidebar Container */}
            <div className="d-flex flex-column flex-shrink-0 p-4 sidebar-container ms-3 my-3" style={{ width: '280px', height: 'calc(100vh - 32px)', overflowY: 'auto', position: 'relative' }}>
                <NavLink to="/hod/dashboard" className="d-flex align-items-center mb-5 text-decoration-none ps-2">
                    <BrandLogo textSize="fs-3" />
                    <span className="badge bg-indigo-light text-indigo ms-2 small rounded-pill" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '0.6em', verticalAlign: 'top' }}>HOD</span>
                </NavLink>

                <Nav className="flex-column mb-auto gap-2">
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/hod/dashboard"
                            className={`nav-link-custom ${activeTab === 'dashboard' ? 'active' : ''}`}
                        >
                            <FaHome className="me-3" /> Dashboard
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/hod/courses"
                            className={`nav-link-custom ${activeTab === 'courses' ? 'active' : ''}`}
                        >
                            <FaBook className="me-3" /> Courses
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/hod/faculty"
                            className={`nav-link-custom ${activeTab === 'faculty' ? 'active' : ''}`}
                        >
                            <FaChalkboardTeacher className="me-3" /> Faculty
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/hod/approvals"
                            className={`nav-link-custom ${activeTab === 'approvals' ? 'active' : ''}`}
                        >
                            <FaCheckCircle className="me-3" /> Approvals
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link
                            as={NavLink}
                            to="/hod/reports"
                            className={`nav-link-custom ${activeTab === 'reports' ? 'active' : ''}`}
                        >
                            <FaFileDownload className="me-3" /> Reports
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <div className="mt-auto d-flex flex-column gap-3">
                    <div className="align-self-center w-100 border-top border-secondary mb-3 opacity-10"></div>

                    <button className="btn btn-switch-view w-100 text-start d-flex align-items-center justify-content-center" onClick={() => window.location.href = '/faculty'}>
                        <FaChalkboardTeacher className="me-2" /> Switch to Faculty
                    </button>
                    <button className="btn btn-logout-custom w-100 text-start d-flex align-items-center justify-content-center" onClick={onLogout}>
                        <FaSignOutAlt className="me-2" /> Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default HodSidebar;
