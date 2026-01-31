import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Analytics from './components/Analytics';
import AppSettings from './components/AppSettings';
import BudgetSettings from './components/BudgetSettings';
import SMSImporter from './components/SMSImporter';

// Page Wrappers
const HomePage = () => (
    <>
        <section className="budget-section"><BudgetSettings /></section>
        <section className="dashboard-section"><Dashboard /></section>
    </>
);

const AddPage = () => (
    <div className="page-container">
        <h2>Add Transaction</h2>
        <ExpenseForm />
    </div>
);

const HistoryPage = () => (
    <div className="page-container">
        <h2>Transaction History</h2>
        <ExpenseList />
    </div>
);

const AnalyticsPage = () => (
    <div className="page-container">
        <h2>Financial Insights</h2>
        <Analytics />
    </div>
);

const SettingsPage = () => (
    <div className="page-container">
        <h2>App Settings</h2>
        <AppSettings />
    </div>
);

const SMSImportPage = () => (
    <div className="page-container">
        <h2>Import from SMS</h2>
        <SMSImporter />
    </div>
);

function App() {
    return (
        <Router>
            <div className="app-container">
                <header className="app-header">
                    <h1>Expense Tracker</h1>
                </header>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/add" element={<AddPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/sms-import" element={<SMSImportPage />} />
                    </Routes>
                </main>

                <Navigation />
            </div>
        </Router>
    )
}

export default App
