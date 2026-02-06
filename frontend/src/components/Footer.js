import React from 'react';

import BrandLogo from './BrandLogo';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-3">
      <div className="container d-flex justify-content-center align-items-center gap-2">
        <span className="text-muted small">&copy; {currentYear}</span>
        <div style={{ transform: 'scale(0.8)' }}>
          <BrandLogo textSize="fs-6" />
        </div>
        <span className="text-muted small">Made for Academic Excellence.</span>
      </div>
    </footer>
  );
}

export default Footer;
