import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGasPump, FaUniversity, FaBolt, FaBoxOpen, FaPlus, FaEdit, FaTrash, FaTimes, FaHospital, FaUtensils, FaExchangeAlt } from 'react-icons/fa';
import { categoryAPI, transactionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Categories.css';

const Categories = () => {
    const { success, error: showError } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    // Category icons mapping
    const categoryIcons = {
        'Fuel': { icon: <FaGasPump />, description: 'Transportation, repairs & gas', colorClass: 'icon-fuel' },
        'Transfer': { icon: <FaUniversity />, description: 'External transfers & savings', colorClass: 'icon-transfer' },
        'Utilities': { icon: <FaBolt />, description: 'Electricity, water, internet', colorClass: 'icon-utilities' },
        'Food': { icon: <FaUtensils />, description: 'Meals, restaurants & groceries', colorClass: 'icon-food' },
        'Hospital': { icon: <FaHospital />, description: 'Medical & healthcare expenses', colorClass: 'icon-hospital' },
        'Other': { icon: <FaBoxOpen />, description: 'Uncategorized & personal spending', colorClass: 'icon-other' }
    };

    // Mock budget limits
    const mockBudgets = {
        'Fuel': 200,
        'Transfer': 1000,
        'Utilities': 300,
        'Food': 500,
        'Hospital': 400,
        'Other': 500
    };

    const fetchCategories = async () => {
        try {
            const [catsData, txsData] = await Promise.all([
                categoryAPI.getAll(),
                transactionAPI.getAll()
            ]);

            // Handle pagination structure (response.data.transactions)
            const transactionsList = Array.isArray(txsData) ? txsData : (txsData.transactions || []);

            // Calculate spent amount per category
            const processedCategories = catsData.map(cat => {
                const catTransactions = transactionsList.filter(tx => {
                    return (tx.category && tx.category.id === cat.id) || tx.category_id === cat.id;
                });
                const totalSpent = catTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

                const iconInfo = categoryIcons[cat.name] || {
                    icon: <FaBoxOpen />,
                    description: 'General expenses',
                    colorClass: 'icon-default'
                };

                const limit = mockBudgets[cat.name] || 500;

                return {
                    ...cat,
                    spent: totalSpent,
                    limit: limit,
                    icon: iconInfo.icon,
                    description: iconInfo.description,
                    colorClass: iconInfo.colorClass,
                    percent: Math.min((totalSpent / limit) * 100, 100)
                };
            });

            setCategories(processedCategories);
        } catch (err) {
            console.error("Error fetching category data:", err);
            showError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showError('Please enter a category name');
            return;
        }

        try {
            await categoryAPI.create({ category: { name: newCategoryName.trim() } });
            success('Category created successfully!');
            setNewCategoryName('');
            setShowAddModal(false);
            fetchCategories(); // Refresh the list
        } catch (err) {
            console.error('Error creating category:', err);
            showError('Failed to create category');
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.name.trim()) {
            showError('Please enter a category name');
            return;
        }

        try {
            await categoryAPI.update(editingCategory.id, {
                category: { name: editingCategory.name.trim() }
            });
            success('Category updated successfully!');
            setEditingCategory(null);
            setShowEditModal(false);
            fetchCategories(); // Refresh the list
        } catch (err) {
            console.error('Error updating category:', err);
            showError('Failed to update category');
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
            return;
        }

        try {
            await categoryAPI.delete(categoryId);
            success('Category deleted successfully!');
            fetchCategories(); // Refresh the list
        } catch (err) {
            console.error('Error deleting category:', err);
            showError('Failed to delete category');
        }
    };

    const openEditModal = (category) => {
        setEditingCategory({ ...category });
        setShowEditModal(true);
    };

    const getStatusColor = (percent) => {
        if (percent < 50) return '#00d09c'; // Green
        if (percent < 80) return '#ffb020'; // Orange/Yellow
        return '#ff6b6b'; // Red
    };

    const getStatusText = (percent) => {
        if (percent < 50) return { text: 'Healthy', class: 'status-healthy' };
        if (percent < 80) return { text: 'Near Limit', class: 'status-warning' };
        return { text: 'Over Budget', class: 'status-critical' };
    };

    if (loading) return <div className="loading">Loading categories...</div>;

    return (
        <div className="categories-container">
            <div className="categories-header">
                <h1>Category & Budget Management</h1>
                <p>Effortlessly organize your finances. Synchronize accounts and track your spending breakdown.</p>
            </div>

            <div className="categories-controls">
                <div className="date-selector">
                    <span>📅 {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <button className="add-category-btn" onClick={() => setShowAddModal(true)}>
                    <FaPlus /> Add New Category
                </button>
            </div>

            <div className="categories-grid">
                {categories.map(cat => {
                    const status = getStatusText(cat.percent);
                    const progressColor = getStatusColor(cat.percent);

                    return (
                        <div key={cat.id} className="category-card">
                            <div className="card-header">
                                <div className={`category-icon ${cat.colorClass}`}>
                                    {cat.icon}
                                </div>
                                <div className={`status-badge ${status.class}`}>
                                    {status.text}
                                </div>
                            </div>

                            <div className="category-info">
                                <h3>{cat.name}</h3>
                                <p>{cat.description}</p>
                            </div>

                            <div className="budget-info">
                                <div className="budget-numbers">
                                    <span className="spent">${cat.spent.toFixed(2)} spent</span>
                                    <span className="limit">${cat.limit} limit</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${cat.percent}%`, backgroundColor: progressColor }}
                                    ></div>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => openEditModal(cat)}
                                >
                                    <FaEdit /> Edit
                                </button>
                                <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                >
                                    <FaTrash /> Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Category Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Category</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Enter category name"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {showEditModal && editingCategory && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Category</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleEditCategory}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    placeholder="Enter category name"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Update Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
