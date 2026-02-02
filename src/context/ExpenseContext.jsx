import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { getSmartSuggestions } from '../utils/suggestionEngine';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext();

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Bills', 'Shopping', 'Other'];

export const ExpenseProvider = ({ children }) => {
    const { token, user } = useAuth();
    const userId = user?.id || 'guest';

    // Budget: limit (total monthly budget), reserved (amount set aside for EMIs/Essentials)
    const [budget, setBudget] = useLocalStorage(`budget_${userId}`, { limit: 0, reserved: 0 });

    // Expenses State (Fetched from API)
    const [expenses, setExpenses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [goals, setGoals] = useState([]);

    // Fetch All Data on Load / Auth change
    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                try {
                    const headers = { 'Authorization': `Bearer ${token}` };
                    const [expRes, accRes, goalRes] = await Promise.all([
                        fetch(`${API_BASE}/api/expenses`, { headers }),
                        fetch(`${API_BASE}/api/accounts`, { headers }),
                        fetch(`${API_BASE}/api/goals`, { headers })
                    ]);

                    const expData = await expRes.json();
                    const accData = await accRes.json();
                    const goalData = await goalRes.json();

                    setExpenses(expData.data || []);
                    setAccounts(accData.data || []);
                    setGoals(goalData.data || []);
                } catch (err) {
                    console.error("Failed to fetch data:", err);
                }
            };
            fetchData();
        } else {
            setExpenses([]);
            setAccounts([]);
            setGoals([]);
        }
    }, [token]);

    // Custom Categories
    const [categories, setCategories] = useLocalStorage(`categories_${userId}`, DEFAULT_CATEGORIES);

    // User Settings (UPI)
    const [userSettings, setUserSettings] = useLocalStorage(`userSettings_${userId}`, { upiId: '' });

    // Subscriptions (Recurring)
    const [subscriptions, setSubscriptions] = useLocalStorage(`subscriptions_${userId}`, []);

    // Check for duplicate transaction (Same merchant, amount, and date)
    const isDuplicate = (expense) => {
        return expenses.some(e => {
            const sameAmount = Math.abs(e.amount - parseFloat(expense.amount)) < 0.01;
            const sameDate = e.date === expense.date;

            // If merchant exists in both, compare it. 
            // If not, compare title.
            let sameMerchant = false;
            if (e.merchant && expense.merchant) {
                sameMerchant = e.merchant === expense.merchant;
            } else {
                sameMerchant = e.title === (expense.merchant || expense.title);
            }

            return sameAmount && sameDate && sameMerchant;
        });
    };

    // Reliable ID generator for both secure and non-secure contexts
    const generateId = () => {
        try {
            return crypto.randomUUID();
        } catch (e) {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        }
    };

    // Add new expense (API)
    const addExpense = (expense) => {
        if (!token) return { success: false, message: "Not authenticated" };
        try {
            // Prevent duplicates
            if (isDuplicate(expense)) {
                console.warn("Duplicate transaction ignored:", expense);
                return { success: false, message: "Duplicate transaction detected." };
            }

            const accountId = expense.accountId || `acc_bank_${user.id}`;

            const newExpense = {
                id: generateId(),
                createdAt: new Date().toISOString(),
                ...expense,
                accountId
            };

            // Optimistic Update
            setExpenses(prev => [newExpense, ...prev]);

            // Update Account Balance Optimistically
            setAccounts(prev => prev.map(acc => {
                if (acc.id === accountId) {
                    let newBalance = acc.balance;
                    if (expense.type === 'income') newBalance += expense.amount;
                    else newBalance -= expense.amount; // expense, refund, transfer
                    return { ...acc, balance: newBalance };
                }
                return acc;
            }));

            // Sync with Server
            fetch(`${API_BASE}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newExpense)
            });

            // Update Account Balance on Server
            const targetAcc = accounts.find(a => a.id === accountId);
            if (targetAcc) {
                let finalBalance = targetAcc.balance;
                if (expense.type === 'income') finalBalance += expense.amount;
                else finalBalance -= expense.amount;

                fetch(`${API_BASE}/api/accounts/${accountId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ balance: finalBalance })
                });
            }

            return { success: true, data: newExpense };
        } catch (error) {
            console.error("Critical error in addExpense:", error);
            return { success: false, message: "Internal error while adding transaction." };
        }
    };

    // Goal Management
    const addGoal = async (goal) => {
        if (!token) return;
        const newGoal = { id: generateId(), current: 0, ...goal };
        setGoals(prev => [...prev, newGoal]);
        await fetch(`${API_BASE}/api/goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newGoal)
        });
    };
    const contributeToGoal = async (goalId, amount, fromAccountId) => {
        if (!token) return;
        // 1. Record as Internal Transfer/Expense
        addExpense({
            title: `Goal Contribution: ${goals.find(g => g.id === goalId)?.name}`,
            amount,
            category: 'Savings',
            type: 'expense',
            accountId: fromAccountId,
            date: new Date().toISOString().split('T')[0]
        });

        // 2. Update Goal Progress
        setGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                const newCurrent = g.current + amount;
                fetch(`${API_BASE}/api/goals/${goalId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ current: newCurrent })
                });
                return { ...g, current: newCurrent };
            }
            return g;
        }));
    };

    const updateAccountBalance = async (accountId, newBalance) => {
        if (!token) return;
        setAccounts(prev => prev.map(acc =>
            acc.id === accountId ? { ...acc, balance: parseFloat(newBalance) } : acc
        ));

        await fetch(`${API_BASE}/api/accounts/${accountId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ balance: parseFloat(newBalance) })
        });
    };

    const addCategory = (cat) => {
        if (!categories.includes(cat)) setCategories([...categories, cat]);
    };

    const addSubscription = (sub) => {
        setSubscriptions(prev => [...prev, { id: generateId(), ...sub }]);
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
        if (!token) return;
        setExpenses(prev => prev.filter(e => e.id !== id));

        fetch(`${API_BASE}/api/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
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
        const headersYear = new Date().getFullYear();

        // Total income this month
        const monthlyIncome = expenses
            .filter(e => {
                const d = new Date(e.date);
                return e.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === headersYear;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        // Total spent this month (only expenses and transfers)
        const monthlySpent = expenses
            .filter(e => {
                const d = new Date(e.date);
                return (e.type === 'expense' || e.type === 'transfer' || e.type === 'refund') &&
                    d.getMonth() === currentMonth && d.getFullYear() === headersYear;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        const totalAfterExpense = monthlySpent + amount;
        const availableToSpend = monthlyIncome - budget.reserved;

        if (monthlyIncome > 0 && totalAfterExpense > availableToSpend) {
            if (totalAfterExpense > monthlyIncome) {
                return { isSafe: false, message: "Critical: This exceeds your total income for this month!" };
            }
            return { isSafe: false, message: "Warning: This transaction cuts into your Reserved Funds (EMIs)!" };
        }

        return { isSafe: true, message: "Safe to spend." };
    };

    const pendingRefunds = expenses
        .filter(e => e.type === 'refund')
        .reduce((sum, e) => sum + e.amount, 0);

    const exportData = () => {
        const data = { expenses, budget, categories, subscriptions };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const getSuggestions = () => {
        return getSmartSuggestions(expenses);
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
            exportData,
            getSuggestions,
            isDuplicate,
            pendingRefunds,
            accounts,
            goals,
            addGoal,
            contributeToGoal,
            updateAccountBalance
        }),
        [expenses, budget, categories, subscriptions, userSettings, pendingRefunds, accounts, goals]
    );

    return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
    return useContext(ExpenseContext);
};
