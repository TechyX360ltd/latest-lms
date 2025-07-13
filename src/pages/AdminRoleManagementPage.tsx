import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { allAdminModules } from '../components/Admin/Sidebar';

const MODULE_OPTIONS = allAdminModules
  .filter(m => m.id !== 'overview' && m.id !== 'settings')
  .map(m => ({ id: m.id, label: m.label }));

function AdminForm({ user, onSave, onCancel, isSaving }: any) {
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    position: user?.position || '',
    modules: user?.modules || [],
    role: user?.role || 'admin',
  });
  const [allChecked, setAllChecked] = useState(false);

  useEffect(() => {
    setAllChecked(form.modules.length === MODULE_OPTIONS.length);
  }, [form.modules]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleModuleChange = (id: string, checked: boolean) => {
    setForm(f => ({
      ...f,
      modules: checked ? [...f.modules, id] : f.modules.filter((m: string) => m !== id),
    }));
  };

  const handleAllModules = (checked: boolean) => {
    setForm(f => ({
      ...f,
      modules: checked ? MODULE_OPTIONS.map(m => m.id) : [],
    }));
    setAllChecked(checked);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">{user ? 'Edit Admin' : 'Create Admin'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" required disabled={!!user} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Position</label>
          <input name="position" value={form.position} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Module Access</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allChecked} onChange={e => handleAllModules(e.target.checked)} /> All
          </label>
          {MODULE_OPTIONS.map(mod => (
            <label key={mod.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.modules.includes(mod.id)}
                onChange={e => handleModuleChange(mod.id, e.target.checked)}
              />
              {mod.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700" onClick={onCancel}>Cancel</button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors" disabled={isSaving}>
          {isSaving ? 'Saving...' : user ? 'Save Changes' : 'Create Admin'}
        </button>
      </div>
    </form>
  );
}

export default function AdminRoleManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('id, email, role, modules, first_name, last_name, created_at, last_login, position');
    setUsers(data || []);
    setLoading(false);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleSave = async (form: any) => {
    setIsSaving(true);
    if (editingUser) {
      await supabase.from('users').update({
        first_name: form.first_name,
        last_name: form.last_name,
        position: form.position,
        modules: form.modules,
      }).eq('id', editingUser.id);
      setToast('Admin updated.');
    } else {
      // Create user in Supabase Auth and send invite
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        email_confirm: true, // sends invite email
        user_metadata: {
          first_name: form.first_name,
          last_name: form.last_name,
          position: form.position,
          role: 'admin',
        },
      });
      if (authError) {
        setToast('Error creating user: ' + authError.message);
        setIsSaving(false);
        return;
      }
      // Insert into users table with the returned user id
      await supabase.from('users').insert({
        id: authUser.user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        position: form.position,
        modules: form.modules,
        role: 'admin',
      });
      setToast('Admin created and invitation sent.');
    }
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
    setIsSaving(false);
  };

  const filteredUsers = users.filter((u: any) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-3 px-1 md:px-2 lg:px-4 w-full">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Role Management</h1>
          <button className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors" onClick={handleAdd}>+ Add new user</button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search name or email..."
            className="border rounded px-3 py-2 w-full max-w-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="px-3 py-2 rounded bg-gray-100 text-gray-700 font-medium">Import</button>
          <button className="px-3 py-2 rounded bg-gray-100 text-gray-700 font-medium">Export</button>
        </div>
        {toast && <div className="mb-4 px-4 py-2 rounded text-white font-medium bg-green-600">{toast}</div>}
        <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 px-3 font-semibold">Name</th>
                <th className="py-2 px-3 font-semibold">Email</th>
                <th className="py-2 px-3 font-semibold">Role</th>
                <th className="py-2 px-3 font-semibold">Modules</th>
                <th className="py-2 px-3 font-semibold">Created On</th>
                <th className="py-2 px-3 font-semibold">Last Login</th>
                <th className="py-2 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No users found.</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{user.first_name} {user.last_name}</td>
                  <td className="py-2 px-3">{user.email}</td>
                  <td className="py-2 px-3 font-medium text-gray-900">{user.role}</td>
                  <td className="py-2 px-3">
                    {user.role === 'admin' && user.modules && user.modules.length > 0
                      ? user.modules.join(', ')
                      : user.role === 'super_admin' ? <span className="text-xs text-green-700">All modules</span> : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="py-2 px-3">{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</td>
                  <td className="py-2 px-3">{user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</td>
                  <td className="py-2 px-3">
                    <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={() => handleEdit(user)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-fadeIn">
              <AdminForm user={editingUser} onSave={handleSave} onCancel={() => setShowForm(false)} isSaving={isSaving} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 