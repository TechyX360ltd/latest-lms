import React, { useState, useEffect, useRef } from 'react';
import { Award, Download, Eye, Palette, Settings, X, Save, Share, Send, User, Search, CheckCircle, Mail } from 'lucide-react';
import { useUsers } from '../../hooks/useData';

interface CertificatePreviewProps {
  onClose: () => void;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
}

interface ShareData {
  selectedUsers: string[];
  message: string;
  includeInstructions: boolean;
}

export function CertificatePreview({ onClose }: CertificatePreviewProps) {
  const { users } = useUsers();
  const [selectedTemplate, setSelectedTemplate] = useState<'default' | 'modern' | 'elegant'>('default');
  const [previewData, setPreviewData] = useState({
    studentName: 'John Doe',
    courseName: 'Introduction to React Development',
    instructor: 'Sarah Johnson',
    completionDate: new Date().toLocaleDateString(),
    courseHours: '40',
    grade: 'A+'
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    selectedUsers: [],
    message: 'Congratulations! Your certificate is ready for download.',
    includeInstructions: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Refs for click outside detection
  const modalRef = useRef<HTMLDivElement>(null);
  const shareModalRef = useRef<HTMLDivElement>(null);

  const templates: Record<string, CertificateTemplate> = {
    default: {
      id: 'default',
      name: 'Default Template',
      description: 'Classic blue and white design with traditional layout',
      colors: {
        primary: 'from-blue-600 to-indigo-600',
        secondary: 'from-blue-50 to-indigo-100',
        accent: 'text-blue-900',
        border: 'border-blue-200'
      }
    },
    modern: {
      id: 'modern',
      name: 'Modern Template',
      description: 'Sleek contemporary design with gradient backgrounds',
      colors: {
        primary: 'from-purple-600 to-pink-600',
        secondary: 'from-purple-50 to-pink-50',
        accent: 'text-purple-900',
        border: 'border-purple-200'
      }
    },
    elegant: {
      id: 'elegant',
      name: 'Elegant Template',
      description: 'Sophisticated design with gold accents and premium feel',
      colors: {
        primary: 'from-yellow-600 to-orange-600',
        secondary: 'from-yellow-50 to-orange-50',
        accent: 'text-yellow-900',
        border: 'border-yellow-200'
      }
    }
  };

  const currentTemplate = templates[selectedTemplate];

  // Handle click outside to close modals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareModal && shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        setShowShareModal(false);
      } else if (!showShareModal && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareModal, onClose]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showShareModal) {
          setShowShareModal(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showShareModal, onClose]);

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    
    try {
      // Simulate saving template settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save template configuration to localStorage
      const templateConfig = {
        selectedTemplate,
        previewData,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('certificateTemplate', JSON.stringify(templateConfig));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPreview = (format: 'pdf' | 'png') => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `certificate-preview-${selectedTemplate}.${format}`;
    link.click();
    alert(`Certificate preview downloaded as ${format.toUpperCase()}!`);
  };

  const handleUserToggle = (userId: string) => {
    setShareData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const handleShareCertificate = async () => {
    if (shareData.selectedUsers.length === 0) {
      alert('Please select at least one user to share the certificate with.');
      return;
    }

    setIsSharing(true);

    try {
      // Simulate sharing process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create notification for each selected user
      const notifications = shareData.selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId);
        return {
          id: `cert-share-${Date.now()}-${userId}`,
          title: 'Certificate Template Shared',
          message: shareData.message,
          type: 'info' as const,
          priority: 'medium' as const,
          senderId: 'admin',
          senderName: 'Administrator',
          recipients: [{
            userId,
            userName: user?.name || 'Unknown User',
            isRead: false
          }],
          createdAt: new Date().toISOString(),
          attachments: [{
            id: `cert-template-${Date.now()}`,
            name: `${currentTemplate.name}-Certificate-Template.pdf`,
            type: 'application/pdf',
            size: 1024 * 500, // 500KB
            url: '#'
          }]
        };
      });

      // Save notifications to localStorage
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      localStorage.setItem('notifications', JSON.stringify([...existingNotifications, ...notifications]));

      setShareSuccess(true);
      setShowShareModal(false);
      
      // Reset share data
      setShareData({
        selectedUsers: [],
        message: 'Congratulations! Your certificate is ready for download.',
        includeInstructions: true
      });
      
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error('Error sharing certificate:', error);
      alert('Failed to share certificate. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Filter users for sharing (only learners)
  const filteredUsers = users
    .filter(user => user.role === 'learner')
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                Certificate Template Manager
              </h2>
              <p className="text-gray-600 mt-1">Design, preview, save, and share certificate templates</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Success Messages */}
              {saveSuccess && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Template saved!</span>
                </div>
              )}
              {shareSuccess && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Certificate shared!</span>
                </div>
              )}
              
              {/* Action Buttons */}
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
              
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Share className="w-4 h-4" />
                Share Certificate
              </button>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Enhanced Sidebar */}
          <div className="w-80 border-r border-gray-200 p-6 space-y-6 bg-gray-50">
            {/* Template Selection */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Templates
              </h3>
              <div className="space-y-3">
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key as any)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    {selectedTemplate === key && (
                      <div className="mt-2 flex items-center gap-1 text-blue-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Data Customization */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preview Data
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={previewData.studentName}
                    onChange={(e) => setPreviewData({...previewData, studentName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={previewData.courseName}
                    onChange={(e) => setPreviewData({...previewData, courseName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={previewData.instructor}
                    onChange={(e) => setPreviewData({...previewData, instructor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Hours
                  </label>
                  <input
                    type="text"
                    value={previewData.courseHours}
                    onChange={(e) => setPreviewData({...previewData, courseHours: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={previewData.grade}
                    onChange={(e) => setPreviewData({...previewData, grade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Download Preview</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleDownloadPreview('pdf')}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleDownloadPreview('png')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Main Preview Area */}
          <div className="flex-1 p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {currentTemplate.name} Preview
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </div>
              </div>

              {/* Enhanced Certificate Preview */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-gray-200 transform hover:scale-105 transition-transform duration-300">
                {/* Certificate Content */}
                <div className={`bg-gradient-to-br ${currentTemplate.colors.secondary} border-8 ${currentTemplate.colors.border} p-12 text-center relative`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-4 border-current opacity-20 rounded-full"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-4 border-current opacity-20 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-current opacity-20 transform rotate-45"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-4 border-current opacity-20 transform rotate-45"></div>

                  {/* Header */}
                  <div className="mb-8">
                    <img 
                      src="/BLACK-1-removebg-preview.png" 
                      alt="TECHYX 360" 
                      className="h-16 w-auto mx-auto mb-6"
                    />
                    <div className={`inline-block bg-gradient-to-r ${currentTemplate.colors.primary} text-white px-8 py-3 rounded-full shadow-lg`}>
                      <h1 className="text-2xl font-bold">Certificate of Completion</h1>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="mb-8 space-y-6">
                    <p className="text-lg text-gray-700">This is to certify that</p>
                    
                    <div className={`bg-gradient-to-r ${currentTemplate.colors.primary} bg-clip-text text-transparent`}>
                      <h2 className="text-4xl font-bold mb-2">{previewData.studentName}</h2>
                    </div>
                    
                    <p className="text-lg text-gray-700">has successfully completed the course</p>
                    
                    <div className="bg-white bg-opacity-80 rounded-lg p-6 shadow-inner">
                      <h3 className={`text-2xl font-bold ${currentTemplate.colors.accent} mb-2`}>
                        {previewData.courseName}
                      </h3>
                      <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Duration:</span> {previewData.courseHours} hours
                        </div>
                        <div>
                          <span className="font-medium">Grade:</span> {previewData.grade}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <div className="border-t-2 border-gray-400 pt-2 mb-2 w-48">
                        <p className="font-semibold text-gray-900">{previewData.instructor}</p>
                        <p className="text-sm text-gray-600">Course Instructor</p>
                      </div>
                    </div>
                    
                    <div className={`text-center bg-gradient-to-r ${currentTemplate.colors.primary} text-white p-4 rounded-lg shadow-lg`}>
                      <Award className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs font-medium">TECHYX 360</p>
                      <p className="text-xs">Learning Platform</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="border-t-2 border-gray-400 pt-2 mb-2 w-48">
                        <p className="font-semibold text-gray-900">{previewData.completionDate}</p>
                        <p className="text-sm text-gray-600">Date of Completion</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate ID */}
                  <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                      Certificate ID: TECHYX-{selectedTemplate.toUpperCase()}-{Date.now().toString().slice(-6)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Template Features */}
              <div className="mt-6 bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Template Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Design:</span> {currentTemplate.description}
                  </div>
                  <div>
                    <span className="font-medium">Format:</span> A4 Landscape (297 × 210 mm)
                  </div>
                  <div>
                    <span className="font-medium">Resolution:</span> 300 DPI (Print Ready)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Certificate Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div ref={shareModalRef} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Share className="w-5 h-5 text-blue-600" />
                  Share Certificate Template
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Search Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Learners to Share With
                </label>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search learners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* User Selection */}
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shareData.selectedUsers.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No learners found</p>
                    </div>
                  )}
                </div>

                {shareData.selectedUsers.length > 0 && (
                  <div className="mt-3 text-sm text-blue-600">
                    {shareData.selectedUsers.length} learner(s) selected
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Learners
                </label>
                <textarea
                  value={shareData.message}
                  onChange={(e) => setShareData({...shareData, message: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a message to include with the certificate..."
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeInstructions"
                    checked={shareData.includeInstructions}
                    onChange={(e) => setShareData({...shareData, includeInstructions: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="includeInstructions" className="text-sm text-gray-700">
                    Include download instructions
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Preview:</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Template:</strong> {currentTemplate.name}</p>
                  <p><strong>Message:</strong> {shareData.message}</p>
                  <p><strong>Recipients:</strong> {shareData.selectedUsers.length} learner(s)</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShareCertificate}
                disabled={isSharing || shareData.selectedUsers.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSharing ? 'Sharing...' : 'Share Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}