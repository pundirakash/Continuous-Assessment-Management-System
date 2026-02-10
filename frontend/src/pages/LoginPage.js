
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaArrowRight, FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';
import Footer from '../components/Footer';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Input Sanitization: Trim whitespace
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/login`, {
        email: trimmedEmail,
        password: trimmedPassword
      });
      localStorage.setItem('token', response.data.token);
      const decodedToken = jwtDecode(response.data.token);
      const role = decodedToken.role;

      if (role === 'Admin') navigate('/admin');
      else if (role === 'Faculty' || role === 'CourseCoordinator') navigate('/faculty');
      else if (role === 'HOD') navigate('/hod');
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        // Specific credential error
        setError('Invalid credentials. Please check your email and password.');
      } else {
        // Server or Network error - Do NOT say invalid credentials
        setError('Temporary connection issue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      <style>
        {`
@import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Syne:wght@400;500;600;700;800&display=swap');

.brand-hindi {
  font-family: 'Rozha One', serif;
  color: #1a1a1a;
}
.brand-english {
  font-family: 'Syne', sans-serif;
  color: #4f46e5;
}
.hero-innovative {
  background-color: #0f172a;
  background-image: 
    radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
    radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
    radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
  position: relative;
  overflow: hidden;
}
.organic-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: morph 15s ease-in-out infinite;
}
@keyframes morph {
  0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  50% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
  100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
}
.login-input {
  background: #f1f5f9;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.login-input:focus {
  background: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}
`}
      </style>

      <div className="row g-0 flex-grow-1">
        {/* LEFT: Branding & Artistic Area */}
        <div className="col-lg-7 d-none d-lg-flex flex-column hero-innovative p-5 text-white position-relative justify-content-between">
          {/* Animated Background Shapes */}
          <div className="organic-shape" style={{ width: '600px', height: '600px', top: '-10%', right: '-10%' }}></div>
          <div className="organic-shape" style={{ width: '400px', height: '400px', bottom: '10%', left: '10%', animationDelay: '-5s' }}></div>

          {/* Content */}
          <div className="position-relative z-2 mt-4 ms-4">
            <div className="display-1 fw-bold lh-1 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="brand-hindi d-block fs-1 mb-2 text-white-50">प्रश्न</span>
              <span className="text-white">Mitra</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white text-dark px-3 py-1 rounded-pill fw-bold small text-uppercase tracking-wider">
                V 2.0
              </div>
              <span className="text-white-75 fw-light">Official Faculty Portal</span>
            </div>
          </div>

          <div className="position-relative z-2 ms-4 mb-5" style={{ maxWidth: '480px' }}>
            <h2 className="h1 fw-light mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Where tradition meets <br />
              <span className="fw-bold text-white">Academic Integrity.</span>
            </h2>
            <p className="lead text-white-75 fw-light mb-4">
              A seamless ecosystem for question banking, paper generation, and faculty collaboration. Designed for the modern academic landscape.
            </p>
            <div className="d-flex gap-3">
              <a href="mailto:pundirakash@outlook.com" className="btn btn-outline-light rounded-pill px-4 py-2 small fw-bold text-uppercase tracking-wider hover-scale">
                Partner with Us
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT: Login Interface */}
        <div className="col-lg-5 d-flex flex-column bg-white p-5 position-relative">
          <div className="w-100 mx-auto" style={{ maxWidth: '420px', marginTop: '10vh' }}>

            {/* Mobile Header */}
            <div className="d-lg-none mb-5 text-center">
              <h1 className="display-4 fw-bold mb-0">
                <span className="brand-hindi">प्रश्न</span>
                <span className="brand-english text-primary">Mitra</span>
              </h1>
            </div>

            <div className="mb-5">
              <h3 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Sign In</h3>
              <p className="text-muted">Enter your university credentials to access the workspace.</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger rounded-3 mb-4 d-flex align-items-center">
                <FaExclamationCircle className="me-2" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase tracking-wider">Email</label>
                <div className="position-relative">
                  <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="email"
                    className="form-control login-input ps-5"
                    placeholder="academic@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-bold text-muted text-uppercase tracking-wider">Password</label>
                  {/* Recovery option removed */}
                </div>
                <div className="position-relative">
                  <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="password"
                    className="form-control login-input ps-5"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-dark w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
                style={{ transition: 'transform 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {loading ? 'Validating...' : <>Access Workspace <FaArrowRight /></>}
              </button>
            </form>
          </div>

          <div className="mt-auto pt-5">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

