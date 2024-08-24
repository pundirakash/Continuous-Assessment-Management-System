import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import ErrorModal from '../ErrorModal';
import '../../css/CreateQuestionModal.css';

const CreateQuestionModal = ({ assessmentId, setName, onQuestionCreated, onClose }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('MCQ');
  const [options, setOptions] = useState(['', '', '', '']);
  const [bloomLevel, setBloomLevel] = useState('L1');
  const [courseOutcome, setCourseOutcome] = useState('CO1');
  const [marks, setMarks] = useState('');
  const [image, setImage] = useState(null);
  const [solution, setSolution] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

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

    setLoading(true); // Start loading animation

    try {
      const questionData = {
        assessmentId,
        setName,
        text,
        type,
        bloomLevel,
        courseOutcome,
        marks,
        image,
        solution,
      };

      if (type === 'MCQ') {
        questionData.options = options.filter(opt => opt.trim() !== '');
      }

      await userService.createQuestion(questionData);
      alert(`Question created successfully!`);
      onQuestionCreated();

      // Reset form
      setText('');
      setType('MCQ');
      setOptions(['', '', '', '']);
      setBloomLevel('L1');
      setCourseOutcome('CO1');
      setMarks('');
      setImage(null);
      setSolution('');
    } catch (error) {
      console.error('Error creating question:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false); // Stop loading animation
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content question-create">
          <div className="modal-header">
            <h5 className="modal-title text-left">Create New Question</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label className='mb-2'>Question Text</label>
                <textarea
                  className="form-control"
                  placeholder="Enter question text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label className='mb-2'>Question Type</label>
                <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                  <option value="MCQ">MCQ</option>
                  <option value="Subjective">Subjective</option>
                </select>
              </div>
              {type === 'MCQ' && (
                <>
                  <div className="form-group">
                    <label className='mb-2'>Options</label>
                    <div className="options-container">
                      {options.map((option, index) => (
                        <div key={index} className="option-item">
                          <input
                            type="text"
                            className="form-control"
                            value={option}
                            onChange={e => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className='mb-2'>Correct Option</label>
                    <select className="form-control" value={solution} onChange={e => setSolution(e.target.value)}>
                      <option value="">Select Correct Option</option>
                      {options.map((option, index) => option.trim() !== '' && (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {type === 'Subjective' && (
                <div className="form-group">
                  <label className='mb-2'>Solution (optional)</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter solution"
                    value={solution}
                    onChange={e => setSolution(e.target.value)}
                    rows="3"
                  />
                </div>
              )}
              <div className="options-container">
              <div className="form-group">
                <label className='mb-2'>Bloom Level</label>
                <select className="form-control" value={bloomLevel} onChange={e => setBloomLevel(e.target.value)}>
                  <option value="L1: Remember">L1: Remember</option>
                  <option value="L2: Understand">L2: Understand</option>
                  <option value="L3: Apply">L3: Apply</option>
                  <option value="L4: Analyze">L4: Analyze</option>
                  <option value="L5: Evaluate">L5: Evaluate</option>
                  <option value="L6: Create">L6: Create</option>
                </select>
              </div>
              <div className="form-group">
                <label className='mb-2'>Course Outcome</label>
                <select className="form-control" value={courseOutcome} onChange={e => setCourseOutcome(e.target.value)}>
                  <option value="CO1">CO1</option>
                  <option value="CO2">CO2</option>
                  <option value="CO3">CO3</option>
                  <option value="CO4">CO4</option>
                  <option value="CO5">CO5</option>
                  <option value="CO6">CO6</option>
                </select>
              </div>
              <div className="form-group">
  <label className='mb-2'>Marks</label>
  <input
    type="number"
    className="form-control"
    placeholder="Enter marks"
    value={marks}
    min="1"
    onChange={e => setMarks(e.target.value)}
  />
</div>

              
              <div className="form-group">
  <label className="mb-2">Image (optional)</label>
  <input 
    type="file" 
    className="form-control-file" 
    accept="image/*" 
    onChange={e => setImage(e.target.files[0])} 
  />
</div>

              </div>
            </form>
            </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  {' '}Creating...
                </>
              ) : (
                'Create Question'
              )}
            </button>
          </div>
        </div>
      </div>
      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default CreateQuestionModal;