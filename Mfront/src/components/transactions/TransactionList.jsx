import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './TransactionList.css';

const TransactionList = ({ onTransactionSelect }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransactions();
      setTransactions(data.transactions || data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch transactions';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'pending') return transaction.status === 'pending';
    if (filter === 'processed') return transaction.status === 'processed';
    if (filter === 'expense') return transaction.transaction_type === 'expense';
    if (filter === 'income') return transaction.transaction_type === 'income';
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    
    return type === 'expense' ? `-${formatted}` : formatted;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: 'Processing' },
      processed: { class: 'status-processed', text: 'Completed' },
      failed: { class: 'status-failed', text: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="transaction-list">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-list">
        <div className="error-message">{error}</div>
        <button onClick={fetchTransactions} className="btn btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <div className="list-header">
        <h3>Transactions</h3>
        <div className="filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Transactions</option>
            <option value="pending">Processing</option>
            <option value="processed">Completed</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
          <small>Upload a receipt to get started</small>
        </div>
      ) : (
        <div className="transactions-grid">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="transaction-card"
              onClick={() => onTransactionSelect && onTransactionSelect(transaction)}
            >
              <div className="transaction-header">
                <div className="transaction-amount">
                  <span className={`amount ${transaction.transaction_type}`}>
                    {formatAmount(transaction.amount, transaction.transaction_type)}
                  </span>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="transaction-date">
                  {formatDate(transaction.created_at)}
                </div>
              </div>

              <div className="transaction-details">
                <div className="vendor">
                  {transaction.vendor || 'Unknown Vendor'}
                </div>
                {transaction.category && (
                  <div className="category">{transaction.category}</div>
                )}
              </div>

              {transaction.receipt_url && (
                <div className="receipt-thumbnail">
                  <img
                    src={transaction.receipt_url}
                    alt="Receipt"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
