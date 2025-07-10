import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Award, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../types/gamification';
import { uploadToCloudinary } from '../../lib/cloudinary';

const defaultForm: Partial<Badge> = {
  name: '',
  description: '',
  icon_url: '',
  points_required: 0,
  category: '',
  rarity: 'common',
  is_active: true,
};

const RARITIES = ['common', 'rare', 'epic', 'legendary'];

export function BadgeManagement() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [form, setForm] = useState<Partial<Badge>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch badges
  const fetchBadges = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('points_required', { ascending: true });
    if (error) setError(error.message);
    setBadges(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  // Open modal for add/edit
  const openModal = (badge?: Badge) => {
    setEditingBadge(badge || null);
    setForm(badge ? { ...badge } : defaultForm);
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

  // Add this handler for file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'badges');
      setForm((prev) => ({ ...prev, icon_url: result.secure_url }));
    } catch (err) {
      alert('Failed to upload image.');
    }
    setUploading(false);
  };

  // Save (add or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (editingBadge) {
      // Update
      const { error } = await supabase
        .from('badges')
        .update(form)
        .eq('id', editingBadge.id);
      if (error) setError(error.message);
    } else {
      // Add
      const { error } = await supabase
        .from('badges')
        .insert([{ ...form }]);
      if (error) setError(error.message);
    }
    setSaving(false);
    setShowModal(false);
    fetchBadges();
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this badge?')) return;
    setLoading(true);
    await supabase.from('badges').delete().eq('id', id);
    fetchBadges();
  };

  // Toggle active
  const handleToggleActive = async (badge: Badge) => {
    await supabase.from('badges').update({ is_active: !badge.is_active }).eq('id', badge.id);
    fetchBadges();
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="w-8 h-8 text-yellow-500" /> Badge Management
        </h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium shadow"
        >
          <Plus className="w-5 h-5" /> Add Badge
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rarity</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {badges.map((badge) => (
                <tr key={badge.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{badge.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{badge.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-yellow-700 font-bold">{badge.points_required}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 capitalize">{badge.rarity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(badge)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${badge.is_active ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {badge.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {badge.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openModal(badge)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {badges.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No badges found.</td>
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
              {editingBadge ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingBadge ? 'Edit Badge' : 'Add Badge'}
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
                  <input
                    type="number"
                    name="points_required"
                    value={form.points_required || 0}
                    onChange={handleChange}
                    min={0}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={form.category || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                <select
                  name="rarity"
                  value={form.rarity || 'common'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 text-yellow-500 border-gray-300 rounded"
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
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingBadge ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 