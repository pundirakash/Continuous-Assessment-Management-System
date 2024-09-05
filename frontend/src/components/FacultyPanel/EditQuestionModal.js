import React, { useState, useEffect } from 'react';
import '../../css/ViewCoursesModal.css'

const EditQuestionModal = ({ question, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...question,
    options: question.options ? [...question.options] : ['', '', '', ''],
    solution: question.solution || '',
  });

  useEffect(() => {
    setFormData({
      ...question,
      options: question.options ? [...question.options] : ['', '', '', ''],
      solution: question.solution || '',
    });
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleTypeChange = (e) => {
    const { value } = e.target;
    if (value === 'MCQ') {
      setFormData((prevState) => ({
        ...prevState,
        type: value,
        options: prevState.options.length > 0 ? prevState.options : ['', '', '', ''],
        solution: prevState.options.includes(prevState.solution) ? prevState.solution : '',
      }));
    } else if (value === 'Subjective') {
      setFormData((prevState) => ({
        ...prevState,
        type: value,
        options: [],
        solution: '', // Reset solution for subjective type
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        type: value,
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prevState) => ({
      ...prevState,
      options: newOptions,
      solution: newOptions.includes(prevState.solution) ? prevState.solution : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedFormData = {
      ...formData,
      options: formData.options.filter((option) => option.trim() !== ''),
    };
    onSave(updatedFormData);
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content custom-modal">
          <div className="modal-header">
            <h5 className="modal-title text-left">Edit Question</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="text">Question Text:</label>
                <input
                  type="text"
                  className="form-control"
                  id="text"
                  name="text"
                  value={formData.text}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type:</label>
                <select
                  className="form-control"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleTypeChange}
                  required
                >
                  <option value="MCQ">MCQ</option>
                  <option value="Subjective">Subjective</option>
                </select>
              </div>

              {formData.type === 'MCQ' && (
                <>
                  <div>
                    <h4>Options</h4>
                    {formData.options.map((option, index) => (
                      <div key={index} className="form-group">
                        <label htmlFor={`option${index}`}>Option {index + 1}</label>
                        <input
                          type="text"
                          className="form-control"
                          id={`option${index}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label htmlFor="solution">Correct Option:</label>
                    <select
                      className="form-control"
                      id="solution"
                      name="solution"
                      value={formData.solution}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Correct Option</option>
                      {formData.options.map(
                        (option, index) => option.trim() !== '' && <option key={index} value={option}>{option}</option>
                      )}
                    </select>
                  </div>
                </>
              )}

              {formData.type === 'Subjective' && (
                <div className="form-group">
                  <label htmlFor="solution">Solution (optional):</label>
                  <textarea
                    className="form-control"
                    id="solution"
                    name="solution"
                    value={formData.solution}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              )}
              
              <div className="options-container">
                <div className="form-group">
                  <label htmlFor="bloomLevel">Bloom Level:</label>
                  <select
                    className="form-control"
                    id="bloomLevel"
                    name="bloomLevel"
                    value={formData.bloomLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="L1: Remember">L1: Remember</option>
                    <option value="L2: Understand">L2: Understand</option>
                    <option value="L3: Apply">L3: Apply</option>
                    <option value="L4: Analyze">L4: Analyze</option>
                    <option value="L5: Evaluate">L5: Evaluate</option>
                    <option value="L6: Create">L6: Create</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="courseOutcome">Course Outcome:</label>
                <select
                  className="form-control"
                  id="courseOutcome"
                  name="courseOutcome"
                  value={formData.courseOutcome}
                  onChange={handleChange}
                  required
                >
                  <option value="CO1">CO1</option>
                  <option value="CO2">CO2</option>
                  <option value="CO3">CO3</option>
                  <option value="CO4">CO4</option>
                  <option value="CO5">CO5</option>
                  <option value="CO6">CO6</option>
                </select>
              </div>

              <div className="form-group mb-2">
                <label htmlFor="marks">Marks:</label>
                <input
                  type="number"
                  className="form-control"
                  id="marks"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;
