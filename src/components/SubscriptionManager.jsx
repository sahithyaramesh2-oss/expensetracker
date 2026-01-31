import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';

function SubscriptionManager() {
    const { subscriptions, addSubscription, deleteSubscription, paySubscription, formatCurrency } = useExpenses();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    // const [date, setDate] = useState('1'); // Day of month

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !amount) return;
        addSubscription({ title, amount: parseFloat(amount) });
        setTitle('');
        setAmount('');
    };

    return (
        <div className="card subscription-card">
            <h3>Recurring Subscriptions</h3>

            <form onSubmit={handleSubmit} className="sub-form">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Service (e.g. Netflix)" required
                />
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amount" required
                />
                <button type="submit" className="btn-icon add-sub-btn">+</button>
            </form>

            <div className="sub-list">
                {!subscriptions.length && <p className="empty-sub">No subscriptions added.</p>}
                {subscriptions.map(sub => (
                    <div key={sub.id} className="sub-item">
                        <div className="sub-info">
                            <span className="sub-title">{sub.title}</span>
                            <span className="sub-amount">{formatCurrency(sub.amount)}</span>
                        </div>
                        <div className="sub-actions">
                            <button
                                className="btn-pay"
                                onClick={() => paySubscription(sub)}
                                title="Pay now (Add to expenses)"
                            >
                                Pay
                            </button>
                            <button
                                className="btn-icon delete-btn"
                                onClick={() => deleteSubscription(sub.id)}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SubscriptionManager;
