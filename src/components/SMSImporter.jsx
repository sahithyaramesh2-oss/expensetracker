import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { parseBulkSMS } from '../utils/smsParser';

function SMSImporter() {
    const { addExpense } = useExpenses();
    const [smsText, setSmsText] = useState('');
    const [parsedTransactions, setParsedTransactions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const handleParse = () => {
        if (!smsText.trim()) {
            alert('Please paste SMS messages first');
            return;
        }

        const transactions = parseBulkSMS(smsText);
        if (transactions.length === 0) {
            alert('No valid transactions found. Please check the SMS format.');
            return;
        }

        setParsedTransactions(transactions);
        // Select all by default
        setSelectedIds(new Set(transactions.map((_, idx) => idx)));
    };

    const handleToggleSelect = (idx) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(idx)) {
            newSelected.delete(idx);
        } else {
            newSelected.add(idx);
        }
        setSelectedIds(newSelected);
    };

    const handleImport = () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one transaction');
            return;
        }

        let imported = 0;
        parsedTransactions.forEach((txn, idx) => {
            if (selectedIds.has(idx)) {
                addExpense({
                    title: txn.merchant,
                    amount: txn.amount,
                    category: txn.category,
                    date: txn.date,
                    type: txn.type
                });
                imported++;
            }
        });

        alert(`✅ Successfully imported ${imported} transaction(s)!`);
        setSmsText('');
        setParsedTransactions([]);
        setSelectedIds(new Set());
    };

    const handleClear = () => {
        setSmsText('');
        setParsedTransactions([]);
        setSelectedIds(new Set());
    };

    return (
        <div className="card sms-importer">
            <h3>📱 SMS Transaction Importer</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Paste your bank SMS messages below. The system will automatically extract transaction details.
            </p>

            {parsedTransactions.length === 0 ? (
                <>
                    <textarea
                        value={smsText}
                        onChange={(e) => setSmsText(e.target.value)}
                        placeholder="Paste SMS messages here...&#10;&#10;Example:&#10;Rs.500 debited from A/c **1234 on 31-01-26 at Swiggy&#10;Your A/c X1234 credited with Rs.5000.00 on 31Jan26"
                        rows={10}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.9rem',
                            fontFamily: 'monospace',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn-primary" onClick={handleParse}>
                            🔍 Parse Transactions
                        </button>
                        <button className="btn-secondary" onClick={handleClear}>
                            Clear
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ marginBottom: '1rem' }}>
                        <h4>Found {parsedTransactions.length} transaction(s)</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Review and select transactions to import
                        </p>
                    </div>

                    <div className="transaction-preview" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {parsedTransactions.map((txn, idx) => (
                            <div
                                key={idx}
                                className={`transaction-item ${selectedIds.has(idx) ? 'selected' : ''}`}
                                style={{
                                    padding: '1rem',
                                    marginBottom: '0.5rem',
                                    border: `2px solid ${selectedIds.has(idx) ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: selectedIds.has(idx) ? 'rgba(41, 98, 255, 0.05)' : 'transparent'
                                }}
                                onClick={() => handleToggleSelect(idx)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(idx)}
                                                onChange={() => handleToggleSelect(idx)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <strong>{txn.merchant}</strong>
                                            <span className="tag" style={{ fontSize: '0.75rem' }}>{txn.category}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            {txn.date} {txn.account && `• A/c **${txn.account}`}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            color: txn.type === 'income' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {txn.type === 'income' ? 'Income' : 'Expense'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn-primary" onClick={handleImport}>
                            ✅ Import Selected ({selectedIds.size})
                        </button>
                        <button className="btn-secondary" onClick={handleClear}>
                            ❌ Cancel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default SMSImporter;
