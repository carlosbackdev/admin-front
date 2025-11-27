import React, { useEffect, useState } from 'react';
import { categoriesApi, IMAGE_SERVER_URL } from '../services/api';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: '', logo: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            response.data.forEach((category) => {
                category.logo = `${IMAGE_SERVER_URL}${category.logo}`;
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await categoriesApi.delete(id);
                setCategories(categories.filter(c => c.id !== id));
            } catch (error) {
                console.error('Failed to delete category', error);
                alert('Failed to delete category');
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newCategory.name) return;

        setCreating(true);
        try {
            // Construct the full logo path
            const categoryToSave = {
                ...newCategory,
                logo: newCategory.logo ? `/images/logo/${newCategory.logo}` : ''
            };
            await categoriesApi.create(categoryToSave);
            setNewCategory({ name: '', logo: '' });
            loadCategories();
            alert('Category created successfully');
        } catch (error) {
            console.error('Failed to create category', error);
            alert('Failed to create category');
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="animate-fade-in">
            <h1 className="mb-6">Categories</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <h3 className="mb-4 text-lg font-semibold">New Category</h3>
                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-400">Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-400">Logo Filename</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newCategory.logo}
                                    onChange={(e) => setNewCategory({ ...newCategory, logo: e.target.value })}
                                    placeholder="category-name.png"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Full path: <code className="text-slate-400">/images/logo/{newCategory.logo || 'filename'}</code>
                                </p>
                            </div>
                            <Button type="submit" disabled={creating} className="w-full">
                                <Plus size={18} />
                                {creating ? 'Creating...' : 'Create Category'}
                            </Button>
                        </form>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Table headers={['ID', 'Logo', 'Name', 'Actions']}>
                        {categories.map((category) => (
                            <tr key={category.id}>
                                <td>#{category.id}</td>
                                <td>
                                    <div className="w-10 h-10 rounded bg-slate-700 overflow-hidden flex items-center justify-center">
                                        {category.logo ? (
                                            <img src={category.logo} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={20} className="text-slate-500" />
                                        )}
                                    </div>
                                </td>
                                <td className="font-medium">{category.name}</td>
                                <td>
                                    <button
                                        className="p-2 hover:bg-slate-700 rounded text-red-400 transition-colors"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default Categories;
