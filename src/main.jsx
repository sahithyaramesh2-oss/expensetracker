import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { ExpenseProvider } from './context/ExpenseContext'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <ExpenseProvider>
                <App />
            </ExpenseProvider>
        </AuthProvider>
    </React.StrictMode>,
)
