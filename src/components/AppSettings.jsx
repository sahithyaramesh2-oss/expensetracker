import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import useLocalStorage from '../hooks/useLocalStorage';
import GoalTracker from './GoalTracker';

function AppSettings() {
    const [notes, setNotes] = useLocalStorage('user_notes', '');
    const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'goals'
    const { exportData } = useExpenses();

    return (
        <div className="settings-page-container">
            <div className="tab-navigation" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px' }}>
                <button
                    className={`nav-tab ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                    style={{
                        flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none',
                        background: activeTab === 'notes' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'notes' ? '#000' : 'var(--text-main)',
                        fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    📝 Notes
                </button>
                <button
                    className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('goals')}
                    style={{
                        flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none',
                        background: activeTab === 'goals' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'goals' ? '#000' : 'var(--text-main)',
                        fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    🎯 Goals
                </button>
            </div>

            {activeTab === 'notes' ? (
                <div className="card notes-card" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>📋 My Personal Notes</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-saved</span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Maintain your shopping lists, financial goals, or reminders here.
                    </p>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Start writing your notes here... e.g.
• Buy groceries on Friday
• Check credit card reward points"
                        style={{
                            flex: 1, width: '100%', minHeight: '300px', padding: '1rem', borderRadius: '12px',
                            border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.6', resize: 'vertical', fontFamily: 'inherit'
                        }}
                    />

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            className="btn-text"
                            onClick={() => {
                                if (window.confirm('Clear all notes?')) setNotes('');
                            }}
                            style={{ color: 'var(--danger)', fontSize: '0.9rem' }}
                        >
                            🗑️ Clear All
                        </button>

                        <button
                            className="btn-primary"
                            onClick={exportData}
                            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                            📂 Export Account Data
                        </button>
                    </div>
                </div>
            ) : (
                <GoalTracker />
            )}
        </div>
    );
}

export default AppSettings;
