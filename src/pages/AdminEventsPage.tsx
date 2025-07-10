import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseSessionCalendar from '../components/Course/CourseSessionCalendar';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function formatDate(date: Date) {
  return date.toLocaleDateString();
}
function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEvent, setViewEvent] = useState<any | null>(null);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch all live sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('live_sessions')
        .select('*');
      if (sessionsError) {
        setSessions([]);
        setLoading(false);
        return;
      }
      // Fetch all users (for instructor and participants)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email');
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title');
      if (usersError || coursesError) {
        setSessions([]);
        setLoading(false);
        return;
      }
      // Map sessions to table format
      const mapped = (sessionsData || []).map((s: any) => {
        const instructor = usersData.find((u: any) => u.id === s.instructor_id);
        const instructorName = instructor ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.email : s.instructor_id;
        const course = coursesData.find((c: any) => c.id === s.course_id);
        const courseTitle = course ? course.title : s.course_id;
        const participants = (s.invitees || []).map((id: string) => {
          const user = usersData.find((u: any) => u.id === id);
          return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : id;
        });
        return {
          id: s.id,
          title: s.title,
          start: new Date(s.start_time),
          end: s.end_time ? new Date(s.end_time) : new Date(s.start_time),
          platform: s.platform,
          instructor: instructorName,
          description: s.description,
          joinLink: s.join_link || '#',
          courseId: s.course_id,
          course: courseTitle,
          participants,
        };
      });
      setSessions(mapped);
      setLoading(false);
    })();
  }, []);

  const pageCount = Math.ceil(sessions.length / rowsPerPage);
  const paginatedSessions = sessions.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleDelete = (id: number) => {
    setSessions(prev => prev.filter(e => e.id !== id));
    setDeleteEvent(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold ml-2">My Events</h1>
        <button
          onClick={() => navigate('/admin/schedule-session')}
          className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg"
        >
          Create Live Event
        </button>
      </div>
      <div className="w-full mb-8">
        <CourseSessionCalendar events={sessions} />
      </div>
      {/* Events Table */}
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-2">All Created Events</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Instructor</th>
                <th className="px-3 py-2 text-left font-medium">Course</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Platform</th>
                <th className="px-3 py-2 text-left font-medium">Participants</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSessions.map(event => (
                <tr
                  key={event.id}
                  className="border-t transition-colors hover:bg-blue-50/60"
                >
                  <td className="px-3 py-2 font-medium text-gray-900">{event.title}</td>
                  <td className="px-3 py-2">{event.instructor}</td>
                  <td className="px-3 py-2">{event.course}</td>
                  <td className="px-3 py-2">{formatDate(event.start)}</td>
                  <td className="px-3 py-2">{formatTime(event.start)} - {formatTime(event.end)}</td>
                  <td className="px-3 py-2">{event.platform}</td>
                  <td className="px-3 py-2">{event.participants.length}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button title="View Details" onClick={() => setViewEvent(event)} className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                    <button title="Edit" onClick={() => setEditEvent(event)} className="text-green-600 hover:text-green-800"><Pencil size={18} /></button>
                    <button title="Delete" onClick={() => setDeleteEvent(event)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-medium hover:bg-blue-100 disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-medium hover:bg-blue-100 disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === pageCount || pageCount === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* View Details Modal */}
      {viewEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-0 w-full max-w-md">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-400">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <Eye className="w-6 h-6 text-white" />
              </span>
              <h3 className="text-2xl font-bold text-white flex-1">{viewEvent.title}</h3>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${viewEvent.platform === 'Zoom' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{viewEvent.platform}</span>
                <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{viewEvent.participants.length} Participants</span>
              </div>
              <div className="mb-2 text-gray-700">
                <b>Instructor:</b> {viewEvent.instructor}
              </div>
              <div className="mb-2 text-gray-700">
                <b>Course:</b> {viewEvent.course}
              </div>
              <div className="mb-2 text-gray-700">
                <b>Date:</b> {formatDate(viewEvent.start)}
              </div>
              <div className="mb-2 text-gray-700">
                <b>Time:</b> {formatTime(viewEvent.start)} - {formatTime(viewEvent.end)}
              </div>
              <div className="mb-4 text-gray-700">
                <b>Description:</b> {viewEvent.description}
              </div>
              <div className="mb-2">
                <b>Participants:</b>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewEvent.participants.map((name: string, idx: number) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-100">{name}</span>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow"
                  onClick={() => setViewEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal (mock, prefilled) */}
      {editEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Edit Event (Mock)</h3>
            <p className="mb-2">Pretend this is a pre-filled form for <b>{editEvent.title}</b>.</p>
            <button className="block w-full mt-2 text-gray-600 hover:text-gray-900" onClick={() => setEditEvent(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Delete Confirm Dialog */}
      {deleteEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs text-center">
            <h3 className="text-lg font-bold mb-2">Delete Event?</h3>
            <p className="mb-4">Are you sure you want to delete <b>{deleteEvent.title}</b>?</p>
            <div className="flex gap-2 justify-center">
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => handleDelete(deleteEvent.id)}>Delete</button>
              <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300" onClick={() => setDeleteEvent(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 