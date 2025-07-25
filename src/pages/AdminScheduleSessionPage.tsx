import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Edit, Eye, Trash2 } from 'lucide-react';
import { LiveSession, Course } from '../types';
import ScheduleSessionForm from '../components/Admin/ScheduleSessionForm';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch courses and sessions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase.from('courses').select('id, title');
      if (courseError) {
        console.error('Error fetching courses:', courseError);
      } else {
        console.log('Courses fetched successfully:', courseData?.length || 0, 'courses');
      }
      setCourses(courseData || []);
                      const { data: sessionData, error: sessionError } = await supabase
          .from('live_sessions')
          .select('*')
          .order('start_time', { ascending: false });
        if (sessionError) {
          console.error('Error fetching sessions:', sessionError);
        } else {
          console.log('Sessions fetched successfully:', sessionData?.length || 0, 'sessions');
        }
        
        // Fetch course details for each session
        if (sessionData && sessionData.length > 0) {
          const courseIds = [...new Set(sessionData.map(s => s.course_id).filter(Boolean))];
          
          // Handle both UUID and string course IDs
          const validCourseIds = courseIds.filter(id => {
            // Check if it's a valid UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
          });
          
          if (validCourseIds.length > 0) {
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('id, title')
              .in('id', validCourseIds);
            
            if (courseError) {
              console.error('Error fetching course details:', courseError);
            }
            
            // Merge course data with session data
            const sessionsWithCourses = sessionData.map(session => ({
              ...session,
              course: courseData?.find(c => c.id === session.course_id) || null
            }));
            
            setSessions(sessionsWithCourses || []);
          } else {
            // If no valid UUIDs, just set sessions without course data
            setSessions(sessionData || []);
          }
        } else {
          setSessions(sessionData || []);
        }
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
      start_time: session.start_time,
      end_time: session.end_time,
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
    // Reset to first page if current page becomes empty
    if (currentPage > Math.ceil((sessions.length - 1) / itemsPerPage)) {
      setCurrentPage(1);
    }
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
      start_time: editForm.start_time,
      end_time: editForm.end_time,
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

  // Pagination logic
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full px-1 md:px-2 p-0">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Schedule a Live Session</h1>
      {/* Place the form directly under the main title, no container or inner title */}
      <ScheduleSessionForm courses={courses} onSessionCreated={() => window.location.reload()} coursesLoading={loading} />

      {/* Scheduled Sessions Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
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

                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No sessions scheduled.</td></tr>
              ) : (
                currentSessions.map(session => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{session.course?.title || ''}</td>
                    <td className="px-4 py-2">{session.title}</td>
                    <td className="px-4 py-2">{session.description}</td>
                    <td className="px-4 py-2">{session.start_time ? new Date(session.start_time).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-2">{session.start_time ? new Date(session.start_time).toLocaleTimeString() : ''}</td>

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
        
        {/* Pagination Controls */}
        {sessions.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, sessions.length)} of {sessions.length} sessions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
              <div><strong>Date:</strong> {selectedSession.start_time ? new Date(selectedSession.start_time).toLocaleDateString() : ''}</div>
              <div><strong>Time:</strong> {selectedSession.start_time ? new Date(selectedSession.start_time).toLocaleTimeString() : ''}</div>
              
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
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <input
                    name="start_time"
                    type="datetime-local"
                    value={editForm.start_time ? new Date(editForm.start_time).toISOString().slice(0, 16) : ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    name="end_time"
                    type="datetime-local"
                    value={editForm.end_time ? new Date(editForm.end_time).toISOString().slice(0, 16) : ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
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