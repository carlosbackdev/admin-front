import React, { useEffect, useState } from 'react';
import { configApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Save, DollarSign } from 'lucide-react';

const Settings = () => {
    const [profitMargin, setProfitMargin] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await configApi.getProfitMargin();
            setProfitMargin(response.data);
        } catch (error) {
            console.error('Failed to load config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await configApi.updateProfitMargin(profitMargin);
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <h1 className="mb-6">Settings</h1>

            <Card>
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <DollarSign size={20} className="text-green-400" />
                    Pricing Configuration
                </h3>
                <form onSubmit={handleSave}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-slate-400">
                            Global Profit Margin (%)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                step="0.1"
                                className="input"
                                value={profitMargin}
                                onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
                            />
                            <span className="text-slate-400">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            This percentage will be applied to all products to calculate the selling price.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Settings;
