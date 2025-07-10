import React, { useState, useEffect } from 'react';
import { useRatings } from '../../hooks/useRatings';
import { useToast } from '../Auth/ToastContext';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';

export function RatingTest() {
  const [courseId, setCourseId] = useState('test-course-1');
  const [instructorId, setInstructorId] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const { 
    canRateCourse, 
    canRateInstructor, 
    markCourseCompleted,
    createCourseRating,
    createInstructorRating,
    fetchCourseRatingStats,
    fetchInstructorRatingStats
  } = useRatings();
  const { showToast } = useToast();

  const addTestResult = (test: string, result: boolean, message: string) => {
    setTestResults(prev => [...prev, { test, result, message, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    try {
      // Test 1: Check if can rate course
      const canRate = await canRateCourse(courseId);
      addTestResult('Can Rate Course', canRate, `User can${canRate ? '' : 'not'} rate course ${courseId}`);
      
      // Test 2: Mark course as completed
      const completionResult = await markCourseCompleted(courseId);
      addTestResult('Mark Course Completed', completionResult.success, completionResult.message);
      
      // Test 3: Create course rating
      const ratingData = {
        courseId,
        rating: 5,
        reviewTitle: 'Excellent Course!',
        reviewContent: 'This is a test review for the rating system.'
      };
      
      try {
        const rating = await createCourseRating(ratingData);
        addTestResult('Create Course Rating', true, `Rating created with ID: ${rating.id}`);
      } catch (error: any) {
        addTestResult('Create Course Rating', false, error.message);
      }
      
      // Test 4: Fetch course rating stats
      try {
        await fetchCourseRatingStats(courseId);
        addTestResult('Fetch Course Stats', true, 'Course rating stats fetched successfully');
      } catch (error: any) {
        addTestResult('Fetch Course Stats', false, error.message);
      }
      
      // Test 5: Instructor rating (if instructorId provided)
      if (instructorId) {
        const canRateInstructorResult = await canRateInstructor(instructorId, courseId);
        addTestResult('Can Rate Instructor', canRateInstructorResult, `User can${canRateInstructorResult ? '' : 'not'} rate instructor ${instructorId}`);
        
        if (canRateInstructorResult) {
          try {
            const instructorRating = await createInstructorRating({
              instructorId,
              courseId,
              rating: 4,
              reviewContent: 'Great instructor!',
              teachingQuality: 5,
              communication: 4,
              responsiveness: 4
            });
            addTestResult('Create Instructor Rating', true, `Instructor rating created with ID: ${instructorRating.id}`);
          } catch (error: any) {
            addTestResult('Create Instructor Rating', false, error.message);
          }
          
          try {
            await fetchInstructorRatingStats(instructorId);
            addTestResult('Fetch Instructor Stats', true, 'Instructor rating stats fetched successfully');
          } catch (error: any) {
            addTestResult('Fetch Instructor Stats', false, error.message);
          }
        }
      }
      
      showToast('Tests completed!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Test failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Rating System Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course ID
            </label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter course ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructor ID (Optional)
            </label>
            <input
              type="text"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter instructor ID"
            />
          </div>
        </div>
        
        <button
          onClick={runTests}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Run Tests
        </button>
      </div>
      
      {/* Test Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click "Run Tests" to start.</p>
        ) : (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {result.result ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{result.test}</div>
                  <div className="text-sm text-gray-600">{result.message}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enter a course ID to test course rating functionality</li>
          <li>• Optionally enter an instructor ID to test instructor rating functionality</li>
          <li>• The tests will check permissions, create ratings, and fetch statistics</li>
          <li>• Make sure you have the necessary database tables and functions set up</li>
        </ul>
      </div>
    </div>
  );
} 