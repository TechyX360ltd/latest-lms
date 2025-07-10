import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Reply,
  Paperclip,
  Download,
  X,
  Send,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  User,
  Archive,
  Star,
  StarOff,
  Wifi
} from 'lucide-react';
import { Notification, NotificationReply } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useData';

export function LearnerNotificationCenter() {
  const { user } = useAuth();
  const { notifications, markAsRead, addReply, markAsStarred } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);

  // Get notifications for current user
  const userNotifications = notifications.filter(notification =>
    notification.recipients.some(recipient => recipient.userId === user?.id)
  );

  // Simulate real-time status (in a real app, this would come from the subscription status)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRealTimeActive(prev => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'announcement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const isNotificationRead = (notification: Notification) => {
    const recipient = notification.recipients.find(r => r.userId === user?.id);
    return recipient?.isRead || false;
  };

  const isNotificationStarred = (notification: Notification) => {
    const recipient = notification.recipients.find(r => r.userId === user?.id);
    return recipient?.isStarred || false;
  };

  const handleMarkAsRead = (notification: Notification) => {
    if (!isNotificationRead(notification)) {
      markAsRead(notification.id, user!.id);
    }
  };

  const handleToggleStar = (notification: Notification) => {
    markAsStarred(notification.id, user!.id, !isNotificationStarred(notification));
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    handleMarkAsRead(notification);
  };

  const handleReply = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowReplyModal(true);
    handleMarkAsRead(notification);
  };

  const handleSendReply = () => {
    if (!selectedNotification || !replyText.trim()) return;

    const reply: NotificationReply = {
      id: Date.now().toString(),
      notificationId: selectedNotification.id,
      userId: user!.id,
      userName: user!.name,
      message: replyText,
      attachments: replyAttachments.map((file, index) => ({
        id: `reply-attachment-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      })),
      createdAt: new Date().toISOString()
    };

    addReply(reply);
    setReplyText('');
    setReplyAttachments([]);
    setShowReplyModal(false);
    alert('Reply sent successfully!');
  };

  const handleFileUpload = (files: FileList) => {
    setReplyAttachments(prev => [...prev, ...Array.from(files)]);
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const filteredNotifications = userNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    let matchesStatus = true;
    if (filterStatus === 'read') {
      matchesStatus = isNotificationRead(notification);
    } else if (filterStatus === 'unread') {
      matchesStatus = !isNotificationRead(notification);
    } else if (filterStatus === 'starred') {
      matchesStatus = isNotificationStarred(notification);
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = userNotifications.filter(n => !isNotificationRead(n)).length;
  const starredCount = userNotifications.filter(n => isNotificationStarred(n)).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="relative">
              <Bell className="w-8 h-8 text-blue-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            Notifications
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
              <span className="text-sm text-gray-500 font-normal">Live</span>
            </div>
          </h1>
          <p className="text-gray-600">Stay updated with important messages and announcements</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{userNotifications.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            <p className="text-sm text-gray-500">Unread</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{starredCount}</p>
            <p className="text-sm text-gray-500">Starred</p>
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
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
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
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="starred">Starred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const isRead = isNotificationRead(notification);
          const isStarred = isNotificationStarred(notification);
          const recipient = notification.recipients.find(r => r.userId === user?.id);
          
          return (
            <div 
              key={notification.id} 
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
                !isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${!isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </div>
                        {!isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>From: {notification.senderName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                        </div>
                        {isRead && recipient?.readAt && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Eye className="w-4 h-4" />
                            <span>Read {new Date(recipient.readAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleStar(notification)}
                      className={`p-2 rounded transition-colors ${
                        isStarred 
                          ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50' 
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={isStarred ? 'Remove from starred' : 'Add to starred'}
                    >
                      {isStarred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleViewNotification(notification)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReply(notification)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Attachments Preview */}
                {notification.attachments && notification.attachments.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments ({notification.attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {notification.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 text-sm"
                        >
                          <Paperclip className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">{attachment.name}</span>
                          <button
                            onClick={() => window.open(attachment.url, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleViewNotification(notification)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleReply(notification)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                  {!isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification)}
                      className="flex items-center gap-2 px-4 py-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-600">
            {userNotifications.length === 0 
              ? 'You have no notifications yet'
              : 'Try adjusting your search criteria'
            }
          </p>
        </div>
      )}

      {/* Notification Details Modal */}
      {selectedNotification && !showReplyModal && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onReply={() => setShowReplyModal(true)}
        />
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedNotification && (
        <ReplyModal
          notification={selectedNotification}
          replyText={replyText}
          setReplyText={setReplyText}
          replyAttachments={replyAttachments}
          onFileUpload={handleFileUpload}
          onRemoveAttachment={removeAttachment}
          onSend={handleSendReply}
          onCancel={() => {
            setShowReplyModal(false);
            setReplyText('');
            setReplyAttachments([]);
          }}
        />
      )}
    </div>
  );
}

// Notification Details Modal Component
function NotificationDetailsModal({ 
  notification, 
  onClose, 
  onReply 
}: {
  notification: Notification;
  onClose: () => void;
  onReply: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">From: {notification.senderName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{notification.message}</p>
          </div>

          {notification.attachments && notification.attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
              <div className="space-y-2">
                {notification.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{attachment.name}</span>
                      <span className="text-xs text-gray-500">({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replies Section */}
          {notification.replies && notification.replies.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Replies ({notification.replies.length})</h4>
              <div className="space-y-4">
                {notification.replies.map((reply) => (
                  <div key={reply.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">{reply.userName}</span>
                      <span className="text-sm text-blue-600">{new Date(reply.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-blue-800 mb-2">{reply.message}</p>
                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reply.attachments.map((attachment) => (
                          <span key={attachment.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {attachment.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onReply}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reply Modal Component
function ReplyModal({
  notification,
  replyText,
  setReplyText,
  replyAttachments,
  onFileUpload,
  onRemoveAttachment,
  onSend,
  onCancel
}: {
  notification: Notification;
  replyText: string;
  setReplyText: (text: string) => void;
  replyAttachments: File[];
  onFileUpload: (files: FileList) => void;
  onRemoveAttachment: (index: number) => void;
  onSend: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Reply to: {notification.title}</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your reply here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && onFileUpload(e.target.files)}
                className="hidden"
                id="reply-file-upload"
              />
              <label
                htmlFor="reply-file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Paperclip className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Click to attach files</span>
              </label>
            </div>

            {replyAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {replyAttachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => onRemoveAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={!replyText.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}