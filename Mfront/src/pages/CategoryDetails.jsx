import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrash, FaGasPump, FaUniversity, FaBolt, FaBoxOpen, FaArrowLeft } from 'react-icons/fa';
import { categoryAPI, transactionAPI } from '../services/api';
import './CategoryDetails.css';

const CategoryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to match icons
    const getCategoryIcon = (name) => {
        switch (name) {
            case 'Fuel': return <FaGasPump />;
            case 'Transfer': return <FaUniversity />;
            case 'Utilities': return <FaBolt />;
            default: return <FaBoxOpen />;
        }
    };

    const getCategoryColor = (name) => {
        switch (name) {
            case 'Fuel': return 'icon-fuel';
            case 'Transfer': return 'icon-transfer';
            case 'Utilities': return 'icon-utilities';
            default: return 'icon-other';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catsData, txsData] = await Promise.all([
                    categoryAPI.getAll(),
                    transactionAPI.getAll()
                ]);

                const foundCat = catsData.find(c => c.id.toString() === id);
                if (foundCat) {
                    setCategory(foundCat);
                    // Filter transactions for this category
                    const allTransactions = txsData.transactions || [];
                    const catTransactions = allTransactions.filter(tx => tx.category && tx.category.id === foundCat.id);
                    setTransactions(catTransactions);
                } else {
                    navigate('/categories'); // Redirect if not found
                }
            } catch (error) {
                console.error("Error fetching details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const handleDelete = async (txId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await transactionAPI.delete(txId);
                setTransactions(transactions.filter(t => t.id !== txId));
            } catch (error) {
                console.error("Delete failed:", error);
            }
        }
    };

    if (loading || !category) return <div className="loading">Loading details...</div>;

    const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const budgetLimit = 200; // Mock limit
    const remaining = budgetLimit - totalSpent;
    const percentUsed = Math.min((totalSpent / budgetLimit) * 100, 100);

    return (
        <div className="category-details-container">
            <Link to="/categories" className="back-link">← BACK TO BUDGETS</Link>

            <div className="details-header">
                <div className="details-title-section">
                    <div className={`details-icon ${getCategoryColor(category.name)}`}>
                        {getCategoryIcon(category.name)}
                    </div>
                    <div className="details-title">
                        <h1>{category.name} Payment</h1>
                    </div>
                </div>
                <button className="upload-btn" onClick={() => navigate('/upload')}>
                    <FaCloudUploadAlt /> Upload New Receipt
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">TOTAL SPENT THIS MONTH</div>
                    <div className="stat-value">${totalSpent.toFixed(2)}</div>
                    <div className="stat-trend trend-good">
                        <span>↘ 12%</span> vs last month
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">BUDGET LIMIT</div>
                    <div className="stat-value">${budgetLimit.toFixed(2)}</div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${percentUsed}%`, backgroundColor: '#00d09c' }}
                        ></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">REMAINING</div>
                    <div className="stat-value">${remaining.toFixed(2)}</div>
                    <div className="stat-subtext">“You are on track to stay within budget.”</div>
                </div>
            </div>

            <h2 className="section-title">Transaction History</h2>

            <div className="transactions-list">
                <div className="list-header">
                    <div>VENDOR & DETAILS</div>
                    <div>DATE</div>
                    <div>AMOUNT</div>
                    <div>ACTIONS</div>
                </div>

                {transactions.map(tx => (
                    <div key={tx.id} className="transaction-item">
                        <div className="vendor-info">
                            <h4>{tx.vendor || category.name}</h4>
                            <span>{tx.description || tx.transaction_type}</span>
                        </div>
                        <div className="t-date">
                            {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                        <div className="t-amount">${parseFloat(tx.amount).toFixed(2)}</div>
                        <div className="t-action" onClick={() => handleDelete(tx.id)}>
                            <FaTrash />
                        </div>
                    </div>
                ))}

                {transactions.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                        No transactions found for this category.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryDetails;
