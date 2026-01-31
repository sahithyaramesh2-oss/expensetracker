import React from 'react';
import { useExpenses } from '../context/ExpenseContext';

function ExpenseList() {
    const { expenses, deleteExpense, formatCurrency } = useExpenses();

    if (expenses.length === 0) {
        return <div className="empty-state">No expenses recorded yet.</div>;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="expense-list">
            <h3>Recent Transactions</h3>
            <div className="list-container">
                {sortedExpenses.map((expense) => (
                    <div key={expense.id} className={`expense-item ${expense.type === 'transfer' ? 'item-transfer' : ''}`}>
                        <div className="expense-details">
                            <span className="expense-date">{new Date(expense.date).toLocaleDateString()}</span>

                            {/* Title / Payee */}
                            <h4 className="expense-title">
                                {expense.type === 'transfer' ? (
                                    <>
                                        <span style={{ color: 'var(--accent-color)', marginRight: '5px' }}>↗</span>
                                        To {expense.title}
                                    </>
                                ) : (
                                    expense.title
                                )}
                            </h4>

                            {/* Category / Purpose */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <span className="expense-category">
                                    {expense.type === 'transfer' ? 'Payment' : expense.category}
                                </span>
                                {expense.type === 'transfer' && (
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        via UPI
                                    </small>
                                )}
                            </div>
                        </div>
                        <div className="expense-actions">
                            <span className="expense-amount" style={{
                                color: expense.type === 'transfer' ? '#fff' : 'var(--text-main)',
                                fontSize: '1.2rem'
                            }}>
                                {formatCurrency(expense.amount)}
                            </span>
                            <button
                                className="btn-icon delete-btn"
                                onClick={() => deleteExpense(expense.id)}
                                aria-label="Delete expense"
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

export default ExpenseList;
