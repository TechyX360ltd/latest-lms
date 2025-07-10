import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, BookOpen, Video, FileText, Menu, X } from 'lucide-react';
import { useCourses, useUsers, useCourseStructure } from '../../hooks/useData';
import { Header } from '../Layout/Header';
import { Sidebar } from '../Layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { getLessonNote, upsertLessonNote, getLessonDiscussions, addLessonDiscussion, isValidUUID } from '../../lib/supabase';
import { Course, Module, Lesson, Assignment, User } from '../../types';
import { CertificateDownload } from './CertificateDownload';
import Confetti from 'react-confetti';

// Types for discussion and notes
interface Discussion {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  replies?: Discussion[];
}

interface LessonNote {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function CourseViewer() {
  const { courseSlug } = useParams<{ courseSlug?: string }>();
  const navigate = useNavigate();
  const { getCourseBySlug } = useCourses();
  const { user } = useAuth();
  const { users: allUsers, loading: usersLoading } = useUsers();

  // State management
  const [moduleIdx, setModuleIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'discussion'>('content');
  
  // Notes state
  const [notes, setNotes] = useState<{ [lessonId: string]: string }>({});
  const [notesSaved, setNotesSaved] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  
  // Discussion state
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [replyInputs, setReplyInputs] = useState<{ [parentId: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Course data fetching
  const course = getCourseBySlug(courseSlug || '');
  const courseId = course?.id;
  const shouldFetchStructure = courseId && isValidUUID(courseId);
  const { modules, loading: modulesLoading, error: modulesError } = useCourseStructure(shouldFetchStructure ? courseId : '');

  // Debug logging
  console.log('CourseViewer Debug:', {
    courseSlug,
    courseId,
    shouldFetchStructure,
    modules,
    modulesLoading,
    modulesError
  });

  // Current module and lesson
  const currentModule = modules[moduleIdx] || { lessons: [], assignments: [] };
  const lessons = currentModule.lessons || [];
  const currentLesson = lessons[lessonIdx];
  const isLastLesson = lessonIdx === lessons.length - 1;
  const isLastModule = moduleIdx === modules.length - 1;
  const showAssignment = isLastLesson && currentModule.assignments && currentModule.assignments.length > 0;

  // Navigation handlers
  const handleNext = () => {
    if (showAssignment) {
      alert('Assignment for this module!');
      return;
    }
    if (isLastLesson) {
      if (!isLastModule) {
        setModuleIdx(moduleIdx + 1);
        setLessonIdx(0);
      } else {
        setShowCompleteModal(true);
      }
    } else {
      setLessonIdx(lessonIdx + 1);
    }
  };

  const handlePrev = () => {
    if (lessonIdx > 0) {
      setLessonIdx(lessonIdx - 1);
    } else if (moduleIdx > 0) {
      const prevModule = modules[moduleIdx - 1];
      setModuleIdx(moduleIdx - 1);
      setLessonIdx((prevModule?.lessons?.length || 1) - 1);
    }
  };

  const handleSelectLesson = (modIdx: number, lesIdx: number) => {
    setModuleIdx(modIdx);
    setLessonIdx(lesIdx);
    setShowSidebar(false);
  };

  // Notes management
  useEffect(() => {
    if (!user || !currentLesson?.id) return;
    
    setNoteLoading(true);
    setNoteError(null);
    
    getLessonNote(user.id, currentLesson.id)
      .then((result) => {
        if (result && 'error' in result && result.error) {
          setNoteError(result.error.message);
        } else if (result && 'note' in result && result.note) {
          setNotes(prev => ({ ...prev, [currentLesson.id]: result.note.content || '' }));
        }
      })
      .catch(e => setNoteError(e.message))
      .finally(() => setNoteLoading(false));
  }, [user, currentLesson?.id]);

  const handleSaveNotes = async () => {
    if (!user || !currentLesson?.id) return;
    
    setNoteLoading(true);
    setNoteError(null);
    
    try {
      const { error } = await upsertLessonNote(user.id, currentLesson.id, notes[currentLesson.id] || '');
      if (error) setNoteError(error.message);
      else {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 1200);
      }
    } catch (e: any) {
      setNoteError(e.message);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentLesson?.id) return;
    setNotes(prev => ({ ...prev, [currentLesson.id]: e.target.value }));
  };

  // Discussion management
  useEffect(() => {
    if (!currentLesson?.id) return;
    
    setDiscussionLoading(true);
    setDiscussionError(null);
    
    getLessonDiscussions(currentLesson.id)
      .then((result) => {
        if (result && 'error' in result && result.error) {
          setDiscussionError(result.error.message);
        } else if (result && 'discussions' in result && result.discussions) {
          setDiscussions(result.discussions);
        }
      })
      .catch(e => setDiscussionError(e.message))
      .finally(() => setDiscussionLoading(false));
  }, [currentLesson?.id]);

  const handleAddDiscussion = async () => {
    if (!user || !currentLesson?.id || !discussionInput.trim()) return;
    // Debug log for payload
    console.log('Posting discussion:', {
      user_id: user.id,
      lesson_id: currentLesson.id,
      content: discussionInput.trim()
    });
    try {
      const { error } = await addLessonDiscussion(user.id, currentLesson.id, discussionInput.trim());
      if (error) {
        setDiscussionError(error.message);
      } else {
        setDiscussionInput('');
        // Refresh discussions
        const result = await getLessonDiscussions(currentLesson.id);
        if (result && 'discussions' in result && result.discussions) {
          setDiscussions(result.discussions);
        }
      }
    } catch (e: any) {
      setDiscussionError(e.message);
    }
  };

  const handleReplyInputChange = (parentId: string, value: string) => {
    setReplyInputs(prev => ({ ...prev, [parentId]: value }));
  };

  const handleAddReply = async (parentId: string) => {
    if (!user || !currentLesson?.id || !replyInputs[parentId]?.trim()) return;
    try {
      const { error } = await addLessonDiscussion(user.id, currentLesson.id, replyInputs[parentId].trim(), parentId);
      if (error) {
        setDiscussionError(error.message);
      } else {
        setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
        // Refresh discussions
        const result = await getLessonDiscussions(currentLesson.id);
        if (result && 'discussions' in result && result.discussions) {
          setDiscussions(result.discussions);
        }
      }
    } catch (e: any) {
      setDiscussionError(e.message);
    }
  };

  // Content rendering
  const renderContent = () => {
    if (!currentLesson) {
      return <div className="text-gray-600">No lesson found.</div>;
    }

    if (currentLesson.video_url && currentLesson.content) {
      return (
        <div>
          <div className="mb-4">
            <Video className="inline w-6 h-6 mr-2 text-blue-500" />
            <span className="font-bold">Video Lesson</span>
          </div>
          <video controls className="w-full rounded-xl mb-4">
            <source src={currentLesson.video_url} type="video/mp4" />
          </video>
          <div className="prose max-w-none text-gray-800 whitespace-pre-line">
            {currentLesson.content}
          </div>
        </div>
      );
    } else if (currentLesson.video_url) {
      return (
        <div>
          <div className="mb-4">
            <Video className="inline w-6 h-6 mr-2 text-blue-500" />
            <span className="font-bold">Video Lesson</span>
          </div>
          <video controls className="w-full rounded-xl">
            <source src={currentLesson.video_url} type="video/mp4" />
          </video>
        </div>
      );
    } else if (currentLesson.content) {
      return (
        <div>
          <div className="mb-4">
            <FileText className="inline w-6 h-6 mr-2 text-blue-500" />
            <span className="font-bold">Text Lesson</span>
          </div>
          <div className="prose max-w-none text-gray-800 whitespace-pre-line">
            {currentLesson.content}
          </div>
        </div>
      );
    }

    return <div className="text-gray-600">No content available for this lesson.</div>;
  };

  // Progress calculation
  const completedLessons = lessons.filter((_, idx) => idx < lessonIdx);
  const progress = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  // Add course completion handler
  const handleCourseSubmit = () => {
    setShowCompleteConfirm(true);
  };

  // Loading and error states
  if (modulesLoading) {
    return (
      <>
        <Header />
        <div className="flex w-full h-full">
          <div className="flex-1 p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (modulesError) {
    return (
      <>
        <Header />
        <div className="flex w-full h-full">
          <div className="flex-1 p-4">
            <div className="text-red-600 font-semibold">
              Error loading course content: {modulesError}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Header />
        <div className="flex w-full h-full">
          <div className="flex-1 p-4">
            <div className="text-red-600 font-semibold">
              Course not found.
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      {/* Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Complete Course?</h2>
            <p className="mb-6">Are you sure you want to mark this course as complete?</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow hover:bg-gray-300 transition"
                onClick={() => setShowCompleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => {
                  setShowCompleteConfirm(false);
                  setShowCelebration(true);
                }}
              >
                Yes, Complete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Confetti width={window.innerWidth} height={window.innerHeight} />
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
            <p className="mb-6">
              You have successfully completed the{' '}
              <span className="font-bold text-blue-700">{course?.title || ''}</span> course!
            </p>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => {
                setShowCelebration(false);
                setShowCertificate(true);
              }}
            >
              Show Certificate
            </button>
          </div>
        </div>
      )}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-2xl w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowCertificate(false)}
            >×</button>
            <CertificateDownload
              learnerName={`${user?.first_name || ''} ${user?.last_name || ''}`}
              courseTitle={course?.title || ''}
              userId={user?.id || ''}
              courseId={course?.id || ''}
              template="default"
            />
            <div className="flex justify-center gap-4 mt-6">
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => navigate('/dashboard/courses')}
              >
                Go to My Courses
              </button>
            </div>
          </div>
        </div>
      )}
      {!showCelebration && !showCertificate && !showCompleteConfirm && (
        <div className="flex flex-col md:flex-row h-full">
          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          {/* Mobile Sidebar Overlay */}
          {showSidebar && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setShowSidebar(false)} />
          )}
          {/* Sidebar */}
          <aside
            className={`
            fixed z-50 top-0 left-0 h-full w-72 bg-gray-50 p-4 transition-transform duration-300
            md:static md:z-auto md:block md:translate-x-0
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}
          >
            {/* Close button for mobile */}
            <button
              className="md:hidden absolute top-4 right-4 p-2"
              onClick={() => setShowSidebar(false)}
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="font-bold text-lg mb-4 mt-8 md:mt-0">Course Modules</h2>
            {modules.map((module, modIdx) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-sm mb-4"
              >
                <div className="font-bold text-blue-700 px-4 pt-2 pb-1">
                  {module.title}
                </div>
                <ul>
                  {module.lessons && module.lessons.length > 0 ? (
                    module.lessons.map((lesson, lesIdx) => {
                      const isActive = modIdx === moduleIdx && lesIdx === lessonIdx;
                      return (
                        <li key={lesson.id}>
                          <button
                            className={`flex items-center gap-2 w-full text-left px-6 py-2 text-base rounded-lg transition-colors duration-150
                            ${isActive
                              ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              handleSelectLesson(modIdx, lesIdx);
                              setShowSidebar(false);
                            }}
                          >
                            <span className="text-lg">📖</span>
                            <span className="truncate">{lesson.title}</span>
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-6 py-2 text-sm text-gray-400">No lessons in this module</li>
                  )}
                </ul>
              </div>
            ))}
          </aside>
          {/* Main Content */}
          <main className="flex-1 w-full p-2 md:p-6 ml-0 md:ml-0">
            <h1 className="text-2xl font-bold mb-1">{course?.title}</h1>
            {currentLesson?.title && (
              <div className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">
                {currentLesson.title}
              </div>
            )}
            
            {/* Lesson navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrev}
                disabled={moduleIdx === 0 && lessonIdx === 0}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <div className="text-center flex-1">
                <div className="text-sm text-gray-600">
                  Lesson {lessonIdx + 1} of {lessons.length} in {currentModule.title}
                </div>
                <div className="text-lg font-semibold">
                  {currentLesson?.title || 'No lesson selected'}
                </div>
              </div>
              {isLastLesson && isLastModule && (
                <button
                  onClick={handleCourseSubmit}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition ml-auto"
                >
                  Complete Course <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>

            {/* Content tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {['content', 'notes', 'discussion'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as 'content' | 'notes' | 'discussion')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab content */}
            <div className="min-h-[400px]">
              {activeTab === 'content' && (
                <div className="prose max-w-none">
                  {renderContent()}
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className="mb-4">
                    <textarea
                      value={notes[currentLesson?.id || ''] || ''}
                      onChange={handleNotesChange}
                      placeholder="Take notes on this lesson..."
                      className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={noteLoading}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleSaveNotes}
                      disabled={noteLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {noteLoading ? 'Saving...' : notesSaved ? 'Saved!' : 'Save Notes'}
                    </button>
                    {noteError && <div className="text-red-600 text-sm">{noteError}</div>}
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div>
                  <div className="mb-4">
                    <textarea
                      value={discussionInput}
                      onChange={(e) => setDiscussionInput(e.target.value)}
                      placeholder="Start a discussion..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddDiscussion}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Post Discussion
                    </button>
                  </div>
                  
                  {discussionLoading && <div className="text-gray-600">Loading discussions...</div>}
                  {discussionError && <div className="text-red-600 text-sm">{discussionError}</div>}
                  
                  <div className="space-y-4">
                    {discussions.map((discussion) => (
                      <div key={discussion.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                          <div>
                            <div className="font-medium">
                              {discussion.user?.first_name} {discussion.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(discussion.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-800 mb-3">{discussion.content}</div>
                        
                        {/* Reply button */}
                        <button
                          onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Reply
                        </button>
                        
                        {/* Reply input */}
                        {replyingTo === discussion.id && (
                          <div className="mt-3">
                            <textarea
                              value={replyInputs[discussion.id] || ''}
                              onChange={(e) => handleReplyInputChange(discussion.id, e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full h-20 p-2 border border-gray-300 rounded resize-none"
                            />
                            <button
                              onClick={() => handleAddReply(discussion.id)}
                              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                            >
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Completion modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 flex flex-col items-center relative">
            {/* Confetti celebration (simple SVG or use a confetti library if available) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              {/* You can replace this with a confetti library for more effect */}
              <svg width="100%" height="100%" className="opacity-60">
                <circle cx="50%" cy="30" r="6" fill="#3b82f6" />
                <circle cx="30" cy="60" r="4" fill="#f59e42" />
                <circle cx="90%" cy="80" r="5" fill="#10b981" />
                <circle cx="80" cy="40" r="3" fill="#f43f5e" />
                <circle cx="70%" cy="90" r="4" fill="#6366f1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-center z-20">Congratulations!</h3>
            <p className="text-gray-700 mb-6 text-center z-20">
              You have successfully completed <span className="font-bold text-blue-600">{course?.title}</span>.<br/>
              Well done on finishing all lessons!
            </p>
            <div className="flex flex-col space-y-3 w-full z-20">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setShowCertificateModal(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              >
                View & Download Certificate
              </button>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  navigate('/dashboard');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Go to My Courses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate modal (shown after celebration) */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full mx-4 flex flex-col items-center relative">
            <h3 className="text-2xl font-bold mb-4 text-center">Your Certificate</h3>
            {/* CertificateDownload component should handle PDF generation, upload, and download */}
            <CertificateDownload
              user={user}
              course={course}
              onClose={() => setShowCertificateModal(false)}
            />
            <button
              onClick={() => setShowCertificateModal(false)}
              className="mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Only show the parent Go to My Courses button if certificate modal is not open */}
      {!showCertificateModal && (
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
        >
          Go to My Courses
        </button>
      )}
    </>
  );
}