import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/me');
                    setUser(response.data);
                } catch (error) {
                    console.error("Failed to fetch user:", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { user: { email, password } });

            // API returns: { message, user, token } directly in data
            const { user, token } = response.data;

            if (token) {
                localStorage.setItem('token', token);
                setUser(user);
                return { success: true };
            } else {
                return { success: false, error: 'No token received' };
            }
        } catch (error) {
            console.error("Login failed", error);
            const status = error.response?.status;
            if (status === 401 || status === 404 || status === 422) {
                return { success: false, error: 'Invalid email or password.' };
            }
            return { success: false, error: error.response?.data?.error || 'Login failed. Please try again.' };
        }
    };

    const signup = async (email, password, name) => {
        try {
            const response = await api.post('/signup', { user: { email, password, name } });

            // API returns: { message, user, token } directly in data
            const { user, token } = response.data;

            if (token) {
                localStorage.setItem('token', token);
                setUser(user);
                return { success: true };
            } else {
                return { success: false, error: 'No token received' };
            }
        } catch (error) {
            console.error("Signup failed", error);
            return { success: false, error: error.response?.data?.errors?.join(', ') || 'Signup failed' };
        }
    };

    const logout = async () => {
        try {
            await api.delete('/logout');
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
