import React, { useEffect, useState } from 'react';
import { blogApi, uploadApi, IMAGE_SERVER_URL } from '../services/api';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Trash2, Edit, X, Upload, Image as ImageIcon } from 'lucide-react';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: '',
        tags: '',
        readTime: 0,
        imageUrl: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const response = await blogApi.getAll();
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to load posts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (post = null) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                author: post.author,
                tags: post.tags,
                readTime: post.readTime,
                imageUrl: post.imageUrl
            });
            setImagePreview(post.imageUrl ? `${IMAGE_SERVER_URL}${post.imageUrl}` : null);
        } else {
            setEditingPost(null);
            setFormData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                author: '',
                tags: '',
                readTime: 0,
                imageUrl: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPost(null);
        setFormData({ title: '', slug: '', excerpt: '', content: '', author: '', tags: '', readTime: 0, imageUrl: '' });
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
        if (!formData.title.trim()) errors.title = 'El título es requerido';
        if (!formData.slug.trim()) errors.slug = 'El slug es requerido';
        if (!formData.excerpt.trim()) errors.excerpt = 'El resumen es requerido';
        if (!formData.content.trim()) errors.content = 'El contenido es requerido';
        if (!editingPost && !imageFile && !formData.imageUrl) {
            errors.image = 'La imagen es requerida';
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
                    const filename = uploadResult.data.filename;
                    imageUrl = `/uploads/products/${filename}`;
                } else {
                    throw new Error('Failed to upload image');
                }
            }

            const postData = {
                ...formData,
                imageUrl,
                readTime: parseInt(formData.readTime, 10) || 0
            };

            if (editingPost) {
                // Update existing post
                postData.id = editingPost.id;
                // Docs say "post" object in query, but standard implementation often uses body.
                // Assuming body similar to banners based on consistency.
                await blogApi.update(postData);
            } else {
                // Create new post
                await blogApi.create(postData);
            }

            await loadPosts();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save post', error);
            alert('Error al guardar el post. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este post?')) {
            try {
                await blogApi.delete(id);
                setPosts(posts.filter(p => p.id !== id));
            } catch (error) {
                console.error('Failed to delete post', error);
                alert('Error al eliminar el post');
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
                    <h1 className="text-3xl font-bold text-white mb-2">Blog</h1>
                    <p className="text-zinc-400">Gestiona los posts del blog</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    Nuevo Post
                </Button>
            </div>

            <Card>
                <Table headers={['Imagen', 'Título', 'Autor', 'Fecha', 'Acciones']}>
                    {posts.map((post) => (
                        <tr key={post.id}>
                            <td>
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                                    {post.imageUrl ? (
                                        <img
                                            src={`${IMAGE_SERVER_URL}${post.imageUrl}`}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="text-zinc-600" size={24} />
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className="font-medium">{post.title}</span>
                            </td>
                            <td>
                                <span className="text-zinc-400">{post.author}</span>
                            </td>
                            <td>
                                <span className="text-zinc-400">
                                    {new Date(post.date).toLocaleDateString()}
                                </span>
                            </td>
                            <td>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleOpenModal(post)}
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDelete(post.id)}
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
                                {editingPost ? 'Editar Post' : 'Nuevo Post'}
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
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${formErrors.title ? 'border-red-500' : 'border-zinc-700'
                                        } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Título del post"
                                />
                                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Slug *
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${formErrors.slug ? 'border-red-500' : 'border-zinc-700'
                                        } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="slug-del-post"
                                />
                                {formErrors.slug && <p className="text-red-500 text-sm mt-1">{formErrors.slug}</p>}
                            </div>

                            {/* Excerpt */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Resumen *
                                </label>
                                <textarea
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${formErrors.excerpt ? 'border-red-500' : 'border-zinc-700'
                                        } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                                    placeholder="Breve resumen del post"
                                />
                                {formErrors.excerpt && <p className="text-red-500 text-sm mt-1">{formErrors.excerpt}</p>}
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Contenido *
                                </label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className={`w-full px-4 py-2 bg-zinc-800 border ${formErrors.content ? 'border-red-500' : 'border-zinc-700'
                                        } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                                    placeholder="Contenido completo del post..."
                                />
                                {formErrors.content && <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Author */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Autor
                                    </label>
                                    <input
                                        type="text"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nombre del autor"
                                    />
                                </div>
                                {/* Read Time */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Tiempo de lectura (min)
                                    </label>
                                    <input
                                        type="number"
                                        name="readTime"
                                        value={formData.readTime}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="tecnologia, novedades, etc."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Imagen {!editingPost && '*'}
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
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${formErrors.image ? 'border-red-500' : 'border-zinc-700'
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
                                        editingPost ? 'Actualizar' : 'Crear'
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

export default Blog;
