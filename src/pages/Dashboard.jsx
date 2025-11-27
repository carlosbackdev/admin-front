import React, { useEffect, useState } from 'react';
import { productsApi, ordersApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        productsCount: 0,
        ordersCount: 0,
        pendingOrders: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [productsRes, ordersRes] = await Promise.all([
                productsApi.getAll(),
                ordersApi.getByStatus('PAID') // Assuming we count PAID orders for revenue
            ]);

            const products = productsRes.data;
            const paidOrders = ordersRes.data;

            // Also get pending orders
            const pendingOrdersRes = await ordersApi.getByStatus('PENDING');
            const pendingOrders = pendingOrdersRes.data;

            const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

            setStats({
                productsCount: products.length,
                ordersCount: paidOrders.length + pendingOrders.length,
                pendingOrders: pendingOrders.length,
                totalRevenue,
            });
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <Card className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-slate-400 text-sm">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
        </Card>
    );

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <h1 className="mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Products"
                    value={stats.productsCount}
                    icon={Package}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.ordersCount}
                    icon={ShoppingCart}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    icon={TrendingUp}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="/products/new" className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-center">
                            <Package className="mx-auto mb-2 text-blue-400" />
                            <span className="text-sm font-medium">Add Product</span>
                        </a>
                        <a href="/orders" className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-center">
                            <ShoppingCart className="mx-auto mb-2 text-purple-400" />
                            <span className="text-sm font-medium">View Orders</span>
                        </a>
                    </div>
                </Card>

                <Card>
                    <h3 className="mb-4 text-lg font-semibold">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Backend Connection</span>
                            <span className="text-green-400 text-sm font-medium">Active</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Database</span>
                            <span className="text-green-400 text-sm font-medium">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Last Sync</span>
                            <span className="text-slate-300 text-sm font-medium">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
