import React from 'react';
import { Profile } from '../Learner/Profile';

export default function InstructorProfile() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Profile />
        </main>
      </div>
    </div>
  );
} 