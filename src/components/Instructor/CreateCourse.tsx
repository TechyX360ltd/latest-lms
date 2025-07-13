import React, { useState, useRef, Suspense, useEffect } from 'react';
import { useCategories } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
const ReactQuill = React.lazy(() => import('react-quill').then(module => ({ default: module.default })));
import 'react-quill/dist/quill.snow.css';
import { uploadToCloudinary } from '../../lib/cloudinary';
import Confetti from 'react-confetti';
import { FaTrophy } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { CertificateTemplateGallery } from '../common/CertificateTemplateGallery';

// Helper function to validate UUID
function isValidUUID(id: string | undefined | null): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

const courseTypes = [
  { label: 'Text Only', value: 'text' },
  { label: 'Video Only', value: 'video' },
  { label: 'Mixed (Text + Video)', value: 'mixed' },
];

function Stepper({ step }: { step: number }) {
  const steps = ['Course Basics', 'Content', 'Publish'];
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-200 ${step === idx + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300'}`}>{idx + 1}</div>
          <span className={`text-sm font-medium ${step === idx + 1 ? 'text-blue-700' : 'text-gray-400'}`}>{label}</span>
          {idx < steps.length - 1 && <div className="w-8 h-1 bg-blue-200 rounded-full" />}
        </div>
      ))}
    </div>
  );
}

// Video upload modal component
function VideoUploadModal({ open, onClose, onUpload, progress, error }: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  progress: number;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >×</button>
        <h2 className="text-xl font-bold mb-4">Upload Lesson Video</h2>
        <input
          type="file"
          accept="video/mp4,video/x-matroska"
          ref={fileInputRef}
          className="mb-4"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        <div className="mb-2 text-xs text-gray-500">Max size: 50MB. Formats: mp4, mkv.</div>
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      </div>
    </div>
  );
}

