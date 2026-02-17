import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './TransactionDetail.css';

const TransactionDetail = ({ transactionId, onClose }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransaction(transactionId);
      setTransaction(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch transaction details';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <div className="transaction-detail">
        <div className="loading">Loading transaction details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-detail">
        <div className="error-message">{error}</div>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="transaction-detail">
        <div className="error-message">Transaction not found</div>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="transaction-detail">
      <div className="detail-header">
        <h2>Transaction Details</h2>
        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Overview</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Amount</label>
              <span className={`amount ${transaction.transaction_type}`}>
                {formatAmount(transaction.amount, transaction.transaction_type)}
              </span>
            </div>
            <div className="detail-item">
              <label>Type</label>
              <span className="transaction-type">
                {transaction.transaction_type === 'expense' ? 'Expense' : 'Income'}
              </span>
            </div>
            <div className="detail-item">
              <label>Status</label>
              {getStatusBadge(transaction.status)}
            </div>
            <div className="detail-item">
              <label>Date</label>
              <span>{formatDate(transaction.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Vendor</label>
              <span>{transaction.vendor || 'Not specified'}</span>
            </div>
            {transaction.category && (
              <div className="detail-item">
                <label>Category</label>
                <span className="category">{transaction.category}</span>
              </div>
            )}
          </div>
        </div>

        {transaction.status === 'processed' && transaction.extracted_data && (
          <div className="detail-section">
            <h3>Extracted Information</h3>
            <div className="extracted-data">
              {transaction.extracted_data.text && (
                <div className="extracted-item">
                  <label>Extracted Text</label>
                  <div className="extracted-text">
                    {transaction.extracted_data.text}
                  </div>
                </div>
              )}
              {transaction.extracted_data.confidence && (
                <div className="extracted-item">
                  <label>Confidence Score</label>
                  <span>{Math.round(transaction.extracted_data.confidence * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {transaction.receipt_url && (
          <div className="detail-section">
            <h3>Receipt Image</h3>
            <div className="receipt-image">
              <img
                src={transaction.receipt_url}
                alt="Receipt"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="image-error" style={{ display: 'none' }}>
                Receipt image not available
              </div>
            </div>
          </div>
        )}

        {transaction.status === 'pending' && (
          <div className="detail-section">
            <div className="processing-notice">
              <div className="processing-icon">⏳</div>
              <div>
                <strong>Processing in progress</strong>
                <p>We're analyzing your receipt and extracting the details. This may take a few moments.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetail;
