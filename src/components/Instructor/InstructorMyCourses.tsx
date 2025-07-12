import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ViewCourse } from '../Admin/ViewCourse';
import { EditCourse } from '../Admin/EditCourse';

export default function InstructorMyCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Active' | 'Inactive'>('Active');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewCourse, setViewCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [analyticsCourse, setAnalyticsCourse] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCourses(data || []);
      } catch (err: any) {
        setError('Failed to load courses.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user?.id]);

  const filteredCourses = courses.filter(c => (activeTab === 'Active' ? c.status === 'published' || c.status === 'active' : c.status === 'inactive'));

  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="container mx-auto py-2 px-2 md:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition text-lg"
                onClick={() => navigate('/instructor/create-course')}
              >
                + Create New Course
              </button>
            </div>
            <div className="mb-6">
              <div className="flex gap-4 border-b">
                <button
                  className={`px-4 py-2 text-lg font-semibold border-b-2 transition-all duration-200 ${activeTab === 'Active' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
                  onClick={() => setActiveTab('Active')}
                >
                  Active
                </button>
                <button
                  className={`px-4 py-2 text-lg font-semibold border-b-2 transition-all duration-200 ${activeTab === 'Inactive' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
                  onClick={() => setActiveTab('Inactive')}
                >
                  Inactive
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></span>
                <h3 className="text-lg font-semibold mb-2">Loading courses...</h3>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-7xl mb-4">⚠️</span>
                <h3 className="text-lg font-semibold mb-2">{error}</h3>
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col relative hover:shadow-2xl transition group">
                    <div className="h-40 w-full bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="object-cover h-full w-full" />
                      ) : (
                        <span className="text-gray-400 text-5xl font-bold">📚</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition">{course.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.status === 'published' || course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{course.status === 'published' ? 'Active' : course.status}</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">{course.enrollments || 0} enrollments • {course.created_at ? new Date(course.created_at).toLocaleDateString() : ''}</div>
                    <div className="flex gap-2 mt-auto">
                      <button className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition" onClick={() => setViewCourse(course)}>View</button>
                      <button className="px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100 transition" onClick={() => setEditCourse(course)}>Edit</button>
                      <button className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 transition" onClick={() => setAnalyticsCourse(course)}>Analytics</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-7xl mb-4">📚</span>
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-gray-500 mb-4">Start by creating your first course!</p>
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition"
                  onClick={() => navigate('/instructor/create-course')}
                >
                  + Create New Course
                </button>
              </div>
            )}
          </div>
          {/* View Modal */}
          {viewCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full relative animate-fade-in overflow-auto max-h-[90vh]">
                <button
                  onClick={() => setViewCourse(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  aria-label="Close"
                >
                  ×
                </button>
                <ViewCourse course={viewCourse} onBack={() => setViewCourse(null)} />
              </div>
            </div>
          )}
          {/* Edit Modal */}
          {editCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full relative animate-fade-in overflow-auto max-h-[90vh]">
                <button
                  onClick={() => setEditCourse(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  aria-label="Close"
                >
                  ×
                </button>
                <EditCourse course={editCourse} onSave={() => setEditCourse(null)} onCancel={() => setEditCourse(null)} />
              </div>
            </div>
          )}
          {/* Analytics Modal (Placeholder) */}
          {analyticsCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative animate-fade-in overflow-auto max-h-[90vh]">
                <button
                  onClick={() => setAnalyticsCourse(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-4">Course Analytics</h2>
                <p>Analytics for <b>{analyticsCourse.title}</b> will appear here.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 