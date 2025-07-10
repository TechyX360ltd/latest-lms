import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Users, Clock } from 'lucide-react';
import { useCourses } from '../../hooks/useData';
import { CreateCourse } from './CreateCourse';
import { EditCourse } from './EditCourse';
import { ViewCourse } from './ViewCourse';

export function CourseManagement() {
  const { courses, addCourse, updateCourse, deleteCourse, loading } = useCourses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleCreateCourse = async (courseData: any) => {
    try {
      // If modules are present in the form, pass them to addCourse
      const payload = { ...courseData };
      if (courseData.modules) {
        payload.modules = courseData.modules;
      }
      console.log('Creating course (with modules):', payload);
      const result = await addCourse(payload);
      if (result && result.error) {
        console.error('Supabase error(s):', result.error);
        alert('Error creating course: ' + (Array.isArray(result.error) ? result.error.map((e: any) => e.error?.message || e.error).join('\n') : (result.error.message || JSON.stringify(result.error))));
      }
      setShowCreateCourse(false);
    } catch (error: any) {
      console.error('Error creating course (exception):', error);
      alert('Error creating course: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleUpdateCourse = async (courseId: string, courseData: any) => {
    console.log('Updating course:', courseId, courseData);
    updateCourse(courseId, courseData);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteCourse(courseId);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateCourse(false);
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
  };

  const handleCancelView = () => {
    setViewingCourse(null);
  };

  // Show create course form
  if (showCreateCourse) {
    return <CreateCourse onSave={handleCreateCourse} onCancel={handleCancelCreate} />;
  }

  // Show edit course form
  if (editingCourse) {
    const courseToEdit = courses.find(c => c.id === editingCourse);
    if (courseToEdit) {
      return (
        <EditCourse 
          course={courseToEdit} 
          onSave={(courseData) => handleUpdateCourse(editingCourse, courseData)} 
          onCancel={handleCancelEdit} 
        />
      );
    }
  }

  // Show view course details
  if (viewingCourse) {
    const courseToView = courses.find(c => c.id === viewingCourse);
    if (courseToView) {
      return <ViewCourse course={courseToView} onBack={handleCancelView} />;
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'published' && course.isPublished) ||
                         (selectedStatus === 'draft' && !course.isPublished);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
          <p className="text-gray-600">Create and manage your course catalog</p>
        </div>
        <button 
          onClick={() => setShowCreateCourse(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-3 text-sm line-clamp-2">{course.description}</p>
              <p className="text-sm text-gray-500 mb-4">by {course.instructor}</p>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolledCount}</span>
                </div>
                <div className="text-green-600 font-medium">
                  ₦{course.price.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingCourse(course.id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => setViewingCourse(course.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Course"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteCourse(course.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}