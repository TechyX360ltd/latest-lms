import React, { useState } from 'react';
import { Save, Calendar, FileText, Plus, X } from 'lucide-react';
import { Assignment } from '../../types';

interface AssignmentCreatorProps {
  courseId: string;
  moduleId?: string;
  onSave: (assignment: Assignment) => void;
  onCancel: () => void;
}

export function AssignmentCreator({ courseId, moduleId, onSave, onCancel }: AssignmentCreatorProps) {
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxPoints: 100,
    isRequired: true,
    maxFileSize: 10, // MB
    allowedFileTypes: ['image/*', 'video/*', '.pdf', '.doc', '.docx']
  });

  const [customFileType, setCustomFileType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const commonFileTypes = [
    { value: 'image/*', label: 'Images (JPG, PNG, GIF)' },
    { value: 'video/*', label: 'Videos (MP4, AVI, MOV)' },
    { value: '.pdf', label: 'PDF Documents' },
    { value: '.doc', label: 'Word Documents (.doc)' },
    { value: '.docx', label: 'Word Documents (.docx)' },
    { value: '.ppt', label: 'PowerPoint (.ppt)' },
    { value: '.pptx', label: 'PowerPoint (.pptx)' },
    { value: '.txt', label: 'Text Files' },
    { value: '.zip', label: 'ZIP Archives' },
    { value: '.rar', label: 'RAR Archives' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!assignmentData.title.trim()) {
      newErrors.title = 'Assignment title is required';
    }

    if (!assignmentData.description.trim()) {
      newErrors.description = 'Assignment description is required';
    }

    if (!assignmentData.instructions.trim()) {
      newErrors.instructions = 'Assignment instructions are required';
    }

    if (!assignmentData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(assignmentData.dueDate) <= new Date()) {
      newErrors.dueDate = 'Due date must be in the future';
    }

    if (assignmentData.maxPoints <= 0) {
      newErrors.maxPoints = 'Maximum points must be greater than 0';
    }

    if (assignmentData.maxFileSize <= 0) {
      newErrors.maxFileSize = 'Maximum file size must be greater than 0';
    }

    if (assignmentData.allowedFileTypes.length === 0) {
      newErrors.allowedFileTypes = 'At least one file type must be allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileTypeToggle = (fileType: string) => {
    setAssignmentData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const addCustomFileType = () => {
    if (customFileType.trim() && !assignmentData.allowedFileTypes.includes(customFileType.trim())) {
      setAssignmentData(prev => ({
        ...prev,
        allowedFileTypes: [...prev.allowedFileTypes, customFileType.trim()]
      }));
      setCustomFileType('');
    }
  };

  const removeFileType = (fileType: string) => {
    setAssignmentData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.filter(type => type !== fileType)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const assignment: Assignment = {
        ...assignmentData,
        id: Date.now().toString(),
        courseId,
        moduleId,
        createdAt: new Date().toISOString()
      };

      await onSave(assignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Assignment</h1>
          <p className="text-gray-600">Create a new assignment for students to complete</p>
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
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Assignment Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                value={assignmentData.title}
                onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter assignment title"
                required
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="datetime-local"
                  value={assignmentData.dueDate}
                  onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dueDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.dueDate && <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Points *
              </label>
              <input
                type="number"
                value={assignmentData.maxPoints}
                onChange={(e) => setAssignmentData({...assignmentData, maxPoints: Number(e.target.value)})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maxPoints ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1"
                required
              />
              {errors.maxPoints && <p className="text-red-600 text-sm mt-1">{errors.maxPoints}</p>}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={assignmentData.description}
                onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Brief description of the assignment"
                required
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                value={assignmentData.instructions}
                onChange={(e) => setAssignmentData({...assignmentData, instructions: e.target.value})}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.instructions ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Detailed instructions for completing the assignment..."
                required
              />
              {errors.instructions && <p className="text-red-600 text-sm mt-1">{errors.instructions}</p>}
            </div>
          </div>
        </div>

        {/* File Upload Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">File Upload Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Size (MB) *
              </label>
              <input
                type="number"
                value={assignmentData.maxFileSize}
                onChange={(e) => setAssignmentData({...assignmentData, maxFileSize: Number(e.target.value)})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maxFileSize ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1"
                max="100"
                required
              />
              {errors.maxFileSize && <p className="text-red-600 text-sm mt-1">{errors.maxFileSize}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allowed File Types *
              </label>
              
              {/* Common File Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {commonFileTypes.map((fileType) => (
                  <label key={fileType.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignmentData.allowedFileTypes.includes(fileType.value)}
                      onChange={() => handleFileTypeToggle(fileType.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{fileType.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom File Type */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFileType}
                  onChange={(e) => setCustomFileType(e.target.value)}
                  placeholder="Add custom file type (e.g., .xlsx)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addCustomFileType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Selected File Types */}
              {assignmentData.allowedFileTypes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected file types:</p>
                  <div className="flex flex-wrap gap-2">
                    {assignmentData.allowedFileTypes.map((fileType) => (
                      <span
                        key={fileType}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {fileType}
                        <button
                          type="button"
                          onClick={() => removeFileType(fileType)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {errors.allowedFileTypes && <p className="text-red-600 text-sm mt-1">{errors.allowedFileTypes}</p>}
            </div>
          </div>
        </div>

        {/* Assignment Options */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Assignment Options</h2>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRequired"
              checked={assignmentData.isRequired}
              onChange={(e) => setAssignmentData({...assignmentData, isRequired: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
              This assignment is required for course completion
            </label>
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
            {isLoading ? 'Creating Assignment...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}