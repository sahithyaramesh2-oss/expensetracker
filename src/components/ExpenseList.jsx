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
                    <div key={expense.id} className={`expense-item ${expense.type === 'transfer' ? 'item-transfer' : expense.type === 'income' ? 'item-income' : expense.type === 'lent' ? 'item-lent' : ''}`}>
                        <div className="expense-icon">
                            {expense.type === 'transfer' ? '↗' : expense.type === 'income' ? '↙' : expense.type === 'lent' ? '🤝' : '🛍️'}
                        </div>
                        <div className="expense-details">
                            <span className="expense-date">{new Date(expense.date).toLocaleDateString()}</span>

                            {/* Title / Payee */}
                            <h4 className="expense-title">
                                {expense.type === 'transfer' ? (
                                    <>
                                        <span style={{ color: 'var(--accent-color)', marginRight: '5px' }}>↗</span>
                                        To {expense.title}
                                    </>
                                ) : expense.type === 'income' ? (
                                    <>
                                        <span style={{ color: 'var(--success)', marginRight: '5px' }}>↙</span>
                                        {expense.title}
                                    </>
                                ) : (
                                    expense.title
                                )}
                            </h4>

                            {/* Category / Purpose */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span className="expense-category">
                                    {expense.type === 'transfer' ? 'Payment' : expense.category}
                                </span>
                                {(expense.accountId || expense.type === 'transfer') && (
                                    <small style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                                        {expense.accountId === 'acc_cash' ? 'Cash' : 'Bank'}
                                    </small>
                                )}
                            </div>
                        </div>
                        <div className="expense-actions">
                            <span className="expense-amount" style={{
                                color: expense.type === 'income' ? 'var(--success)' : expense.type === 'lent' ? '#9C27B0' : expense.type === 'transfer' ? '#fff' : 'var(--text-main)',
                                fontSize: '1.2rem'
                            }}>
                                {expense.type === 'income' ? '+' : '−'}{formatCurrency(expense.amount)}
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
