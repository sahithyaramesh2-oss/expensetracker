import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';

function BudgetSettings() {
    const { budget, updateBudget, formatCurrency, accounts, updateAccountBalance } = useExpenses();
    const [reserved, setReserved] = useState(budget.reserved);
    const [isEditing, setIsEditing] = useState(false);
    const [tempBalances, setTempBalances] = useState({});

    useEffect(() => {
        setReserved(budget.reserved);
        const balances = {};
        accounts.forEach(acc => {
            balances[acc.id] = acc.balance;
        });
        setTempBalances(balances);
    }, [budget, accounts]);

    const handleSave = () => {
        updateBudget({ ...budget, reserved: parseFloat(reserved) });
        // Save balances
        Object.keys(tempBalances).forEach(accId => {
            updateAccountBalance(accId, tempBalances[accId]);
        });
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className="budget-settings-view">
                <div className="card budget-summary-card">
                    <div className="budget-header">
                        <h3>Monthly Plan</h3>
                        <button className="btn-text" onClick={() => setIsEditing(true)}>Edit</button>
                    </div>
                    <div className="budget-details">
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Your available balance is now calculated automatically: (Income - Expenses).
                        </p>
                        <div className="budget-item reserved">
                            <span>Reserved for EMI/Bills</span>
                            <span className="val" style={{ color: 'var(--accent-color)' }}>{formatCurrency(budget.reserved)}</span>
                        </div>
                    </div>
                </div>

                <div className="card accounts-config-card" style={{ marginTop: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Pocket Balances</h3>
                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                        {accounts.map(acc => (
                            <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: acc.color }} />
                                    <span>{acc.name}</span>
                                </div>
                                <span style={{ fontWeight: 'bold' }}>{formatCurrency(acc.balance)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card budget-edit-card">
            <h3>Configure Initial Balances</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Set your current opening balances for each account.
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {accounts.map(acc => (
                    <div className="form-group" key={acc.id}>
                        <label>{acc.name} Opening Balance (₹)</label>
                        <input
                            type="number"
                            value={tempBalances[acc.id] || 0}
                            onChange={(e) => setTempBalances({ ...tempBalances, [acc.id]: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            <h3>Reserved Funds</h3>
            <div className="form-group">
                <label>Monthly Reserved (EMI/Bills) (₹)</label>
                <input
                    type="number"
                    value={reserved}
                    onChange={(e) => setReserved(e.target.value)}
                    placeholder="e.g. 20000"
                />
            </div>
            <div className="form-actions">
                <button className="btn-primary" onClick={handleSave}>Save Everything</button>
                <button className="btn-text" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
        </div>
    );
}

export default BudgetSettings;
