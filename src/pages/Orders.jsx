import React, { useEffect, useState } from 'react';
import { ordersApi } from '../services/api';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eye, Trash2, CheckCircle, Truck, XCircle, Clock } from 'lucide-react';

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentStatus, setCurrentStatus] = useState('PENDING');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [currentStatus]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await ordersApi.getByStatus(currentStatus);
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to load orders', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await ordersApi.updateStatus(id, newStatus, `Status updated to ${newStatus}`);
            loadOrders();
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await ordersApi.delete(id);
                setOrders(orders.filter(o => o.id !== id));
            } catch (error) {
                console.error('Failed to delete order', error);
                alert('Failed to delete order');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'text-yellow-400';
            case 'PAID': return 'text-blue-400';
            case 'PROCESSING': return 'text-purple-400';
            case 'SHIPPED': return 'text-indigo-400';
            case 'DELIVERED': return 'text-green-400';
            case 'CANCELLED': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="mb-6">Orders</h1>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {ORDER_STATUSES.map((status) => (
                    <button
                        key={status}
                        onClick={() => setCurrentStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${currentStatus === status
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <Card>
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No orders found with status {currentStatus}</div>
                ) : (
                    <Table headers={['ID', 'User ID', 'Total', 'Date', 'Status', 'Actions']}>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>User #{order.userId}</td>
                                <td className="font-mono">${order.total}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <span className={`font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        {order.status === 'PENDING' && (
                                            <button
                                                className="p-2 hover:bg-slate-700 rounded text-green-400 transition-colors"
                                                title="Mark as Paid"
                                                onClick={() => handleStatusUpdate(order.id, 'PAID')}
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {order.status === 'PAID' && (
                                            <button
                                                className="p-2 hover:bg-slate-700 rounded text-purple-400 transition-colors"
                                                title="Process Order"
                                                onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                                            >
                                                <Clock size={18} />
                                            </button>
                                        )}
                                        {order.status === 'PROCESSING' && (
                                            <button
                                                className="p-2 hover:bg-slate-700 rounded text-indigo-400 transition-colors"
                                                title="Ship Order"
                                                onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                                            >
                                                <Truck size={18} />
                                            </button>
                                        )}
                                        {(order.status === 'PENDING' || order.status === 'CANCELLED') && (
                                            <button
                                                className="p-2 hover:bg-slate-700 rounded text-red-400 transition-colors"
                                                onClick={() => handleDelete(order.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
};

export default Orders;
