import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Store, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StoreItem } from '../../types/gamification';
import { uploadToCloudinary } from '../../lib/cloudinary';

const defaultForm: Partial<StoreItem> = {
  name: '',
  description: '',
  icon_url: '',
  price: 0,
  item_type: 'avatar_frame',
  is_active: true,
  stock_quantity: -1,
};

const ITEM_TYPES = [
  'avatar_frame',
  'profile_background',
  'certificate_theme',
  'course_discount',
  'premium_feature',
];

export function StoreManagement() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [form, setForm] = useState<Partial<StoreItem>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch store items
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Open modal for add/edit
  const openModal = (item?: StoreItem) => {
    setEditingItem(item || null);
    setForm(item ? { ...item } : defaultForm);
    setShowModal(true);
  };

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  // Save (add or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (editingItem) {
      // Update
      const { error } = await supabase
        .from('store_items')
        .update(form)
        .eq('id', editingItem.id);
      if (error) setError(error.message);
    } else {
      // Add
      const { error } = await supabase
        .from('store_items')
        .insert([{ ...form }]);
      if (error) setError(error.message);
    }
    setSaving(false);
    setShowModal(false);
    fetchItems();
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    await supabase.from('store_items').delete().eq('id', id);
    fetchItems();
  };

  // Toggle active
  const handleToggleActive = async (item: StoreItem) => {
    await supabase.from('store_items').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchItems();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'store-items');
      setForm((prev) => ({ ...prev, icon_url: result.secure_url }));
    } catch (err) {
      alert('Failed to upload image.');
    }
    setUploading(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Store className="w-8 h-8 text-green-500" /> Store Management
        </h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow"
        >
          <Plus className="w-5 h-5" /> Add Item
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.item_type.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-700 font-bold">{item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.stock_quantity === -1 ? '∞' : item.stock_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {item.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {item.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openModal(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No store items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {editingItem ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingItem ? 'Edit Store Item' : 'Add Store Item'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
                {uploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
                {form.icon_url && (
                  <div className="mt-2">
                    <img src={form.icon_url} alt="Icon preview" className="w-16 h-16 object-contain rounded border" />
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price || 0}
                    onChange={handleChange}
                    min={0}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={form.stock_quantity ?? -1}
                    onChange={handleChange}
                    min={-1}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="item_type"
                  value={form.item_type || 'avatar_frame'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  {ITEM_TYPES.map((type) => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 