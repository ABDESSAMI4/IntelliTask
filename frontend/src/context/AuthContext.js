// src/context/AuthContext.js
import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({
                    id: decoded.id,
                    role: decoded.role // ← on récupère le rôle du token
                });
            } catch (err) {
                console.error('Token invalide', err);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({
            id: decoded.id,
            role: decoded.role
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return ( <
        AuthContext.Provider value = {
            { user, login, logout, loading }
        } > { children } <
        /AuthContext.Provider>
    );
};