import React, { useState, useRef, useEffect } from 'react';
import { Form } from 'react-bootstrap';

const MultiSelectDropdown = ({ options, selected, onChange, label, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Toggle selection
    const handleToggle = (value) => {
        let newSelected;
        if (selected.includes(value)) {
            newSelected = selected.filter(item => item !== value);
        } else {
            newSelected = [...selected, value];
        }
        onChange(newSelected);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            onChange(options.map(o => o.value));
        } else {
            onChange([]);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Format display text
    const getDisplayText = () => {
        if (selected.length === 0) return placeholder;
        if (selected.length === options.length) return `All ${label}s`;
        if (selected.length === 1) {
            const item = options.find(o => o.value === selected[0]);
            return item ? item.label : selected[0];
        }
        return `${selected.length} ${label}s selected`;
    };

    return (
        <div className="position-relative" ref={dropdownRef}>
            <label className="form-label small fw-bold mb-1">{label}</label>
            <div
                className="form-select form-select-sm"
                style={{ cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                onClick={() => setIsOpen(!isOpen)}
                title={getDisplayText()}
            >
                {getDisplayText()}
            </div>

            {isOpen && (
                <div className="position-absolute w-100 bg-white border rounded shadow p-2" style={{ zIndex: 1050, maxHeight: '250px', overflowY: 'auto', marginTop: '2px' }}>

                    {/* Search or Select All could go here if list is long */}
                    {options.length > 0 && (
                        <div className="form-check border-bottom pb-2 mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`select-all-${label}`}
                                checked={selected.length === options.length && options.length > 0}
                                onChange={handleSelectAll}
                            />
                            <label className="form-check-label small fw-bold" htmlFor={`select-all-${label}`}>
                                Select All
                            </label>
                        </div>
                    )}

                    {options.map((option) => (
                        <div key={option.value} className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`chk-${label}-${option.value}`}
                                checked={selected.includes(option.value)}
                                onChange={() => handleToggle(option.value)}
                            />
                            <label className="form-check-label small" htmlFor={`chk-${label}-${option.value}`}>
                                {option.label}
                            </label>
                        </div>
                    ))}

                    {options.length === 0 && <div className="text-muted small text-center">No options</div>}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
