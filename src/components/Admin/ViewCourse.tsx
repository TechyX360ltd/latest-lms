import React from 'react';
import { ArrowLeft, Clock, Users, Star, BookOpen, Play, FileText, Video, Image, FolderOpen } from 'lucide-react';
import { Course } from '../../types';

interface ViewCourseProps {
  course: Course;
  onBack: () => void;
}

export function ViewCourse({ course, onBack }: ViewCourseProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const courseSchools = {
    'school-of-engineering': 'School of Engineering',
    'school-of-design': 'School of Design',
    'school-of-product': 'School of Product',
    'school-of-marketing': 'School of Marketing',
    'school-of-business': 'School of Business',
  };

  // Group lessons into modules or create default module
  const modules = course.modules && course.modules.length > 0
    ? course.modules
    : [{ 
        id: 'default', 
        title: 'Course Content', 
        description: 'All course materials and lessons', 
        sort_order: 1, 
        lessons: course.lessons || [], 
        assignments: [] 
      }];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>
      </div>

      {/* Course Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              course.is_published 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {course.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">{course.description}</p>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{course.duration} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{course.enrolled_count} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-gray-600">4.8 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{modules.length} modules</span>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Course Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Instructor</span>
                    <p className="text-gray-900">{course.instructor}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">School</span>
                    <p className="text-gray-900">{courseSchools[course.category_id as keyof typeof courseSchools] || course.category_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Format</span>
                    <p className="text-gray-900 capitalize">{course.format}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Price</span>
                    <p className="text-2xl font-bold text-green-600">₦{course.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <p className="text-gray-900">{new Date(course.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Modules</h2>
        
        {modules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No modules have been added to this course yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const moduleLessons = module.lessons || [];
              const moduleAssignments = module.assignments || [];
              const videoLessons = moduleLessons.filter(lesson => lesson.videoUrl).length;
              const textLessons = moduleLessons.length - videoLessons;
              
              return (
                <div key={module.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Module Statistics */}
                  <div className="space-y-2 mb-4">
                    {moduleLessons.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Lessons</span>
                        <span className="font-semibold text-gray-900">{moduleLessons.length}</span>
                      </div>
                    )}
                    {videoLessons > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          Video Lessons
                        </span>
                        <span className="font-semibold text-blue-600">{videoLessons}</span>
                      </div>
                    )}
                    {textLessons > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Text Lessons
                        </span>
                        <span className="font-semibold text-gray-600">{textLessons}</span>
                      </div>
                    )}
                    {moduleAssignments.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Assignments</span>
                        <span className="font-semibold text-orange-600">{moduleAssignments.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Module Preview */}
                  {moduleLessons.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Lesson Preview</h4>
                      <div className="space-y-2">
                        {moduleLessons.slice(0, 3).map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-2 text-sm">
                            {lesson.videoUrl ? (
                              <Play className="w-3 h-3 text-blue-500" />
                            ) : (
                              <FileText className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="text-gray-600 truncate">{lesson.title}</span>
                          </div>
                        ))}
                        {moduleLessons.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{moduleLessons.length - 3} more lessons
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{course.enrolled_count}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Course Duration</p>
              <p className="text-2xl font-bold text-gray-900">{course.duration}h</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Modules</p>
              <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}