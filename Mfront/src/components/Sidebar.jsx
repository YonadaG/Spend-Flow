import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaThLarge, FaExchangeAlt, FaChartPie, FaCreditCard, FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { BiCategory } from "react-icons/bi";
import './Sidebar.css';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon-bg">
                        <FaCreditCard />
                    </div>
                    <div className="logo-text">
                        <span>Finance</span>Flow
                    </div>
                </div>
                <div className="pro-account-badge">Pro Account</div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaThLarge className="nav-icon" />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaExchangeAlt className="nav-icon" />
                    <span>Transactions</span>
                </NavLink>
                <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <BiCategory className="nav-icon" />
                    <span>Categories</span>
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaChartPie className="nav-icon" />
                    <span>Reports</span>
                </NavLink>
                <NavLink to="/accounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaCreditCard className="nav-icon" />
                    <span>Accounts</span>
                </NavLink>
            </nav>

            <div className="sidebar-section-title">PREFERENCES</div>

            <nav className="sidebar-nav">
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaUserCog className="nav-icon" />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                {/* Premium section removed */}
            </div>
        </aside>
    );
};

export default Sidebar;
