import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Mail, Phone, RefreshCw, Eye } from 'lucide-react';
import { useUsers } from '../../hooks/useData';
import { AddUser } from './AddUser';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Auth/ToastContext';

function DeleteUserModal({ isOpen, onClose, onConfirm, userEmail }: { isOpen: boolean; onClose: () => void; onConfirm: (password: string) => void; userEmail: string; }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!password) {
      setError('Please enter your admin password.');
      return;
    }
    setError('');
    onConfirm(password);
  };

  React.useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Delete User?</h2>
          <p className="text-gray-700 mb-4">Are you sure you want to delete <b>{userEmail}</b>? This action cannot be undone.</p>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="new-password"
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="flex gap-3 mt-4 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserManagement() {
  const { users, addUser, refreshUsers, loading, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string; userEmail: string }>({ open: false, userId: '', userEmail: '' });
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Refresh users when component mounts to get latest data
  useEffect(() => {
    refreshUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleCreateUser = async (userData: any) => {
    console.log('Creating user:', userData);
    // Add the user to the local state
    addUser(userData);
    // Refresh the users list to get the latest data from localStorage
    refreshUsers();
    setShowAddUser(false);
  };

  const handleCancelCreate = () => {
    setShowAddUser(false);
  };

  const handleRefreshUsers = () => {
    refreshUsers();
  };

  if (showAddUser) {
    return <AddUser onSave={handleCreateUser} onCancel={handleCancelCreate} />;
  }

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  }) : [];

  const handleDeleteUser = (userId: string, userEmail: string) => {
    setDeleteModal({ open: true, userId, userEmail });
  };

  const handleConfirmDelete = async (password: string) => {
    if (password !== 'password') {
      showToast('Incorrect admin password. User was not deleted.', 'error');
      return;
    }
    try {
      await deleteUser(deleteModal.userId);
      showToast('User deleted successfully.', 'success');
      setDeleteModal({ open: false, userId: '', userEmail: '' });
    } catch (err) {
      showToast('Failed to delete user.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage platform users and their permissions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefreshUsers}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Refresh Users"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="learner">Learners</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">User</th>
                <th className="text-left p-4 font-medium text-gray-900">Contact</th>
                <th className="text-left p-4 font-medium text-gray-900">Role</th>
                <th className="text-left p-4 font-medium text-gray-900">Enrolled Courses</th>
                <th className="text-left p-4 font-medium text-gray-900">Joined</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {(user.first_name?.[0] || '')}{(user.last_name?.[0] || '')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.first_name || ''} {user.last_name || ''}</p>
                        <p className="text-sm text-gray-500">{user.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.email || ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role || ''}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-900">{Array.isArray(user.enrolledCourses) ? user.enrolledCourses.length : 0}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View User"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DeleteUserModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: '', userEmail: '' })}
        onConfirm={handleConfirmDelete}
        userEmail={deleteModal.userEmail}
      />

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or add new users</p>
        </div>
      )}
    </div>
  );
}