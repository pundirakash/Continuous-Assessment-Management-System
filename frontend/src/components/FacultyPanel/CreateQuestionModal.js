import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';
// import '../../css/CreateQuestionModal.css'; // Utilizing inline styles & bootstrap for consistency

const CreateQuestionModal = ({ assessmentId, setName, assessmentType, onQuestionCreated, onClose }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState(assessmentType || 'MCQ');
  const [options, setOptions] = useState(['', '', '', '']);
  const [bloomLevel, setBloomLevel] = useState('L1: Remember');
  const [courseOutcome, setCourseOutcome] = useState('CO1');
  const [marks, setMarks] = useState('');
  const [image, setImage] = useState(null);
  const [solution, setSolution] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (type === 'Subjective') {
      setOptions([]);
      setSolution('');
    } else {
      setOptions(['', '', '', '']);
      setSolution('');
    }
  }, [type]);

  const handleCreate = async () => {
    if (!bloomLevel || !courseOutcome) {
      alert('Please select a Bloom Level and a Course Outcome.');
      return;
    }

    if (type === 'MCQ' && !solution) {
      alert('Please select the correct option for MCQ.');
      return;
    }

    // Basic validation for empty options if MCQ
    if (type === 'MCQ' && options.some(opt => !opt.trim())) {
      alert('Please fill all 4 options for MCQ');
      return;
    }

    setLoading(true);

    try {
      const questionData = {
        assessmentId,
        setName,
        text,
        type,
        bloomLevel: bloomLevel.split(':')[0].trim(), // Extract L1, etc if needed by backend, or send full string. Keeping logical 
        courseOutcome,
        marks,
        image,
        solution,
      };

      if (type === 'MCQ') {
        questionData.options = options.filter(opt => opt.trim() !== '');
      }

      await userService.createQuestion(questionData);

      // Success Notification could be better than alert, but alert for now
      // alert(`Question created successfully!`); 
      onQuestionCreated(); // This should trigger refresh in parent
      onClose(); // Close modal immediately on success

    } catch (error) {
      console.error('Error creating question:', error);
      setError(error.response?.data?.message || error.message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 1050 }}>

      <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column"
        style={{
          width: '800px',
          maxHeight: '90vh',
          animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}>

        {/* Modern Header */}
        <div className="p-4 text-white d-flex align-items-center justify-content-between"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div>
            <h5 className="m-0 fw-bold">Add New Question</h5>
            <p className="m-0 small opacity-75">Assessment: {setName}</p>
          </div>
          <button onClick={onClose} className="btn-close btn-close-white opacity-100"></button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-auto custom-scrollbar" style={{ flex: 1 }}>

          {/* Question Text */}
          <div className="mb-4">
            <label className="form-label fw-bold text-secondary small text-uppercase spacing-wide">Question Statement</label>
            <textarea
              className="form-control form-control-lg bg-light border-0"
              placeholder="Type your question here..."
              rows="3"
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ fontSize: '1rem' }}
            />
          </div>

          {/* Grid for Parameters */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Type</label>
              <select className="form-select border-light fw-medium bg-light" value={type} disabled style={{ backgroundColor: '#f8f9fa' }}>
                <option value="MCQ">Multiple Choice</option>
                <option value="Subjective">Subjective / Theory</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Marks</label>
              <input type="number" className="form-control border-light bg-light fw-medium" placeholder="Ex: 5" value={marks} onChange={e => setMarks(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Bloom's Level</label>
              <select className="form-select border-light fw-medium" value={bloomLevel} onChange={e => setBloomLevel(e.target.value)} style={{ backgroundColor: '#ffffff' }}>
                <option value="L1: Remember" style={{ backgroundColor: '#ffffff' }}>L1: Remember</option>
                <option value="L2: Understand" style={{ backgroundColor: '#ffffff' }}>L2: Understand</option>
                <option value="L3: Apply" style={{ backgroundColor: '#ffffff' }}>L3: Apply</option>
                <option value="L4: Analyze" style={{ backgroundColor: '#ffffff' }}>L4: Analyze</option>
                <option value="L5: Evaluate" style={{ backgroundColor: '#ffffff' }}>L5: Evaluate</option>
                <option value="L6: Create" style={{ backgroundColor: '#ffffff' }}>L6: Create</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Course Outcome</label>
              <select className="form-select border-light fw-medium" value={courseOutcome} onChange={e => setCourseOutcome(e.target.value)} style={{ backgroundColor: '#ffffff' }}>
                {['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'].map(co => <option key={co} value={co} style={{ backgroundColor: '#ffffff' }}>{co}</option>)}
              </select>
            </div>
          </div>

          {/* MCQ Options Section */}
          {type === 'MCQ' && (
            <div className="bg-light p-4 rounded-3 mb-4 border border-light">
              <label className="form-label fw-bold text-dark mb-3">Answer Options</label>
              <div className="d-flex flex-column gap-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="input-group">
                    <span className="input-group-text bg-white border-0 fw-bold text-muted" style={{ width: '40px' }}>{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                    />
                    <div className="input-group-text bg-white border-0">
                      <input
                        className="form-check-input mt-0 cursor-pointer"
                        type="radio"
                        name="correctOption"
                        checked={solution === opt && opt !== ''}
                        onChange={() => setSolution(opt)}
                        disabled={!opt}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-text mt-2 text-end">Select the radio button next to the correct answer.</div>
            </div>
          )}

          {/* Subjective Solution */}
          {type === 'Subjective' && (
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small text-uppercase">Model Answer / Key Points</label>
              <textarea
                className="form-control bg-light border-0"
                rows="4"
                placeholder="Enter the expected answer key..."
                value={solution}
                onChange={e => setSolution(e.target.value)}
              />
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="form-label fw-bold text-secondary small text-uppercase">Reference Image (Optional)</label>
            <input type="file" className="form-control" accept="image/*" onChange={e => setImage(e.target.files[0])} />
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-light border-top d-flex justify-content-end gap-3">
          <button className="btn btn-white border px-4 fw-bold" onClick={onClose}>Cancel</button>
          <button
            className="btn text-white px-5 fw-bold shadow-sm"
            onClick={handleCreate}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            {loading ? 'Creating...' : 'Add Question'}
          </button>
        </div>
      </div>

      {showErrorModal && <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />}

      <style>{`
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default CreateQuestionModal;