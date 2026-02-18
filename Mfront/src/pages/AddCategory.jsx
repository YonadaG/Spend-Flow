import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGasPump, FaUniversity, FaBolt, FaBoxOpen, FaUtensils, FaHospital, FaPlane, FaFilm, FaGamepad, FaGraduationCap, FaPaw, FaEllipsisH, FaPlus } from 'react-icons/fa';
import { categoryAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './AddCategory.css';

const AddCategory = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Other');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const icons = [
        { name: 'Fuel', icon: <FaGasPump /> },
        { name: 'Transfer', icon: <FaUniversity /> },
        { name: 'Utilities', icon: <FaBolt /> },
        { name: 'Food', icon: <FaUtensils /> },
        { name: 'Hospital', icon: <FaHospital /> },
        { name: 'Travel', icon: <FaPlane /> },
        { name: 'Entertainment', icon: <FaFilm /> },
        { name: 'Gaming', icon: <FaGamepad /> },
        { name: 'Education', icon: <FaGraduationCap /> },
        { name: 'Pets', icon: <FaPaw /> },
        { name: 'Other', icon: <FaBoxOpen /> },
        { name: 'Misc', icon: <FaEllipsisH /> }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            showError('Please enter a category name');
            return;
        }

        setIsSubmitting(true);

        try {
            await categoryAPI.create({
                category: {
                    name: name.trim(),
                    description: description.trim()
                }
            });
            success('Category created successfully!');
            navigate('/categories');
        } catch (err) {
            console.error('Error creating category:', err);
            const errorMsg = err.response?.data?.errors?.[0] || 'Failed to create category. Please try again.';
            showError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-category-container">
            <div className="add-cat-breadcrumb">
                <Link to="/categories">Categories</Link>
                <span className="separator">›</span>
                <span className="current-page">New Category</span>
            </div>

            <div className="add-category-header">
                <h1>Create New Category</h1>
                <p>Define a new spending bucket to keep your financial goals on track.</p>
            </div>

            <div className="add-category-card">
                <form onSubmit={handleSubmit}>
                    <div className="add-cat-form-group">
                        <label htmlFor="categoryName">Category Name</label>
                        <input
                            id="categoryName"
                            type="text"
                            className="add-cat-input"
                            placeholder="e.g., Groceries, Rent, Entertainment"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="add-cat-form-group">
                        <label htmlFor="spendingLimit">Monthly Spending Limit</label>
                        <div className="currency-input-wrapper">
                            <span className="currency-prefix">$</span>
                            <input
                                id="spendingLimit"
                                type="number"
                                className="add-cat-input"
                                placeholder="0.00"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <span className="add-cat-hint">We'll notify you when you reach 80% of this limit.</span>
                    </div>

                    <div className="add-cat-form-group">
                        <label htmlFor="description">Description / Purpose</label>
                        <textarea
                            id="description"
                            className="add-cat-textarea"
                            placeholder="What kind of expenses go here?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="add-cat-form-group">
                        <label>Category Icon</label>
                        <div className="icon-grid">
                            {icons.map((item) => (
                                <button
                                    key={item.name}
                                    type="button"
                                    className={`icon-btn ${selectedIcon === item.name ? 'active' : ''}`}
                                    onClick={() => setSelectedIcon(item.name)}
                                    title={item.name}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="add-cat-actions">
                        <button
                            type="button"
                            className="add-cat-cancel"
                            onClick={() => navigate('/categories')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="add-cat-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : (
                                <>
                                    <FaPlus /> Create Category
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="pro-tip-box">
                <span className="pro-tip-icon">💡</span>
                <div>
                    <strong>Pro Tip</strong>
                    <p>Most successful trackers use about 8-12 core categories. Keep it simple to ensure you stick with your budget!</p>
                </div>
            </div>
        </div>
    );
};

export default AddCategory;
