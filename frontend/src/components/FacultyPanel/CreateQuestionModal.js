import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const CreateQuestionModal = ({ assessmentId, setName, onQuestionCreated, onClose }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('MCQ');
  const [options, setOptions] = useState(['', '', '', '']); // Start with 4 empty options for MCQ
  const [bloomLevel, setBloomLevel] = useState('L1'); // Default to L1
  const [courseOutcome, setCourseOutcome] = useState('CO1'); // Default to CO1
  const [marks, setMarks] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (type === 'Theory') {
      setOptions([]);
    } else {
      setOptions(['', '', '', '']);
    }
  }, [type]);

  const handleCreate = async () => {
    if (!bloomLevel || !courseOutcome) {
      alert('Please select a Bloom Level and a Course Outcome.');
      return;
    }

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
      };

      if (type === 'MCQ') {
        questionData.options = options.filter(opt => opt.trim() !== ''); // Filter out empty or whitespace options for MCQ
      }

      await userService.createQuestion(questionData);
      onQuestionCreated();

      setText('');
      setType('MCQ');
      setOptions(['', '', '', '']);
      setBloomLevel('L1');
      setCourseOutcome('CO1');
      setMarks('');
      setImage(null);
    } catch (error) {
      console.error('Error creating question', error);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Question</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label>Question Text</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter question text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Question Type</label>
                <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                  <option value="MCQ">MCQ</option>
                  <option value="Theory">Theory</option>
                </select>
              </div>
              {type === 'MCQ' && (
                <>
                  {options.map((option, index) => (
                    <div className="form-group" key={index}>
                      <label>Option {index + 1}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={option}
                        onChange={e => handleOptionChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </>
              )}
              <div className="form-group">
                <label>Bloom Level</label>
                <select className="form-control" value={bloomLevel} onChange={e => setBloomLevel(e.target.value)}>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                  <option value="L4">L4</option>
                  <option value="L5">L5</option>
                  <option value="L6">L6</option>
                </select>
              </div>
              <div className="form-group">
                <label>Course Outcome</label>
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
                <label>Marks</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter marks"
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Image (optional)</label>
                <input type="file" className="form-control-file" onChange={e => setImage(e.target.files[0])} />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreate}>
              Create Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionModal;
