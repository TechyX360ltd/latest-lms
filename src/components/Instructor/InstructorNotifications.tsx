import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { useNotifications } from '../../hooks/useData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Auth/ToastContext';
import { useUsers } from '../../hooks/useData';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
];

export default function InstructorNotifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    recipientType: 'specific',
    selectedUsers: [] as string[],
    selectedCourse: '',
    scheduledFor: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userRoleFilter, setUserRoleFilter] = useState('learner');
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [courseUsers, setCourseUsers] = useState<any[]>([]);
  const { users, loading: usersLoading } = useUsers();
  const [sending, setSending] = useState(false);
  const { notifications, loading, setNotifications } = useNotifications();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Filter notifications by tab and instructor
  const filtered = React.useMemo(() => {
    if (!notifications) return [];
    if (activeTab === 'all') {
      // Show notifications where instructor is sender OR recipient
      return notifications.filter(
        (n) => n.senderId === user?.id || n.recipients.some((r: any) => r.userId === user?.id)
      );
    }
    if (activeTab === 'sent') {
      // Show notifications sent by instructor
      return notifications.filter((n) => n.senderId === user?.id);
    }
    if (activeTab === 'received') {
      // Show notifications where instructor is a recipient but not the sender
      return notifications.filter(
        (n) => n.senderId !== user?.id && n.recipients.some((r: any) => r.userId === user?.id)
      );
    }
    return notifications;
  }, [notifications, activeTab, user]);

  // Fetch instructor's courses
  useEffect(() => {
    async function fetchCourses() {
      if (!user) return;
      const { data, error } = await supabase.from('courses').select('*').eq('instructor', user.id);
      if (!error && data) setInstructorCourses(data);
    }
    fetchCourses();
  }, [user]);

  // Fetch users enrolled in instructor's courses
  useEffect(() => {
    async function fetchCourseUsers() {
      if (!user) return;
      if (instructorCourses.length === 0) return setCourseUsers([]);
      const courseIds = instructorCourses.map((c) => c.id);
      const { data: enrollments } = await supabase.from('enrollments').select('user_id, course_id').in('course_id', courseIds);
      const userIds = enrollments?.map((e: any) => e.user_id) || [];
      const filtered = users.filter((u) => userIds.includes(u.id));
      setCourseUsers(filtered);
    }
    fetchCourseUsers();
  }, [user, instructorCourses, users]);

  // Filtered users for recipient selection
  const filteredUsers = courseUsers.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const search = userSearch.toLowerCase();
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesSearch = !search || fullName.includes(search) || email.includes(search);
    return matchesRole && matchesSearch;
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Send notification logic
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    let recipientIds: string[] = [];
    let courseId: string | null = null;

    if (formData.recipientType === 'specific') {
      recipientIds = formData.selectedUsers;
    } else if (formData.recipientType === 'course') {
      courseId = formData.selectedCourse;
      if (!courseId) {
        setErrors(prev => ({ ...prev, course: 'Please select a course' }));
        return;
      }
      const { data: enrollments } = await supabase.from('enrollments').select('user_id').eq('course_id', courseId);
      recipientIds = enrollments?.map((e: any) => e.user_id) || [];
    }

    if (!formData.title || !formData.message || recipientIds.length === 0) {
      showToast('Please fill all fields and select recipients', 'error');
      return;
    }

    setSending(true);
    try {
      // Insert notification
      const { data: notification, error } = await supabase.from('notifications').insert([
        {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          priority: formData.priority,
          course_id: courseId || null,
          sender_id: user?.id,
          scheduled_for: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : null,
        },
      ]).select().single();
      if (error) throw error;

      // Insert recipients
      if (notification && recipientIds.length > 0) {
        const recipientRows = recipientIds.map((uid) => ({ notification_id: notification.id, user_id: uid }));
        await supabase.from('notification_recipients').insert(recipientRows);
      }

      // Insert attachments
      if (attachments.length > 0) {
        const attachmentRows = attachments.map((file, index) => ({
          notification_id: notification?.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: `uploads/${notification?.id}/${file.name}`, // Placeholder for actual upload logic
          order: index,
        }));
        await supabase.from('notification_attachments').insert(attachmentRows);
      }

      showToast('Notification sent!', 'confirmation');
      setShowModal(false);
      setFormData({ title: '', message: '', type: 'info', priority: 'medium', recipientType: 'specific', selectedUsers: [], selectedCourse: '', scheduledFor: '' });
      setAttachments([]);
      setErrors({});
      // Optionally, refresh notifications
      setNotifications((prev: any) => [notification, ...prev]);
    } catch (err: any) {
      showToast('Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  // Mark as read/starred
  const handleMark = async (notificationId: string, action: 'read' | 'star') => {
    try {
      if (!user) return;
      if (action === 'read') {
        await supabase.from('notification_recipients').update({ is_read: true, read_at: new Date().toISOString() }).eq('notification_id', notificationId).eq('user_id', user.id);
      } else if (action === 'star') {
        await supabase.from('notification_recipients').update({ is_starred: true, starred_at: new Date().toISOString() }).eq('notification_id', notificationId).eq('user_id', user.id);
      }
      // Optionally, refresh notifications
    } catch (err) {
      showToast('Failed to update notification', 'error');
    }
  };

  // Reply to notification
  const handleReply = async (notificationId: string, message: string) => {
    try {
      if (!user) return;
      await supabase.from('notification_replies').insert({ notification_id: notificationId, user_id: user.id, message });
      showToast('Reply sent!', 'confirmation');
      // Optionally, refresh notifications
    } catch (err) {
      showToast('Failed to send reply', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Notifications</h1>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition text-base"
                onClick={() => setShowModal(true)}
              >
                + Send Notification
              </button>
            </div>
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`px-4 py-2 font-medium border-b-2 transition-all duration-150 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-blue-600'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Notification List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-gray-400 text-center py-12">Loading notifications...</div>
              ) : filtered.length === 0 ? (
                <div className="text-gray-400 text-center py-12">No notifications found.</div>
              ) : (
                filtered.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">{n.title}</h2>
                      <p className="text-gray-700 mb-2">{n.message}</p>
                      <div className="text-xs text-gray-500 mb-1">Recipients: {n.recipients?.map?.((r: any) => r.userName).join(', ') || ''}</div>
                      <div className="text-xs text-gray-400">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      {/* Status */}
                      {n.recipients?.some?.((r: any) => r.userId === user?.id && r.isRead) ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Read</span>
                      ) : (
                        <button className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700" onClick={() => handleMark(n.id, 'read')}>Mark as Read</button>
                      )}
                      {/* Star */}
                      <button className="text-yellow-500 hover:text-yellow-600 text-sm" onClick={() => handleMark(n.id, 'star')}>★</button>
                      {/* Reply */}
                      <button className="text-blue-600 hover:underline text-sm" onClick={() => {
                        const reply = prompt('Enter your reply:');
                        if (reply) handleReply(n.id, reply);
                      }}>Reply</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Send Notification Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>
                <form onSubmit={handleSend} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-300' : 'border-gray-300'}`} placeholder="Notification title" />
                      {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For (Optional)</label>
                      <input type="datetime-local" value={formData.scheduledFor} onChange={e => setFormData({ ...formData, scheduledFor: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} rows={4} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.message ? 'border-red-300' : 'border-gray-300'}`} placeholder="Enter your message..." />
                    {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Recipients *</label>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" value="specific" checked={formData.recipientType === 'specific'} onChange={e => setFormData({ ...formData, recipientType: e.target.value })} className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Specific Users</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" value="course" checked={formData.recipientType === 'course'} onChange={e => setFormData({ ...formData, recipientType: e.target.value })} className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Course Students</span>
                        </label>
                      </div>
                      {formData.recipientType === 'specific' && (
                        <div className="mb-4">
                          <div className="flex flex-col sm:flex-row gap-2 mb-2">
                            <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                              <option value="all">All Roles</option>
                              <option value="learner">Learner</option>
                            </select>
                            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by name or email..." className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" />
                          </div>
                          <label className="block text-gray-700 font-medium mb-1">Select User(s)</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {filteredUsers.filter(u => formData.selectedUsers.includes(u.id)).map(user => (
                              <span key={user.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                {user.firstName} {user.lastName}
                                <button type="button" className="ml-1 text-blue-500 hover:text-blue-700" onClick={() => setFormData({ ...formData, selectedUsers: formData.selectedUsers.filter(id => id !== user.id) })} aria-label="Remove user">&times;</button>
                              </span>
                            ))}
                          </div>
                          <div className="relative" ref={userDropdownRef}>
                            <button type="button" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" onClick={() => setUserDropdownOpen(v => !v)}>
                              {formData.selectedUsers.length === 0 ? 'Click to select users...' : `${formData.selectedUsers.length} user(s) selected`}
                            </button>
                            {userDropdownOpen && (
                              <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredUsers.length === 0 && (<div className="p-4 text-gray-500 text-sm text-center">No users found</div>)}
                                {filteredUsers.map(user => {
                                  const checked = formData.selectedUsers.includes(user.id);
                                  return (
                                    <div key={user.id} className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-50 ${checked ? 'bg-blue-50' : ''}`} onClick={() => setFormData({ ...formData, selectedUsers: checked ? formData.selectedUsers.filter(id => id !== user.id) : [...formData.selectedUsers, user.id] })}>
                                      <input type="checkbox" checked={checked} onChange={() => {}} className="accent-blue-600" onClick={e => e.stopPropagation()} />
                                      <span>{user.firstName} {user.lastName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {errors.recipients && <p className="text-red-500 text-sm mt-1">{errors.recipients}</p>}
                        </div>
                      )}
                      {formData.recipientType === 'course' && (
                        <select value={formData.selectedCourse} onChange={e => setFormData({ ...formData, selectedCourse: e.target.value })} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.course ? 'border-red-300' : 'border-gray-300'}`}>
                          <option value="">Select a course</option>
                          {instructorCourses.map((course) => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                        </select>
                      )}
                      {errors.recipients && <p className="text-red-600 text-sm">{errors.recipients}</p>}
                      {errors.course && <p className="text-red-600 text-sm">{errors.course}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-2">Drop files here or click to browse</p>
                      <input type="file" multiple onChange={e => e.target.files && setAttachments(prev => [...prev, ...Array.from(e.target.files!)])} className="hidden" id="attachment-upload" />
                      <label htmlFor="attachment-upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">Choose Files</label>
                    </div>
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                            <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700">&times;</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">Send Notification</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 