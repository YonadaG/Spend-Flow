import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrash, FaGasPump, FaUniversity, FaBolt, FaBoxOpen, FaArrowLeft, FaUtensils, FaHospital, FaChartLine, FaEdit, FaTimes } from 'react-icons/fa';
import { categoryAPI, transactionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './CategoryDetails.css';

const CategoryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [category, setCategory] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editBudgetLimit, setEditBudgetLimit] = useState('');
    const [budgetLimit, setBudgetLimit] = useState(500);

    const getCategoryIcon = (name) => {
        switch (name) {
            case 'Fuel': return <FaGasPump />;
            case 'Transfer': return <FaUniversity />;
            case 'Utilities': return <FaBolt />;
            case 'Food': return <FaUtensils />;
            case 'Hospital': return <FaHospital />;
            default: return <FaBoxOpen />;
        }
    };

    const getCategoryColor = (name) => {
        switch (name) {
            case 'Fuel': return 'icon-fuel';
            case 'Transfer': return 'icon-transfer';
            case 'Utilities': return 'icon-utilities';
            case 'Food': return 'icon-food';
            case 'Hospital': return 'icon-hospital';
            default: return 'icon-other';
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const [catsData, txsData] = await Promise.all([
                categoryAPI.getAll(),
                transactionAPI.getAll()
            ]);

            const foundCat = catsData.find(c => c.id.toString() === id);
            if (foundCat) {
                setCategory(foundCat);
                // Load saved budget limit from localStorage
                const savedLimit = localStorage.getItem(`budget_limit_${foundCat.id}`);
                if (savedLimit) setBudgetLimit(parseFloat(savedLimit));
                const allTransactions = Array.isArray(txsData) ? txsData : (txsData.transactions || []);
                const catTransactions = allTransactions.filter(tx =>
                    (tx.category && tx.category.id === foundCat.id) || tx.category_id === foundCat.id
                );
                setTransactions(catTransactions);
            } else {
                navigate('/categories');
            }
        } catch (error) {
            console.error("Error fetching details:", error);
            showError('Failed to load category details');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Delete a single transaction
    const handleDeleteTransaction = async (txId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await transactionAPI.delete(txId);
                setTransactions(transactions.filter(t => t.id !== txId));
                success('Transaction deleted');
            } catch (error) {
                console.error("Delete failed:", error);
                showError('Failed to delete transaction');
            }
        }
    };

    // Edit category
    const openEditModal = () => {
        setEditName(category.name);
        setEditDescription(category.description || '');
        setEditBudgetLimit(budgetLimit.toString());
        setShowEditModal(true);
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!editName.trim()) {
            showError('Please enter a category name');
            return;
        }
        try {
            await categoryAPI.update(category.id, {
                category: { name: editName.trim(), description: editDescription.trim() }
            });
            // Save budget limit to localStorage
            const newLimit = parseFloat(editBudgetLimit) || 500;
            localStorage.setItem(`budget_limit_${category.id}`, newLimit.toString());
            setBudgetLimit(newLimit);
            success('Category updated successfully!');
            setShowEditModal(false);
            setCategory({ ...category, name: editName.trim(), description: editDescription.trim() });
        } catch (err) {
            console.error('Error updating category:', err);
            showError('Failed to update category');
        }
    };

    // Delete category
    const handleDeleteCategory = async () => {
        if (!window.confirm(`Are you sure you want to delete "${category.name}"? All associated transactions will be uncategorized.`)) {
            return;
        }
        try {
            await categoryAPI.delete(category.id);
            success('Category deleted successfully!');
            navigate('/categories');
        } catch (err) {
            console.error('Error deleting category:', err);
            showError('Failed to delete category');
        }
    };

    if (loading || !category) return <div className="loading">Loading details...</div>;

    const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const remaining = Math.max(budgetLimit - totalSpent, 0);
    const percentUsed = Math.min((totalSpent / budgetLimit) * 100, 100);

    const getProgressColor = () => {
        if (percentUsed < 50) return 'var(--primary)';
        if (percentUsed < 80) return '#f59e0b';
        return '#ef4444';
    };

    const avgTransaction = transactions.length > 0
        ? (totalSpent / transactions.length).toFixed(2)
        : '0.00';

    const largestTransaction = transactions.length > 0
        ? Math.max(...transactions.map(t => parseFloat(t.amount || 0))).toFixed(2)
        : '0.00';

    const filteredTransactions = transactions.filter(tx => {
        if (activeFilter === 'all') return true;
        const txDate = new Date(tx.occurred_at || tx.created_at);
        const now = new Date();
        if (activeFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return txDate >= weekAgo;
        }
        if (activeFilter === 'month') {
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    return (
        <div className="cat-detail-container">
            <Link to="/categories" className="cat-detail-back">
                <FaArrowLeft /> Back to Categories
            </Link>

            <div className="cat-detail-header">
                <div className="cat-detail-title-section">
                    <div className={`cat-detail-icon ${getCategoryColor(category.name)}`}>
                        {getCategoryIcon(category.name)}
                    </div>
                    <div className="cat-detail-info">
                        <h1>{category.name}</h1>
                        <p>{category.description || 'No description provided'}</p>
                    </div>
                </div>
                <div className="cat-detail-actions-top">
                    <button className="cat-edit-btn" onClick={openEditModal}>
                        <FaEdit /> Edit Category
                    </button>
                    <button className="cat-delete-btn" onClick={handleDeleteCategory}>
                        <FaTrash /> Delete
                    </button>
                    <button className="cat-upload-btn" onClick={() => navigate('/upload')}>
                        <FaCloudUploadAlt /> Upload Receipt
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="cat-stats-grid">
                <div className="cat-stat-card">
                    <div className="cat-stat-label">Total Spent This Month</div>
                    <div className="cat-stat-value">${totalSpent.toFixed(2)}</div>
                    <div className="cat-stat-trend positive">
                        <span>↘ 12%</span> vs last month
                    </div>
                </div>

                <div className="cat-stat-card">
                    <div className="cat-stat-label">Budget Limit</div>
                    <div className="cat-stat-value">${budgetLimit.toFixed(2)}</div>
                    <div className="cat-progress-bg">
                        <div
                            className="cat-progress-fill"
                            style={{ width: `${percentUsed}%`, backgroundColor: getProgressColor() }}
                        ></div>
                    </div>
                    <div className="cat-progress-label">
                        <span>{percentUsed.toFixed(0)}% used</span>
                        <span>${remaining.toFixed(2)} left</span>
                    </div>
                </div>

                <div className="cat-stat-card">
                    <div className="cat-stat-label">Remaining</div>
                    <div className="cat-stat-value">${remaining.toFixed(2)}</div>
                    <div className="cat-stat-subtext">
                        {percentUsed < 80
                            ? "You're on track to stay within budget."
                            : "Warning: You're nearing your budget limit."}
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="cat-insights-box">
                <h3><FaChartLine /> Category Insights</h3>
                <div className="cat-insights-grid">
                    <div className="cat-insight-item">
                        <div className="insight-label">Total Transactions</div>
                        <div className="insight-value">{transactions.length}</div>
                    </div>
                    <div className="cat-insight-item">
                        <div className="insight-label">Avg. Transaction</div>
                        <div className="insight-value">${avgTransaction}</div>
                    </div>
                    <div className="cat-insight-item">
                        <div className="insight-label">Largest Expense</div>
                        <div className="insight-value">${largestTransaction}</div>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="cat-section-header" style={{ marginTop: '2rem' }}>
                <h2>Transaction History</h2>
                <div className="cat-filter-tabs">
                    <button
                        className={`cat-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >All</button>
                    <button
                        className={`cat-filter-tab ${activeFilter === 'week' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('week')}
                    >This Week</button>
                    <button
                        className={`cat-filter-tab ${activeFilter === 'month' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('month')}
                    >This Month</button>
                </div>
            </div>

            <div className="cat-tx-list">
                <div className="cat-tx-header">
                    <div>Vendor & Details</div>
                    <div>Date</div>
                    <div>Amount</div>
                    <div>Actions</div>
                </div>

                {filteredTransactions.map(tx => (
                    <div key={tx.id} className="cat-tx-row">
                        <div className="cat-tx-vendor">
                            <h4>{tx.merchant_name || tx.vendor || category.name}</h4>
                            <span>{tx.payment_reason || tx.description || tx.transaction_type || 'Payment'}</span>
                        </div>
                        <div className="cat-tx-date">
                            {new Date(tx.occurred_at || tx.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </div>
                        <div className="cat-tx-amount negative">
                            -${parseFloat(tx.amount).toFixed(2)}
                        </div>
                        <div className="cat-tx-action">
                            <button
                                className="cat-tx-action-btn delete"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                title="Delete"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredTransactions.length === 0 && (
                    <div className="cat-empty-state">
                        <div className="empty-icon">📭</div>
                        <p>No transactions found for this category.</p>
                    </div>
                )}
            </div>

            {/* Edit Category Modal */}
            {showEditModal && (
                <div className="cat-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="cat-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cat-modal-header">
                            <h2>Edit Category</h2>
                            <button className="cat-modal-close" onClick={() => setShowEditModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleEditCategory}>
                            <div className="cat-modal-group">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    className="cat-modal-input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter category name"
                                    autoFocus
                                />
                            </div>
                            <div className="cat-modal-group">
                                <label>Description</label>
                                <textarea
                                    className="cat-modal-textarea"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="What kind of expenses go here?"
                                    rows="3"
                                />
                            </div>
                            <div className="cat-modal-group">
                                <label>Monthly Budget Limit ($)</label>
                                <input
                                    type="number"
                                    className="cat-modal-input"
                                    value={editBudgetLimit}
                                    onChange={(e) => setEditBudgetLimit(e.target.value)}
                                    placeholder="500.00"
                                    min="0"
                                    step="0.01"
                                />
                                <span className="cat-modal-hint">Set a monthly spending cap for this category</span>
                            </div>
                            <div className="cat-modal-actions">
                                <button type="button" className="cat-modal-cancel" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cat-modal-save">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryDetails;
