import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleSelection = (path) => {
    navigate(path);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="card shadow-lg p-3 mb-5 bg-white rounded" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body text-center">
          <h1 className="card-title">Welcome!</h1>
          <h2 className="card-subtitle mb-4 text-muted">Kindly Choose the Dashboard</h2>
          <button className="btn btn-primary btn-lg btn-block me-3" onClick={() => handleSelection('/hod')}>
            HOD Dashboard
          </button>
          <button className="btn btn-secondary btn-lg btn-block" onClick={() => handleSelection('/faculty')}>
            Faculty Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
