import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';

export function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState({ name: '', description: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    setCategories(data || []);
    setLoading(false);
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    setActionLoading(true);
    const { error } = await supabase.from('categories').insert([newCategory]);
    setActionLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditCategory({ name: category.name, description: category.description || '' });
  }

  async function handleEditCategory(id) {
    if (!editCategory.name.trim()) return;
    setActionLoading(true);
    const { error } = await supabase.from('categories').update(editCategory).eq('id', id);
    setActionLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setEditingId(null);
      fetchCategories();
    }
  }

  async function handleDeleteCategory(id) {
    setActionLoading(true);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    setActionLoading(false);
    setDeletingId(null);
    if (error) {
      setError(error.message);
    } else {
      fetchCategories();
    }
  }

  return (
    <div className="px-0 py-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Categories</h1>
      <form onSubmit={handleAddCategory} className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
          <input
            type="text"
            value={newCategory.name}
            onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. Coding, Design, Arts"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={newCategory.description}
            onChange={e => setNewCategory(c => ({ ...c, description: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional description"
          />
        </div>
        <button
          type="submit"
          disabled={actionLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
      {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>}
      <div className="bg-white rounded-xl shadow border border-gray-100 divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No categories found.</div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4">
              {editingId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editCategory.name}
                    onChange={e => setEditCategory(c => ({ ...c, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={editCategory.description}
                    onChange={e => setEditCategory(c => ({ ...c, description: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleEditCategory(category.id)}
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 font-medium text-gray-900">{category.name}</div>
                  <div className="flex-1 text-gray-500 text-sm">{category.description}</div>
                  <button
                    onClick={() => startEdit(category)}
                    className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg font-medium hover:bg-yellow-200 transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(category.id)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}
              {/* Delete confirmation */}
              {deletingId === category.id && (
                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0 md:ml-4">
                  <span className="text-red-700">Are you sure?</span>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={actionLoading}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Confirm
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 