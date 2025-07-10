import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image, 
  Video, 
  File, 
  X, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';
import { Assignment, AssignmentSubmission, SubmissionFile } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AssignmentSubmissionProps {
  assignment: Assignment;
  onBack: () => void;
  onSubmit: (submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) => void;
}

export function AssignmentSubmissionComponent({ assignment, onBack, onSubmit }: AssignmentSubmissionProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [textSubmission, setTextSubmission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Check if assignment is overdue
  const isOverdue = new Date() > new Date(assignment.dueDate);
  const timeUntilDue = new Date(assignment.dueDate).getTime() - new Date().getTime();
  const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > assignment.maxFileSize * 1024 * 1024) {
      return `File "${file.name}" exceeds maximum size of ${assignment.maxFileSize}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    const isAllowedType = assignment.allowedFileTypes.some(allowedType => 
      allowedType === fileExtension || 
      allowedType === mimeType ||
      (allowedType === 'image/*' && mimeType.startsWith('image/')) ||
      (allowedType === 'video/*' && mimeType.startsWith('video/')) ||
      (allowedType === 'document/*' && (mimeType.includes('pdf') || mimeType.includes('document')))
    );

    if (!isAllowedType) {
      return `File type "${fileExtension}" is not allowed. Allowed types: ${assignment.allowedFileTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    Array.from(selectedFiles).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0 && !textSubmission.trim()) {
      setErrors(['Please provide either file uploads or text submission']);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate file upload and create submission files
      const submissionFiles: SubmissionFile[] = files.map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // In real app, this would be the uploaded file URL
        uploadedAt: new Date().toISOString()
      }));

      const submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'> = {
        assignmentId: assignment.id,
        userId: user!.id,
        courseId: assignment.courseId,
        files: submissionFiles,
        textSubmission: textSubmission.trim() || undefined,
        status: isOverdue ? 'late' : 'submitted'
      };

      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSubmit(submission);
    } catch (error) {
      setErrors(['Failed to submit assignment. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course
        </button>
      </div>

      {/* Assignment Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-600">{assignment.description}</p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOverdue 
                ? 'bg-red-100 text-red-800' 
                : daysUntilDue <= 1 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              {isOverdue ? 'Overdue' : daysUntilDue <= 1 ? 'Due Soon' : 'On Time'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Points: {assignment.maxPoints}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>{assignment.isRequired ? 'Required' : 'Optional'}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <div 
            className="text-blue-800 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: assignment.instructions.replace(/\n/g, '<br>') }}
          />
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Assignment</h2>

        {/* File Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            File Uploads
          </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Allowed types: {assignment.allowedFileTypes.join(', ')} | Max size: {assignment.maxFileSize}MB per file
            </p>
            <input
              type="file"
              multiple
              accept={assignment.allowedFileTypes.join(',')}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-block"
            >
              Choose Files
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text Submission */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Text Submission (Optional)
          </label>
          <textarea
            value={textSubmission}
            onChange={(e) => setTextSubmission(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your text submission here..."
          />
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                This assignment is overdue. Late submissions may receive reduced points.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (files.length === 0 && !textSubmission.trim())}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Submission Guidelines */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Submission Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-semibold mb-2">File Requirements:</h4>
            <ul className="space-y-1">
              <li>• Maximum file size: {assignment.maxFileSize}MB per file</li>
              <li>• Allowed formats: {assignment.allowedFileTypes.join(', ')}</li>
              <li>• Multiple files can be uploaded</li>
              <li>• Files should be clearly named</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Submission Tips:</h4>
            <ul className="space-y-1">
              <li>• Review your work before submitting</li>
              <li>• Include text explanation if needed</li>
              <li>• Submit before the due date</li>
              <li>• Contact instructor if you have issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}