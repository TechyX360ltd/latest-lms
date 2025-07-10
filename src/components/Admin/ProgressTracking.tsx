import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter,
  Eye,
  Download,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  User,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useUsers, useCourses } from '../../hooks/useData';

interface UserProgress {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  enrolledDate: string;
  lastAccessed: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  timeSpent: number; // in minutes
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  certificateEarned: boolean;
  assignments: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export function ProgressTracking() {
  const { users, loading: usersLoading } = useUsers();
  const { courses, loading: coursesLoading } = useCourses();
  const [progressData, setProgressData] = useState<UserProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usersLoading && !coursesLoading) {
      generateProgressData();
    }
  }, [users, courses, usersLoading, coursesLoading]);

  const generateProgressData = () => {
    const progressList: UserProgress[] = [];

    if (!users || !Array.isArray(users)) {
      setProgressData([]);
      setLoading(false);
      return;
    }

    users.forEach(user => {
      if (user.role === 'learner' && Array.isArray(user.enrolledCourses) && user.enrolledCourses.length > 0) {
        user.enrolledCourses.forEach(courseId => {
          const course = courses.find(c => c.id === courseId);
          if (course) {
            const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
            const completedLessons = Math.floor(Math.random() * (totalLessons + 1)); // Replace with real completion logic if available
            const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            
            // Determine status based on progress
            let status: UserProgress['status'] = 'not-started';
            if (progressPercentage === 0) {
              status = 'not-started';
            } else if (progressPercentage === 100) {
              status = 'completed';
            } else {
              status = 'in-progress';
            }

            // Use real assignments
            const totalAssignments = Array.isArray(course.assignments) ? course.assignments.length : 0;
            const completedAssignments = Math.floor(Math.random() * (totalAssignments + 1)); // Replace with real completion logic if available
            const pendingAssignments = Math.max(0, totalAssignments - completedAssignments - 1);
            const overdueAssignments = Math.max(0, totalAssignments - completedAssignments - pendingAssignments);

            progressList.push({
              userId: user.id,
              userName: `${user.first_name} ${user.last_name}`,
              userEmail: user.email,
              courseId: course.id,
              courseName: course.title,
              enrolledDate: user.created_at,
              lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              completedLessons,
              totalLessons,
              progressPercentage,
              timeSpent: Math.floor(Math.random() * 300) + 30, // 30-330 minutes
              status,
              certificateEarned: progressPercentage === 100,
              assignments: {
                total: totalAssignments,
                completed: completedAssignments,
                pending: pendingAssignments,
                overdue: overdueAssignments
              }
            });
          }
        });
      }
    });

    setProgressData(progressList);
    setLoading(false);
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'not-started':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportProgressData = () => {
    const csvContent = [
      ['User Name', 'Email', 'Course', 'Progress %', 'Completed Lessons', 'Total Lessons', 'Time Spent (hrs)', 'Status', 'Certificate Earned'],
      ...filteredProgress.map(progress => [
        progress.userName,
        progress.userEmail,
        progress.courseName,
        progress.progressPercentage,
        progress.completedLessons,
        progress.totalLessons,
        Math.round(progress.timeSpent / 60 * 100) / 100,
        progress.status,
        progress.certificateEarned ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-progress-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProgress = progressData.filter(progress => {
    const matchesSearch = progress.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         progress.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         progress.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || progress.courseId === selectedCourse;
    const matchesStatus = selectedStatus === 'all' || progress.status === selectedStatus;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Group by user for better display
  const groupedProgress = filteredProgress.reduce((acc, progress) => {
    if (!acc[progress.userId]) {
      acc[progress.userId] = {
        user: {
          id: progress.userId,
          first_name: progress.userName.split(' ')[0] || '',
          last_name: progress.userName.split(' ').slice(1).join(' ') || '',
          email: progress.userEmail
        },
        courses: []
      };
    }
    acc[progress.userId].courses.push(progress);
    return acc;
  }, {} as Record<string, { user: { id: string; first_name: string; last_name: string; email: string }; courses: UserProgress[] }>);

  // Calculate summary statistics
  const totalUsers = Object.keys(groupedProgress).length;
  const totalEnrollments = filteredProgress.length;
  const completedCourses = filteredProgress.filter(p => p.status === 'completed').length;
  const averageProgress = filteredProgress.length > 0 
    ? Math.round(filteredProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / filteredProgress.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
          <p className="text-gray-600">Monitor student progress and course completion rates</p>
        </div>
        <button 
          onClick={exportProgressData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed Courses</p>
              <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Progress</p>
              <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="space-y-1">
          {Object.values(groupedProgress).map(({ user, courses: userCourses }) => (
            <div key={user.id} className="border-b border-gray-100 last:border-b-0">
              {/* User Header */}
              <div 
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => toggleUserExpansion(user.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {expandedUsers.has(user.id) ? 
                        <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      }
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.first_name} {user.last_name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{userCourses.length}</p>
                      <p className="text-gray-500">Courses</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">
                        {Math.round(userCourses.reduce((sum, c) => sum + c.progressPercentage, 0) / userCourses.length)}%
                      </p>
                      <p className="text-gray-500">Avg Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">
                        {userCourses.filter(c => c.certificateEarned).length}
                      </p>
                      <p className="text-gray-500">Certificates</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Courses (Expanded) */}
              {expandedUsers.has(user.id) && (
                <div className="bg-gray-50 border-t border-gray-200">
                  {userCourses.map((progress) => (
                    <div key={`${progress.userId}-${progress.courseId}`} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                        <div className="lg:col-span-2">
                          <h4 className="font-medium text-gray-900 mb-1">{progress.courseName}</h4>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(progress.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(progress.status)}`}>
                              {progress.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 relative">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="2"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray={`${progress.progressPercentage}, 100`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-900">{progress.progressPercentage}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {progress.completedLessons}/{progress.totalLessons} lessons
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{Math.round(progress.timeSpent / 60)}h</p>
                          <p className="text-xs text-gray-500">Time Spent</p>
                        </div>

                        <div className="text-center">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">✓ {progress.assignments.completed}</span>
                              <span className="text-yellow-600">⏳ {progress.assignments.pending}</span>
                              <span className="text-red-600">⚠ {progress.assignments.overdue}</span>
                            </div>
                            <p className="text-xs text-gray-500">Assignments</p>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {progress.certificateEarned ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Award className="w-4 h-4" />
                                <span className="text-xs font-medium">Earned</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Not earned</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Last: {new Date(progress.lastAccessed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {Object.keys(groupedProgress).length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data found</h3>
          <p className="text-gray-600">No users have enrolled in courses yet</p>
        </div>
      )}
    </div>
  );
}