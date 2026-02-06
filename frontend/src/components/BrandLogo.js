import React from 'react';

const BrandLogo = ({ textSize = "fs-3", lightMode = false }) => {
    return (
        <div className="d-flex align-items-center">
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
