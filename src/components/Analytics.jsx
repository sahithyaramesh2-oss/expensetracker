import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';

const COLORS = ['#BB86FC', '#03DAC6', '#CF6679', '#FFB74D', '#4DB6AC', '#7986CB', '#9575CD'];

function Analytics() {
    const { expenses, formatCurrency } = useExpenses();

    if (!expenses.length) return <div className="empty-state">Add expenses to see analytics!</div>;

    // 1. Category Data for Pie Chart
    const categoryData = Object.values(expenses.reduce((acc, curr) => {
        if (curr.type === 'transfer') return acc; // Skip transfers in category split
        if (!acc[curr.category]) acc[curr.category] = { name: curr.category, value: 0 };
        acc[curr.category].value += curr.amount;
        return acc;
    }, {}));

    // 2. Last 7 Days for Bar Chart
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
        const dayTotal = expenses
            .filter(e => e.date === date && e.type !== 'transfer')
            .reduce((sum, e) => sum + e.amount, 0);
        return { name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }), amount: dayTotal };
    });

    return (
        <div className="analytics-container">
            <div className="card chart-card">
                <h3>Spending by Category</h3>
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
                <h3>Last 7 Days Trend</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={dailyData}>
                            <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333' }}
                            />
                            <Bar dataKey="amount" fill="#03DAC6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
