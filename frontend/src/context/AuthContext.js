import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
    });

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:5050/businessRegister",
                    {
                        withCredentials: true
                    }
                );
    
                if (response.data && response.data.success && response.data.user) {
                    setAuthState({
                        isAuthenticated: true,
                        user: response.data.user
                    });
                } else {
                    setAuthState({
                        isAuthenticated: false,
                        user: null,
                    });
                }
            } catch (error) {
                console.error(error);
            };
        }

        checkAuthStatus();
    }, []);

    const login = async (identifier, password) => {
        try {

        } catch (error) {

        }
    }
}