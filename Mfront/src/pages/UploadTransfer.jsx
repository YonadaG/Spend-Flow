import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { FaCloudUploadAlt, FaChevronDown, FaCheckCircle, FaShieldAlt, FaMagic, FaSync, FaSpinner, FaFileAlt } from 'react-icons/fa';
import { transactionAPI, categoryAPI, ocrAPI } from '../services/api';
import './UploadTransfer.css';

const UploadTransfer = () => {
    const navigate = useNavigate();
    const { success, error: toastError, info } = useToast();
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [categories, setCategories] = useState([]);

    // Form fields
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('');
    const [memo, setMemo] = useState('');
    const [vendor, setVendor] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const [ocrData, setOcrData] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryAPI.getAll();
                setCategories(data);
                if (data.length > 0) {
                    setCategoryId(data[0].id);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            await runOcrPreview(file);
        }
    };

    const runOcrPreview = async (file) => {
        setProcessing(true);
        try {
            const result = await ocrAPI.preview(file);

            // Store the complete parsed data
            if (result.raw_text) {
                setExtractedText(result.raw_text);
            }

            // Auto-fill form with extracted data from structured response
            if (result.amount) {
                setAmount(result.amount);
            }

            if (result.merchant_name) {
                setVendor(result.merchant_name);
            }

            if (result.payment_date) {
                try {
                    const parsedDate = new Date(result.payment_date);
                    if (!isNaN(parsedDate.getTime())) {
                        setDate(parsedDate.toISOString().split('T')[0]);
                    }
                } catch (e) {
                    // Keep current date if parsing fails
                }
            }

            // Auto-fill memo/payment reason
            if (result.payment_reason) {
                setMemo(result.payment_reason);
            }

            // Handle category auto-detection and creation
            if (result.category_name) {
                // Find or create category
                const existingCat = categories.find(c => c.name.toLowerCase() === result.category_name.toLowerCase());
                if (existingCat) {
                    setCategoryId(existingCat.id);
                } else {
                    // Refresh categories to see if new one was created
                    const updatedCats = await categoryAPI.getAll();
                    setCategories(updatedCats);
                    const newCat = updatedCats.find(c => c.name.toLowerCase() === result.category_name.toLowerCase());
                    if (newCat) {
                        setCategoryId(newCat.id);
                    }
                }
            }

            // Store the complete OCR data for submission
            setOcrData({
                invoice_no: result.invoice_no,
                source: result.source,
                payer_name: result.payer_name,
                payment_channel: result.payment_channel,
                status: result.status,
                currency: result.currency || 'ETB',
                category_name: result.category_name
            });

            info('Receipt scanned successfully!');
        } catch (error) {
            console.error("OCR Preview failed:", error);
            const errorMessage = error.response?.data?.error || 'OCR processing failed. Please fill in details manually.';
            toastError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            await runOcrPreview(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            toastError('Please select a file to upload');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toastError('Please enter a valid amount');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();

            // Attach the receipt image
            formData.append('transaction[receipt_image]', selectedFile);

            // Add transaction fields matching backend schema
            formData.append('transaction[amount]', parseFloat(amount));
            formData.append('transaction[merchant_name]', vendor || '');
            formData.append('transaction[occurred_at]', date);
            formData.append('transaction[transaction_type]', 'expense');
            formData.append('transaction[direction]', 'debit');

            // Use currency from OCR data or default
            const currency = ocrData?.currency || 'ETB';
            formData.append('transaction[currency]', currency);

            // Use user_category for auto-categorization
            const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
            if (selectedCategory) {
                formData.append('transaction[user_category]', selectedCategory.name);
            } else if (ocrData?.category_name) {
                formData.append('transaction[user_category]', ocrData.category_name);
            }

            // Store memo/payment reason
            if (memo) {
                formData.append('transaction[payment_reason]', memo);
            }

            // Store extracted OCR text
            if (extractedText) {
                formData.append('transaction[raw_text]', extractedText);
            }

            // Add all OCR-extracted fields
            if (ocrData) {
                if (ocrData.invoice_no) formData.append('transaction[invoice_no]', ocrData.invoice_no);
                if (ocrData.source) formData.append('transaction[source]', ocrData.source);
                if (ocrData.payer_name) formData.append('transaction[payer_name]', ocrData.payer_name);
                if (ocrData.payment_channel) formData.append('transaction[payment_channel]', ocrData.payment_channel);
                if (ocrData.status) formData.append('transaction[status]', ocrData.status);
            }

            await transactionAPI.create(formData);
            success('Transaction saved successfully!');
            navigate('/transactions');
        } catch (error) {
            console.error("Upload failed:", error);
            const errorMsg = error.response?.data?.errors?.join(', ') || 'Upload failed. Please try again.';
            toastError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setMemo('');
        setVendor('');
        setExtractedText('');
        setOcrData(null);
        setCategoryId(categories.length > 0 ? categories[0].id : '');
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <div className="breadcrumbs">Transfers &gt; Upload & Categorize</div>
                <h1>Upload & Categorize Transfer</h1>
                <p className="subtitle">Upload your receipt. AI will extract details automatically.</p>
            </div>

            <div className="upload-grid">
                {/* Left Column: Upload Area */}
                <div className="upload-area">
                    <div
                        className="dashed-zone"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {processing ? (
                            <>
                                <div className="icon-circle-green">
                                    <FaSpinner className="spin" />
                                </div>
                                <h3>Processing with OCR...</h3>
                                <p>Extracting text from your receipt</p>
                            </>
                        ) : selectedFile ? (
                            <>
                                <div className="icon-circle-green">
                                    <FaFileAlt />
                                </div>
                                <h3>File Ready</h3>
                                <p>{selectedFile.name}</p>
                                <button className="btn btn-secondary" onClick={() => {
                                    setSelectedFile(null);
                                    setExtractedText('');
                                    handleReset();
                                }}>Change File</button>
                            </>
                        ) : (
                            <>
                                <div className="icon-circle-green">
                                    <FaCloudUploadAlt />
                                </div>
                                <h3>Upload receipt image</h3>
                                <p>Drag and drop your receipt here, or click to browse. Supported: PNG, JPG, PDF.</p>
                                <button className="btn btn-primary" onClick={handleBrowseClick}>Browse Files</button>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept=".png,.jpg,.jpeg,.pdf"
                        />
                    </div>

                    {/* Extracted Text Display */}
                </div>

                {/* Right Column: Transaction Details Form */}
                <div className="verify-card">
                    <div className="flex-between mb-6">
                        <h3>Transaction Details</h3>
                        <span className="badge-ai"><FaMagic /> AI POWERED</span>
                    </div>

                    <div className="form-group">
                        <div className="flex-between">
                            <label>Vendor/Merchant</label>
                            {vendor && <span className="badge-autofilled">AUTO-FILLED</span>}
                        </div>
                        <input
                            type="text"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            placeholder="e.g., Shell Gas Station"
                        />
                    </div>

                    <div className="form-group">
                        <div className="flex-between">
                            <label>Amount</label>
                            {amount && <span className="badge-autofilled">AUTO-FILLED</span>}
                        </div>
                        <div className="input-with-symbol">
                            <span className="currency-symbol">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input-lg"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <div className="input-with-icon">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="flex-between">
                            <label>Category</label>
                            {categoryId && <span className="badge-autofilled">AUTO-DETECTED</span>}
                        </div>
                        <div className="select-wrapper">
                            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <FaChevronDown className="select-arrow" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                            rows="2"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="Add a note..."
                        ></textarea>
                    </div>

                    <button
                        className="btn btn-primary w-full mt-4 flex-center gap-2"
                        onClick={handleSubmit}
                        disabled={uploading || !selectedFile || processing}
                    >
                        {uploading ? (
                            <><FaSpinner className="spin" /> Saving...</>
                        ) : (
                            <><FaCheckCircle /> Confirm & Save</>
                        )}
                    </button>

                    <button className="btn-link-center mt-4" onClick={handleReset}>Reset Form</button>
                </div>
            </div>

            {/* Structured Data Summary - MOVED UP */}
            {ocrData && (
                <div className="card mt-8">
                    <div className="flex-between mb-6">
                        <h3 className="flex-center gap-2 text-lg font-semibold text-gray-800">
                            <FaMagic className="text-purple-500" />
                            Structured Receipt Data
                        </h3>
                        <span className="badge-ai"><FaCheckCircle /> AUTO-EXTRACTED</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ocrData.invoice_no && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Invoice Number</p>
                                <p className="text-sm font-bold text-gray-800">{ocrData.invoice_no}</p>
                            </div>
                        )}
                        {ocrData.source && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment Source</p>
                                <p className="text-sm font-bold text-gray-800">{ocrData.source}</p>
                            </div>
                        )}
                        {ocrData.payer_name && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payer Name</p>
                                <p className="text-sm font-bold text-gray-800">{ocrData.payer_name}</p>
                            </div>
                        )}
                        {ocrData.payment_channel && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment Channel</p>
                                <p className="text-sm font-bold text-gray-800">{ocrData.payment_channel}</p>
                            </div>
                        )}
                        {ocrData.status && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Transaction Status</p>
                                <p className="text-sm font-bold text-gray-800">{ocrData.status}</p>
                            </div>
                        )}
                        {ocrData.currency && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Currency</p>
                                <p className="text-sm font-bold text-gray-800">{ocrData.currency}</p>
                            </div>
                        )}
                        {ocrData.category_name && (
                            <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                                <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Auto-Category</p>
                                <p className="text-sm font-bold text-purple-800">{ocrData.category_name}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600">
                            <FaShieldAlt className="inline mr-1" />
                            All this data will be automatically saved with your transaction for better tracking and categorization.
                        </p>
                    </div>
                </div>
            )}

            {/* Extracted Text Section - MOVED DOWN */}
            <div className={`card mt-8 ${extractedText ? 'bg-white' : 'bg-gray-50 border-2 border-dashed border-gray-200 shadow-none'}`}>
                <div className="flex-between mb-4">
                    <h3 className="flex-center gap-2 text-lg font-semibold text-gray-800">
                        <FaMagic className="text-purple-500" />
                        Extracted Receipt Text
                    </h3>
                    {extractedText && (
                        <button
                            className="btn btn-secondary sm"
                            onClick={() => {
                                navigator.clipboard.writeText(extractedText);
                                success('Copied to clipboard!');
                            }}
                        >
                            Copy Text
                        </button>
                    )}
                </div>

                {extractedText ? (
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                        <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                            {extractedText}
                        </pre>
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 text-gray-400">
                        <div className="mb-2 text-4xl opacity-20"><FaFileAlt /></div>
                        <p>Upload a receipt image to view the scanned text here.</p>
                        <p className="text-xs mt-2 opacity-70">Our AI will read merchant names, dates, amounts, and descriptions automatically.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadTransfer;
