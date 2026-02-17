import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currency: 'ETB',
        notifications: true
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
                // Keep currency as ETB default unless user has a stored preference (not yet implemented in backend)
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/me', { user: formData });
            // Ideally we should also update the user in AuthContext here
            // but for now, the next page reload will fetch fresh data
            success('Settings saved successfully');
        } catch (err) {
            console.error("Failed to save settings", err);
            error(err.response?.data?.errors?.join(', ') || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto max-w-3xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted">Manage your profile and application preferences.</p>
            </header>

            <div className="card">
                <h3 className="mb-6 font-semibold text-lg border-b pb-4">Profile Information</h3>
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }} autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="notifications"
                            id="notifications"
                            checked={formData.notifications}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <label htmlFor="notifications" className="text-sm text-gray-700 select-none">
                            Receive email notifications for unusual activity
                        </label>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
