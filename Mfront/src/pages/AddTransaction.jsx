import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaDollarSign, FaCalendar, FaTag, FaFileAlt, FaStore } from 'react-icons/fa';
import { transactionAPI, categoryAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './AddTransaction.css';

const LOCAL_SETTINGS_KEY = 'expense_tracker_settings';

const getPreferredCurrency = () => {
    if (typeof window === 'undefined') return 'ETB';

    try {
        const rawSettings = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (!rawSettings) return 'ETB';

        const parsedSettings = JSON.parse(rawSettings);
        const savedCurrency = parsedSettings?.currency;

        if (['USD', 'EUR', 'GBP', 'ETB', 'KES'].includes(savedCurrency)) {
            return savedCurrency;
        }
    } catch (error) {
        console.error('Failed to parse local settings for currency:', error);
    }

    return 'ETB';
};

const AddTransaction = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [amount, setAmount] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [paymentReason, setPaymentReason] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);
    const [transactionType, setTransactionType] = useState('expense');
    const [currency, setCurrency] = useState(() => getPreferredCurrency());
    const [invoiceNo, setInvoiceNo] = useState('');
    const [paymentChannel, setPaymentChannel] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryAPI.getAll();
                setCategories(data);
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            showError('Please enter a valid amount');
            return;
        }
        if (!merchantName.trim()) {
            showError('Please enter a merchant/vendor name');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                transaction: {
                    amount: parseFloat(amount),
                    merchant_name: merchantName.trim(),
                    payment_reason: paymentReason.trim(),
                    occurred_at: occurredAt,
                    transaction_type: transactionType,
                    direction: transactionType === 'income' ? 'credit' : 'debit',
                    currency: currency,
                    invoice_no: invoiceNo.trim(),
                    payment_channel: paymentChannel,
                    source: 'manual',
                    status: 'processed',
                    category_id: categoryId || undefined
                }
            };

            await transactionAPI.createManual(payload);
            success('Transaction added successfully!');
            navigate('/transactions');
        } catch (err) {
            console.error('Error creating transaction:', err);
            const errorMsg = err.response?.data?.errors?.[0] || 'Failed to create transaction. Please try again.';
            showError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-tx-container">
            <Link to="/transactions" className="add-tx-back">
                <FaArrowLeft /> Back to Transactions
            </Link>

            <div className="add-tx-header">
                <h1>Add Manual Transaction</h1>
                <p>Record a transaction without uploading a receipt.</p>
            </div>

            <div className="add-tx-card">
                <form onSubmit={handleSubmit}>
                    {/* Transaction Type Toggle */}
                    <div className="add-tx-type-toggle">
                        <button
                            type="button"
                            className={`type-btn ${transactionType === 'expense' ? 'active expense' : ''}`}
                            onClick={() => setTransactionType('expense')}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className={`type-btn ${transactionType === 'income' ? 'active income' : ''}`}
                            onClick={() => setTransactionType('income')}
                        >
                            Income
                        </button>
                    </div>

                    <div className="add-tx-form-row">
                        {/* Amount */}
                        <div className="add-tx-form-group full">
                            <label><FaDollarSign className="label-icon" /> Amount</label>
                            <div className="amount-input-wrapper">
                                <span className="amount-currency">{currency}</span>
                                <input
                                    type="number"
                                    className="add-tx-input amount-input"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>

                    <div className="add-tx-form-row two-col">
                        {/* Merchant Name */}
                        <div className="add-tx-form-group">
                            <label><FaStore className="label-icon" /> Merchant / Vendor</label>
                            <input
                                type="text"
                                className="add-tx-input"
                                placeholder="e.g., BGS, EEu, shola"
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                            />
                        </div>

                        {/* Category */}
                        <div className="add-tx-form-group">
                            <label><FaTag className="label-icon" /> Category</label>
                            <select
                                className="add-tx-input"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="add-tx-form-row two-col">
                        {/* Date */}
                        <div className="add-tx-form-group">
                            <label><FaCalendar className="label-icon" /> Date</label>
                            <input
                                type="date"
                                className="add-tx-input"
                                value={occurredAt}
                                onChange={(e) => setOccurredAt(e.target.value)}
                            />
                        </div>

                        {/* Payment Channel */}
                        <div className="add-tx-form-group">
                            <label>Payment Method</label>
                            <select
                                className="add-tx-input"
                                value={paymentChannel}
                                onChange={(e) => setPaymentChannel(e.target.value)}
                            >
                                <option value="">Select method</option>
                                <option value="cash">Cash</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="mobile_payment">Mobile Payment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="add-tx-form-row two-col">
                        {/* Invoice Number */}
                        <div className="add-tx-form-group">
                            <label>Invoice / Reference No.</label>
                            <input
                                type="text"
                                className="add-tx-input"
                                placeholder="Optional"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                            />
                        </div>

                        {/* Currency */}
                        <div className="add-tx-form-group">
                            <label>Currency</label>
                            <select
                                className="add-tx-input"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="ETB">ETB - Ethiopian Birr</option>
                                <option value="KES">KES - Kenyan Shilling</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="add-tx-form-group">
                        <label><FaFileAlt className="label-icon" /> Description / Notes</label>
                        <textarea
                            className="add-tx-textarea"
                            placeholder="What was this transaction for?"
                            value={paymentReason}
                            onChange={(e) => setPaymentReason(e.target.value)}
                            rows="3"
                        />
                    </div>

                    {/* Actions */}
                    <div className="add-tx-actions">
                        <button
                            type="button"
                            className="add-tx-cancel"
                            onClick={() => navigate('/transactions')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="add-tx-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (
                                <>
                                    <FaPlus /> Save Transaction
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransaction;
