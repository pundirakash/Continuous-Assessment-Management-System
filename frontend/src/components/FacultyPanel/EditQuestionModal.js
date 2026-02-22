import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../css/ViewCoursesModal.css'; // Utilizing existing CSS if needed, but overriding with inline styles

const EditQuestionModal = ({ question, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...question,
    options: question.options && question.options.length > 0 ? [...question.options] : ['', '', '', ''],
    solution: question.solution || '',
    bloomLevel: question.bloomLevel || 'L1: Remember',
    courseOutcome: question.courseOutcome || 'CO1',
    marks: question.marks || '',
    type: question.type || 'MCQ'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure body scroll lock
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    // Re-initialize if question prop changes, though usually it's stable per modal open
    setFormData({
      ...question,
      options: question.options && question.options.length > 0 ? [...question.options] : ['', '', '', ''],
      solution: question.solution || '',
      bloomLevel: question.bloomLevel || 'L1: Remember',
      courseOutcome: question.courseOutcome || 'CO1',
      marks: question.marks || '',
      type: question.type || 'MCQ'
    });
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;

    // Check if the solution was this option, and update it if so? 
    // Actually, usually solution is the string value. If option text changes, solution might need update if it matched exactly.
    // However, simplest is to just update options. The user will re-select correct answer if needed.
    // Better UX: if formData.solution === oldOptionValue, update solution too.
    const oldOptionValue = formData.options[index];
    let newSolution = formData.solution;
    if (newSolution === oldOptionValue) {
      newSolution = value;
    }

    setFormData((prevState) => ({
      ...prevState,
      options: newOptions,
      solution: newSolution
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.text || !formData.text.trim()) {
      alert("Please enter a Question Statement.");
      return;
    }

    if (!formData.marks || isNaN(formData.marks) || formData.marks <= 0) {
      alert("Please enter a valid number of marks.");
      return;
    }

    if (formData.type === 'MCQ' && formData.options.some(opt => !opt.trim())) {
      alert("Please fill all options for MCQ");
      return;
    }

    const updatedFormData = {
      ...formData,
      options: formData.type === 'MCQ' ? formData.options.filter((option) => option.trim() !== '') : [],
    };

    // Simulate loading for UI feel
    setLoading(true);
    setTimeout(() => {
      onSave(updatedFormData);
      setLoading(false);
    }, 300);
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
            <h5 className="m-0 fw-bold">Edit Question</h5>
            <p className="m-0 small opacity-75">Modify question details</p>
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
              name="text"
              value={formData.text}
              onChange={handleChange}
              style={{ fontSize: '1rem' }}
            />
          </div>

          {/* Grid for Parameters */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Type</label>
              <select className="form-select border-light fw-medium bg-light" name="type" value={formData.type} disabled style={{ backgroundColor: '#f8f9fa' }}>
                <option value="MCQ">Multiple Choice</option>
                <option value="Subjective">Subjective / Theory</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Marks</label>
              <input type="number" className="form-control border-light bg-light fw-medium" placeholder="Ex: 5" name="marks" value={formData.marks} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary text-xs text-uppercase">Bloom's Level</label>
              <select className="form-select border-light fw-medium" name="bloomLevel" value={formData.bloomLevel} onChange={handleChange} style={{ backgroundColor: '#ffffff' }}>
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
              <select className="form-select border-light fw-medium" name="courseOutcome" value={formData.courseOutcome} onChange={handleChange} style={{ backgroundColor: '#ffffff' }}>
                {['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'].map(co => <option key={co} value={co} style={{ backgroundColor: '#ffffff' }}>{co}</option>)}
              </select>
            </div>
          </div>

          {/* MCQ Options Section */}
          {formData.type === 'MCQ' && (
            <div className="bg-light p-4 rounded-3 mb-4 border border-light">
              <label className="form-label fw-bold text-dark mb-3">Answer Options</label>
              <div className="d-flex flex-column gap-3">
                {formData.options.map((opt, idx) => (
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
                        name="solution"
                        checked={formData.solution === opt && opt !== ''}
                        onChange={() => setFormData(prev => ({ ...prev, solution: opt }))}
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
          {formData.type === 'Subjective' && (
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small text-uppercase">Model Answer / Key Points</label>
              <textarea
                className="form-control bg-light border-0"
                rows="4"
                placeholder="Enter the expected answer key..."
                name="solution"
                value={formData.solution}
                onChange={handleChange}
              />
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-light border-top d-flex justify-content-end gap-3">
          <button className="btn btn-white border px-4 fw-bold" onClick={onClose}>Cancel</button>
          <button
            className="btn text-white px-5 fw-bold shadow-sm"
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

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

export default EditQuestionModal;
