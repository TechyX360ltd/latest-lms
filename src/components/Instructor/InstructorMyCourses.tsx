import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';

const demoCourses = [
  { id: 1, title: 'React for Beginners', status: 'Active', enrollments: 40, date: '2024-07-01', thumbnail: '/3d-icons/3dicons-cap-dynamic-color.png', },
  { id: 2, title: 'Advanced TypeScript', status: 'Active', enrollments: 20, date: '2024-06-15', thumbnail: '', },
  { id: 3, title: 'UI/UX Design', status: 'Inactive', enrollments: 30, date: '2024-06-10', thumbnail: '', },
];

export default function InstructorMyCourses() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Active' | 'Inactive'>('Active');
  const filteredCourses = demoCourses.filter(c => c.status === activeTab);

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
            {filteredCourses.length > 0 ? (
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{course.status}</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">{course.enrollments} enrollments • {new Date(course.date).toLocaleDateString()}</div>
                    <div className="flex gap-2 mt-auto">
                      <button className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition">View</button>
                      <button className="px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100 transition">Edit</button>
                      <button className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 transition">Analytics</button>
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
        </main>
      </div>
    </div>
  );
} 