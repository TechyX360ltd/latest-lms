import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Users, Clock } from 'lucide-react';
import { useAllCourses } from '../../hooks/useData';
import { useUsers } from '../../hooks/useData';
import CreateCourse from './CreateCourse';
import { EditCourse } from './EditCourse';
import { ViewCourse } from './ViewCourse';
import { supabase } from '../../lib/supabase'; // Fixed import path
import { useToast } from '../Auth/ToastContext';
import { Course } from '../../types/course';

export function CourseManagement() {
  const { courses, loading, error, deleteCourse } = useAllCourses();
  const { users } = useUsers();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<string | null>(null);
  // In-app delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [localCourses, setLocalCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Only sync localCourses with courses if localCourses is empty (initial load)
    if (localCourses.length === 0 && courses.length > 0) {
      setLocalCourses(courses);
    }
    // Do not overwrite localCourses after a delete
  }, [courses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Debug log: all fetched courses
  console.log('Admin - all courses:', courses);

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

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (courseToDelete) {
      console.log('Before delete:', localCourses.map(c => c.id), 'Deleting:', courseToDelete);
      setLocalCourses(prev => {
        const filtered = prev.filter(c => String(c.id) !== String(courseToDelete));
        console.log('After delete:', filtered.map(c => c.id));
        return filtered;
      });
      setDeleteConfirmOpen(false);
      setCourseToDelete(null);
      const { error } = await deleteCourse(courseToDelete);
      if (error) {
        showToast('Failed to delete course', 'error');
        // Optionally, re-add the course if deletion failed
        setLocalCourses(courses);
      } else {
        showToast('Course deleted successfully', 'success');
      }
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

  // Function to migrate course modules and lessons from JSON to database tables
  const migrateCourseStructure = async (courseId: string) => {
    // Get the course name for confirmation
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      showToast('Course not found', 'error');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to migrate the course structure for "${course.title}"?\n\n` +
      `This will move modules and lessons from JSON format to the database tables, ` +
      `making them visible to learners. This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      // Get the course with its JSON modules/lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError || !courseData) {
        console.error('Error fetching course:', courseError);
        showToast('Failed to fetch course for migration', 'error');
        return;
      }

      // Check if course has modules in JSON format
      if (courseData.modules && Array.isArray(courseData.modules) && courseData.modules.length > 0) {
        console.log('Migrating course structure for:', courseData.title);
        showToast(`Migrating course structure for "${courseData.title}"...`, 'confirmation');
        
        let migratedModules = 0;
        let migratedLessons = 0;
        
        for (const mod of courseData.modules) {
          // Generate UUID for module if not present or invalid
          const moduleId = (mod.id && isValidUUID(mod.id)) ? mod.id : crypto.randomUUID();
          
          // Upsert module
          const { error: modError } = await supabase
            .from('modules')
            .upsert({
              id: moduleId,
              course_id: courseId,
              title: mod.title,
              description: mod.description || mod.title,
              order: mod.sort_order || mod.order || 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (modError) {
            console.error('Module upsert error:', modError, mod);
            continue;
          }
          migratedModules++;

          // Upsert lessons for this module
          if (mod.lessons && Array.isArray(mod.lessons) && mod.lessons.length > 0) {
            for (const les of mod.lessons) {
              // Generate UUID for lesson if not present or invalid
              const lessonId = (les.id && isValidUUID(les.id)) ? les.id : crypto.randomUUID();
              
              const { error: lesError } = await supabase
                .from('lessons')
                .upsert({
                  id: lessonId,
                  course_id: courseId,
                  module_id: moduleId,
                  title: les.title,
                  content: les.content,
                  video_url: les.video_url || les.videoUrl || null,
                  duration: les.duration || 15,
                  order: les.sort_order || les.order || 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (lesError) {
                console.error('Lesson upsert error:', lesError, les);
                continue;
              }
              migratedLessons++;
            }
          }
        }
        
        console.log('Migration completed for course:', courseData.title);
        showToast(`Successfully migrated ${migratedModules} modules and ${migratedLessons} lessons for "${courseData.title}"`, 'success');
      } else {
        showToast(`No modules found in JSON format for "${courseData.title}". Course structure is already up to date.`, 'confirmation');
      }
    } catch (error) {
      console.error('Error migrating course structure:', error);
      showToast('Failed to migrate course structure. Please try again.', 'error');
    }
  };

  // Helper function to validate UUID
  function isValidUUID(id: string | undefined | null): boolean {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

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

  // Filtering logic
  const filteredCourses = localCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'published' && course.is_published) ||
                         (selectedStatus === 'draft' && !course.is_published);
    return matchesSearch && matchesStatus;
  });

  // Debug log: filtered courses
  console.log('Admin - filtered courses:', filteredCourses);

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
        {filteredCourses.map((course) => {
          // Find instructor by ID
          const instructor = users.find(u => u.id === course.instructor_id);
          return (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="relative">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.is_published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </span>
                {course.modules && Array.isArray(course.modules) && course.modules.length > 0 && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800" title="This course has modules in JSON format and may need migration">
                    Needs Migration
                  </span>
                )}
              </div>
            </div>
            
              <div className="p-6 flex flex-col gap-2">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h2>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>by </span>
                  {instructor ? (
                    <span className="font-semibold text-gray-800">{instructor.firstName || instructor.first_name} {instructor.lastName || instructor.last_name}</span>
                  ) : (
                    <span className="text-gray-400">Unknown Instructor</span>
                  )}
                </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolled_count}</span>
                </div>
                <div className="text-green-600 font-medium">
                  ₦{course.price.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingCourse(course.id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  title="Edit course details, modules, and lessons"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => setViewingCourse(course.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View course details and preview content"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => migrateCourseStructure(course.id)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Migrate course structure from JSON to database tables (fixes missing modules/lessons for learners)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeleteCourse(course.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete course permanently (this action cannot be undone)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
      {deleteConfirmOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-4">Delete Course</h2>
        <p>Are you sure you want to delete this course? This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={confirmDeleteCourse}
          >
            Delete
          </button>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}