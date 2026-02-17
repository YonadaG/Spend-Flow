import React from 'react';
import { FaPlus, FaUniversity, FaCreditCard, FaCcVisa, FaCcMastercard } from 'react-icons/fa';

const accounts = [
    { id: 1, name: 'Chase Checking', type: 'Checking', number: '**** 4512', balance: 5240.50, icon: <FaUniversity className="text-blue-600" /> },
    { id: 2, name: 'Wells Fargo Savings', type: 'Savings', number: '**** 8829', balance: 12450.00, icon: <FaUniversity className="text-yellow-600" /> },
    { id: 3, name: 'Citi Double Cash', type: 'Credit Card', number: '**** 3310', balance: -450.20, icon: <FaCcMastercard className="text-orange-600" /> },
    { id: 4, name: 'Amex Gold', type: 'Credit Card', number: '**** 1002', balance: -120.00, icon: <FaCcVisa className="text-blue-400" /> },
];

const Accounts = () => {
    return (
        <div className="container mx-auto max-w-5xl">
            <header className="flex-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Linked Accounts</h1>
                    <p className="text-muted">Manage your banking and credit card connections.</p>
                </div>
                <button className="btn btn-primary">
                    <FaPlus /> Link New Account
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map(account => (
                    <div key={account.id} className="card hover:shadow-md transition-shadow">
                        <div className="flex-between mb-4">
                            <div className="flex-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-center text-xl">
                                    {account.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{account.name}</h3>
                                    <p className="text-sm text-muted">{account.type} • {account.number}</p>
                                </div>
                            </div>
                            <button className="btn-icon-ghost">...</button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex-between items-end">
                            <div>
                                <p className="text-xs text-muted uppercase font-bold tracking-wider">Current Balance</p>
                                <h2 className={`font-bold mt-1 ${account.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <button className="btn btn-secondary sm">View Transactions</button>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder Card */}
                <button className="card border-2 border-dashed border-gray-300 flex-center flex-col gap-3 min-h-[180px] hover:border-green-500 hover:bg-green-50 transition-colors group cursor-pointer bg-transparent shadow-none">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex-center text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                        <FaPlus className="text-xl" />
                    </div>
                    <p className="font-semibold text-gray-500 group-hover:text-green-700">Link Another Account</p>
                </button>
            </div>
        </div>
    );
};

export default Accounts;
