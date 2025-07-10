import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Award, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Users,
  Trophy,
  Zap,
  Brain,
  Timer,
  Play,
  Pause
} from 'lucide-react';
import { useCourses } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';

interface ProgressStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  completedHours: number;
  averageProgress: number;
  certificatesEarned: number;
  currentStreak: number;
  totalAssignments: number;
  completedAssignments: number;
  skillsLearned: string[];
  weeklyGoal: number;
  weeklyProgress: number;
  studyTime: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  timeSpent: number;
  totalDuration: number;
  status: 'not-started' | 'in-progress' | 'completed';
  lastAccessed: string;
  certificateEarned: boolean;
  assignments: {
    total: number;
    completed: number;
  };
  lessonsCompleted: number;
  totalLessons: number;
}

interface LearningSession {
  date: string;
  duration: number; // in minutes
  courseId: string;
  courseName: string;
}

export function Progress() {
  const { courses, loading } = useCourses();
  const { user } = useAuth();
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([]);

  useEffect(() => {
    if (!loading && user) {
      loadUserProgressData();
    }
  }, [courses, user, loading]);

  const loadUserProgressData = () => {
    if (!user) return;

    // Load real user data from localStorage
    const userProgressData = localStorage.getItem(`userProgress-${user.id}`);
    const userCertificates = localStorage.getItem('userCertificates');
    const userAssignmentSubmissions = localStorage.getItem(`submissions-${user.id}`);
    const userLearningSessions = localStorage.getItem(`learningSessions-${user.id}`);

    // Parse stored data
    const storedProgress = userProgressData ? JSON.parse(userProgressData) : {};
    const certificates = userCertificates ? JSON.parse(userCertificates) : [];
    const submissions = userAssignmentSubmissions ? JSON.parse(userAssignmentSubmissions) : [];
    const sessions = userLearningSessions ? JSON.parse(userLearningSessions) : [];

    // Get user's enrolled and completed courses
    const enrolledCourses = courses.filter(course => 
      user.enrolledCourses.includes(course.id)
    );
    const completedCourses = courses.filter(course => 
      user.completedCourses?.includes(course.id)
    );

    // Generate course progress data based on real user data
    const courseProgressData: CourseProgress[] = [];

    // Add enrolled courses
    enrolledCourses.forEach(course => {
      const courseProgressInfo = storedProgress[course.id] || {};
      const completedLessons = courseProgressInfo.completedLessons || 0;
      const totalLessons = course.lessons?.length || 0;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const timeSpent = courseProgressInfo.timeSpent || 0;
      
      // Count assignments for this course
      const courseSubmissions = submissions.filter((s: any) => s.courseId === course.id);
      const totalAssignments = 3; // Assume 3 assignments per course
      const completedAssignments = courseSubmissions.length;

      courseProgressData.push({
        courseId: course.id,
        courseName: course.title,
        instructor: course.instructor || 'Instructor',
        thumbnail: course.thumbnail,
        progress,
        timeSpent,
        totalDuration: course.duration * 60, // in minutes
        status: progress === 0 ? 'not-started' : 'in-progress',
        lastAccessed: courseProgressInfo.lastAccessed || new Date().toISOString(),
        certificateEarned: false,
        assignments: {
          total: totalAssignments,
          completed: completedAssignments
        },
        lessonsCompleted: completedLessons,
        totalLessons: totalLessons
      });
    });

    // Add completed courses
    completedCourses.forEach(course => {
      const courseProgressInfo = storedProgress[course.id] || {};
      const timeSpent = courseProgressInfo.timeSpent || course.duration * 60;
      
      // Count assignments for this course
      const courseSubmissions = submissions.filter((s: any) => s.courseId === course.id);
      const totalAssignments = 3;
      const completedAssignments = courseSubmissions.length;

      courseProgressData.push({
        courseId: course.id,
        courseName: course.title,
        instructor: course.instructor || 'Instructor',
        thumbnail: course.thumbnail,
        progress: 100,
        timeSpent,
        totalDuration: course.duration * 60,
        status: 'completed',
        lastAccessed: courseProgressInfo.lastAccessed || new Date().toISOString(),
        certificateEarned: true,
        assignments: {
          total: totalAssignments,
          completed: totalAssignments // All assignments completed for finished courses
        },
        lessonsCompleted: course.lessons?.length || 0,
        totalLessons: course.lessons?.length || 0
      });
    });

    setCourseProgress(courseProgressData);
    setLearningSessions(sessions);

    // Calculate real statistics
    const totalCourses = enrolledCourses.length + completedCourses.length;
    const completedCoursesCount = completedCourses.length;
    const inProgressCourses = enrolledCourses.length;
    const totalHours = [...enrolledCourses, ...completedCourses].reduce((sum, course) => sum + course.duration, 0);
    const completedHours = Math.round(courseProgressData.reduce((sum, c) => sum + (c.timeSpent / 60), 0));
    const averageProgress = totalCourses > 0 
      ? Math.round(courseProgressData.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
      : 0;
    const certificatesEarned = certificates.length;
    const totalAssignments = courseProgressData.reduce((sum, c) => sum + c.assignments.total, 0);
    const completedAssignments = courseProgressData.reduce((sum, c) => sum + c.assignments.completed, 0);

    // Calculate learning streak
    const currentStreak = calculateLearningStreak(sessions);

    // Calculate study time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const studyTimeToday = sessions
      .filter((s: LearningSession) => new Date(s.date) >= today)
      .reduce((sum: number, s: LearningSession) => sum + s.duration, 0);

    const studyTimeThisWeek = sessions
      .filter((s: LearningSession) => new Date(s.date) >= thisWeekStart)
      .reduce((sum: number, s: LearningSession) => sum + s.duration, 0);

    const studyTimeThisMonth = sessions
      .filter((s: LearningSession) => new Date(s.date) >= thisMonthStart)
      .reduce((sum: number, s: LearningSession) => sum + s.duration, 0);

    // Generate skills based on completed courses and progress
    const skillsLearned = generateSkillsFromCourses([...enrolledCourses, ...completedCourses], courseProgressData);

    // Generate weekly activity data
    const weeklyActivityData = generateWeeklyActivity(sessions);
    setWeeklyActivity(weeklyActivityData);

    setProgressStats({
      totalCourses,
      completedCourses: completedCoursesCount,
      inProgressCourses,
      totalHours,
      completedHours,
      averageProgress,
      certificatesEarned,
      currentStreak,
      totalAssignments,
      completedAssignments,
      skillsLearned,
      weeklyGoal: 10, // 10 hours per week goal
      weeklyProgress: Math.round(studyTimeThisWeek / 60), // Convert to hours
      studyTime: {
        today: Math.round(studyTimeToday / 60),
        thisWeek: Math.round(studyTimeThisWeek / 60),
        thisMonth: Math.round(studyTimeThisMonth / 60)
      }
    });
  };

  const calculateLearningStreak = (sessions: LearningSession[]): number => {
    if (sessions.length === 0) return 0;

    const today = new Date();
    const sessionDates = sessions
      .map(s => new Date(s.date).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort descending

    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < sessionDates.length; i++) {
      const sessionDate = new Date(sessionDates[i]);
      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate = new Date(sessionDate);
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  };

  const generateSkillsFromCourses = (userCourses: any[], progressData: CourseProgress[]): string[] => {
    const skills: string[] = [];

    userCourses.forEach(course => {
      const progress = progressData.find(p => p.courseId === course.id);
      const progressPercentage = progress?.progress || 0;

      // Only add skills if user has made significant progress (>30%) or completed the course
      if (progressPercentage > 30) {
        if (course.title.toLowerCase().includes('react')) skills.push('React Development');
        if (course.title.toLowerCase().includes('javascript')) skills.push('JavaScript Programming');
        if (course.title.toLowerCase().includes('design')) skills.push('UI/UX Design');
        if (course.title.toLowerCase().includes('marketing')) skills.push('Digital Marketing');
        if (course.title.toLowerCase().includes('business')) skills.push('Business Strategy');
        if (course.title.toLowerCase().includes('python')) skills.push('Python Programming');
        if (course.title.toLowerCase().includes('data')) skills.push('Data Analysis');
        if (course.title.toLowerCase().includes('web')) skills.push('Web Development');
        if (course.title.toLowerCase().includes('mobile')) skills.push('Mobile Development');
        if (course.title.toLowerCase().includes('ai') || course.title.toLowerCase().includes('machine learning')) skills.push('Artificial Intelligence');
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  };

  const generateWeeklyActivity = (sessions: LearningSession[]): number[] => {
    const weekData = new Array(7).fill(0); // Sunday to Saturday
    const today = new Date();
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));

    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= weekStart) {
        const dayOfWeek = sessionDate.getDay();
        weekData[dayOfWeek] += Math.round(session.duration / 60); // Convert to hours
      }
    });

    return weekData;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not-started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!progressStats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading progress data...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            My Progress
          </h1>
          <p className="text-gray-600">Track your real learning journey and achievements</p>
        </div>
        
        {/* Time Frame Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Overall Progress</p>
              <p className="text-3xl font-bold">{progressStats.averageProgress}%</p>
              <p className="text-blue-100 text-sm mt-1">
                {progressStats.completedCourses}/{progressStats.totalCourses} courses completed
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Learning Time</p>
              <p className="text-3xl font-bold">{progressStats.completedHours}h</p>
              <p className="text-green-100 text-sm mt-1">
                of {progressStats.totalHours}h total
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Certificates</p>
              <p className="text-3xl font-bold">{progressStats.certificatesEarned}</p>
              <p className="text-purple-100 text-sm mt-1">
                earned so far
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Current Streak</p>
              <p className="text-3xl font-bold">{progressStats.currentStreak}</p>
              <p className="text-orange-100 text-sm mt-1">
                days learning
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Study Time Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Goal Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              Weekly Learning Goal
            </h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{progressStats.weeklyProgress}h</p>
              <p className="text-sm text-gray-500">of {progressStats.weeklyGoal}h goal</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress this week</span>
              <span>{Math.round((progressStats.weeklyProgress / progressStats.weeklyGoal) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${Math.min((progressStats.weeklyProgress / progressStats.weeklyGoal) * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {progressStats.weeklyProgress >= progressStats.weeklyGoal && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Congratulations! 🎉</p>
                <p className="text-sm text-green-700">You've reached your weekly learning goal!</p>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            This Week's Activity
          </h2>
          
          <div className="space-y-4">
            {dayNames.map((day, index) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-8 text-sm text-gray-600 font-medium">{day}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((weeklyActivity[index] / Math.max(...weeklyActivity, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="w-8 text-sm text-gray-900 font-medium text-right">
                  {weeklyActivity[index]}h
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Time Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Timer className="w-6 h-6 text-indigo-600" />
          Study Time Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{progressStats.studyTime.today}h</p>
            <p className="text-sm text-blue-700">Today</p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-green-600">{progressStats.studyTime.thisWeek}h</p>
            <p className="text-sm text-green-700">This Week</p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-100">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{progressStats.studyTime.thisMonth}h</p>
            <p className="text-sm text-purple-700">This Month</p>
          </div>
        </div>
      </div>

      {/* Skills & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Real Skills Learned */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Skills Learned ({progressStats.skillsLearned.length})
          </h2>
          
          {progressStats.skillsLearned.length > 0 ? (
            <div className="space-y-3">
              {progressStats.skillsLearned.map((skill, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-purple-900">{skill}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Complete courses to unlock skills</p>
              <p className="text-sm text-gray-400 mt-1">Skills are unlocked when you reach 30% progress</p>
            </div>
          )}
        </div>

        {/* Real Assignment Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-600" />
            Assignment Progress
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed Assignments</span>
              <span className="font-bold text-gray-900">
                {progressStats.completedAssignments}/{progressStats.totalAssignments}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progressStats.totalAssignments > 0 ? (progressStats.completedAssignments / progressStats.totalAssignments) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{progressStats.completedAssignments}</p>
                <p className="text-sm text-green-700">Completed</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {progressStats.totalAssignments - progressStats.completedAssignments}
                </p>
                <p className="text-sm text-yellow-700">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Course Progress Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Course Progress Details
        </h2>
        
        {courseProgress.length > 0 ? (
          <div className="space-y-4">
            {courseProgress.map((course) => (
              <div key={course.courseId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <img
                    src={course.thumbnail}
                    alt={course.courseName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{course.courseName}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(course.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(course.status)}`}>
                          {course.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{Math.round(course.timeSpent / 60)}h</p>
                        <p className="text-xs text-gray-500">Time Spent</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {course.lessonsCompleted}/{course.totalLessons}
                        </p>
                        <p className="text-xs text-gray-500">Lessons</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {course.assignments.completed}/{course.assignments.total}
                        </p>
                        <p className="text-xs text-gray-500">Assignments</p>
                      </div>
                      
                      <div className="text-center">
                        {course.certificateEarned ? (
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <Award className="w-4 h-4" />
                            <span className="text-sm font-medium">Earned</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not earned</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
            <p className="text-gray-600">Enroll in courses to start tracking your progress</p>
          </div>
        )}
      </div>

      {/* Motivational Section - Only show if user has real progress */}
      {progressStats.totalCourses > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-8 text-white">
          <div className="text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl font-bold mb-2">Keep Up the Great Work! 🚀</h2>
            <p className="text-lg opacity-90 mb-4">
              You're making real progress on your learning journey
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-300">{progressStats.currentStreak}</p>
                <p className="text-sm opacity-80">Day Learning Streak</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-300">{progressStats.completedHours}</p>
                <p className="text-sm opacity-80">Hours Learned</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-300">{progressStats.skillsLearned.length}</p>
                <p className="text-sm opacity-80">Skills Acquired</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-300">{progressStats.certificatesEarned}</p>
                <p className="text-sm opacity-80">Certificates Earned</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}