import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';

function GoalTracker() {
    const { goals, addGoal, contributeToGoal, accounts, formatCurrency } = useExpenses();
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');

    const [contribGoal, setContribGoal] = useState(null);
    const [contribAmount, setContribAmount] = useState('');
    const [fromAccount, setFromAccount] = useState('acc_bank');

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!name || !target) return;
        addGoal({
            name,
            target: parseFloat(target),
            deadline,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color
        });
        setName('');
        setTarget('');
        setDeadline('');
        setShowAdd(false);
    };

    const handleContribute = (e) => {
        e.preventDefault();
        if (!contribAmount) return;
        contributeToGoal(contribGoal.id, parseFloat(contribAmount), fromAccount);
        setContribGoal(null);
        setContribAmount('');
        alert('Contribution added!');
    };

    return (
        <div className="goal-tracker" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>🎯 Financial Goals</h3>
                <button
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    onClick={() => setShowAdd(!showAdd)}
                >
                    {showAdd ? 'Cancel' : '+ New Goal'}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAddGoal} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
                    <div className="form-group">
                        <label>Goal Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New iPhone, Vacation" required />
                    </div>
                    <div className="form-group">
                        <label>Target Amount</label>
                        <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="₹ 0.00" required />
                    </div>
                    <div className="form-group">
                        <label>Target Date (Optional)</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-primary">Create Goal</button>
                </form>
            )}

            <div className="goals-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {goals.map(goal => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    return (
                        <div key={goal.id} className="card goal-card" style={{ borderTop: `4px solid ${goal.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0 }}>{goal.name}</h4>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {goal.deadline ? `Target: ${new Date(goal.deadline).toLocaleDateString()}` : ''}
                                </span>
                            </div>

                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                {formatCurrency(goal.current)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {formatCurrency(goal.target)}</span>
                            </div>

                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${progress}%`,
                                    background: goal.color,
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(progress)}% Complete</span>
                                <button
                                    className="btn-text"
                                    onClick={() => setContribGoal(goal)}
                                    style={{ color: 'var(--primary)', fontSize: '0.9rem' }}
                                >
                                    💰 Contribute
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {contribGoal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <div className="modal-content card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3>Contribute to {contribGoal.name}</h3>
                        <form onSubmit={handleContribute}>
                            <div className="form-group">
                                <label>Amount to Save</label>
                                <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)} required autoFocus />
                            </div>
                            <div className="form-group">
                                <label>From Account</label>
                                <select value={fromAccount} onChange={e => setFromAccount(e.target.value)}>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} (Bal: {formatCurrency(acc.balance)})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-text" onClick={() => setContribGoal(null)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2 }}>Save Money</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GoalTracker;
