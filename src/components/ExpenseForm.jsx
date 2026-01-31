import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { QRCodeCanvas } from 'qrcode.react';
import QRScanner from './QRScanner';
import PaymentModal from './PaymentModal';

function ExpenseForm() {
    const { addExpense, checkBudgetSafety, categories } = useExpenses();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isTransfer, setIsTransfer] = useState(false);
    const [warning, setWarning] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [paymentModalData, setPaymentModalData] = useState(null);

    // Parse UPI URL
    const parseUPI = (url) => {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            const pa = params.get('pa'); // Payee Address (ID)
            const pn = params.get('pn'); // Payee Name
            const am = params.get('am'); // Amount

            if (pa) {
                // Detected valid UPI
                const payData = {
                    title: pn || pa,
                    amount: am || '',
                    upiString: url,
                    pa,
                    pn
                };
                setPaymentModalData(payData);
                setShowScanner(false);
            } else {
                alert("Invalid UPI QR Code");
                setShowScanner(false);
            }
        } catch (e) {
            // Fallback for non-standard UPI strings
            if (url.includes('pa=')) {
                // Manual parse attempt
                const paMatch = url.match(/pa=([^&]+)/);
                const pnMatch = url.match(/pn=([^&]+)/);
                const amMatch = url.match(/am=([^&]+)/);

                if (paMatch) {
                    const payData = {
                        title: decodeURIComponent(pnMatch ? pnMatch[1] : paMatch[1]),
                        amount: amMatch ? amMatch[1] : '',
                        upiString: url,
                        pa: paMatch[1],
                        pn: pnMatch ? pnMatch[1] : ''
                    };
                    setPaymentModalData(payData);
                    setShowScanner(false);
                }
            } else {
                alert("Could not detect UPI details.");
                setShowScanner(false);
            }
        }
    };

    const handlePayNow = () => {
        if (!paymentModalData) return;
        const { title, amount, upiString } = paymentModalData;

        // Auto-save expense
        addExpense({
            title: title || 'UPI Payment',
            amount: parseFloat(amount) || 0,
            category: 'Bills', // Default for UPI
            date: new Date().toISOString().split('T')[0],
            type: 'expense'
        });

        // Trigger UPI Intent
        window.location.href = upiString;

        // Reset
        setPaymentModalData(null);
        alert('Payment initiated & Expense recorded!');
    };

    const handleRecordOnly = () => {
        if (!paymentModalData) return;
        const { title, amount } = paymentModalData;

        setIsTransfer(true);
        setTitle(title);
        setAmount(amount);
        // Validate amount for budget safety
        handleAmountChange({ target: { value: amount } });

        setPaymentModalData(null);
    };

    // Real-time warning check
    const handleAmountChange = (e) => {
        const val = e.target.value;
        setAmount(val);
        if (val) {
            const safety = checkBudgetSafety(parseFloat(val));
            if (!safety.isSafe) {
                setWarning(safety.message);
            } else {
                setWarning(null);
            }
        } else {
            setWarning(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !amount) return;

        addExpense({
            title,
            amount: parseFloat(amount),
            category: isTransfer ? 'Transfer/Payment' : category,
            date,
            type: isTransfer ? 'transfer' : 'expense'
        });

        setTitle('');
        setAmount('');
        setWarning(null);
        if (isTransfer) setIsTransfer(false);
    };

    return (
        <>
            {showScanner && <QRScanner onScanSuccess={parseUPI} onClose={() => setShowScanner(false)} />}

            {paymentModalData && (
                <PaymentModal
                    data={paymentModalData}
                    onPay={handlePayNow}
                    onRecordOnly={handleRecordOnly}
                    onCancel={() => setPaymentModalData(null)}
                />
            )}

            <form className={`expense-form ${warning ? 'form-warning' : ''}`} onSubmit={handleSubmit}>
                <div className="form-toggle">
                    <button
                        type="button"
                        className={`toggle-btn ${!isTransfer ? 'active' : ''}`}
                        onClick={() => setIsTransfer(false)}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${isTransfer ? 'active' : ''}`}
                        onClick={() => setIsTransfer(true)}
                    >
                        Payment / Transfer
                    </button>
                </div>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label htmlFor="title">{isTransfer ? 'Pay To (UPI ID or Name)' : 'Title'}</label>
                        {isTransfer && (
                            <button
                                type="button"
                                className="btn-text"
                                style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}
                                onClick={() => setShowScanner(true)}
                            >
                                📷 Scan QR
                            </button>
                        )}
                    </div>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={isTransfer ? "e.g. merchant@upi" : "What did you spend on?"}
                        required
                    />
                </div>

                {/* Receiver Preview Logic (Keep Existing Code) */}
                {isTransfer && title.includes('@') && amount > 0 && (
                    <div className="upi-preview" style={{ textAlign: 'center', margin: '1rem 0', background: 'white', padding: '1rem', borderRadius: '8px' }}>
                        <QRCodeCanvas
                            value={`upi://pay?pa=${title}&pn=Merchant&am=${amount}&cu=INR`}
                            size={128}
                        />
                        <p style={{ color: 'black', marginTop: '0.5rem', fontSize: '0.8rem' }}>Scan to Pay</p>

                        <a
                            href={`upi://pay?pa=${title}&pn=Merchant&am=${amount}&cu=INR`}
                            className="btn-primary"
                            style={{ display: 'block', textDecoration: 'none', marginTop: '0.5rem', background: '#2962ff' }}
                        >
                            Open Payment App
                        </a>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="amount">Amount</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            className={warning ? 'input-warning' : ''}
                        />
                    </div>
                    {!isTransfer && (
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {warning && (
                    <div className="warning-box">
                        ⚠️ {warning}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className={`btn-primary ${isTransfer ? 'btn-transfer' : ''}`}>
                    {isTransfer ? 'Make Transfer' : 'Add Expense'}
                </button>
            </form>
        </>
    );
}

export default ExpenseForm;
