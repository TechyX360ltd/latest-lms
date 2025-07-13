import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Trash2, Plus, Eye, EyeOff, X } from 'lucide-react';
import { saveAs } from 'file-saver';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  salary_text: string;
  is_active: boolean;
  description?: string;
  requirements?: string;
  created_at: string;
}

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initial?: Partial<Job>;
}

const JobFormModal: React.FC<JobFormProps> = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState<Partial<Job>>(initial || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial || {});
    setError('');
  }, [open, initial]);

  // Format salary as Naira with commas
  const formatNaira = (val: string) => {
    if (!val) return '';
    // Remove non-digits
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    return '₦' + parseInt(num, 10).toLocaleString();
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Remove non-digits for formatting
    const formatted = formatNaira(raw);
    setForm(f => ({ ...f, salary_text: formatted }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!form.title || !form.company || !form.location || !form.job_type) {
        setError('Please fill all required fields.');
        setSaving(false);
        return;
      }
      // If salary_text is empty, set to 'Attractive pay'
      const salaryToSave = form.salary_text && form.salary_text.trim() ? form.salary_text : 'Attractive pay';
      if (form.id) {
        // Update
        const { error } = await supabase.from('jobs').update({
          title: form.title,
          company: form.company,
          location: form.location,
          job_type: form.job_type,
          salary_text: salaryToSave,
          description: form.description,
          requirements: form.requirements,
          is_active: form.is_active ?? true,
        }).eq('id', form.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('jobs').insert({
          title: form.title,
          company: form.company,
          location: form.location,
          job_type: form.job_type,
          salary_text: salaryToSave,
          description: form.description,
          requirements: form.requirements,
          is_active: form.is_active ?? true,
        });
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving job');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="Close">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">{form.id ? 'Edit Job' : 'Add Job'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input name="title" value={form.title || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company *</label>
              <input name="company" value={form.company || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <input name="location" value={form.location || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Job Type *</label>
              <select name="job_type" value={form.job_type || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              name="salary_text"
              value={form.salary_text || ''}
              onChange={handleSalaryChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. 200000 or leave blank for Attractive pay"
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <span className="text-xs text-gray-400">Leave blank for "Attractive pay"</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requirements</label>
            <textarea name="requirements" value={form.requirements || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={form.is_active ?? true} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            <label className="text-sm">Active</label>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              {saving ? 'Saving...' : (form.id ? 'Update Job' : 'Add Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminJobBoardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState<Partial<Job> | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Search/filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, job_type, salary_text, is_active, description, requirements, created_at')
      .order('created_at', { ascending: false });
    if (!error) setJobs(data || []);
    setLoading(false);
  };

  // Get unique companies for filter
  const companies = Array.from(new Set(jobs.map(j => j.company))).sort();

  // Advanced filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? job.job_type === typeFilter : true;
    const matchesStatus = statusFilter ? (statusFilter === 'active' ? job.is_active : !job.is_active) : true;
    const matchesCompany = companyFilter ? job.company === companyFilter : true;
    const matchesDateFrom = dateFrom ? new Date(job.created_at) >= new Date(dateFrom) : true;
    const matchesDateTo = dateTo ? new Date(job.created_at) <= new Date(dateTo) : true;
    return matchesSearch && matchesType && matchesStatus && matchesCompany && matchesDateFrom && matchesDateTo;
  });
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 if filters/search change
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, companyFilter, dateFrom, dateTo]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    setDeletingId(id);
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (!error) {
      setToast({ message: 'Job deleted successfully.', type: 'success' });
      fetchJobs();
    } else {
      setToast({ message: 'Error deleting job.', type: 'error' });
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (job: Job) => {
    const { error } = await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id);
    if (!error) {
      setToast({ message: `Job marked as ${!job.is_active ? 'active' : 'inactive'}.`, type: 'success' });
      fetchJobs();
    } else {
      setToast({ message: 'Error updating status.', type: 'error' });
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Title', 'Company', 'Location', 'Type', 'Salary', 'Status', 'Created At'],
      ...paginatedJobs.map(j => [j.title, j.company, j.location, j.job_type, j.salary_text || '', j.is_active ? 'Active' : 'Inactive', j.created_at])
    ];
    const csv = rows.map(r => r.map(x => '"' + (x || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `jobs-${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedJobs.map(j => j.id) : []);
  };
  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(ids => checked ? [...ids, id] : ids.filter(x => x !== id));
  };
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected jobs?')) return;
    await supabase.from('jobs').delete().in('id', selectedIds);
    setToast({ message: 'Selected jobs deleted.', type: 'success' });
    setSelectedIds([]); fetchJobs();
  };
  const handleBulkStatus = async (active: boolean) => {
    await supabase.from('jobs').update({ is_active: active }).in('id', selectedIds);
    setToast({ message: `Selected jobs marked as ${active ? 'active' : 'inactive'}.`, type: 'success' });
    setSelectedIds([]); fetchJobs();
  };

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50 py-3 px-1 md:px-2 lg:px-4 w-full">
      <div className="w-full max-w-6xl mx-auto">
        {toast && (
          <div className={`mb-4 px-4 py-2 rounded text-white font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
        )}
        {/* Page Title and Add Job Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Job Management</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors" onClick={() => { setEditJob(undefined); setModalOpen(true); }}>
            <Plus className="w-5 h-5" /> Add Job
          </button>
        </div>
        {/* Export, Bulk Actions, and Advanced Filters */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Export CSV</button>
          {selectedIds.length > 0 && (
            <div className="flex gap-2 items-center bg-gray-100 px-3 py-2 rounded">
              <span className="text-sm">{selectedIds.length} selected</span>
              <button onClick={handleBulkDelete} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
              <button onClick={() => handleBulkStatus(true)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Mark Active</button>
              <button onClick={() => handleBulkStatus(false)} className="px-2 py-1 bg-gray-600 text-white rounded text-xs">Mark Inactive</button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="border rounded px-3 py-2">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-3 py-2" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-3 py-2" />
          </div>
        </div>
        {/* Search/Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-56"
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="text-gray-500 text-sm ml-auto">{paginatedJobs.length} jobs found</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 px-3 font-semibold"><input type="checkbox" checked={paginatedJobs.length > 0 && paginatedJobs.every(j => selectedIds.includes(j.id))} onChange={e => handleSelectAll(e.target.checked)} /></th>
                <th className="py-2 px-3 font-semibold">Title</th>
                <th className="py-2 px-3 font-semibold">Company</th>
                <th className="py-2 px-3 font-semibold">Location</th>
                <th className="py-2 px-3 font-semibold">Type</th>
                <th className="py-2 px-3 font-semibold">Salary</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : paginatedJobs.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">No jobs found.</td></tr>
              ) : paginatedJobs.map(job => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3"><input type="checkbox" checked={selectedIds.includes(job.id)} onChange={e => handleSelectRow(job.id, e.target.checked)} /></td>
                  <td className="py-2 px-3 font-medium text-gray-900">{job.title}</td>
                  <td className="py-2 px-3">{job.company}</td>
                  <td className="py-2 px-3">{job.location}</td>
                  <td className="py-2 px-3">{job.job_type}</td>
                  <td className="py-2 px-3">{job.salary_text || 'Not specified'}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => handleToggleActive(job)} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium focus:outline-none transition-colors"
                      style={{ background: job.is_active ? '#dcfce7' : '#f3f4f6', color: job.is_active ? '#15803d' : '#6b7280' }}
                      title={job.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {job.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} {job.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-2 px-3 flex gap-2">
                    <button className="p-2 rounded hover:bg-blue-50" title="Edit" onClick={() => { setEditJob(job); setModalOpen(true); }}><Pencil className="w-4 h-4 text-blue-600" /></button>
                    <button className="p-2 rounded hover:bg-red-50" title="Delete" onClick={() => handleDelete(job.id)} disabled={deletingId === job.id}>
                      <Trash2 className={`w-4 h-4 ${deletingId === job.id ? 'animate-spin' : 'text-red-600'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-gray-600 text-sm">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
        <JobFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={() => { fetchJobs(); setToast({ message: editJob ? 'Job updated successfully.' : 'Job posted successfully.', type: 'success' }); }} initial={editJob} />
      </div>
    </div>
  );
};

export default AdminJobBoardPage; 