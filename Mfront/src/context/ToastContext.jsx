/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = (msg, duration) => addToast(msg, 'success', duration);
    const error = (msg, duration) => addToast(msg, 'error', duration);
    const info = (msg, duration) => addToast(msg, 'info', duration);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
            {children}
            {createPortal(
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <div className="toast-icon">
                                {toast.type === 'success' && <FaCheckCircle />}
                                {toast.type === 'error' && <FaExclamationCircle />}
                                {toast.type === 'info' && <FaInfoCircle />}
                            </div>
                            <div className="toast-message">{toast.message}</div>
                            <button className="toast-close" onClick={() => removeToast(toast.id)}>
                                <FaTimes />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
