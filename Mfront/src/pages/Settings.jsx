import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaFileDownload, FaSave, FaShieldAlt, FaSignOutAlt, FaSlidersH, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import './Settings.css';

const LOCAL_SETTINGS_KEY = 'expense_tracker_settings';
const DEFAULT_PREFERENCES = {
    currency: 'ETB',
    dateFormat: 'DD MMM YYYY',
    weekStartsOn: 'monday',
    notifications: true,
    weeklySummary: false,
    budgetThreshold: 80,
    autoCategorize: true
};

const readStoredPreferences = () => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

    try {
        const rawSettings = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (!rawSettings) return DEFAULT_PREFERENCES;

        const parsedSettings = JSON.parse(rawSettings);
        return { ...DEFAULT_PREFERENCES, ...parsedSettings };
    } catch (storageError) {
        console.error('Failed to parse local settings:', storageError);
        return DEFAULT_PREFERENCES;
    }
};

const Settings = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { success, error } = useToast();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    useEffect(() => {
        setPreferences(readStoredPreferences());
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePreferenceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : name === 'budgetThreshold' ? Number(value) : value
        }));
    };

    const handleSave = async () => {
        const trimmedName = formData.name.trim();
        const trimmedEmail = formData.email.trim();

        if (!trimmedName || !trimmedEmail) {
            error('Name and email are required');
            return;
        }

        if (formData.newPassword && formData.newPassword.length < 6) {
            error('Password must be at least 6 characters');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            error('Password confirmation does not match');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                user: {
                    name: trimmedName,
                    email: trimmedEmail
                }
            };

            if (formData.newPassword) {
                payload.user.password = formData.newPassword;
                payload.user.password_confirmation = formData.confirmPassword;
            }

            await api.patch('/me', payload);
            window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(preferences));
            setFormData((prev) => ({
                ...prev,
                name: trimmedName,
                email: trimmedEmail,
                newPassword: '',
                confirmPassword: ''
            }));
            success(formData.newPassword ? 'Profile and password updated' : 'Settings saved successfully');
        } catch (err) {
            console.error("Failed to save settings", err);
            error(err.response?.data?.errors?.join(', ') || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPreferences = () => {
        const settingsPayload = {
            profile: {
                name: formData.name.trim(),
                email: formData.email.trim()
            },
            preferences,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(settingsPayload, null, 2)], { type: 'application/json' });
        const fileUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = `expense-tracker-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(fileUrl);
    };

    const handleSignOut = async () => {
        await logout();
        success('Signed out successfully');
        navigate('/login');
    };

    return (
        <div className="settings-page">
            <header className="settings-header">
                <div>
                    <h1 className="settings-title">Settings</h1>
                    <p className="settings-subtitle">Manage profile, defaults, notifications, and security options.</p>
                </div>
                <div className="settings-user-chip">
                    <FaUserCircle />
                    <span>{user?.email || 'User account'}</span>
                </div>
            </header>

            <div className="settings-grid">
                <section className="card settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">
                            <span className="section-icon">
                                <FaUserCircle />
                            </span>
                            Profile
                        </h2>
                    </div>

                    <div className="settings-form-grid">
                        <div className="settings-field">
                            <label htmlFor="settings-name">Full Name</label>
                            <input
                                id="settings-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleProfileChange}
                                autoComplete="name"
                            />
                        </div>
                        <div className="settings-field">
                            <label htmlFor="settings-email">Email Address</label>
                            <input
                                id="settings-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleProfileChange}
                                autoComplete="email"
                            />
                        </div>
                    </div>
                </section>

                <section className="card settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">
                            <span className="section-icon">
                                <FaSlidersH />
                            </span>
                            Transaction Defaults
                        </h2>
                    </div>

                    <div className="settings-form-grid">
                        <div className="settings-field">
                            <label htmlFor="settings-currency">Default Currency</label>
                            <select
                                id="settings-currency"
                                name="currency"
                                value={preferences.currency}
                                onChange={handlePreferenceChange}
                            >
                                <option value="ETB">ETB - Ethiopian Birr</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="KES">KES - Kenyan Shilling</option>
                            </select>
                        </div>
                        <div className="settings-field">
                            <label htmlFor="settings-week-start">Week Starts On</label>
                            <select
                                id="settings-week-start"
                                name="weekStartsOn"
                                value={preferences.weekStartsOn}
                                onChange={handlePreferenceChange}
                            >
                                <option value="monday">Monday</option>
                                <option value="sunday">Sunday</option>
                                <option value="saturday">Saturday</option>
                            </select>
                        </div>
                        <div className="settings-field full">
                            <label htmlFor="settings-date-format">Date Format</label>
                            <select
                                id="settings-date-format"
                                name="dateFormat"
                                value={preferences.dateFormat}
                                onChange={handlePreferenceChange}
                            >
                                <option value="DD MMM YYYY">DD MMM YYYY (26 Feb 2026)</option>
                                <option value="MMM DD, YYYY">MMM DD, YYYY (Feb 26, 2026)</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-02-26)</option>
                            </select>
                            <p className="settings-hint">Applied to reports and exports in future updates.</p>
                        </div>
                        <div className="settings-field full threshold-row">
                            <div className="threshold-label">
                                <span>Budget Alert Threshold</span>
                                <span className="threshold-pill">{preferences.budgetThreshold}%</span>
                            </div>
                            <input
                                type="range"
                                name="budgetThreshold"
                                min="50"
                                max="100"
                                step="5"
                                value={preferences.budgetThreshold}
                                onChange={handlePreferenceChange}
                                className="threshold-slider"
                            />
                            <p className="settings-note">
                                Notify me when category spending reaches this percentage of the monthly budget.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="settings-grid">
                <section className="card settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">
                            <span className="section-icon">
                                <FaBell />
                            </span>
                            Notifications
                        </h2>
                    </div>

                    <label className="switch-row">
                        <span className="switch-text">
                            <strong>Unusual activity alerts</strong>
                            <span>Send immediate alerts for suspicious or unusual transactions.</span>
                        </span>
                        <input
                            type="checkbox"
                            className="switch-input"
                            name="notifications"
                            checked={preferences.notifications}
                            onChange={handlePreferenceChange}
                        />
                    </label>

                    <label className="switch-row">
                        <span className="switch-text">
                            <strong>Weekly spending summary</strong>
                            <span>Receive a concise weekly report with category totals and trends.</span>
                        </span>
                        <input
                            type="checkbox"
                            className="switch-input"
                            name="weeklySummary"
                            checked={preferences.weeklySummary}
                            onChange={handlePreferenceChange}
                        />
                    </label>

                    <label className="switch-row">
                        <span className="switch-text">
                            <strong>Auto-categorize imported transactions</strong>
                            <span>Apply AI category suggestions automatically when confidence is high.</span>
                        </span>
                        <input
                            type="checkbox"
                            className="switch-input"
                            name="autoCategorize"
                            checked={preferences.autoCategorize}
                            onChange={handlePreferenceChange}
                        />
                    </label>
                </section>

                <section className="card settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">
                            <span className="section-icon">
                                <FaShieldAlt />
                            </span>
                            Security
                        </h2>
                    </div>

                    <div className="settings-form-grid">
                        <div className="settings-field">
                            <label htmlFor="settings-new-password">New Password</label>
                            <input
                                id="settings-new-password"
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleProfileChange}
                                autoComplete="new-password"
                                placeholder="Leave empty to keep current password"
                            />
                        </div>
                        <div className="settings-field">
                            <label htmlFor="settings-confirm-password">Confirm Password</label>
                            <input
                                id="settings-confirm-password"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleProfileChange}
                                autoComplete="new-password"
                                placeholder="Re-enter new password"
                            />
                        </div>
                    </div>
                    <p className="settings-note">Password updates are applied to your account immediately after save.</p>
                </section>
            </div>

            <section className="card settings-card settings-footer-card">
                <div className="settings-footer">
                    <div className="settings-footer-left">
                        <button type="button" className="btn btn-secondary" onClick={handleExportPreferences}>
                            <FaFileDownload /> Export Settings
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
                            <FaSignOutAlt /> Sign Out
                        </button>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Settings;
