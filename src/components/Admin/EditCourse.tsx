import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Video, 
  Image, 
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  Award,
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Link,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Course, Module, Lesson, Assignment } from '../../types';
import { useCategories, useUsers } from '../../hooks/useData';
import { useToast } from '../Auth/ToastContext';
import { supabase } from '../../lib/supabase';

interface EditCourseProps {
  course: Course;
  onSave: (courseData: any) => void;
  onCancel: () => void;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')          // Replace & with 'and'
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9-]/g, '')      // Remove all non-word chars
    .replace(/--+/g, '-')            // Replace multiple - with single -
    .replace(/^-+/, '')              // Trim - from start of text
    .replace(/-+$/, '');             // Trim - from end of text
}

// Helper to check if a string is a valid UUID
function isValidUUID(id: string | undefined | null): boolean {
  return !!id && /^[0-9a-fA-F-]{36}$/.test(id);
}

export function EditCourse({ course, onSave, onCancel }: EditCourseProps) {
  const { categories, refreshCategories, loading: categoriesLoading } = useCategories();
  const { users, loading: usersLoading } = useUsers();
  const { showToast } = useToast();
  const [courseData, setCourseData] = useState({
    title: course.title,
    description: course.description,
    instructor: course.instructor,
    instructor_id: course.instructor_id || '',
    category: course.category,
    format: course.format as 'text' | 'video' | 'mixed',
    duration: course.duration,
    price: course.price,
    thumbnail: null as File | null,
    is_published: course.is_published,
    certificatetemplate: (course as any).certificatetemplate || 'default' as 'default' | 'modern' | 'elegant',
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refreshingSchools, setRefreshingSchools] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState('');

  const certificateTemplates = [
    { id: 'default', name: 'Default Template', description: 'Classic blue and white design' },
    { id: 'modern', name: 'Modern Template', description: 'Sleek contemporary design' },
    { id: 'elegant', name: 'Elegant Template', description: 'Sophisticated gold accents' },
  ];

  // Refresh schools/categories when component mounts
  useEffect(() => {
    refreshCategories();
  }, []);

  const handleRefreshSchools = async () => {
    setRefreshingSchools(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      refreshCategories();
    } finally {
      setRefreshingSchools(false);
    }
  };

  // Load existing course data and content from backend when component mounts or course changes
  useEffect(() => {
    async function fetchCourseContent() {
      if (!isValidUUID(course.id)) return;
      // Fetch modules, lessons, assignments in parallel
      const [modulesRes, lessonsRes, assignmentsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('course_id', course.id).order('order', { ascending: true }),
        supabase.from('lessons').select('*').eq('course_id', course.id).order('order', { ascending: true }),
        supabase.from('assignments').select('*').eq('course_id', course.id)
      ]);
      if (modulesRes.error || lessonsRes.error || assignmentsRes.error) {
        // fallback to prop-based logic if backend fails
        loadFromProp();
        return;
      }
      const modules = modulesRes.data || [];
      const lessons = lessonsRes.data || [];
      const assignments = assignmentsRes.data || [];
      let structuredModules = [];
      if (modules.length > 0) {
        structuredModules = modules.map((mod: any, idx: number) => ({
          ...mod,
          order: mod.order ?? mod.sort_order ?? (idx + 1),
          lessons: lessons.filter((les: any) => les.module_id === mod.id).map((les: any) => ({ ...les, attachments: [] })),
          assignments: assignments.filter((a: any) => a.module_id === mod.id)
        }));
      } else {
        // No modules: treat all lessons as a single module
        const defaultModuleId = crypto.randomUUID();
        structuredModules = [{
          id: defaultModuleId,
          title: 'Lessons',
          description: '',
          order: 1,
          lessons: lessons.map((les: any) => ({ ...les, attachments: [] })),
          assignments: assignments.filter((a: any) => !a.module_id)
        }];
        setExpandedModules(new Set([defaultModuleId]));
      }
      setModules(structuredModules);
    }
    function loadFromProp() {
      // fallback: old prop-based logic
    if ((course as any).lessons && (course as any).lessons.length > 0) {
      if ((course as any).modules && (course as any).modules.length > 0) {
        const existingModules = (course as any).modules.map((module: any) => ({
          ...module,
          lessons: module.lessons.map((lesson: any) => ({
            ...lesson,
              attachments: [] as File[],
            })),
            assignments: module.assignments || [],
        }));
        setModules(existingModules);
          setExpandedModules(new Set(existingModules.map((m: any) => m.id)));
      } else {
        const defaultModule: Module = {
            id: crypto.randomUUID(),
          title: 'Course Content',
          description: 'Main course content',
          sort_order: 1,
          lessons: ((course as any).lessons || []).map((lesson: any, index: number) => ({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            attachments: [] as File[],
              duration: lesson.duration ?? 15,
            sort_order: index + 1,
            })),
            assignments: [],
        };
        setModules([defaultModule]);
        setExpandedModules(new Set(['default-module']));
      }
    }
    }
    fetchCourseContent();
  }, [course.id]);

  // Filter instructors for dropdown
  const instructors = users
    .filter(u => u.role === 'instructor' && (
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(instructorSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(instructorSearch.toLowerCase())
    ));

  // Rich Text Formatting Functions
  const formatText = (moduleId: string, lessonId: string, format: string) => {
    const textareaId = `lesson-content-${moduleId}-${lessonId}`;
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        newCursorPos = start + (selectedText ? 2 : 2);
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        newCursorPos = start + (selectedText ? 1 : 1);
        break;
      case 'underline':
        formattedText = `__${selectedText || 'underlined text'}__`;
        newCursorPos = start + (selectedText ? 2 : 2);
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        newCursorPos = start + (selectedText ? 1 : 1);
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'quoted text'}`;
        newCursorPos = start + (selectedText ? 2 : 2);
        break;
      case 'bullet':
        formattedText = `\n• ${selectedText || 'bullet point'}`;
        newCursorPos = start + (selectedText ? 3 : 3);
        break;
      case 'numbered':
        formattedText = `\n1. ${selectedText || 'numbered item'}`;
        newCursorPos = start + (selectedText ? 4 : 4);
        break;
      case 'heading':
        formattedText = `\n## ${selectedText || 'Heading'}\n`;
        newCursorPos = start + (selectedText ? 4 : 4);
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        newCursorPos = start + (selectedText ? selectedText.length + 3 : 9);
        break;
      case 'indent':
        formattedText = `    ${selectedText}`;
        newCursorPos = start + 4;
        break;
      default:
        return;
    }

    const newContent = beforeText + formattedText + afterText;
    
    // Update the lesson content
    updateLesson(moduleId, lessonId, 'content', newContent);
    
    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const previewFormattedText = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>')
      .replace(/^• (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800">$1</a>')
      .replace(/\n/g, '<br>');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!courseData.title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (!courseData.description.trim()) {
      newErrors.description = 'Course description is required';
    }

    if (!courseData.instructor.trim()) {
      newErrors.instructor = 'Instructor name is required';
    }

    if (!courseData.category) {
      newErrors.category = 'Course school is required';
    }

    if (courseData.price <= 0) {
      newErrors.price = 'Course price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addModule = () => {
    const newModule: Module = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      sort_order: modules.length + 1,
      lessons: [],
    };
    setModules([...modules, newModule]);
    setExpandedModules(new Set([...expandedModules, newModule.id]));
  };

  const updateModule = (moduleId: string, field: string, value: string) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, [field]: value } : module
    ));
  };

  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
    const newExpanded = new Set(expandedModules);
    newExpanded.delete(moduleId);
    setExpandedModules(newExpanded);
  };

  const addLesson = (moduleId: string) => {
    const targetModule = modules.find(m => m.id === moduleId);
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      contentType: 'text',
      attachments: [],
      duration: 0,
      sort_order: targetModule ? targetModule.lessons.length + 1 : 1,
    };

    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [...module.lessons, newLesson]
        };
      }
      return module;
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: any) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map(lesson =>
            lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
          )
        };
      }
      return module;
    }));
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return module;
    }));
  };

  const handleFileUpload = (moduleId: string, lessonId: string, files: FileList) => {
    const fileArray = Array.from(files);
    updateLesson(moduleId, lessonId, 'attachments', fileArray);
  };

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const calculateTotalDuration = () => {
    return modules.reduce((total, module) => 
      total + module.lessons.reduce((moduleTotal, lesson) => moduleTotal + lesson.duration, 0), 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const totalDuration = calculateTotalDuration();
      let thumbnailUrl = courseData.thumbnail;
      if (courseData.thumbnail instanceof File) {
        // You may want to upload the file and get a URL here, similar to CreateCourse
        // For now, fallback to the existing course thumbnail if not uploading
        thumbnailUrl = course.thumbnail;
      }
      const slug = slugify(courseData.title);
      // Only include fields that exist in the DB schema
      const coursePayload = {
        title: courseData.title,
        slug,
        description: courseData.description,
        instructor: courseData.instructor,
        instructor_id: courseData.instructor_id,
        category: courseData.category,
        format: courseData.format,
        duration: Math.ceil(totalDuration / 60) || courseData.duration,
        price: courseData.price,
        thumbnail: thumbnailUrl || course.thumbnail,
        is_published: courseData.is_published,
        certificatetemplate: courseData.certificatetemplate,
      };
      console.log('Course payload being sent (Edit):', coursePayload);
      await onSave(coursePayload);
      // --- Backend logic for modules and lessons ---
      const courseId = course.id;
      // Upsert modules
      for (const mod of modules) {
        if (!isValidUUID(mod.id) || !isValidUUID(courseId)) {
          console.error('Invalid UUID for module or course:', mod.id, courseId);
          continue;
        }
        const { error: modError } = await supabase
          .from('modules')
          .upsert({
            id: mod.id,
            course_id: courseId,
            title: mod.title,
            description: mod.description,
            order: mod.sort_order || mod.order || 1,
            updated_at: new Date().toISOString(),
          });
        if (modError) {
          console.error('Module upsert error:', modError, mod);
          throw modError;
        }
        // Upsert lessons for this module
        for (const les of mod.lessons) {
          if (!isValidUUID(les.id) || !isValidUUID(mod.id) || !isValidUUID(courseId)) {
            console.error('Invalid UUID for lesson, module, or course:', les.id, mod.id, courseId);
            continue;
          }
          console.log('Saving lesson:', les);
          const { error: lesError } = await supabase
            .from('lessons')
            .upsert({
              id: les.id,
              course_id: courseId,
              module_id: mod.id,
              title: les.title,
              content: les.content,
              video_url: les.video_url || null,
              duration: les.duration,
              order: les.sort_order,
              updated_at: new Date().toISOString(),
            });
          if (lesError) {
            console.error('Lesson upsert error:', lesError, les);
            throw lesError;
          }
        }
        // Upsert assignments for this module (if present)
        if (mod.assignments && Array.isArray(mod.assignments)) {
          for (const assn of mod.assignments) {
            if (!isValidUUID(assn.id) || !isValidUUID(mod.id) || !isValidUUID(courseId)) {
              console.error('Invalid UUID for assignment, module, or course:', assn.id, mod.id, courseId);
              continue;
            }
            console.log('Saving assignment:', assn);
            const { error: assnError } = await supabase
              .from('assignments')
              .upsert({
                id: assn.id,
                course_id: courseId,
                module_id: mod.id,
                title: assn.title,
                description: assn.description,
                instructions: assn.instructions || '',
                due_date: assn.due_date || null,
                max_points: assn.max_points || 0,
                allowed_file_types: assn.allowed_file_types || [],
                max_file_size: assn.max_file_size || 0,
                is_required: assn.is_required || false,
                created_at: assn.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            if (assnError) {
              console.error('Assignment upsert error:', assnError, assn);
              throw assnError;
            }
          }
        }
      }
      showToast(`Course and content updated successfully${courseData.is_published ? ' and published!' : ' (saved as draft).'}`, 'success');
    } catch (error) {
      console.error('Error updating course:', error);
      showToast('Error updating course or content. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Course</h1>
          <p className="text-gray-600">Update course information and content</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Course Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Course Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter course title"
                required
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor *
              </label>
              <input
                type="text"
                value={instructorSearch}
                onChange={e => setInstructorSearch(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                placeholder="Search instructor by name or email"
                autoComplete="off"
              />
              <select
                value={courseData.instructor_id}
                onChange={e => {
                  const selected = users.find(u => u.id === e.target.value);
                  setCourseData({
                    ...courseData,
                    instructor_id: selected?.id || '',
                    instructor: selected ? `${selected.first_name} ${selected.last_name}` : '',
                  });
                }}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={usersLoading}
              >
                <option value="">{usersLoading ? 'Loading instructors...' : 'Select instructor'}</option>
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>{i.first_name} {i.last_name} ({i.email})</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Course School *
                </label>
                <button
                  type="button"
                  onClick={handleRefreshSchools}
                  disabled={refreshingSchools || categoriesLoading}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                  title="Refresh schools list"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshingSchools ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <select
                value={courseData.category}
                onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                required
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? 'Loading schools...' : 'Select course school'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-amber-600 text-sm mt-1">
                  No active schools found. Please create a school first or activate existing ones.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Format *
              </label>
              <select
                value={courseData.format}
                onChange={(e) => setCourseData({...courseData, format: e.target.value as any})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="text">Text Only</option>
                <option value="video">Video Only</option>
                <option value="mixed">Mixed Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">₦</span>
                <input
                  type="number"
                  value={courseData.price}
                  onChange={(e) => setCourseData({...courseData, price: Number(e.target.value)})}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCourseData({...courseData, thumbnail: e.target.files?.[0] || null})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty to keep current thumbnail</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publish Course
              </label>
              <input
                type="checkbox"
                checked={courseData.is_published}
                onChange={e => setCourseData({ ...courseData, is_published: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="ml-2 text-gray-600">{courseData.is_published ? 'Published' : 'Draft'}</span>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <textarea
              value={courseData.description}
              onChange={(e) => setCourseData({...courseData, description: e.target.value})}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe what students will learn in this course"
              required
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Total Duration: {Math.ceil(calculateTotalDuration() / 60) || courseData.duration} hours
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {modules.length} modules, {modules.reduce((total, module) => total + module.lessons.length, 0)} lessons
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Template Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Certificate Template</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certificateTemplates.map((template) => (
              <div
                key={template.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  courseData.certificatetemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCourseData({...courseData, certificatetemplate: template.id})}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course Curriculum */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Course Curriculum</h2>
            <button
              type="button"
              onClick={addModule}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Module
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleModuleExpansion(module.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedModules.has(module.id) ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                          placeholder={`Module ${moduleIndex + 1} Title`}
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={module.description}
                          onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                          placeholder="Module description"
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteModule(module.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedModules.has(module.id) && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Lessons</h4>
                      <button
                        type="button"
                        onClick={() => addLesson(module.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </button>
                    </div>

                    <div className="space-y-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                              placeholder={`Lesson ${lessonIndex + 1} Title`}
                              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex gap-2">
                              <select
                                value={lesson.contentType}
                                onChange={(e) => updateLesson(module.id, lesson.id, 'contentType', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="text">Text</option>
                                <option value="video">Video</option>
                                <option value="document">Document</option>
                                <option value="image">Image</option>
                              </select>
                              <input
                                type="number"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(module.id, lesson.id, 'duration', Number(e.target.value))}
                                placeholder="Duration (min)"
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => deleteLesson(module.id, lesson.id)}
                                className="text-red-400 hover:text-red-600 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Rich Text Formatting Toolbar */}
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border">
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'bold')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Bold"
                              >
                                <Bold className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'italic')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Italic"
                              >
                                <Italic className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'underline')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Underline"
                              >
                                <Underline className="w-4 h-4" />
                              </button>
                              <div className="w-px bg-gray-300 mx-1"></div>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'heading')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors text-xs font-bold"
                                title="Heading"
                              >
                                H2
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'bullet')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Bullet List"
                              >
                                <List className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'numbered')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Numbered List"
                              >
                                <ListOrdered className="w-4 h-4" />
                              </button>
                              <div className="w-px bg-gray-300 mx-1"></div>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'quote')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Quote"
                              >
                                <Quote className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'code')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Code"
                              >
                                <Code className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'link')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Link"
                              >
                                <Link className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatText(module.id, lesson.id, 'indent')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Indent"
                              >
                                <AlignRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            id={`lesson-content-${module.id}-${lesson.id}`}
                            value={lesson.content}
                            onChange={(e) => updateLesson(module.id, lesson.id, 'content', e.target.value)}
                            placeholder="Lesson content... Use the formatting toolbar above for rich text formatting"
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 font-mono text-sm"
                          />

                          {/* Preview */}
                          {lesson.content && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Preview:</span>
                              </div>
                              <div 
                                className="p-3 bg-gray-50 rounded border text-sm"
                                dangerouslySetInnerHTML={{ __html: previewFormattedText(lesson.content) }}
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Attachments
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="file"
                                multiple
                                accept="video/*,image/*,.pdf,.doc,.docx,.ppt,.pptx"
                                onChange={(e) => e.target.files && handleFileUpload(module.id, lesson.id, e.target.files)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <div className="flex gap-2">
                                <Video className="w-5 h-5 text-gray-400" />
                                <Image className="w-5 h-5 text-gray-400" />
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            {lesson.attachments.length > 0 && (
                              <div className="mt-2 text-sm text-gray-600">
                                {lesson.attachments.length} file(s) selected
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {modules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No modules added yet. Click "Add Module" to get started.</p>
            </div>
          )}
        </div>

        {/* Formatting Guide */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Rich Text Formatting Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Text Formatting:</h4>
              <ul className="space-y-1 text-blue-700">
                <li><code>**Bold text**</code> → <strong>Bold text</strong></li>
                <li><code>*Italic text*</code> → <em>Italic text</em></li>
                <li><code>__Underlined__</code> → <u>Underlined</u></li>
                <li><code>`Code text`</code> → <code className="bg-gray-100 px-1 rounded">Code text</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Structure:</h4>
              <ul className="space-y-1 text-blue-700">
                <li><code>## Heading</code> → Large heading</li>
                <li><code>• Bullet point</code> → Bullet list</li>
                <li><code>1. Numbered item</code> → Numbered list</li>
                <li><code>{'>'} Quote</code> → Blockquote</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Updating Course...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
}