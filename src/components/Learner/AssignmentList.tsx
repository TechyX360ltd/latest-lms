import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Upload,
  Search
} from 'lucide-react';
import { Assignment, AssignmentSubmission } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AssignmentListProps {
  courseId: string;
  onViewAssignment: (assignment: Assignment) => void;
  onSubmitAssignment: (assignment: Assignment) => void;
}

export function AssignmentList({ courseId, onViewAssignment, onSubmitAssignment }: AssignmentListProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load assignments and submissions from localStorage
    const loadData = () => {
      const storedAssignments = localStorage.getItem(`assignments-${courseId}`);
      const storedSubmissions = localStorage.getItem(`submissions-${user?.id}`);
      
      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }
      
      if (storedSubmissions) {
        const allSubmissions = JSON.parse(storedSubmissions);
        setSubmissions(allSubmissions.filter((s: AssignmentSubmission) => s.courseId === courseId));
      }
      
      setLoading(false);
    };

    setTimeout(loadData, 500);
  }, [courseId, user?.id]);

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions.find(s => s.assignmentId === assignment.id);
    const isOverdue = new Date() > new Date(assignment.dueDate);
    
    if (submission) {
      return submission.status;
    } else if (isOverdue) {
      return 'missing';
    } else {
      return 'pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'graded':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'graded':
        return 'Graded';
      case 'late':
        return 'Late Submission';
      case 'missing':
        return 'Missing';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'graded':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'missing':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getAssignmentStatus(assignment);
    return matchesSearch && status === filterStatus;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const timeUntilDue = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assignments</h2>
        <p className="text-gray-600">Complete your course assignments and track your progress</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="late">Late</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => {
          const status = getAssignmentStatus(assignment);
          const submission = submissions.find(s => s.assignmentId === assignment.id);
          const daysUntilDue = getDaysUntilDue(assignment.dueDate);
          const isOverdue = daysUntilDue < 0;

          return (
            <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </div>
                      {assignment.isRequired && (
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Required
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{assignment.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusIcon(status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {isOverdue 
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : daysUntilDue === 0 
                          ? 'Due today'
                          : `${daysUntilDue} days left`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{assignment.maxPoints} points</span>
                  </div>
                  {submission && submission.grade !== undefined && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Grade: {submission.grade}/{assignment.maxPoints}</span>
                    </div>
                  )}
                </div>

                {/* Submission Info */}
                {submission && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Your Submission</h4>
                      <span className="text-sm text-gray-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Files: {submission.files.length}</p>
                      {submission.textSubmission && (
                        <p className="mt-1">Text submission included</p>
                      )}
                      {submission.feedback && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="font-medium text-blue-900">Instructor Feedback:</p>
                          <p className="text-blue-800">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onViewAssignment(assignment)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  
                  {!submission && (
                    <button
                      onClick={() => onSubmitAssignment(assignment)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isOverdue
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {isOverdue ? 'Submit Late' : 'Submit Assignment'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {assignments.length === 0 
              ? 'No assignments have been created for this course yet'
              : 'Try adjusting your search criteria'
            }
          </p>
        </div>
      )}
    </div>
  );
}