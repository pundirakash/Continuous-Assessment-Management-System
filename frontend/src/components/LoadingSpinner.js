import React from 'react';

const LoadingSpinner = () => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ height: '100px', width: '100%', position: 'absolute', top: 0, left: 0 }}
  >
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default LoadingSpinner;
