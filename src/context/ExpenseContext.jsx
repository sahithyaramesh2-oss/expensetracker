import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
    // Budget: limit (total monthly budget), reserved (amount set aside for EMIs/Essentials)
    const [budget, setBudget] = useLocalStorage('budget', { limit: 0, reserved: 0 });

    // Expenses State (Fetched from API)
    const [expenses, setExpenses] = useState([]);

    // Fetch Expenses on Load
    useEffect(() => {
        fetch('http://localhost:5000/api/expenses')
            .then(res => res.json())
            .then(data => setExpenses(data.data || []))
            .catch(err => console.error("Failed to fetch expenses:", err));
    }, []);

    // Custom Categories
    const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Bills', 'Shopping', 'Other'];
    const [categories, setCategories] = useLocalStorage('categories', DEFAULT_CATEGORIES);

    // User Settings (UPI)
    const [userSettings, setUserSettings] = useLocalStorage('userSettings', { upiId: '' });

    // Subscriptions (Recurring)
    const [subscriptions, setSubscriptions] = useLocalStorage('subscriptions', []);

    // Add new expense (API)
    const addExpense = (expense) => {
        const newExpense = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...expense
        };

        // Optimistic Update
        setExpenses(prev => [newExpense, ...prev]);

        fetch('http://localhost:5000/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newExpense)
        }).catch(err => {
            console.error("Failed to save expense:", err);
            // Rollback if needed (advanced)
        });
    };

    const addCategory = (cat) => {
        if (!categories.includes(cat)) setCategories([...categories, cat]);
    };

    const addSubscription = (sub) => {
        setSubscriptions(prev => [...prev, { id: crypto.randomUUID(), ...sub }]);
    };

    const deleteSubscription = (id) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const paySubscription = (sub) => {
        addExpense({
            title: sub.title + ' (Recurring)',
            amount: sub.amount,
            category: 'Bills',
            type: 'expense',
            date: new Date().toISOString().split('T')[0]
        });
    };

    // Delete expense (API)
    const deleteExpense = (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));

        fetch(`http://localhost:5000/api/expenses/${id}`, {
            method: 'DELETE'
        }).catch(err => console.error("Failed to delete expense:", err));
    };

    const updateBudget = (newBudget) => {
        setBudget(newBudget);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    // Check if a potential expense breaches the reserved safety margin
    // Returns: { isSafe: boolean, message: string }
    const checkBudgetSafety = (amount) => {
        const currentMonth = new Date().getMonth();
        const headersMonth = new Date().getFullYear();

        // Total spent this month
        const monthlySpent = expenses
            .filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === headersMonth;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        const totalAfterExpense = monthlySpent + amount;
        const itemsLeftForSpending = budget.limit - budget.reserved;

        // Strict Check: Are we eating into reserved funds?
        if (budget.limit > 0 && totalAfterExpense > itemsLeftForSpending) {
            // Check if we are totally over budget
            if (totalAfterExpense > budget.limit) {
                return { isSafe: false, message: "Critical: This exceeds your total monthly limit!" };
            }
            // We are into reserved funds
            return { isSafe: false, message: "Warning: This transaction cuts into your Reserved Funds (EMIs)!" };
        }

        return { isSafe: true, message: "Safe to spend." };
    };

    const exportData = () => {
        const data = { expenses, budget, categories, subscriptions };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const value = useMemo(
        () => ({
            expenses,
            budget,
            categories,
            subscriptions,
            userSettings,
            setUserSettings,
            addExpense,
            deleteExpense,
            updateBudget,
            formatCurrency,
            checkBudgetSafety,
            addCategory,
            addSubscription,
            deleteSubscription,
            paySubscription,
            exportData
        }),
        [expenses, budget, categories, subscriptions, userSettings]
    );

    return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
    return useContext(ExpenseContext);
};
