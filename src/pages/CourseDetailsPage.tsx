import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { Sidebar } from '../components/Layout/Sidebar';
import CourseDetailsMain from '../components/Learner/CourseDetailsMain';

export default function CourseDetailsPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-0 lg:p-0 overflow-auto w-full">
          <CourseDetailsMain courseSlug={courseSlug} />
        </main>
      </div>
    </div>
  );
} 