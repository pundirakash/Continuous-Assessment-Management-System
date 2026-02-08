import React from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const BrandLogo = ({ textSize = "fs-3", lightMode = false }) => {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // NORMALIZATION: Handle potential undefined role and ensure lowercase comparison
                const role = decoded.role ? decoded.role.toLowerCase().trim() : '';

                // DEBUG: Help diagnose if it fails again
                console.log(`[BrandLogo] Navigation Attempt - Role: "${role}" (Original: "${decoded.role}")`);

                switch (role) {
                    case 'admin':
                    case 'manager':
                        navigate('/admin');
                        break;

                    case 'hod':
                    case 'head of department':
                        navigate('/hod');
                        break;

                    // CASE: Faculty (Standard)
                    case 'faculty':
                        navigate('/faculty');
                        break;

                    // CASE: Course Coordinator (Handles space and underscore)
                    case 'course coordinator':
                    case 'course_coordinator':
                        // Course Coordinators in this system share the HOD layout/permissions
                        navigate('/hod');
                        break;

                    default:
                        console.warn("[BrandLogo] Unrecognized role, defaulting to home.");
                        navigate('/');
                }
            } catch (error) {
                console.error("[BrandLogo] Invalid token during navigation", error);
                navigate('/');
            }
        } else {
            console.log("[BrandLogo] No token found, going to public home.");
            navigate('/');
        }
    };

    return (
        <div
            className="d-flex align-items-center cursor-pointer user-select-none"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
            title="Go to Dashboard"
        >
            {/* Import fonts specifically for the logo availability */}
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Syne:wght@400;500;600;700;800&display=swap');
          .brand-hindi { font-family: 'Rozha One', serif; }
          .brand-english { font-family: 'Syne', sans-serif; }
        `}
            </style>
            <span className={`brand-hindi ${textSize} ${lightMode ? 'text-white-50' : 'text-dark'} me-1`}>प्रश्न</span>
            <span className={`brand-english ${textSize} fw-bold ${lightMode ? 'text-white' : 'text-primary'}`}>Mitra</span>
        </div>
    );
};

export default BrandLogo;
