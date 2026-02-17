import React, { useState, useRef } from 'react';
import { uploadReceipt } from '../../services/api';
import './ReceiptUpload.css';

const ReceiptUpload = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'expense',
    vendor: '',
    receipt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setFormData(prev => ({
        ...prev,
        receipt: file,
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.receipt) {
      setError('Please select a receipt image');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('transaction[amount]', formData.amount);
      uploadFormData.append('transaction[transaction_type]', formData.transaction_type);
      uploadFormData.append('transaction[vendor]', formData.vendor);
      uploadFormData.append('transaction[receipt]', formData.receipt);

      const response = await uploadReceipt(uploadFormData);

      if (onUploadSuccess) {
        onUploadSuccess(response);
      }

      // Reset form
      setFormData({
        amount: '',
        transaction_type: 'expense',
        vendor: '',
        receipt: null,
      });
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload receipt';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const removePreview = () => {
    setPreview(null);
    setFormData(prev => ({
      ...prev,
      receipt: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="receipt-upload">
      <h3>Upload Receipt</h3>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="transaction_type">Type</label>
            <select
              id="transaction_type"
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="vendor">Vendor (Optional)</label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            placeholder="Store name, restaurant, etc."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="receipt">Receipt Image</label>
          <input
            ref={fileInputRef}
            type="file"
            id="receipt"
            name="receipt"
            onChange={handleFileChange}
            accept="image/*"
            required
            disabled={loading}
          />
          <small>Supported formats: JPG, PNG, GIF. Max size: 5MB</small>
        </div>

        {preview && (
          <div className="image-preview">
            <div className="preview-container">
              <img src={preview} alt="Receipt preview" />
              <button
                type="button"
                className="remove-preview"
                onClick={removePreview}
                disabled={loading}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Receipt'}
        </button>
      </form>
    </div>
  );
};

export default ReceiptUpload;
