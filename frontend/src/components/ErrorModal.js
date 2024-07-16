const ErrorModal = ({ message, onClose }) => (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Error</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
  
export default ErrorModal;