// Types for modules and lessons
interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string;
  videoUrl?: string;
  assignment?: string; // New field for assignment question
  assignmentFile?: string; // New field for assignment file URL
}
interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export default function CreateCourse() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const { categories, loading: categoriesLoading } = useCategories();
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [format, setFormat] = useState('mixed');
  const [error, setError] = useState('');

  // Content step state
  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [activeModuleIdx, setActiveModuleIdx] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState(format);
  const [newLessonContent, setNewLessonContent] = useState('');

  // Accordion state for modules
  const [openModuleIdx, setOpenModuleIdx] = useState<number | null>(0);

  // Draft loading states
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const { courseId: urlCourseId } = useParams();
  const [isEditing, setIsEditing] = useState(false);

  // Slugify helper
  function slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNext = () => {
    if (!title || !slug || !category || !price || !description || !duration || !format) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  // Add module
  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    setModules([...modules, { id: Date.now().toString(), title: newModuleTitle, lessons: [] }]);
    setNewModuleTitle('');
  };
  // Add lesson to module
  const handleAddLesson = async (moduleIdx: number) => {
    if (!newLessonTitle.trim()) return;
    const updatedModules = [...modules];
    let fileUrl = '';
    if (assignmentFile) {
      const result = await uploadToCloudinary(assignmentFile, 'lms-assignments');
      fileUrl = result.secure_url;
    }
    updatedModules[moduleIdx].lessons.push({
      id: Date.now().toString(),
      title: newLessonTitle,
      type: newLessonType,
      content: newLessonContent,
      assignment: assignmentQuestion,
      assignmentFile: fileUrl
    });
    setAssignmentQuestion('');
    setAssignmentFile(null);
    setNewLessonTitle('');
    setNewLessonType(format);
    setNewLessonContent('');
    setActiveModuleIdx(null);
    toast.success('Lesson added!');
  };
  // Remove module
  const handleRemoveModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };
  // Remove lesson
  const handleRemoveLesson = (moduleIdx: number, lessonIdx: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIdx].lessons.splice(lessonIdx, 1);
    setModules(updatedModules);
  };

  // Video upload modal state
  const [videoModal, setVideoModal] = useState<{ open: boolean; moduleIdx: number | null; lessonIdx: number | null }>({ open: false, moduleIdx: null, lessonIdx: null });
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Real Cloudinary video upload
  const handleVideoUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setVideoUploadError('File size exceeds 50MB.');
      return;
    }
    setVideoUploadError(null);
    setVideoUploadProgress(0);
    try {
      // Show progress bar (simulate, since fetch doesn't provide progress natively)
      let progress = 0;
      const fakeProgress = setInterval(() => {
        progress += 10;
        setVideoUploadProgress(Math.min(progress, 90));
      }, 200);
      const result = await uploadToCloudinary(file, 'lms-videos');
      clearInterval(fakeProgress);
      setVideoUploadProgress(100);
      if (videoModal.moduleIdx !== null && videoModal.lessonIdx !== null) {
        const updatedModules = [...modules];
        updatedModules[videoModal.moduleIdx].lessons[videoModal.lessonIdx].videoUrl = result.secure_url;
        setModules(updatedModules);
      }
      setTimeout(() => {
        setVideoModal({ open: false, moduleIdx: null, lessonIdx: null });
        setVideoUploadProgress(0);
      }, 800);
    } catch (err) {
      setVideoUploadError('Upload failed. Please try again.');
      setVideoUploadProgress(0);
    }
  };

  // Assignment state for lesson-level assignments
  const [assignmentQuestion, setAssignmentQuestion] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentFileUrl, setAssignmentFileUrl] = useState('');

  // Helper to check if due date is in the future
  function isFutureDate(dateStr: string) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    return due > today;
  }

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  // TODO: Replace with real check for instructor's first course
  const isFirstCourse = true; // Set to false if not first course

  const [certificateTemplateId, setCertificateTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (urlCourseId) {
      setIsEditing(true);
      (async () => {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', urlCourseId)
          .single();
        if (data) {
          setTitle(data.title || '');
          setCategory(data.category || '');
          setDescription(data.description || '');
          setSlug(data.slug || '');
          setPrice(data.price?.toString() || '');
          setDuration(data.duration?.toString() || '');
          setFormat(data.format || 'mixed');
          setCertificateTemplateId(data.certificate_template_id || null);
          // Prefill modules, lessons, etc. as needed
          // You may need to fetch modules/lessons separately if not included
        }
      })();
    }
  }, [urlCourseId]);

  // Load draft if draft ID is provided in URL
  useEffect(() => {
    const loadDraft = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const draftId = urlParams.get('draft');
      
      if (draftId && user?.id) {
        setLoadingDraft(true);
        setError('');
        try {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', draftId)
            .eq('instructor_id', user.id)
            .eq('status', 'draft')
            .single();
          
          if (error) throw error;
          
          if (data) {
            setCourseId(data.id);
            setTitle(data.title || '');
            setCategory(data.category || '');
            setDescription(data.description || '');
            setSlug(data.slug || '');
            setPrice(data.price ? data.price.toString() : '');
            setDuration(data.duration ? data.duration.toString() : '');
            setFormat(data.format || 'mixed');
            setModules(data.modules || []);
            
            // Set thumbnail if it exists
            if (data.thumbnail) {
              setThumbnail(data.thumbnail);
            }
            
            // Set certificate template if it exists
            if (data.certificate_template_id) {
              setCertificateTemplateId(data.certificate_template_id);
            }
            
            // Determine which step to show based on content
            if (data.modules && data.modules.length > 0) {
              setStep(2); // Go to content step if modules exist
            } else if (data.title && data.description) {
              setStep(1); // Stay on basics step
            }
            
            toast.success('Draft loaded successfully!');
          }
        } catch (err: any) {
          setError('Failed to load draft. ' + (err.message || ''));
          toast.error('Failed to load draft.');
        } finally {
          setLoadingDraft(false);
        }
      }
    };
    
    loadDraft();
  }, [user?.id]);

  // Restrict unverified instructors
  if (user?.role === 'instructor' && user?.verification_status !== 'verified') {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-red-50 border border-red-200 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-2">Account Not Verified</h2>
        <p className="text-red-700 mb-4">You must verify your instructor account before you can create or publish courses.</p>
        <a href="/instructor/profile" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Verify Now</a>
      </div>
    );
  }

  // Show loading state while draft is being loaded
  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 lg:p-8 overflow-auto flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading draft...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Save as Draft handler
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setError('');
    try {
      let thumbnailUrl = '';
      if (thumbnail && typeof thumbnail !== 'string') {
        // Upload thumbnail image if it's a File
        const result = await uploadToCloudinary(thumbnail, 'lms-covers');
        thumbnailUrl = result.secure_url;
      } else if (typeof thumbnail === 'string') {
        thumbnailUrl = thumbnail;
      }
      const courseData = {
        ...(courseId ? { id: courseId } : {}),
        title: title || '',
        slug: slug || '',
        category: category || '',
        price: price ? Number(price) : 0,
        description: description || '',
        duration: duration ? Number(duration) : 0,
        thumbnail: thumbnailUrl || '',
        format: format || '',
        instructor_id: user?.id,
        instructor: user?.id, // for NOT NULL constraint
        status: 'draft',
        updated_at: new Date().toISOString(),
        certificate_template_id: certificateTemplateId || null,
      };
      const { data, error } = await supabase
        .from('courses')
        .upsert([courseData], { onConflict: ['id'] })
        .select();
      if (error) {
        toast.error('Failed to save draft. ' + (error.message || ''));
        throw error;
      }
      
      const finalCourseId = data && data[0]?.id ? data[0].id : courseId;
      if (!finalCourseId) {
        throw new Error('Failed to get course ID');
      }
      setCourseId(finalCourseId);

      // Upsert modules and lessons to separate tables
      if (modules && modules.length > 0) {
        for (const mod of modules) {
          // Generate UUID for module if not present or invalid
          const moduleId = (mod.id && isValidUUID(mod.id)) ? mod.id : crypto.randomUUID();
          
          // Upsert module
          const { error: modError } = await supabase
            .from('modules')
            .upsert({
              id: moduleId,
              course_id: finalCourseId,
              title: mod.title,
              description: mod.title, // Use title as description if no description field
              order: modules.indexOf(mod) + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (modError) {
            console.error('Module upsert error:', modError, mod);
            throw modError;
          }

          // Upsert lessons for this module
          if (mod.lessons && mod.lessons.length > 0) {
            for (const les of mod.lessons) {
              // Generate UUID for lesson if not present or invalid
              const lessonId = (les.id && isValidUUID(les.id)) ? les.id : crypto.randomUUID();
              
              const { error: lesError } = await supabase
                .from('lessons')
                .upsert({
                  id: lessonId,
                  course_id: finalCourseId,
                  module_id: moduleId,
                  title: les.title,
                  content: les.content,
                  video_url: les.videoUrl || null,
                  duration: les.type === 'video' ? 30 : 15, // Default duration
                  order: mod.lessons.indexOf(les) + 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (lesError) {
                console.error('Lesson upsert error:', lesError, les);
                throw lesError;
              }
            }
          }
        }
      }

      toast.success('Draft saved!');
    } catch (err: any) {
      setError('Failed to save draft. ' + (err.message || ''));
      toast.error('Failed to save draft. ' + (err.message || ''));
      console.error(err);
    } finally {
      setSavingDraft(false);
    }
  };

  // Publish course handler
  const handlePublish = async () => {
    setSavingDraft(true); // Reuse the same loading state
    setError('');
    try {
      let thumbnailUrl = '';
      if (thumbnail && typeof thumbnail !== 'string') {
        // Upload thumbnail image if it's a File
        const result = await uploadToCloudinary(thumbnail, 'lms-covers');
        thumbnailUrl = result.secure_url;
      } else if (typeof thumbnail === 'string') {
        thumbnailUrl = thumbnail;
      }
      const courseData = {
        ...(courseId ? { id: courseId } : {}),
        title: title || '',
        slug: slug || '',
        category: category || '',
        price: price ? Number(price) : 0,
        description: description || '',
        duration: duration ? Number(duration) : 0,
        thumbnail: thumbnailUrl || '',
        format: format || '',
        instructor_id: user?.id,
        instructor: user?.id, // for NOT NULL constraint
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_published: true,
        certificate_template_id: certificateTemplateId || null,
      };
      const { data, error } = await supabase
        .from('courses')
        .upsert([courseData], { onConflict: ['id'] })
        .select();
      if (error) {
        toast.error('Failed to publish course. ' + (error.message || ''));
        throw error;
      }
      
      const finalCourseId = data && data[0]?.id ? data[0].id : courseId;
      if (!finalCourseId) {
        throw new Error('Failed to get course ID');
      }
      setCourseId(finalCourseId);

      // Upsert modules and lessons to separate tables
      if (modules && modules.length > 0) {
        for (const mod of modules) {
          // Generate UUID for module if not present or invalid
          const moduleId = (mod.id && isValidUUID(mod.id)) ? mod.id : crypto.randomUUID();
          
          // Upsert module
          const { error: modError } = await supabase
            .from('modules')
            .upsert({
              id: moduleId,
              course_id: finalCourseId,
              title: mod.title,
              description: mod.title, // Use title as description if no description field
              order: modules.indexOf(mod) + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (modError) {
            console.error('Module upsert error:', modError, mod);
            throw modError;
          }

          // Upsert lessons for this module
          if (mod.lessons && mod.lessons.length > 0) {
            for (const les of mod.lessons) {
              // Generate UUID for lesson if not present or invalid
              const lessonId = (les.id && isValidUUID(les.id)) ? les.id : crypto.randomUUID();
              
              const { error: lesError } = await supabase
                .from('lessons')
                .upsert({
                  id: lessonId,
                  course_id: finalCourseId,
                  module_id: moduleId,
                  title: les.title,
                  content: les.content,
                  video_url: les.videoUrl || null,
                  duration: les.type === 'video' ? 30 : 15, // Default duration
                  order: mod.lessons.indexOf(les) + 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (lesError) {
                console.error('Lesson upsert error:', lesError, les);
                throw lesError;
              }
            }
          }
        }
      }

      setShowPublishConfirm(false);
      setShowCelebration(true);
      toast.success('Course published successfully!');
    } catch (err: any) {
      setError('Failed to publish course. ' + (err.message || ''));
      toast.error('Failed to publish course. ' + (err.message || ''));
      console.error(err);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 overflow-auto flex flex-col items-center">
          <div className="w-full bg-white rounded-xl shadow-lg p-4 md:p-8">
            <Stepper step={step} />
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Course Basics</h2>
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Course Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => {
                        setTitle(e.target.value);
                        if (!slugManuallyEdited) {
                          setSlug(slugify(e.target.value));
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="Enter course title"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Course Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => {
                        setSlug(e.target.value);
                        setSlugManuallyEdited(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="e.g. react-for-beginners"
                    />
                  </div>
                </div>
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      disabled={categoriesLoading}
                    >
                      <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category'}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Course Fee (₦)</label>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={e => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold min-h-[100px]"
                      placeholder="Describe your course..."
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Duration (hours)</label>
                    <input
                      type="number"
                      min={0}
                      value={duration}
                      onChange={e => setDuration(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setThumbnail(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {thumbnail && <div className="mt-2"><img src={URL.createObjectURL(thumbnail)} alt="thumbnail preview" className="h-32 rounded-lg shadow" /></div>}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Course Type</label>
                  <div className="flex gap-4">
                    {courseTypes.map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${format === opt.value ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-gray-300 text-gray-600'}`}>
                        <input
                          type="radio"
                          name="courseType"
                          value={opt.value}
                          checked={format === opt.value}
                          onChange={() => setFormat(opt.value)}
                          className="form-radio accent-blue-600"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Certificate Template</label>
                  <CertificateTemplateGallery
                    selectedTemplateId={certificateTemplateId}
                    onSelect={setCertificateTemplateId}
                  />
                  {!certificateTemplateId && (
                    <p className="text-red-600 text-sm mt-2">Please select a certificate template.</p>
                  )}
                </div>
                {error && <div className="text-red-600 mb-4 font-medium">{error}</div>}
                <div className="flex justify-between gap-4">
                  <button
                    className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-lg disabled:opacity-60"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    type="button"
                  >{savingDraft ? 'Saving...' : 'Save as Draft'}</button>
                  <button
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Course Content</h2>
                <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={e => setNewModuleTitle(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    placeholder="e.g. Introduction"
                  />
                  <button
                    className="px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    onClick={handleAddModule}
                    type="button"
                  >Add Section</button>
                </div>
                <div className="space-y-6">
                  {modules.map((mod, mIdx) => (
                    <div key={mod.id} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 focus:outline-none"
                            onClick={() => setOpenModuleIdx(openModuleIdx === mIdx ? null : mIdx)}
                            aria-label={openModuleIdx === mIdx ? 'Collapse' : 'Expand'}
                          >
                            {openModuleIdx === mIdx ? <span>&#8722;</span> : <span>&#43;</span>}
                          </button>
                          <span className="font-bold text-lg text-gray-900">{mod.title}</span>
                        </div>
                        <button className="text-red-500 hover:underline text-sm" onClick={() => handleRemoveModule(mIdx)}>Remove</button>
                      </div>
                      {openModuleIdx === mIdx && (
                        <div>
                          <div className="ml-4">
                            <div className="mb-2 flex items-center gap-2">
                              <button
                                className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold"
                                onClick={() => setActiveModuleIdx(mIdx)}
                                type="button"
                              >Add Lesson</button>
                              <button
                                className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold"
                                onClick={() => handleRemoveModule(mIdx)}
                                type="button"
                              >Remove Section</button>
                            </div>
                            <div className="space-y-2">
                              {mod.lessons.map((lesson, lIdx) => (
                                <div key={lesson.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200">
                                  <div>
                                    <div className="font-semibold text-gray-900">{lesson.title}</div>
                                    <div className="text-xs text-gray-500">{lesson.type === 'text' ? 'Text' : lesson.type === 'video' ? 'Video' : 'Mixed'}</div>
                                  </div>
                                  <button className="text-red-500 hover:underline text-xs" onClick={() => handleRemoveLesson(mIdx, lIdx)}>Remove</button>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Add Lesson Form */}
                          {activeModuleIdx === mIdx && (
                            <div className="mt-4 bg-white rounded-lg p-4 border border-blue-200">
                              <div className="mb-2">
                                <label className="block text-sm font-medium mb-1">Lesson Title</label>
                                <input
                                  type="text"
                                  value={newLessonTitle}
                                  onChange={e => setNewLessonTitle(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-semibold"
                                  placeholder="e.g. Welcome"
                                />
                              </div>
                              <div className="mb-2">
                                <label className="block text-sm font-medium mb-1">Lesson Type</label>
                                <select
                                  value={newLessonType}
                                  onChange={e => setNewLessonType(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-semibold"
                                >
                                  <option value="text">Text</option>
                                  <option value="video">Video</option>
                                  <option value="mixed">Mixed</option>
                                </select>
                              </div>
                              {/* Content for lesson type */}
                              {newLessonType === 'text' && (
                                <div className="mb-2">
                                  <label className="block text-sm font-medium mb-1">Lesson Content</label>
                                  <Suspense fallback={<div>Loading editor...</div>}>
                                    <ReactQuill
                                      value={newLessonContent}
                                      onChange={setNewLessonContent}
                                      className="bg-white rounded-lg"
                                      theme="snow"
                                      placeholder="Lesson content..."
                                      modules={{
                                        toolbar: [
                                          [{ 'header': [1, 2, 3, false] }],
                                          ['bold', 'italic', 'underline', 'strike'],
                                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                          ['blockquote', 'code-block'],
                                          ['link', 'image', 'video'],
                                          [{ 'align': [] }],
                                          ['clean']
                                        ]
                                      }}
                                      style={{ minHeight: 200, height: 200 }}
                                    />
                                  </Suspense>
                                </div>
                              )}
                              {newLessonType === 'video' && (
                                <div className="flex flex-col gap-2 mb-2">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Lesson Content</label>
                                    <Suspense fallback={<div>Loading editor...</div>}>
                                      <ReactQuill
                                        value={newLessonContent}
                                        onChange={setNewLessonContent}
                                        className="bg-white rounded-lg"
                                        theme="snow"
                                        placeholder="Lesson content..."
                                        modules={{
                                          toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            ['blockquote', 'code-block'],
                                            ['link', 'image', 'video'],
                                            [{ 'align': [] }],
                                            ['clean']
                                          ]
                                        }}
                                        style={{ minHeight: 200, height: 200 }}
                                      />
                                    </Suspense>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Lesson Video</label>
                                    <button
                                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
                                      type="button"
                                      onClick={() => setVideoModal({ open: true, moduleIdx: mIdx, lessonIdx: modules[mIdx].lessons.length })}
                                    >Upload Video</button>
                                    {videoModal.open && videoModal.moduleIdx === mIdx && videoModal.lessonIdx === modules[mIdx].lessons.length && (
                                      <VideoUploadModal
                                        open={videoModal.open}
                                        onClose={() => setVideoModal({ open: false, moduleIdx: null, lessonIdx: null })}
                                        onUpload={handleVideoUpload}
                                        progress={videoUploadProgress}
                                        error={videoUploadError}
                                      />
                                    )}
                                    {/* Show video preview if uploaded */}
                                    {modules[mIdx].lessons[modules[mIdx].lessons.length - 1]?.videoUrl && (
                                      <video
                                        src={modules[mIdx].lessons[modules[mIdx].lessons.length - 1].videoUrl}
                                        controls
                                        className="w-full rounded-lg mt-2"
                                        style={{ maxHeight: 240 }}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                              {newLessonType === 'mixed' && (
                                <div className="flex flex-col gap-2 mb-2">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Lesson Content</label>
                                    <Suspense fallback={<div>Loading editor...</div>}>
                                      <ReactQuill
                                        value={newLessonContent}
                                        onChange={setNewLessonContent}
                                        className="bg-white rounded-lg"
                                        theme="snow"
                                        placeholder="Lesson content..."
                                        modules={{
                                          toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            ['blockquote', 'code-block'],
                                            ['link', 'image', 'video'],
                                            [{ 'align': [] }],
                                            ['clean']
                                          ]
                                        }}
                                        style={{ minHeight: 200, height: 200 }}
                                      />
                                    </Suspense>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Lesson Video</label>
                                    <button
                                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
                                      type="button"
                                      onClick={() => setVideoModal({ open: true, moduleIdx: mIdx, lessonIdx: modules[mIdx].lessons.length })}
                                    >Upload Video</button>
                                    {videoModal.open && videoModal.moduleIdx === mIdx && videoModal.lessonIdx === modules[mIdx].lessons.length && (
                                      <VideoUploadModal
                                        open={videoModal.open}
                                        onClose={() => setVideoModal({ open: false, moduleIdx: null, lessonIdx: null })}
                                        onUpload={handleVideoUpload}
                                        progress={videoUploadProgress}
                                        error={videoUploadError}
                                      />
                                    )}
                                    {/* Show video preview if uploaded */}
                                    {modules[mIdx].lessons[modules[mIdx].lessons.length - 1]?.videoUrl && (
                                      <video
                                        src={modules[mIdx].lessons[modules[mIdx].lessons.length - 1].videoUrl}
                                        controls
                                        className="w-full rounded-lg mt-2"
                                        style={{ maxHeight: 240 }}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* Assignment section (optional) */}
                              <div className="mt-8">
                                <label className="block text-sm font-medium mb-1">Assignment (optional)</label>
                                <Suspense fallback={<div>Loading editor...</div>}>
                                  <ReactQuill
                                    value={assignmentQuestion}
                                    onChange={setAssignmentQuestion}
                                    className="bg-white rounded-lg"
                                    theme="snow"
                                    placeholder="Assignment question (optional)"
                                    modules={{
                                      toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        ['blockquote', 'code-block'],
                                        ['link', 'image', 'video'],
                                        [{ 'align': [] }],
                                        ['clean']
                                      ]
                                    }}
                                    style={{ minHeight: 120, height: 120 }}
                                  />
                                </Suspense>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png"
                                  onChange={e => setAssignmentFile(e.target.files?.[0] || null)}
                                  className="mt-2"
                                />
                              </div>
                              <div className="mt-14 flex gap-2 justify-end">
                                <button
                                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                                  onClick={() => setActiveModuleIdx(null)}
                                  type="button"
                                >Cancel</button>
                                <button
                                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                                  onClick={() => handleAddLesson(mIdx)}
                                  type="button"
                                >Add Lesson</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {error && <div className="text-red-600 mt-4 font-medium">{error}</div>}
                <div className="flex justify-between mt-8">
                  <button
                    className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-lg disabled:opacity-60"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    type="button"
                  >{savingDraft ? 'Saving...' : 'Save as Draft'}</button>
                  <button
                    className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-lg"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg"
                    onClick={() => {
                      if (modules.length === 0 || modules.every(m => m.lessons.length === 0)) {
                        setError('Please add at least one module with at least one lesson before proceeding.');
                        return;
                      }
                      setError('');
                      setStep(3);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Publish Course</h2>
                <div className="bg-white rounded-xl shadow p-6 mb-8 max-w-3xl mx-auto">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-shrink-0">
                      {thumbnail ? (
                        <img src={URL.createObjectURL(thumbnail)} alt="thumbnail preview" className="h-40 w-64 object-cover rounded-lg shadow" />
                      ) : (
                        <div className="h-40 w-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Cover</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-2xl font-bold text-blue-700">{title}</div>
                      <div className="text-gray-500 text-sm">Slug: <span className="font-mono">{slug}</span></div>
                      <div className="text-gray-700">Category: <span className="font-semibold">{categories.find(c => c.id === category)?.name}</span></div>
                      <div className="text-gray-700">Type: <span className="font-semibold">{courseTypes.find(t => t.value === format)?.label}</span></div>
                      <div className="text-gray-700">Price: <span className="font-semibold">₦{price}</span></div>
                      <div className="text-gray-700">Duration: <span className="font-semibold">{duration} hours</span></div>
                      <div className="text-gray-700">Description:</div>
                      <div className="prose max-w-none text-gray-800 bg-gray-50 rounded p-2">{description}</div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-bold mb-2">Modules & Lessons</h3>
                    <div className="space-y-4">
                      {modules.map((mod, mIdx) => (
                        <div key={mod.id} className="bg-blue-50 rounded-lg p-4">
                          <div className="font-bold text-blue-800 mb-2">{mod.title}</div>
                          <ul className="space-y-2 ml-4">
                            {mod.lessons.map((lesson, lIdx) => (
                              <li key={lesson.id} className="bg-white rounded p-3 shadow flex flex-col gap-1">
                                <div className="font-semibold text-gray-900">{lesson.title}</div>
                                <div className="text-xs text-gray-500">{lesson.type === 'text' ? 'Text' : lesson.type === 'video' ? 'Video' : 'Mixed'}</div>
                                {lesson.assignment && (
                                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                                    <div className="font-semibold text-yellow-700">Assignment</div>
                                    <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: lesson.assignment }} />
                                    {lesson.assignmentFile && <a href={lesson.assignmentFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">View Attachment</a>}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-lg disabled:opacity-60"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    type="button"
                  >{savingDraft ? 'Saving...' : 'Save as Draft'}</button>
                  <button className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-lg" onClick={handleBack}>Back</button>
                  <button className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition text-lg" onClick={() => setShowPublishConfirm(true)}>Publish</button>
                </div>
                {/* Publish confirmation popup */}
                {showPublishConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in text-center">
                      <h2 className="text-xl font-bold mb-4">Confirm Publish</h2>
                      <p className="mb-6">Are you sure you want to publish this course?</p>
                      <div className="flex justify-center gap-4">
                        <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow hover:bg-gray-300 transition" onClick={() => setShowPublishConfirm(false)}>Cancel</button>
                        <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition" onClick={handlePublish}>Yes, Publish</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Celebration Modal */}
                {showCelebration && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
                    <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={350} recycle={false} gravity={0.25} />
                    <div className="bg-white rounded-2xl p-10 shadow-2xl text-center max-w-md w-full relative animate-celebrate-modal">
                      <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowCelebration(false)}>×</button>
                      <div className="flex flex-col items-center mb-4">
                        <span className="inline-block bg-gradient-to-tr from-yellow-400 via-pink-500 to-blue-500 p-4 rounded-full shadow-lg mb-2 animate-bounce">
                          <FaTrophy className="text-white text-4xl drop-shadow" />
                        </span>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent mb-2">Congratulations!</h2>
                      </div>
                      <div className="text-lg text-gray-700 mb-6">
                        {isFirstCourse
                          ? <><span className="font-semibold text-blue-700">You have published your first course!</span> <span role="img" aria-label="party">🎉</span> This is a <span className="font-semibold text-pink-600">big milestone</span>.</>
                          : <>Your course has been <span className="font-semibold text-green-600">published successfully!</span></>}
                      </div>
                      <div className="border-t border-gray-200 my-6"></div>
                      <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-pink-500 to-yellow-400 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition mb-4 flex items-center justify-center gap-2 text-lg">
                        <FaTrophy className="text-white text-xl" /> Boost Course
                      </button>
                      <button className="w-full px-6 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold shadow hover:bg-gray-200 transition" onClick={() => setShowCelebration(false)}>Close</button>
                    </div>
                    <style>{`
                      .animate-fade-in { animation: fadeIn 0.3s ease; }
                      .animate-celebrate-modal { animation: scaleIn 0.4s cubic-bezier(.4,2,.6,1) both; }
                      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                      @keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
                    `}</style>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 