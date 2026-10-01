import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi, uploadApi, IMAGE_SERVER_URL } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Save, ArrowLeft, Cpu, AlertTriangle, Upload } from 'lucide-react';

const PRODUCT_STATUSES = [
    { value: 'DRAFT', label: 'Borrador', help: 'Solo visible en el panel de administración.' },
    { value: 'COMING_SOON', label: 'Próximamente', help: 'Visible en la web, pero todavía no se puede comprar.' },
    { value: 'AVAILABLE', label: 'Disponible', help: 'Se puede comprar si tiene precio y stock, salvo los productos DROP.' },
    { value: 'OUT_OF_STOCK', label: 'Sin stock', help: 'Visible en la web, con la compra bloqueada.' },
    { value: 'ARCHIVED', label: 'Archivado', help: 'Oculto para clientes.' },
];

const createInitialData = (isOnboardTemplate) => ({
    name: isOnboardTemplate ? 'Ordenador de a bordo MotoGear' : '',
    sku: isOnboardTemplate ? 'MG-OBD-KAWASAKI-V1' : '',
    slug: isOnboardTemplate ? 'ordenador-bordo-kawasaki' : '',
    status: 'DRAFT',
    stockQuantity: 0,
    lowStockThreshold: 5,
    details: isOnboardTemplate
        ? 'Ordenador de a bordo para telemetría y diagnóstico de motocicletas Kawasaki.'
        : '',
    specifications: '',
    keywords: isOnboardTemplate
        ? 'ordenador de a bordo, Kawasaki, KDS, KWP2000, telemetría, diagnóstico, DTC'
        : '',
    basePrice: 0,
    originalPrice: 0,
    sellPrice: 0,
    discount: 0,
    currency: 'EUR',
    shippingCost: 0,
    deliveryEstimateDays: isOnboardTemplate ? '5-7 días' : '',
    variants: '',
    sellerName: isOnboardTemplate ? 'MotoGear' : '',
    externalId: '',
    sourceUrl: '',
    category: '',
});

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEdit = !!id;
    const isOnboardTemplate = !isEdit && searchParams.get('template') === 'onboard';

    const [formData, setFormData] = useState(() => createInitialData(isOnboardTemplate));

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savedProductId, setSavedProductId] = useState(id || null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [imageError, setImageError] = useState('');

    useEffect(() => {
        if (!imageFile) {
            setImagePreview(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);
    const hasDropTag = String(formData.keywords || '')
        .split(/[,;]/)
        .some(keyword => keyword.trim().toLowerCase() === 'drop');
    const hasExternalId = Boolean(String(formData.externalId || '').trim());
    const isDropProduct = hasExternalId || hasDropTag;

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

            setFormData({
                ...createInitialData(false),
                ...productData,
                status: productData.status || 'DRAFT',
                stockQuantity: productData.stockQuantity ?? 0,
                lowStockThreshold: productData.lowStockThreshold ?? 5,
            });
            const imageResponse = await productsApi.getPrimaryImage(id);
            setCurrentImage(imageResponse.data?.imageUrl || null);
        } catch (error) {
            console.error('Failed to load product', error);
            alert('No se han podido cargar los datos del producto');
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
            setImageError('Selecciona un JPG, PNG, WEBP o GIF de hasta 10 MB.');
            event.target.value = '';
            return;
        }
        setImageError('');
        setImageFile(file);
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const integerFields = ['stockQuantity', 'lowStockThreshold', 'discount', 'category'];
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number'
                ? (integerFields.includes(name) ? parseInt(value, 10) || 0 : parseFloat(value) || 0)
                : value
        }));
    };

    const handleDropChange = (enabled) => {
        setFormData(prev => {
            const keywords = String(prev.keywords || '')
                .split(/[,;]/)
                .map(keyword => keyword.trim())
                .filter(Boolean)
                .filter(keyword => keyword.toLowerCase() !== 'drop');
            if (enabled) keywords.push('drop');
            return { ...prev, keywords: keywords.join(', ') };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let productSaved = false;
        try {
            const submitData = { ...formData };
            if (String(submitData.externalId || '').trim() && !String(submitData.keywords || '')
                .split(/[,;]/)
                .some(keyword => keyword.trim().toLowerCase() === 'drop')) {
                const keywords = String(submitData.keywords || '').trim();
                submitData.keywords = keywords ? `${keywords}, drop` : 'drop';
            }

            const deliveryEstimate = String(submitData.deliveryEstimateDays || '').trim();
            submitData.deliveryEstimateDays = deliveryEstimate && !/d[ií]as?/i.test(deliveryEstimate)
                ? `${deliveryEstimate} días`
                : deliveryEstimate;
            // La tienda comunica un plazo relativo; se limpian las antiguas fechas absolutas.
            submitData.deliveryMinDate = null;
            submitData.deliveryMaxDate = null;

            let productId = savedProductId;
            if (productId) {
                await productsApi.update({ ...submitData, id: Number(productId) });
            } else {
                const response = await productsApi.create(submitData);
                productId = response.data.id;
                setSavedProductId(productId);
            }
            productSaved = true;
            if (imageFile) {
                const upload = await uploadApi.uploadImage(imageFile);
                await productsApi.setPrimaryImage(productId, upload.data.publicUrl);
                setCurrentImage(upload.data.publicUrl);
                setImageFile(null);
            }
            alert(isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
            navigate('/products');
        } catch (error) {
            console.error('Failed to save product', error);
            const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'No se ha podido guardar el producto';
            alert(productSaved ? `El producto se ha guardado, pero no se ha podido completar la imagen: ${message}. Puedes volver a intentarlo.` : message);
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
                <div>
                    <h1 className="mb-1">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
                    <p className="text-sm text-zinc-500">
                        {isOnboardTemplate ? 'Plantilla preparada para el ordenador de a bordo MotoGear' : 'Ficha comercial e inventario'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Commercial status and inventory */}
                <Card className="border-orange-500/25 bg-orange-500/[0.04]">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
                                <Cpu size={20} className="text-orange-500" />
                                Publicación e inventario
                            </h3>
                            <p className="mt-1 text-sm text-zinc-500">Controla cuándo aparece en la web y cuándo se puede comprar.</p>
                        </div>
                        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                            {PRODUCT_STATUSES.find(item => item.value === formData.status)?.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-400">Estado comercial *</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="select" required>
                                {PRODUCT_STATUSES.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs text-zinc-500">
                                {PRODUCT_STATUSES.find(item => item.value === formData.status)?.help}
                            </p>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-400">SKU / referencia interna</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku || ''}
                                onChange={handleChange}
                                className="input font-mono uppercase"
                                placeholder="MG-OBD-KAWASAKI-V1"
                                required={formData.status === 'AVAILABLE'}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-400">Slug de la web</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug || ''}
                                onChange={handleChange}
                                className="input font-mono"
                                placeholder="ordenador-bordo-kawasaki"
                            />
                            <p className="mt-2 text-xs text-zinc-500">Se genera desde el nombre si lo dejas vacío.</p>
                        </div>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                            <input
                                type="checkbox"
                                checked={isDropProduct}
                                disabled={hasExternalId}
                                onChange={(event) => handleDropChange(event.target.checked)}
                                className="mt-1 h-4 w-4 accent-blue-500"
                            />
                            <span>
                                <span className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                                    Producto DROP
                                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase">sin stock local</span>
                                </span>
                                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                                    {hasExternalId
                                        ? 'Activado automáticamente porque el producto tiene ID externo.'
                                        : 'Añade o elimina la etiqueta drop en las palabras clave.'}
                                </span>
                            </span>
                        </label>
                        <div className={`grid grid-cols-2 gap-4 ${isDropProduct ? 'opacity-45' : ''}`}>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-400">{isDropProduct ? 'Stock no aplicable' : 'Stock actual'}</label>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    value={formData.stockQuantity}
                                    onChange={handleChange}
                                    className="input font-mono"
                                    min="0"
                                    step="1"
                                    disabled={isDropProduct}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-400">Avisar con</label>
                                <input
                                    type="number"
                                    name="lowStockThreshold"
                                    value={formData.lowStockThreshold}
                                    onChange={handleChange}
                                    className="input font-mono"
                                    min="0"
                                    step="1"
                                    disabled={isDropProduct}
                                />
                            </div>
                        </div>
                    </div>

                    {formData.status === 'AVAILABLE' && ((!isDropProduct && formData.stockQuantity <= 0) || formData.sellPrice <= 0 || !formData.sku) && (
                        <div className="mt-5 flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            Para publicar como disponible debes indicar SKU, precio de venta{isDropProduct ? '.' : ' y al menos una unidad de stock.'}
                        </div>
                    )}
                </Card>

                {/* Basic Information */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Información del producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Nombre *</label>
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
                            <label className="block text-sm font-medium mb-2 text-slate-400">Descripción</label>
                            <textarea
                                name="details"
                                value={formData.details || ''}
                                onChange={handleChange}
                                className="input min-h-[100px]"
                                rows="4"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Especificaciones</label>
                            <textarea
                                name="specifications"
                                value={formData.specifications || ''}
                                onChange={handleChange}
                                className="input min-h-[80px]"
                                rows="3"
                                placeholder="JSON o texto con especificaciones técnicas"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">Palabras clave</label>
                            <input
                                type="text"
                                name="keywords"
                                value={formData.keywords || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="Separadas por comas"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Categoría *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="select"
                                required
                            >
                                <option value="">Selecciona una categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Variantes</label>
                            <input
                                type="text"
                                name="variants"
                                value={formData.variants || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="mb-4 text-lg font-semibold text-zinc-200">Imagen del producto</h3>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        {(imagePreview || currentImage) && (
                            <img
                                src={imagePreview || (currentImage?.startsWith('http') ? currentImage : `${IMAGE_SERVER_URL}${currentImage}`)}
                                alt="Vista previa del producto"
                                className="h-36 w-36 rounded-lg border border-zinc-700 bg-zinc-800 object-contain"
                            />
                        )}
                        <div>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                                <Upload size={18} /> {currentImage ? 'Cambiar imagen principal' : 'Seleccionar imagen'}
                                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="sr-only" />
                            </label>
                            <p className="mt-2 text-xs text-zinc-500">JPG, PNG, WEBP o GIF, hasta 10 MB. Se subirá al guardar el producto.</p>
                            {imageFile && <p className="mt-2 text-sm text-zinc-300">{imageFile.name}</p>}
                            {imageError && <p role="alert" className="mt-2 text-sm text-red-400">{imageError}</p>}
                        </div>
                    </div>
                </Card>

                {/* Pricing */}
                <Card>
                    <h3 className="text-lg font-semibold mb-1 text-zinc-200">Precio</h3>
                    <p className="mb-5 text-sm text-zinc-500">Puedes dejarlo a cero mientras el producto sea borrador o próximamente.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Coste / precio base</label>
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
                            <label className="block text-sm font-medium mb-2 text-slate-400">Precio anterior</label>
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
                            <label className="block text-sm font-medium mb-2 text-slate-400">Precio de venta {formData.status === 'AVAILABLE' && '*'}</label>
                            <input
                                type="number"
                                name="sellPrice"
                                value={formData.sellPrice}
                                onChange={handleChange}
                                className="input"
                                step="0.01"
                                min="0"
                                required={formData.status === 'AVAILABLE'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Descuento (%)</label>
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
                            <label className="block text-sm font-medium mb-2 text-slate-400">Moneda</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="select"
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                                <option value="JPY">JPY</option>
                                <option value="CNY">CNY</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Shipping & Delivery */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Envío y entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Gastos de envío</label>
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
                            <label className="block text-sm font-medium mb-2 text-slate-400">Plazo estimado en días</label>
                            <input
                                type="text"
                                name="deliveryEstimateDays"
                                value={formData.deliveryEstimateDays || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej.: 5-7"
                            />
                            <p className="mt-2 text-xs text-zinc-500">Introduce un rango como 5-7. En la tienda se mostrará “5-7 días”, sin fechas concretas.</p>
                        </div>
                    </div>
                </Card>

                {/* Source Information */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Información interna</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">Vendedor</label>
                            <input
                                type="text"
                                name="sellerName"
                                value={formData.sellerName || ''}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-400">ID externo</label>
                            <input
                                type="text"
                                name="externalId"
                                value={formData.externalId || ''}
                                onChange={handleChange}
                                className="input"
                                placeholder="ID de una fuente externa (opcional)"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-400">URL de origen</label>
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
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Guardando...' : 'Guardar producto'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
