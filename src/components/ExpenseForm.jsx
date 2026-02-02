import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { QRCodeCanvas } from 'qrcode.react';
import QRScanner from './QRScanner';
import PaymentModal from './PaymentModal';

function ExpenseForm() {
    const { categories, addExpense, checkBudgetSafety, accounts } = useExpenses();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [txnType, setTxnType] = useState('expense'); // expense, income, transfer
    const [accountId, setAccountId] = useState('acc_bank');
    const [warning, setWarning] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [paymentModalData, setPaymentModalData] = useState(null);

    const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Cashback', 'Other'];
    const REFUND_CATEGORIES = ['Lent to Friend', 'Product Return', 'Security Deposit', 'Loan', 'Other'];

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
            type: 'expense',
            accountId
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

        setTxnType('transfer');
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

        const result = addExpense({
            title,
            amount: parseFloat(amount),
            category: txnType === 'transfer' ? 'Transfer/Payment' : category,
            date,
            type: txnType,
            accountId
        });

        if (result && !result.success) {
            alert(result.message);
            return;
        }

        setTitle('');
        setAmount('');
        setWarning(null);
        // Only reset to expense if it was a transfer or refund (which are usually one-offs)
        if (txnType === 'transfer' || txnType === 'refund') setTxnType('expense');

        alert(`${txnType.charAt(0).toUpperCase() + txnType.slice(1)} added successfully!`);
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
                        className={`toggle-btn ${txnType === 'expense' ? 'active' : ''}`}
                        onClick={() => {
                            setTxnType('expense');
                            setCategory('Food');
                        }}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${txnType === 'income' ? 'active' : ''}`}
                        onClick={() => {
                            setTxnType('income');
                            setCategory('Salary');
                        }}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${txnType === 'transfer' ? 'active' : ''}`}
                        onClick={() => setTxnType('transfer')}
                    >
                        Transfer
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${txnType === 'refund' ? 'active' : ''}`}
                        onClick={() => {
                            setTxnType('refund');
                            setCategory('Lent to Friend');
                        }}
                    >
                        Refund
                    </button>
                </div>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label htmlFor="title">{txnType === 'transfer' ? 'Pay To (UPI ID or Name)' : 'Title'}</label>
                        {txnType === 'transfer' && (
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
                        placeholder={txnType === 'transfer' ? "e.g. merchant@upi" : txnType === 'income' ? "e.g. Salary, Gift" : txnType === 'refund' ? "e.g. Lent to John" : "What did you spend on?"}
                        required
                    />
                </div>

                {/* Receiver Preview Logic (Keep Existing Code) */}
                {txnType === 'transfer' && title.includes('@') && amount > 0 && (
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
                    {txnType !== 'transfer' && (
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {txnType === 'expense' ? categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                )) : txnType === 'income' ? INCOME_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                )) : REFUND_CATEGORIES.map(cat => (
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
                    <label>Payment Account</label>
                    <div className="account-selector" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {accounts.map(acc => (
                            <button
                                key={acc.id}
                                type="button"
                                className={`account-chip ${accountId === acc.id ? 'active' : ''}`}
                                onClick={() => setAccountId(acc.id)}
                                style={{
                                    border: `1px solid ${accountId === acc.id ? acc.color : 'var(--border-color)'}`,
                                    color: accountId === acc.id ? acc.color : 'var(--text-muted)',
                                    background: accountId === acc.id ? `${acc.color}15` : 'transparent',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {acc.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="date">Transaction Date</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className={`btn-primary ${txnType === 'transfer' ? 'btn-transfer' : txnType === 'income' ? 'btn-income' : txnType === 'refund' ? 'btn-refund' : ''}`}>
                    {txnType === 'transfer' ? 'Make Transfer' : txnType === 'income' ? 'Add Income' : txnType === 'refund' ? 'Track Refund' : 'Add Expense'}
                </button>
            </form>
        </>
    );
}

export default ExpenseForm;
