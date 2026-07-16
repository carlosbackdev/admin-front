import React, { useEffect, useState } from 'react';
import { productsApi, categoriesApi, bestProductsApi, IMAGE_SERVER_URL } from '../services/api';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Trash2, Edit, Download, ExternalLink, RefreshCw, Package, Star, Cpu, AlertTriangle } from 'lucide-react';
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
    const [bestProductIds, setBestProductIds] = useState(new Set());

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsRes, categoriesRes, bestProductsRes] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll(),
                bestProductsApi.getAll()
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);

            const bestIds = new Set(bestProductsRes.data.map(p => p.id));
            setBestProductIds(bestIds);

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
        if (window.confirm('¿Seguro que quieres eliminar este producto?')) {
            try {
                await productsApi.delete(id);
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error('Failed to delete product', error);
                alert('No se ha podido eliminar el producto');
            }
        }
    };

    const handleToggleBestProduct = async (product) => {
        const isBest = bestProductIds.has(product.id);
        try {
            if (isBest) {
                await bestProductsApi.remove(product.id);
                const newBest = new Set(bestProductIds);
                newBest.delete(product.id);
                setBestProductIds(newBest);
            } else {
                await bestProductsApi.add(product.id);
                const newBest = new Set(bestProductIds);
                newBest.add(product.id);
                setBestProductIds(newBest);
            }
        } catch (error) {
            console.error('Failed to toggle best product', error);
            alert('No se ha podido actualizar el producto destacado');
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importUrl || !selectedCategory) {
            alert('Introduce una URL y selecciona una categoría');
            return;
        }

        setImporting(true);
        try {
            await productsApi.import(importUrl, parseInt(selectedCategory));
            setImportUrl('');
            setSelectedCategory('');
            loadData(); // Reload to see new product
            alert('Producto importado correctamente');
        } catch (error) {
            console.error('Import failed', error);
            alert('La importación ha fallado. Revisa la URL e inténtalo de nuevo.');
        } finally {
            setImporting(false);
        }
    };

    const handleAsyncUpdate = async () => {
        setUpdating(true);
        try {
            await productsApi.scrapeUpdate();
            alert('Actualización iniciada. Puede tardar unos minutos.');
        } catch (error) {
            console.error('Failed to start async update', error);
            alert('No se ha podido iniciar la actualización');
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

        const matchesStatus = filterStatus === '' ||
            (product.status || 'DRAFT') === filterStatus;

        // Price range filter
        const matchesMinPrice = minPrice === '' ||
            (product.sellPrice || 0) >= parseFloat(minPrice);
        const matchesMaxPrice = maxPrice === '' ||
            (product.sellPrice || 0) <= parseFloat(maxPrice);

        return matchesSearch && matchesCategory && matchesStatus && matchesMinPrice && matchesMaxPrice;
    });

    if (loading) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col justify-between gap-4 mb-8 xl:flex-row xl:items-center">
                <div>
                    <h1>Productos</h1>
                    <p className="text-zinc-400 mt-1">Gestiona publicación, precio y stock desde un solo lugar</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={handleAsyncUpdate} disabled={updating}>
                        <RefreshCw size={18} className={updating ? 'animate-spin' : ''} />
                        {updating ? 'Actualizando...' : 'Actualizar importados'}
                    </Button>
                    <Button onClick={() => navigate('/products/new')}>
                        <Plus size={20} />
                        Nuevo producto
                    </Button>
                    <Button onClick={() => navigate('/products/new?template=onboard')} className="!bg-orange-600 hover:!bg-orange-700">
                        <Cpu size={20} />
                        Ordenador MotoGear
                    </Button>
                </div>
            </div>

            <Card className="mb-8 border-blue-500/20 bg-blue-500/5">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <Download size={20} className="text-blue-500" />
                    Importar desde AliExpress
                </h3>
                <form onSubmit={handleImport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Pega aquí la URL de AliExpress..."
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
                            <option value="">Selecciona una categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <Button type="submit" disabled={importing} className="w-full">
                            {importing ? 'Importando...' : 'Importar producto'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Filters */}
            <Card className="mb-8">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    Filtrar productos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o descripción..."
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
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            className="select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="DRAFT">Borrador</option>
                            <option value="COMING_SOON">Próximamente</option>
                            <option value="AVAILABLE">Disponible</option>
                            <option value="OUT_OF_STOCK">Sin stock</option>
                            <option value="ARCHIVED">Archivado</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Mín. €"
                            className="input"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            step="0.01"
                        />
                        <input
                            type="number"
                            placeholder="Máx. €"
                            className="input"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            step="0.01"
                        />
                    </div>
                </div>
                {(searchTerm || filterCategory || filterStatus || minPrice || maxPrice) && (
                    <div className="mt-3 text-sm text-zinc-400">
                        Mostrando {filteredProducts.length} de {products.length} productos
                    </div>
                )}
            </Card>

            <Table headers={['ID', 'Imagen', 'Producto', 'Estado', 'Precio', 'Stock', 'Categoría', 'Acciones']}>
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
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-zinc-600">{product.sku || 'SIN SKU'}</div>
                                <div className="text-xs text-zinc-500 truncate w-56 mt-1">{product.details}</div>
                            </td>
                            <td>
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                    product.status === 'AVAILABLE'
                                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                                        : product.status === 'COMING_SOON'
                                            ? 'border-orange-500/25 bg-orange-500/10 text-orange-400'
                                            : product.status === 'OUT_OF_STOCK'
                                                ? 'border-red-500/25 bg-red-500/10 text-red-400'
                                                : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                                }`}>
                                    {{
                                        DRAFT: 'Borrador',
                                        COMING_SOON: 'Próximamente',
                                        AVAILABLE: 'Disponible',
                                        OUT_OF_STOCK: 'Sin stock',
                                        ARCHIVED: 'Archivado',
                                    }[product.status] || 'Borrador'}
                                </span>
                            </td>
                            <td>
                                <div className="font-mono text-zinc-200">
                                    {product.sellPrice > 0 ? `${Number(product.sellPrice).toFixed(2)} ${product.currency || 'EUR'}` : 'Sin definir'}
                                </div>
                                {product.discount > 0 && (
                                    <div className="text-xs text-emerald-500 font-medium">-{product.discount}% OFF</div>
                                )}
                            </td>
                            <td>
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono text-base font-semibold ${
                                        (product.stockQuantity ?? 0) === 0
                                            ? 'text-red-400'
                                            : (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 5)
                                                ? 'text-amber-400'
                                                : 'text-emerald-400'
                                    }`}>
                                        {product.stockQuantity ?? 0}
                                    </span>
                                    {(product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 5) && (
                                        <AlertTriangle size={14} className="text-amber-400" title="Stock bajo" />
                                    )}
                                </div>
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
                                        className={`p-2 hover:bg-zinc-800 rounded-lg transition-colors ${bestProductIds.has(product.id) ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'}`}
                                        onClick={() => handleToggleBestProduct(product)}
                                        title={bestProductIds.has(product.id) ? "Remove from Best Products" : "Add to Best Products"}
                                    >
                                        <Star size={18} fill={bestProductIds.has(product.id) ? "currentColor" : "none"} />
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
