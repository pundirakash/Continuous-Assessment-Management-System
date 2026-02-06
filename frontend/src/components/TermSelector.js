import React, { useState } from 'react';
import { useTerm } from '../context/TermContext';
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa';

const TermSelector = () => {
    const { currentTerm, selectedTerm, switchTerm, loading } = useTerm();
    const [isOpen, setIsOpen] = useState(false);

    if (loading) return <span className="text-secondary small">Loading...</span>;

    const terms = [currentTerm];
    if (currentTerm !== '24252') {
        terms.push('24252');
    }
    terms.sort().reverse();

    return (
        <div className="dropdown" style={{ position: 'relative' }}>
            <button
                className="btn d-flex align-items-center gap-3 px-4 py-2 bg-white border shadow-sm"
                style={{ borderRadius: '16px', transition: 'all 0.2s', minWidth: '220px' }}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div className="d-flex align-items-center justify-content-center bg-indigo-50 text-indigo rounded-circle"
                    style={{ width: '32px', height: '32px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                    <FaCalendarAlt size={14} />
                </div>
                <div className="d-flex flex-column align-items-start lh-1">
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>CURRENT TERM</span>
                    <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>{selectedTerm}</span>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                    {selectedTerm === currentTerm && (
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>Active</span>
                    )}
                    <FaChevronDown size={12} className="text-secondary" />
                </div>
            </button>

            {isOpen && (
                <ul className="dropdown-menu show border-0 shadow-lg mt-2 p-2"
                    style={{ position: 'absolute', top: '100%', right: '0', zIndex: 1000, minWidth: '100%', borderRadius: '12px' }}>
                    {terms.map(term => (
                        <li key={term}>
                            <button
                                className={`dropdown-item rounded-3 py-2 px-3 d-flex align-items-center justify-content-between mb-1 ${term === selectedTerm ? 'bg-indigo-50 text-indigo' : ''}`}
                                style={term === selectedTerm ? { backgroundColor: '#eef2ff', color: '#4f46e5' } : {}}
                                onClick={() => {
                                    switchTerm(term);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="fw-semibold">{term}</span>
                                {term === currentTerm && <span className="badge bg-success rounded-pill" style={{ fontSize: '10px' }}>Current</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Overlay to close on click outside */}
            {isOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default TermSelector;
