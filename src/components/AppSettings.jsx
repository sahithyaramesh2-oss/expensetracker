import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';

function AppSettings() {
    const { categories, addCategory, exportData, userSettings, setUserSettings } = useExpenses();
    const [newCat, setNewCat] = useState('');
    const [upiId, setUpiId] = useState(userSettings.upiId);

    const handleSaveUpi = () => {
        setUserSettings({ ...userSettings, upiId });
        alert('UPI ID Saved!');
    };

    const handleAddCat = (e) => {
        e.preventDefault();
        if (newCat) {
            addCategory(newCat);
            setNewCat('');
        }
    };

    return (
        <div className="card settings-card">
            <h3>Settings and Data</h3>

            <div className="setting-group">
                <h4>UPI Configuration</h4>
                <div className="form-row" style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Your UPI ID (e.g. name@okhdfcbank)"
                    />
                    <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={handleSaveUpi}>Save</button>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>Used for receiving payments. For sending, you enter the receiver ID.</small>
            </div>

            <div className="setting-group">
                <h4>Custom Categories</h4>
                <div className="tags">
                    {categories.map(cat => <span key={cat} className="tag">{cat}</span>)}
                </div>
                <form onSubmit={handleAddCat} className="add-cat-form">
                    <input
                        type="text"
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        placeholder="New Category..."
                    />
                    <button type="submit">Add</button>
                </form>
            </div>

            <div className="setting-group">
                <h4>Data Management</h4>
                <button className="btn-primary" onClick={exportData}>
                    📂 Export Data (Backup)
                </button>
            </div>

            <div className="setting-group">
                <h4>SMS Transaction Import</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Automatically import transactions from bank SMS messages
                </p>
                <a href="/sms-import" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    📱 Import from SMS
                </a>
            </div>

            <div className="setting-group">
                <p className="pwa-note">To install on mobile: Tap Share then Add to Home Screen (iOS) or Install App (Android).</p>
            </div>
        </div>
    );
}

export default AppSettings;
