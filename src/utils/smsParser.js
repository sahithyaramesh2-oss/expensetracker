/**
 * SMS Transaction Parser
 * Parses bank SMS notifications to extract transaction details
 * Supports major Indian banks: HDFC, SBI, ICICI, Axis, Kotak, etc.
 */

// Common patterns for Indian banks
const PATTERNS = {
    // Amount patterns
    amount: [
        /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        /([0-9,]+(?:\.[0-9]{2})?)\s*(?:Rs\.?|INR|₹)/i,
    ],

    // Transaction type
    debit: /debited|spent|withdrawn|paid|deducted|purchase/i,
    credit: /credited|received|deposited|refund|cashback/i,

    // Merchant/Source
    merchant: [
        /(?:at|to|from)\s+([A-Z][A-Za-z0-9\s&.-]+?)(?:\s+on|\s+at|\s+\(|$)/,
        /(?:spent|debited).*?at\s+([A-Z][A-Za-z0-9\s&.-]+)/i,
        /(?:credited|received).*?(?:from|by)\s+([A-Z][A-Za-z0-9\s&.-]+)/i,
    ],

    // Date patterns
    date: [
        /(\d{2}[-/]\d{2}[-/]\d{2,4})/,
        /(\d{2}[A-Za-z]{3}\d{2,4})/,
        /on\s+(\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4})/i,
    ],

    // Account number (last 4 digits)
    account: /[*X]{2,}(\d{4})/,
};

/**
 * Parse a single SMS message
 * @param {string} sms - SMS message text
 * @returns {object|null} Parsed transaction or null if invalid
 */
export function parseSMS(sms) {
    if (!sms || typeof sms !== 'string') return null;

    const transaction = {
        amount: null,
        type: null,
        merchant: null,
        date: null,
        account: null,
        category: 'Other',
        rawSMS: sms,
    };

    // Extract amount
    for (const pattern of PATTERNS.amount) {
        const match = sms.match(pattern);
        if (match) {
            transaction.amount = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    // Determine type (debit/credit)
    if (PATTERNS.debit.test(sms)) {
        transaction.type = 'expense';
    } else if (PATTERNS.credit.test(sms)) {
        transaction.type = 'income';
    }

    // Extract merchant/source
    for (const pattern of PATTERNS.merchant) {
        const match = sms.match(pattern);
        if (match) {
            transaction.merchant = match[1].trim();
            break;
        }
    }

    // Extract date
    for (const pattern of PATTERNS.date) {
        const match = sms.match(pattern);
        if (match) {
            transaction.date = parseDate(match[1]);
            break;
        }
    }

    // Extract account
    const accountMatch = sms.match(PATTERNS.account);
    if (accountMatch) {
        transaction.account = accountMatch[1];
    }

    // Auto-categorize based on merchant
    if (transaction.merchant) {
        transaction.category = categorizeByMerchant(transaction.merchant);
    }

    // Validate: must have amount and type
    if (!transaction.amount || !transaction.type) {
        return null;
    }

    // Default date to today if not found
    if (!transaction.date) {
        transaction.date = new Date().toISOString().split('T')[0];
    }

    // Default merchant
    if (!transaction.merchant) {
        transaction.merchant = transaction.type === 'income' ? 'Bank Credit' : 'Bank Debit';
    }

    return transaction;
}

/**
 * Parse multiple SMS messages (bulk)
 * @param {string} smsText - Multiple SMS messages (newline separated)
 * @returns {array} Array of parsed transactions
 */
export function parseBulkSMS(smsText) {
    if (!smsText) return [];

    // Split by double newlines or common SMS separators
    const messages = smsText
        .split(/\n\n+|\n-{3,}\n/)
        .map(msg => msg.trim())
        .filter(msg => msg.length > 10); // Filter out very short lines

    const transactions = [];
    for (const msg of messages) {
        const parsed = parseSMS(msg);
        if (parsed) {
            transactions.push(parsed);
        }
    }

    return transactions;
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr) {
    try {
        // Handle formats: DD-MM-YY, DD/MM/YY, DDMonYY
        let date;

        if (/\d{2}[-/]\d{2}[-/]\d{2,4}/.test(dateStr)) {
            // DD-MM-YY or DD/MM/YY
            const parts = dateStr.split(/[-/]/);
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000; // Convert 2-digit year
            date = new Date(year, month, day);
        } else if (/\d{2}[A-Za-z]{3}\d{2,4}/.test(dateStr)) {
            // DDMonYY format (e.g., 31Jan26)
            const day = parseInt(dateStr.slice(0, 2));
            const monthStr = dateStr.slice(2, 5);
            let year = parseInt(dateStr.slice(5));
            if (year < 100) year += 2000;

            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const month = months.indexOf(monthStr.toLowerCase());

            date = new Date(year, month, day);
        } else {
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) {
            return new Date().toISOString().split('T')[0];
        }

        return date.toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
}

/**
 * Auto-categorize based on merchant name
 */
function categorizeByMerchant(merchant) {
    const merchantLower = merchant.toLowerCase();

    // Food & Dining
    if (/swiggy|zomato|uber\s*eats|domino|mcdonald|kfc|pizza|restaurant|cafe|food/i.test(merchantLower)) {
        return 'Food';
    }

    // Transport
    if (/uber|ola|rapido|metro|petrol|fuel|parking/i.test(merchantLower)) {
        return 'Transport';
    }

    // Shopping
    if (/amazon|flipkart|myntra|ajio|shopping|mall|store/i.test(merchantLower)) {
        return 'Shopping';
    }

    // Entertainment
    if (/netflix|prime|hotstar|spotify|bookmyshow|movie|cinema/i.test(merchantLower)) {
        return 'Entertainment';
    }

    // Bills & Utilities
    if (/electricity|water|gas|mobile|recharge|bill|payment/i.test(merchantLower)) {
        return 'Bills';
    }

    // Health
    if (/pharma|medical|hospital|doctor|health/i.test(merchantLower)) {
        return 'Health';
    }

    return 'Other';
}
