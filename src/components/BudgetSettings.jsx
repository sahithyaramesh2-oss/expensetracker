import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';

function BudgetSettings() {
    const { budget, updateBudget, formatCurrency } = useExpenses();
    const [limit, setLimit] = useState(budget.limit);
    const [reserved, setReserved] = useState(budget.reserved);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLimit(budget.limit);
        setReserved(budget.reserved);
    }, [budget]);

    const handleSave = () => {
        updateBudget({ limit: parseFloat(limit), reserved: parseFloat(reserved) });
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className="card budget-summary-card">
                <div className="budget-header">
                    <h3>Monthly Plan</h3>
                    <button className="btn-text" onClick={() => setIsEditing(true)}>Edit</button>
                </div>
                <div className="budget-details">
                    <div className="budget-item">
                        <span>Total Limit</span>
                        <span className="val">{formatCurrency(budget.limit)}</span>
                    </div>
                    <div className="budget-item reserved">
                        <span>Reserved (EMI)</span>
                        <span className="val">{formatCurrency(budget.reserved)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card budget-edit-card">
            <h3>Set Monthly Budget</h3>
            <div className="form-group">
                <label>Total Monthly Limit (₹)</label>
                <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="e.g. 50000"
                />
            </div>
            <div className="form-group">
                <label>Reserved for EMI/Bills (₹)</label>
                <input
                    type="number"
                    value={reserved}
                    onChange={(e) => setReserved(e.target.value)}
                    placeholder="e.g. 20000"
                />
                <small style={{ color: 'var(--text-muted)' }}>We'll warn you if you touch this.</small>
            </div>
            <div className="form-actions">
                <button className="btn-primary" onClick={handleSave}>Save Settings</button>
                <button className="btn-text" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
        </div>
    );
}

export default BudgetSettings;
