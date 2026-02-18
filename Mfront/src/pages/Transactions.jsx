import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaPlus, FaGasPump, FaBriefcase, FaCloud, FaCoffee, FaHome, FaDownload, FaTrash, FaBoxOpen } from 'react-icons/fa';
import { transactionAPI, categoryAPI } from '../services/api';
import './Transactions.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Map category names to icons
    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            'Fuel': <FaGasPump />,
            'Transfer': <FaBriefcase />,
            'Utilities': <FaCloud />,
            'Groceries': <FaCoffee />,
            'Housing': <FaHome />,
        };
        return iconMap[categoryName] || <FaBoxOpen />;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txData, catData] = await Promise.all([
                    transactionAPI.getAll(),
                    categoryAPI.getAll()
                ]);
                setTransactions(txData.transactions || []);
                setCategories(catData);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await transactionAPI.delete(id);
                setTransactions(transactions.filter(t => t.id !== id));
            } catch (error) {
                console.error("Delete failed:", error);
            }
        }
    };

    const getCategoryName = (tx) => {
        // Updated to use nested category object if available
        if (tx.category) return tx.category.name;
        // Fallback for older logic
        const cat = categories.find(c => c.id === tx.category_id);
        return cat ? cat.name : 'Uncategorized';
    };

    const getStatusBadge = (status, category) => {
        if (status === 'processed' || !!category) return { text: 'Verified', class: 'green' };
        if (status === 'pending') return { text: 'Processing', class: 'yellow' };
        if (status === 'failed') return { text: 'Failed', class: 'red' };
        return { text: 'Processing', class: 'gray' };
    };

    const filteredTransactions = transactions.filter(tx =>
        (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.merchant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.payment_reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.invoice_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(tx).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate totals
    const totalExpenses = transactions
        .filter(tx => tx.transaction_type === 'expense' || !tx.transaction_type)
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    const totalIncome = transactions
        .filter(tx => tx.transaction_type === 'income')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    if (loading) return <div className="loading">Loading transactions...</div>;

    return (
        <div className="transactions-container-light">
            <header className="flex-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Transaction History</h1>
                    <p className="text-muted">You have {transactions.length} transactions.</p>
                </div>
                <div className="flex-center gap-3">
                    <button className="btn btn-secondary flex-center gap-2" onClick={() => navigate('/transactions/new')}>
                        <FaPlus /> Add Manual
                    </button>
                    <button className="btn btn-secondary flex-center gap-2" onClick={() => navigate('/upload')}>
                        <FaDownload /> Upload Receipt
                    </button>
                    <button className="btn btn-primary flex-center gap-2">
                        <FaDownload /> Export CSV
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="card mb-6 p-4">
                <div className="flex-between gap-4">
                    <div className="search-wrapper-light flex-1">
                        <FaSearch className="search-icon-light" />
                        <input
                            type="text"
                            placeholder="Search by description, merchant, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-center gap-3">
                        <button className="btn btn-ghost text-red sm" onClick={() => setSearchTerm('')}>Clear All</button>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card p-0 overflow-hidden">
                <table className="table-clean full-width">
                    <thead>
                        <tr className="bg-checkered">
                            <th className="pl-6">DATE</th>
                            <th>DESCRIPTION</th>
                            <th>CATEGORY</th>
                            <th>STATUS</th>
                            <th className="text-right pr-6">AMOUNT</th>
                            <th className="text-right pr-6">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((tx) => {
                            const categoryName = getCategoryName(tx);
                            const statusInfo = getStatusBadge(tx.status, tx.category);
                            const isIncome = tx.transaction_type === 'income';

                            return (
                                <tr key={tx.id} className="hover-row">
                                    <td className="pl-6 text-muted font-medium">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="flex-center justify-start gap-3">
                                            <div className={`icon-box-sm ${isIncome ? 'green' : 'orange'}`}>
                                                {getCategoryIcon(categoryName)}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-dark">{tx.merchant_name || tx.vendor || tx.description || 'Transaction'}</span>
                                                {tx.payment_reason && (
                                                    <p className="text-xs text-muted mt-1">{tx.payment_reason}</p>
                                                )}
                                                {tx.invoice_no && (
                                                    <p className="text-xs text-muted mt-1">Invoice: {tx.invoice_no}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-pill ${categoryName.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                                            {categoryName}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex-center justify-start gap-2">
                                            <span className={`status-dot-sm ${statusInfo.class}`}></span>
                                            <span className="text-sm font-medium text-dark">{statusInfo.text}</span>
                                        </div>
                                    </td>
                                    <td className={`text-right pr-6 font-bold ${isIncome ? 'text-green' : 'text-red'}`}>
                                        {isIncome ? '+' : '-'}${Math.abs(parseFloat(tx.amount || 0)).toFixed(2)}
                                    </td>
                                    <td className="text-right pr-6">
                                        <button className="btn-icon-ghost" onClick={() => handleDelete(tx.id)}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                    No transactions found. Upload a receipt to get started!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="pagination p-4 border-t">
                    <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
                </div>
            </div>

            {/* Bottom Summary Cards */}
            <div className="grid-3 mt-8">
                <div className="card flex-between">
                    <div>
                        <p className="text-muted text-xs uppercase font-bold">Total Expenses</p>
                        <h2 className="mt-2 text-dark">-${totalExpenses.toFixed(2)}</h2>
                    </div>
                </div>
                <div className="card flex-between">
                    <div>
                        <p className="text-muted text-xs uppercase font-bold">Total Income</p>
                        <h2 className="mt-2 text-dark">+${totalIncome.toFixed(2)}</h2>
                    </div>
                </div>
                <div className="card bg-green-light flex-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-green-dark text-xs uppercase font-bold">AI Categorization</p>
                        <h2 className="mt-2 text-dark">{transactions.filter(t => t.status === 'processed').length} Processed</h2>
                    </div>
                    <div className="bg-shape"></div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
