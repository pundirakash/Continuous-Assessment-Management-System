import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaBook, FaChalkboardTeacher, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import TermSelector from '../components/TermSelector';
import { useTerm } from '../context/TermContext';
import userService from '../services/userService';

const HodHome = () => {
    const { setActiveTab } = useOutletContext();
    const [user, setUser] = useState({ username: '', department: '' });
    const { selectedTerm } = useTerm();

    // Stats State
    const [stats, setStats] = useState({
        courseCount: 0,
        facultyCount: 0,
        pendingCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setActiveTab('dashboard');
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setUser({ username: decoded.user, department: decoded.department });
        }
    }, [setActiveTab]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedTerm) return;
            setLoading(true);
            try {
                const [courses, faculties, pendingSets] = await Promise.all([
                    userService.getCoursesByDepartment(selectedTerm),
                    userService.getFacultiesByDepartment(),
                    userService.getPendingAssessmentSets(selectedTerm)
                ]);

                // Calculate total pending questions across all sets
                // If pendingSets is array of sets, how many questions? 
                // Usually the list itself is the count of pending items or we just count the sets.
                // Let's assume pendingSets.length is the number of pending "items" (sets) requiring action.
                setStats({
                    courseCount: courses.length,
                    facultyCount: faculties.length,
                    pendingCount: pendingSets.length
                });
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedTerm]);

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Welcome back, {user.username} 👋</h2>
                    <p className="text-secondary mb-0">{user.department} Department</p>
                </div>
                <div>
                    <TermSelector />
                </div>
            </div>

            <div className="row g-4 mb-5">
                {/* Active Courses */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '20px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-muted text-uppercase fw-bold mb-2 small tracking-wider">Active Courses</h6>
                                <h2 className="display-4 fw-bold mb-0 text-dark">{loading ? '...' : stats.courseCount}</h2>
                            </div>
                            <div className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5' }}>
                                <FaBook className="fs-4" />
                            </div>
                        </div>
                        <Link to="/hod/courses" className="mt-4 d-inline-block text-decoration-none small fw-bold stretched-link" style={{ color: '#4f46e5' }}>View Details &rarr;</Link>
                    </div>
                </div>

                {/* Total Faculty */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '20px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-muted text-uppercase fw-bold mb-2 small tracking-wider">Total Faculty</h6>
                                <h2 className="display-4 fw-bold mb-0 text-dark">{loading ? '...' : stats.facultyCount}</h2>
                            </div>
                            <div className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', color: '#db2777' }}>
                                <FaChalkboardTeacher className="fs-4" />
                            </div>
                        </div>
                        <Link to="/hod/faculty" className="mt-4 d-inline-block text-decoration-none small fw-bold stretched-link" style={{ color: '#db2777' }}>Manage Faculty &rarr;</Link>
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '20px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-muted text-uppercase fw-bold mb-2 small tracking-wider">Pending Approvals</h6>
                                <h2 className="display-4 fw-bold mb-0 text-dark">{loading ? '...' : stats.pendingCount}</h2>
                            </div>
                            <div className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', color: '#ea580c' }}>
                                <FaExclamationCircle className="fs-4" />
                            </div>
                        </div>
                        <Link to="/hod/approvals" className="mt-4 d-inline-block text-decoration-none small fw-bold stretched-link" style={{ color: '#ea580c' }}>Review Now &rarr;</Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className='row'>
                <div className='col-12'>
                    <div className='card border-0 shadow-sm p-4 bg-white' style={{ borderRadius: '20px' }}>
                        <h5 className='fw-bold mb-4 text-dark'>Quick Actions</h5>
                        <div className='d-flex gap-3'>
                            <Link to="/hod/reports" className='btn btn-outline-primary rounded-pill px-4 py-2 fw-medium d-flex align-items-center gap-2'>
                                <FaCheckCircle /> Master Downloader
                            </Link>
                            <Link to="/hod/courses" className='btn btn-outline-secondary rounded-pill px-4 py-2 fw-medium d-flex align-items-center gap-2'>
                                Assign Course
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HodHome;
