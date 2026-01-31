import React from 'react';
import { useExpenses } from '../context/ExpenseContext';

function Dashboard() {
    const { expenses, budget, formatCurrency } = useExpenses();

    const totalExpenses = expenses
        .filter(e => e.type === 'expense' || e.type === 'transfer')
        .reduce((total, expense) => total + expense.amount, 0);

    const totalIncome = expenses
        .filter(e => e.type === 'income')
        .reduce((total, income) => total + income.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    // Get current month's total
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlySpent = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return (expense.type === 'expense' || expense.type === 'transfer') &&
                expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + expense.amount, 0);

    const available = budget.limit - monthlySpent;
    const isDanger = budget.limit > 0 && available < budget.reserved;

    return (
        <div className="dashboard">
            <div className="card total-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <h3>Total Income</h3>
                <p className="amount" style={{ color: 'var(--success)' }}>+{formatCurrency(totalIncome)}</p>
            </div>

            <div className="card total-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <h3>Total Expenses</h3>
                <p className="amount" style={{ color: 'var(--danger)' }}>-{formatCurrency(totalExpenses)}</p>
            </div>

            <div className="card total-card" style={{ borderLeft: `4px solid ${netBalance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                <h3>Net Balance</h3>
                <p className="amount" style={{ color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatCurrency(netBalance)}
                </p>
            </div>

            <div className={`card monthly-card ${isDanger ? 'alert-card' : ''}`}>
                <h3>Available Now</h3>
                <p className="amount" style={{ color: isDanger ? '#ff4b4b' : 'var(--success)' }}>
                    {budget.limit > 0 ? formatCurrency(available) : 'No Limit Set'}
                </p>
                {budget.reserved > 0 && (
                    <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.8 }}>
                        Reserved: {formatCurrency(budget.reserved)}
                    </small>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
