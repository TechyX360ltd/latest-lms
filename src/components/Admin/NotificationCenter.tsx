import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Users, 
  User, 
  Bell, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  Paperclip,
  Upload,
  Wifi
} from 'lucide-react';
import { Notification, NotificationRecipient, User as UserType, Course } from '../../types';
import { useUsers, useCourses, useNotifications } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';

export function NotificationCenter() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { courses } = useCourses();
  const { notifications, addNotification, markAsRead, markAsStarred } = useNotifications();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRealTimeActive(prev => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCreateNotification = (notificationData: Omit<Notification, 'id' | 'createdAt' | 'senderId' | 'senderName'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      senderId: user!.id,
      senderName: user!.firstName + ' ' + user!.lastName,
      createdAt: new Date().toISOString(),
    };

    addNotification(newNotification);
    setShowCreateModal(false);
  };

  const handleDeleteNotification = (notificationId: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      console.log('Delete notification:', notificationId);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'announcement':
        return <Bell className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'announcement':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Notification Center
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
              <span className="text-sm text-gray-500 font-normal">Live</span>
            </div>
          </h1>
          <p className="text-gray-600">Send messages and announcements to users</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          Create Notification
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div key={notification.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{notification.recipients.length} recipients</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>{notification.recipients.filter(r => r.isRead).length} read</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedNotification(notification)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recipients Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Recipients:</h4>
                <div className="flex flex-wrap gap-2">
                  {notification.recipients.slice(0, 5).map((recipient) => (
                    <span
                      key={recipient.userId}
                      className={`px-2 py-1 rounded-full text-xs ${
                        recipient.isRead 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {recipient.userName}
                    </span>
                  ))}
                  {notification.recipients.length > 5 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      +{notification.recipients.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-600">Create your first notification to get started</p>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          users={users}
          courses={courses}
          onSave={handleCreateNotification}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Notification Details Modal */}
      {selectedNotification && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </div>
  );
}

// Create Notification Modal Component
function CreateNotificationModal({ 
  users, 
  courses, 
  onSave, 
  onCancel 
}: {
  users: UserType[];
  courses: any[];
  onSave: (data: Omit<Notification, 'id' | 'createdAt' | 'senderId' | 'senderName'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    recipientType: 'specific' as 'specific' | 'course' | 'all',
    selectedUsers: [] as string[],
    selectedCourse: '',
    scheduledFor: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (formData.recipientType === 'specific' && formData.selectedUsers.length === 0) {
      newErrors.recipients = 'Please select at least one recipient';
    }

    if (formData.recipientType === 'course' && !formData.selectedCourse) {
      newErrors.course = 'Please select a course';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    let recipients: NotificationRecipient[] = [];

    if (formData.recipientType === 'all') {
      recipients = users.filter(u => u.role === 'learner').map(u => ({
        userId: u.id,
        userName: u.firstName + ' ' + u.lastName,
        isRead: false
      }));
    } else if (formData.recipientType === 'course') {
      const course = courses.find(c => c.id === formData.selectedCourse);
      if (course) {
        recipients = users
          .filter(u => u.enrolledCourses.includes(course.id))
          .map(u => ({
            userId: u.id,
            userName: u.firstName + ' ' + u.lastName,
            isRead: false
          }));
      }
    } else {
      recipients = formData.selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId);
        return {
          userId,
          userName: user ? user.firstName + ' ' + user.lastName : 'Unknown User',
          isRead: false
        };
      });
    }

    const notificationData = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: formData.priority,
      recipients,
      courseId: formData.recipientType === 'course' ? formData.selectedCourse : undefined,
      scheduledFor: formData.scheduledFor || undefined,
      attachments: attachments.map((file, index) => ({
        id: `attachment-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      }))
    };

    onSave(notificationData);
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const handleFileUpload = (files: FileList) => {
    setAttachments(prev => [...prev, ...Array.from(files)]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Filtered users for recipient selection
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const search = userSearch.toLowerCase();
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesSearch =
      !search ||
      fullName.includes(search) ||
      email.includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Notification title"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule For (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.message ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your message..."
            />
            {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Recipients *
            </label>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="specific"
                    checked={formData.recipientType === 'specific'}
                    onChange={(e) => setFormData({...formData, recipientType: e.target.value as any})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Specific Users</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="course"
                    checked={formData.recipientType === 'course'}
                    onChange={(e) => setFormData({...formData, recipientType: e.target.value as any})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Course Students</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="all"
                    checked={formData.recipientType === 'all'}
                    onChange={(e) => setFormData({...formData, recipientType: e.target.value as any})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">All Learners</span>
                </label>
              </div>

              {formData.recipientType === 'specific' && (
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <select
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="all">All Roles</option>
                      <option value="learner">Learner</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                        <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                    />
                          </div>
                  <label className="block text-gray-700 font-medium mb-1">Select User(s)</label>
                  {/* Selected users as chips */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {filteredUsers.filter(u => formData.selectedUsers.includes(u.id)).map(user => (
                      <span key={user.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                        {user.firstName} {user.lastName}
                        <button
                          type="button"
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          onClick={() => setFormData({
                            ...formData,
                            selectedUsers: formData.selectedUsers.filter(id => id !== user.id)
                          })}
                          aria-label="Remove user"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Custom dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      type="button"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={() => setUserDropdownOpen(v => !v)}
                    >
                      {formData.selectedUsers.length === 0 ? 'Click to select users...' : `${formData.selectedUsers.length} user(s) selected`}
                    </button>
                    {userDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.length === 0 && (
                          <div className="p-4 text-gray-500 text-sm text-center">No users found</div>
                        )}
                        {filteredUsers.map(user => {
                          const checked = formData.selectedUsers.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-50 ${checked ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  selectedUsers: checked
                                    ? formData.selectedUsers.filter(id => id !== user.id)
                                    : [...formData.selectedUsers, user.id]
                                });
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="accent-blue-600"
                                onClick={e => e.stopPropagation()}
                              />
                              <span>{user.firstName} {user.lastName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {errors.recipients && <p className="text-red-500 text-sm mt-1">{errors.recipients}</p>}
                </div>
              )}

              {formData.recipientType === 'course' && (
                <select
                  value={formData.selectedCourse}
                  onChange={(e) => setFormData({...formData, selectedCourse: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.course ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.enrolledCount} students)
                    </option>
                  ))}
                </select>
              )}

              {errors.recipients && <p className="text-red-600 text-sm">{errors.recipients}</p>}
              {errors.course && <p className="text-red-600 text-sm">{errors.course}</p>}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Drop files here or click to browse</p>
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="attachment-upload"
              />
              <label
                htmlFor="attachment-upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Choose Files
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Notification Details Modal Component
function NotificationDetailsModal({ 
  notification, 
  onClose 
}: {
  notification: Notification;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Notification Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{notification.title}</h3>
            <p className="text-gray-600">{notification.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 capitalize">{notification.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Priority:</span>
              <span className="ml-2 capitalize">{notification.priority}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sent by:</span>
              <span className="ml-2">{notification.senderName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2">{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recipients ({notification.recipients.length})</h4>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {notification.recipients.map((recipient) => (
                <div key={recipient.userId} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-900">{recipient.userName}</span>
                  <div className="flex items-center gap-2">
                    {recipient.isRead ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Read {recipient.readAt && `on ${new Date(recipient.readAt).toLocaleDateString()}`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notification.attachments && notification.attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
              <div className="space-y-2">
                {notification.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{attachment.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}