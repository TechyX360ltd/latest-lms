import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Edit, Eye, Trash2 } from 'lucide-react';
import { LiveSession, Course } from '../types';
import ScheduleSessionForm from '../components/Admin/ScheduleSessionForm';

export default function AdminScheduleSessionPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editForm, setEditForm] = useState<Partial<LiveSession> | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch courses and sessions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: courseData } = await supabase.from('courses').select('id, title');
      setCourses(courseData || []);
      const { data: sessionData } = await supabase
        .from('live_sessions')
        .select('*, course:course_id(id, title)')
        .order('session_date', { ascending: false })
        .order('session_time', { ascending: false });
      setSessions(sessionData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handlers for modals
  const handleView = (session: LiveSession) => {
    setSelectedSession(session);
    setViewModalOpen(true);
  };
  const handleEdit = (session: LiveSession) => {
    setSelectedSession(session);
    setEditForm({
      id: session.id,
      course_id: session.course_id,
      title: session.title,
      description: session.description,
      session_date: session.session_date,
      session_time: session.session_time,
      duration: session.duration,
      platform: session.platform,
    });
    setEditModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    await supabase.from('live_sessions').delete().eq('id', deleteId);
    setSessions(sessions.filter(s => s.id !== deleteId));
    setDeleteId(null);
    setDeleteLoading(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!editForm || !editForm.id) return;
    setEditLoading(true);
    const { error } = await supabase.from('live_sessions').update({
      course_id: editForm.course_id,
      title: editForm.title,
      description: editForm.description,
      session_date: editForm.session_date,
      session_time: editForm.session_time,
      duration: Number(editForm.duration),
      platform: editForm.platform,
    }).eq('id', editForm.id);
    setEditLoading(false);
    if (!error) {
      setEditModalOpen(false);
      window.location.reload();
    }
  };

  // Add/edit session handlers (to be used in form/modal)
  // ...implement create/edit logic as needed...

  return (
    <div className="max-w-6xl mx-auto w-full p-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Schedule a Live Session</h1>
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
        <h2 className="text-xl font-semibold mb-4">Schedule Live Session</h2>
        {/* Pass courses and a callback to refresh sessions to the form */}
        <ScheduleSessionForm courses={courses} onSessionCreated={() => window.location.reload()} />
      </div>

      {/* Scheduled Sessions Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Scheduled Sessions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No sessions scheduled.</td></tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{session.course?.title || ''}</td>
                    <td className="px-4 py-2">{session.title}</td>
                    <td className="px-4 py-2">{session.description}</td>
                    <td className="px-4 py-2">{session.session_date}</td>
                    <td className="px-4 py-2">{session.session_time}</td>
                    <td className="px-4 py-2">{session.duration} min</td>
                    <td className="px-4 py-2">{session.platform}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => handleView(session)} className="text-blue-600 hover:text-blue-800" title="View"><Eye className="w-5 h-5" /></button>
                      <button onClick={() => handleEdit(session)} className="text-green-600 hover:text-green-800" title="Edit"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(session.id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Session Details</h3>
            <div className="space-y-2">
              <div><strong>Course:</strong> {selectedSession.course?.title || ''}</div>
              <div><strong>Title:</strong> {selectedSession.title}</div>
              <div><strong>Description:</strong> {selectedSession.description}</div>
              <div><strong>Date:</strong> {selectedSession.session_date}</div>
              <div><strong>Time:</strong> {selectedSession.session_time}</div>
              <div><strong>Duration:</strong> {selectedSession.duration} min</div>
              <div><strong>Platform:</strong> {selectedSession.platform}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedSession && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Edit Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course *</label>
                <select
                  name="course_id"
                  value={editForm.course_id}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Session Title *</label>
                <input
                  name="title"
                  type="text"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    name="session_date"
                    type="date"
                    value={editForm.session_date}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time *</label>
                  <input
                    name="session_time"
                    type="time"
                    value={editForm.session_time}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                  <input
                    name="duration"
                    type="number"
                    min={1}
                    value={editForm.duration}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Platform *</label>
                  <select
                    name="platform"
                    value={editForm.platform}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select platform</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
              <button onClick={handleEditSave} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Session</h3>
            <p>Are you sure you want to delete this session?</p>
            <div className="flex justify-end mt-6">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
              <button onClick={confirmDelete} className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 