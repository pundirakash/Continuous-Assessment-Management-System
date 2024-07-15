import React, { useState, useEffect } from 'react';

const EditQuestionModal = ({ question, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...question,
    options: question.options.join(', ') 
  });

  useEffect(() => {
    setFormData({
      ...question,
      options: question.options.join(', ') 
    });
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleOptionsChange = (e) => {
    const { value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      options: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedFormData = {
      ...formData,
      options: formData.options.split(',').map(option => option.trim())
    };
    onSave(updatedFormData);
  };

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Question</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
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
                  onChange={handleChange}
                  required
                >
                  <option value="MCQ">MCQ</option>
                  <option value="Theory">Theory</option>
                </select>
              </div>

              {formData.type === 'MCQ' && (
                <div>
                  <h4>Options</h4>
                  <textarea
                    className="form-control"
                    id="options"
                    name="options"
                    value={formData.options}
                    onChange={handleOptionsChange}
                  />
                </div>
              )}

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
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                  <option value="L4">L4</option>
                  <option value="L5">L5</option>
                  <option value="L6">L6</option>
                </select>
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

              <div className="form-group">
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