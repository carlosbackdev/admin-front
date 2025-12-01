import React, { useEffect, useState } from 'react';
import { bannersApi, uploadApi, IMAGE_SERVER_URL } from '../services/api';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Trash2, Edit, X, Upload, Image as ImageIcon } from 'lucide-react';

const Banners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        linkName: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            const response = await bannersApi.getAll();
            setBanners(response.data);
        } catch (error) {
            console.error('Failed to load banners', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                description: banner.description,
                imageUrl: banner.imageUrl,
                linkUrl: banner.linkUrl,
                linkName: banner.linkName || ''
            });
            setImagePreview(banner.imageUrl ? `${IMAGE_SERVER_URL}${banner.imageUrl}` : null);
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                description: '',
                imageUrl: '',
                linkUrl: '',
                linkName: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBanner(null);
        setFormData({ title: '', description: '', imageUrl: '', linkUrl: '', linkName: ''  });
        setImageFile(null);
        setImagePreview(null);
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) {
            errors.title = 'El título es requerido';
        }
        if (!formData.description.trim()) {
            errors.description = 'La descripción es requerida';
        }
        if (!editingBanner && !imageFile) {
            errors.image = 'La imagen es requerida';
        }
        if(formData.linkUrl && !/^https?:\/\//i.test(formData.linkUrl)) {
            errors.linkUrl = 'La URL debe comenzar con http:// o https://';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setUploading(true);
        try {
            let imageUrl = formData.imageUrl;
            
            // Upload image if a new file was selected
            if (imageFile) {
                const uploadResult = await uploadApi.uploadImage(imageFile);
                if (uploadResult.success && uploadResult.data) {
                    // Use the localPath from the upload response
                    // Format: uploads/products/{filename}.{extension}
                    const filename = uploadResult.data.filename;
                    imageUrl = `/uploads/products/${filename}`;
                } else {
                    throw new Error('Failed to upload image');
                }
            }

            const bannerData = {
                title: formData.title,
                description: formData.description,
                imageUrl: imageUrl,
                linkUrl: formData.linkUrl,
                linkName: formData.linkName
            };

            if (editingBanner) {
                // Update existing banner
                bannerData.id = editingBanner.id;
                await bannersApi.update(bannerData);
            } else {
                // Create new banner
                await bannersApi.create(bannerData);
            }

            await loadBanners();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save banner', error);
            alert('Error al guardar el banner. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este banner?')) {
            try {
                await bannersApi.delete(id);
                setBanners(banners.filter(b => b.id !== id));
            } catch (error) {
                console.error('Failed to delete banner', error);
                alert('Error al eliminar el banner');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Banners</h1>
                    <p className="text-zinc-400">Gestiona los banners de la página principal</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    Nuevo Banner
                </Button>
            </div>

            <Card>
                <Table headers={['Imagen', 'Título', 'Descripción', 'Acciones']}>
                    {banners.map((banner) => (
                        <tr key={banner.id}>
                            <td>
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                                    {banner.imageUrl ? (
                                        <img 
                                            src={`${IMAGE_SERVER_URL}${banner.imageUrl}`} 
                                            alt={banner.title} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="text-zinc-600" size={24} />
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className="font-medium">{banner.title}</span>
                            </td>
                            <td>
                                <span className="text-zinc-400 line-clamp-2">{banner.description}</span>
                            </td>
                            <td>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleOpenModal(banner)}
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDelete(banner.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${
                                        formErrors.title ? 'border-red-500' : 'border-zinc-700'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Título del banner"
                                />
                                {formErrors.title && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Descripción *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${
                                        formErrors.description ? 'border-red-500' : 'border-zinc-700'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                                    placeholder="Descripción del banner"
                                />
                                {formErrors.description && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                                )}
                            </div>

                            {/* Link URL */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Link URL (opcional)
                                </label>
                                <input
                                    type="url"
                                    name="linkUrl"
                                    value={formData.linkUrl}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${
                                        formErrors.linkUrl ? 'border-red-500' : 'border-zinc-700'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="https://ejemplo.com/pagina"
                                />
                                {formErrors.linkUrl && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.linkUrl}</p>
                                )}
                                <p className="text-xs text-zinc-500 mt-1">URL a la que redirige el banner al hacer clic</p>
                            </div>

                            {/* Link Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Nombre del Link (opcional)
                                </label>
                                <input
                                    type="text"
                                    name="linkName"
                                    value={formData.linkName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ver más, Comprar ahora, etc."
                                />
                                <p className="text-xs text-zinc-500 mt-1">Texto que se mostrará en el botón o enlace del banner</p>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Imagen {!editingBanner && '*'}
                                </label>
                                <div className="space-y-4">
                                    {imagePreview && (
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-zinc-800">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-center w-full">
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${
                                            formErrors.image ? 'border-red-500' : 'border-zinc-700'
                                        } border-dashed rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-750 transition-colors`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                                                <p className="mb-2 text-sm text-zinc-400">
                                                    <span className="font-semibold">Click para subir</span> o arrastra
                                                </p>
                                                <p className="text-xs text-zinc-500">PNG, JPG (MAX. 5MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                    {formErrors.image && (
                                        <p className="text-red-500 text-sm">{formErrors.image}</p>
                                    )}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCloseModal}
                                    disabled={uploading}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        editingBanner ? 'Actualizar' : 'Crear'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banners;
