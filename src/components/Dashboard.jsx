import React from 'react';
import { useExpenses } from '../context/ExpenseContext';

function Dashboard() {
    const {
        formatCurrency,
        netBalance,
        pendingLent,
        accounts,
        goals
    } = useExpenses();

    return (
        <div className="dashboard-container">
            {/* Accounts Section */}
            <div className="accounts-section" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.8rem', fontSize: '1rem' }}>My Accounts</h3>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
                    {accounts.map(acc => (
                        <div key={acc.id} className="card account-card" style={{
                            minWidth: '140px',
                            borderLeft: `4px solid ${acc.color}`,
                            padding: '1rem',
                            flex: '0 0 auto'
                        }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.name}</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                                {formatCurrency(acc.balance)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="stats-grid">
                <div className="card total-card" style={{ borderLeft: `4px solid ${netBalance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                    <h3>Net Balance</h3>
                    <p className="amount" style={{ color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                    </p>
                </div>

                <div className="card total-card" style={{ borderLeft: '4px solid #FFA000' }}>
                    <h3>Pending Lent</h3>
                    <p className="amount" style={{ color: '#FFA000' }}>{formatCurrency(pendingLent)}</p>
                </div>

                {/* Goals Section */}
                {goals.length > 0 && (
                    <div className="card goals-summary-card" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Savings Goals</h3>
                            <a href="/settings" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Manage</a>
                        </div>
                        <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {goals.map(goal => {
                                const progress = Math.min((goal.current / goal.target) * 100, 100);
                                return (
                                    <div key={goal.id} className="goal-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                            <span>{goal.name}</span>
                                            <span style={{ fontWeight: 'bold' }}>{Math.round(progress)}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${progress}%`,
                                                background: goal.color || 'var(--primary)',
                                                transition: 'width 0.5s ease-out'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Smart Habit-Based Suggestions */}
                {(() => {
                    const { getSuggestions, addExpense } = useExpenses();
                    const suggestions = getSuggestions();
                    if (suggestions.length > 0) {
                        const topSug = suggestions[0];
                        return (
                            <div className="card suggestion-prompt" style={{ gridColumn: '1 / -1', borderLeft: '4px solid var(--accent-color)', background: 'rgba(41, 98, 255, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>✨ Quick Add</h4>
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                                            {topSug.message} <strong>{topSug.merchant}</strong>?
                                        </p>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                        onClick={() => {
                                            addExpense({
                                                title: topSug.merchant,
                                                merchant: topSug.merchant,
                                                amount: topSug.suggestedAmount,
                                                category: topSug.category,
                                                date: new Date().toISOString().split('T')[0],
                                                type: 'expense',
                                                tags: ['Auto-recorded', 'Habit-Suggestion']
                                            });
                                            alert('Added!');
                                        }}
                                    >
                                        Add {formatCurrency(topSug.suggestedAmount)}
                                    </button>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}
            </div>
        </div>
    );
}

export default Dashboard;
