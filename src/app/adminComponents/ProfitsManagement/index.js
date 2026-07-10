import { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { app } from '../../../lib/firebaseConfig';
import './index.css';

const ProfitsManagement = ({ idToken }) => {
    const [orders, setOrders] = useState([]);
    const [spendings, setSpendings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddSpending, setShowAddSpending] = useState(false);
    const [newSpending, setNewSpending] = useState({
        description: '',
        amount: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0]
    });
    const [dateRange, setDateRange] = useState('all'); // all, month, week
    const [ordersLimit, setOrdersLimit] = useState(100); // Limit to prevent crashes

    const fetchData = useCallback(async () => {
        if (!idToken) return;
        
        setLoading(true);
        try {
            const db = getFirestore(app);
            
            // Fetch orders with limit
            const ordersRef = collection(db, 'orders');
            const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'), limit(ordersLimit));
            const ordersSnapshot = await getDocs(ordersQuery);
            const ordersList = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Fetch spendings via API
            const response = await fetch('/api/spendings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch spendings');
            }
            
            const data = await response.json();
            
            setOrders(ordersList);
            setSpendings(data.spendings || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [idToken, ordersLimit]);

    useEffect(() => {
        let isMounted = true;
        
        if (idToken && isMounted) {
            fetchData();
        }
        
        return () => {
            isMounted = false;
        };
    }, [idToken, fetchData]);

    const addSpending = async () => {
        if (!newSpending.description || !newSpending.amount) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/spendings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    description: newSpending.description,
                    amount: parseFloat(newSpending.amount),
                    category: newSpending.category,
                    date: newSpending.date
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add spending');
            }

            setNewSpending({
                description: '',
                amount: '',
                category: 'other',
                date: new Date().toISOString().split('T')[0]
            });
            setShowAddSpending(false);
            fetchData();
            alert('Spending added successfully!');
        } catch (error) {
            console.error('Error adding spending:', error);
            alert('Failed to add spending: ' + error.message);
        }
    };

    const deleteSpending = async (id) => {
        if (!confirm('Are you sure you want to delete this spending?')) return;

        try {
            const response = await fetch('/api/spendings', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ id })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete spending');
            }

            fetchData();
            alert('Spending deleted successfully!');
        } catch (error) {
            console.error('Error deleting spending:', error);
            alert('Failed to delete spending: ' + error.message);
        }
    };

    const filterByDateRange = (items, dateField) => {
        if (dateRange === 'all') return items;

        const now = new Date();
        const filtered = items.filter(item => {
            const itemDate = new Date(item[dateField]);
            
            if (dateRange === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return itemDate >= weekAgo;
            } else if (dateRange === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return itemDate >= monthAgo;
            }
            return true;
        });

        return filtered;
    };

    const calculateMetrics = () => {
        const filteredOrders = filterByDateRange(orders, 'orderDate');
        const filteredSpendings = filterByDateRange(spendings, 'date');

        // Calculate total revenue from completed orders
        const revenue = filteredOrders
            .filter(order => order.status === 'delivered' || order.status === 'completed')
            .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

        // Calculate total spendings
        const totalSpendings = filteredSpendings
            .reduce((sum, spending) => sum + (parseFloat(spending.amount) || 0), 0);

        // Calculate profit
        const profit = revenue - totalSpendings;

        // Group spendings by category
        const spendingsByCategory = filteredSpendings.reduce((acc, spending) => {
            const category = spending.category || 'other';
            acc[category] = (acc[category] || 0) + parseFloat(spending.amount);
            return acc;
        }, {});

        return {
            revenue,
            totalSpendings,
            profit,
            profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0,
            spendingsByCategory,
            ordersCount: filteredOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length
        };
    };

    const metrics = calculateMetrics();

    if (loading) return <div className="profits-loading">Loading...</div>;

    return (
        <div className="profits-management">
            <div className="profits-header">
                <h1>💰 Profits & Analytics</h1>
                <div className="date-range-selector">
                    <button 
                        className={dateRange === 'week' ? 'active' : ''}
                        onClick={() => setDateRange('week')}
                    >
                        This Week
                    </button>
                    <button 
                        className={dateRange === 'month' ? 'active' : ''}
                        onClick={() => setDateRange('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={dateRange === 'all' ? 'active' : ''}
                        onClick={() => setDateRange('all')}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card revenue">
                    <div className="metric-icon">📈</div>
                    <div className="metric-content">
                        <div className="metric-label">Total Revenue</div>
                        <div className="metric-value">${metrics.revenue.toFixed(2)}</div>
                        <div className="metric-sub">{metrics.ordersCount} completed orders</div>
                    </div>
                </div>
                
                <div className="metric-card spendings">
                    <div className="metric-icon">💸</div>
                    <div className="metric-content">
                        <div className="metric-label">Total Spendings</div>
                        <div className="metric-value">${metrics.totalSpendings.toFixed(2)}</div>
                        <div className="metric-sub">{filterByDateRange(spendings, 'date').length} expenses</div>
                    </div>
                </div>
                
                <div className={`metric-card profit ${metrics.profit >= 0 ? 'positive' : 'negative'}`}>
                    <div className="metric-icon">{metrics.profit >= 0 ? '✅' : '⚠️'}</div>
                    <div className="metric-content">
                        <div className="metric-label">Net Profit</div>
                        <div className="metric-value">${metrics.profit.toFixed(2)}</div>
                        <div className="metric-sub">{metrics.profitMargin}% margin</div>
                    </div>
                </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="chart-section">
                <h2>Financial Overview</h2>
                <div className="simple-chart">
                    <div className="chart-bar">
                        <div className="bar-label">Revenue</div>
                        <div className="bar-container">
                            <div 
                                className="bar revenue-bar" 
                                style={{ width: `${Math.min((metrics.revenue / (metrics.revenue + metrics.totalSpendings)) * 100, 100)}%` }}
                            >
                                ${metrics.revenue.toFixed(0)}
                            </div>
                        </div>
                    </div>
                    <div className="chart-bar">
                        <div className="bar-label">Spendings</div>
                        <div className="bar-container">
                            <div 
                                className="bar spendings-bar" 
                                style={{ width: `${Math.min((metrics.totalSpendings / (metrics.revenue + metrics.totalSpendings)) * 100, 100)}%` }}
                            >
                                ${metrics.totalSpendings.toFixed(0)}
                            </div>
                        </div>
                    </div>
                    <div className="chart-bar">
                        <div className="bar-label">Profit</div>
                        <div className="bar-container">
                            <div 
                                className={`bar profit-bar ${metrics.profit >= 0 ? 'positive' : 'negative'}`}
                                style={{ width: `${Math.min(Math.abs(metrics.profit) / (metrics.revenue + metrics.totalSpendings) * 100, 100)}%` }}
                            >
                                ${metrics.profit.toFixed(0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spendings by Category */}
                {Object.keys(metrics.spendingsByCategory).length > 0 && (
                    <div className="category-breakdown">
                        <h3>Spendings by Category</h3>
                        <div className="category-list">
                            {Object.entries(metrics.spendingsByCategory).map(([category, amount]) => (
                                <div key={category} className="category-item">
                                    <span className="category-name">{category}</span>
                                    <span className="category-amount">${amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Spendings Management */}
            <div className="spendings-section">
                <div className="section-header">
                    <h2>💳 Manage Spendings</h2>
                    <button 
                        className="add-spending-btn"
                        onClick={() => setShowAddSpending(!showAddSpending)}
                    >
                        {showAddSpending ? '✕ Cancel' : '+ Add Spending'}
                    </button>
                </div>

                {showAddSpending && (
                    <div className="add-spending-form">
                        <input
                            type="text"
                            placeholder="Description (e.g., Inventory Purchase)"
                            value={newSpending.description}
                            onChange={(e) => setNewSpending({...newSpending, description: e.target.value})}
                        />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={newSpending.amount}
                            onChange={(e) => setNewSpending({...newSpending, amount: e.target.value})}
                        />
                        <select
                            value={newSpending.category}
                            onChange={(e) => setNewSpending({...newSpending, category: e.target.value})}
                        >
                            <option value="inventory">Inventory</option>
                            <option value="shipping">Shipping</option>
                            <option value="marketing">Marketing</option>
                            <option value="operations">Operations</option>
                            <option value="utilities">Utilities</option>
                            <option value="salary">Salary</option>
                            <option value="other">Other</option>
                        </select>
                        <input
                            type="date"
                            value={newSpending.date}
                            onChange={(e) => setNewSpending({...newSpending, date: e.target.value})}
                        />
                        <button className="save-spending-btn" onClick={addSpending}>
                            Save Spending
                        </button>
                    </div>
                )}

                <div className="spendings-list">
                    {filterByDateRange(spendings, 'date').length === 0 ? (
                        <div className="empty-state">No spendings recorded yet</div>
                    ) : (
                        <table className="spendings-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filterByDateRange(spendings, 'date').map(spending => (
                                    <tr key={spending.id}>
                                        <td>{new Date(spending.date).toLocaleDateString()}</td>
                                        <td>{spending.description}</td>
                                        <td>
                                            <span className={`category-badge ${spending.category}`}>
                                                {spending.category}
                                            </span>
                                        </td>
                                        <td className="amount-cell">${parseFloat(spending.amount).toFixed(2)}</td>
                                        <td>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => deleteSpending(spending.id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfitsManagement;
