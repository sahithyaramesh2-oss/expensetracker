import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';

const COLORS = ['#BB86FC', '#03DAC6', '#CF6679', '#FFB74D', '#4DB6AC', '#7986CB', '#9575CD'];

function Analytics() {
    const { expenses, formatCurrency } = useExpenses();
    const [view, setView] = React.useState('expense'); // 'expense' or 'income'

    // 4. Monthly Analysis State
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    });

    if (!expenses.length) return <div className="empty-state">Add transactions to see analytics!</div>;

    // Filter data based on view
    const filteredExpenses = expenses.filter(e => {
        if (view === 'expense') return e.type === 'expense' || e.type === 'lent';
        return e.type === 'income';
    });

    // 1. Category Data for Pie Chart
    const categoryData = Object.values(filteredExpenses.reduce((acc, curr) => {
        if (curr.type === 'transfer') return acc;
        if (!acc[curr.category]) acc[curr.category] = { name: curr.category, value: 0 };
        acc[curr.category].value += Number(curr.amount);
        return acc;
    }, {}));

    // 2. Last 7 Days for Bar Chart
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
        const dayTotal = filteredExpenses
            .filter(e => e.date === date && e.type !== 'transfer')
            .reduce((sum, e) => sum + Number(e.amount), 0);
        return { name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }), amount: dayTotal };
    });

    // 3. Monthly Overview Data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return (e.type === 'expense' || e.type === 'lent') && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMonthlySpent = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const avgDailySpend = currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth()
        ? totalMonthlySpent / new Date().getDate()
        : totalMonthlySpent / 30; // Approx

    // Group monthly by category to find top
    const monthlyCatBreakdown = monthlyExpenses.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = 0;
        acc[curr.category] += Number(curr.amount);
        return acc;
    }, {});

    const topMonthCategory = Object.entries(monthlyCatBreakdown).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // 5. Monthly Analysis Logic
    const analysisData = React.useMemo(() => {
        if (!selectedMonth) return { income: 0, expense: 0, lent: 0, net: 0, chart: [] };

        const [y, m] = selectedMonth.split('-');
        const targetMonth = parseInt(m) - 1;
        const targetYear = parseInt(y);

        const relevant = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
        });

        const income = relevant.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
        const expense = relevant.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
        const lent = relevant.filter(e => e.type === 'lent').reduce((sum, e) => sum + Number(e.amount), 0);

        return {
            income,
            expense,
            lent,
            net: income - expense - lent,
            chart: [
                { name: 'Income', amount: income, fill: '#03DAC6' },
                { name: 'Expenses', amount: expense, fill: '#CF6679' },
                { name: 'Lent', amount: lent, fill: '#FFB74D' }
            ]
        };
    }, [expenses, selectedMonth]);

    const chartColor = view === 'expense' ? '#CF6679' : '#03DAC6';

    return (
        <div className="analytics-container">
            {/* Monthly Overview Section */}
            <div className="card overview-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    📅 {new Date().toLocaleString('default', { month: 'long' })} Overview
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Spent</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                            {formatCurrency(totalMonthlySpent)}
                        </div>
                    </div>
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top Category</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFB74D' }}>
                            {topMonthCategory[0]}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>({formatCurrency(topMonthCategory[1])})</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Avg</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            {formatCurrency(avgDailySpend)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="view-toggle" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    className={`toggle-btn ${view === 'expense' ? 'active' : ''}`}
                    onClick={() => setView('expense')}
                    style={{ flex: 1 }}
                >
                    Expenses
                </button>
                <button
                    className={`toggle-btn ${view === 'income' ? 'active' : ''}`}
                    onClick={() => setView('income')}
                    style={{ flex: 1 }}
                >
                    Incomes
                </button>
            </div>

            <div className="card chart-card">
                <h3>{view === 'expense' ? 'Spending' : 'Earnings'} by Category</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card chart-card">
                <h3>{view === 'expense' ? '7-Day Outflow' : '7-Day Inflow'}</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={dailyData}>
                            <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333' }}
                            />
                            <Bar dataKey="amount" fill={chartColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Analysis Section */}
            <div className="card chart-card" style={{ marginBottom: '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Monthly Analysis</h3>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{
                            background: '#1E1E1E',
                            color: 'white',
                            border: '1px solid #333',
                            padding: '0.4rem',
                            borderRadius: '4px',
                            colorScheme: 'dark'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: '#03DAC6', display: 'block', fontSize: '0.9rem' }}>Total Income</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(analysisData.income)}</span>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: '#CF6679', display: 'block', fontSize: '0.9rem' }}>Total Expenses</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(analysisData.expense)}</span>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: '#FFB74D', display: 'block', fontSize: '0.9rem' }}>Total Lent</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(analysisData.lent)}</span>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: analysisData.net >= 0 ? '#4DB6AC' : '#E57373', display: 'block', fontSize: '0.9rem' }}>Net Change</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{analysisData.net >= 0 ? '+' : ''}{formatCurrency(analysisData.net)}</span>
                    </div>
                </div>

                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <BarChart data={analysisData.chart} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={70} tick={{ fill: '#ccc', fontSize: 12 }} />
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                {
                                    analysisData.chart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))
                                }
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
