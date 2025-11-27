import React, { useEffect, useState } from 'react';
import { productsApi, categoriesApi, IMAGE_SERVER_URL } from '../services/api';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Trash2, Edit, Download, ExternalLink, RefreshCw, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importUrl, setImportUrl] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [importing, setImporting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [productImages, setProductImages] = useState({});

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll()
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);

            // Load images for all products
            loadProductImages(productsRes.data);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProductImages = async (products) => {
        const imagePromises = products.map(async (product) => {
            try {
                const response = await productsApi.getPrimaryImage(product.id);
                // Concatenate IMAGE_SERVER_URL with imageUrl from response
                const fullImageUrl = response.data?.imageUrl
                    ? `${IMAGE_SERVER_URL}${response.data.imageUrl}`
                    : null;
                return { productId: product.id, imageUrl: fullImageUrl };
            } catch (error) {
                console.error(`Failed to load image for product ${product.id}`, error);
                return { productId: product.id, imageUrl: null };
            }
        });

        const images = await Promise.all(imagePromises);
        const imageMap = {};
        images.forEach(({ productId, imageUrl }) => {
            imageMap[productId] = imageUrl;
        });
        setProductImages(imageMap);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productsApi.delete(id);
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error('Failed to delete product', error);
                alert('Failed to delete product');
            }
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importUrl || !selectedCategory) {
            alert('Please provide a URL and select a category');
            return;
        }

        setImporting(true);
        try {
            await productsApi.import(importUrl, parseInt(selectedCategory));
            setImportUrl('');
            setSelectedCategory('');
            loadData(); // Reload to see new product
            alert('Product imported successfully!');
        } catch (error) {
            console.error('Import failed', error);
            alert('Import failed. Please check the URL and try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleAsyncUpdate = async () => {
        setUpdating(true);
        try {
            await productsApi.scrapeUpdate();
            alert('Async update started successfully. This may take a while.');
        } catch (error) {
            console.error('Failed to start async update', error);
            alert('Failed to start async update');
        } finally {
            setUpdating(false);
        }
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : id;
    };

    // Filter products based on search and filters
    const filteredProducts = products.filter(product => {
        // Search filter (name or details)
        const matchesSearch = searchTerm === '' ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.details && product.details.toLowerCase().includes(searchTerm.toLowerCase()));

        // Category filter
        const matchesCategory = filterCategory === '' ||
            product.category === parseInt(filterCategory);

        // Price range filter
        const matchesMinPrice = minPrice === '' ||
            product.sellPrice >= parseFloat(minPrice);
        const matchesMaxPrice = maxPrice === '' ||
            product.sellPrice <= parseFloat(maxPrice);

        return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1>Products</h1>
                    <p className="text-zinc-400 mt-1">Manage your product inventory</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleAsyncUpdate} disabled={updating}>
                        <RefreshCw size={18} className={updating ? 'animate-spin' : ''} />
                        {updating ? 'Updating...' : 'Update All (Scrape)'}
                    </Button>
                    <Button onClick={() => navigate('/products/new')}>
                        <Plus size={20} />
                        New Product
                    </Button>
                </div>
            </div>

            <Card className="mb-8 border-blue-500/20 bg-blue-500/5">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <Download size={20} className="text-blue-500" />
                    Import from AliExpress
                </h3>
                <form onSubmit={handleImport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Paste AliExpress URL here..."
                            className="input"
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <select
                            className="select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <Button type="submit" disabled={importing} className="w-full">
                            {importing ? 'Importing...' : 'Import Product'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Filters */}
            <Card className="mb-8">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    Filter Products
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search by name or details..."
                            className="input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min $"
                            className="input"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            step="0.01"
                        />
                        <input
                            type="number"
                            placeholder="Max $"
                            className="input"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            step="0.01"
                        />
                    </div>
                </div>
                {(searchTerm || filterCategory || minPrice || maxPrice) && (
                    <div className="mt-3 text-sm text-zinc-400">
                        Showing {filteredProducts.length} of {products.length} products
                    </div>
                )}
            </Card>

            <Table headers={['ID', 'Image', 'Name', 'Price', 'Category', 'Actions']}>
                {filteredProducts.map((product) => {
                    const imageUrl = productImages[product.id];

                    return (
                        <tr key={product.id}>
                            <td className="text-zinc-500">#{product.id}</td>
                            <td>
                                <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden border border-zinc-700">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="w-full h-full flex items-center justify-center" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                        <Package size={20} className="text-zinc-500" />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="font-medium text-zinc-200">{product.name}</div>
                                <div className="text-xs text-zinc-500 truncate w-64 mt-1">{product.details}</div>
                            </td>
                            <td>
                                <div className="font-mono text-zinc-200">${product.sellPrice}</div>
                                {product.discount > 0 && (
                                    <div className="text-xs text-emerald-500 font-medium">-{product.discount}% OFF</div>
                                )}
                            </td>
                            <td>
                                <span className="px-2 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400 border border-zinc-700">
                                    {getCategoryName(product.category)}
                                </span>
                            </td>
                            <td>
                                <div className="flex gap-2">
                                    <button
                                        className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400 transition-colors"
                                        onClick={() => navigate(`/products/edit/${product.id}`)}
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                                        onClick={() => handleDelete(product.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {product.sourceUrl && (
                                        <a
                                            href={product.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                                            title="View Source"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </Table>
        </div>
    );
};

export default Products;
