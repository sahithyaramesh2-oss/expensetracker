/**
 * Smart Guess / Habit Suggestion Engine
 * Analyzes past expenses to identify patterns and suggest potential expenses.
 */

/**
 * Analyzes expenses and returns top suggestions based on the current time and habits.
 * @param {Array} expenses - List of past expenses
 * @param {Date} currentTime - Current date/time (defaults to now)
 * @returns {Array} List of suggested expense objects
 */
export function getSmartSuggestions(expenses, currentTime = new Date()) {
    if (!expenses || expenses.length === 0) return [];

    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay(); // 0-6 (Sun-Sat)

    // Group expenses by category and merchant
    const habits = {};

    expenses.forEach(e => {
        if (e.type !== 'expense') return;

        const key = `${e.category}|${e.merchant || e.title}`;
        if (!habits[key]) {
            habits[key] = {
                category: e.category,
                merchant: e.merchant || e.title,
                count: 0,
                hours: [],
                days: [],
                amounts: []
            };
        }

        const date = new Date(e.date);
        habits[key].count++;
        // If the expense has createdAt, use it for more precise hour analysis
        if (e.createdAt) {
            habits[key].hours.push(new Date(e.createdAt).getHours());
        } else {
            // Fallback: assume typical times for categories if not known? 
            // Better to just use what we have.
            habits[key].hours.push(12); // Default to midday if unknown
        }
        habits[key].days.push(date.getDay());
        habits[key].amounts.push(e.amount);
    });

    const suggestions = Object.values(habits)
        .map(habit => {
            // Calculate scores

            // 1. Frequency Score: How often does this happen?
            const frequencyScore = Math.min(habit.count / 5, 1); // Max score at 5 occurrences

            // 2. Time Proximity Score: Is it typically done around this hour?
            // (Using a simple Gaussian-like weight for hours within +/- 2 hours)
            const hourScore = habit.hours.reduce((score, h) => {
                const diff = Math.min(Math.abs(h - currentHour), 24 - Math.abs(h - currentHour));
                if (diff <= 2) return score + (1 - diff / 3);
                return score;
            }, 0) / habit.count;

            // 3. Day of Week Score: (Optional enhancement, skipping for simplicity now)

            const totalScore = (frequencyScore * 0.4) + (hourScore * 0.6);

            // Calculate median/average amount
            const avgAmount = habit.amounts.reduce((a, b) => a + b, 0) / habit.amounts.length;

            return {
                ...habit,
                score: totalScore,
                suggestedAmount: Math.round(avgAmount),
                message: `You usually spend on ${habit.category} at this time.`
            };
        })
        .filter(s => s.score > 0.4) // Only show reasonably strong suggestions
        .sort((a, b) => b.score - a.score);

    return suggestions.slice(0, 3); // Return top 3
}
