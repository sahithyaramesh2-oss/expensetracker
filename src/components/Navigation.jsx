import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function Navigation() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span>📊</span>
                <small>Home</small>
            </NavLink>
            <NavLink to="/add" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span>➕</span>
                <small>Add</small>
            </NavLink>
            <NavLink to="/smart-capture" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span>✨</span>
                <small>Smart</small>
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span>🧾</span>
                <small>History</small>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span>📈</span>
                <small>Insights</small>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span>⚙️</span>
                <small>Settings</small>
            </NavLink>
        </nav>
    );
}

export default Navigation;
