import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CheckCircle, XCircle, ShieldAlert, Loader2, Eye, Search, RefreshCw, Edit3, Save, Mail, Phone, MapPin, Briefcase, GraduationCap, User as UserIcon, BookOpen, DollarSign, Image as ImageIcon, FileText } from 'lucide-react';

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  unverified: 'bg-gray-100 text-gray-700',
};

export default function InstructorManagement() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({});

  useEffect(() => {
    fetchInstructors();
  }, []);

  async function fetchInstructors() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'instructor');
    setInstructors(data || []);
    setLoading(false);
  }

  function filtered() {
    return instructors.filter((i) => {
      const matchesSearch =
        i.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? i.verification_status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }

  // Instructor stats
  const total = instructors.length;
  const verified = instructors.filter(i => i.verification_status === 'verified').length;
  const pending = instructors.filter(i => i.verification_status === 'pending').length;
  const rejected = instructors.filter(i => i.verification_status === 'rejected').length;
  const unverified = instructors.filter(i => !i.verification_status || i.verification_status === 'unverified').length;

  async function handleAction(user_id: string, status: string) {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-instructor-verification', {
        body: {
          user_id,
          verification_status: status,
          verification_rejection_reason: status === 'rejected' ? rejectionReason : null,
        },
      });
      if (error) {
        alert('Failed to update verification status: ' + error.message);
      } else {
        setSelected(null);
        setRejectionReason('');
        fetchInstructors();
      }
    } catch (err: any) {
      alert('Failed to update verification status: ' + (err.message || err));
    } finally {
      setActionLoading(false);
    }
  }

  async function openInstructorDetails(i: any) {
    setSelected(i);
    setProfileLoading(true);
    // Fetch full profile
    const { data: userData } = await supabase.from('users').select('*').eq('id', i.id).single();
    setProfile(userData);
    setEditProfile(userData);
    // Fetch courses
    const { data: courseData } = await supabase.from('courses').select('id, title, enrolled_count, is_published').eq('instructor_id', i.id);
    setCourses(courseData || []);
    // Fetch earnings
    const { data: paymentData } = await supabase.from('payments').select('amount, status').eq('instructor_id', i.id);
    const totalEarnings = (paymentData || []).filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    setEarnings(totalEarnings);
    setProfileLoading(false);
  }

  async function handleProfileEditSave() {
    setActionLoading(true);
    await supabase.from('users').update({
      first_name: editProfile.first_name,
      last_name: editProfile.last_name,
      email: editProfile.email,
      phone: editProfile.phone,
      bio: editProfile.bio,
      location: editProfile.location,
      occupation: editProfile.occupation,
      education: editProfile.education,
    }).eq('id', profile.id);
    setProfile({ ...profile, ...editProfile });
    setEditMode(false);
    setActionLoading(false);
    fetchInstructors();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Instructor Management</h1>

      {/* Instructor Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-blue-900">{total}</div>
            <div className="text-blue-700 text-sm font-medium">Total Instructors</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <div className="text-2xl font-bold text-green-900">{verified}</div>
            <div className="text-green-700 text-sm font-medium">Verified</div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-yellow-500" />
          <div>
            <div className="text-2xl font-bold text-yellow-900">{pending}</div>
            <div className="text-yellow-700 text-sm font-medium">Pending</div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <XCircle className="w-8 h-8 text-red-600" />
          <div>
            <div className="text-2xl font-bold text-red-900">{rejected + unverified}</div>
            <div className="text-red-700 text-sm font-medium">Rejected / Unverified</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="outline-none flex-1 bg-transparent"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-lg px-3 py-2 bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="unverified">Unverified</option>
        </select>
        <button
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={fetchInstructors}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                </td>
              </tr>
            ) : filtered().length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">No instructors found.</td>
              </tr>
            ) : (
              filtered().map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3">{i.first_name} {i.last_name}</td>
                  <td className="px-4 py-3">{i.email}</td>
                  <td className="px-4 py-3">{i.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[i.verification_status || 'unverified']}`}> 
                      {i.verification_status === 'verified' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {i.verification_status === 'pending' && <ShieldAlert className="w-4 h-4 text-yellow-500" />}
                      {i.verification_status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                      {i.verification_status === 'unverified' && <ShieldAlert className="w-4 h-4 text-gray-500" />}
                      {i.verification_status?.charAt(0).toUpperCase() + i.verification_status?.slice(1) || 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-blue-600 hover:underline mr-3"
                      onClick={() => openInstructorDetails(i)}
                    >
                      <Eye className="w-4 h-4 inline" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => { setSelected(null); setProfile(null); setCourses([]); setEarnings(null); setEditMode(false); }}>
              <XCircle className="w-6 h-6" />
            </button>
            {profileLoading || !profile ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <div className="text-blue-700 font-medium">Loading instructor details...</div>
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    {editMode ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input type="text" className="border rounded px-2 py-1 flex-1" value={editProfile.first_name || ''} onChange={e => setEditProfile({ ...editProfile, first_name: e.target.value })} placeholder="First Name" />
                          <input type="text" className="border rounded px-2 py-1 flex-1" value={editProfile.last_name || ''} onChange={e => setEditProfile({ ...editProfile, last_name: e.target.value })} placeholder="Last Name" />
                        </div>
                        <input type="email" className="border rounded px-2 py-1" value={editProfile.email || ''} onChange={e => setEditProfile({ ...editProfile, email: e.target.value })} placeholder="Email" />
                        <input type="tel" className="border rounded px-2 py-1" value={editProfile.phone || ''} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} placeholder="Phone" />
                      </div>
                    ) : (
                      <h2 className="text-2xl font-bold mb-1">{profile.first_name} {profile.last_name}</h2>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" /> <span className="text-gray-700 text-sm">{profile.email}</span>
                      <Phone className="w-4 h-4 text-gray-400 ml-4" /> <span className="text-gray-700 text-sm">{profile.phone}</span>
                    </div>
                  </div>
                  <div>
                    {!editMode ? (
                      <button className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-200" onClick={() => setEditMode(true)}><Edit3 className="w-4 h-4" /> Edit</button>
                    ) : (
                      <button className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-200" onClick={handleProfileEditSave} disabled={actionLoading}><Save className="w-4 h-4" /> Save</button>
                    )}
                  </div>
                </div>
                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4" /> {editMode ? <input type="text" className="border rounded px-2 py-1 w-full" value={editProfile.location || ''} onChange={e => setEditProfile({ ...editProfile, location: e.target.value })} placeholder="Location" /> : profile.location || <span className="text-gray-400">—</span>}</div>
                    <div className="flex items-center gap-2 text-gray-700"><Briefcase className="w-4 h-4" /> {editMode ? <input type="text" className="border rounded px-2 py-1 w-full" value={editProfile.occupation || ''} onChange={e => setEditProfile({ ...editProfile, occupation: e.target.value })} placeholder="Occupation" /> : profile.occupation || <span className="text-gray-400">—</span>}</div>
                    <div className="flex items-center gap-2 text-gray-700"><GraduationCap className="w-4 h-4" /> {editMode ? <input type="text" className="border rounded px-2 py-1 w-full" value={editProfile.education || ''} onChange={e => setEditProfile({ ...editProfile, education: e.target.value })} placeholder="Education" /> : profile.education || <span className="text-gray-400">—</span>}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-gray-700"><BookOpen className="w-4 h-4 mt-1" /> <span className="font-semibold">Bio:</span> {editMode ? <textarea className="border rounded px-2 py-1 w-full" value={editProfile.bio || ''} onChange={e => setEditProfile({ ...editProfile, bio: e.target.value })} placeholder="Bio" /> : profile.bio || <span className="text-gray-400">—</span>}</div>
                  </div>
                </div>
                {/* Uploaded ID */}
                {profile.verification_id_url && (
                  <div className="mb-4">
                    <span className="font-semibold">Uploaded ID:</span>
                    {profile.verification_id_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <a href={profile.verification_id_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-blue-600 inline-flex items-center gap-1"><ImageIcon className="w-4 h-4" /> View Image</a>
                    ) : (
                      <a href={profile.verification_id_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-blue-600 inline-flex items-center gap-1"><FileText className="w-4 h-4" /> View Document</a>
                    )}
                  </div>
                )}
                {/* Earnings & Courses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
                    <DollarSign className="w-7 h-7 text-green-600" />
                    <div>
                      <div className="text-lg font-bold text-green-900">₦{earnings?.toLocaleString() || 0}</div>
                      <div className="text-green-700 text-xs font-medium">Total Earnings</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                    <BookOpen className="w-7 h-7 text-blue-600" />
                    <div>
                      <div className="text-lg font-bold text-blue-900">{courses.length}</div>
                      <div className="text-blue-700 text-xs font-medium">Courses Listed</div>
                    </div>
                  </div>
                </div>
                {/* Courses Table */}
                <div className="mb-4">
                  <div className="font-semibold mb-2">Courses:</div>
                  {courses.length === 0 ? (
                    <div className="text-gray-500 text-sm">No courses listed.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border rounded">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left font-semibold">Title</th>
                            <th className="px-3 py-2 text-left font-semibold">Enrollments</th>
                            <th className="px-3 py-2 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map((c) => (
                            <tr key={c.id} className="border-t">
                              <td className="px-3 py-2">{c.title}</td>
                              <td className="px-3 py-2">{c.enrolled_count}</td>
                              <td className="px-3 py-2">{c.is_published ? 'Published' : 'Draft'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {/* Verification Controls */}
                <div className="flex gap-3 mt-6">
                  {profile.verification_status !== 'verified' && (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                      disabled={actionLoading}
                      onClick={() => handleAction(profile.id, 'verified')}
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                  )}
                  {profile.verification_status !== 'rejected' && (
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
                      disabled={actionLoading}
                      onClick={() => handleAction(profile.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                  {profile.verification_status !== 'pending' && (
                    <button
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 flex items-center gap-2"
                      disabled={actionLoading}
                      onClick={() => handleAction(profile.id, 'pending')}
                    >
                      <ShieldAlert className="w-4 h-4" /> Set Pending
                    </button>
                  )}
                </div>
                {profile.verification_status !== 'rejected' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Rejection Reason (optional):</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      disabled={actionLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 