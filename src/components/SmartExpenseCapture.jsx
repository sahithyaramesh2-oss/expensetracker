import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { parseBulkSMS } from '../utils/smsParser';
import { getSmartSuggestions } from '../utils/suggestionEngine';

const SmartExpenseCapture = () => {
    const { addExpense, categories, formatCurrency, checkBudgetSafety, expenses } = useExpenses();

    const [mode, setMode] = useState('menu'); // menu, sms, suggestions
    const [capturedData, setCapturedData] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [smsText, setSmsText] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Load suggestions when mode is 'suggestions' or 'menu'
    useEffect(() => {
        if (mode === 'suggestions' || mode === 'menu') {
            setSuggestions(getSmartSuggestions(expenses));
        }
    }, [mode, expenses]);


    const handleSMSParse = () => {
        const txns = parseBulkSMS(smsText);
        if (txns.length > 0) {
            const txn = txns[0]; // Take the first one for the unified capture flow
            setCapturedData({
                ...txn,
                title: txn.merchant,
                tags: ['Auto-recorded', 'SMS-Parse']
            });
            setIsConfirming(true);
            setSmsText('');
        } else {
            alert("No valid transaction found in SMS.");
        }
    };

    const handleSuggestionClick = (sug) => {
        setCapturedData({
            title: sug.merchant,
            merchant: sug.merchant,
            amount: sug.suggestedAmount,
            category: sug.category,
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            tags: ['Auto-recorded', 'Habit-Suggestion']
        });
        setIsConfirming(true);
    };


    const saveExpense = () => {
        const result = addExpense(capturedData);
        if (result && !result.success) {
            alert(result.message);
        } else {
            setIsConfirming(false);
            setCapturedData(null);
            alert("Expense recorded successfully!");
        }
    };

    const renderConfirmation = () => (
        <div className="modal-overlay">
            <div className="card confirmation-modal">
                <h3>Review Expense</h3>
                <div className="form-group">
                    <label>Merchant</label>
                    <input
                        type="text"
                        value={capturedData.merchant}
                        onChange={(e) => setCapturedData({ ...capturedData, merchant: e.target.value, title: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Amount</label>
                    <input
                        type="number"
                        value={capturedData.amount}
                        onChange={(e) => setCapturedData({ ...capturedData, amount: parseFloat(e.target.value) })}
                    />
                </div>
                <div className="form-group">
                    <label>Category</label>
                    <select
                        value={capturedData.category}
                        onChange={(e) => setCapturedData({ ...capturedData, category: e.target.value })}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Notes (Optional)</label>
                    <textarea
                        value={capturedData.notes || ''}
                        onChange={(e) => setCapturedData({ ...capturedData, notes: e.target.value })}
                    />
                </div>

                {checkBudgetSafety(capturedData.amount).message !== "Safe to spend." && (
                    <div className="alert-warning" style={{ margin: '1rem 0', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        ⚠️ {checkBudgetSafety(capturedData.amount).message}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-primary" onClick={saveExpense}>Confirm & Save</button>
                    <button className="btn-secondary" onClick={() => setIsConfirming(false)}>Cancel</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="smart-capture">
            {isConfirming && capturedData && renderConfirmation()}

            <div className="capture-modes">
                <button
                    className={`mode-btn ${mode === 'sms' ? 'active' : ''}`}
                    onClick={() => setMode(mode === 'sms' ? 'menu' : 'sms')}
                >
                    📱 Add via SMS
                </button>
                <button
                    className={`mode-btn ${mode === 'suggestions' ? 'active' : ''}`}
                    onClick={() => setMode(mode === 'suggestions' ? 'menu' : 'suggestions')}
                >
                    ✨ Smart Suggestions
                </button>
            </div>

            <div className="capture-content">

                {mode === 'sms' && (
                    <div className="card">
                        <h4>Paste Transaction SMS</h4>
                        <textarea
                            rows="5"
                            placeholder="Example: Rs.500 debited from A/c... at Swiggy"
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                        />
                        <button className="btn-primary" onClick={handleSMSParse} style={{ marginTop: '1rem' }}>
                            Process SMS
                        </button>
                    </div>
                )}

                {(mode === 'suggestions' || mode === 'menu') && suggestions.length > 0 && (
                    <div className="suggestions-list">
                        <h4>{mode === 'suggestions' ? 'Top Suggestions' : 'Quick Suggestions'}</h4>
                        {suggestions.map((sug, i) => (
                            <div key={i} className="card suggestion-card" onClick={() => handleSuggestionClick(sug)}>
                                <div className="suggestion-info">
                                    <strong>{sug.merchant}</strong>
                                    <span>{sug.category}</span>
                                    <p>{sug.message}</p>
                                </div>
                                <div className="suggestion-amount">
                                    {formatCurrency(sug.suggestedAmount)}
                                    <button className="btn-sm">Add</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .smart-capture {
                    padding: 1rem;
                }
                .capture-modes {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                }
                .mode-btn {
                    padding: 0.75rem 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    background: var(--card-bg);
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    alignItems: center;
                    gap: 0.5rem;
                }
                .mode-btn.active {
                    background: var(--accent-color);
                    color: white;
                    border-color: var(--accent-color);
                }
                .suggestion-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                    margin-bottom: 0.5rem;
                }
                .suggestion-card:hover {
                    transform: translateX(5px);
                }
                .suggestion-info strong {
                    display: block;
                }
                .suggestion-info span {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .suggestion-info p {
                    margin: 0.25rem 0 0;
                    font-size: 0.8rem;
                }
                .suggestion-amount {
                    text-align: right;
                    font-weight: bold;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .btn-sm {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.7rem;
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    border-radius: 4px;
                }
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000;
                    padding: 1rem;
                }
                .confirmation-modal {
                    width: 100%;
                    max-width: 400px;
                    padding: 2rem;
                }
                .form-group {
                    margin-bottom: 1rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-color);
                    color: var(--text-color);
                }
                .modal-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-top: 2rem;
                }
            `}</style>
        </div>
    );
};

export default SmartExpenseCapture;
