import React, { createContext, useState, useEffect, useContext } from 'react';
import userService from '../services/userService';

const TermContext = createContext();

export const TermProvider = ({ children }) => {
    // currentTerm: The active system term (e.g. 25262)
    const [currentTerm, setCurrentTerm] = useState('25262');
    // selectedTerm: The term the user is viewing (default to currentTerm placeholder until fetched)
    const [selectedTerm, setSelectedTerm] = useState('25262');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSystemConfig();
    }, []);

    const fetchSystemConfig = async () => {
        try {
            // Using userService which handles token and base URL
            const token = localStorage.getItem('token');
            if (token) {
                const data = await userService.getSystemConfig();
                if (data && data.value) {
                    setCurrentTerm(data.value);
                    setSelectedTerm(data.value); // Always reset to current term on load
                }
            }
        } catch (error) {
            console.error("Failed to fetch system term", error);
        } finally {
            setLoading(false);
        }
    };

    const switchTerm = (term) => {
        setSelectedTerm(term);
    };

    // Helper to check if we are viewing the active term
    const isCurrentTerm = selectedTerm === currentTerm;

    return (
        <TermContext.Provider value={{ currentTerm, selectedTerm, switchTerm, isCurrentTerm, loading }}>
            {children}
        </TermContext.Provider>
    );
};

export const useTerm = () => useContext(TermContext);
