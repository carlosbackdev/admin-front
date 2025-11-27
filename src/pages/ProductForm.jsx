import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Save, ArrowLeft } from 'lucide-react';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: '',
        details: '',
        specifications: '',
        keywords: '',
        basePrice: 0,
        originalPrice: 0,
        sellPrice: 0,
        discount: 0,
        currency: 'USD',
        shippingCost: 0,
        deliveryEstimateDays: '',
        deliveryMinDate: '',
        deliveryMaxDate: '',
        variants: '',
        sellerName: '',
        externalId: '',
        sourceUrl: '',
        category: 0,
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCategories();
        if (isEdit) {
            loadProduct();
        }
    }, [id]);

    const loadCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const loadProduct = async () => {
        try {
            const response = await productsApi.getById(id);
            const productData = response.data;

            // Format dates if they exist
            if (productData.deliveryMinDate) {
                productData.deliveryMinDate = productData.deliveryMinDate.split('T')[0];
            }
            if (productData.deliveryMaxDate) {
                productData.deliveryMaxDate = productData.deliveryMaxDate.split('T')[0];
            }

            setFormData(productData);
        } catch (error) {
            console.error('Failed to load product', error);
            alert('Failed to load product details');
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = { ...formData };

            // Convert empty date strings to null
            if (!submitData.deliveryMinDate) submitData.deliveryMinDate = null;
            if (!submitData.deliveryMaxDate) submitData.deliveryMaxDate = null;

            if (isEdit) {
                await productsApi.update({ ...submitData, id: parseInt(id) });
                alert('Product updated successfully');
            } else {
                await productsApi.create(submitData);
                alert('Product created successfully');
            }
            navigate('/products');
        } catch (error) {
            console.error('Failed to save product', error);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/products')}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1>{isEdit ? 'Edit Product' : 'New Product'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Details</label>
                            <textarea
                                name="details"
                                value={formData.details || ''}
                                onChange={handleChange}
                                className="input min-h-[100px]"
                                rows="4"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Specifications</label>
                            <textarea
                                name="specifications"
                                value={formData.specifications || ''}
                                onChange={handleChange}
                                className="input min-h-[80px]"
                                rows="3"
                                placeholder="Technical specifications, features, etc."
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Keywords</label>
                            <input
                                type="text"
                                name="keywords"
                                value={formData.keywords || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="Comma-separated keywords for search"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="select"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Variants</label>
                            <input
                                type="text"
                                name="variants"
                                value={formData.variants || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., Color: Red, Blue; Size: S, M, L"
                            />
                        </div>
                    </div>
                </Card>

                {/* Pricing */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Base Price</label>
                            <input
                                type="number"
                                name="basePrice"
                                value={formData.basePrice}
                                onChange={handleChange}
                                className="input"
                                step="0.01"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Original Price</label>
                            <input
                                type="number"
                                name="originalPrice"
                                value={formData.originalPrice}
                                onChange={handleChange}
                                className="input"
                                step="0.01"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Sell Price *</label>
                            <input
                                type="number"
                                name="sellPrice"
                                value={formData.sellPrice}
                                onChange={handleChange}
                                className="input"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Discount (%)</label>
                            <input
                                type="number"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                className="input"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Currency</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="select"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="JPY">JPY</option>
                                <option value="CNY">CNY</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Shipping & Delivery */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Shipping & Delivery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Shipping Cost</label>
                            <input
                                type="number"
                                name="shippingCost"
                                value={formData.shippingCost}
                                onChange={handleChange}
                                className="input"
                                step="0.01"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Delivery Estimate (Days)</label>
                            <input
                                type="text"
                                name="deliveryEstimateDays"
                                value={formData.deliveryEstimateDays || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., 5-7 days"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Delivery Min Date</label>
                            <input
                                type="date"
                                name="deliveryMinDate"
                                value={formData.deliveryMinDate || ''}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Delivery Max Date</label>
                            <input
                                type="date"
                                name="deliveryMaxDate"
                                value={formData.deliveryMaxDate || ''}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>
                </Card>

                {/* Source Information */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Source Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Seller Name</label>
                            <input
                                type="text"
                                name="sellerName"
                                value={formData.sellerName || ''}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">External ID</label>
                            <input
                                type="text"
                                name="externalId"
                                value={formData.externalId || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="ID from external source (e.g., AliExpress)"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Source URL</label>
                            <input
                                type="url"
                                name="sourceUrl"
                                value={formData.sourceUrl || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="danger" onClick={() => navigate('/products')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Product'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
