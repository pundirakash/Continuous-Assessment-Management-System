import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import CoursesList from '../components/FacultyPanel/CoursesList';
import CourseWorkspace from '../components/FacultyPanel/CourseWorkspace';
import auhtService from '../services/authService';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import ChangePasswordModal from '../components/ChangePasswordModal';
import '../css/FacultyDashboard.css';
import { FaBell, FaUserCircle, FaSignOutAlt, FaKey, FaChevronDown, FaTrophy, FaStar, FaCheckCircle, FaFileAlt, FaRocket, FaGraduationCap, FaClock } from 'react-icons/fa';
import TermSelector from '../components/TermSelector';
import { useTerm } from '../context/TermContext';
import ReviewSetModal from '../components/HodPanel/ReviewSetModal';
import BrandLogo from '../components/BrandLogo';

const FacultyDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [user, setUser] = useState({ username: '', uid: '', _id: '', department: '' });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { selectedTerm } = useTerm();

  // Coordinator Approval State
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSetForReview, setSelectedSetForReview] = useState(null);
  const [reviewContext, setReviewContext] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ username: decodedToken.user, uid: decodedToken.uid, _id: decodedToken._id, department: decodedToken.department, role: decodedToken.role });
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [notificationsData, statsData] = await Promise.all([
        userService.getNotifications(),
        userService.getFacultyStats(selectedTerm)
      ]);
      setNotifications(notificationsData);
      setStats(statsData);

      // Fetch pending approvals for coordinator
      // Even simple faculty role can be a coordinator for specific courses
      const pendingData = await userService.getPendingAssessmentSets(selectedTerm);
      setPendingApprovals(pendingData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, [selectedTerm]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    auhtService.logout();
    navigate('/login');
  };

  const handleLoading = async (operation) => {
    setLoading(true);
    await operation();
    setLoading(false);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
  };

  // Helper for greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleReviewClick = async (item) => {
    setLoading(true);
    try {
      // Fetch full set details using the HOD endpoint (accessible to Coordinators now)
      const sets = await userService.getSetsForAssessmentByHOD(item.facultyId, item.assessmentId);
      const fullSet = sets.find(s => s.setName === item.setName);

      if (fullSet) {
        setSelectedSetForReview(fullSet);
        setReviewContext({
          assessmentId: item.assessmentId,
          facultyId: item.facultyId,
          facultyName: item.facultyName
        });
        setShowReviewModal(true);
      } else {
        alert("Could not load set details.");
      }
    } catch (error) {
      console.error("Failed to load set details", error);
      alert("Error loading set details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container-light" style={{ background: '#f8fafc' }}>
      {loading && <LoadingSpinner />}

      {/* Modern Light Header */}
      <header className="dashboard-header-light d-flex align-items-center justify-content-between px-4 py-2 bg-white border-bottom sticky-top" style={{ height: '80px', zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div className="d-flex align-items-center gap-4">
          <BrandLogo textSize="fs-4" />
          <div style={{ height: '30px', width: '1px', background: '#e2e8f0' }}></div>
          <div>
            <h1 className="m-0 fs-5 fw-bold text-dark">{getGreeting()}, {user.username.split(' ')[0]}</h1>
            <span className="small text-muted fw-bold" style={{ fontSize: '0.85rem' }}>{user.department} • {user.uid}</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <TermSelector />
          <div className="bg-light px-3 py-2 rounded-3 fw-bold text-secondary small border">
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Notifications */}
          <div className="position-relative pointer" onClick={async () => {
            const newShow = !showNotifications;
            setShowNotifications(newShow);
            if (newShow && notifications.some(n => !n.read)) {
              try {
                await userService.markNotificationsRead();
                setNotifications(notifications.map(n => ({ ...n, read: true })));
              } catch (e) {
                console.error('Failed to mark read', e);
              }
            }
          }} style={{ cursor: 'pointer' }}>
            <div className="p-2 rounded-circle hover-bg-light transition-all">
              <FaBell className="text-secondary fs-5" />
            </div>
            {notifications.filter(n => !n.read && typeof n !== 'string').length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white">
                {notifications.filter(n => !n.read && typeof n !== 'string').length}
              </span>
            )}
            {showNotifications && (
              <div className="dropdown-menu-custom show">
                <div className="dropdown-body">
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => {
                      const isObj = typeof n === 'object' && n !== null;
                      const rawText = isObj ? n.message : n;
                      const createdAt = isObj ? n.createdAt : null;
                      const cleanText = rawText.replace(/Dear\s+.*?,/, '').trim();
                      let timeAgo = 'Just now';
                      if (createdAt) {
                        const seconds = Math.floor((new Date() - new Date(createdAt)) / 1000);
                        if (seconds > 86400) timeAgo = Math.floor(seconds / 86400) + "d ago";
                        else if (seconds > 3600) timeAgo = Math.floor(seconds / 3600) + "h ago";
                        else timeAgo = Math.floor(seconds / 60) + "m ago";
                      }
                      return (
                        <div key={i} className={`dropdown-item-text d-flex gap-3 align-items-start ${isObj && !n.read ? 'bg-light' : ''}`}>
                          <div className="mt-1 text-primary"><FaBell /></div>
                          <div>
                            <p className="m-0 text-dark small" style={{ lineHeight: '1.4' }}>{cleanText}</p>
                            <span className="text-xs text-muted fw-bold" style={{ fontSize: '0.7rem' }}>{timeAgo}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : <p className="text-muted p-3 m-0 small">No new notifications</p>}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 hover-bg-light cursor-pointer position-relative" onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer' }}>
            <div className="bg-light rounded-circle p-1 border">
              <FaUserCircle className="text-secondary fs-4" />
            </div>
            <FaChevronDown className="text-muted small" />
            {showUserMenu && (
              <div className="dropdown-menu-custom show">
                <div className="dropdown-item-action p-3 hover-bg-light cursor-pointer d-flex align-items-center gap-2" onClick={() => setShowChangePasswordModal(true)}>
                  <FaKey className="text-muted" /> Change Password
                </div>
                {user.role === 'HOD' && (
                  <div className="dropdown-item-action p-3 hover-bg-light cursor-pointer d-flex align-items-center gap-2" onClick={() => navigate('/hod')}>
                    <FaUserCircle className="text-primary" /> Switch to HOD Panel
                  </div>
                )}
                <div className="dropdown-item-action p-3 hover-bg-light cursor-pointer d-flex align-items-center gap-2 text-danger" onClick={() => handleLoading(handleLogout)}>
                  <FaSignOutAlt /> Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main-light pb-5 px-4 pt-4">
        {!selectedCourse ? (
          <div className="content-wrapper animate-fade-in mx-auto" style={{ maxWidth: '1400px' }}>

            {/* 🌟 Gamified Stats Section */}
            {stats && stats.gamification && (
              <div className="mb-5">
                <div className="d-flex align-items-end gap-3 mb-4">
                  <h2 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Your Impact</h2>
                  <div className="bg-white px-3 py-1 rounded-pill small text-muted border shadow-sm">
                    <FaTrophy className="text-warning me-2" />
                    Rank: <span className={`fw-bold text-uppercase ${stats.gamification.rank === 'Legend' ? 'text-warning' : 'text-primary'}`}>{stats.gamification.rank}</span>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Card 1: XP & Rank (Purple Gradient) */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 h-100 shadow position-relative overflow-hidden text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '24px' }}>
                      <div className="p-4 position-relative" style={{ zIndex: 2 }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center backdrop-blur-sm" style={{ width: 44, height: 44 }}>
                            <span style={{ fontSize: '1.4rem' }}>{stats.gamification.rankIcon}</span>
                          </div>
                          <span className="badge bg-white text-primary rounded-pill px-3 py-2 fw-bold shadow-sm">{stats.gamification.rank}</span>
                        </div>
                        <h2 className="fw-bold mb-0 display-5 text-white">{stats.gamification.xp}</h2>
                        <span className="opacity-75 small fw-bold text-uppercase tracking-wider">Total XP</span>

                        <div className="mt-4">
                          <div className="d-flex justify-content-between text-xs mb-1 opacity-90 fw-bold">
                            <span>Progress</span>
                            <span>{Math.floor(stats.gamification.progress)}%</span>
                          </div>
                          <div className="progress" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                            <div className="progress-bar bg-white" style={{ width: `${stats.gamification.progress}%`, borderRadius: '4px' }}></div>
                          </div>
                          <div className="text-xs mt-2 text-end opacity-75 fw-medium">Next Level: {stats.gamification.nextRankXP} XP</div>
                        </div>
                      </div>
                      <div className="position-absolute" style={{ top: -20, right: -20, opacity: 0.15, fontSize: '12rem', transform: 'rotate(15deg)' }}><FaTrophy /></div>
                    </div>
                  </div>

                  {/* Card 2: Question Contribution (Emerald Gradient) */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 h-100 shadow-sm position-relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: '24px' }}>
                      <div className="p-4 h-100 d-flex flex-column justify-content-between position-relative z-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="rounded-circle p-3 d-flex align-items-center justify-content-center bg-white shadow-sm text-success" style={{ width: 50, height: 50 }}>
                            <FaFileAlt className="fs-4" />
                          </div>
                          <span className="text-success small fw-bold bg-white px-2 py-1 rounded shadow-sm">+10 XP/q</span>
                        </div>
                        <div>
                          <h3 className="fw-bold mb-0 text-dark display-6">{stats.stats.totalQuestions}</h3>
                          <p className="text-success-emphasis fw-bold mb-0 small text-uppercase spacing-wide opacity-75">Questions Created</p>
                        </div>
                      </div>
                      <div className="position-absolute" style={{ bottom: -20, right: -20, opacity: 0.1, fontSize: '8rem', color: '#10b981' }}><FaFileAlt /></div>
                    </div>
                  </div>

                  {/* Card 3: Approvals (Amber Gradient) */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 h-100 shadow-sm position-relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '24px' }}>
                      <div className="p-4 h-100 d-flex flex-column justify-content-between position-relative z-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="rounded-circle p-3 d-flex align-items-center justify-content-center bg-white shadow-sm text-warning" style={{ width: 50, height: 50 }}>
                            <FaCheckCircle className="fs-4" />
                          </div>
                          <span className="text-warning small fw-bold bg-white px-2 py-1 rounded shadow-sm">+50 XP/set</span>
                        </div>
                        <div>
                          <h3 className="fw-bold mb-0 text-dark display-6">{stats.stats.approvedSets}</h3>
                          <p className="text-warning-emphasis fw-bold mb-0 small text-uppercase spacing-wide opacity-75">Sets Approved</p>
                        </div>
                      </div>
                      <div className="position-absolute" style={{ bottom: -20, right: -20, opacity: 0.1, fontSize: '8rem', color: '#f59e0b' }}><FaCheckCircle /></div>
                    </div>
                  </div>
                  {/* Card 4: Active Courses */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 h-100 shadow-sm position-relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '24px' }}>
                      <div className="p-4 h-100 d-flex flex-column justify-content-between position-relative z-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="rounded-circle p-3 d-flex align-items-center justify-content-center bg-white shadow-sm text-primary" style={{ width: 50, height: 50 }}>
                            <FaGraduationCap className="fs-4" />
                          </div>
                        </div>
                        {stats.stats.totalCourses === 0 ? (
                          <div>
                            <p className="mb-0 text-primary-emphasis fw-medium small">No active courses.</p>
                            <small className="text-secondary fw-bold text-decoration-underline" style={{ cursor: 'pointer' }}>Request one?</small>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-bold mb-0 text-dark display-6">{stats.stats.totalCourses}</h3>
                            <p className="text-primary-emphasis fw-bold mb-0 small text-uppercase spacing-wide opacity-75">Active Courses</p>
                          </div>
                        )}
                      </div>
                      <div className="position-absolute" style={{ bottom: -20, right: -20, opacity: 0.1, fontSize: '8rem', color: '#3b82f6' }}><FaGraduationCap /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coordinator Pending Approvals Section */}
            {pendingApprovals.length > 0 && (
              <div className="mb-5 animate-fade-in-up">
                <div className="d-flex align-items-center justify-content-between mb-4 mt-5">
                  <div>
                    <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Pending Approvals</h3>
                    <p className="text-muted small m-0">You are the Course Coordinator for these items.</p>
                  </div>
                  <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold shadow-sm">
                    {pendingApprovals.length} Pending
                  </span>
                </div>
                <div className="row g-4">
                  {pendingApprovals.map((item, idx) => (
                    <div className="col-md-6 col-lg-4" key={idx}>
                      <div className="card h-100 border-0 shadow-sm hover-lift" style={{ borderRadius: '15px' }}>
                        <div className="card-body p-4 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="bg-warning bg-opacity-10 text-warning px-3 py-1 rounded-pill small fw-bold text-uppercase letter-spacing-1">
                              Pending Review
                            </div>
                            <div className="text-muted small">
                              <FaClock className="me-1" /> Today
                            </div>
                          </div>

                          <h6 className="card-title fw-bold text-dark mb-1">{item.setName}</h6>
                          <div className="mb-3">
                            <div className="text-primary small fw-bold">{item.courseName}</div>
                            <div className="text-muted x-small">{item.courseCode}</div>
                          </div>

                          <div className="mt-auto">
                            <div className="d-flex align-items-center mb-3 p-2 bg-light rounded-3">
                              <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                                <span className="fw-bold text-primary small">{(item.facultyName || '?').charAt(0)}</span>
                              </div>
                              <div>
                                <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Submitted By</div>
                                <div className="fw-bold text-dark small">{item.facultyName || 'Unknown'}</div>
                              </div>
                            </div>

                            <button
                              className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm btn-sm"
                              onClick={() => handleReviewClick(item)}
                              style={{ background: 'linear-gradient(to right, #f59e0b, #ea580c)', border: 'none' }}
                            >
                              Review Set
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between mb-4 mt-5">
              <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>My Courses</h3>
              <button className="btn btn-white btn-sm rounded-pill px-3 shadow-sm border" onClick={fetchDashboardData}>Refresh List</button>
            </div>

            <div className="courses-list-wrapper bg-white p-1 rounded-4 shadow-sm border border-light overflow-hidden">
              <CoursesList onCourseSelect={handleCourseSelect} />
            </div>


          </div>


        ) : (
          <div className="h-100 animate-fade-in-up">
            <CourseWorkspace
              course={selectedCourse}
              onBack={() => {
                setSelectedCourse(null);
                fetchDashboardData(); // Refresh stats when coming back
              }}
            />
          </div>
        )}
      </main >

      {/* Modals */}
      {
        showChangePasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowChangePasswordModal(false)}
            onChangePassword={async (curr, newP, conf) => {
              try {
                await auhtService.changePassword(curr, newP, conf);
                setShowChangePasswordModal(false);
                alert('Password changed successfully');
              } catch (e) { alert('Failed to change password'); }
            }}
          />
        )
      }
      {
        showReviewModal && selectedSetForReview && reviewContext && (
          <ReviewSetModal
            show={showReviewModal}
            handleClose={() => {
              setShowReviewModal(false);
              setSelectedSetForReview(null);
              fetchDashboardData(); // Refresh list after approval
            }}
            set={selectedSetForReview}
            assessmentId={reviewContext.assessmentId}
            facultyId={reviewContext.facultyId}
            facultyName={reviewContext.facultyName}
            onRefresh={fetchDashboardData}
          />
        )
      }
    </div >
  );
};

export default FacultyDashboard;
