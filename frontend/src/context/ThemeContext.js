// src/context/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Récupère le thème sauvegardé ou utilise le préférence système
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Applique la classe 'dark' sur <html>
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    return ( <
        ThemeContext.Provider value = {
            { isDarkMode, toggleDarkMode } } > { children } <
        /ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);