import React, { useState } from 'react';
import { trackingApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Search, RefreshCw, Truck } from 'lucide-react';

const Tracking = () => {
    const [orderId, setOrderId] = useState('');
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scrapeData, setScrapeData] = useState({ trackingNumber: '', orderId: '' });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!orderId) return;

        setLoading(true);
        setError(null);
        setTrackingInfo(null);
        try {
            const response = await trackingApi.getOrder(orderId);
            console.log(response);
            setTrackingInfo(response.data);
        } catch (error) {
            console.error('Failed to load tracking info', error);
            if (error.response?.status === 404) {
                setError('No tracking information found for this order ID. The order may not exist or tracking has not been added yet.');
            } else {
                setError('Failed to load tracking information. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!orderId) return;
        try {
            await trackingApi.getUpdate(orderId);
            handleSearch({ preventDefault: () => { } }); // Reload info
            alert('Tracking updated successfully');
        } catch (error) {
            console.error('Failed to update tracking', error);
            alert('Failed to update tracking');
        }
    };

    const handleScrape = async (e) => {
        e.preventDefault();
        try {
            await trackingApi.scrape(scrapeData.trackingNumber, scrapeData.orderId);
            alert('Scraping initiated successfully');
            setScrapeData({ trackingNumber: '', orderId: '' });
        } catch (error) {
            console.error('Failed to scrape tracking', error);
            alert('Failed to scrape tracking');
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="mb-6">Tracking</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <h3 className="mb-4 text-lg font-semibold">Search Tracking</h3>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input
                            type="number"
                            placeholder="Order ID"
                            className="input"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            required
                        />
                        <Button type="submit" disabled={loading}>
                            <Search size={18} />
                            Search
                        </Button>
                    </form>
                </Card>

                <Card>
                    <h3 className="mb-4 text-lg font-semibold">Scrape New Tracking</h3>
                    <form onSubmit={handleScrape} className="grid grid-cols-1 gap-4">
                        <input
                            type="number"
                            placeholder="Order ID"
                            className="input"
                            value={scrapeData.orderId}
                            onChange={(e) => setScrapeData({ ...scrapeData, orderId: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Tracking Number"
                            className="input"
                            value={scrapeData.trackingNumber}
                            onChange={(e) => setScrapeData({ ...scrapeData, trackingNumber: e.target.value })}
                            required
                        />
                        <Button type="submit">
                            <RefreshCw size={18} />
                            Start Scraping
                        </Button>
                    </form>
                </Card>
            </div>

            {error && (
                <Card className="mb-8 border-red-500/20 bg-red-500/5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Truck size={24} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-500 mb-1">Tracking Not Found</h3>
                            <p className="text-zinc-400 text-sm">{error}</p>
                        </div>
                    </div>
                </Card>
            )}

            {trackingInfo && (
                <Card>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Tracking #{trackingInfo.trackingNumber}</h2>
                            <p className="text-zinc-400">Order #{trackingInfo.orderId}</p>
                        </div>
                        <Button onClick={handleUpdate}>
                            <RefreshCw size={18} />
                            Update Status
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <div className="text-sm text-zinc-400 mb-1">Status</div>
                            <div className="font-semibold text-blue-400">{trackingInfo.status}</div>
                            <div className="text-xs text-zinc-500 mt-1">{trackingInfo.statusDescription}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <div className="text-sm text-zinc-400 mb-1">Route</div>
                            <div className="font-semibold">{trackingInfo.origin} → {trackingInfo.destination}</div>
                            <div className="text-xs text-zinc-500 mt-1">{trackingInfo.daysOnRoute} days in transit</div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <div className="text-sm text-zinc-400 mb-1">Carrier</div>
                            <div className="font-semibold">{trackingInfo.couriers}</div>
                            <div className="text-xs text-zinc-500 mt-1">Weight: {trackingInfo.weight}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Timeline</h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded bg-zinc-900 font-mono text-sm whitespace-pre-wrap">
                                {trackingInfo.timeline}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Tracking;
