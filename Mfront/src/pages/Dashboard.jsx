import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaArrowUp, FaArrowDown, FaWallet, FaMagic, FaPlus, FaCloudUploadAlt, FaGasPump, FaHome, FaBolt, FaShoppingBag, FaBoxOpen, FaUniversity } from 'react-icons/fa';
import { transactionAPI, categoryAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Category icon mapping
    const getCategoryIcon = (name) => {
        const iconMap = {
            'Fuel': <FaGasPump />,
            'Transfer': <FaUniversity />,
            'Utilities': <FaBolt />,
            'Groceries': <FaShoppingBag />,
            'Housing': <FaHome />,
        };
        return iconMap[name] || <FaBoxOpen />;
    };

    // Category color mapping
    const getCategoryColor = (name) => {
        const colorMap = {
            'Fuel': '#3b82f6',
            'Transfer': '#10b981',
            'Utilities': '#f59e0b',
            'Groceries': '#ec4899',
            'Other': '#94a3b8',
        };
        return colorMap[name] || '#6b7280';
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txData, catData] = await Promise.all([
                    transactionAPI.getAll(),
                    categoryAPI.getAll()
                ]);
                // Defensive check to ensure we always have an array
                const txArray = Array.isArray(txData.transactions) ? txData.transactions : (Array.isArray(txData) ? txData : []);
                setTransactions(txArray);
                setCategories(catData);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Get category name by ID
    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat ? cat.name : 'Uncategorized';
    };

    const getTransactionCategoryName = (tx) => {
        if (tx?.category?.name) return tx.category.name;
        if (typeof tx?.category === 'string') return tx.category;
        return getCategoryName(tx?.category_id);
    };

    const isTransferTransaction = (tx) => {
        const categoryName = (getTransactionCategoryName(tx) || '').trim().toLowerCase();
        return categoryName === 'transfer';
    };

    const getEffectiveTransactionType = (tx) => {
        if (isTransferTransaction(tx)) return 'expense';
        return tx.transaction_type || 'expense';
    };

    // Calculate spending breakdown by category
    const calculatePieData = () => {
        const spending = {};
        transactions.forEach(tx => {
            if (getEffectiveTransactionType(tx) === 'expense') {
                const catName = getTransactionCategoryName(tx) || 'Other';
                spending[catName] = (spending[catName] || 0) + parseFloat(tx.amount || 0);
            }
        });

        return Object.entries(spending).map(([name, value]) => ({
            name,
            value,
            color: getCategoryColor(name)
        }));
    };

    // Get recent transactions (last 4)
    const recentTransactions = transactions.slice(0, 4);

    // Calculate totals
    const expenseTransactions = transactions
        .filter(tx => getEffectiveTransactionType(tx) === 'expense');
    const incomeTransactions = transactions
        .filter(tx => getEffectiveTransactionType(tx) === 'income');

    const totalExpenses = expenseTransactions
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    const totalIncome = incomeTransactions
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    const balance = totalIncome - totalExpenses;

    const pieData = calculatePieData();
    const totalSpent = pieData.reduce((sum, item) => sum + item.value, 0);

    if (loading) {
        return <div className="dashboard-container"><p>Loading dashboard...</p></div>;
    }

    return (
        <div className="dashboard-container">
            <header className="flex-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Overview </h1>
                </div>
                <div className="search-bar-mock">
                    {/* Search placeholder */}
                </div>
            </header>

            {/* Banner Section */}
            <div className="card banner-card mb-8">
                <div className="banner-content">
                    <div className="banner-icon"><FaMagic /></div>
                    <div>
                        <h4 className="banner-subtitle">SMART CATEGORIZATION</h4>
                        <h2>Automate your finances</h2>
                        <p>Upload your latest bank statement or snap a picture of a receipt. Our  engine will automatically categorize your spending.</p>
                    </div>
                </div>
                <div className="banner-actions">
                    <button className="btn btn-primary lg" onClick={() => navigate('/upload')}>
                        <FaCloudUploadAlt /> Upload Bank Transfer
                    </button>
                    <button className="btn btn-secondary lg" onClick={() => navigate('/upload')}>
                        <FaPlus /> Manual Entry
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-3 mb-8">
                <div className="card summary-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/accounts')}>
                    <div className="flex-between mb-4">
                        <div className="icon-box blue"><FaWallet /></div>
                        <span className={`badge ${balance >= 0 ? 'green' : 'red'}`}>
                            {balance >= 0 ? '+' : ''}{((balance / Math.max(totalIncome, 1)) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="card-content">
                        <p>Net Balance</p>
                        <h3>${balance.toFixed(2)}</h3>
                        <span className="sub-text">Based on {transactions.length} transactions</span>
                    </div>
                </div>

                <div className="card summary-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
                    <div className="flex-between mb-4">
                        <div className="icon-box green"><FaArrowUp /></div>
                        <span className="badge green">Income</span>
                    </div>
                    <div className="card-content">
                        <p>Total Income</p>
                        <h3>${totalIncome.toFixed(2)}</h3>
                        <span className="sub-text">{incomeTransactions.length} income transactions</span>
                    </div>
                </div>

                <div className="card summary-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
                    <div className="flex-between mb-4">
                        <div className="icon-box orange"><FaArrowDown /></div>
                        <span className="badge red">Expenses</span>
                    </div>
                    <div className="card-content">
                        <p>Total Spending</p>
                        <h3>${totalExpenses.toFixed(2)}</h3>
                        <span className="sub-text">{expenseTransactions.length} expense transactions</span>
                    </div>
                </div>
            </div>

            <div className="grid-main-split">
                {/* Spending Breakdown */}
                <div className="card">
                    <div className="flex-between mb-6">
                        <h3>Spending Breakdown</h3>
                        <button className="btn-icon" onClick={() => navigate('/categories')}>View All</button>
                    </div>
                    <div className="pie-chart-wrapper flex-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width={220} height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                        <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold">${totalSpent.toFixed(0)}</tspan>
                                        <tspan x="50%" dy="1.5em" fontSize="12" fill="#9ca3b8">TOTAL SPENT</tspan>
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted">No spending data yet</p>
                        )}
                    </div>
                    <div className="legend-list">
                        {pieData.map((item) => (
                            <div key={item.name} className="legend-row">
                                <div className="flex-center gap-2">
                                    <span className="dot" style={{ backgroundColor: item.color }}></span>
                                    <span>{item.name}</span>
                                </div>
                                <span className="font-semibold">${item.value.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <button className="btn btn-secondary w-full" onClick={() => navigate('/categories')}>View Categories</button>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card">
                    <div className="flex-between mb-6">
                        <h3>Recent Transactions</h3>
                        <button className="btn btn-secondary sm" onClick={() => navigate('/transactions')}>View All</button>
                    </div>

                    <table className="table-clean">
                        <thead>
                            <tr>
                                <th>TRANSACTION</th>
                                <th>CATEGORY</th>
                                <th>STATUS</th>
                                <th className="text-right">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map(tx => {
                                const categoryName = getTransactionCategoryName(tx);
                                const isIncome = getEffectiveTransactionType(tx) === 'income';
                                // Infer status from category presence if status field is missing
                                const isProcessed = tx.status === 'processed' || !!tx.category;

                                return (
                                    <tr key={tx.id}>
                                        <td>
                                            <div className="flex-center gap-3 justify-start">
                                                <div className="icon-circle-gray">{getCategoryIcon(categoryName)}</div>
                                                <div>
                                                    <div className="font-semibold text-dark">{tx.vendor || tx.description || 'Transaction'}</div>
                                                    <div className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge category-pill">{categoryName}</span></td>
                                        <td>
                                            <div className="flex-center gap-2 justify-start">
                                                <span className={`status-dot-sm ${isProcessed ? 'green' : 'orange'}`}></span>
                                                <span className={isProcessed ? 'text-green' : 'text-orange'}>
                                                    {isProcessed ? 'Categorized' : 'Processing'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`text-right font-bold ${isIncome ? 'text-green' : 'text-red'}`}>
                                            {isIncome ? '+' : '-'}${Math.abs(parseFloat(tx.amount || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                        No transactions yet. Upload a receipt to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="pagination-simple mt-4">
                        <span>Showing {recentTransactions.length} of {transactions.length} transactions</span>
                        <button className="btn btn-secondary sm" onClick={() => navigate('/transactions')}>See All</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
